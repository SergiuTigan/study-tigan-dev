# Day 21 — Faza 1 Review: Refactor & Polish

> *"A project is not finished when there is nothing left to add. It is finished when there is nothing left to take away — and everything that remains works flawlessly."*

**Date:** Duminica, 8 Iunie 2026
**Hours:** 5h · Full deep session
**Topic:** Faza 1 Completion — Refactor, Test, Document, Retrospect
**Phase:** Faza 1 — Foundations · Week 3 (FINAL DAY)

---

## What You're Doing

This is the last day of Faza 1. Three weeks ago you did not know what an API key was. Today you are going to take everything you have built — every feature, every hack, every quick-and-dirty experiment — and transform it into a professional-quality tool.

This is not a coding day. This is a craftsmanship day.

There is a version of your CLI tool that exists right now: functional, feature-rich, probably a little messy. There is another version that exists in potential: clean architecture, proper error handling, comprehensive documentation, tested edge cases. Five hours is enough to close that gap.

Why does this matter? Because the quality of your Faza 1 artifact determines how much you can build on top of it in Faza 2. Messy foundations create messy buildings. But more than that — the ability to take a working prototype and elevate it to production quality is one of the most valuable skills in software engineering. Anyone can hack together a demo. The engineers who get hired, promoted, and trusted with important systems are the ones who can also make that demo bulletproof.

Today, you become that engineer.

---

## The Work

### Hour 1-2: Refactor the CLI Tool

**Goal:** Clean, readable, well-structured code where every feature works together seamlessly.

Open your entire CLI codebase and read it top to bottom. Do not change anything yet. Just read. Make a mental list of everything that makes you wince.

Then, systematically address each concern:

**Code Organization:**
```python
# BEFORE: Everything in one file, functions in random order
# AFTER: Clear structure

# cli.py — Entry point and argument parsing
# client.py — Anthropic API wrapper with caching, streaming, vision
# tools.py — Tool definitions and execution logic
# cost_tracker.py — Token counting and cost calculation
# config.py — API keys, model settings, defaults
# utils.py — Helper functions (base64 encoding, file I/O, etc.)
```

**Consistent Error Handling:**
```python
# Every external call should have proper error handling
import anthropic

class CLIError(Exception):
    """Base exception for CLI tool."""
    pass

class APIError(CLIError):
    """API-related errors."""
    pass

class ConfigError(CLIError):
    """Configuration errors (missing API key, etc.)."""
    pass

def call_api(client, **kwargs):
    """Make an API call with consistent error handling."""
    try:
        response = client.messages.create(**kwargs)
        return response
    except anthropic.AuthenticationError:
        raise ConfigError(
            "Invalid API key. Check your ANTHROPIC_API_KEY environment variable."
        )
    except anthropic.RateLimitError as e:
        raise APIError(
            f"Rate limited. Wait and retry. Details: {e}"
        )
    except anthropic.APIConnectionError:
        raise APIError(
            "Cannot connect to Anthropic API. Check your internet connection."
        )
    except anthropic.APIStatusError as e:
        raise APIError(
            f"API error (status {e.status_code}): {e.message}"
        )
```

**Feature Integration Checklist:**
```markdown
Verify these features all work together:
- [ ] Basic text prompt → response
- [ ] Streaming output
- [ ] Tool use (at least one tool: web search, calculator, or file reader)
- [ ] Vision (--image flag)
- [ ] Prompt caching (system prompt cached)
- [ ] Cost tracking (shows tokens, cost, cache metrics)
- [ ] Multi-turn conversation (conversation history maintained)
- [ ] Structured output (JSON mode or XML extraction)
- [ ] Streaming + tool use together
- [ ] Vision + tool use together
- [ ] Caching + streaming together
```

The real test of good architecture: features should compose. Streaming should work with tool use. Vision should work with caching. If any combination breaks, that is a sign of tight coupling that needs refactoring.

### Hour 3: README Upgrade

**Goal:** Documentation that would impress someone reviewing your GitHub profile.

A great README has five sections. Write each one:

```markdown
# Claude CLI Tool

> One-line description of what this tool does

## Architecture

[Text description or ASCII diagram showing how components fit together]

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   CLI Input  │────▶│  API Client   │────▶│   Anthropic │
│  (argparse)  │     │  (streaming,  │     │     API     │
│              │     │   caching,    │     │             │
│  --image     │     │   vision)     │     │             │
│  --tool      │     ├──────────────┤     └─────────────┘
│  --stream    │     │ Tool Executor │
│  --json      │     │ Cost Tracker  │
└─────────────┘     └──────────────┘

## Features

- **Streaming responses** — real-time token output
- **Tool use** — extensible function calling
- **Vision** — send images with prompts (--image flag)
- **Prompt caching** — 90% cost savings on system prompts
- **Cost tracking** — per-request and session-total cost display
- **Multi-turn** — conversation history management
- **Structured output** — JSON mode support

## Setup

[Clear, copy-pasteable setup instructions]

## Usage

[Examples of every major feature with expected output]

## Lessons Learned

[3-5 key insights from building this tool — this is what makes
 your README stand out from every other tutorial project]
```

The "Lessons Learned" section is what separates a portfolio project from a homework assignment. Write honestly about what surprised you, what was harder than expected, and what you would do differently if you started over.

### Hour 4: Test Edge Cases

**Goal:** No crash, no unhandled exception, no confusing error message.

Systematically try to break your tool. For each test, document whether it passes and what the user sees:

```markdown
## Edge Case Test Results

### Authentication
- [ ] Wrong API key → clear error message, not a stack trace
- [ ] Missing API key (env var not set) → clear error message
- [ ] Expired/revoked API key → clear error message

### Network
- [ ] No internet connection → timeout with clear message
- [ ] API returns 500 error → retry or clear error
- [ ] Request timeout (very long response) → handled gracefully

### Input
- [ ] Empty prompt → helpful message ("Please provide a prompt")
- [ ] Very long prompt (100K+ tokens) → warning or graceful handling
- [ ] Special characters in prompt (unicode, emoji, newlines)
- [ ] Binary file passed as --image → clear error, not crash
- [ ] Non-existent file path for --image → clear error
- [ ] Unsupported image format → clear error

### Tool Use
- [ ] Tool returns error → Claude sees error, user sees explanation
- [ ] Tool returns empty result → handled gracefully
- [ ] Multiple sequential tool calls → all execute correctly
- [ ] Tool call with malformed arguments → handled

### Conversation
- [ ] 50+ turn conversation → still works (or graceful truncation)
- [ ] Ctrl+C during streaming → clean exit, no partial state corruption

### Cost Tracking
- [ ] Zero-cost request (if possible) → displays correctly
- [ ] Cache creation → shows cache write tokens
- [ ] Cache hit → shows cache read tokens and savings
```

Fix every failure. For some edge cases, the fix might be a simple try/except with a clear error message. For others, it might require architectural changes. Prioritize: clear error messages over silent failures, and graceful degradation over crashes.

### Hour 5: Retrospective + Blog Draft Notes

**Goal:** Crystallize what you learned and prepare for Faza 2.

This hour is not about code. It is about thinking. Write answers to these questions:

```markdown
## Faza 1 Retrospective

### What I Built
[Describe your CLI tool in 2-3 sentences, as if explaining to a recruiter]

### What Surprised Me
[3 things that were different from what you expected going in]

### What Was Harder Than Expected
[Be honest — where did you struggle?]

### What I Would Do Differently
[If you started Faza 1 over, what would you change?]

### My Current Mental Model
[How do you think about "building with AI" now vs 3 weeks ago?]

### Top 5 Things I Learned
1.
2.
3.
4.
5.

### Blog Draft — "What I Learned in 3 Weeks of AI Engineering"
[Bullet points for a future blog post. What would be interesting to others?]
-
-
-
```

### Faza 1 Complete Checklist

Before you close the book on Faza 1, verify everything:

```markdown
## Faza 1 — Foundations: Completion Checklist

### Core API Skills
- [ ] Can make API calls (messages.create) from memory
- [ ] Understand all parameters: model, max_tokens, system, messages, tools, temperature
- [ ] Handle all stop_reasons: end_turn, max_tokens, stop_sequence, tool_use
- [ ] Implement streaming (real-time token display)
- [ ] Multi-turn conversation management

### Tool Use
- [ ] Define tools with JSON schema
- [ ] Handle the tool_use → tool_result loop
- [ ] Error handling when tools fail
- [ ] At least one working tool in the CLI

### Vision
- [ ] Send images via base64 content blocks
- [ ] Know the limitations (format, size, token cost)
- [ ] --image flag working in CLI

### Prompt Caching
- [ ] cache_control annotation implemented
- [ ] Understand pricing: write premium, read discount
- [ ] Cache metrics visible in cost tracker

### Structured Output
- [ ] Can extract JSON from Claude's responses
- [ ] Understand prefilled assistant messages for format control

### Cost Awareness
- [ ] Token counting per request
- [ ] Cost calculation (input + output + cache)
- [ ] Running session total

### Production Readiness
- [ ] Proper error handling (no stack traces for users)
- [ ] Edge cases tested
- [ ] README documentation
- [ ] Clean, organized code

### Knowledge
- [ ] Completed DeepLearning.AI course
- [ ] Completed Anthropic official courses
- [ ] No "unknown unknowns" in basic API
```

---

## Transition to Faza 2

Faza 1 answered: **"How do I talk to the model?"**

Faza 2 answers: **"How do I give the model the right information?"**

This is the RAG (Retrieval-Augmented Generation) phase. You will learn about embeddings, vector databases, contextual retrieval, and the art of building systems where Claude has access to your data — not just your instructions.

**Preview reading** (optional, for the curious):
- [Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) — the paper that redefines how we think about giving models context
- [Building Effective Agents (Anthropic)](https://www.anthropic.com/research/building-effective-agents) — the architectural patterns that power real AI products

You do not need to read these tonight. But if you are excited about what comes next, these two pieces will show you where the road leads.

---

## Key Insight

**Faza 1 is not about the CLI tool you built. It is about the engineer you became while building it.** Three weeks ago, "AI engineering" was an abstract concept. Now it is a concrete set of skills: API integration, cost optimization, multimodal input, tool orchestration, error handling, caching strategy. You did not just learn these things — you built them. That is the difference between knowing and understanding. Carry that builder's mindset into Faza 2.

---

## Resources

- Your entire CLI codebase — the primary artifact of Faza 1
- [Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval) — Faza 2 preview
- [Building Effective Agents (Anthropic)](https://www.anthropic.com/research/building-effective-agents) — Faza 2 preview
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook) — reference implementations for everything you built

---

## Done When

- [ ] CLI tool refactored: clean code, proper file organization, consistent patterns
- [ ] All features work together: streaming + tools + vision + caching + cost tracking
- [ ] README is portfolio-ready: architecture, features, setup, usage, lessons learned
- [ ] All edge cases from the test list pass (or have clear, helpful error messages)
- [ ] Retrospective written: surprises, struggles, learnings, blog draft notes
- [ ] Faza 1 completion checklist: every item checked
- [ ] Honest self-assessment: "Am I ready for Faza 2?" — answer is "Yes"

---

*Faza 1: Complete. You have the foundations. Next week begins Faza 2 — the journey from "I can talk to the model" to "I can give the model the right information at the right time." Welcome to RAG, embeddings, and vector databases.*
