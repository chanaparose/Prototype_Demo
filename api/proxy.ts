export const config = {
  runtime: 'edge',
};

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function resolveBackendBase(): string {
  const raw = process.env.VITE_BE_URL?.trim().replace(/\/$/, '');
  if (!raw) {
    throw new Error('VITE_BE_URL environment variable is not set');
  }
  // tolerate typo: https://tryly-dev-server.onrender (missing .com)
  if (/\.onrender$/i.test(raw)) {
    return `${raw}.com`;
  }
  return raw;
}

function buildTargetUrl(requestUrl: URL, pathStr: string): URL {
  const base = resolveBackendBase();
  const target =
    pathStr === 'health' ? new URL(`${base}/health`) : new URL(`${base}/api/${pathStr}`);

  requestUrl.searchParams.forEach((value, key) => {
    if (key !== 'path') {
      target.searchParams.append(key, value);
    }
  });

  return target;
}

function forwardRequestHeaders(request: Request): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  return headers;
}

function forwardResponseHeaders(backend: Response): Headers {
  const headers = new Headers();
  backend.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  if (backend.headers.get('content-type')?.includes('text/event-stream')) {
    headers.set('cache-control', 'no-cache');
    headers.set('x-accel-buffering', 'no');
  }
  return headers;
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const requestUrl = new URL(request.url);
    const pathParam = requestUrl.searchParams.get('path');
    if (!pathParam) {
      return Response.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const targetUrl = buildTargetUrl(requestUrl, pathParam);
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: forwardRequestHeaders(request),
      body: hasBody ? request.body : undefined,
      // @ts-expect-error — required for streaming request bodies on Edge
      duplex: hasBody ? 'half' : undefined,
    });

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: forwardResponseHeaders(backendResponse),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    const status = message.includes('VITE_BE_URL') ? 500 : 502;
    return Response.json({ error: message }, { status });
  }
}
