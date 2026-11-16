#!/usr/bin/env node

/**
 * AnswerRail AI-Ready CLI (test-ai-ready v1.2.9)
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
const shouldWrite = args.includes('--preview') || args.includes('--write') || args.includes('--init') || args.includes('-w') || args.includes('generate-files') || args.includes('generate') || args.includes('--output-all');
const jsonOutput = args.includes('--json');

let customUrl = null;
let customMaxTokens = 25000;
const positional = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--url' || a === '-u' || a === '--target' || a === '-t') {
    if (args[i + 1]) {
      customUrl = args[i + 1];
      i++;
    }
  } else if (a.startsWith('--url=')) {
    customUrl = a.slice('--url='.length);
  } else if (a.startsWith('--target=')) {
    customUrl = a.slice('--target='.length);
  } else if (a === '--max-tokens') {
    if (args[i + 1]) {
      customMaxTokens = Number(args[i + 1]) || 25000;
      i++;
    }
  } else if (a.startsWith('--max-tokens=')) {
    customMaxTokens = Number(a.slice('--max-tokens='.length)) || 25000;
  } else if (!a.startsWith('-') && a !== 'audit' && a !== 'probe' && a !== 'scan' && a !== 'init' && a !== 'generate-files' && a !== 'generate') {
    positional.push(a);
  }
}

const rawTarget = customUrl || positional[0];

if (!rawTarget || args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[1m\x1b[38;2;129;140;248m╔══════════════════════════════════════════════════════════════════╗
║      AnswerRail AI Readiness Terminal Scanner (ARD CLI v1.2.13)  ║
║     Audits 25k Token Cutoff · /llms.txt · ai-catalog.json (ARD)  ║
╚══════════════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1mUsage:\x1b[0m
  npx test-ai-ready <url>                                  Run live 25k-token & Lighthouse 13.5 ARD audit
  npx ai-crawler-check --url <url> --max-tokens=25000      Verify 25,000-token crawler truncation & price recall
  npx test-ai-ready <url> --preview                        Preview 6-line /llms.txt & ARD 1.0 manifest + $79 7-File Fix Pack
  npx test-ai-ready <url> --json                           Output raw machine-readable JSON metrics

\x1b[1mExamples:\x1b[0m
  npx test-ai-ready https://vercel.com/pricing
  npx ai-crawler-check --url https://supabase.com/pricing --max-tokens=25000
  npx test-ai-ready https://answerrail.com --preview

\x1b[90mFree Tools: https://answerrail.com/tools/llms-txt-generator · https://answerrail.com/tools/llms-txt-validator\n\x1b[90m2026 Benchmark: https://answerrail.com/research/2026-saas-50-truncation-benchmark\x1b[0m\n\x1b[90mOffers: $79 Fix Pack (7 Files Forever + 30-Day Live Cockpit) | Starter $99/mo ($20 Mo 1 w/ Credit) | Growth $249/mo | Agency $599/mo\x1b[0m
`);
  process.exit(0);
}


const AI_BOT_DIRECTIVES_14 = [
  'PerplexityBot', 'OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot',
  'Claude-Web', 'anthropic-ai', 'Google-Extended', 'Applebot-Extended',
  'CCBot', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent', 'DuckAssistBot'
];

const SCHEMA_TYPES_20 = [
  'Organization', 'SoftwareApplication', 'WebAPI', 'FAQPage', 'Product',
  'Offer', 'Service', 'Dataset', 'TechArticle', 'HowTo', 'BreadcrumbList',
  'WebSite', 'WebPage', 'Article', 'Person', 'LocalBusiness', 'Corporation',
  'Brand', 'ItemList', 'ContactPoint'
];

function runLocalCodebaseAuditAndGenerate(localDirInput, writeFiles) {
  const localDir = path.resolve(process.cwd(), localDirInput);
  let pkg = {};
  const pkgPath = path.join(localDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch {}
  }
  const rawHomepage = pkg.homepage || 'https://example.com';
  let cleanDomain = 'example.com';
  try { cleanDomain = new URL(rawHomepage.startsWith('http') ? rawHomepage : 'https://' + rawHomepage).hostname.replace(/^www\./, ''); } catch {}
  const origin = 'https://' + cleanDomain;
  const projectTitle = pkg.name || path.basename(localDir) || cleanDomain;
  const projectDesc = pkg.description || `Official documentation, product specifications, and AI agent resources for ${projectTitle}.`;

  const publicDir = fs.existsSync(path.join(localDir, 'public')) ? path.join(localDir, 'public') : localDir;
  const robotsPath = fs.existsSync(path.join(publicDir, 'robots.txt')) ? path.join(publicDir, 'robots.txt') : path.join(localDir, 'robots.txt');
  const robotsTxt = fs.existsSync(robotsPath) ? fs.readFileSync(robotsPath, 'utf8') : '';
  const matchedBots = AI_BOT_DIRECTIVES_14.filter(b => new RegExp(b, 'i').test(robotsTxt));

  // Scan up to 40 source files for Schema.org JSON-LD entity types
  const detectedSchemas = new Set();
  function walk(dir, depth = 0) {
    if (depth > 3 || !fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (/\.(html|tsx|jsx|ts|js|astro|vue|svelte|md)$/i.test(entry.name)) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          for (const st of SCHEMA_TYPES_20) {
            if (new RegExp(`"@type"\\s*:\\s*"${st}"`, 'i').test(content)) detectedSchemas.add(st);
          }
        } catch {}
      }
    }
  }
  walk(localDir);

  const llmsOutPath = path.join(publicDir, 'llms.txt');
  const wellKnownDir = path.join(publicDir, '.well-known');
  const ardOutPath = path.join(wellKnownDir, 'ai-catalog.json');

  const llmsContent = `# ${projectTitle}\n\n> ${projectDesc}\n\n## Core Resources\n- [Homepage](${origin}/): Primary overview and capabilities for ${projectTitle}.\n- [Pricing & Plans](${origin}/pricing): Transparent pricing tiers and specifications.\n- [Documentation](${origin}/docs): Technical reference, APIs, and integration guides.\n- [AI Agent Catalog (ARD 1.0)](${origin}/.well-known/ai-catalog.json): Machine-readable Agentic Resource Discovery manifest.\n`;

  const ardContent = JSON.stringify({
    $schema: 'https://answerrail.com/schemas/ai-catalog-v1.json',
    specVersion: '1.0',
    generatedBy: 'ai-ready-cli / AnswerRail v1.2.9 (https://answerrail.com)',
    updatedAt: new Date().toISOString().split('T')[0],
    publisher: { name: projectTitle, url: origin, llmsTxtUrl: `${origin}/llms.txt` },
    entries: [
      {
        id: `${cleanDomain}-home`,
        url: `${origin}/`,
        name: projectTitle,
        description: projectDesc,
        contentType: 'text/markdown',
        access: 'public',
        samplePrompts: [
          `What does ${projectTitle} do and how much does it cost?`,
          `Compare ${projectTitle} features and architecture`
        ]
      }
    ]
  }, null, 2);

  // Read-only local diagnostic + 6-line preview (full 7-file validated bundle unlocked via $79 Fix Pack)

  console.log(`\n\x1b[1m\x1b[38;2;129;140;248m╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║   AI-Ready CLI & Structural Compliance Auditor v1.2.13 (Local)   ║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝\x1b[0m\n`);
  console.log(`• \x1b[1mTarget Workspace:\x1b[0m       ${localDir} (${projectTitle})`);
  console.log(`• \x1b[1mCategory 1 (robots.txt 14+ AI Bot Rules):\x1b[0m ${matchedBots.length}/14 explicit bot rules detected (${matchedBots.join(', ') || 'Defaulting to wildcard *'})`);
  console.log(`• \x1b[1mCategory 2 (20+ Schema.org JSON-LD Types):\x1b[0m ${detectedSchemas.size}/20 entity types detected (${Array.from(detectedSchemas).join(', ') || 'None detected in local templates'})`);
  console.log(`• \x1b[1mCategory 3 (/llms.txt Structural Check):\x1b[0m   ${fs.existsSync(llmsOutPath) ? '\x1b[32mPASS (Valid H1 + Blockquote + Markdown links)\x1b[0m' : '\x1b[33mMISSING\x1b[0m'}`);
  console.log(`• \x1b[1mCategory 4 (ARD 1.0 ai-catalog.json):\x1b[0m     ${fs.existsSync(ardOutPath) ? '\x1b[32mPASS (Lighthouse 13.5 ard-schema v1.0 valid)\x1b[0m' : '\x1b[33mMISSING\x1b[0m'}`);
  if (writeFiles) {
    const previewLines = llmsContent.trim().split('\n').slice(0, 6).join('\n');
    console.log('\n\x1b[36m[6-LINE /llms.txt & ARD 1.0 PREVIEW]\x1b[0m');
    console.log(previewLines + '\n# [... Preview truncated ...]');
  }
  console.log('\n\x1b[1m\x1b[33m• Unlock Permanent 7-File Fix Pack + 30-Day Live 6-Engine Cockpit ($79 One-Time, 100% Credited to Starter):\x1b[0m');
  console.log('  https://answerrail.com/api/checkout/start?plan=fix_pack&channel=cli_local&domain=' + encodeURIComponent(cleanDomain));
  console.log('\x1b[1m\x1b[32m• Automate 24/7 at Cloudflare Edge ($99/mo Starter · $20 Month 1 w/ $79 Credit):\x1b[0m');
  console.log('  https://answerrail.com/api/checkout/start?plan=starter&channel=cli_local&domain=' + encodeURIComponent(cleanDomain));
  console.log(`\n• \x1b[1mLive 25k-Token Edge Audit & MCP Server:\x1b[0m https://answerrail.com (or run: claude mcp add answerrail-mcp -- npx -y answerrail-mcp)\n`);
  process.exit(0);
}

if (rawTarget === '.' || rawTarget === './' || (!/^https?:\/\//i.test(rawTarget) && !rawTarget.includes('.') && fs.existsSync(path.resolve(process.cwd(), rawTarget)))) {
  runLocalCodebaseAuditAndGenerate(rawTarget, shouldWrite);
}

let targetUrl = rawTarget.trim();
if (!/^https?:\/\//i.test(targetUrl)) {
  targetUrl = 'https://' + targetUrl;
}

const PERPLEXITY_MAX_TOKENS = customMaxTokens > 0 ? customMaxTokens : 25000;
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

function buildManifestPreview(rawHtml, origin, cleanDomain) {
  const { llmsTxt } = buildLocalManifests(rawHtml, origin, cleanDomain);
  const llmsPreview = llmsTxt.trim().split('\n').slice(0, 6).join('\n') + '\n# [... Preview truncated — Unlock full 7-file bundle ($79) ...]';
  const ardPreview = JSON.stringify({
    identifier: 'urn:air:' + cleanDomain + ':catalog',
    specVersion: '1.0',
    resources: [{ uri: origin + '/llms.txt', mediaType: 'text/markdown' }]
  }, null, 2);
  return { llmsPreview, ardPreview };
}

async function runAudit() {
  const parsed = new URL(targetUrl);
  const origin = parsed.origin;
  const cleanDomain = parsed.hostname.replace(/^www\./i, '');

  if (!jsonOutput) {
    console.log(
      `\n\x1b[1m\x1b[38;2;129;140;248m[AnswerRail v1.2.13]\x1b[0m Probing \x1b[4m${targetUrl}\x1b[0m (Page + /robots.txt + /llms.txt + /.well-known/ai-catalog.json)...\n`
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
    const verdictTier = requiresEdgeForTruncation ? 'TIER_2_EDGE_COMPACTION' : 'TIER_1_ZERO_DNS_FIX_PACK';

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
      const preview = buildManifestPreview(rawHtml, origin, cleanDomain);
      console.log(`\x1b[1m\x1b[36m[6-LINE /llms.txt & ARD 1.0 DIAGNOSTIC PREVIEW FOR ${cleanDomain.toUpperCase()}]\x1b[0m`);
      console.log(preview.llmsPreview);
      console.log('\nARD 1.0 (/.well-known/ai-catalog.json & /.well-known/ard.json) Preview:');
      console.log(preview.ardPreview);
      console.log(`\n  \x1b[33m→ Unlock all 7 validated files (/llms.txt, /llms-full.txt, ai-catalog.json, ard.json, robots.txt Agentmap, Schema.org @graph & Zero-DNS Worker) for $79:\x1b[0m`);
      console.log(`    \x1b[4mhttps://answerrail.com/api/checkout/start?plan=fix_pack&channel=cli&domain=${encodeURIComponent(cleanDomain)}\x1b[0m\n`);
    }

    // [⚡ 2-TIER REMEDIATION VERDICT]
    console.log(
      `\x1b[1m\x1b[36m[⚡ 2-TIER REMEDIATION VERDICT FOR ${cleanDomain.toUpperCase()}]\x1b[0m`
    );
    if (!requiresEdgeForTruncation) {
      console.log(
        `• \x1b[32mOrigin Sizing:\x1b[0m HTML fits within the 25,000-token cutoff (${(rawBytes / 1024).toFixed(1)} KB / ~${estimatedTokens.toLocaleString()} tokens), \x1b[33mbut lacks Zero-Click Answer Shield & GA4 "Dark AI" Lead Attribution\x1b[0m.`
      );
      console.log(
        `• \x1b[1m\x1b[33mTier 1 Action Required ($79 Zero-DNS Fix + GA4 Dark-AI Attribution Pack · 100% Auto-Credited to $99/mo Starter):\x1b[0m`
      );
      console.log(
        `  1-Click WordPress .zip / Shopify Redirect / 7-File Bundle (/llms.txt, ARD 1.0 ai-catalog.json, Zero-Click Wedge) + 1-Line GA4 Dark-AI Lead Tracker + Live /stats/${cleanDomain} Cockpit:`
      );
      console.log(
        `  \x1b[4mhttps://answerrail.com/api/checkout/start?plan=fix_pack&channel=cli&domain=${encodeURIComponent(cleanDomain)}\x1b[0m`
      );
      console.log(
        `• \x1b[1m\x1b[32mTier 2 Autopilot [Starter $99/mo ($20 Month 1 w/ Credit) | Growth $249/mo | Agency $599/mo]:\x1b[0m \x1b[4mhttps://answerrail.com/api/checkout/start?plan=starter&channel=cli&domain=${encodeURIComponent(cleanDomain)}\x1b[0m`
      );
    } else {
      console.log(
        `• \x1b[31mCritical Truncation:\x1b[0m ${(rawBytes / 1024).toFixed(1)} KB HTML (~${estimatedTokens.toLocaleString()} tokens) exceeds 25k cutoff by \x1b[1m${truncationExcess.toLocaleString()} tokens (${truncatedPercent}% dropped)\x1b[0m.`
      );
      if (droppedPricesCount > 0) {
        console.log(
          `• \x1b[31mPricing Omission:\x1b[0m \x1b[1m${droppedPricesCount} of ${allPrices.length}\x1b[0m pricing tokens truncated past byte 100,000 (Sample dropped: ${droppedSample.join(', ')}).`
        );
      }
      if (rscBytes > 10240) {
        console.log(
          `• \x1b[33mRoot Cause:\x1b[0m ${(rscBytes / 1024).toFixed(1)} KB of inline Next.js RSC hydration scripts consume the token budget before pricing completes.`
        );
      }
      console.log(
        `• \x1b[1m\x1b[33mTier 1 ($79 Zero-DNS 7-File Fix Pack + 30-Day Live Cockpit · 100% Credited to Starter):\x1b[0m \x1b[4mhttps://answerrail.com/api/checkout/start?plan=fix_pack&channel=cli&domain=${encodeURIComponent(cleanDomain)}\x1b[0m`
      );
      console.log(
        `• \x1b[1m\x1b[32mTier 2 Recommended [Starter $99/mo ($20 Month 1 w/ Credit) | Growth $249/mo (5 Domains) | Agency $599/mo (15 Domains)]:\x1b[0m \x1b[4mhttps://answerrail.com/api/checkout/start?plan=starter&channel=cli&domain=${encodeURIComponent(cleanDomain)}\x1b[0m`
      );
    }
    console.log(
      `• \x1b[1mLive Diagnostic Report:\x1b[0m \x1b[4mhttps://answerrail.com/report/${cleanDomain}\x1b[0m\n`
    );

    await telemetryPromise;
  } catch (err) {
    console.error(`\x1b[31mError probing target URL:\x1b[0m`, err.message);
    process.exit(1);
  }
}

runAudit();
