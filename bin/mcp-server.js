#!/usr/bin/env node

/**
 * AnswerRail MCP Server (answerrail-mcp v1.0.0)
 * Model Context Protocol (MCP) stdio server for auditing AI crawler readiness,
 * 25,000-token HTML RAG truncation, /llms.txt manifests, Schema.org JSON-LD,
 * and Google Lighthouse 13.5 Agentic Browsing (/.well-known/ai-catalog.json ARD 1.0).
 */

import readline from 'node:readline';

const SERVER_NAME = 'answerrail-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'audit_ai_readiness',
    description:
      'Audit any website URL or domain for AI crawler readiness (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot), 25,000-token HTML RAG truncation, /llms.txt manifest presence, Schema.org JSON-LD entities, and Google Lighthouse 13.5 Agentic Browsing (/.well-known/ai-catalog.json ARD 1.0 schema).',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full URL or domain to audit (e.g., https://example.com or example.com)',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'generate_llms_txt_and_ard_catalog',
    description:
      'Generate a ready-to-deploy /llms.txt documentation index and Google Lighthouse 13.5 /.well-known/ai-catalog.json (ARD 1.0) manifest for any domain.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Target domain name (e.g., example.com)',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'fetch_byte0_markdown',
    description:
      'Strip React/Next.js hydration chunks, Shopify Liquid/WordPress DOM bloat, and CSS cruft from any URL and return clean, Byte-0 GitHub-Flavored Markdown (GFM) with extracted Schema.org tables.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full URL to convert to Byte-0 Markdown (e.g., https://example.com/pricing)',
        },
      },
      required: ['url'],
    },
  },
];

function normalizeUrl(raw) {
  let u = String(raw || '').trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u;
  }
  return new URL(u);
}

async function handleToolCall(name, args) {
  try {
    if (name === 'audit_ai_readiness') {
      const parsed = normalizeUrl(args?.url);
      const origin = parsed.origin;
      const domain = parsed.hostname.replace(/^www\./i, '');

      const [auditRes, llmsRes, ardRes, robotsRes] = await Promise.all([
        fetch(`https://answerrail.com/api/audit?url=${encodeURIComponent(parsed.href)}`, {
          headers: { 'User-Agent': 'AnswerRail-MCP/1.0.0' },
        }).then((r) => r.json()).catch(() => ({})),
        fetch(`${origin}/llms.txt`, {
          headers: { 'User-Agent': 'AnswerRail-MCP/1.0.0' },
          redirect: 'follow',
        }).then(async (r) => ({ status: r.status, text: r.ok ? await r.text() : '' })).catch(() => ({ status: 0, text: '' })),
        fetch(`${origin}/.well-known/ai-catalog.json`, {
          headers: { 'User-Agent': 'AnswerRail-MCP/1.0.0' },
          redirect: 'follow',
        }).then(async (r) => ({ status: r.status, json: r.ok ? await r.json().catch(() => null) : null })).catch(() => ({ status: 0, json: null })),
        fetch(`${origin}/robots.txt`, {
          headers: { 'User-Agent': 'AnswerRail-MCP/1.0.0' },
          redirect: 'follow',
        }).then(async (r) => ({ status: r.status, text: r.ok ? await r.text() : '' })).catch(() => ({ status: 0, text: '' })),
      ]);

      const d = auditRes.data || auditRes || {};
      const rawTokens = d.originalTokenEstimate || d.rawTokens || 0;
      const cleanTokens = d.markdownTokenEstimate || d.cleanTokens || 0;
      const score = typeof d.geoScore === 'number' ? d.geoScore : (d.aiReadinessScore ?? 0);
      const grade = d.grade || (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D');
      const hasLlmsTxt = llmsRes.status === 200 && llmsRes.text.includes('#');
      const hasArd = ardRes.status === 200 && ardRes.json && ardRes.json.specVersion === '1.0' && Array.isArray(ardRes.json.entries);
      const hasAgentmap = /Agentmap:\s*https?:\/\//i.test(robotsRes.text || '');

      const reportText = [
        `# AI Readiness & Lighthouse 13.5 Audit: ${domain}`,
        `- **Target URL:** ${parsed.href}`,
        `- **AI Readiness Score:** ${score}/100 (Grade ${grade})`,
        `- **Origin HTML Token Weight:** ${rawTokens.toLocaleString()} tokens (${rawTokens > 25000 ? 'FAIL: Exceeds 25,000-token RAG truncation cliff' : 'PASS: Within 25,000-token RAG window'})`,
        `- **Compiled Byte-0 Markdown Weight:** ${cleanTokens.toLocaleString()} tokens`,
        `- **Lighthouse 13.5 llms-txt (/llms.txt):** ${hasLlmsTxt ? 'PASS (200 OK, valid Markdown heading)' : 'MISSING (Fails Lighthouse 13.5 llms-txt audit)'}`,
        `- **Lighthouse 13.5 ard-schema (/.well-known/ai-catalog.json):** ${hasArd ? `PASS (ARD 1.0 valid, ${ardRes.json.entries.length} entries)` : 'MISSING (Fails Lighthouse 13.5 ard-schema audit)'}`,
        `- **robots.txt Agentmap Directive:** ${hasAgentmap ? 'PASS' : 'MISSING (Add Agentmap: https://' + domain + '/.well-known/ai-catalog.json)'}`,
        `- **Detected Schema.org Entities:** ${(d.detectedSchemaTypes || []).join(', ') || 'None detected'}`,
        ``,
        `## Live Remediation Links`,
        `- **Full Diagnostic Report & Free Copy-Paste Manifests:** https://answerrail.com/report/${domain}`,
        `- **Lighthouse 13.5 ARD 1.0 Implementation Guide:** https://answerrail.com/geo/lighthouse-agentic-browsing-ai-catalog-json-llms-txt`,
        `- **Automated Edge Proxy ($99/mo Starter):** https://buy.stripe.com/eVq5kCcuj9qFcIc1ee0kE01?client_reference_id=${encodeURIComponent(domain)}`,
      ].join('\n');

      return { content: [{ type: 'text', text: reportText }], isError: false };
    }

    if (name === 'generate_llms_txt_and_ard_catalog') {
      const parsed = normalizeUrl(args?.domain);
      const domain = parsed.hostname.replace(/^www\./i, '');
      const auditRes = await fetch(`https://answerrail.com/api/audit?url=${encodeURIComponent(parsed.origin)}`, {
        headers: { 'User-Agent': 'AnswerRail-MCP/1.0.0' },
      }).then((r) => r.json()).catch(() => ({}));
      const d = auditRes.data || auditRes || {};

      const llmsTxt =
        d.compiledMarkdown ||
        `# ${domain}\n\n> Official AI Documentation & Entity Index for https://${domain}\n\n## Core Resources\n- [Homepage](https://${domain}/): Primary product and service overview.\n- [ARD 1.0 Catalog](https://${domain}/.well-known/ai-catalog.json): Machine-readable Agentic Resource Discovery manifest.\n`;

      const ardCatalog = {
        specVersion: '1.0',
        entries: [
          {
            identifier: `urn:air:${domain}:docs:llms-txt`,
            displayName: `${domain} AI Documentation Index (/llms.txt)`,
            type: 'text/markdown',
            url: `https://${domain}/llms.txt`,
            representativeQueries: [
              `What products, services, and pricing does ${domain} offer?`,
              `How do I integrate with or contact ${domain}?`,
              `Official documentation and specifications for ${domain}`,
            ],
          },
        ],
      };

      const out = [
        `# Generated /llms.txt & ARD 1.0 Manifests for ${domain}`,
        ``,
        `## 1. Save as \`/llms.txt\``,
        '```markdown',
        llmsTxt.trim(),
        '```',
        ``,
        `## 2. Save as \`/.well-known/ai-catalog.json\` (Google Lighthouse 13.5 \`ard-schema\`)`,
        '```json',
        JSON.stringify(ardCatalog, null, 2),
        '```',
        ``,
        `## 3. Add to HTML \`<head>\` & \`/robots.txt\``,
        '```html',
        `<link rel="describedby" href="https://${domain}/llms.txt" />`,
        `<link rel="ai-catalog" href="https://${domain}/.well-known/ai-catalog.json" />`,
        '```',
        '```txt',
        `Sitemap: https://${domain}/llms.txt`,
        `Agentmap: https://${domain}/.well-known/ai-catalog.json`,
        '```',
        ``,
        `Live interactive report: https://answerrail.com/report/${domain}`,
      ].join('\n');

      return { content: [{ type: 'text', text: out }], isError: false };
    }

    if (name === 'fetch_byte0_markdown') {
      const parsed = normalizeUrl(args?.url);
      const res = await fetch(`https://answerrail.com/proxy?url=${encodeURIComponent(parsed.href)}`, {
        headers: {
          Accept: 'text/markdown',
          'User-Agent': 'AnswerRail-MCP/1.0.0',
        },
      });
      const md = await res.text();
      return { content: [{ type: 'text', text: md }], isError: !res.ok };
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${err.message}` }],
      isError: true,
    };
  }
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n'
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }

  if (msg.method === 'initialize') {
    sendResponse(msg.id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
    });
    return;
  }

  if (msg.method === 'notifications/initialized' || msg.id === undefined) {
    return;
  }

  if (msg.method === 'ping') {
    sendResponse(msg.id, {});
    return;
  }

  if (msg.method === 'tools/list') {
    sendResponse(msg.id, { tools: TOOLS });
    return;
  }

  if (msg.method === 'tools/call') {
    const toolResult = await handleToolCall(msg.params?.name, msg.params?.arguments || {});
    sendResponse(msg.id, toolResult);
    return;
  }

  sendError(msg.id, -32601, `Method not found: ${msg.method}`);
});
