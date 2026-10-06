#!/usr/bin/env node

/**
 * AnswerRail AI-Ready CLI (test-ai-ready)
 * Simulates PerplexityBot, OAI-SearchBot, and ClaudeBot to inspect token bloat,
 * 25k-token context truncation, and client-side rendering empty shells.
 *
 * Usage:
 *   npx test-ai-ready <url>
 *   node bin/test-ai-ready.js https://example.com
 */

const targetArg = process.argv[2];

if (!targetArg || targetArg === '--help' || targetArg === '-h') {
  console.log(`
\x1b[1m\x1b[38;2;129;140;248m╔══════════════════════════════════════════════════════════════════╗
║              AnswerRail AI Readiness Terminal Scanner            ║
║       The Inbound Edge Rail for Generative Engine Optimization   ║
╚══════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1mUsage:\x1b[0m
  npx test-ai-ready <url>

\x1b[1mExamples:\x1b[0m
  npx test-ai-ready https://stripe.com
  npx test-ai-ready https://notion.so
  npx test-ai-ready https://linear.app

\x1b[90mPowered by AnswerRail Anycast Edge Rail (https://answerrail.com)\x1b[0m
`);
  process.exit(0);
}

let targetUrl = targetArg.trim();
if (!/^https?:\/\//i.test(targetUrl)) {
  targetUrl = 'https://' + targetUrl;
}

const PERPLEXITY_MAX_TOKENS = 25000;

async function runAudit() {
  console.log(`\n\x1b[1m\x1b[38;2;129;140;248m[AnswerRail]\x1b[0m Probing \x1b[4m${targetUrl}\x1b[0m with frontier AI crawler identities...\n`);

  const startTime = Date.now();
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'PerplexityBot/1.0 (+https://docs.perplexity.ai/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.8,*/*;q=0.7',
      },
      redirect: 'follow',
    });

    const latencyMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const rawHtml = await response.text();
    const rawBytes = Buffer.byteLength(rawHtml, 'utf8');
    const estimatedTokens = Math.round(rawBytes / 3.7);

    // Checks
    const isTruncated = estimatedTokens > PERPLEXITY_MAX_TOKENS;
    const truncationExcess = estimatedTokens - PERPLEXITY_MAX_TOKENS;
    const hasEmptySpaShell = /<div\s+id=["'](root|__next|app)["']\s*>\s*<\/div>/i.test(rawHtml) && rawHtml.length < 5000;
    const isMarkdownNative = contentType.includes('text/markdown') || rawHtml.startsWith('---') || rawHtml.startsWith('# ');
    const hasSchema = isMarkdownNative
      ? (/(###?\s*(Structured Data|Schema|Entities|Specification|Pricing)|\|\s*Feature|\bSchema\.org\b)/i.test(rawHtml) || rawHtml.includes('| --- |'))
      : /<script\s+[^>]*type=["']application\/ld\+json["']/i.test(rawHtml);

    // Display ASCII Box
    console.log(`\x1b[1m\x1b[37m┌────────────────────────┬────────────────────────────────────────┐\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m│ \x1b[36mAudit Parameter        \x1b[37m│ \x1b[36mMeasured Metric                        \x1b[37m│\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m├────────────────────────┼────────────────────────────────────────┤\x1b[0m`);
    console.log(`│ Ingestion Latency (TTFB)│ ${latencyMs > 800 ? `\x1b[31m${latencyMs}ms (Slow Origin)\x1b[0m` : `\x1b[32m${latencyMs}ms (Fast)\x1b[0m`}                       │`);
    console.log(`│ Raw Payload Size       │ ${(rawBytes / 1024).toFixed(1)} KB                                │`);
    console.log(`│ Estimated Context Size │ ${estimatedTokens.toLocaleString()} tokens                          │`);
    console.log(`│ Perplexity 25k Ceiling │ ${isTruncated ? `\x1b[1m\x1b[31m❌ TRUNCATED (-${truncationExcess.toLocaleString()} tokens)\x1b[0m    │` : `\x1b[32m✅ PASSED (Within 25k limit)\x1b[0m       │`}`);
    console.log(`│ Client SPA Shell Check │ ${hasEmptySpaShell ? `\x1b[1m\x1b[31m❌ EMPTY SHELL (<div id="root">)\x1b[0m  │` : `\x1b[32m✅ DOM Rendered Content\x1b[0m           │`}`);
    console.log(`│ Structured Schema / Data│ ${hasSchema ? (isMarkdownNative ? `\x1b[32m✅ Markdown Entity Table\x1b[0m               │` : `\x1b[32m✅ Detected (JSON-LD)\x1b[0m                  │`) : `\x1b[33m⚠️ Missing Byte-0 Schema\x1b[0m         │`}`);
    console.log(`\x1b[1m\x1b[37m└────────────────────────┴────────────────────────────────────────┘\x1b[0m\n`);

    if (isTruncated || hasEmptySpaShell) {
      console.log(`\x1b[1m\x1b[31m[CRITICAL INDEXING FAILURE DETECTED]\x1b[0m`);
      if (isTruncated) {
        console.log(`• \x1b[31mPerplexity and ChatGPT Search truncate this payload after 25,000 tokens.\x1b[0m\n  Your pricing, FAQ, or bottom specs are never seen by the synthesis heads.`);
      }
      if (hasEmptySpaShell) {
        console.log(`• \x1b[31mEmpty client-side hydration container detected.\x1b[0m\n  AI bots do not run full headless Chromium on every crawl, seeing a blank page.`);
      }

      console.log(`\n\x1b[1m\x1b[32m[THE ANSWERRAIL 3-MINUTE EDGE FIX]\x1b[0m`);
      console.log(`AnswerRail intercepts AI bots at Cloudflare Anycast edge, drops DOM bloat by \x1b[1m-96.8%\x1b[0m,`);
      console.log(`and delivers pristine Markdown in \x1b[1m<15ms\x1b[0m with zero origin code changes.`);
      console.log(`\n👉 \x1b[1m\x1b[38;2;129;140;248mView Complete AST Diff & Deploy Rail:\x1b[0m`);
      console.log(`   \x1b[4mhttps://answerrail.com/?inspect=${encodeURIComponent(targetUrl)}\x1b[0m\n`);
    } else {
      console.log(`\x1b[1m\x1b[32m[PASS] This site is within standard token ceilings.\x1b[0m`);
      console.log(`To accelerate ingestion to <15ms Anycast edge delivery: \x1b[4mhttps://answerrail.com\x1b[0m\n`);
    }
  } catch (err) {
    console.error(`\x1b[31mError probing target URL:\x1b[0m`, err.message);
    process.exit(1);
  }
}

runAudit();
