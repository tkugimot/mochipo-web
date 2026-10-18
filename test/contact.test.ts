import { afterEach, describe, expect, it, vi } from 'vitest';
import { contactSchema } from '../src/lib/contactSchema';
import { handleContact, type Env } from '../worker/index';

const env: Env = {
  ASSETS: { fetch: async () => new Response('asset') },
  RESEND_API_KEY: 're_test',
  TURNSTILE_SECRET_KEY: 'secret',
  CONTACT_TO: 'to@example.com',
  CONTACT_FROM: 'from@example.com',
  ALLOWED_ORIGIN: 'https://site.test',
};

const valid = { name: '太郎', email: 'a@example.com', message: 'こんにちは、お問い合わせです。', turnstileToken: 'tok' };

function req(body: unknown, init: RequestInit = {}) {
  return new Request('https://site.test/api/contact', {
    method: 'POST',
    headers: { Origin: 'https://site.test', 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });
}

function mockFetch(turnstileOk: boolean, resendOk = true) {
  const fn = vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    if (u.includes('turnstile')) return Response.json({ success: turnstileOk });
    return new Response('{}', { status: resendOk ? 200 : 500 });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('contactSchema', () => {
  it('accepts valid input', () => expect(contactSchema.safeParse(valid).success).toBe(true));
  it.each([
    ['empty name', { ...valid, name: '' }],
    ['bad email', { ...valid, email: 'nope' }],
    ['short message', { ...valid, message: 'short' }],
    ['long message', { ...valid, message: 'a'.repeat(5001) }],
    ['unknown topic', { ...valid, topic: 'x' }],
    ['filled honeypot', { ...valid, website: 'x' }],
    ['missing token', { ...valid, turnstileToken: '' }],
  ])('rejects %s', (_n, input) => expect(contactSchema.safeParse(input).success).toBe(false));
});

describe('handleContact', () => {
  it('405 for non-POST', async () => {
    expect((await handleContact(new Request('https://site.test/api/contact'), env)).status).toBe(405);
  });
  it('403 for wrong origin', async () => {
    const r = req(valid, { headers: { Origin: 'https://evil.test', 'Content-Type': 'application/json' } });
    expect((await handleContact(r, env)).status).toBe(403);
  });
  it('allows any origin in the comma-separated list', async () => {
    mockFetch(true);
    const multi = { ...env, ALLOWED_ORIGIN: 'https://a.test, https://b.test' };
    for (const origin of ['https://a.test', 'https://b.test']) {
      const r = req(valid, { headers: { Origin: origin, 'Content-Type': 'application/json' } });
      expect((await handleContact(r, multi)).status).toBe(200);
    }
  });
  it('403 when Origin header is missing', async () => {
    const r = req(valid, { headers: { 'Content-Type': 'application/json' } });
    expect((await handleContact(r, env)).status).toBe(403);
  });
  it('400 for invalid JSON and invalid fields', async () => {
    mockFetch(true);
    expect((await handleContact(req('{oops'), env)).status).toBe(400);
    expect((await handleContact(req({ ...valid, email: 'x' }), env)).status).toBe(400);
  });
  it('403 when Turnstile fails, without calling Resend', async () => {
    const f = mockFetch(false);
    expect((await handleContact(req(valid), env)).status).toBe(403);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('502 when Resend fails', async () => {
    mockFetch(true, false);
    expect((await handleContact(req(valid), env)).status).toBe(502);
  });
  it('200 and sends mail on success', async () => {
    const f = mockFetch(true);
    expect((await handleContact(req(valid), env)).status).toBe(200);
    const [, init] = f.mock.calls[1] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ to: ['to@example.com'], reply_to: 'a@example.com' });
    expect(body.subject).toContain('その他');
  });
  it('filled honeypot is rejected with 400 and no outbound call', async () => {
    const f = mockFetch(true);
    const res = await handleContact(req({ ...valid, website: 'bot' }), env);
    expect(res.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
});
