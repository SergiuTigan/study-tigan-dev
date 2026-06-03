---
title: "LLM Landscape"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "foundations"
moduleTitle: "Foundations"
moduleDescription: "Understand the AI engineering landscape, LLM fundamentals, pricing models, and development tooling."
lessonId: "ai-engineer/foundations/llm-landscape"
duration: "12 min"
order: 102
moduleOrder: 1
lessonOrder: 2
color: "purple"
---
# LLM Landscape

The large language model landscape evolves rapidly. Understanding the major model families, their capabilities, and trade-offs is essential for choosing the right model for your application.

## Major Model Providers

### OpenAI
- **GPT-4o:** Multimodal (text, image, audio), fast, good general-purpose model.
- **GPT-4.1:** Strongest coding and long-context model.
- **o3/o4-mini:** Reasoning models that "think" before responding.

### Anthropic
- **Claude Opus 4:** Most capable, best for complex analysis and coding.
- **Claude Sonnet 4:** Balanced performance and cost.
- **Claude Haiku:** Fast and affordable for high-volume tasks.

### Google
- **Gemini 2.5 Pro:** Long context (up to 1M tokens), strong reasoning.
- **Gemini Flash:** Fast, cost-effective.

### Open Source
- **Llama 3.1 (Meta):** Strong open-weight model, available in 8B/70B/405B.
- **Mistral Large:** Competitive performance from Mistral AI.
- **DeepSeek R1:** Strong reasoning capabilities.

## Choosing a Model

```
Use Case                  | Recommended Approach
──────────────────────────|─────────────────────────
Simple classification     | Small model (Haiku, Flash)
Complex reasoning         | Large model (Opus, o3)
Code generation           | GPT-4.1, Claude Opus
High volume / low cost    | Haiku, GPT-4o-mini
Privacy-sensitive         | Self-hosted open source
Long documents            | Gemini 2.5 Pro (1M context)
```

## Key Concepts

- **Context window:** The maximum number of tokens the model can process in a single request. Ranges from 8K to 1M+.
- **Temperature:** Controls randomness. 0 = deterministic, 1 = creative.
- **Top-p:** Nucleus sampling. Controls diversity of output.
- **Multimodal:** Models that accept and generate text, images, and audio.

## The Trend

Models are getting cheaper, faster, and more capable over time. Design your architecture so you can swap models easily. Today's expensive operation may be pennies tomorrow.
