# Day 78 -- LangChain.js: The Framework Landscape

> *"You built the car from parts. Now learn what it looks like when someone sells you the car pre-assembled. Appreciate the convenience. Notice what you lose."*

**Date:** Luni, 4 August 2025
**Hours:** 2h · Evening session
**Topic:** LangChain.js Overview + LCEL
**Phase:** Faza 3 -- Production · Week 12

---

## What You're Doing

Today you learn LangChain.js -- not from scratch, but through the lens of everything you have already built. Every LangChain concept maps to something you coded manually. ChatAnthropic is your Anthropic SDK wrapper. RetrievalQAChain is your RAG pipeline. AgentExecutor is your ReAct loop. The abstractions are recognizable once you know what they replace.

Your goal today is not to build anything. It is to understand the framework's mental model, learn its pipe syntax (LCEL), and form an honest opinion about when it helps versus when it hurts.

## The Work

### The Concept Map

Here is the translation table between your manual code and LangChain:

```
Your Manual Code                    LangChain.js Equivalent
──────────────────────────────      ───────────────────────────
Anthropic SDK client                ChatAnthropic
  anthropic.messages.create()         model.invoke(messages)

Message array construction          ChatPromptTemplate
  [{ role: 'system', ... },          ChatPromptTemplate.fromMessages([
    { role: 'user', ... }]             ['system', '...'], ['human', '{input}']
                                     ])

JSON.parse(response)                StructuredOutputParser / JsonOutputParser
  + manual validation                 model.withStructuredOutput(zodSchema)

RAG pipeline (embed→search→gen)     RetrievalChain / createRetrievalChain
  manual orchestration                 one function call

ReAct agent loop                    AgentExecutor
  while(!done) { think→act→observe }  automatic loop with tools

Tool definition                     DynamicStructuredTool / tool()
  { name, description, function }     tool(fn, { name, description, schema })

Vector store operations             SupabaseVectorStore / MemoryVectorStore
  manual embed + query                 vectorStore.similaritySearch(query)

Embedding calls                     VoyageEmbeddings / OpenAIEmbeddings
  fetch to embedding API               embeddings.embedQuery(text)

Text splitting                      RecursiveCharacterTextSplitter
  manual chunk logic                   splitter.splitText(document)
```

### Installing LangChain.js

```bash
npm install langchain @langchain/anthropic @langchain/core
```

### LCEL: The Pipe Syntax

LangChain Expression Language (LCEL) is the core pattern. Everything in LangChain is a "Runnable" -- an object with `.invoke()`, `.stream()`, and `.batch()` methods. Runnables can be chained with `.pipe()`:

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Create components
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a helpful assistant that speaks like a pirate.'],
  ['human', '{input}'],
]);

const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4-20250514',
  temperature: 0.7,
});

const parser = new StringOutputParser();

// Chain them with pipe
const chain = prompt.pipe(model).pipe(parser);

// Invoke the chain
const result = await chain.invoke({
  input: 'What is the meaning of life?',
});

console.log(result); // String output, pirate-style
```

Compare this to your manual equivalent:

```typescript
// Manual version (what you wrote before)
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  system: 'You are a helpful assistant that speaks like a pirate.',
  messages: [{ role: 'user', content: 'What is the meaning of life?' }],
  max_tokens: 1024,
});
const result = response.content[0].text;
```

The LangChain version is more lines but more composable. You can swap the model, change the prompt template, or add a different output parser without rewriting the chain. Whether that composability is worth the abstraction overhead depends on your use case.

### Streaming with LCEL

```typescript
// Streaming is built into every chain
const stream = await chain.stream({ input: 'Tell me a story' });

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Structured Output

This is where LangChain genuinely saves time:

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { z } from 'zod';

const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4-20250514',
});

// Define the output schema
const responseSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  summary: z.string(),
});

// Get structured output -- LangChain handles the prompt engineering
const structuredModel = model.withStructuredOutput(responseSchema);

const result = await structuredModel.invoke(
  'Analyze the sentiment of: "This product is amazing but the shipping was terrible"'
);

console.log(result);
// { sentiment: 'negative', confidence: 0.6, keywords: ['amazing', 'terrible', 'shipping'], summary: '...' }
```

Compare to your manual approach:

```typescript
// Manual version -- you have to craft the prompt yourself
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 500,
  system: `Analyze sentiment. Respond in JSON: {"sentiment": "positive|negative|neutral", "confidence": 0-1, "keywords": [...], "summary": "..."}`,
  messages: [{ role: 'user', content: text }],
});
const result = JSON.parse(response.content[0].text); // Hope it's valid JSON
```

LangChain handles the JSON instruction, parsing, and validation. This is genuinely useful.

### Tool Use with LangChain

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// Define tools
const weatherTool = tool(
  async ({ city }) => {
    // Fetch weather...
    return `Weather in ${city}: 25°C, partly cloudy`;
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a city',
    schema: z.object({
      city: z.string().describe('The city name'),
    }),
  }
);

const calculatorTool = tool(
  async ({ expression }) => {
    const result = Function(`'use strict'; return (${expression})`)();
    return `${expression} = ${result}`;
  },
  {
    name: 'calculator',
    description: 'Evaluate a math expression',
    schema: z.object({
      expression: z.string().describe('Math expression'),
    }),
  }
);

// Bind tools to model
const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4-20250514',
});

const modelWithTools = model.bindTools([weatherTool, calculatorTool]);

// The model can now decide to call tools
const response = await modelWithTools.invoke(
  'What is the weather in Paris and what is 15% of 200?'
);
```

### When LangChain Helps vs Hurts

**Helps (use it):**
- Quick prototypes where you want 5 integrations connected fast
- Structured output (withStructuredOutput is great)
- Document loading and splitting (dozens of loaders built in)
- When your team already uses it

**Hurts (skip it):**
- Simple chains that are 5 lines of manual code but 15 lines of LangChain
- When you need fine-grained control over prompts and responses
- When debugging: stack traces through LangChain's abstraction layers are painful
- When the latest API features are not yet supported in LangChain

**Neutral (could go either way):**
- RAG pipelines (LangChain saves boilerplate but hides important details)
- Agent loops (LangChain handles the loop but makes customization harder)
- Vector store operations (slight convenience, slight overhead)

## Key Insight

LangChain is a trade-off, not a requirement. It trades control and transparency for convenience and composability. For prototyping and standard patterns, the trade-off is worth it. For production systems where you need to understand and optimize every step, the abstraction can become a liability. The best AI engineers know both approaches and choose based on the situation. You now know both.

## Resources

- [LangChain.js Documentation](https://js.langchain.com/docs/introduction/)
- [LCEL Conceptual Guide](https://js.langchain.com/docs/concepts/lcel/)
- [LangChain.js API Reference](https://api.js.langchain.com/)
- [LangChain vs manual: honest comparison](https://www.youtube.com/results?search_query=langchain+vs+manual) -- search for recent community discussions

## Done When

- [ ] You installed LangChain.js and ran a basic chain
- [ ] You understand LCEL pipe syntax: prompt.pipe(model).pipe(parser)
- [ ] You can map every LangChain concept to your manual equivalent
- [ ] You tried structured output with withStructuredOutput
- [ ] You formed an honest opinion about when LangChain helps vs hurts
- [ ] You can read LangChain code and understand what it does without documentation

---

*Tomorrow: LangGraph -- graph-based agent orchestration. This is where LangChain's ecosystem delivers something genuinely hard to build from scratch.*
