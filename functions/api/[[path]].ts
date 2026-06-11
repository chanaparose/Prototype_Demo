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

function resolveBackendBase(env: Record<string, string | undefined>): string {
  const raw = env.VITE_BE_URL?.trim().replace(/\/$/, '');
  if (!raw) {
    throw new Error('VITE_BE_URL environment variable is not set');
  }
  if (/\.onrender$/i.test(raw)) {
    return `${raw}.com`;
  }
  return raw;
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

interface Env {
  VITE_BE_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;

  try {
    const base = resolveBackendBase(env as Record<string, string | undefined>);
    const pathSegments = (params.path as string[]) ?? [];
    const pathStr = pathSegments.join('/');

    const requestUrl = new URL(request.url);
    const targetUrl =
      pathStr === 'health' ? new URL(`${base}/health`) : new URL(`${base}/api/${pathStr}`);

    requestUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: forwardRequestHeaders(request),
      body: hasBody ? request.body : undefined,
      // @ts-expect-error — required for streaming request bodies
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
};
