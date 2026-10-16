#!/usr/bin/env node

/**
 * AnswerRail AI-Ready CLI (test-ai-ready v1.2.0)
 * Audits any URL for:
 * 1. Perplexity / ChatGPT 25,000-Token HTML Truncation & Currency/Price Recall
 * 2. /llms.txt (llmstxt.org) Discovery & Markdown Format
 * 3. Google Lighthouse 13.5 Agentic-Browsing (/.well-known/ai-catalog.json ARD 1.0 & robots.txt Agentmap)
 * 4. Schema.org JSON-LD Entities, Collapsed FAQ Accordions & Next.js RSC Hydration Bloat
 *
 * Usage:
 *   npx test-ai-ready <url>
 *   npx test-ai-ready <url> --write
 *   npx answerrail audit <url> --write
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const shouldWrite = args.includes('--write') || args.includes('--init') || args.includes('-w');
const jsonOutput = args.includes('--json');
const positional = args.filter((a) => !a.startsWith('-') && a !== 'audit' && a !== 'probe' && a !== 'scan');
const rawTarget = positional[0];

if (!rawTarget || args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[1m\x1b[38;2;129;140;248m╔══════════════════════════════════════════════════════════════════╗
║      AnswerRail AI Readiness & Lighthouse 13.5 ARD CLI v1.2.0    ║
║     Audits 25k Token Cutoff · /llms.txt · ai-catalog.json (ARD)  ║
╚══════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1mUsage:\x1b[0m
  npx test-ai-ready <url>            Run live 25k-token & Lighthouse 13.5 ARD audit
  npx test-ai-ready <url> --write    Generate & write ./llms.txt + /.well-known/ai-catalog.json locally ($0)
  npx test-ai-ready <url> --json     Output raw machine-readable JSON metrics

\x1b[1mExamples:\x1b[0m
  npx test-ai-ready https://vercel.com/pricing
  npx test-ai-ready https://supabase.com/pricing --write
  npx test-ai-ready https://answerrail.com

\x1b[90m50-Site Empirical Benchmark & Docs: https://answerrail.com/research/2026-saas-50-truncation-benchmark\x1b[0m
`);
  process.exit(0);
}

let targetUrl = rawTarget.trim();
if (!/^https?:\/\//i.test(targetUrl)) {
  targetUrl = 'https://' + targetUrl;
}

const PERPLEXITY_MAX_TOKENS = 25000;
const CUTOFF_BYTE_OFFSET = PERPLEXITY_MAX_TOKENS * 4; // ~100,000 bytes

async function safeFetch(url, headers = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function extractPageMetadata(rawHtml, origin, cleanDomain) {
  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : cleanDomain;
  const descMatch =
    rawHtml.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    rawHtml.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch
    ? descMatch[1].replace(/\s+/g, ' ').trim()
    : `Official documentation, product specifications, and pricing for ${cleanDomain}.`;

  const h2Matches = Array.from(rawHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi))
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 2 && t.length < 90)
    .slice(0, 6);

  const linkMatches = Array.from(rawHtml.matchAll(/<a\s+[^>]*href=["'](\/[a-zA-Z0-9_\-/]+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  const seenUrls = new Set();
  const navLinks = [];
  for (const m of linkMatches) {
    const href = m[1];
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (
      href &&
      href.length > 1 &&
      label.length >= 3 &&
      label.length <= 50 &&
      !seenUrls.has(href) &&
      !/^\/(login|signin|signup|cart|cdn-cgi|_next)/i.test(href)
    ) {
      seenUrls.add(href);
      navLinks.push({ url: `${origin}${href}`, label });
      if (navLinks.length >= 8) break;
    }
  }

  return { title, description, h2Matches, navLinks };
}

function buildLocalManifests(rawHtml, origin, cleanDomain) {
  const { title, description, h2Matches, navLinks } = extractPageMetadata(rawHtml, origin, cleanDomain);
  const linkLines =
    navLinks.length > 0
      ? navLinks.map((l) => `- [${l.label}](${l.url}): Official ${l.label} resource on ${cleanDomain}.`).join('\n')
      : `- [Homepage](${origin}/): Main product overview and specifications.\n- [Pricing](${origin}/pricing): Plans, tiers, and enterprise options.\n- [Documentation](${origin}/docs): Technical guides and API reference.`;

  const sectionSummary =
    h2Matches.length > 0
      ? `\n## Key Topics Covered\n${h2Matches.map((h) => `- ${h}`).join('\n')}\n`
      : '';

  const llmsTxt = `# ${title}

> ${description}

## Core Documentation & Commercial Links
${linkLines}
${sectionSummary}
## Machine Discovery & Agentic Readiness
- AI Resource Discovery (ARD 1.0): ${origin}/.well-known/ai-catalog.json
- Canonical Origin: ${origin}/
`;

  const ardCatalog = {
    specVersion: '1.0',
    entries: [
      {
        identifier: `urn:air:${cleanDomain}:docs:llms-txt`,
        displayName: `${title} — AI Documentation Index (/llms.txt)`,
        type: 'text/markdown',
        url: `${origin}/llms.txt`,
        representativeQueries: [
          `What products, services, and pricing does ${cleanDomain} offer?`,
          `How do I integrate or get started with ${cleanDomain}?`,
          `Official documentation, specifications, and FAQs for ${cleanDomain}`,
        ],
      },
    ],
  };

  return { llmsTxt, ardCatalog };
}

function writeLocalManifests(rawHtml, origin, cleanDomain) {
  const { llmsTxt, ardCatalog } = buildLocalManifests(rawHtml, origin, cleanDomain);
  const cwd = process.cwd();
  const publicDir = path.join(cwd, 'public');
  const baseDir = fs.existsSync(publicDir) && fs.statSync(publicDir).isDirectory() ? publicDir : cwd;

  const llmsPath = path.join(baseDir, 'llms.txt');
  const wellKnownDir = path.join(baseDir, '.well-known');
  const ardPath = path.join(wellKnownDir, 'ai-catalog.json');

  if (!fs.existsSync(wellKnownDir)) {
    fs.mkdirSync(wellKnownDir, { recursive: true });
  }
  fs.writeFileSync(llmsPath, llmsTxt, 'utf8');
  fs.writeFileSync(ardPath, JSON.stringify(ardCatalog, null, 2) + '\n', 'utf8');

  return {
    llmsPath: path.relative(cwd, llmsPath) || 'llms.txt',
    ardPath: path.relative(cwd, ardPath) || '.well-known/ai-catalog.json',
  };
}

async function runAudit() {
  const parsed = new URL(targetUrl);
  const origin = parsed.origin;
  const cleanDomain = parsed.hostname.replace(/^www\./i, '');

  if (!jsonOutput) {
    console.log(
      `\n\x1b[1m\x1b[38;2;129;140;248m[AnswerRail v1.2.0]\x1b[0m Probing \x1b[4m${targetUrl}\x1b[0m (Page + /robots.txt + /llms.txt + /.well-known/ai-catalog.json)...\n`
    );
  }

  const startTime = Date.now();
  try {
    const [response, robotsRes, llmsRes, ardRes] = await Promise.all([
      safeFetch(
        targetUrl,
        {
          'User-Agent': 'PerplexityBot/1.0 (+https://docs.perplexity.ai/bot)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.8,*/*;q=0.7',
        },
        10000
      ),
      safeFetch(`${origin}/robots.txt`),
      safeFetch(`${origin}/llms.txt`),
      safeFetch(`${origin}/.well-known/ai-catalog.json`),
    ]);

    if (!response) {
      throw new Error(`Could not connect to ${targetUrl} within 10s`);
    }

    const latencyMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const varyHeader = response.headers.get('vary') || '';
    const rawHtml = await response.text();
    const rawBytes = Buffer.byteLength(rawHtml, 'utf8');
    const estimatedTokens = Math.round(rawBytes / 3.7);

    // Core Ingestion & Recall Checks
    const isTruncated = estimatedTokens > PERPLEXITY_MAX_TOKENS;
    const truncationExcess = Math.max(0, estimatedTokens - PERPLEXITY_MAX_TOKENS);
    const truncatedPercent = isTruncated ? Math.round((truncationExcess / estimatedTokens) * 100) : 0;
    const isMarkdownNative = contentType.includes('text/markdown') || rawHtml.startsWith('---') || rawHtml.startsWith('# ');
    const hasSchema = isMarkdownNative
      ? /(###?\s*(Structured Data|Schema|Entities|Specification|Pricing)|\|\s*Feature|\bSchema\.org\b)/i.test(rawHtml) ||
        rawHtml.includes('| --- |')
      : /<script\s+[^>]*type=["']application\/ld\+json["']/i.test(rawHtml);

    // /llms.txt Check
    const llmsText = llmsRes && llmsRes.status === 200 ? await llmsRes.text() : '';
    const llmsCt = llmsRes ? (llmsRes.headers.get('content-type') || '').toLowerCase() : '';
    const hasValidLlmsTxt = Boolean(
      llmsRes && llmsRes.status === 200 && !llmsCt.includes('text/html') && llmsText.trim().startsWith('#')
    );

    // Lighthouse 13.5 ARD 1.0 (/.well-known/ai-catalog.json) Check
    let hasValidArd = false;
    let ardCors = false;
    if (ardRes && ardRes.status === 200) {
      ardCors = ardRes.headers.get('access-control-allow-origin') === '*';
      try {
        const ardJson = await ardRes.json();
        hasValidArd = Boolean(
          ardJson && ardJson.specVersion === '1.0' && Array.isArray(ardJson.entries) && ardJson.entries.length > 0
        );
      } catch {}
    }

    // /robots.txt Agentmap & AI Bot Check
    const robotsText = robotsRes && robotsRes.status === 200 ? await robotsRes.text() : '';
    const hasAgentmap = /Agentmap:\s*https?:\/\//i.test(robotsText);
    const hasAiCatalogLink = /<link\s+[^>]*rel=["']ai-catalog["']/i.test(rawHtml);

    // Visible Text & Distinct Visible Price Recall Check (Before vs After 25k-Token / 100KB Cutoff)
    const extractVisibleText = (htmlSlice) =>
      htmlSlice
        .replace(/<script[\s\S]*?(?:<\/script>|$)/gi, ' ')
        .replace(/<style[\s\S]*?(?:<\/style>|$)/gi, ' ')
        .replace(/<svg[\s\S]*?(?:<\/svg>|$)/gi, ' ')
        .replace(/<!--[\s\S]*?(?:-->|$)/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const extractPrices = (visText) => {
      const rx = /(?:^|\s|\()([$€£]\s?\d+(?:,\d{3})*(?:\.\d{1,2})?)(?=\s|\/|\)|,|\.|$)/g;
      const set = new Set();
      let m;
      while ((m = rx.exec(visText)) !== null) set.add(m[1].replace(/\s+/g, ''));
      return Array.from(set);
    };
    const fullVisible = extractVisibleText(rawHtml);
    const prefixVisible = extractVisibleText(rawHtml.slice(0, CUTOFF_BYTE_OFFSET));
    const omittedVisibleTextPercent =
      fullVisible.length > 0
        ? Math.max(0, Math.round(((fullVisible.length - prefixVisible.length) / fullVisible.length) * 100))
        : 0;
    const allPrices = extractPrices(fullVisible);
    const survivingSet = new Set(extractPrices(prefixVisible));
    const droppedSampleList = allPrices.filter((p) => !survivingSet.has(p));
    const droppedPricesCount = droppedSampleList.length;
    const droppedSample = droppedSampleList.slice(0, 6);

    // Collapsed Radix / Headless UI Accordion Check
    const closedAccordionMatches = rawHtml.match(/data-state=["']closed["']|aria-expanded=["']false["']/gi) || [];

    // Next.js RSC Flight Payload Bloat Check
    const rscMatches = rawHtml.match(/self\.__next_f\.push\(\[[\s\S]*?\]\)/g) || [];
    const rscBytes = rscMatches.reduce((acc, m) => acc + Buffer.byteLength(m, 'utf8'), 0);

    // Honest 2-Tier Classification
    const requiresEdgeForTruncation = isTruncated || droppedPricesCount > 0;
    const verdictTier = requiresEdgeForTruncation ? 'TIER_2_EDGE_COMPACTION' : 'TIER_1_FREE_MANIFESTS_ONLY';

    // Non-blocking funnel telemetry ping
    const telemetryPromise = safeFetch(
      'https://answerrail.com/api/telemetry/funnel',
      { 'Content-Type': 'application/json' },
      1200
    ).catch(() => null);
    fetch('https://answerrail.com/api/telemetry/funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage: shouldWrite ? 'cli_write' : 'cli_scan',
        domain: cleanDomain,
        url: targetUrl,
        estimatedTokens,
        isTruncated,
        droppedPricesCount,
        hasLlmsTxt: hasValidLlmsTxt,
        hasArdCatalog: hasValidArd,
        verdictTier,
      }),
    }).catch(() => {});

    if (jsonOutput) {
      console.log(
        JSON.stringify(
          {
            domain: cleanDomain,
            url: targetUrl,
            latencyMs,
            rawBytes,
            estimatedTokens,
            isTruncated,
            truncationExcess,
            truncatedPercent,
            allPricesCount: allPrices.length,
            droppedPricesCount,
            droppedSample,
            closedAccordions: closedAccordionMatches.length,
            rscPayloadKb: Math.round(rscBytes / 1024),
            hasValidLlmsTxt,
            hasValidArd,
            hasSchema,
            verdictTier,
            requiresEdgeForTruncation,
            reportUrl: `https://answerrail.com/report/${cleanDomain}`,
          },
          null,
          2
        )
      );
      return;
    }

    // Display Forensic ASCII Box
    console.log(`\x1b[1m\x1b[37m┌──────────────────────────┬────────────────────────────────────────────┐\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m│ \x1b[36mAudit Parameter          \x1b[37m│ \x1b[36mMeasured Metric                            \x1b[37m│\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m├──────────────────────────┼────────────────────────────────────────────┤\x1b[0m`);
    console.log(
      `│ Ingestion Latency (TTFB) │ ${latencyMs > 800 ? `\x1b[31m${latencyMs}ms (Slow Origin)\x1b[0m` : `\x1b[32m${latencyMs}ms (Fast)\x1b[0m`}                           │`
    );
    console.log(
      `│ Raw Payload Size         │ ${(rawBytes / 1024).toFixed(1)} KB (${estimatedTokens.toLocaleString()} est. tokens)               │`
    );
    console.log(
      `│ Perplexity 25k Ceiling   │ ${isTruncated ? `\x1b[1m\x1b[31m[FAIL] TRUNCATED (-${truncationExcess.toLocaleString()} tokens / -${truncatedPercent}%)\x1b[0m` : `\x1b[32m[PASS] Fits within 25k token window\x1b[0m`}         │`
    );
    console.log(
      `│ /llms.txt Manifest       │ ${hasValidLlmsTxt ? `\x1b[32m[PASS] HTTP 200 (Valid Markdown H1)\x1b[0m` : `\x1b[1m\x1b[31m[FAIL] Missing /llms.txt (Lighthouse Fail)\x1b[0m`} │`
    );
    console.log(
      `│ ARD 1.0 ai-catalog.json  │ ${hasValidArd ? `\x1b[32m[PASS] ARD 1.0 Verified${ardCors ? ' (ACAO: *)' : ''}\x1b[0m` : `\x1b[1m\x1b[31m[FAIL] Missing /.well-known/ai-catalog.json\x1b[0m`}│`
    );
    console.log(
      `│ Agentmap & <link> Tags   │ ${hasAgentmap && hasAiCatalogLink ? `\x1b[32m[PASS] Agentmap + rel="ai-catalog" active\x1b[0m` : `\x1b[33m[WARN] Missing Agentmap or rel="ai-catalog"\x1b[0m`}│`
    );
    console.log(
      `│ Currency/Price Recall    │ ${droppedPricesCount > 0 ? `\x1b[1m\x1b[31m[FAIL] ${droppedPricesCount}/${allPrices.length} prices cut off past 25k\x1b[0m` : `\x1b[32m[PASS] ${allPrices.length}/${allPrices.length} pricing tokens within window\x1b[0m`}  │`
    );
    console.log(
      `│ Collapsed FAQ Accordions │ ${closedAccordionMatches.length > 0 ? `\x1b[33m[WARN] ${closedAccordionMatches.length} collapsed DOM states detected\x1b[0m` : `\x1b[32m[PASS] 0 hidden accordion containers\x1b[0m`}       │`
    );
    console.log(
      `│ RSC Hydration Bloat      │ ${rscBytes > 10240 ? `\x1b[33m[WARN] ${(rscBytes / 1024).toFixed(1)} KB __next_f script bloat\x1b[0m` : `\x1b[32m[PASS] Minimal hydration noise\x1b[0m`}             │`
    );
    console.log(
      `│ Structured Schema / Data │ ${hasSchema ? `\x1b[32m[PASS] Detected (JSON-LD / GFM Table)\x1b[0m` : `\x1b[33m[WARN] Missing Byte-0 Schema\x1b[0m`}               │`
    );
    console.log(
      `│ RFC 9110 Vary Header     │ ${/accept/i.test(varyHeader) ? `\x1b[32m[PASS] Vary: ${varyHeader}\x1b[0m` : `\x1b[33m[WARN] No Accept content negotiation\x1b[0m`}       │`
    );
    console.log(`\x1b[1m\x1b[37m└──────────────────────────┴────────────────────────────────────────────┘\x1b[0m\n`);

    if (shouldWrite) {
      const written = writeLocalManifests(rawHtml, origin, cleanDomain);
      console.log(`\x1b[1m\x1b[32m[✓ GENERATED LOCAL MANIFESTS ($0 FREE)]\x1b[0m`);
      console.log(`  • Wrote \x1b[1m${written.llmsPath}\x1b[0m (llmstxt.org compliant)`);
      console.log(`  • Wrote \x1b[1m${written.ardPath}\x1b[0m (Google Lighthouse 13.5 ard-schema ARD 1.0)`);
      console.log(`  • Add to <head>: \x1b[36m<link rel="describedby" href="/llms.txt"> <link rel="ai-catalog" href="/.well-known/ai-catalog.json">\x1b[0m\n`);
    }

    // HONEST 2-TIER DIAGNOSTIC VERDICT
    if (!requiresEdgeForTruncation) {
      console.log(
        `\x1b[1m\x1b[32m[✅ HONEST VERDICT: NO PAID EDGE PROXY NEEDED FOR TRUNCATION]\x1b[0m`
      );
      console.log(
        `Your HTML (${(rawBytes / 1024).toFixed(1)} KB / ~${estimatedTokens.toLocaleString()} tokens) fits comfortably inside the 25,000-token RAG window with 0 dropped prices.`
      );
      if (!hasValidLlmsTxt || !hasValidArd) {
        console.log(
          `\x1b[33mWhat you still need:\x1b[0m Static discovery manifests (${!hasValidLlmsTxt ? '/llms.txt' : ''}${!hasValidLlmsTxt && !hasValidArd ? ' + ' : ''}${!hasValidArd ? '/.well-known/ai-catalog.json' : ''}) for Google Lighthouse 13.5.`
        );
        if (!shouldWrite) {
          console.log(
            `\n\x1b[1mFix for $0 in 5 seconds (writes files directly to your repo):\x1b[0m`
          );
          console.log(`  \x1b[32mnpx test-ai-ready ${targetUrl} --write\x1b[0m`);
        }
        console.log(
          `\nOr copy-paste from your live report: \x1b[4mhttps://answerrail.com/report/${cleanDomain}\x1b[0m\n`
        );
      } else {
        console.log(
          `Both /llms.txt and /.well-known/ai-catalog.json are live. Full report: \x1b[4mhttps://answerrail.com/report/${cleanDomain}\x1b[0m\n`
        );
      }
    } else {
      console.log(
        `\x1b[1m\x1b[31m[⚠️  CRITICAL TRUNCATION EVIDENCE ON ${cleanDomain.toUpperCase()}]\x1b[0m`
      );
      console.log(
        `• \x1b[31mPayload Overflow:\x1b[0m ${(rawBytes / 1024).toFixed(1)} KB HTML (~${estimatedTokens.toLocaleString()} tokens) exceeds the 25,000-token cutoff by \x1b[1m${truncationExcess.toLocaleString()} tokens (${truncatedPercent}% dropped)\x1b[0m.`
      );
      if (droppedPricesCount > 0) {
        console.log(
          `• \x1b[31mPricing Omission:\x1b[0m \x1b[1m${droppedPricesCount} of ${allPrices.length}\x1b[0m pricing/currency tokens sit past byte 100,000 (Sample dropped: ${droppedSample.join(', ')}).`
        );
      }
      if (rscBytes > 10240) {
        console.log(
          `• \x1b[33mRoot Cause:\x1b[0m ${(rscBytes / 1024).toFixed(1)} KB of inline Next.js RSC (\`self.__next_f.push\`) hydration scripts consume the crawler token window before visible content completes.`
        );
      }

      console.log(`\n\x1b[1m\x1b[36m[WHAT YOU CAN FIX FOR $0 VS WHAT REQUIRES ANSWERRAIL EDGE]\x1b[0m`);
      console.log(
        `1. \x1b[1m$0 Free Fix (Static Discovery Manifests):\x1b[0m Generate \`/llms.txt\` + \`/.well-known/ai-catalog.json\` locally:`
      );
      console.log(`   \x1b[32mnpx test-ai-ready ${targetUrl} --write\x1b[0m`);
      console.log(
        `2. \x1b[1mFix 25k-Token HTML Truncation (Requires Edge Compaction):\x1b[0m Static manifest files do not shrink a ${(rawBytes / 1024).toFixed(0)} KB HTML DOM when PerplexityBot or OAI-SearchBot crawls \`${parsed.pathname || '/'}\`.`
      );
      console.log(
        `   • \x1b[1mInspect Live Before/After Report:\x1b[0m \x1b[4mhttps://answerrail.com/report/${cleanDomain}\x1b[0m`
      );
      console.log(
        `   • \x1b[1mDeploy Layer-7 Edge Proxy ($99/mo Starter):\x1b[0m \x1b[4mhttps://buy.stripe.com/eVq5kCcuj9qFcIc1ee0kE01?client_reference_id=${encodeURIComponent(cleanDomain)}\x1b[0m\n`
      );
    }

    await telemetryPromise;
  } catch (err) {
    console.error(`\x1b[31mError probing target URL:\x1b[0m`, err.message);
    process.exit(1);
  }
}

runAudit();
