# Day 76 -- Cost Optimization: The Math That Makes AI Viable

> *"Running 100% Sonnet is like flying first class for every trip, including the walk to the corner store. A model cascade router is your travel agent."*

**Date:** Sambata, 2 August 2025
**Hours:** 3h · Deep work session
**Topic:** Model Cascade Routing, Batch API, Cost Tracking
**Phase:** Faza 3 -- Production · Week 11

---

## What You're Doing

Today you learn the most impactful cost optimization technique in AI engineering: model cascade routing. The idea is simple -- not every query needs the smartest (and most expensive) model. A question like "What is 2+2?" does not need Claude Opus. A question like "Analyze the geopolitical implications of semiconductor supply chains" probably does.

By routing queries to the right model based on complexity, you can cut costs by 5-10x while maintaining quality where it matters. This is not a hack. This is how every production AI system operates.

## The Work

### Hour 1: Model Cascade Router

The strategy: use a cheap, fast model (Haiku) to classify query complexity, then route to the appropriate model.

```typescript
// src/lib/model-router.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

type ComplexityLevel = 'simple' | 'moderate' | 'complex';

interface RoutingResult {
  model: string;
  complexity: ComplexityLevel;
  reasoning: string;
}

// Model pricing (per 1M tokens, approximate)
const MODEL_COSTS = {
  'claude-haiku-4-20250514': { input: 0.25, output: 1.25 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
};

const COMPLEXITY_TO_MODEL: Record<ComplexityLevel, string> = {
  simple: 'claude-haiku-4-20250514',
  moderate: 'claude-sonnet-4-20250514',
  complex: 'claude-opus-4-20250514',
};

async function classifyComplexity(query: string): Promise<RoutingResult> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514', // Use the cheapest model for classification
    max_tokens: 100,
    system: `Classify the complexity of user queries. Respond with ONLY one word:
- "simple" for factual questions, basic tasks, greetings, simple math, definitions
- "moderate" for analysis, summarization, code generation, multi-step reasoning
- "complex" for research, creative writing, complex code architecture, nuanced analysis

Respond with only the word: simple, moderate, or complex`,
    messages: [{ role: 'user', content: query }],
  });

  const classification = (
    response.content[0].type === 'text'
      ? response.content[0].text.trim().toLowerCase()
      : 'moderate'
  ) as ComplexityLevel;

  // Validate classification
  const validLevels: ComplexityLevel[] = ['simple', 'moderate', 'complex'];
  const complexity = validLevels.includes(classification) ? classification : 'moderate';

  return {
    model: COMPLEXITY_TO_MODEL[complexity],
    complexity,
    reasoning: `Query classified as ${complexity}`,
  };
}

export async function routedLLMCall(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: {
    forceModel?: string;
    maxTokens?: number;
    system?: string;
  } = {}
) {
  // If a model is forced, skip routing
  if (options.forceModel) {
    const response = await anthropic.messages.create({
      model: options.forceModel,
      max_tokens: options.maxTokens || 1024,
      system: options.system,
      messages,
    });
    return {
      response,
      model: options.forceModel,
      complexity: 'forced' as const,
      routerCost: 0,
    };
  }

  // Classify the latest user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) throw new Error('No user message found');

  const routing = await classifyComplexity(lastUserMessage.content);

  // Make the actual call with the routed model
  const response = await anthropic.messages.create({
    model: routing.model,
    max_tokens: options.maxTokens || 1024,
    system: options.system,
    messages,
  });

  return {
    response,
    model: routing.model,
    complexity: routing.complexity,
    routerCost: 0.00001, // Rough cost of the Haiku classification call
  };
}
```

### The Cost Math

Let's say you have 10,000 requests per day with this distribution:

**Without routing (100% Sonnet):**
```
10,000 requests x ~1,000 input tokens x $3.00/1M = $30.00/day input
10,000 requests x ~500 output tokens x $15.00/1M = $75.00/day output
Total: $105.00/day = $3,150/month
```

**With routing (70% Haiku, 25% Sonnet, 5% Opus):**
```
Router: 10,000 x ~100 tokens x $0.25/1M = $0.25/day (negligible)

Haiku (7,000 requests):
  Input:  7,000 x 1,000 x $0.25/1M = $1.75
  Output: 7,000 x 500 x $1.25/1M   = $4.38

Sonnet (2,500 requests):
  Input:  2,500 x 1,000 x $3.00/1M = $7.50
  Output: 2,500 x 500 x $15.00/1M  = $18.75

Opus (500 requests):
  Input:  500 x 1,000 x $15.00/1M = $7.50
  Output: 500 x 500 x $75.00/1M   = $18.75

Total: $58.88/day = ~$1,767/month

Savings: 44% cheaper, complex queries get a BETTER model
```

The key insight: you get Opus quality for your hardest questions while spending less overall. Without routing, everything gets Sonnet. With routing, hard questions get Opus.

### Hour 2: Batch API for Non-Real-Time Work

Anthropic's Batch API offers a 50% discount for requests that can tolerate up to 24 hours of latency. Perfect for:
- Nightly document processing
- Bulk embeddings
- Evaluation runs
- Content generation pipelines

```typescript
// src/lib/batch.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

interface BatchRequest {
  custom_id: string;
  params: {
    model: string;
    max_tokens: number;
    messages: Array<{ role: string; content: string }>;
  };
}

async function submitBatch(requests: BatchRequest[]) {
  // Create a JSONL file from requests
  const jsonl = requests.map(r => JSON.stringify(r)).join('\n');

  // Write to a temporary file or use the API directly
  // The Anthropic SDK supports batch operations
  const batch = await anthropic.messages.batches.create({
    requests: requests.map(r => ({
      custom_id: r.custom_id,
      params: {
        model: r.params.model,
        max_tokens: r.params.max_tokens,
        messages: r.params.messages as any,
      },
    })),
  });

  console.log(`Batch submitted: ${batch.id}`);
  console.log(`Status: ${batch.processing_status}`);
  console.log(`Requests: ${requests.length}`);

  return batch;
}

// Example: Batch classify 100 documents
async function batchClassifyDocuments(documents: string[]) {
  const requests: BatchRequest[] = documents.map((doc, i) => ({
    custom_id: `doc-${i}`,
    params: {
      model: 'claude-haiku-4-20250514',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Classify this document into one category (tech, business, science, other): ${doc.slice(0, 1000)}`,
      }],
    },
  }));

  return submitBatch(requests);
}
```

### Hour 3: Cost Tracking Dashboard

Build a simple cost tracker that aggregates usage across all models:

```typescript
// src/lib/cost-tracker.ts

interface UsageRecord {
  timestamp: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  feature: string; // 'chat', 'rag', 'agent', 'gen-ui'
  cached: boolean;
}

class CostTracker {
  private records: UsageRecord[] = [];

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-haiku-4-20250514': { input: 0.25, output: 1.25 },
      'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
      'claude-opus-4-20250514': { input: 15.0, output: 75.0 },
      'gpt-4o': { input: 2.5, output: 10.0 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
    };

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    return (
      (inputTokens / 1_000_000) * modelPricing.input +
      (outputTokens / 1_000_000) * modelPricing.output
    );
  }

  record(data: Omit<UsageRecord, 'cost' | 'timestamp'>) {
    const cost = this.calculateCost(data.model, data.inputTokens, data.outputTokens);
    this.records.push({
      ...data,
      cost,
      timestamp: Date.now(),
    });
  }

  // Daily summary
  getDailySummary(date?: Date): {
    totalCost: number;
    totalRequests: number;
    byModel: Record<string, { requests: number; cost: number; tokens: number }>;
    byFeature: Record<string, { requests: number; cost: number }>;
    cacheHitRate: number;
  } {
    const targetDate = date || new Date();
    const dayStart = new Date(targetDate).setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate).setHours(23, 59, 59, 999);

    const dayRecords = this.records.filter(
      r => r.timestamp >= dayStart && r.timestamp <= dayEnd
    );

    const byModel: Record<string, { requests: number; cost: number; tokens: number }> = {};
    const byFeature: Record<string, { requests: number; cost: number }> = {};
    let cachedCount = 0;

    for (const record of dayRecords) {
      // By model
      if (!byModel[record.model]) {
        byModel[record.model] = { requests: 0, cost: 0, tokens: 0 };
      }
      byModel[record.model].requests++;
      byModel[record.model].cost += record.cost;
      byModel[record.model].tokens += record.inputTokens + record.outputTokens;

      // By feature
      if (!byFeature[record.feature]) {
        byFeature[record.feature] = { requests: 0, cost: 0 };
      }
      byFeature[record.feature].requests++;
      byFeature[record.feature].cost += record.cost;

      if (record.cached) cachedCount++;
    }

    return {
      totalCost: dayRecords.reduce((sum, r) => sum + r.cost, 0),
      totalRequests: dayRecords.length,
      byModel,
      byFeature,
      cacheHitRate: dayRecords.length > 0 ? cachedCount / dayRecords.length : 0,
    };
  }

  // Projected monthly cost
  getProjectedMonthlyCost(): number {
    const last7Days = this.records.filter(
      r => r.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const dailyAvg = last7Days.reduce((sum, r) => sum + r.cost, 0) / 7;
    return dailyAvg * 30;
  }

  // Print formatted report
  printReport() {
    const summary = this.getDailySummary();
    console.log('\n=== AI Cost Report ===');
    console.log(`Total requests: ${summary.totalRequests}`);
    console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
    console.log(`Cache hit rate: ${(summary.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`\nBy Model:`);
    for (const [model, data] of Object.entries(summary.byModel)) {
      console.log(`  ${model}: ${data.requests} requests, $${data.cost.toFixed(4)}, ${data.tokens} tokens`);
    }
    console.log(`\nBy Feature:`);
    for (const [feature, data] of Object.entries(summary.byFeature)) {
      console.log(`  ${feature}: ${data.requests} requests, $${data.cost.toFixed(4)}`);
    }
    console.log(`\nProjected monthly: $${this.getProjectedMonthlyCost().toFixed(2)}`);
    console.log('====================\n');
  }
}

export const costTracker = new CostTracker();
```

**Integration example:**

```typescript
const response = await routedLLMCall(messages);

costTracker.record({
  model: response.model,
  inputTokens: response.response.usage.input_tokens,
  outputTokens: response.response.usage.output_tokens,
  feature: 'chat',
  cached: false,
});
```

## Key Insight

Cost optimization is not about being cheap. It is about being sustainable. An AI feature that costs $100/day for 1,000 users is $3,000/month. With model routing and caching, that same feature costs $300-500/month. The first number kills the feature in a quarterly review. The second number keeps it alive. In AI engineering interviews, demonstrating that you think about cost is as important as demonstrating that you can build features. Anyone can call Opus for everything. An engineer who routes 70% of traffic to Haiku while maintaining quality -- that is someone who ships production AI systems.

## Resources

- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Anthropic Batch API](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)
- [OpenAI Pricing](https://openai.com/api/pricing/) -- for comparison
- [LLM Cost Calculator](https://huggingface.co/spaces/philschmid/llm-pricing) -- third-party comparison tool

## Done When

- [ ] You built a model cascade router (Haiku classifier -> route to Haiku/Sonnet/Opus)
- [ ] You understand the cost math: 70/25/5 split is ~8x cheaper than 100% Sonnet
- [ ] You understand the Batch API and when to use it (non-real-time processing)
- [ ] You built a cost tracking system that records model, tokens, cost, and feature
- [ ] You can generate a daily cost report with breakdown by model and feature
- [ ] You can calculate projected monthly costs from recent usage data

---

*Tomorrow: Apply everything from this week to all four projects. Observability, caching, cost optimization -- the full production stack.*
