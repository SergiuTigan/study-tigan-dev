# Day 20 — Prompt Caching

> *"The fastest code is code that doesn't run. The cheapest token is a token that's already been computed. Caching is not an optimization — it is a requirement."*

**Date:** Sambata, 7 Iunie 2026
**Hours:** 3h · Deep session
**Topic:** Prompt Caching — The Biggest Cost Optimization in AI Engineering
**Phase:** Faza 1 — Foundations · Week 3

---

## What You're Doing

Today you learn the single most impactful cost optimization technique in AI engineering. It is not a clever trick. It is not a hack. It is a first-class feature of the Anthropic API that, once understood, changes how you architect every system you build going forward.

Here is the problem. In most production applications, a significant portion of every request is identical: the system prompt, the document context, the few-shot examples. If your system prompt is 2,000 tokens and you send 1,000 requests per day, you are paying for 2,000,000 tokens of system prompt processing — computing the same thing over and over. That is money set on fire.

Prompt caching solves this. You mark a section of your prompt as cacheable, and Anthropic's infrastructure stores the computed representation. The first request pays a 25% premium to create the cache. Every subsequent request that shares the same prefix gets a **90% discount** on those cached tokens. Break-even is the second request. By the third request, you are saving money. By the thousandth request, you have saved a small fortune.

This is not optional knowledge for an AI engineer. Any production system that does not use prompt caching where applicable is leaving 90% of its budget on the table.

---

## The Work

### Step 1: Understand How Caching Works

The mental model is simple: **Claude processes your prompt from left to right. If the beginning (prefix) of your prompt matches a cached computation, the API reuses it instead of recomputing.**

```
Request 1:  [System Prompt (2000 tokens)] + [User Message]
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            Computed and CACHED (pay 25% premium)

Request 2:  [System Prompt (2000 tokens)] + [Different User Message]
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            Cache HIT — 90% discount on these tokens

Request 3:  [System Prompt (2000 tokens)] + [Yet Another Message]
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            Cache HIT — 90% discount again
```

Critical rules:
- The cached prefix must be **exactly identical** — byte-for-byte
- Minimum cacheable length: **1,024 tokens**
- Cache time-to-live: **5 minutes** (resets on each cache hit)
- Only the **prefix** can be cached — everything from the start up to your cache breakpoint

### Step 2: Implement Basic Prompt Caching

The implementation is remarkably simple. You add `cache_control` to the content block you want to cache up to:

```python
import anthropic

client = anthropic.Anthropic()

# WITHOUT caching — pays full price every time
response_no_cache = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system="You are an expert Python code reviewer. You follow PEP 8 strictly. "
           "You check for security vulnerabilities, performance issues, and "
           "maintainability concerns. You provide specific, actionable feedback "
           "with code examples for every suggestion. [... imagine 1500 more tokens ...]",
    messages=[{"role": "user", "content": "Review this code: ..."}],
)

# WITH caching — first request creates cache, subsequent requests are 90% cheaper
response_cached = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[
        {
            "type": "text",
            "text": (
                "You are an expert Python code reviewer. You follow PEP 8 strictly. "
                "You check for security vulnerabilities, performance issues, and "
                "maintainability concerns. You provide specific, actionable feedback "
                "with code examples for every suggestion. [... imagine 1500 more tokens ...]"
            ),
            "cache_control": {"type": "ephemeral"}  # <-- This is the magic line
        }
    ],
    messages=[{"role": "user", "content": "Review this code: ..."}],
)
```

That single `cache_control` annotation is all it takes. The `"ephemeral"` type is currently the only supported cache type — it means the cache may be evicted after the TTL (5 minutes).

### Step 3: Read the Response — Cache Metrics

The API response tells you exactly what happened with caching:

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": "Your long system prompt here...",
        "cache_control": {"type": "ephemeral"}
    }],
    messages=[{"role": "user", "content": "Hello"}],
)

# The usage object now has cache-specific fields:
print(response.usage)
# Usage(
#     input_tokens=50,                    # Non-cached input tokens
#     output_tokens=150,                  # Output tokens (unchanged)
#     cache_creation_input_tokens=2000,   # Tokens cached (FIRST request)
#     cache_read_input_tokens=0           # Tokens read from cache
# )

# Second request with same prefix:
# Usage(
#     input_tokens=50,                    # Non-cached input tokens
#     output_tokens=150,                  # Output tokens
#     cache_creation_input_tokens=0,      # Nothing new to cache
#     cache_read_input_tokens=2000        # Cache HIT! 90% discount
# )
```

The pricing breakdown:
| Token Type | Cost Multiplier | When It Appears |
|---|---|---|
| `input_tokens` | 1x (base price) | Always — non-cached portion |
| `output_tokens` | 1x (base price) | Always — Claude's response |
| `cache_creation_input_tokens` | 1.25x (25% premium) | First request only |
| `cache_read_input_tokens` | 0.1x (90% discount) | Subsequent requests |

### Step 4: Implement the Best Caching Patterns

**Pattern 1: Long System Prompt (Most Common)**
```python
# Perfect for: code reviewers, writing assistants, domain-specific tools
system = [{
    "type": "text",
    "text": "Your detailed system prompt with instructions, rules, examples...",
    "cache_control": {"type": "ephemeral"}
}]
```

**Pattern 2: Document Context**
```python
# Perfect for: document Q&A, analysis, summarization
# The document stays cached while users ask multiple questions
system = [
    {
        "type": "text",
        "text": "You are a document analysis assistant."
    },
    {
        "type": "text",
        "text": f"<document>\n{large_document_text}\n</document>",
        "cache_control": {"type": "ephemeral"}
    }
]
# Now users can ask 50 questions about the document
# and the document is only "processed" once
```

**Pattern 3: Few-Shot Examples**
```python
# Perfect for: classification, extraction, formatting tasks
# Your examples stay cached across all requests
system = [{
    "type": "text",
    "text": """You classify customer support tickets.

Examples:
<example>
Input: "My payment didn't go through"
Category: billing
Priority: high
</example>

<example>
Input: "How do I change my password?"
Category: account
Priority: low
</example>

[... 20 more examples, pushing past the 1024 token minimum ...]
""",
    "cache_control": {"type": "ephemeral"}
}]
```

**Pattern 4: Conversation History Prefix**
```python
# Perfect for: long conversations where history grows
# Cache everything up to the latest exchange
messages = [
    {"role": "user", "content": "First message..."},
    {"role": "assistant", "content": "First response..."},
    {"role": "user", "content": "Second message..."},
    {"role": "assistant", "content": "Second response..."},
    # ... many more turns ...
    {
        "role": "user",
        "content": "Previous message...",
    },
    {
        "role": "assistant",
        "content": [
            {
                "type": "text",
                "text": "Previous response...",
                "cache_control": {"type": "ephemeral"}  # Cache up to here
            }
        ]
    },
    # Only this new message is uncached:
    {"role": "user", "content": "New message"},
]
```

### Step 5: Build a Cost Comparison

Write a small script that demonstrates the savings concretely:

```python
import anthropic

client = anthropic.Anthropic()

# Generate a system prompt that exceeds 1024 tokens
long_system = "You are an expert assistant. " * 200  # ~1200 tokens

# Pricing (Claude Sonnet as example — check current prices)
INPUT_PRICE_PER_MTOK = 3.00       # $3 per million input tokens
CACHE_WRITE_PER_MTOK = 3.75       # $3.75 per million (25% premium)
CACHE_READ_PER_MTOK = 0.30        # $0.30 per million (90% discount)
OUTPUT_PRICE_PER_MTOK = 15.00     # $15 per million output tokens

def calculate_costs(usage):
    """Calculate actual dollar cost from usage."""
    input_cost = (usage.input_tokens / 1_000_000) * INPUT_PRICE_PER_MTOK
    output_cost = (usage.output_tokens / 1_000_000) * OUTPUT_PRICE_PER_MTOK

    cache_write_cost = 0
    cache_read_cost = 0
    if hasattr(usage, 'cache_creation_input_tokens') and usage.cache_creation_input_tokens:
        cache_write_cost = (usage.cache_creation_input_tokens / 1_000_000) * CACHE_WRITE_PER_MTOK
    if hasattr(usage, 'cache_read_input_tokens') and usage.cache_read_input_tokens:
        cache_read_cost = (usage.cache_read_input_tokens / 1_000_000) * CACHE_READ_PER_MTOK

    total = input_cost + output_cost + cache_write_cost + cache_read_cost
    return {
        "input": input_cost,
        "output": output_cost,
        "cache_write": cache_write_cost,
        "cache_read": cache_read_cost,
        "total": total,
    }

# Request 1: Cache creation
r1 = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=100,
    system=[{
        "type": "text",
        "text": long_system,
        "cache_control": {"type": "ephemeral"}
    }],
    messages=[{"role": "user", "content": "Hello"}],
)

# Request 2: Cache hit
r2 = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=100,
    system=[{
        "type": "text",
        "text": long_system,  # Exact same prefix
        "cache_control": {"type": "ephemeral"}
    }],
    messages=[{"role": "user", "content": "Different question"}],
)

c1 = calculate_costs(r1.usage)
c2 = calculate_costs(r2.usage)

print(f"Request 1 (cache write): ${c1['total']:.6f}")
print(f"  - Cache write cost: ${c1['cache_write']:.6f}")
print(f"Request 2 (cache read): ${c2['total']:.6f}")
print(f"  - Cache read cost:  ${c2['cache_read']:.6f}")
print(f"Savings on request 2:   ${c1['total'] - c2['total']:.6f}")
print(f"Discount:               {((c1['total'] - c2['total']) / c1['total'] * 100):.1f}%")
```

### Step 6: Add Caching to Your CLI Tool

Update your CLI tool to use prompt caching for its system prompt. Also update your cost tracker to show cache-related metrics:

```python
# In your CLI tool, update the system message to use caching:
def get_system_message():
    """Return system message with cache control."""
    return [{
        "type": "text",
        "text": "Your CLI tool's system prompt...",
        "cache_control": {"type": "ephemeral"}
    }]

# Update cost tracker to show cache metrics:
def display_usage(usage):
    """Display usage with cache information."""
    print(f"  Input tokens:  {usage.input_tokens}")
    print(f"  Output tokens: {usage.output_tokens}")

    if usage.cache_creation_input_tokens:
        print(f"  Cache WRITE:   {usage.cache_creation_input_tokens} tokens (25% premium)")
    if usage.cache_read_input_tokens:
        print(f"  Cache READ:    {usage.cache_read_input_tokens} tokens (90% discount!)")
```

---

## Key Insight

**Prompt caching flips the economics of AI engineering.** Without caching, every token of context you add increases cost linearly across all requests. With caching, you can add massive amounts of context — entire documents, hundreds of examples, detailed instructions — and only pay for it once. This changes what is architecturally possible. Systems that were too expensive to run become viable. The constraint shifts from "how little context can I get away with?" to "what context would make this response perfect?"

---

## Resources

- [Prompt Caching Documentation](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — the complete guide
- [Pricing Page](https://www.anthropic.com/pricing) — current token prices including cache read/write
- [API Reference: Cache Control](https://docs.anthropic.com/en/api/messages) — the `cache_control` parameter specification

---

## Done When

- [ ] Can explain how prompt caching works to a colleague (prefix matching, TTL, minimum size)
- [ ] Implemented `cache_control` on at least one system prompt and confirmed cache hit in response
- [ ] Observed `cache_creation_input_tokens` on first request
- [ ] Observed `cache_read_input_tokens` on subsequent request
- [ ] Know the rules: 1,024 token minimum, 5-minute TTL, exact prefix match required
- [ ] Understand pricing: 25% premium to write, 90% discount to read, break-even at request 2
- [ ] Implemented all four caching patterns (system prompt, document, few-shot, conversation)
- [ ] Cost tracker in CLI tool updated to show cache metrics
- [ ] Built and ran the cost comparison script — saw the savings with real numbers

---

*Tomorrow: The grand finale. Five hours to refactor, polish, test, and retrospect. You will take everything from Weeks 1-3, forge it into a professional-quality CLI tool, and close out Faza 1. Bring your best work.*
