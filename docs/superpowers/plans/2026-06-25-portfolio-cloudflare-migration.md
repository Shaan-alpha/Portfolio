# Portfolio → shaansatsangi.com on Cloudflare — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Next.js portfolio from GitHub Pages (`shaan-alpha.github.io/Portfolio`) to `shaansatsangi.com`, hosted on Cloudflare Pages with DNS/WAF on Cloudflare, improved SEO, and a hardened security posture — without breaking the contact form mid-migration.

**Architecture:** Static Next.js export hosted on Cloudflare Pages (auto-built from the GitHub repo). Cloudflare manages DNS (nameservers moved off Namecheap) and sits in front as CDN + WAF + DDoS + bot shield. The contact backend stays on Render (Flask + Resend) during cutover with only a CORS env change, then is optionally re-platformed last as a same-origin Cloudflare Pages Function — eliminating CORS and Render entirely.

**Tech Stack:** Next.js 16 (static export), React 19, Tailwind 4, Cloudflare Pages + Pages Functions, Cloudflare DNS/WAF, Render (interim), Resend (email).

## Global Constraints

- Canonical host is `https://shaansatsangi.com` (apex); `www.shaansatsangi.com` 301-redirects to apex. Copy verbatim everywhere.
- Free tier only — Cloudflare Free, Render Free, Resend Free. No paid features.
- **No new secrets.** Reuse the existing Resend credentials. Secrets go into Render/Cloudflare dashboards, never into chat, code, or git.
- Build is a static export: `output: "export"`, build command `npm run build`, output dir `out`.
- All code commits land on branch `cloudflare-migration`. No `Co-Authored-By` trailer (user preference).
- Each task notes **[ME]** (code I make), **[YOU]** (dashboard action), or **[BOTH]**. Verification commands use `curl.exe` so they work in Windows PowerShell and Git Bash.

---

### Task 1: Retarget the build to shaansatsangi.com  **[ME]**

Remove the `/Portfolio` basePath and replace every hardcoded GitHub-Pages URL and asset path with the new domain. This is what makes the export serve correctly at a root domain.

**Files:**
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx:22,39,45` (SITE + two OG/Twitter image paths)
- Modify: `src/app/sitemap.ts:8`
- Modify: `src/app/robots.ts:8`
- Modify: `src/lib/techIcons.tsx:1-4` (basePath constant + comment)

- [ ] **Step 1: Remove basePath in `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Point `SITE` and asset paths at the domain in `src/app/layout.tsx`**

Change line 22:
```ts
const SITE = "https://shaansatsangi.com";
```
Change the OG image (line 39) and Twitter image (line 45) from `/Portfolio/og.png` to:
```ts
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "Shaan Satsangi — Data Engineer" }],
```
```ts
    images: ["/og.png"],
```
(`SITE` already feeds `metadataBase`, `authors.url`, `alternates.canonical`, `openGraph.url`, and `personJsonLd.url`, so those update automatically.)

- [ ] **Step 3: Update `src/app/sitemap.ts`**

```ts
      url: "https://shaansatsangi.com/",
```

- [ ] **Step 4: Update `src/app/robots.ts`**

```ts
    sitemap: "https://shaansatsangi.com/sitemap.xml",
```

- [ ] **Step 5: Neutralize the basePath asset prefix in `src/lib/techIcons.tsx`**

Replace lines 1–4 with:
```tsx
// Served from a root domain on Cloudflare Pages — asset paths are root-absolute.
// Plain <img> srcs are not auto-prefixed by Next, so keep this prefix constant
// (empty at root). If a basePath is ever reintroduced, set it here.
export const BP = "";
```
(`src={`${BP}/devicon/${file}.svg`}` then resolves to `/devicon/<file>.svg`.)

- [ ] **Step 6: Build and verify the export targets the root domain**

Run:
```bash
cd "c:/Users/shaan/Desktop/Portfolio" && npm run build
```
Expected: build succeeds, writes `out/`.

Verify no `/Portfolio` paths and the new domain are baked in:
```bash
grep -rn "/Portfolio" out/index.html; echo "--- exit: $? (1 = good, no matches) ---"
grep -c "shaansatsangi.com" out/index.html
```
Expected: first grep prints nothing (exit 1); second prints a count ≥ 1.

Verify the sitemap/robots:
```bash
cat out/sitemap.xml; cat out/robots.txt
```
Expected: both reference `https://shaansatsangi.com`.

- [ ] **Step 7: Commit**

```bash
git add next.config.ts src/app/layout.tsx src/app/sitemap.ts src/app/robots.ts src/lib/techIcons.tsx
git commit -m "feat: retarget static export to shaansatsangi.com (drop /Portfolio basePath)"
```

---

### Task 2: Add security headers + stop GitHub Pages deploys  **[ME]**

Add a Cloudflare Pages `_headers` file (security headers, CSP in Report-Only first) and delete the GitHub Pages workflow so the repo deploys only via Cloudflare.

**Files:**
- Create: `public/_headers`
- Delete: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `out/_headers` (copied from `public/_headers` by `next build`) — consumed by Cloudflare Pages at deploy time.

- [ ] **Step 1: Create `public/_headers`**

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://portfolio-backend-wrwo.onrender.com; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
```
(Report-Only now; promoted to enforcing in Task 9. `connect-src` includes the Render origin for the interim contact form; it becomes `'self'` in Task 10.)

- [ ] **Step 2: Delete the GitHub Pages workflow**

```bash
git rm .github/workflows/deploy.yml
```
(GitHub Pages keeps serving its last build at the old URL; it just stops getting new deploys. Cloudflare Pages becomes the only deploy path.)

- [ ] **Step 3: Build and verify the headers file lands in the output**

```bash
npm run build && cat out/_headers
```
Expected: `out/_headers` exists with the content above.

- [ ] **Step 4: Commit**

```bash
git add public/_headers .github/workflows/deploy.yml
git commit -m "feat: add Cloudflare security headers; retire GitHub Pages workflow"
```

---

### Task 3: Create Cloudflare account + add the site  **[YOU]**

- [ ] **Step 1:** Sign up / log in at https://dash.cloudflare.com (free).
- [ ] **Step 2:** **Add a site** → enter `shaansatsangi.com` → choose the **Free** plan.
- [ ] **Step 3:** Cloudflare scans existing DNS. Since the domain is fresh (Namecheap default), there's little to import — that's fine.
- [ ] **Step 4:** Cloudflare shows **two nameservers** (e.g. `xxx.ns.cloudflare.com`). Copy both.

**Verify:** the zone appears in your Cloudflare dashboard marked **"Pending nameserver update."**
**Rollback:** none — no DNS has changed yet.

---

### Task 4: Switch nameservers at Namecheap  **[YOU]**

This delegates DNS to Cloudflare. The existing GitHub Pages site keeps working (nothing is pointed at the domain yet).

- [ ] **Step 1:** Namecheap → **Domain List** → `shaansatsangi.com` → **Manage**.
- [ ] **Step 2:** **Nameservers** section → change **Namecheap BasicDNS** to **Custom DNS**.
- [ ] **Step 3:** Paste the two Cloudflare nameservers from Task 3. Save (the green checkmark).
- [ ] **Step 4:** Wait for propagation (usually minutes, up to a few hours).

**Verify:**
```bash
curl.exe -s "https://cloudflare-dns.com/dns-query?name=shaansatsangi.com&type=NS" -H "accept: application/dns-json"
```
Expected: answer lists `*.ns.cloudflare.com`. Cloudflare dashboard flips the zone to **"Active"** (you'll also get an email).
**Rollback:** re-enter the Namecheap default nameservers (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`).

---

### Task 5: Create the Cloudflare Pages project + verify a branch preview  **[BOTH]**

Connect the repo to Cloudflare Pages and prove the root-domain build is correct on a throwaway `*.pages.dev` preview **before** touching `main`.

- [ ] **Step 1 [ME]:** Push the migration branch so Cloudflare can build it.
```bash
git push -u origin cloudflare-migration
```
- [ ] **Step 2 [YOU]:** Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → authorize GitHub → select the **`Portfolio`** repo.
- [ ] **Step 3 [YOU]:** Build settings:
  - **Production branch:** `main`
  - **Framework preset:** `Next.js (Static HTML Export)` (or "None")
  - **Build command:** `npm run build`
  - **Build output directory:** `out`
  - **Environment variable:** `NODE_VERSION = 20`
- [ ] **Step 4 [YOU]:** Save & Deploy. The first **production** build runs off `main` (still old basePath) — that's expected and temporary.
- [ ] **Step 5 [YOU]:** Open the project → **Deployments**. Cloudflare also builds a **preview** for the `cloudflare-migration` branch. Open that preview's `*.pages.dev` URL.

**Verify:** on the **preview** URL the site loads at the root (hero canvas renders, tech icons load, nav works, theme toggle works). Check an icon request returns 200:
```bash
curl.exe -I "https://<preview-subdomain>.pages.dev/devicon/python.svg"
```
Expected: `HTTP/2 200`.
**Rollback:** delete the Pages project; no domain is attached yet.

---

### Task 6: Go live — merge to main, attach domain, www→apex redirect  **[BOTH]**

> **Execution note (Pages → Workers static assets):** Cloudflare deployed the repo as a **Workers** project and auto-applied the OpenNext SSR adapter, which fails on our `output: "export"` static build. Fix: committed `wrangler.jsonc` declaring an **assets-only Worker** (`assets.directory: ./out`, `not_found_handling: 404-page`), so `wrangler deploy` serves the static export directly and skips framework auto-detection. Hosting is now Workers static-assets (custom domains, `_headers`, `_redirects`, WAF all behave the same). Steps 1–2 are already complete.

- [x] **Step 1 [ME]:** Merge the verified branch to `main`; push. *(done — `0ade9d0`)*
- [x] **Step 2 [BOTH]:** Verify the deploy on the `*.workers.dev` preview — 200, all security headers, assets 200, 404 handling. *(done — `portfolio.shaansatsangi.workers.dev` healthy)*
- [x] **Step 3 [YOU]:** Cloudflare `portfolio` project → **Settings → Domains & Routes** → **Add → Custom Domain** → `shaansatsangi.com`. Cloudflare auto-creates the proxied DNS record and issues TLS. Repeat: **Add → Custom Domain** → `www.shaansatsangi.com`. *(done — apex serves 200 over HTTPS)*
- [x] **Step 4 [YOU]:** Wait until both custom domains show **Active** with a valid certificate. *(done — valid TLS)*
- [x] **Step 5 [YOU]:** Add the canonical redirect: Cloudflare dashboard → **Rules** → **Redirect Rules** → **Create rule**: *(done — www 301→apex verified)*
  - **If** — Hostname **equals** `www.shaansatsangi.com`
  - **Then** — Static redirect → URL `https://shaansatsangi.com${http.request.uri.path}` , **Status 301**, **Preserve query string** ✔
  - Deploy.

**Verify:**
```bash
curl.exe -I https://shaansatsangi.com           # HTTP/2 200
curl.exe -I https://www.shaansatsangi.com        # HTTP/2 301 -> location: https://shaansatsangi.com/
curl.exe -I http://shaansatsangi.com             # 301/308 -> https (after Task 9 "Always Use HTTPS"; may be 200 now)
```
Expected: apex serves 200 over HTTPS; www 301s to apex.
**Rollback:** remove the custom domain(s) and the redirect rule; the `*.pages.dev` URL still works.

---

### Task 7: Update the backend CORS for the new origin  **[YOU]**

The contact form still posts to the Render Flask app (`Contact.tsx` unchanged). CORS is env-driven — no code change.

- [x] **Step 1:** Render dashboard → the `portfolio-backend` service → **Environment**.
- [x] **Step 2:** Set (or edit) the variable:
  - **Key:** `ALLOWED_ORIGINS`
  - **Value:** `https://shaansatsangi.com,https://www.shaansatsangi.com,http://localhost:3000`
- [x] **Step 3:** Save → trigger a manual deploy (or let auto-deploy run). *(done — CORS preflight returns `access-control-allow-origin: https://shaansatsangi.com`)*

**Verify:** on `https://shaansatsangi.com`, submit the contact form with real values. Expect the success message and an email to `OWNER_EMAIL`. Also:
```bash
curl.exe -s https://portfolio-backend-wrwo.onrender.com/health
```
Expected: `{"status":"ok", ...}` and the live form returns `{"status":"success", ...}`.
**Rollback:** restore the previous `ALLOWED_ORIGINS` value and redeploy.

> Note: the first request after idle may take ~50s (Render free cold start). This goes away in Task 10.

---

### Task 8: SEO activation  **[BOTH]**

- [x] **Step 1 [YOU]:** https://search.google.com/search-console → **Add property** → **Domain** → `shaansatsangi.com`. *(done — property verified)*
- [x] **Step 2 [YOU]:** Google gives a **TXT** record. In Cloudflare → **DNS** → **Records** → add the TXT exactly as given → verify in GSC. *(done)*
- [x] **Step 3 [YOU]:** GSC → **Sitemaps** → submit `https://shaansatsangi.com/sitemap.xml`. *(done — status Success)*
- [x] **Step 4 [YOU]:** GSC → **URL Inspection** → enter `https://shaansatsangi.com/` → **Request indexing**. *(URL discovered via sitemap; "Discovered – currently not indexed" is normal for a fresh domain — Request Indexing queued)*
- [x] **Step 5 [ME]:** Verify canonical + cards are correct: *(done — canonical, og:url, og:image all = https://shaansatsangi.com)*
```bash
curl.exe -s https://shaansatsangi.com | grep -i "canonical\|og:url\|og:image"
```
Expected: canonical and `og:url` = `https://shaansatsangi.com`; `og:image` resolves to `https://shaansatsangi.com/og.png`.
- [ ] **Step 6 [YOU]:** Paste `https://shaansatsangi.com` into https://www.opengraph.xyz to confirm the social card renders.

**Verify:** GSC property **Verified**; sitemap status **Success**; OG card shows the 1200×630 image.
**Rollback:** n/a (additive).

---

### Task 9: Security hardening pass  **[BOTH]**

All Cloudflare dashboard toggles for `shaansatsangi.com`, then promote the CSP to enforcing.

- [x] **Step 1 [YOU]:** **SSL/TLS** → **Overview** → set mode to **Full (strict)**. *(done — confirmed by user)*
- [x] **Step 2 [YOU]:** **SSL/TLS** → **Edge Certificates** → enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**. *(done — `http://` 301s to `https://` for apex + www)*
- [x] **Step 3 [YOU]:** Same page → enable **HSTS** (max-age 6 months, include subdomains, preload) — confirm the warning prompt. *(done — `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` live)*
- [x] **Step 4 [YOU]:** **Security** → **Bots** → enable **Bot Fight Mode**. *(done — confirmed by user)*
- [x] **Step 5 [YOU]:** **Security** → **WAF** → **Managed rules** → deploy the **Cloudflare Free Managed Ruleset**. *(done — confirmed by user)*
- [x] **Step 5b [YOU]:** **SSL/TLS** → **Edge Certificates** → **Minimum TLS Version** = **1.2** *(added during hardening — TLS 1.0/1.1 were capping SSL Labs at B; now rejected, confirmed via curl)*
- [x] **Step 6 [ME → YOU]:** Promote CSP to enforcing once clean. *(done — `1` violation found in Report-Only: Cloudflare Web Analytics beacon `static.cloudflareinsights.com`, auto-injected at the edge. Allowlisted per Cloudflare docs — added `https://static.cloudflareinsights.com` to `script-src` and `https://cloudflareinsights.com` to `connect-src` — then promoted to enforcing. Live header confirmed enforcing.)*
```bash
git add public/_headers && git commit -m "feat: enforce CSP after report-only verification" && git push origin main
```

**Verify:**
```bash
curl.exe -sI https://shaansatsangi.com | grep -i "strict-transport-security\|content-security-policy\|x-frame-options\|x-content-type-options"
```
Expected: HSTS, CSP (enforcing), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` all present. Then check the grade at https://securityheaders.com/?q=https://shaansatsangi.com (target A/A+) and TLS at https://www.ssllabs.com/ssltest/ (target A). **Achieved: securityheaders.com = A** (capped at A by `'unsafe-inline'` in `script-src`, which is unavoidable for a static Next.js export — no per-request nonces possible); **SSL Labs = A+** after setting Minimum TLS Version to 1.2.
**Rollback:** toggle any individual Cloudflare setting off; revert the CSP commit if it breaks rendering.

> Note: the contact endpoint is still on Render, protected by its own app-side limiter (5/hr, 2/min). It gains Cloudflare WAF + rate limiting in Task 10 when it moves on-platform.

---

### Task 10: Same-origin contact API as a Worker route; retire Render  **[BOTH]**

> **Execution note (Pages Function → Worker route):** Hosting is a **Workers static-assets** deployment (see Task 6 note), not Pages — so the planned `functions/api/contact.ts` Pages Function does not apply. Instead the same-origin endpoint is a **Worker `fetch` handler** at `worker/index.ts` that intercepts `POST /api/contact` and delegates everything else to the `ASSETS` binding. `wrangler.jsonc` gains `main: ./worker/index.ts` and `assets.binding: ASSETS`. Same outcome — same-origin (no CORS), no Render cold start, behind the Cloudflare WAF — confirmed by Cloudflare docs for Workers + static assets.

Re-platform the contact handler to a Cloudflare Worker route at `/api/contact`. Email-only (Resend); no SQLite. Done in two safe pushes so the live form never breaks: (A) deploy the Worker route while the form still posts to Render, verify `/api/contact`; (B) flip the form to `/api/contact` and tighten CSP.

**Files:**
- Create: `worker/index.ts` *(was `functions/api/contact.ts`)*
- Modify: `wrangler.jsonc` (`main` + `assets.binding`)
- Modify: `tsconfig.json` (exclude `worker` from Next type-checking)
- Modify: `src/components/Contact.tsx:29`
- Modify: `public/_headers` (tighten `connect-src`, keep Cloudflare Analytics)

- [ ] **Step 1 [ME]:** Branch.
```bash
git checkout main && git pull && git checkout -b contact-pages-function
```

- [x] **Step 2 [ME]:** Create `worker/index.ts` (faithful TS port of the Flask logic — honeypot, required-field check, length caps, HTML-escaped Resend email, optional visitor ack), plus `wrangler.jsonc` (`main` + `assets.binding: ASSETS`) and `tsconfig.json` exclude. *(done — Step A; deployed and verified live: `POST /api/contact {}` → 400 validation; assets still 200; env not yet set so valid payload → 500 "email not configured")*. The Pages-Function reference below is superseded by the Worker `fetch` handler actually used:

```ts
// Cloudflare Pages Function — superseded; actual impl is worker/index.ts (Worker fetch handler).
interface Env {
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
  RESEND_FROM_EMAIL?: string;
  SEND_VISITOR_ACK?: string;
}

const FIELD_LIMITS: Record<string, number> = { name: 100, email: 200, subject: 150, message: 5000 };

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function sendResend(
  env: Env, to: string, subject: string, html: string, text: string, replyTo?: string,
): Promise<void> {
  const body: Record<string, unknown> = {
    from: env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
    to: [to], subject, html, text,
  };
  if (replyTo) body.reply_to = replyTo;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

  let data: Record<string, string>;
  try { data = (await ctx.request.json()) as Record<string, string>; } catch { data = {}; }

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

  const env = ctx.env;
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
    try { await sendResend(env, email, "Thanks for reaching out!", aHtml, aText); } catch { /* best effort */ }
  }

  return json({ status: "success", message: "Message sent successfully. I received it." });
};
```

- [x] **Step 3 [ME]:** Point the form at the same-origin route — `src/components/Contact.tsx` line 29:
```ts
      const res = await fetch("/api/contact", {
```
*(done — Step C; verified no `onrender.com` in any live JS chunk, `/api/contact` is the wired endpoint)*

- [x] **Step 4 [ME]:** Tighten CSP `connect-src` in `public/_headers` (drop the Render origin, **keep Cloudflare Analytics**): *(done — live `connect-src 'self' https://cloudflareinsights.com;`)*
```
connect-src 'self' https://cloudflareinsights.com;
```
(Edit that token within the existing `Content-Security-Policy` line — remove only `https://portfolio-backend-wrwo.onrender.com`; `https://cloudflareinsights.com` must stay for the Web Analytics beacon.)

- [x] **Step 5 [YOU]:** Cloudflare → **Workers & Pages → `portfolio` → Settings → Variables and Secrets**, add (reuse the values already in Render), then **Deploy**: *(done — `RESEND_API_KEY`, `OWNER_EMAIL`, `SEND_VISITOR_ACK=true` set; `RESEND_FROM_EMAIL` left unset → falls back to `Portfolio <onboarding@resend.dev>`)*
  - `RESEND_API_KEY` = *(your existing key)* — add as an **encrypted Secret**
  - `OWNER_EMAIL` = *(your email)*
  - `RESEND_FROM_EMAIL` = *(optional; else the Resend default is used)*
  - `SEND_VISITOR_ACK` = `true` *(optional)*

- [x] **Step 6 [ME]:** Commit & push (done directly on `main` in two safe pushes: Step A `worker/` + `wrangler.jsonc`; Step C `Contact.tsx` + `_headers`).

- [x] **Step 7 [YOU]:** After the deploy, add a **Rate Limiting Rule** (Security → WAF → Rate limiting rules): match path `/api/contact`, method POST, e.g. **5 requests / 1 min per IP** → Block. (Free plan: one rule.) *(done — Free plan period fixed at 10s, so set to **>5 req / 10s per IP → Block 10 min**; verified live: 8th rapid POST returned 429)*

- [x] **Step 8 [BOTH]:** Verify on the live domain: *(done — success path returns `{"status":"success",...}` + email delivered; honeypot `company` → `{"status":"success"}` no email; empty → 400)*
```bash
# success path
curl.exe -s -X POST https://shaansatsangi.com/api/contact -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"t@example.com\",\"message\":\"hello\"}"
# honeypot is silently accepted (no email)
curl.exe -s -X POST https://shaansatsangi.com/api/contact -H "Content-Type: application/json" -d "{\"name\":\"Bot\",\"email\":\"b@x.com\",\"message\":\"spam\",\"company\":\"evil\"}"
# validation
curl.exe -s -X POST https://shaansatsangi.com/api/contact -H "Content-Type: application/json" -d "{\"name\":\"\",\"email\":\"\",\"message\":\"\"}"
```
Expected: first → `{"status":"success",...}` and an email arrives; second → `{"status":"success"}` and **no** email; third → 400 `name, email, and message are required`. Submit via the real form UI too.

- [ ] **Step 9 [YOU]:** Once confirmed, **suspend** the Render `portfolio-backend` service (don't delete immediately — keep it a few days as a rollback). After a stable period, delete it.

**Rollback:** point `Contact.tsx` back to `https://portfolio-backend-wrwo.onrender.com/contact`, restore the Render `connect-src` in `_headers`, resume the Render service.

> Optional add-on (Turnstile, free CAPTCHA): add the Turnstile widget to the form, send its token in the POST, and verify server-side in the function via `https://challenges.cloudflare.com/turnstile/v0/siteverify`. Requires CSP additions: `script-src` + `frame-src https://challenges.cloudflare.com`. Defer unless spam appears.

---

## Self-Review

**Spec coverage** (against `2026-06-25-portfolio-cloudflare-migration-design.md`):
- §5 code changes → Tasks 1 & 2 (every file in the table is covered: next.config, layout, sitemap, robots, techIcons, `_headers`, deploy.yml; `Contact.tsx` in Task 10). `_redirects` intentionally dropped — host-based www→apex is a Cloudflare Redirect Rule (Task 6 §5), which is the correct mechanism (the Pages `_redirects` file matches paths, not hostnames).
- §6 migration sequence steps 1–10 → Tasks 1–10, 1:1, each with verify + rollback.
- §7 goals → Domain (T3–6), SEO (T1, T8), Attack-proof (T2, T9, T10), Cloudflare (T3–9).
- §8 assumptions → apex canonical (Global Constraints + T6), free Cloudflare (T3), old URL kept alive (T2 note), backend swap last (T10).
- §9 open items → storage = email-only (T10), CORS env-driven (T7), Resend reuse (T10 §5), free-plan limits noted (T9, T10), techIcons verified (T1 §6).

**Placeholder scan:** no TBD/TODO; every code step shows complete code; every dashboard step has exact navigation + a verify command. Secret *values* are intentionally not in the plan (provided in dashboards) — not a placeholder.

**Type consistency:** `BP` (string) used in `techIcons.tsx`; Pages Function `Env` fields match the Resend env names used in both Render and the function; `sendResend(env, to, subject, html, text, replyTo?)` signature is consistent across both call sites.
