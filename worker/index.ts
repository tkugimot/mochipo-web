import { contactSchema } from '../src/lib/contactSchema';

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM: string;
  ALLOWED_ORIGIN: string;
}

const MAX_BODY_BYTES = 16 * 1024;
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_URL = 'https://api.resend.com/emails';

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  const allowed = env.ALLOWED_ORIGIN.split(',').map((o) => o.trim());
  if (!allowed.includes(request.headers.get('Origin') ?? '')) return json({ ok: false, error: 'forbidden' }, 403);
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    return json({ ok: false, error: 'unsupported_media_type' }, 415);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json({ ok: false, error: 'too_large' }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return json({ ok: false, error: 'validation', fields: parsed.error.flatten().fieldErrors }, 400);
  }
  const { name, email, message, turnstileToken } = parsed.data;

  const verify = await fetch(TURNSTILE_URL, {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: turnstileToken,
      remoteip: request.headers.get('CF-Connecting-IP') ?? '',
    }),
  });
  const verdict = (await verify.json().catch(() => ({}))) as { success?: boolean };
  if (!verdict.success) return json({ ok: false, error: 'turnstile' }, 403);

  // Strip control chars (incl. newlines) so user input can't alter the subject.
  const safeName = name.replace(/[\u0000-\u001f\u007f]/g, ' ');
  const sent = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `【お問い合わせ】${safeName}`,
      text: `お名前: ${safeName}\nメール: ${email}\n\n${message}`,
    }),
  });
  if (!sent.ok) return json({ ok: false, error: 'send_failed' }, 502);

  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
