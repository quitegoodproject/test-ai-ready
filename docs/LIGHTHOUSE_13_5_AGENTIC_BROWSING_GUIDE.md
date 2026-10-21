---
title: "How to Pass Google Lighthouse 13.5 agentic-browsing (llms-txt & ard-schema / ai-catalog.json)"
published: true
description: "Step-by-step implementation guide and free CLI generator for passing Google Lighthouse 13.5.0's new agentic-browsing category (/llms.txt, /.well-known/ai-catalog.json ARD 1.0, and robots.txt Agentmap)."
tags: webdev, javascript, ai, performance
canonical_url: https://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt
---

Google Lighthouse 13.5.0 introduced an experimental **`agentic-browsing`** category (`--only-categories=agentic-browsing`) designed to test whether autonomous browsing agents (Chrome AI Agent, Gemini Assistant, OpenAI Operator, and Claude Computer Use) can discover a website's machine-readable documentation and structured tool catalogs without scraping raw DOM trees.

When we ran `npx test-ai-ready` across [50 production B2B SaaS and developer-tool domains](https://answerrail.com/research/2026-saas-50-truncation-benchmark), we found an unexpected split:
- **87% (41/47 reachable sites)** now serve a root `/llms.txt` file.
- **Only 19% (9/47 sites)** pass the `ard-schema` (`/.well-known/ai-catalog.json`) audit.
- **74% (35/47 sites)** still ship `/pricing` HTML payloads exceeding the **25,000-token** RAG retrieval window (`~100 KB`), causing `PerplexityBot` and `OAI-SearchBot` to drop **62%** of distinct visible pricing tiers.

Here is the exact technical checklist to score **100/100** in Google Lighthouse 13.5 `agentic-browsing` (`llms-txt` + `ard-schema`), plus a single open-source CLI command to generate both files automatically.

---

## 1. What Lighthouse 13.5 `agentic-browsing` Actually Audits

Lighthouse 13.5 evaluates two primary audits and a 3-stage resource discovery chain:

| Lighthouse 13.5 Audit ID | Underlying Spec | Endpoints & Pointers Checked | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **`llms-txt`** | `llmstxt.org` | `/llms.txt`, `/llms-full.txt`, `<link rel="describedby" href="/llms.txt">` | HTTP `200 OK`, `Content-Type: text/markdown`, valid H1 (`# Title`), `>` summary blockquote, categorized Markdown links, and `Access-Control-Allow-Origin: *`. |
| **`ard-schema`** | **ARD 1.0** (Agentic Resource Discovery) | `robots.txt` `Agentmap:`, `<link rel="ai-catalog">`, `/.well-known/ai-catalog.json`, `/.well-known/ard.json` | HTTP `200 OK`, `application/json`, `"specVersion": "1.0"`, valid URN (`urn:air:<domain>:<type>:<id>`), strict `url` XOR `data` mutual exclusivity, non-empty `representativeQueries`, and `Access-Control-Allow-Origin: *`. |

---

## 2. Step 1: Add `Agentmap:` and `Sitemap:` to `/robots.txt`

Lighthouse 13.5 resolves agent catalogs by checking `/robots.txt` first. Add the `Agentmap:` directive at the bottom of your `/robots.txt` file alongside explicit allow rules for AI search crawlers:

```txt
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
Sitemap: https://yourdomain.com/llms.txt
Agentmap: https://yourdomain.com/.well-known/ai-catalog.json
```

---

## 3. Step 2: Add Discovery `<link>` Relations to Your HTML `<head>`

If a crawler enters via a deep page URL rather than `/robots.txt`, it inspects the HTML `<head>` for link relations. Include all three link tags to satisfy `llms-txt`, Lighthouse 13.5 `ai-catalog`, and forward-compatible ARD draft parsers (`rel="ard"`):

```html
<link rel="describedby" href="https://yourdomain.com/llms.txt" />
<link rel="ai-catalog" href="https://yourdomain.com/.well-known/ai-catalog.json" />
<link rel="ard" href="https://yourdomain.com/.well-known/ard.json" />
```

---

## 4. Step 3: Serve `/.well-known/ai-catalog.json` (ARD 1.0 Schema)

The most common reason sites fail `ard-schema` in Lighthouse 13.5 is violating one of three schema invariants:
1. **Invalid URN format**: Every `identifier` must match `urn:air:<domain>:<category>:<slug>`.
2. **Value-or-Reference collision (`url` XOR `data`)**: An entry must specify *either* an external `url` *or* an inline `data` payload, never both in the same entry object.
3. **Missing `representativeQueries`**: Every entry must provide a non-empty array of natural-language buyer or task queries so agent routers can match user intent without fetching every file first.

Here is a complete, spec-compliant `/.well-known/ai-catalog.json` manifest:

```json
{
  "specVersion": "1.0",
  "entries": [
    {
      "identifier": "urn:air:yourdomain.com:docs:llms-txt",
      "displayName": "Official AI Documentation & Product Index (/llms.txt)",
      "type": "text/markdown",
      "url": "https://yourdomain.com/llms.txt",
      "representativeQueries": [
        "What products, features, and pricing tiers does yourdomain.com offer?",
        "How do I integrate or get started with yourdomain.com?",
        "Official technical documentation and architecture for yourdomain.com"
      ]
    },
    {
      "identifier": "urn:air:yourdomain.com:mcp:server",
      "displayName": "Model Context Protocol (MCP) Server & Tool Manifest",
      "type": "application/mcp-server-card+json",
      "url": "https://yourdomain.com/llms-tools.json",
      "representativeQueries": [
        "Audit a domain or query live pricing programmatically via MCP",
        "Inspect available agent tools and JSON schema endpoints"
      ]
    }
  ]
}
```

> **Important CORS Rule:** Browser-based agent sandboxes run preflight checks. Make sure both `/llms.txt` and `/.well-known/ai-catalog.json` return `Access-Control-Allow-Origin: *`.

---

## 5. Generate `/llms.txt` and `/.well-known/ai-catalog.json` Automatically (Free CLI)

Instead of hand-writing URN identifiers and Markdown indexes, you can crawl any live domain and generate both files locally into your repo using the open-source [`test-ai-ready`](https://github.com/quitegoodproject/test-ai-ready) CLI:

```bash
# Crawl your live site and write ./llms.txt + ./.well-known/ai-catalog.json locally ($0 Free)
npx test-ai-ready https://yourdomain.com --write

# Or run a full 25,000-token truncation + Lighthouse 13.5 readiness audit in terminal
npx test-ai-ready https://yourdomain.com/pricing
```

If you use **Claude Code** or **Cursor**, you can also attach the remote MCP server with zero local dependencies:

```bash
claude mcp add --transport http answerrail https://answerrail.com/mcp
```

---

## 6. Why Passing `/llms.txt` Alone Doesn't Stop Pricing Hallucinations (The 25k-Token Cliff)

Passing Lighthouse 13.5 `llms-txt` and `ard-schema` solves **discovery**, but when a buyer asks ChatGPT Search or Perplexity *"Compare [Your Product] vs [Competitor] pricing"*, the retrieval bot still fetches `https://yourdomain.com/pricing` directly.

In our [2026 50-Site SaaS Pricing & Truncation Benchmark](https://answerrail.com/research/2026-saas-50-truncation-benchmark):
- **Average raw `/pricing` HTML weight:** `163,511 tokens` (`~654 KB` of React/Next.js `__next_f` flight chunks, inline SVGs, and Shopify/Webflow DOM wrappers).
- **Safe RAG crawler ceiling:** `25,000 tokens` (`~100 KB`).
- **Two-Tier Architectural Rule:**
  1. **If your pages are under 25,000 HTML tokens:** You do **not** need an edge proxy. Just commit the static `/llms.txt` and `/.well-known/ai-catalog.json` files generated by `npx test-ai-ready <url> --write` (or copy them from `https://answerrail.com/report/yourdomain.com`).
  2. **If your pages exceed 25,000 HTML tokens (or use Shopify/Webflow where root `.well-known` routing is restricted):** Use [Next.js Markdown content negotiation (`@answerrail/next`)](https://www.npmjs.com/package/answerrail) or the [Cloudflare Worker / Edge CNAME guide](https://answerrail.com/geo/generate-llms-txt-shopify-wordpress-webflow) to serve clean Byte-0 Markdown tables to AI bots via `Accept: text/markdown` (`RFC 9110`) while keeping human HTML untouched.

---

### Useful References & Open-Source Tools
- **Full Lighthouse 13.5 `agentic-browsing` Reference & Live Generator:** [answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt](https://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt)
- **50-Site SaaS Truncation & ARD 1.0 Dataset (JSON + Methodology):** [answerrail.com/research/2026-saas-50-truncation-benchmark](https://answerrail.com/research/2026-saas-50-truncation-benchmark)
- **Shopify, Webflow & WordPress `/llms.txt` Cloudflare Worker Snippet:** [answerrail.com/geo/generate-llms-txt-shopify-wordpress-webflow](https://answerrail.com/geo/generate-llms-txt-shopify-wordpress-webflow)
- **GA4 Custom Channel Group Regex for AI Search Traffic:** [answerrail.com/geo/track-chatgpt-perplexity-referral-traffic-ga4](https://answerrail.com/geo/track-chatgpt-perplexity-referral-traffic-ga4)
- **Open-Source CLI & GitHub Action:** [github.com/quitegoodproject/test-ai-ready](https://github.com/quitegoodproject/test-ai-ready)
