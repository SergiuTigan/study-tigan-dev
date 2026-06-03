---
title: "API Design"
course: "ai-engineer"
courseTitle: "AI Engineer"
module: "production"
moduleTitle: "Production"
moduleDescription: "Ship AI applications to production with proper API design, monitoring, safety, and scaling."
lessonId: "ai-engineer/production/api-design"
duration: "10 min"
order: 701
moduleOrder: 7
lessonOrder: 1
color: "purple"
---
# API Design

Designing APIs for AI-powered features requires special considerations around latency, streaming, error handling, and rate limiting.

## Streaming Responses

LLM responses can take seconds. Stream them to the client for better UX:

```typescript
// Express.js streaming endpoint
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: req.body.messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      res.write(`data: ${JSON.stringify({ text: event.delta.text })}\\n\\n`);
    }
  }

  res.write('data: [DONE]\\n\\n');
  res.end();
});
```

## Request/Response Schema

```typescript
// Request
interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  conversationId?: string;
  stream?: boolean;
  maxTokens?: number;
}

// Response (non-streaming)
interface ChatResponse {
  id: string;
  content: string;
  sources?: { title: string; url: string }[];
  usage: { inputTokens: number; outputTokens: number };
  model: string;
  finishReason: 'end_turn' | 'max_tokens' | 'error';
}
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 20,                   // 20 requests per minute
  message: { error: 'Too many AI requests. Please wait a moment.' },
  keyGenerator: (req) => req.user?.id ?? req.ip,
});

app.use('/api/chat', aiLimiter);
```

## Timeout Handling

```typescript
async function callWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

const response = await callWithTimeout(
  anthropic.messages.create({ /* ... */ }),
  30000, // 30 second timeout
);
```

## Versioning

Version your AI endpoints independently from your main API, since model changes and prompt updates happen on a different cadence:

```
/api/v1/chat          # Stable, production
/api/v2/chat          # New model or prompt version
/api/beta/chat        # Experimental features
```
