/// <reference types="@cloudflare/workers-types" />
/**
 * LoomBox Cloudflare Worker
 *
 * Routes:
 *   POST /api/ai      → proxies to Anthropic (ANTHROPIC_API_KEY stays secret)
 *   POST /api/upload  → stores file in R2, returns public URL
 *   GET  /api/health  → health check
 */

export interface Env {
    ANTHROPIC_API_KEY: string   // set via: wrangler secret put ANTHROPIC_API_KEY
    LOOMBOX_BUCKET: R2Bucket  // bound in wrangler.toml
    ALLOWED_ORIGIN: string    // e.g. https://loombox.pages.dev
}

// ── CORS headers ──────────────────────────────────────────
function corsHeaders(origin: string, allowed: string): HeadersInit {
    const allow = allowed === '*' || origin === allowed ? origin : allowed
    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }
}

function json(body: unknown, status = 200, extra: HeadersInit = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...extra },
    })
}

// ── Main handler ──────────────────────────────────────────
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const origin = request.headers.get('Origin') ?? '*'
        const cors = corsHeaders(origin, env.ALLOWED_ORIGIN ?? '*')

        // Preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors })
        }

        const url = new URL(request.url)
        const pathname = url.pathname

        // ── Health ──
        if (pathname === '/api/health') {
            return json({ ok: true, ts: Date.now() }, 200, cors)
        }

        // ── AI proxy ──
        if (pathname === '/api/ai' && request.method === 'POST') {
            return handleAI(request, env, cors)
        }

        // ── R2 upload ──
        if (pathname === '/api/upload' && request.method === 'POST') {
            return handleUpload(request, env, cors)
        }

        // ── R2 serve ──
        if (pathname.startsWith('/uploads/') && request.method === 'GET') {
            return handleServe(pathname, env, cors)
        }

        return json({ error: 'Not found' }, 404, cors)
    },
}

// ── AI proxy handler ──────────────────────────────────────
async function handleAI(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
    try {
        const body = await request.json() as Record<string, unknown>

        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body),
        })

        const data = await upstream.json()

        if (!upstream.ok) {
            console.error('Anthropic error:', upstream.status, data)
            return json({ error: 'AI request failed', detail: data }, upstream.status, cors)
        }

        return json(data, 200, cors)
    } catch (err) {
        console.error('AI handler error:', err)
        return json({ error: 'Internal error' }, 500, cors)
    }
}

// ── R2 upload handler ─────────────────────────────────────
async function handleUpload(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const userId = formData.get('userId') as string | null
        const folder = (formData.get('folder') as string | null) ?? 'uploads'

        if (!file || !userId) {
            return json({ error: 'Missing file or userId' }, 400, cors)
        }

        // Validate file type
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowed.includes(file.type)) {
            return json({ error: 'File type not allowed' }, 400, cors)
        }

        // 10 MB limit
        if (file.size > 10 * 1024 * 1024) {
            return json({ error: 'File too large (max 10 MB)' }, 400, cors)
        }

        // Build a unique key
        const ext = file.name.split('.').pop() ?? 'jpg'
        const key = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        // Store in R2
        const buffer = await file.arrayBuffer()
        await env.LOOMBOX_BUCKET.put(key, buffer, {
            httpMetadata: { contentType: file.type },
        })

        // Public URL — requires R2 custom domain or public access
        // Format: https://pub-<hash>.r2.dev/<key>  (after enabling public access)
        // OR use your custom domain: https://uploads.loombox.app/<key>
        const publicUrl = `/uploads/${key}`

        return json({ url: publicUrl, key }, 200, cors)
    } catch (err) {
        console.error('Upload error:', err)
        return json({ error: 'Upload failed' }, 500, cors)
    }
}

// ── R2 serve handler ──────────────────────────────────────
async function handleServe(pathname: string, env: Env, cors: HeadersInit): Promise<Response> {
    try {
        const key = pathname.replace('/uploads/', '')
        const object = await env.LOOMBOX_BUCKET.get(key)

        if (!object) return json({ error: 'Not found' }, 404, cors)

        const headers = new Headers(cors as Record<string, string>)
        headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream')
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
        headers.set('ETag', object.etag)

        return new Response(object.body, { headers })
    } catch (err) {
        console.error('Serve error:', err)
        return json({ error: 'Serve failed' }, 500, cors)
    }
}