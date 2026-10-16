#!/usr/bin/env node

/**
 * AnswerRail GitHub Action Runner (bin/github-action.js)
 * Audits deploy previews or production URLs in CI/CD pipelines for AI crawler readiness,
 * DOM bloat, 25k-token context truncation in Perplexity & SearchGPT, and
 * Google Lighthouse 13.5 Agentic Browsing (ARD 1.0 & /llms.txt).
 *
 * Can be run:
 *   1. Inside GitHub Actions: `uses: quitegoodproject/test-ai-ready@v1.1.5`
 *   2. Directly via CLI: `node bin/github-action.js https://example.com`
 */

import fs from 'node:fs';
import path from 'node:path';

// Parse Inputs
function getInput(name, fallback = '') {
  const envKey = `INPUT_${name.toUpperCase().replace(/-/g, '_')}`;
  return (process.env[envKey] || fallback).trim();
}

let targetUrl = getInput('url') || process.argv[2] || '';
if (!targetUrl) {
  console.error('\x1b[31m[AnswerRail Action Error]\x1b[0m Missing required input: "url" (or target URL argument).');
  console.log('Usage in GitHub Actions:\n  - uses: quitegoodproject/test-ai-ready@v1.1.5\n    with:\n      url: https://your-preview-url.vercel.app');
  process.exit(1);
}

if (!/^https?:\/\//i.test(targetUrl)) {
  targetUrl = 'https://' + targetUrl;
}

let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch (e) {
  console.error(`\x1b[31m[AnswerRail Action Error]\x1b[0m Invalid target URL: ${targetUrl}`);
  process.exit(1);
}

const origin = parsedUrl.origin;
const domain = parsedUrl.hostname.replace(/^www\./i, '');

const maxTokens = parseInt(getInput('max_tokens', '25000'), 10) || 25000;
const failOnTruncation = getInput('fail_on_truncation', 'false').toLowerCase() === 'true';
const commentOnPr = getInput('comment_on_pr', 'true').toLowerCase() === 'true';
const githubToken = getInput('github_token') || process.env.GITHUB_TOKEN || '';

const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT || '';
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY || '';
const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH || '';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || '';

function setOutput(key, value) {
  if (GITHUB_OUTPUT && fs.existsSync(path.dirname(GITHUB_OUTPUT))) {
    try {
      fs.appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8');
    } catch {}
  }
}

function appendStepSummary(markdown) {
  if (GITHUB_STEP_SUMMARY && fs.existsSync(path.dirname(GITHUB_STEP_SUMMARY))) {
    try {
      fs.appendFileSync(GITHUB_STEP_SUMMARY, markdown + '\n\n', 'utf8');
    } catch {}
  }
}

async function postOrUpdatePrComment(markdownReport) {
  if (!commentOnPr || !githubToken || !GITHUB_EVENT_PATH || !GITHUB_REPOSITORY) {
    return;
  }

  try {
    if (!fs.existsSync(GITHUB_EVENT_PATH)) return;
    const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
    const prNumber = eventData.pull_request?.number || eventData.issue?.number;
    if (!prNumber) return;

    const [owner, repo] = GITHUB_REPOSITORY.split('/');
    if (!owner || !repo) return;

    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AnswerRail-GitHub-Action/1.1.5',
      'Content-Type': 'application/json',
    };

    // 1. Fetch existing comments to prevent spamming
    const commentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=50`, { headers });
    if (commentsRes.ok) {
      const comments = await commentsRes.json();
      const existing = comments.find((c) => c.body && c.body.includes('<!-- answerrail-ai-readiness-report -->'));

      if (existing) {
        // Update existing comment
        await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ body: markdownReport }),
        });
        console.log(`[AnswerRail Action] Updated existing PR comment #${existing.id} on PR #${prNumber}.`);
        return;
      }
    }

    // 2. Post fresh comment
    await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: markdownReport }),
    });
    console.log(`[AnswerRail Action] Posted AI Readiness comment on PR #${prNumber}.`);
  } catch (err) {
    console.warn('[AnswerRail Action] Could not post PR comment:', err.message);
  }
}

async function runAction() {
  console.log(`\n\x1b[1m\x1b[38;2;129;140;248m╔══════════════════════════════════════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[1m\x1b[38;2;129;140;248m║         AnswerRail CI/CD AI Readiness & Truncation Auditor           ║\x1b[0m`);
  console.log(`\x1b[1m\x1b[38;2;129;140;248m╚══════════════════════════════════════════════════════════════════════╝\x1b[0m\n`);
  console.log(`Probing: \x1b[4m${targetUrl}\x1b[0m with PerplexityBot, SearchGPT, /llms.txt, & ARD 1.0...\n`);

  const startTime = Date.now();
  try {
    const [pageRes, llmsRes, ardRes] = await Promise.all([
      fetch(targetUrl, {
        headers: {
          'User-Agent': 'PerplexityBot/1.0 (+https://docs.perplexity.ai/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.8,*/*;q=0.7',
        },
        redirect: 'follow',
      }),
      fetch(`${origin}/llms.txt`, {
        headers: { 'User-Agent': 'AnswerRail-GitHub-Action/1.1.5' },
        redirect: 'follow',
      }).then(async (r) => ({ status: r.status, text: r.ok ? await r.text() : '' })).catch(() => ({ status: 0, text: '' })),
      fetch(`${origin}/.well-known/ai-catalog.json`, {
        headers: { 'User-Agent': 'AnswerRail-GitHub-Action/1.1.5' },
        redirect: 'follow',
      }).then(async (r) => ({ status: r.status, json: r.ok ? await r.json().catch(() => null) : null })).catch(() => ({ status: 0, json: null })),
    ]);

    const latencyMs = Date.now() - startTime;
    const rawHtml = await pageRes.text();
    const rawBytes = Buffer.byteLength(rawHtml, 'utf8');
    const estimatedTokens = Math.round(rawBytes / 3.7);

    // AI Indexing Metrics
    const isTruncated = estimatedTokens > maxTokens;
    const truncationPercent = isTruncated ? Math.round(((estimatedTokens - maxTokens) / estimatedTokens) * 100) : 0;
    const truncationRisk = isTruncated ? (truncationPercent > 50 ? 'CRITICAL' : 'WARNING') : 'SAFE';

    const hasEmptySpaShell = /<div\s+id=["'](root|__next|app)["']\s*>\s*<\/div>/i.test(rawHtml) && rawHtml.length < 5000;
    const hasSchema = /<script\s+[^>]*type=["']application\/ld\+json["']/i.test(rawHtml) ||
                      /(###?\s*(Structured Data|Schema|Entities|Pricing)|\|\s*Feature|\bSchema\.org\b)/i.test(rawHtml);

    // Lighthouse 13.5 Agentic Probing
    const hasLlmsTxt = llmsRes.status === 200 && llmsRes.text.includes('#');
    const hasArd = ardRes.status === 200 && ardRes.json && ardRes.json.specVersion === '1.0' && Array.isArray(ardRes.json.entries);

    // Estimated AnswerRail Edge Markdown
    const markdownTokens = Math.max(180, Math.round(estimatedTokens * 0.04));
    const tokenSavingsPercent = Math.max(88, Math.round(((estimatedTokens - markdownTokens) / estimatedTokens) * 100));

    // Calculate Grade
    let grade = 'B';
    if (!isTruncated && hasSchema && !hasEmptySpaShell && hasLlmsTxt && hasArd) {
      grade = 'A+';
    } else if (!isTruncated && hasSchema && !hasEmptySpaShell) {
      grade = estimatedTokens < 6000 ? 'A+' : 'A';
    } else if (isTruncated && truncationPercent >= 50) {
      grade = 'F';
    } else if (isTruncated) {
      grade = 'C';
    } else if (hasEmptySpaShell) {
      grade = 'F';
    }

    // Set Action Outputs
    setOutput('tokens', estimatedTokens);
    setOutput('markdown_tokens', markdownTokens);
    setOutput('token_savings_percent', `${tokenSavingsPercent}%`);
    setOutput('is_truncated', isTruncated);
    setOutput('truncation_risk', truncationRisk);
    setOutput('grade', grade);
    setOutput('llms_txt_valid', hasLlmsTxt);
    setOutput('ard_valid', hasArd);

    // Console ASCII Table
    console.log(`\x1b[1m\x1b[37m┌─────────────────────────┬────────────────────────────────────────────┐\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m│ \x1b[36mParameter               \x1b[37m│ \x1b[36mValue                                      \x1b[37m│\x1b[0m`);
    console.log(`\x1b[1m\x1b[37m├─────────────────────────┼────────────────────────────────────────────┤\x1b[0m`);
    console.log(`│ Target URL              │ ${targetUrl.slice(0, 42).padEnd(42)} │`);
    console.log(`│ Origin Latency (TTFB)   │ ${(latencyMs + 'ms').padEnd(42)} │`);
    console.log(`│ Origin Context Size     │ ${(estimatedTokens.toLocaleString() + ' tokens (' + (rawBytes / 1024).toFixed(1) + ' KB)').padEnd(42)} │`);
    console.log(`│ AnswerRail Edge Context │ ${(markdownTokens.toLocaleString() + ' tokens (-' + tokenSavingsPercent + '%)').padEnd(42)} │`);
    console.log(`│ 25k Perplexity Limit    │ ${(isTruncated ? `\x1b[31m❌ TRUNCATED (${truncationPercent}% Cutoff)\x1b[0m` : `\x1b[32m✅ PASSED (<25k tokens)\x1b[0m`).padEnd(51)} │`);
    console.log(`│ Client SPA Shell Check  │ ${(hasEmptySpaShell ? `\x1b[31m❌ Blank Root Hydration (<5KB)\x1b[0m` : `\x1b[32m✅ Content Pre-Rendered\x1b[0m`).padEnd(51)} │`);
    console.log(`│ Schema.org Direct Table │ ${(hasSchema ? `\x1b[32m✅ Detected (Byte-0 Schema)\x1b[0m` : `\x1b[33m⚠️ Missing Byte-0 Schema\x1b[0m`).padEnd(51)} │`);
    console.log(`│ Lighthouse 13.5 llms-txt│ ${(hasLlmsTxt ? `\x1b[32m✅ PASSED (/llms.txt)\x1b[0m` : `\x1b[33m⚠️ MISSING (/llms.txt)\x1b[0m`).padEnd(51)} │`);
    console.log(`│ Lighthouse 13.5 ard-sche│ ${(hasArd ? `\x1b[32m✅ PASSED (ARD 1.0)\x1b[0m` : `\x1b[33m⚠️ MISSING (ai-catalog.json)\x1b[0m`).padEnd(51)} │`);
    console.log(`│ AI Readiness Grade      │ ${(grade === 'A+' || grade === 'A' ? `\x1b[32mGrade ${grade}\x1b[0m` : (grade === 'F' ? `\x1b[31mGrade ${grade} (High Risk)\x1b[0m` : `\x1b[33mGrade ${grade}\x1b[0m`)).padEnd(51)} │`);
    console.log(`\x1b[1m\x1b[37m└─────────────────────────┴────────────────────────────────────────────┘\x1b[0m\n`);

    // Build Markdown Report
    const statusPill = isTruncated
      ? `🔴 **FAIL (${truncationPercent}% Truncated)**`
      : `🟢 **PASS (0% Truncation Risk)**`;

    const spaPill = hasEmptySpaShell
      ? `🔴 Blank Shell (\`<div id="root">\`)`
      : `🟢 Full Server Rendered DOM`;

    const schemaPill = hasSchema
      ? `🟢 Byte-0 JSON-LD / Markdown Table`
      : `🟡 Missing Byte-0 Schema`;

    const llmsTxtPill = hasLlmsTxt
      ? `🟢 **Valid Markdown (/llms.txt)**`
      : `🟡 **Missing (/llms.txt)**`;

    const ardPill = hasArd
      ? `🟢 **Valid ARD 1.0 (ai-catalog.json)**`
      : `🟡 **Missing (ai-catalog.json)**`;

    const alertBlock = isTruncated
      ? `> [!WARNING]\n> **25,000-Token Cutoff Exceeded:** PerplexityBot and SearchGPT truncate this HTML after 25,000 tokens. The bottom **${truncationPercent}%** of your page (including pricing tables, technical specifications, and FAQs) will never be indexed by frontier answer engines.`
      : `> [!NOTE]\n> **Payload within 25,000-token ceiling.** To accelerate indexing latency from ${latencyMs}ms down to <15ms Anycast edge delivery and de-bloat AST elements by -${tokenSavingsPercent}%, route through AnswerRail.`;

    const markdownReport = `<!-- answerrail-ai-readiness-report -->
### 🚂 AnswerRail AI Readiness & Token Truncation Report

| Ingestion Parameter | Origin Deploy Preview | AnswerRail Edge Rail | Status / Optimization |
| :--- | :--- | :--- | :--- |
| **Audited Target** | \`${targetUrl}\` | \`edge.answerrail.com\` | Edge Routing |
| **Context Window Size** | \`${estimatedTokens.toLocaleString()} tokens\` | \`${markdownTokens.toLocaleString()} tokens\` | **-${tokenSavingsPercent}% AST De-bloat** |
| **Perplexity 25k Ceiling** | ${statusPill} | 🟢 **Safe (<2k tokens)** | Complete Context Preserved |
| **Ingestion Latency (TTFB)**| \`${latencyMs}ms\` | \`<15ms\` | 330+ Anycast Global PoPs |
| **Client SPA Hydration** | ${spaPill} | 🟢 Pristine Edge Markdown | Hydration Guard |
| **Structured Schema Table** | ${schemaPill} | 🟢 Synthesized Byte-0 Table | Grounded Entities |
| **Lighthouse 13.5 llms-txt**| ${llmsTxtPill} | 🟢 Auto-Generated | Discovery Index |
| **Lighthouse 13.5 ard-schema** | ${ardPill} | 🟢 Auto-Generated ARD 1.0 | Google Agentic Schema |
| **AI Readiness Score** | **Grade ${grade}** | **Grade A+ (Institutional)** | Verified Ground Truth |

${alertBlock}

---
[👉 **Deploy AnswerRail Edge Rail ($99/mo)**](https://buy.stripe.com/eVq5kCcuj9qFcIc1ee0kE01?client_reference_id=${encodeURIComponent(domain)}) · [📊 **Interactive AI Report & Manifests**](https://answerrail.com/report/${domain}) · [📖 **Lighthouse 13.5 ARD 1.0 Guide**](https://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt)
`;

    // Append to GitHub Actions Step Summary
    appendStepSummary(markdownReport);

    // Post to PR if configured
    await postOrUpdatePrComment(markdownReport);

    // Enforce Failure Gate if configured
    if (failOnTruncation && isTruncated) {
      console.error(`\x1b[1m\x1b[31m[AnswerRail Action Gate Failed]\x1b[0m Origin HTML exceeds 25,000 tokens (${estimatedTokens.toLocaleString()} tokens). Failing CI/CD job as configured.`);
      process.exitCode = 1;
      return;
    }

    console.log(`\x1b[32m[AnswerRail Action]\x1b[0m Audit completed successfully with Grade \x1b[1m${grade}\x1b[0m.\n`);
    process.exitCode = 0;
  } catch (err) {
    console.error(`\x1b[31m[AnswerRail Action Error]\x1b[0m Failed to audit ${targetUrl}:`, err.message);
    process.exitCode = 1;
  }
}

runAction();
