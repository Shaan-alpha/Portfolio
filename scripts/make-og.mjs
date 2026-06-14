// Generates an on-brand 1200x630 Open Graph image (terminal/data card).
// Run: node scripts/make-og.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const W = 1200;
const H = 630;

const vLines = Array.from({ length: Math.ceil(W / 36) + 1 }, (_, i) => `<line x1="${i * 36}" y1="0" x2="${i * 36}" y2="${H}"/>`).join("");
const hLines = Array.from({ length: Math.ceil(H / 36) + 1 }, (_, i) => `<line x1="0" y1="${i * 36}" x2="${W}" y2="${i * 36}"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0b0d0e"/>
  <g fill="none" stroke="rgba(230,232,230,0.05)" stroke-width="1">${vLines}${hLines}</g>
  <text x="80" y="300" font-family="monospace" font-size="74" font-weight="700" fill="#e6e8e6">Shaan Satsangi<tspan fill="#3fb950">.</tspan></text>
  <text x="82" y="362" font-family="monospace" font-size="30" fill="#9aa0a6"><tspan fill="#3fb950">&gt; </tspan>data engineer · ml · analytics</text>
  <text x="82" y="556" font-family="monospace" font-size="22" fill="#3fb950">~/portfolio $ _</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(new URL("../public/og.png", import.meta.url), png);
console.log(`wrote public/og.png (${png.length} bytes)`);
