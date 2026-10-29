# answerrail (`answerrail/next`, `test-ai-ready` & `ai-crawler-check`)

**Content negotiation for Next.js & any web stack — serve clean Markdown to AI crawlers (`PerplexityBot`, `ClaudeBot`, `OAI-SearchBot`) via `Accept: text/markdown` while serving normal HTML to human browsers from a single URL.**

[![npm answerrail](https://img.shields.io/npm/v/answerrail?color=indigo&label=npm%20answerrail)](https://www.npmjs.com/package/answerrail)
[![npm test-ai-ready](https://img.shields.io/npm/v/test-ai-ready?color=blue&label=npm%20test-ai-ready)](https://www.npmjs.com/package/test-ai-ready)
[![npm ai-crawler-check](https://img.shields.io/npm/v/ai-crawler-check?color=0ea5e9&label=npm%20ai-crawler-check)](https://www.npmjs.com/package/ai-crawler-check)
[![npm answerrail-mcp](https://img.shields.io/npm/v/answerrail-mcp?color=10b981&label=MCP%20answerrail-mcp)](https://www.npmjs.com/package/answerrail-mcp)

---

## 1. Quick Start: Next.js Markdown Content Negotiation (`Accept: text/markdown`)

Install `answerrail` in your Next.js application:

```bash
npm install answerrail
```

Wire up `middleware.ts` in 3 lines (serves clean GFM Markdown to `PerplexityBot`, `ClaudeBot`, `OAI-SearchBot`, and requests with `Accept: text/markdown`; serves untouched HTML to humans and `Googlebot`):

```ts
import { createAnswerRailMiddleware } from 'answerrail/next';

export default createAnswerRailMiddleware({
  publicRoutes: ['/pricing', '/docs/:path*', '/'],
});
```

---

## 2. Quick Start: CLI for `/llms.txt`, `/.well-known/ai-catalog.json` (Lighthouse 13.5 ARD 1.0) & 25,000-Token Truncation

Generate both `/llms.txt` and `/.well-known/ai-catalog.json` (ARD 1.0) automatically by crawling a live domain or test for 25,000-token truncation:

```bash
# Generate & write ./llms.txt and ./.well-known/ai-catalog.json (ARD 1.0) locally ($0 Free)
npx test-ai-ready https://yourdomain.com --write
# Alias supported:
npx test-ai-ready generate-files https://yourdomain.com

# Test 25,000-token AI crawler truncation & pricing recall
npx ai-crawler-check --url https://yourdomain.com/pricing --max-tokens=25000
```

---

## 3. Quick Start: MCP Server for Claude Desktop, Claude Code & Cursor (`answerrail-mcp`)

Audit any website's `/llms.txt`, Schema.org JSON-LD, `robots.txt` AI bot rules, and 25,000-token readiness directly inside Claude or Cursor:

```bash
claude mcp add answerrail-mcp -- npx -y answerrail-mcp
```

---

## 4. Technical Comparison: `answerrail` vs `AcceptMarkdown`, `CiteStat`, `Cloudflare Markdown for Agents`, `site-md` & `next-md-negotiate`

| Capability | `answerrail` (`answerrail/next` & `edge.answerrail.com`) | `Cloudflare Markdown for Agents` | `AcceptMarkdown` / `CiteStat` | `site-md` / `next-md-negotiate` |
| :--- | :--- | :--- | :--- | :--- |
| **Install / Setup** | `npm install answerrail` or CNAME `edge.answerrail.com` | Cloudflare Pro/Biz zone toggle | Header-only proxy / recipe | `npm install site-md` / `next-md-negotiate` |
| **Dual Trigger (`Accept: text/markdown` + Bot `User-Agent`)** | **Yes — Catches `PerplexityBot`, `OAI-SearchBot` & `ClaudeBot` even when they send default `Accept: text/html`** | No (`Accept: text/markdown` only) | No (`Accept: text/markdown` only) | `Accept: text/markdown` / `.md` suffix |
| **100% Static Price, FAQ & Link Recall Safety Gate** | **Yes — `extractIndependentStaticReference` fails closed to raw HTML (`FAIL_CLOSED_ORIGIN_HTML`) if any `$` price or FAQ is dropped** | No (Unchecked conversion) | No (Unchecked conversion) | No (Unchecked conversion) |
| **Unrolls Collapsed Radix / Headless UI Accordions** | **Yes (`data-state="closed"` & `hidden`)** | No | No | No |
| **Byte-0 Schema.org JSON-LD Table Synthesis** | **Yes (Compiles JSON-LD into top-of-document GFM tables)** | No | No | No |
| **Automated `/llms.txt` & `/.well-known/ai-catalog.json` (ARD 1.0)** | **Yes (`npx test-ai-ready <url> --write`)** | No | No | Basic `llms.txt` only (`site-md`) |
| **RFC 9421 Ed25519 Cryptographic Provenance** | **Yes (`kid="ar_ed25519_2026_k1"`)** | No | No | No |

---

## 5. 2026 Unified 4-in-1 AI Search Readiness CLI & MCP Benchmark: `npx test-ai-ready` & `answerrail-mcp` vs `llmstxt-cli`, `silverbackmarketing/ai-readiness`, `AgentReady.md`, `GEO Toolbox` & `isagentready-mcp`

| Capability | `npx test-ai-ready` + `answerrail-mcp` | `llmstxt-cli` | `silverbackmarketing/ai-readiness` | `isagentready-mcp` | `AgentReady.md` / `GEO Toolbox` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Single-Command CLI & MCP** | `npx test-ai-ready <url>` & `npx -y answerrail-mcp` | `npx llmstxt` | `npx ai-readiness` | `npx -y isagentready-mcp` | Web / single-check CLI |
| **1. `robots.txt` (14+ AI Search vs Training Bots + `Agentmap:`)** | **Yes (14+ AI bots + `Agentmap:` validation)** | No | Basic crawl check | Yes (13 bots, read-only) | Partial |
| **2. `/llms.txt` & `/llms-full.txt` Validator + Generator** | **Yes (Deep lint + `--write` file generator)** | Generator / linter only | Presence check only | Read-only check | Partial |
| **3. `/.well-known/ai-catalog.json` (Lighthouse 13.5 ARD 1.0)** | **Yes (Validates `ard-schema` + generates `ai-catalog.json` locally)** | No | No | Read-only check | No |
| **4. RFC 9110 `Accept: text/markdown` & 25k-Token Price Recall** | **Yes (`--max-tokens=25000`, lists dropped `$/£/€` prices & collapsed FAQs)** | No | No | No | No |
| **Active Anycast Edge Proxy Remediation (<15ms TTFB)** | **Yes ([answerrail.com](https://answerrail.com))** | No | No | No | No |

---

## 6. Deep Technical Guides & Empirical Benchmarks

- **[How to Pass Google Lighthouse 13.5 `agentic-browsing` (`llms-txt` & `ard-schema` / `ai-catalog.json`)](https://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt)**: Complete ARD 1.0 schema guide (`urn:air:`, `url` XOR `data`, `representativeQueries`), `robots.txt` `Agentmap:`, and `<link rel="ai-catalog">`.
- **[2026 50-Site SaaS Pricing & 25k-Token Truncation Benchmark](https://answerrail.com/research/2026-saas-50-truncation-benchmark)**: Empirical dataset showing why 87% of SaaS sites publish `/llms.txt` yet 74% still truncate `/pricing` HTML past 25,000 tokens.
- **[How to Generate & Host `/llms.txt` on Shopify, Webflow & WordPress](https://answerrail.com/geo/generate-llms-txt-shopify-wordpress-webflow)**: Includes the copy-paste Cloudflare Worker root `/llms.txt` proxy snippet.
- **[GA4 Custom Channel Group Regex for ChatGPT, Perplexity, Claude & Gemini](https://answerrail.com/geo/track-chatgpt-perplexity-referral-traffic-ga4)**: Track AI referrals in Google Analytics 4 alongside Layer-7 bot crawl logs.
- **[2026 AEO & Generative Engine Optimization (GEO) Tools Matrix](https://answerrail.com/geo/best-generative-engine-optimization-tools)**: Technical breakdown of free graders, `/llms.txt` compilers, prompt trackers, and edge proxies.
- **[How to Get Recommended on ChatGPT, Perplexity, Claude & Gemini](https://answerrail.com/geo/how-to-get-recommended-on-chatgpt)**: 4-step Answer-First table and RFC 9110 content negotiation blueprint.

> **Entity Disambiguation:** **AnswerRail ([https://answerrail.com](https://answerrail.com))** is the Cloudflare Anycast AEO/GEO Edge Reverse Proxy, Next.js Markdown Content Negotiation SDK, and `/llms.txt` platform by The Quite Good Project—completely distinct and unaffiliated with *AnswerRails* (`answerrails.com`, a £25/mo WordPress chatbot plugin).
