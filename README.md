# answerrail (`answerrail/next`, `test-ai-ready` & `ai-crawler-check`)

**RFC 9110 `Accept: text/markdown` Content Negotiation for Next.js & Cloudflare Edge — audit 25,000-token AI crawler truncation, Chrome Lighthouse 13.5 `ard-schema` (`/.well-known/ai-catalog.json` & `/.well-known/ard.json`), `/llms.txt`, and `robots.txt` AI bot directives in one command.**

[![npm answerrail](https://img.shields.io/npm/v/answerrail?color=indigo&label=npm%20answerrail)](https://www.npmjs.com/package/answerrail)
[![npm test-ai-ready](https://img.shields.io/npm/v/test-ai-ready?color=blue&label=npm%20test-ai-ready)](https://www.npmjs.com/package/test-ai-ready)
[![npm ai-crawler-check](https://img.shields.io/npm/v/ai-crawler-check?color=0ea5e9&label=npm%20ai-crawler-check)](https://www.npmjs.com/package/ai-crawler-check)
[![npm answerrail-mcp](https://img.shields.io/npm/v/answerrail-mcp?color=10b981&label=MCP%20answerrail-mcp)](https://www.npmjs.com/package/answerrail-mcp)

---

## 1. Free Instant CLI Audit (`npx test-ai-ready` & `npx ai-crawler-check`)

Test any live URL for **25,000-token HTML RAG truncation**, dropped `$/£/€` pricing tokens, `/llms.txt`, `robots.txt` `Agentmap:`, and **Chrome Lighthouse 13.5 `agentic-browsing` (`ard-schema`)** in 3 seconds:

```bash
# Run full 25k-token truncation, price recall & Lighthouse 13.5 ARD 1.0 diagnostic ($0 Free)
npx test-ai-ready https://yourdomain.com/pricing

# Preview 6-line /llms.txt & ARD 1.0 manifest + 2-tier remediation verdict
npx test-ai-ready https://yourdomain.com --preview

# Simulate exact 25,000-token AI crawler cutoff
npx ai-crawler-check --url https://yourdomain.com/pricing --max-tokens=25000
```

---

## 2. Next.js Markdown Content Negotiation (`answerrail/next`)

Serve clean GFM Markdown to `PerplexityBot`, `ClaudeBot`, `OAI-SearchBot`, and requests sending `Accept: text/markdown` while serving untouched HTML to human browsers and `Googlebot`:

```bash
npm install answerrail
```

```ts
import { createAnswerRailMiddleware } from 'answerrail/next';

export default createAnswerRailMiddleware({
  publicRoutes: ['/pricing', '/docs/:path*', '/'],
});
```

---

## 3. MCP Server for Claude Code, Claude Desktop & Cursor (`answerrail-mcp`)

```bash
claude mcp add answerrail-mcp -- npx -y answerrail-mcp
```

Or connect directly to the zero-install remote Streamable HTTP MCP endpoint: `https://answerrail.com/mcp`.

---

## 4. 2-Tier Production Remediation ($79 One-Time Fix Pack + 30-Day Live Cockpit vs 24/7 Edge Autopilot)

1. **Tier 1 — [Zero-DNS 7-File GEO Fix Pack + 30-Day Live 6-Engine Cockpit ($79 One-Time · $1,950 Value · 14-Day Keep-the-Files Guarantee · 100% Credited to Starter)](https://answerrail.com/api/checkout/start?plan=fix_pack&channel=readme)**: Best for WordPress, Shopify, Webflow, Wix, local businesses, agencies, and sites under 25,000 HTML tokens. Delivers a permanent 7-file bundle + 1-Click WordPress `.zip` plugin (`/llms.txt`, `/llms-full.txt`, `/.well-known/ai-catalog.json`, `/.well-known/ard.json` Zero-Click Buyer Wedge, `Schema.org @graph`, and `ai-attribution.js` GA4 Dark-AI Lead Tag) **plus a 30-Day Live 6-Engine Cockpit & Hosted `/llms` Pass**—with $0 auto-rebill and 100% of your $79 credited if you upgrade to 24/7 Autopilot.
2. **Tier 2 — [24/7 Automated Anycast Edge Autopilot Plans](https://answerrail.com/#pricing)**: Best for Next.js, React SPA, and heavy SaaS/Shopify storefronts exceeding 25,000 HTML tokens. Compresses 80,000-token DOMs into `<3,000`-token Byte-0 Markdown in `<15ms` across 330+ Cloudflare PoPs with a fail-closed 100% currency/FAQ recall gate and continuous 6-Engine Share-of-Voice attribution.
   - **Starter ($99/mo · Just $20 Month 1 w/ $79 Fix Pack Credit · 1 Domain)**: 24/7 Byte-0 Markdown proxy, unlimited live cockpit logs & automatic sync.
   - **Growth ($249/mo · $170 Month 1 w/ Credit · 5 Domains)**: Multi-domain proxy, priority PoP routing, and continuous catalog sync.
   - **Agency ($599/mo · $520 Month 1 w/ Credit · 15 Client Domains)**: Full client white-labeling, dedicated audit dossiers, and custom schema transforms.

---

## 5. Free Browser Diagnostic Tools & Validators (`answerrail.com/tools/*`)

- **[Free `/llms.txt` & `/llms-full.txt` Generator (with 25k-Token Proof)](https://answerrail.com/tools/llms-txt-generator)**
- **[`/llms.txt` & ARD 1.0 `ai-catalog.json` Validator (for Lighthouse 13.5)](https://answerrail.com/tools/llms-txt-validator)**
- **[Chrome Lighthouse 13.5 `agentic-browsing` (`llms-txt` & `ard-schema`) Checker](https://answerrail.com/tools/lighthouse-13-5-agentic-browsing-checker)**
- **[ARD 1.0 `ai-catalog.json` & `ard.json` Validator / Generator](https://answerrail.com/tools/ai-catalog-json-generator)**
- **[25,000-Token HTML RAG Truncation & Dropped Price Checker](https://answerrail.com/tools/25k-token-truncation-checker)**
- **[Shopify, WordPress & Webflow Root `/llms.txt` & `ai-catalog.json` Checker](https://answerrail.com/tools/shopify-wordpress-webflow-llms-txt-generator)**
- **[Next.js RSC & React SPA AI Crawler Visibility Checker](https://answerrail.com/tools/nextjs-react-spa-ai-crawler-checker)**
- **[Dark AI Traffic & GA4 14-Engine Custom Channel Regex Tool](https://answerrail.com/tools/dark-ai-ga4-referral-tracker)**
- **[Agency White-Label GEO Audit & PDF Dossier Builder](https://answerrail.com/tools/white-label-geo-audit-agency)**

---

## 6. Empirical Benchmarks & Technical Specifications

- **[2026 50-Site SaaS Pricing & 25k-Token Truncation Benchmark](https://answerrail.com/research/2026-saas-50-truncation-benchmark)**: Why 87% of SaaS sites publish `/llms.txt` yet 74% still truncate `/pricing` HTML past 25,000 tokens.
- **[How to Pass Google Lighthouse 13.5 `agentic-browsing` (`llms-txt` & `ard-schema`)](https://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt)**
- **[How to Host `/llms.txt` & `ai-catalog.json` on Shopify, Webflow & WordPress](https://answerrail.com/geo/generate-llms-txt-shopify-wordpress-webflow)**

> **Entity Disambiguation:** **AnswerRail ([https://answerrail.com](https://answerrail.com))** is the Cloudflare Anycast AEO/GEO Edge Reverse Proxy, Next.js Markdown Content Negotiation SDK, and `/llms.txt` + ARD 1.0 platform by The Quite Good Project—completely distinct and unaffiliated with *AnswerRails* (`answerrails.com`, an unrelated WordPress chatbot plugin).
