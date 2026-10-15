/**
 * RFC-2602 Reference Open-Source Edge Worker
 * Standard for Context-Ceiling Preservation & Markdown Content Negotiation
 *
 * Authored by The Quite Good Project (https://quitegoodproject.com)
 * Reference Platform: AnswerRail (https://answerrail.com)
 */

const AI_BOT_REGEX = /(PerplexityBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Anthropic-AI|Applebot-Extended|TokenMarkdown-MCP|cohere-ai)/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const acceptHeader = request.headers.get('accept') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const wantsMarkdown = acceptHeader.includes('text/markdown') || AI_BOT_REGEX.test(userAgent);

    // Bypass: Humans get regular origin traffic with zero interference
    if (!wantsMarkdown) {
      return fetch(request);
    }

    // AI Crawler: Attempt to serve from edge cache first
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), {
      headers: { 'Accept': 'text/markdown' }
    });

    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers
      });
    }

    // Fetch origin HTML
    const originResponse = await fetch(request);
    const contentType = originResponse.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) {
      return originResponse;
    }

    const rawHtml = await originResponse.text();
    const markdown = convertHtmlToSemanticMarkdown(rawHtml, url.href);

    const responseHeaders = new Headers({
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept, User-Agent',
      'X-AI-Protocol': 'RFC-2602',
      'X-AI-Gateway': 'RFC-2602 Open Edge Worker (Reference Implementation)',
      'X-Origin-Url': url.href,
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    });

    const markdownResponse = new Response(markdown, {
      status: 200,
      headers: responseHeaders
    });

    // Cache the compiled markdown asynchronously
    ctx.waitUntil(cache.put(cacheKey, markdownResponse.clone()));

    return markdownResponse;
  }
};

/**
 * Lightweight deterministic HTML-to-Markdown parser for Cloudflare V8 isolates.
 * Strips script tags, styles, SVGs, and navigation, extracting semantic text and tables.
 */
function convertHtmlToSemanticMarkdown(html, sourceUrl) {
  // Extract Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Document';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract JSON-LD Schema if present
  let schemaBlock = '';
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1].trim());
      const type = parsed['@type'] || 'Entity';
      const name = parsed.name || title;
      schemaBlock = `### 📋 Structured Schema (${type})\n| Property | Value |\n| :--- | :--- |\n| **Name** | ${name} |\n`;
      if (parsed.description) schemaBlock += `| **Description** | ${parsed.description} |\n`;
      if (parsed.offers && parsed.offers.price) schemaBlock += `| **Pricing** | ${parsed.offers.priceCurrency || '$'}${parsed.offers.price} |\n`;
      schemaBlock += '\n---\n';
    } catch (_) {
      // Ignore malformed JSON-LD
    }
  }

  // De-bloat: Strip non-semantic content
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Convert basic headings and paragraphs
  clean = clean
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n* $1')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '') // Strip remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `---
title: "${title.replace(/"/g, '\\"')}"
source_url: "${sourceUrl}"
rfc_standard: "RFC-2602"
retrieved_at: "${new Date().toISOString()}"
---

# ${title}

${description ? `> ${description}\n` : ''}
${schemaBlock}
${clean}
`;
}
