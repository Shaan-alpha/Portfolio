// Renders the hero's still images from the real scene, for the fallback and
// the placeholder shown while the 3D loads. It serves out/ locally, drives the
// system Chrome over the DevTools protocol, waits until the page reports the
// frame rendered (BuildingStage's still mode), screenshots it, and encodes
// AVIF and WebP with ffmpeg. No packages: Node's own WebSocket and fetch.
//
// Run after a build: npm run build && npm run stills
// CHROME_PATH overrides the Chrome binary; ffmpeg must be on PATH.
import { createServer } from "node:http";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const DEST = join(ROOT, "public", "stills");
const PORT = 4391;
const DEBUG_PORT = 9333;
const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SHOTS = ["site", "section"];
const THEMES = ["light", "dark"];
const SIZE = { width: 1600, height: 1200 };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain", ".json": "application/json" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(join(OUT, "index.html"))) throw new Error("No build in out/. Run `npm run build` first.");
if (!existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}. Set CHROME_PATH.`);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  if (path.split(/[/\\]/).includes("..")) {
    res.writeHead(400);
    return res.end();
  }
  let file = join(OUT, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, r));

const profile = mkdtempSync(join(tmpdir(), "stills-chrome-"));
const work = mkdtempSync(join(tmpdir(), "stills-png-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${SIZE.width},${SIZE.height}`,
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    // Software WebGL, so every machine renders the same pixels.
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" },
);

/** A minimal DevTools protocol client over Node's built-in WebSocket. */
async function connect() {
  let url;
  for (let i = 0; i < 100 && !url; i++) {
    try {
      url = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json()).webSocketDebuggerUrl;
    } catch {
      await sleep(150);
    }
  }
  if (!url) throw new Error("Chrome did not open its debugging port.");
  const ws = new WebSocket(url);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(String(m.data));
    const p = msg.id && pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(`${msg.error.message}`));
    else p.resolve(msg.result);
  };
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  return { send, close: () => ws.close() };
}

let failed = false;
try {
  const cdp = await connect();
  mkdirSync(DEST, { recursive: true });
  for (const shot of SHOTS) {
    for (const theme of THEMES) {
      const name = `${shot}-${theme}`;
      const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
      await cdp.send("Emulation.setDeviceMetricsOverride", { ...SIZE, deviceScaleFactor: 1, mobile: false }, sessionId);
      await cdp.send("Page.enable", {}, sessionId);
      await cdp.send("Page.navigate", { url: `http://localhost:${PORT}/?still=${shot}&theme=${theme}` }, sessionId);
      let ready = false;
      for (let i = 0; i < 600 && !ready; i++) {
        await sleep(200);
        try {
          const r = await cdp.send("Runtime.evaluate", { expression: "document.documentElement.dataset.stillReady === '1'", returnByValue: true }, sessionId);
          ready = r.result.value === true;
        } catch {
          // The page is still navigating; its context is not up yet.
        }
      }
      if (!ready) throw new Error(`${name}: the page never reported the still rendered.`);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
      await cdp.send("Target.closeTarget", { targetId });
      const png = join(work, `${name}.png`);
      writeFileSync(png, Buffer.from(data, "base64"));
      const avif = join(DEST, `${name}.avif`);
      const webp = join(DEST, `${name}.webp`);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "32", "-b:v", "0", "-pix_fmt", "yuv420p", avif]);
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-c:v", "libwebp", "-quality", "80", webp]);
      for (const f of [avif, webp]) {
        const kb = statSync(f).size / 1024;
        if (kb < 5) throw new Error(`${f} is ${kb.toFixed(1)} KB: blank or failed.`);
        console.log(`${f.replace(ROOT, ".")}  ${kb.toFixed(1)} KB`);
      }
    }
  }
  cdp.close();
} catch (err) {
  failed = true;
  console.error(err instanceof Error ? err.message : err);
} finally {
  chrome.kill();
  server.close();
  await sleep(300);
  // STILLS_KEEP=1 keeps the raw screenshots for a look.
  if (process.env.STILLS_KEEP) console.log(`screenshots kept in ${work}`);
  for (const dir of process.env.STILLS_KEEP ? [profile] : [profile, work]) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Chrome can hold its profile a moment after exit; the OS cleans temp.
    }
  }
}
process.exit(failed ? 1 : 0);
