# Day 17 — Anthropic Official Courses

> *"The people who built the system always know things about it that never make it into the documentation. Go to the source."*

**Date:** Miercuri, 4 Iunie 2026
**Hours:** 2h · Evening session
**Topic:** Anthropic Official Courses — Edge Cases & API Mastery
**Phase:** Faza 1 — Foundations · Week 3

---

## What You're Doing

Yesterday you completed an external course on Claude. Today you go directly to the source: Anthropic's own educational materials, hosted on GitHub. These are not polished video courses — they are notebooks, exercises, and documentation written by the people who built the API. The tone is different. The depth is different. And critically, the edge cases covered here are the ones that only the creators know about.

Your mission today is specific and surgical: **eliminate every remaining "unknown unknown" in the basic API.** After two weeks of building and one external course, you have a strong mental model of how Claude works. But there are corners of the API you have not explored — behaviors that only surface in specific situations, parameters you have not tested, response patterns you have not encountered. Today is the day you hunt those down.

This is the difference between knowing an API and *mastering* it. A developer who knows the API can build the happy path. A developer who has mastered it can debug the unhappy path at 2 AM without checking the docs.

---

## The Work

### Step 1: Clone and Explore the Repository

```bash
git clone https://github.com/anthropics/courses.git
cd courses
```

Explore the repository structure. Look for the sections covering API fundamentals, prompt engineering, and any advanced topics. The repository is organized into modules — identify which ones are most relevant to your current knowledge gaps.

### Step 2: Focus Area — Multi-Turn Formatting Gotchas

Multi-turn conversations are where most production bugs hide. Work through any exercises covering conversation management, and specifically test these patterns:

```python
import anthropic

client = anthropic.Anthropic()

# Gotcha 1: Role alternation requirement
# Messages MUST alternate between user and assistant
# This will fail:
bad_messages = [
    {"role": "user", "content": "Hello"},
    {"role": "user", "content": "Are you there?"}  # Two user messages in a row
]

# This works — combine them:
good_messages = [
    {"role": "user", "content": "Hello\n\nAre you there?"}
]

# Gotcha 2: Conversation must start with user role
# The first message in the array must always be role: "user"
# (system message is separate, passed via the system parameter)

# Gotcha 3: Content can be string OR array of content blocks
# Both are valid:
string_content = {"role": "user", "content": "Hello"}
array_content = {"role": "user", "content": [
    {"type": "text", "text": "Hello"}
]}
# The array form is required when mixing text with images
```

### Step 3: Focus Area — Stop Reasons

Every API response includes a `stop_reason` field. Understanding every possible value is essential for production code:

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}]
)

# stop_reason values:
# "end_turn"    — Claude finished its response naturally
# "max_tokens"  — Response was cut off (hit your max_tokens limit)
# "stop_sequence" — Hit a custom stop sequence you specified
# "tool_use"    — Claude wants to call a tool

# Production pattern: always check stop_reason
if response.stop_reason == "max_tokens":
    print("Warning: response was truncated")
    # Consider: retry with higher max_tokens,
    # or ask Claude to continue

if response.stop_reason == "tool_use":
    # Extract tool call and execute
    tool_block = next(
        b for b in response.content if b.type == "tool_use"
    )
    # ... handle tool execution
```

### Step 4: Focus Area — Prefilled Assistant Messages

This is a power technique many developers miss. You can start Claude's response with specific text by including a partial assistant message:

```python
# Force Claude to respond in JSON by starting its response with {
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "List 3 fruits as JSON"},
        {"role": "assistant", "content": "{"}  # Prefill forces JSON start
    ]
)

# Claude's response continues from where you left off
# The full response is: { + whatever Claude generates
full_json = "{" + response.content[0].text

# More advanced prefill — force a specific format:
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Analyze this code for bugs"},
        {"role": "assistant", "content": "## Bug Analysis\n\n1."}
    ]
)
# Claude continues from "1." in the format you established

# WARNING: When using prefill, the response.content[0].text
# does NOT include your prefill — you must prepend it yourself
```

### Step 5: Focus Area — Beta Headers and Experimental Features

Anthropic regularly releases features behind beta headers. Understanding this mechanism keeps you current:

```python
# Beta features are accessed via the anthropic-beta header
# Check the docs for current beta features

# Example: extended thinking, token counting, etc.
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=8096,
    messages=[{"role": "user", "content": "Complex analysis..."}],
    # Beta features enabled via betas parameter in the SDK
    # betas=["feature-name-2025-01-01"]
)

# The pattern: Anthropic releases experimental features
# behind version-dated beta headers. These may change or
# be promoted to stable. Always check the changelog.
```

### Step 6: Edge Case Sweep

Work through the official exercises and test every edge case you can think of:

```python
# Edge case checklist:
# [ ] What happens with empty string content?
# [ ] What's the behavior with max_tokens=1?
# [ ] How does the API handle unicode, emoji, code blocks?
# [ ] What happens if you send a very long system prompt?
# [ ] How are rate limits communicated? (429 status, retry-after header)
# [ ] What does a timeout look like vs an API error?
# [ ] Can you send the same tool_use_id twice?
# [ ] What happens if tool_result content is empty?
# [ ] How does the API handle very large conversation histories?
```

### Step 7: Document Your Findings

Create a personal "API Gotchas" reference — a quick-reference document of every non-obvious behavior you discovered:

```markdown
## My Claude API Gotchas Reference

### Messages
- Messages must alternate user/assistant
- First message must be user role
- Content can be string or array of blocks

### Stop Reasons
- Always check stop_reason in production
- "max_tokens" means truncated output

### Prefilled Assistant
- Prepend your prefill to response text manually
- Great for forcing JSON, markdown, specific formats

### Beta Features
- Check changelog monthly for new beta headers
- Beta features have version-dated names

### Discovered Today
- [your findings]
```

---

## Key Insight

**Mastery is not about knowing every feature — it is about having zero surprises.** When you encounter an unexpected API behavior in production, the cost is not the bug itself but the time spent confused about why it happened. Every edge case you explore today is an hour saved debugging later.

---

## Resources

- [Anthropic Official Courses (GitHub)](https://github.com/anthropics/courses) — the primary resource for today
- [API Reference](https://docs.anthropic.com/en/api/messages) — cross-reference as you work through exercises
- [Anthropic Changelog](https://docs.anthropic.com/en/docs/about-claude/models) — check for recent additions or changes
- [API Errors Documentation](https://docs.anthropic.com/en/api/errors) — every error type and how to handle it

---

## Done When

- [ ] Anthropic courses repository cloned and explored
- [ ] API fundamentals section completed
- [ ] Multi-turn formatting gotchas tested and documented
- [ ] Stop reasons: can explain every possible value and its production implications
- [ ] Prefilled assistant messages: tested and added to your toolkit
- [ ] Beta headers mechanism: understood and documented
- [ ] Personal "API Gotchas" reference created
- [ ] Honest answer to: "Are there any basic API behaviors that would surprise me?" is "No"

---

*Tomorrow: Vision. Claude learns to see. You will send images through the API and unlock an entirely new category of applications — screenshots, documents, diagrams, and everything visual.*
