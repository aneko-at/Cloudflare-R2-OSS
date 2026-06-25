import { listFiles, getFile, uploadFile, deleteFile, deleteFolder, createFolder } from './services/r2';
import { verifyTurnstile, verifyAccessCode } from './services/turnstile';
import type { ApiResponse } from './types';

export interface Env {
  R2_BUCKET: R2Bucket;
  ACCESS_CODE: string;
  TURNSTILE_SECRET_KEY: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // API 路由
    if (path.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // 静态资源（前端 SPA）
    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch {
        // 资源不存在，返回 index.html 支持 SPA 路由
      }
    }

    // 返回 index.html 支持 SPA
    if (env.ASSETS) {
      const indexUrl = new URL(request.url);
      indexUrl.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return jsonResponse({ success: false, error: 'Not Found' }, 404);
  },
};

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  // GET /api/files - 列出文件
  if (method === 'GET' && path === '/api/files') {
    const prefix = url.searchParams.get('prefix') || '';
    try {
      const result = await listFiles(env.R2_BUCKET, prefix);
      return jsonResponse({ success: true, data: result });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 500);
    }
  }

  // GET /api/files/download - 下载文件
  if (method === 'GET' && path === '/api/files/download') {
    const key = url.searchParams.get('key');
    if (!key) {
      return jsonResponse({ success: false, error: 'Missing key parameter' }, 400);
    }
    try {
      const object = await getFile(env.R2_BUCKET, key);
      if (!object) {
        return jsonResponse({ success: false, error: 'File not found' }, 404);
      }
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(key.split('/').pop() || key)}"`);
      headers.set('Access-Control-Allow-Origin', '*');
      if (object.etag) headers.set('ETag', object.etag);
      return new Response(object.body, { headers });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 500);
    }
  }

  // POST /api/files/upload - 上传文件（需 Turnstile，管理员登录后免验证）
  if (method === 'POST' && path === '/api/files/upload') {
    const isAdmin = verifyAccessCode(request.headers.get('X-Access-Code') || '', env.ACCESS_CODE);
    if (!isAdmin) {
      const turnstileResult = await verifyTurnstileOnly(request, env);
      if (!turnstileResult.passed) return turnstileResult.response!;
    }

    try {
      const formData = await request.formData();
      const prefix = formData.get('prefix') as string || '';
      const files = formData.getAll('files') as unknown as File[];

      if (!files || files.length === 0) {
        return jsonResponse({ success: false, error: 'No files provided' }, 400);
      }

      const uploaded: string[] = [];
      for (const file of files) {
        const key = prefix ? `${prefix}${file.name}` : file.name;
        const buffer = await file.arrayBuffer();
        await uploadFile(env.R2_BUCKET, key, buffer, file.type);
        uploaded.push(key);
      }

      return jsonResponse({ success: true, data: { uploaded } });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 500);
    }
  }

  // DELETE /api/files/delete - 删除文件（仅管理员，免 Turnstile）
  if (method === 'DELETE' && path === '/api/files/delete') {
    if (!verifyAccessCode(request.headers.get('X-Access-Code') || '', env.ACCESS_CODE)) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    const key = url.searchParams.get('key');
    if (!key) {
      return jsonResponse({ success: false, error: 'Missing key parameter' }, 400);
    }

    try {
      if (key.endsWith('/')) {
        await deleteFolder(env.R2_BUCKET, key);
      } else {
        await deleteFile(env.R2_BUCKET, key);
      }
      return jsonResponse({ success: true, data: { deleted: key } });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 500);
    }
  }

  // POST /api/folders - 创建文件夹（仅管理员，免 Turnstile）
  if (method === 'POST' && path === '/api/folders') {
    if (!verifyAccessCode(request.headers.get('X-Access-Code') || '', env.ACCESS_CODE)) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }

    try {
      const body: { name: string; prefix: string } = await request.json();
      const folderPath = body.prefix ? `${body.prefix}${body.name}/` : `${body.name}/`;
      await createFolder(env.R2_BUCKET, folderPath);
      return jsonResponse({ success: true, data: { folder: folderPath } });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 500);
    }
  }

  // POST /api/auth/verify - 验证 Access Code
  if (method === 'POST' && path === '/api/auth/verify') {
    try {
      const body: { code: string } = await request.json();
      const valid = verifyAccessCode(body.code, env.ACCESS_CODE);
      return jsonResponse({ success: true, data: { valid } });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 400);
    }
  }

  // POST /api/turnstile/verify - 验证 Turnstile Token
  if (method === 'POST' && path === '/api/turnstile/verify') {
    try {
      const body: { token: string } = await request.json();
      const valid = await verifyTurnstile(body.token, env.TURNSTILE_SECRET_KEY);
      return jsonResponse({ success: true, data: { valid } });
    } catch (e) {
      return jsonResponse({ success: false, error: String(e) }, 400);
    }
  }

  return jsonResponse({ success: false, error: 'Unknown API endpoint' }, 404);
}

interface AuthCheckResult {
  passed: boolean;
  response?: Response;
}

async function verifyTurnstileOnly(request: Request, env: Env): Promise<AuthCheckResult> {
  const token = request.headers.get('X-Turnstile-Token') || '';
  if (!token) {
    return {
      passed: false,
      response: jsonResponse({ success: false, error: 'Missing Turnstile token' }, 400),
    };
  }
  const valid = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
  if (!valid) {
    return {
      passed: false,
      response: jsonResponse({ success: false, error: 'Turnstile verification failed' }, 403),
    };
  }
  return { passed: true };
}

function jsonResponse(data: ApiResponse, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Access-Code, X-Turnstile-Token',
    },
  });
}

function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Access-Code, X-Turnstile-Token');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}