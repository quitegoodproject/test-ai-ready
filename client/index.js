// AnswerRail Client Middleware (Next.js & Edge Runtime)
const AI_CRAWLER_USER_AGENTS = [
  'perplexitybot',
  'oai-searchbot',
  'chatgpt-user',
  'claudebot',
  'claude-searchbot',
  'claude-user',
  'applebot-extended',
  'google-extended',
  'google-gemini',
  'vertexai',
  'google-inspectiontool',
  'cohere-ai',
  'diffbot',
  'bytespider',
  'amazonbot',
  'yandexbot',
  'facebookexternalhit',
  'meta-externalagent',
  'meta-externalfetcher',
];

export function isAiCrawler(request) {
  const url = new URL(request.url);
  if (url.searchParams.get('format') === 'markdown' || url.searchParams.get('answerrail') === '1') {
    return true;
  }
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/markdown')) return true;

  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  return AI_CRAWLER_USER_AGENTS.some(bot => ua.includes(bot));
}

export function answerRail(options = {}) {
  return async function middleware(request) {
    if (options.bypass || request.headers.get('x-answerrail-bypass') === 'true') {
      return undefined;
    }

    if (!isAiCrawler(request)) {
      return undefined; // Human / Googlebot: pass through to Next.js handler untouched
    }

    const edgeBase = options.edgeUrl || 'https://edge.answerrail.com';
    const requestUrl = new URL(request.url);
    const targetUrl = options.origin 
      ? new URL(requestUrl.pathname + requestUrl.search, options.origin).toString()
      : request.url;

    const proxyEndpoint = `${edgeBase}/proxy?url=${encodeURIComponent(targetUrl)}`;

    try {
      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-By', 'AnswerRail-Client/1.0.9');
      headers.set('Accept', 'text/markdown; charset=utf-8');
      if (options.apiKey) {
        headers.set('Authorization', `Bearer ${options.apiKey}`);
      }

      const edgeResponse = await fetch(proxyEndpoint, {
        headers,
        redirect: 'follow',
      });

      const responseHeaders = new Headers(edgeResponse.headers);
      responseHeaders.set('Vary', 'User-Agent, Accept');
      responseHeaders.set('X-AnswerRail-Middleware', 'active');

      return new Response(edgeResponse.body, {
        status: edgeResponse.status,
        statusText: edgeResponse.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      console.warn('[AnswerRail Middleware] Edge proxy unreachable, failing open to origin:', err);
      return undefined;
    }
  };
}

export const answerRailMiddleware = answerRail;
export default answerRail;
