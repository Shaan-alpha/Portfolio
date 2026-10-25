// Run with `npm test` (node --test; Node 22.18+ / 23.6+ strip the types natively).
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import worker, { type Env } from "./index.ts";

const ORIGIN = "https://shaansatsangi.com";
const realFetch = globalThis.fetch;
let sent: { to: string[]; subject: string; reply_to?: string }[] = [];
let resendStatus = 200;

beforeEach(() => {
  sent = [];
  resendStatus = 200;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    return new Response(resendStatus === 200 ? "{}" : "nope", { status: resendStatus });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const env = (over: Partial<Env> = {}): Env => ({
  ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
  RESEND_API_KEY: "test-key",
  OWNER_EMAIL: "owner@example.com",
  ...over,
});

const valid = { name: "Ada", email: "ada@example.com", subject: "Hello", message: "Hi there" };

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN, "Sec-Fetch-Site": "same-origin", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function call(req: Request, e = env()) {
  const res = await worker.fetch(req, e);
  return { res, body: (await res.json().catch(() => null)) as { status: string; message?: string } | null };
}

test("a valid message is emailed to the owner with the visitor as reply-to", async () => {
  const { res, body } = await call(post(valid));
  assert.equal(res.status, 200);
  assert.equal(body?.status, "success");
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ["owner@example.com"]);
  assert.equal(sent[0].reply_to, "ada@example.com");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("anything but POST is refused with an Allow header", async () => {
  const { res } = await call(new Request(`${ORIGIN}/api/contact`));
  assert.equal(res.status, 405);
  assert.equal(res.headers.get("Allow"), "POST");
});

test("other paths are served from static assets", async () => {
  const res = await worker.fetch(new Request(`${ORIGIN}/`), env());
  assert.equal(await res.text(), "asset");
});

test("the honeypot field is accepted silently and nothing is sent", async () => {
  const { res, body } = await call(post({ ...valid, hp: "http://spam.example" }));
  assert.equal(res.status, 200);
  assert.equal(body?.status, "success");
  assert.equal(sent.length, 0);
});

test("an autofilled company field no longer drops a real message", async () => {
  // The honeypot used to be named `company`, which browser autofill fills.
  const { res } = await call(post({ ...valid, company: "Acme Recruiting" }));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
});

test("a full-length message in Devanagari fits under the byte cap", async () => {
  const body = JSON.stringify({ ...valid, message: "न".repeat(5000) }); // 3 bytes a character: ~15 KB
  // Real requests through Cloudflare declare their length; send it, as the
  // old 10 KB check refused exactly this request on that header.
  const length = String(new TextEncoder().encode(body).byteLength);
  const { res } = await call(post(body, { "Content-Length": length }));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
});

test("missing required fields are a 400", async () => {
  const { res } = await call(post({ name: "Ada", email: "ada@example.com" }));
  assert.equal(res.status, 400);
});

test("a malformed email address is a 400", async () => {
  const { res, body } = await call(post({ ...valid, email: "not-an-email" }));
  assert.equal(res.status, 400);
  assert.equal(body?.message, "invalid email address");
});

test("non-string fields are a 400, not a crash", async () => {
  for (const bad of [{ ...valid, name: 42 }, { ...valid, message: { $gt: "" } }, { ...valid, email: ["a@b.co"] }]) {
    const { res } = await call(post(bad));
    assert.equal(res.status, 400);
  }
  assert.equal(sent.length, 0);
});

test("a JSON body that is not an object is a 400", async () => {
  for (const bad of ["[1,2]", "null", '"hi"', "{not json"]) {
    const { res } = await call(post(bad));
    assert.equal(res.status, 400);
  }
});

test("fields over their caps are a 400", async () => {
  const { res, body } = await call(post({ ...valid, name: "x".repeat(101) }));
  assert.equal(res.status, 400);
  assert.match(body?.message ?? "", /name exceeds 100/);
});

test("a declared Content-Length over the cap is a 413 before reading", async () => {
  const { res } = await call(post(valid, { "Content-Length": "50000" }));
  assert.equal(res.status, 413);
});

test("a chunked body with no Content-Length is cut off at the cap", async () => {
  const chunk = new TextEncoder().encode("a".repeat(4096));
  let pulled = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulled++;
      if (pulled > 50) controller.close();
      else controller.enqueue(chunk);
    },
  });
  const req = new Request(`${ORIGIN}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: stream,
    // @ts-expect-error -- required by undici for streaming request bodies
    duplex: "half",
  });
  const { res } = await call(req);
  assert.equal(res.status, 413);
  assert.ok(pulled < 10, `read ${pulled} chunks; it should stop just past the 24 KB cap`);
});

test("cross-site browser requests are refused", async () => {
  const a = await call(post(valid, { Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site" }));
  assert.equal(a.res.status, 403);
  const b = await call(post(valid, { Origin: "https://evil.example", "Sec-Fetch-Site": "" }));
  assert.equal(b.res.status, 403);
  assert.equal(sent.length, 0);
});

test("non-JSON content types are a 415", async () => {
  const { res } = await call(post(JSON.stringify(valid), { "Content-Type": "text/plain" }));
  assert.equal(res.status, 415);
});

test("missing email configuration is a 500 with a clear message", async () => {
  const { res, body } = await call(post(valid), env({ RESEND_API_KEY: "" }));
  assert.equal(res.status, 500);
  assert.equal(body?.message, "email not configured");
});

test("a Resend failure is reported as a 502", async () => {
  resendStatus = 500;
  const { res } = await call(post(valid));
  assert.equal(res.status, 502);
});

test("the visitor acknowledgement is only sent when switched on", async () => {
  await call(post(valid));
  assert.equal(sent.length, 1);
  sent = [];
  await call(post(valid), env({ SEND_VISITOR_ACK: "true" }));
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[1].to, ["ada@example.com"]);
});

test("HTML in the message is escaped in the owner email", async () => {
  await call(post({ ...valid, message: "<script>alert(1)</script>" }));
  const html = (sent[0] as unknown as { html: string }).html;
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});
