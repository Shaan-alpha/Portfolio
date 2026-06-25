# Design: Migrate Portfolio → `shaansatsangi.com` on Cloudflare

- **Date:** 2026-06-25
- **Status:** Approved (design), pending spec review → implementation plan
- **Owner:** Shaan Satsangi

## 1. Context — current state (verified)

| Aspect | Reality |
|---|---|
| Frontend | Next.js 16 + React 19 + Tailwind 4, **static export** (`output: "export"`) |
| Hosting | **GitHub Pages** (not Vercel) via GitHub Actions → `shaan-alpha.github.io/Portfolio` |
| Subpath | `basePath: "/Portfolio"` baked into `next.config.ts`; workflow passes `NEXT_PUBLIC_BASE_PATH=/Portfolio` |
| Hardcoded URLs | `https://shaan-alpha.github.io/Portfolio` in `layout.tsx` (`SITE`/`metadataBase`/JSON-LD), `sitemap.ts`, `robots.ts` |
| Backend | Flask on **Render** → `portfolio-backend-wrwo.onrender.com/contact` (separate repo `portfolio-backend`); existing defenses: scoped CORS, per-IP rate limiting, honeypot, length caps |
| Frontend→backend | `Contact.tsx` POSTs to the Render URL |
| Domain | `shaansatsangi.com` on Namecheap, on Namecheap Web Hosting DNS, nothing pointed yet |
| SEO assets present | `sitemap.ts`, `robots.ts`, metadata + JSON-LD, generated `og.png` |

## 2. Goals

1. **Domain** — serve the portfolio from `shaansatsangi.com`.
2. **Better SEO** — real apex domain, correct canonicals, reindex on the new domain.
3. **Attack-proof** — Cloudflare WAF / DDoS / bot / rate-limit + HTTPS/HSTS + security headers, on top of existing app-level defenses.
4. **On Cloudflare** — DNS, hosting, security (and eventually the API) all on Cloudflare.

## 3. Decisions (made during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Hosting | **Cloudflare Pages** (migrate off GitHub Pages) | Cleanest all-Cloudflare story; auto-build from GitHub; native custom domain + TLS; full CF security stack natively in front; free |
| Backend (end state) | **Cloudflare Pages Function `/api/contact`** (same-origin) | Best + free: removes CORS entirely, no Render cold-starts, no always-on server to attack, behind CF WAF |
| Backend (interim) | **Keep Flask on Render, update CORS** | Site goes live first without breaking the contact form; backend swap is isolated/reversible and done last |
| Canonical host | **apex `shaansatsangi.com`**, `www` → 301 apex | Single canonical for SEO |

## 4. Target architecture (end state)

```
   Namecheap domain ──▶  Cloudflare (DNS + proxy)
   (nameservers → CF)    WAF · Bot Fight · Rate-limit · HTTPS/HSTS
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                        ▼
     shaansatsangi.com (apex, canonical)        /api/contact
     www → 301 → apex                           Cloudflare Pages Function
     Cloudflare Pages                           (same-origin, end state)
     (Next.js static export,                    replaces Render Flask
      auto-build from GitHub repo)
```

## 5. Code changes in the repo

| File | Change | Why |
|---|---|---|
| `next.config.ts` | Remove `basePath: "/Portfolio"` | Root domain, not a `/Portfolio` subpath |
| `.github/workflows/deploy.yml` | Disable/delete | Cloudflare Pages takes over building; avoid double-deploy |
| `src/app/layout.tsx` | `SITE` + `metadataBase` + JSON-LD → `https://shaansatsangi.com` | OG/canonical/Twitter/structured-data URLs |
| `src/app/sitemap.ts` | URL → new domain | SEO |
| `src/app/robots.ts` | sitemap URL → new domain | SEO |
| `src/lib/techIcons.tsx` | Verify icon paths resolve at root (remove basePath assumptions) | Tech icons render |
| `public/_headers` | **New** — security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | Attack-proofing |
| `public/_redirects` | **New** — `www`→apex; optional old-path redirects | SEO + UX |
| `src/components/Contact.tsx` | interim: keep Render URL → end state: `/api/contact` | Backend cutover |

> `public/*` is copied into the `out/` export root during `next build`, so `public/_headers` and `public/_redirects` land exactly where Cloudflare Pages reads them.

### 5.1 Starting security-header set (`public/_headers`)

```
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy-Report-Only: <start in report-only, then enforce>
```

**CSP caveat:** Next static export + framer-motion + the `<canvas>` hero + `next/font` + inline JSON-LD means a strict CSP can break rendering. Build the CSP in **Report-Only** first, watch for violations, then switch to enforcing. `connect-src` must include the API origin — `https://portfolio-backend-wrwo.onrender.com` while interim, then `'self'` once the API is same-origin.

## 6. Migration sequence — safe, reversible, one-by-one

**Invariant: nothing points at the domain until the new build is proven**, so there is no "broken live site" window. Each step lists verify + rollback.

| # | Step | Verify | Rollback |
|---|---|---|---|
| 1 | Branch + code prep (basePath removal, URL swaps, `_headers`/`_redirects`) | `npm run build`; open `out/` locally, links/assets work at root | Discard branch |
| 2 | Create Cloudflare account; add site `shaansatsangi.com`; copy CF nameservers | CF shows the zone "pending nameservers" | None (no DNS change yet) |
| 3 | Namecheap → set Cloudflare nameservers | CF marks zone "Active"; existing GitHub Pages site still works | Re-enter Namecheap nameservers |
| 4 | Create CF Pages project from GitHub repo (build `npm run build`, output `out`) | Preview deploy works on `*.pages.dev` | Delete Pages project |
| 5 | Attach custom domain (apex + `www`) to Pages project | `https://shaansatsangi.com` live with valid TLS | Remove custom domain |
| 6 | Update Render Flask CORS to allow `https://shaansatsangi.com` (+`www`); redeploy | Contact form submits successfully on live domain | Revert CORS env/redeploy |
| 7 | Disable GitHub Pages workflow; (optional) redirect stub on old URL | Push triggers only CF Pages; old URL redirects | Re-enable workflow |
| 8 | SEO: Google Search Console (new domain), submit sitemap, request reindex; validate OG/Twitter cards + canonicals | GSC verified; sitemap accepted; cards render | n/a (additive) |
| 9 | Security hardening: CF SSL=Full(strict), Always Use HTTPS, HSTS, Bot Fight Mode, rate-limit rule on contact path, enforce CSP, optional Turnstile | Headers present (securityheaders.com); rate-limit triggers under test | Toggle individual settings off |
| 10 | **(Last, optional)** Port Flask → Pages Function `/api/contact`; switch `Contact.tsx` to same-origin; retire Render | Same-origin contact submit works; Render can be turned off | Point `Contact.tsx` back to Render |

## 7. How each goal is met

- **Domain** — steps 2–5; live on `shaansatsangi.com` with automatic HTTPS.
- **Better SEO** — apex domain removes both the `/Portfolio` subpath and the shared `github.io` domain; correct `metadataBase`/canonicals; sitemap + robots on the new domain; GSC submission + reindex; OG cards; Cloudflare CDN improves Core Web Vitals.
- **Attack-proof** — Cloudflare DDoS + WAF managed ruleset + Bot Fight + rate limiting; HTTPS/HSTS; CSP + security headers; same-origin API (end state) removes CORS exposure; optional Turnstile on contact; plus existing app-level honeypot / per-IP limits / length caps.
- **On Cloudflare** — DNS, hosting, security, and (end state) the API all on Cloudflare.

## 8. Assumptions / defaults

1. Apex `shaansatsangi.com` is canonical; `www` 301-redirects to apex.
2. A free Cloudflare account is created during execution.
3. Old GitHub Pages URL is kept alive briefly with a redirect (preserve shared links) rather than hard-deleted.
4. Backend swap (step 10) is in-scope but executed last, after the site is stable.

## 9. Open items (resolve during execution)

- **Step 10 requires reading the `portfolio-backend` repo** to port its delivery mechanism (email / Telegram / storage) and anti-abuse logic into the Pages Function, and to decide email transport (e.g. Resend free tier, Cloudflare Email Routing) since MailChannels free Workers sending is no longer available.
- Confirm Cloudflare **free-plan limits** at execution time (custom WAF rules count, single rate-limiting rule) and adjust the hardening step to fit.
- Verify `techIcons.tsx` icon resolution after basePath removal.

## 10. Out of scope

- Visual/content redesign of the portfolio.
- Migrating other projects (Skill-Issue, etc.) — this spec is the portfolio + its contact backend only.
- Paid Cloudflare features.
