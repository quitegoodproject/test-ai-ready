#!/usr/bin/env node

/**
 * AnswerRail AI-Ready CLI (test-ai-ready v1.1.4)
 * Audits any URL for:
 * 1. Perplexity / ChatGPT 25,000-Token HTML Truncation & Currency/Price Recall
 * 2. /llms.txt (llmstxt.org) Discovery & Markdown Format
 * 3. Google Lighthouse 13.5 Agentic-Browsing (/.well-known/ai-catalog.json ARD 1.0 & robots.txt Agentmap)
 * 4. Schema.org JSON-LD Entities, Collapsed FAQ Accordions & Next.js RSC Hydration Bloat
 *
 * Usage:
 *   npx test-ai-ready <url>
 *   npx answerrail audit <url>
 */

let rawTarget = process.argv[2];
if (rawTarget === 'audit' || rawTarget === 'probe' || rawTarget === 'scan') {
  rawTarget = process.argv[3];
}

if (!rawTarget || rawTarget === '--help' || rawTarget === '-h') {
  console.log(`
\x1b[1m\x1b[38;2;129;140;248m╔══════════════════════════════════════════════════════════════════╗
║         AnswerRail AI Readiness & Lighthouse 13.5 ARD Scanner    ║
║     Audits 25k Token Cutoff · /llms.txt · ai-catalog.json (ARD)  ║
╚══════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1mUsage:\x1b[0m
  npx test-ai-ready <url>
  npx answerrail audit <url>

\x1b[1mExamples:\x1b[0m
  npx test-ai-ready https://shopify.com
  npx test-ai-ready https://nextjs.org/docs
  npx test-ai-ready https://answerrail.com

\x1b[90mPowered by AnswerRail Anycast Edge Rail (https://answerrail.com)\x1b[0m
`);
  process.exit(0);
}

let targetUrl = rawTarget.trim();
if (!/^https?:\/\//i.test(targetUrl)) {
  targetUrl = 'https://' + targetUrl;
}

const PERPLEXITY_MAX_TOKENS = 25000;
const CUTOFF_BYTE_OFFSET = PERPLEXITY_MAX_TOKENS * 4; // ~100,000 bytes

async function safeFetch(url, headers = {}) {
  try {
    return await fetch(url, { headers, redirect: 'follow' });
  } catch {
    return null;
  }
}

async function runAudit() {
  const parsed = new URL(targetUrl);
  const origin = parsed.origin;
  const cleanDomain = parsed.hostname.replace(/^www\./i, '');

  console.log(`\n\x1b[1m\x1b[38;2;129;140;248m[AnswerRail v1.1.4]\x1b[0m Probing \x1b[4m${targetUrl}\x1b[0m (Page + /robots.txt + /llms.txt + /.well-known/ai-catalog.json)...\n`);

  const startTime = Date.now();
  try {
    const [response, robotsRes, llmsRes, ardRes] = await Promise.all([
      fetch(targetUrl, {
        headers: {
          'User-Agent': 'PerplexityBot/1.0 (+https://docs.perplexity.ai/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.8,*/*;q=0.7',
        },
        redirect: 'follow',
      }),
      safeFetch(`${origin}/robots.txt`),
      safeFetch(`${origin}/llms.txt`),
      safeFetch(`${origin}/.well-known/ai-catalog.json`),
    ]);

    const latencyMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const varyHeader = response.headers.get('vary') || '';
    const rawHtml = await response.text();
    const rawBytes = Buffer.byteLength(rawHtml, 'utf8');
    const estimatedTokens = Math.round(rawBytes / 3.7);

    // Core Ingestion & Recall Checks
    const isTruncated = estimatedTokens > PERPLEXITY_MAX_TOKENS;
    const truncationExcess = Math.max(0, estimatedTokens - PERPLEXITY_MAX_TOKENS);
    const hasEmptySpaShell = /<div\s+id=["'](root|__next|app)["']\s*>\s*<\/div>/i.test(rawHtml) && rawHtml.length < 5000;
    const isMarkdownNative = contentType.includes('text/markdown') || rawHtml.startsWith('---') || rawHtml.startsWith('# ');
    const hasSchema = isMarkdownNative
      ? (/(###?\s*(Structured Data|Schema|Entities|Specification|Pricing)|\|\s*Feature|\bSchema\.org\b)/i.test(rawHtml) || rawHtml.includes('| --- |'))
      : /<script\s+[^>]*type=["']application\/ld\+json["']/i.test(rawHtml);

    // /llms.txt Check
    const llmsText = llmsRes && llmsRes.status === 200 ? await llmsRes.text() : '';
    const hasValidLlmsTxt = Boolean(llmsRes && llmsRes.status === 200 && llmsText.trim().startsWith('#'));

    // Lighthouse 13.5 ARD 1.0 (/.well-known/ai-catalog.json) Check
    let hasValidArd = false;
    let ardCors = false;
    if (ardRes && ardRes.status === 200) {
      ardCors = ardRes.headers.get('access-control-allow-origin') === '*';
      try {
        const ardJson = await ardRes.json();
        hasValidArd = ardJson && ardJson.specVersion === '1.0' && Array.isArray(ardJson.entries) && ardJson.entries.length > 0;
      } catch {}
    }

    // /robots.txt Agentmap & AI Bot Check
    const robotsText = robotsRes && robotsRes.status === 200 ? await robotsRes.text() : '';
    const hasAgentmap = /Agentmap:\s*https?:\/\//i.test(robotsText);
    const hasAiCatalogLink = /<link\s+[^>]*rel=["']ai-catalog["']/i.test(rawHtml);

    // Currency & Pricing Recall Check (Before vs After 25k-Token Cutoff)
    const currencyRegex = /[$€£]\s?\d+(?:,\d{3})*(?:\.\d{1,2})?/g;
    const allPrices = rawHtml.match(currencyRegex) || [];
    const safePrefix = rawHtml.slice(0, CUTOFF_BYTE_OFFSET);
    const survivingPrices = safePrefix.match(currencyRegex) || [];
    const droppedPricesCount = Math.max(0, allPrices.length - survivingPrices.length);

    // Collapsed Radix / Headless UI Accordion Check
    const closedAccordionMatches = rawHtml.match(/data-state=["']closed["']|aria-expanded=["']false["']/gi) || [];

    // Next.js RSC Flight Payload Bloat Check
    const rscMatches = rawHtml.match(/self\.__next_f\.push\(\[[\s\S]*?\]\)/g) || [];
    const rscBytes = rscMatches.reduce((acc, m) => acc + Buffer.byteLength(m, 'utf8'), 0);

    // Display Forensic ASCII Box
    console.log(`\x1b[1m\x1b[37m┌──────────────────────────┬────────────────────────────────────────────┐\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m│ \x1b[36mAudit Parameter          \x1b[37m│ \x1b[36mMeasured Metric                            \x1b[37m│\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m├──────────────────────────┼────────────────────────────────────────────┤\x1b[0m`);
    console.log(`│ Ingestion Latency (TTFB) │ ${latencyMs > 800 ? `\x1b[31m${latencyMs}ms (Slow Origin)\x1b[0m` : `\x1b[32m${latencyMs}ms (Fast)\x1b[0m`}                           │`);
    console.log(`│ Raw Payload Size         │ ${(rawBytes / 1024).toFixed(1)} KB (${estimatedTokens.toLocaleString()} est. tokens)               │`);
    console.log(`│ Perplexity 25k Ceiling   │ ${isTruncated ? `\x1b[1m\x1b[31m[FAIL] TRUNCATED (-${truncationExcess.toLocaleString()} tokens)\x1b[0m` : `\x1b[32m[PASS] Within 25k token limit\x1b[0m`}              │`);
    console.log(`│ /llms.txt Manifest       │ ${hasValidLlmsTxt ? `\x1b[32m[PASS] HTTP 200 (Valid Markdown H1)\x1b[0m` : `\x1b[1m\x1b[31m[FAIL] Missing /llms.txt (Lighthouse Fail)\x1b[0m`} │`);
    console.log(`│ ARD 1.0 ai-catalog.json  │ ${hasValidArd ? `\x1b[32m[PASS] ARD 1.0 Verified${ardCors ? ' (ACAO: *)' : ''}\x1b[0m` : `\x1b[1m\x1b[31m[FAIL] Missing /.well-known/ai-catalog.json\x1b[0m`}│`);
    console.log(`│ Agentmap & <link> Tags   │ ${hasAgentmap && hasAiCatalogLink ? `\x1b[32m[PASS] Agentmap + rel="ai-catalog" active\x1b[0m` : `\x1b[33m[WARN] Missing Agentmap or rel="ai-catalog"\x1b[0m`}│`);
    console.log(`│ Currency/Price Recall    │ ${droppedPricesCount > 0 ? `\x1b[1m\x1b[31m[FAIL] ${droppedPricesCount}/${allPrices.length} prices cut off past 25k\x1b[0m` : `\x1b[32m[PASS] ${allPrices.length}/${allPrices.length} pricing tokens within window\x1b[0m`}  │`);
    console.log(`│ Collapsed FAQ Accordions │ ${closedAccordionMatches.length > 0 ? `\x1b[33m[WARN] ${closedAccordionMatches.length} collapsed DOM states detected\x1b[0m` : `\x1b[32m[PASS] 0 hidden accordion containers\x1b[0m`}       │`);
    console.log(`│ RSC Hydration Bloat      │ ${rscBytes > 10240 ? `\x1b[33m[WARN] ${(rscBytes / 1024).toFixed(1)} KB __next_f script bloat\x1b[0m` : `\x1b[32m[PASS] Minimal hydration noise\x1b[0m`}             │`);
    console.log(`│ Structured Schema / Data │ ${hasSchema ? `\x1b[32m[PASS] Detected (JSON-LD / GFM Table)\x1b[0m` : `\x1b[33m[WARN] Missing Byte-0 Schema\x1b[0m`}               │`);
    console.log(`│ RFC 9110 Vary Header     │ ${/accept/i.test(varyHeader) ? `\x1b[32m[PASS] Vary: ${varyHeader}\x1b[0m` : `\x1b[33m[WARN] No Accept content negotiation\x1b[0m`}       │`);
    console.log(`\x1b[1m\x1b[37m└──────────────────────────┴────────────────────────────────────────────┘\x1b[0m\n`);

    const needsFix = isTruncated || hasEmptySpaShell || droppedPricesCount > 0 || !hasValidLlmsTxt || !hasValidArd;

    if (needsFix) {
      console.log(`\x1b[1m\x1b[33m[AI DISCOVERY & LIGHTHOUSE 13.5 GAPS DETECTED ON ${cleanDomain.toUpperCase()}]\x1b[0m`);
      if (!hasValidLlmsTxt) {
        console.log(`• \x1b[31mMissing /llms.txt:\x1b[0m Fails Google Lighthouse 13.5 'llms-txt' audit and RAG documentation discovery.`);
      }
      if (!hasValidArd) {
        console.log(`• \x1b[31mMissing /.well-known/ai-catalog.json:\x1b[0m Fails Google Lighthouse 13.5 'ard-schema' (ARD 1.0) audit.`);
      }
      if (isTruncated) {
        console.log(`• \x1b[31m25,000-Token Truncation:\x1b[0m Perplexity & ChatGPT Search drop ${truncationExcess.toLocaleString()} tokens from this page.`);
      }
      if (droppedPricesCount > 0) {
        console.log(`• \x1b[31mPrice Omission:\x1b[0m ${droppedPricesCount} of ${allPrices.length} prices sit past the 25k-token cutoff.`);
      }

      console.log(`\n\x1b[1m\x1b[32m[FREE INSTANT GENERATOR & TURNKEY EDGE REMEDIATION]\x1b[0m`);
      console.log(`1. \x1b[1mFree Copy-Paste /llms.txt & ai-catalog.json Generator (No DNS change required):\x1b[0m`);
      console.log(`   \x1b[4mhttps://answerrail.com/report/${cleanDomain}\x1b[0m`);
      console.log(`2. \x1b[1mLighthouse 13.5 ARD 1.0 Implementation Guide:\x1b[0m`);
      console.log(`   \x1b[4mhttps://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt\x1b[0m`);
      console.log(`3. \x1b[1mAutomate at the Cloudflare Edge in 60s ($99/mo Starter):\x1b[0m`);
      console.log(`   \x1b[4mhttps://buy.stripe.com/eVq5kCcuj9qFcIc1ee0kE01?client_reference_id=${encodeURIComponent(cleanDomain)}\x1b[0m\n`);
    } else {
      console.log(`\x1b[1m\x1b[32m[PASS] ${cleanDomain} passes 25k-token, /llms.txt, and Lighthouse 13.5 ARD 1.0 checks!\x1b[0m`);
      console.log(`Live Diagnostic Report: \x1b[4mhttps://answerrail.com/report/${cleanDomain}\x1b[0m\n`);
    }
  } catch (err) {
    console.error(`\x1b[31mError probing target URL:\x1b[0m`, err.message);
    process.exit(1);
  }
}

runAudit();
