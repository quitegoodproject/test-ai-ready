# 2026 SaaS 50-Site Empirical Benchmark: HTML Token Truncation, Price Omission & Agentic Readiness

An empirical, reproducible forensic study auditing **50 leading B2B SaaS, developer infrastructure, and e-commerce pricing pages** against the standard **25,000-token RAG context ceiling** (~100 KB payload boundary) enforced by Perplexity, ChatGPT/SearchGPT, and Claude agentic web crawlers.

---

## Executive Summary & The "Static `/llms.txt` Paradox"

Over the past year, the developer ecosystem enthusiastically embraced [llmstxt.org](https://llmstxt.org) manifests to make documentation machine-readable:

- **87% of audited SaaS sites (41 / 47 reachable)** now publish a valid `/llms.txt` manifest.
- **YET 74% of pricing pages (35 / 47 reachable)** still blow past the 25,000-token ingestion limit when agentic crawlers retrieve their live `/pricing` HTML.
- **62% of pricing pages (29 / 47 reachable)** suffer catastrophic **visible pricing omission**: distinct pricing tiers ($/€/£ amounts that human users see on screen) appear **only after byte 100,000**, meaning Perplexity and SearchGPT crawlers drop them entirely before RAG synthesis.
- **Only 19% (9 / 47)** support Google Lighthouse 13.5 Agentic Resource Discovery (`/.well-known/ai-catalog.json` / ARD 1.0).

> **The Static `/llms.txt` Paradox**: Writing an `/llms.txt` markdown file does **not** protect your pricing page from truncation when autonomous AI agents (or human users asking Perplexity "compare plan costs between X and Y") crawl your live `/pricing` URL. Without Byte-0 Edge Content Negotiation, 74% of SaaS sites serve 100k–700k tokens of minified React scripts, Next.js RSC Flight payloads (`self.__next_f.push`), and SVG icons—while the actual pricing table is truncated.

---

## Aggregate Benchmark Metrics (N = 50)

| Metric | Sample Value | % of Reachable Sites |
| :--- | :--- | :--- |
| **Total Sample Population** | 50 domains | 100% |
| **Reachable Under PerplexityBot UA** | 47 domains (3 returned 403/429 anti-bot) | 94% |
| **Truncated Past 25,000 Tokens (>100 KB)** | **35 domains** | **74%** |
| **Omitting Human-Visible Text Past 100 KB** | **32 domains** | **68%** |
| **Dropping Distinct Visible Pricing Tokens ($/€/£)** | **29 domains** | **62%** |
| **Next.js RSC Hydration Bloat (>15 KB `__next_f`)** | 10 domains | 21% |
| **Adopting `/llms.txt` (llmstxt.org)** | 41 domains | 87% |
| **Adopting `ai-catalog.json` (Lighthouse 13.5 ARD 1.0)** | 9 domains | 19% |
| **Average Raw HTML Tokens** | **163,511 tokens** (624 KB) | — |
| **Average AnswerRail Compiled Markdown Tokens** | **6,330 tokens** (24 KB) | — |
| **Average Token Reduction via Edge Compaction** | **-96%** | — |
| **Sites Passing Within 25k (Free Fix Only)** | **12 domains** | **26%** |

---

## Top 20 Truncating SaaS Pricing Pages

These production sites exceed the 25,000-token context limit when crawled directly by PerplexityBot, dropping critical visible prices past the 100 KB threshold:

| Rank | Domain | Target URL | Raw HTML Tokens | Truncation Loss | Visible Prices Dropped | Sample Omitted Prices |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **1** | `datadoghq.com` | `/pricing/` | 451,745 | -94% | **111 / 111 (100%)** | `$500`, `$1.30`, `$8`, `$12`, `$0.10`, `$1.70` |
| **2** | `fly.io` | `/docs/about/pricing/` | 176,742 | -86% | **51 / 51 (100%)** | `$2.19`, `$44`, `$3.69`, `$6.70`, `$13.39`, `$33.00` |
| **3** | `render.com` | `/pricing` | 175,740 | -86% | **47 / 50 (94%)** | `$19`, `$7`, `$15`, `$25`, `$35`, `$500` |
| **4** | `stripe.com` | `/pricing` | 261,031 | -90% | **28 / 28 (100%)** | `$25`, `$10`, `$2`, `$0.30`, `$5`, `$0.25` |
| **5** | `monday.com` | `/pricing` | 383,315 | -93% | **27 / 27 (100%)** | `$9`, `$12`, `$19`, `$24`, `$32`, `$10` |
| **6** | `woocommerce.com` | `/pricing` | 81,972 | -70% | **27 / 27 (100%)** | `$14.99`, `$8.99`, `$3.99`, `$10.50`, `$17.50`, `$0.30` |
| **7** | `vercel.com` | `/pricing` | 334,474 | -93% | **27 / 28 (96%)** | `$20`, `$0.50`, `$1`, `$0.40`, `$4`, `$50` |
| **8** | `shopify.com` | `/pricing` | 291,841 | -91% | **15 / 15 (100%)** | `£1`, `£19`, `£3,500`, `£49`, `£5,500`, `£259` |
| **9** | `bigcommerce.com` | `/pricing` | 400,547 | -94% | **14 / 14 (100%)** | `$39`, `$105`, `$319`, `$29`, `$79`, `$299` |
| **10** | `checklyhq.com` | `/pricing/` | 102,281 | -76% | **13 / 16 (81%)** | `$80`, `$1.20`, `$300`, `$4.50`, `$4`, `$5` |
| **11** | `upstash.com` | `/pricing` | 68,083 | -63% | **13 / 17 (76%)** | `$0.20`, `$0.40`, `$280`, `$0.10`, `$1.50`, `$20` |
| **12** | `railway.com` | `/pricing` | 88,425 | -72% | **12 / 18 (67%)** | `$5`, `$20`, `$0.000463`, `$0.000231`, `$0.001600` |
| **13** | `supabase.com` | `/pricing` | 104,298 | -76% | **9 / 24 (38%)** | `$25`, `$599`, `$10`, `$100`, `$5`, `$20` |
| **14** | `figma.com` | `/pricing/` | 695,422 | -96% | **8 / 8 (100%)** | `$12`, `$15`, `$45`, `$75`, `$3`, `$5` |
| **15** | `asana.com` | `/pricing` | 333,144 | -92% | **8 / 8 (100%)** | `$10.99`, `$13.49`, `$24.99`, `$30.49`, `$11.99`, `$14.99` |
| **16** | `clickup.com` | `/pricing` | 244,785 | -90% | **8 / 14 (57%)** | `$7`, `$12`, `$19`, `$10`, `$35`, `$28` |
| **17** | `framer.com` | `/pricing` | 336,116 | -93% | **7 / 7 (100%)** | `$5`, `$15`, `$30`, `$10`, `$20`, `$40` |
| **18** | `make.com` | `/en/pricing` | 97,854 | -74% | **7 / 7 (100%)** | `$9`, `$16`, `$29`, `$10.59`, `$18.82`, `$34.12` |
| **19** | `trigger.dev` | `/pricing` | 67,620 | -63% | **7 / 7 (100%)** | `$50`, `$250`, `$0.00010`, `$0.00005`, `$0.00002` |
| **20** | `posthog.com` | `/pricing` | 392,506 | -94% | **6 / 6 (100%)** | `$450`, `$0.00005`, `$0.000025`, `$0.0001` |

---

## The 12 Sites That Fit Within 25,000 Tokens (Free Tier: Manifests Only)

AnswerRail practices strict diagnostic honesty. Sites that fit comfortably within the 25k token ingestion limit **do NOT need a paid edge reverse proxy for truncation**. They only require static `/llms.txt` and `ai-catalog.json` manifests ($0 free):

| Domain | Target URL | Raw HTML Tokens | Raw KB | Verdict & Action Required |
| :--- | :--- | :---: | :---: | :--- |
| `sentry.io` | `/pricing/` | 1,297 | 5 KB | ✅ **PASS** — Static `/llms.txt` only |
| `workos.com` | `/pricing` | 1,432 | 5 KB | ✅ **PASS** — Static `/llms.txt` only |
| `intercom.com` | `/pricing` | 3,114 | 11 KB | ✅ **PASS** — Static `/llms.txt` only |
| `neon.tech` | `/pricing` | 3,811 | 14 KB | ✅ **PASS** — Static `/llms.txt` only |
| `prisma.io` | `/pricing` | 3,882 | 14 KB | ✅ **PASS** — Static `/llms.txt` only |
| `answerrail.com` | `/` (Control) | 4,334 | 16 KB | ✅ **PASS** — Native Byte-0 Edge Markdown |
| `resend.com` | `/pricing` | 5,716 | 21 KB | ✅ **PASS** — Static `/llms.txt` only |
| `tailwindcss.com` | `/plus` | 5,745 | 21 KB | ✅ **PASS** — Static `/llms.txt` only |
| `retool.com` | `/pricing` | 6,015 | 22 KB | ✅ **PASS** — Static `/llms.txt` only |
| `clerk.com` | `/pricing` | 6,168 | 22 KB | ✅ **PASS** — Static `/llms.txt` only |
| `zapier.com` | `/pricing` | 8,253 | 30 KB | ✅ **PASS** — Static `/llms.txt` only |
| `convex.dev` | `/pricing` | 52 | <1 KB | ✅ **PASS** (Client-side rendered shell) |

---

## Methodology & Reproducibility

### How We Measure

1. **Crawler Emulation**: Requests are dispatched with standard crawler headers:
   `User-Agent: PerplexityBot/1.0 (+https://docs.perplexity.ai/bot)`
2. **Token Formula**:
   $$\text{Estimated Tokens} = \text{round}\left(\frac{\text{UTF-8 Byte Length}}{3.7}\right)$$
   Aligned with OpenAI tiktoken `cl100k_base` and `o200k_base` BPE tokenizer distributions on HTML payloads.
3. **The 25,000-Token Cutoff**:
   Byte offset `100,000` is the safe physical ingestion boundary before retrieval engines truncate documents.
4. **Visible Price Isolation**:
   To eliminate false positives from minified JavaScript variables (`$1`, `$2`), CSS styles, SVG coordinates, or HTML comments, the forensic engine extracts visible text from the DOM:
   - Strips `<script>`, `<style>`, `<svg>`, and HTML comments.
   - Extracts distinct currency patterns (`(?:^|\s|\()([$€£]\s?\d+(?:,\d{3})*(?:\.\d{1,2})?)(?=\s|\/|\)|,|\.|$)`).
   - Compares the distinct visible prices in the first 100 KB prefix against the entire document.
   - A price is counted as **dropped** *if and only if* that exact currency string never appears anywhere in the visible text of the first 100 KB.

### Reproduce the Entire Benchmark

```bash
# Clone the repository
git clone https://github.com/answerrail/answerrail.git
cd answerrail

# Run the 50-site empirical study script
node benchmark/run-study.mjs

# Audit any individual site live
npx test-ai-ready https://stripe.com/pricing
npx test-ai-ready https://fly.io/docs/about/pricing/
```

### Honest Limitations & Caveats

1. **Tokenizer Divergence**: Actual token counts vary by ±8% depending on whether the downstream RAG pipeline uses `cl100k_base`, `o200k_base`, or Claude's proprietary tokenizer. The byte offset boundary (100 KB) remains the physical transport constant.
2. **Dynamic Client Hydration**: Sites rendering purely client-side via JavaScript (e.g., empty root shells) appear artificially small under HTTP-only crawlers. Real headless browsers (e.g., Perplexity's deep crawler) execute JS, causing their actual post-render DOM to exceed the token limit even further.
3. **Two-Tier Architecture**: We do not sell edge proxies to sites that do not need them. If your site has under 25,000 tokens of HTML, you only need free static `/llms.txt` and `ai-catalog.json` files generated by `npx test-ai-ready <url> --write` ($0).
