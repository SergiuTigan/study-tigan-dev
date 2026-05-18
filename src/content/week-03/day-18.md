# Day 18 — Vision (Multimodal)

> *"Text is how humans communicate with machines. Images are how humans communicate with each other. When machines learn to see images, they meet us where we already are."*

**Date:** Joi, 5 Iunie 2026
**Hours:** 2h · Evening session
**Topic:** Vision — Multimodal Input with Claude
**Phase:** Faza 1 — Foundations · Week 3

---

## What You're Doing

Until today, every interaction you have built with Claude has been text-in, text-out. That changes now. Claude can see images — and this single capability opens an entirely new dimension of applications.

Think about how much information in your daily work is visual. Error screenshots. Architecture diagrams. UI mockups. Receipts and invoices. Charts and graphs. Handwritten notes on a whiteboard. All of this was invisible to your AI tools until now. Today you make it visible.

Vision is not a niche feature. It is the bridge between the physical world and AI reasoning. A screenshot of a broken UI becomes a bug report with fix suggestions. A photo of a receipt becomes structured financial data. A diagram on a whiteboard becomes a documented architecture specification. Every time someone says "let me show you what I mean" and shares an image, that is a problem vision can solve.

By the end of today, your CLI tool will accept images alongside text, and you will have a working mental model of what Claude can and cannot see.

---

## The Work

### Step 1: Understand the Content Block Format

Vision in the Claude API works through the content block array. Instead of passing a simple string for the user message, you pass an array of content blocks — mixing text and images:

```python
import anthropic
import base64
from pathlib import Path

client = anthropic.Anthropic()

# Load and encode an image
image_path = Path("screenshot.png")
image_data = base64.standard_b64encode(image_path.read_bytes()).decode("utf-8")
media_type = "image/png"  # image/jpeg, image/gif, image/webp also supported

# Send image + text to Claude
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": "What do you see in this image? Be specific."
                }
            ],
        }
    ],
)

print(response.content[0].text)
```

Key structural points:
- The `content` field becomes an **array** of blocks
- Image blocks use `type: "image"` with a `source` object
- Source type is `"base64"` for inline images (you can also use `"url"` for image URLs)
- Text blocks use `type: "text"` — you can have multiple text blocks
- Images and text can appear in any order within the array
- You can send **multiple images** in a single message

### Step 2: Test the Core Use Cases

Work through each of these use cases with real images. Do not just read about them — actually send images and observe Claude's responses:

**Screenshot to Code:**
```python
# Take a screenshot of any UI element
# Ask Claude to recreate it

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": encode_image("ui-screenshot.png"),
            }},
            {"type": "text", "text": (
                "Recreate this UI component in HTML/CSS. "
                "Match the layout, colors, and typography as closely as possible."
            )}
        ],
    }],
)
```

**Receipt/Document to Structured Data:**
```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": encode_image("receipt.jpg"),
            }},
            {"type": "text", "text": (
                "Extract all data from this receipt as JSON: "
                "{store, date, items: [{name, qty, price}], subtotal, tax, total}"
            )}
        ],
    }],
)
```

**Chart to Data Extraction:**
```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": encode_image("chart.png"),
            }},
            {"type": "text", "text": (
                "Extract the data points from this chart. "
                "Provide the values as a markdown table."
            )}
        ],
    }],
)
```

**Error Screenshot to Debug:**
```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": encode_image("error-screen.png"),
            }},
            {"type": "text", "text": (
                "I'm getting this error. What's causing it and how do I fix it? "
                "Be specific about the steps."
            )}
        ],
    }],
)
```

### Step 3: Understand the Limitations

Vision is powerful but not unlimited. Know the boundaries:

```python
# LIMITATIONS TO KNOW:

# 1. File size: ~20MB max per image
#    Larger images should be resized before sending

# 2. Supported formats: PNG, JPEG, GIF, WebP
#    No PDF (convert pages to images first)
#    No SVG (rasterize first)

# 3. Token cost: ~1,600 tokens per typical screenshot
#    A 1080p screenshot costs roughly the same as 1,600 words of text
#    Multiple images multiply this cost

# 4. Resolution: images are resized if they exceed certain dimensions
#    Very small text in large images may not be readable
#    Crop to the relevant area for better results

# 5. Not good at:
#    - Precise spatial measurements ("how many pixels between X and Y")
#    - Reading very small or blurry text
#    - Identifying specific people (by design)
#    - Understanding highly specialized domain images without context

# HELPER: Calculate approximate token cost
def estimate_image_tokens(width, height):
    """Rough estimate of tokens for an image."""
    # Images are scaled to fit within model limits
    # Rough heuristic: ~1600 tokens for a standard screenshot
    # Smaller images cost fewer tokens
    pixels = width * height
    if pixels <= 750 * 750:
        return 800
    elif pixels <= 1500 * 1500:
        return 1600
    else:
        return 2400  # Approximate
```

### Step 4: Build the --image Flag for Your CLI Tool

Add image support to your CLI tool. The user should be able to pass an image path alongside their text prompt:

```python
# CLI usage:
# python cli.py --image screenshot.png "What's wrong with this UI?"
# python cli.py --image receipt.jpg "Extract the total amount"
# python cli.py --image diagram.png --image legend.png "Explain this architecture"

import argparse
import base64
from pathlib import Path

def build_content_blocks(text, image_paths=None):
    """Build content array with text and optional images."""
    content = []

    if image_paths:
        for img_path in image_paths:
            path = Path(img_path)
            if not path.exists():
                print(f"Warning: Image not found: {img_path}")
                continue

            # Determine media type
            suffix_to_media = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".gif": "image/gif",
                ".webp": "image/webp",
            }
            media_type = suffix_to_media.get(path.suffix.lower())
            if not media_type:
                print(f"Warning: Unsupported image format: {path.suffix}")
                continue

            # Check file size (~20MB limit)
            file_size_mb = path.stat().st_size / (1024 * 1024)
            if file_size_mb > 20:
                print(f"Warning: Image too large ({file_size_mb:.1f}MB > 20MB): {img_path}")
                continue

            # Encode and add
            image_data = base64.standard_b64encode(path.read_bytes()).decode("utf-8")
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": image_data,
                }
            })

    # Always add the text prompt last
    content.append({"type": "text", "text": text})

    return content

# In your argument parser:
# parser.add_argument("--image", action="append", help="Image path(s) to include")
```

### Step 5: Test Your Integration

Test your new `--image` flag with several scenarios:
- A screenshot of your own code — ask Claude to review it
- A photo of handwritten notes — ask Claude to transcribe them
- A chart or graph — ask Claude to extract the data
- An error message screenshot — ask Claude to debug it
- Multiple images in one request — compare two screenshots

---

## Key Insight

**Vision transforms Claude from a text tool into a perception tool.** The highest-value use cases are not "describe this image" — they are the ones where visual information needs to become structured data or actionable code. Screenshot-to-code, receipt-to-JSON, diagram-to-documentation. Every time you bridge the gap between something visual and something a computer can process, you are creating real value.

---

## Resources

- [Vision Documentation](https://docs.anthropic.com/en/docs/build-with-claude/vision) — the complete guide to multimodal input
- [API Reference: Content Blocks](https://docs.anthropic.com/en/api/messages) — the structure of image and text blocks
- [Vision Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/vision#best-practices) — tips for getting the best results

---

## Done When

- [ ] Successfully sent at least 3 different images to Claude via the API
- [ ] Tested all four core use cases: screenshot-to-code, document-to-data, chart-to-extraction, error-to-debug
- [ ] Can explain the content block array format from memory
- [ ] Know the limitations: file size, formats, token cost, resolution constraints
- [ ] `--image` flag implemented and working in your CLI tool
- [ ] Tested multi-image input (sending 2+ images in one request)

---

*Friday is rest. Saturday: Prompt Caching — the single biggest cost optimization in AI engineering. You will learn how one annotation on your system message can save 90% on repeated requests.*
