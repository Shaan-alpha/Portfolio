// Cloudflare Worker — serves the static export from the ASSETS binding and
// handles the same-origin contact endpoint at POST /api/contact.
// Faithful port of the Render Flask app: honeypot, required-field check,
// length caps, HTML-escaped Resend email, optional visitor ack.
// Same-origin → no CORS; no cold start; sits behind the Cloudflare WAF.

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
  RESEND_FROM_EMAIL?: string;
  SEND_VISITOR_ACK?: string;
}

const FIELD_LIMITS: Record<string, number> = { name: 100, email: 200, subject: 150, message: 5000 };
// The caps above are in characters. Devanagari or CJK text takes three bytes a
// character in UTF-8, so 5,450 characters can need about 16.4 KB of JSON. The
// byte cap sits above that, so a full-length message in Hindi is never refused
// as "too large".
const MAX_BODY_BYTES = 24_000;
// `hp` is the honeypot. It replaced `company`, a name browser autofill fills in.
const FIELDS = ["name", "email", "subject", "message", "hp"] as const;

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ESC[c]);

const json = (data: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      // _headers only covers responses served from ASSETS; Worker responses
      // need their own.
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    },
  });

/** Read the body with a hard byte cap. Content-Length alone is not enough: a
 *  chunked request carries none, and `request.json()` would buffer whatever
 *  arrives. This stops reading the moment the cap is crossed. */
async function readCapped(request: Request, cap: number): Promise<string | null> {
  const declared = Number(request.headers.get("Content-Length") ?? "");
  if (Number.isFinite(declared) && declared > cap) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > cap) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** Browsers say where a request came from. Anything a browser marks as
 *  cross-site is refused, so another page cannot use visitors' browsers to
 *  relay spam through this form. Non-browser clients send neither header and
 *  are left to the WAF rate limit. */
function isCrossSite(request: Request, url: URL): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin") return true;
  const origin = request.headers.get("Origin");
  return origin !== null && origin !== url.origin;
}

async function sendResend(
  env: Env,
  to: string,
  subject: string,
  html: string,
  text: string,
  replyTo?: string,
): Promise<void> {
  const body: Record<string, unknown> = {
    from: env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo) body.reply_to = replyTo;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function handleContact(request: Request, env: Env, url: URL): Promise<Response> {
  if (isCrossSite(request, url)) return json({ status: "error", message: "cross-site requests are not accepted" }, 403);

  // The form always sends JSON. Requiring it also means a cross-origin page
  // cannot post here without a CORS preflight, which this Worker never grants.
  if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json"))
    return json({ status: "error", message: "send the form as JSON" }, 415);

  const raw = await readCapped(request, MAX_BODY_BYTES);
  if (raw === null) return json({ status: "error", message: "payload too large" }, 413);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json({ status: "error", message: "the request body is not valid JSON" }, 400);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return json({ status: "error", message: "the request body is not valid JSON" }, 400);

  // Every field must be text. A number or object here used to reach .trim()
  // and crash the Worker into a bare 500.
  const fields: Record<string, string> = {};
  for (const key of FIELDS) {
    const value = (parsed as Record<string, unknown>)[key];
    if (value === undefined || value === null) fields[key] = "";
    else if (typeof value === "string") fields[key] = value.trim();
    else return json({ status: "error", message: `${key} must be text` }, 400);
  }

  // Honeypot — bots fill `hp`; silently accept and drop.
  if (fields.hp) return json({ status: "success" });

  const { name, email, subject, message } = fields;

  if (!name || !email || !message)
    return json({ status: "error", message: "name, email, and message are required" }, 400);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ status: "error", message: "invalid email address" }, 400);

  for (const [k, cap] of Object.entries(FIELD_LIMITS))
    if (fields[k].length > cap) return json({ status: "error", message: `${k} exceeds ${cap} characters` }, 400);

  if (!env.RESEND_API_KEY || !env.OWNER_EMAIL)
    return json({ status: "error", message: "email not configured" }, 500);

  const safeMsg = esc(message).replace(/\n/g, "<br>");
  const html =
    `<h2>New portfolio contact</h2><p><strong>Name:</strong> ${esc(name)}</p>` +
    `<p><strong>Email:</strong> ${esc(email)}</p><p><strong>Subject:</strong> ${esc(subject || "No subject")}</p>` +
    `<p><strong>Message:</strong></p><p>${safeMsg}</p>`;
  const text =
    `New portfolio contact\nName: ${name}\nEmail: ${email}\nSubject: ${subject || "No subject"}\n\nMessage:\n${message}`;

  try {
    await sendResend(env, env.OWNER_EMAIL, `New portfolio contact from ${name.replace(/[\r\n]+/g, " ")}`, html, text, email);
  } catch {
    return json({ status: "error", message: "Failed to send message" }, 502);
  }

  // Off by default, and best kept off: it mails whatever address the visitor
  // typed, which makes the form a way to send mail to strangers from this
  // domain. The WAF rate limit is the only brake on that if it is enabled.
  const ack = (env.SEND_VISITOR_ACK || "").toLowerCase();
  if (ack === "1" || ack === "true" || ack === "yes") {
    const aHtml = `<p>Hi ${esc(name)},</p><p>Thanks for contacting me via my portfolio. I'll get back to you soon.</p><p>- Shaan</p>`;
    const aText = `Hi ${name},\n\nThanks for contacting me via my portfolio. I'll get back to you soon.\n\n- Shaan`;
    try {
      await sendResend(env, email, "Thanks for reaching out!", aHtml, aText);
    } catch {
      /* best effort — owner notification already succeeded */
    }
  }

  return json({ status: "success", message: "Message sent successfully. I received it." });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405, { Allow: "POST" });
      return handleContact(request, env, url);
    }
    // Everything else → serve the static export.
    return env.ASSETS.fetch(request);
  },
};

export default worker;
