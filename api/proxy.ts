import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - Dynamic API Proxy
 * อ่าน VITE_BE_URL จาก environment variables (Preview/Production)
 * แล้ว forward requests ไปยัง backend ที่ถูกต้องตามสภาพแวดล้อม
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. อ่าน backend URL จาก environment variable
    const backendUrl = process.env.VITE_BE_URL;
    if (!backendUrl) {
      return res.status(500).json({
        error: 'VITE_BE_URL environment variable is not set',
      });
    }

    // 2. ดึงเส้นทาง (path) จาก query parameter
    const targetPath = req.query.path as string | string[] | undefined;
    if (!targetPath) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const pathStr = Array.isArray(targetPath) ? targetPath.join('/') : targetPath;

    // 3. สร้าง URL เต็มพร้อม query string
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path' && value) {
        const val = Array.isArray(value) ? value.join(',') : value;
        queryParams.append(key, val);
      }
    });

    const targetUrl = `${backendUrl}/${pathStr}${queryParams.toString() ? `?${queryParams}` : ''}`;

    // 4. Copy headers จาก request ต้นฉบับ (ยกเว้น host)
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (key !== 'host' && key !== 'connection' && value) {
        const headerValue = Array.isArray(value) ? value[0] : value;
        headers[key] = headerValue;
      }
    });

    // 5. Forward request ไปยัง backend
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 6. Copy headers จาก response
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (key !== 'content-encoding') {
        responseHeaders[key] = value;
      }
    });

    res.status(response.status);
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // 7. ส่ง response body
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else if (contentType.includes('text/event-stream')) {
      // SSE support
      const text = await response.text();
      res.end(text);
    } else {
      const text = await response.text();
      res.end(text);
    }
  } catch (error) {
    console.error('[Proxy Error]', error);
    res.status(502).json({
      error: 'Bad Gateway',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
