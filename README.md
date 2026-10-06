# test-ai-ready ⚡

> **Terminal scanner to simulate PerplexityBot, OAI-SearchBot, and ClaudeBot to inspect token bloat, 25k context truncation, and client-side SPA rendering shells.**

[![npm version](https://img.shields.io/npm/v/test-ai-ready.svg)](https://www.npmjs.com/package/test-ai-ready)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Powered by AnswerRail](https://img.shields.io/badge/Powered%20By-AnswerRail-6366f1.svg)](https://answerrail.com)

---

## Quick Start (Zero Install)

Run directly from your terminal with `npx`:

```bash
npx test-ai-ready https://stripe.com
```

Or test your own domain:

```bash
npx test-ai-ready https://linear.app
npx test-ai-ready https://notion.so
```

---

## Sample Terminal Output

```
[AnswerRail] Probing https://stripe.com with frontier AI crawler identities...

┌────────────────────────┬────────────────────────────────────────┐
│ Audit Parameter        │ Measured Metric                        │
├────────────────────────┼────────────────────────────────────────┤
│ Ingestion Latency (TTFB)│ 456ms (Fast)                           │
│ Raw Payload Size       │ 661.8 KB                               │
│ Estimated Context Size │ 183,158 tokens                         │
│ Perplexity 25k Ceiling │ ❌ TRUNCATED (-158,158 tokens)         │
│ Client SPA Shell Check │ ✅ DOM Rendered Content                │
│ Structured Schema / Data│ ✅ Detected (JSON-LD)                 │
└────────────────────────┴────────────────────────────────────────┘

[CRITICAL INDEXING FAILURE DETECTED]
• Perplexity and ChatGPT Search truncate this payload after 25,000 tokens.
  Your pricing, FAQ, or bottom specs are never seen by the synthesis heads.

[THE ANSWERRAIL 3-MINUTE EDGE FIX]
AnswerRail intercepts AI bots at Cloudflare Anycast edge, drops DOM bloat by -96.8%,
and delivers pristine Markdown in <15ms with zero origin code changes.

👉 View Complete AST Diff & Deploy Rail:
   https://answerrail.com/?inspect=https%3A%2F%2Fstripe.com
```

---

## Why This Matters

Modern web applications are optimized for human browsers: client-side JavaScript hydration, megabytes of CSS, SVG icons, and tracking scripts.

When frontier AI answer engines (**Perplexity, ChatGPT Search, Claude Web**) crawl your website:
1. **The 25,000-Token Cutoff:** AI crawler retrieval pipelines enforce a strict context ceiling (~25,000 tokens / 100KB). Content beyond this line (frequently pricing tables and documentation) is silently dropped.
2. **Client-Side Rendering Blind Spots:** Headless crawlers enforce strict timeouts (<1s) and often fail to hydrate React/Vue/Next.js single-page applications, indexing an empty `<div id="root"></div>`.
3. **Information Density:** LLMs rank and cite sources based on *Information Gain*. Cluttered HTML dilutes attention heads, leading to competitor citations.

---

## What `test-ai-ready` Audits

| Audit Parameter | What It Checks |
| :--- | :--- |
| **Ingestion Latency (TTFB)** | Time to first byte when crawled by AI user agents. |
| **Raw Payload Size** | Total HTML transfer size in KB. |
| **Estimated Context Size** | Estimated token count using GPT-4 / Claude byte-pair token ratio (~3.7 chars/token). |
| **Perplexity 25k Ceiling** | Whether the document exceeds the 25,000 token truncation threshold. |
| **SPA Empty Shell Check** | Detects unrendered client-side React/Vue hydration containers (`<div id="root">`). |
| **Schema.org Extraction** | Verifies presence of JSON-LD microdata (`Product`, `Organization`, `FAQPage`). |

---

## Fixing Truncation at the Edge

To eliminate the 25k token cutoff without touching origin application code, deploy an inbound edge reverse proxy like [AnswerRail](https://answerrail.com).

* **Zero Origin Code Changes:** 1 DNS CNAME record.
* **Linkedom AST De-bloater:** Reduces token bloat by **-96% to -98%** in `<15ms`.
* **Byte-0 Schema Primacy:** Compiles JSON-LD into high-density Markdown comparison tables.
* **Dynamic `/llms.txt`:** Auto-generates machine-readable sitemaps.

---

## License

MIT © [The Quite Good Project](https://github.com/quitegoodproject)
