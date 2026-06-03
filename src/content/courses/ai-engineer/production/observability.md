---
title: "Observability & Monitoring"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "production"
moduleTitle: "Production"
moduleDescription: "Ship AI applications to production with proper API design, monitoring, safety, and scaling."
lessonId: "ai-engineer/production/observability"
duration: "12 min"
order: 702
moduleOrder: 7
lessonOrder: 2
color: "purple"
---
# Observability & Monitoring

AI systems are probabilistic. Unlike traditional software where the same input always produces the same output, LLM responses vary. Monitoring is essential for detecting quality degradation, cost anomalies, and safety issues.

## Key Metrics to Track

```typescript
interface AIRequestMetrics {
  // Performance
  latencyMs: number;
  timeToFirstToken: number;
  tokensPerSecond: number;

  // Cost
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;

  // Quality
  model: string;
  finishReason: string;
  userFeedback?: 'positive' | 'negative';

  // Safety
  flagged: boolean;
  guardrailTriggered: boolean;
}
```

## Structured Logging

```typescript
import { Logger } from './logger';

async function handleAIRequest(request: ChatRequest): Promise<ChatResponse> {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  Logger.info('ai.request.start', {
    requestId,
    model: request.model,
    inputLength: request.messages.reduce((sum, m) => sum + m.content.length, 0),
  });

  try {
    const response = await callModel(request);
    const latency = performance.now() - startTime;

    Logger.info('ai.request.complete', {
      requestId,
      latencyMs: latency,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      finishReason: response.stop_reason,
    });

    return response;
  } catch (error) {
    Logger.error('ai.request.failed', {
      requestId,
      error: error.message,
      latencyMs: performance.now() - startTime,
    });
    throw error;
  }
}
```

## Dashboards

Build dashboards that track:

- **Request volume** over time (detect traffic spikes)
- **Latency percentiles** (p50, p95, p99)
- **Error rate** (API errors, timeouts, safety triggers)
- **Token usage** and **cost** per day/week/month
- **User satisfaction** (thumbs up/down feedback)
- **Model distribution** (if using A/B testing)

## Alerting

Set up alerts for:

```typescript
const alerts = {
  highErrorRate: { threshold: 0.05, window: '5m' },   // >5% errors in 5 min
  highLatency: { threshold: 10000, percentile: 'p95' }, // p95 >10s
  costSpike: { threshold: 2.0, compared_to: 'daily_avg' }, // 2x daily average
  safetyTriggers: { threshold: 10, window: '1h' },    // >10 safety flags/hour
};
```

## Tracing

For multi-step AI workflows (agents, RAG), use distributed tracing to see the full request lifecycle:

```
Request → [Embed Query: 50ms] → [Vector Search: 120ms] → [Rerank: 200ms] → [LLM Generate: 2500ms] → Response
```

Tools like LangSmith, Langfuse, and Helicone provide specialized AI observability.
