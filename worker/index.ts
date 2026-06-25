// Cloudflare Worker — serves the static export from the ASSETS binding and
// handles the same-origin contact endpoint at POST /api/contact.
// Faithful port of the Render Flask app: honeypot, required-field check,
// length caps, HTML-escaped Resend email, optional visitor ack.
// Same-origin → no CORS; no cold start; sits behind the Cloudflare WAF.

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
  RESEND_FROM_EMAIL?: string;
  SEND_VISITOR_ACK?: string;
}

const FIELD_LIMITS: Record<string, number> = { name: 100, email: 200, subject: 150, message: 5000 };

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ESC[c]);

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

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

async function handleContact(request: Request, env: Env): Promise<Response> {
  let data: Record<string, string>;
  try {
    data = (await request.json()) as Record<string, string>;
  } catch {
    data = {};
  }

  // Honeypot — bots fill `company`; silently accept and drop.
  if ((data.company || "").trim()) return json({ status: "success" });

  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const subject = (data.subject || "").trim();
  const message = (data.message || "").trim();

  if (!name || !email || !message)
    return json({ status: "error", message: "name, email, and message are required" }, 400);

  for (const [k, cap] of Object.entries(FIELD_LIMITS))
    if ((data[k] || "").trim().length > cap)
      return json({ status: "error", message: `${k} exceeds ${cap} characters` }, 400);

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
    await sendResend(env, env.OWNER_EMAIL, `New portfolio contact from ${name}`, html, text, email);
  } catch {
    return json({ status: "error", message: "Failed to send message" }, 502);
  }

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);
      return handleContact(request, env);
    }
    // Everything else → serve the static export.
    return env.ASSETS.fetch(request);
  },
};
