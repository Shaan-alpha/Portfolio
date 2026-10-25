import { ImageResponse } from "next/og";
import { drawing } from "@/components/stack/drawing";

// The social card, rendered once at build time so the image shared on
// LinkedIn or Slack always matches the site it links to. A route handler
// rather than opengraph-image.tsx: static export writes that one out with no
// file extension, and Cloudflare would not serve it as image/png.
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

const NAME = "Shaan Satsangi";
const ROLE = "AI systems engineer";
const LINE = "The model is a component, not the architecture.";

/** Fetch just the glyphs the card uses, as TrueType (what Satori reads). The
 *  build already depends on Google Fonts through next/font. */
async function archivo(wdth: number, wght: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@${wdth},${wght}&text=${encodeURIComponent(text)}`)
    ).text();
    const src = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    return src ? await (await fetch(src)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [display, semibold, regular] = await Promise.all([
    archivo(125, 800, NAME),
    archivo(100, 600, ROLE + "shaansatsangi.com"),
    archivo(100, 400, LINE),
  ]);
  const fonts = [
    display && { name: "Archivo Expanded", data: display, weight: 800 as const, style: "normal" as const },
    semibold && { name: "Archivo", data: semibold, weight: 600 as const, style: "normal" as const },
    regular && { name: "Archivo", data: regular, weight: 400 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  const line = { stroke: "#a9b0b9", strokeWidth: 0.012, strokeLinejoin: "round" as const };
  const { model } = drawing;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#eceef1", color: "#111318" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 0 0 80px", width: 680 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Archivo Expanded", fontWeight: 800, fontSize: 104, lineHeight: 0.92, letterSpacing: -3 }}>
            <span>Shaan</span>
            <span>Satsangi</span>
          </div>
          <div style={{ marginTop: 40, fontFamily: "Archivo", fontWeight: 600, fontSize: 36 }}>{ROLE}</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", fontFamily: "Archivo", fontWeight: 400, fontSize: 28, color: "#454b55", lineHeight: 1.35 }}>
            <span>The model is a component,</span>
            <span>not the architecture.</span>
          </div>
          <div style={{ marginTop: 44, fontFamily: "Archivo", fontWeight: 600, fontSize: 24, color: "#5f6671" }}>shaansatsangi.com</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 520 }}>
          <svg viewBox={drawing.viewBox} width={480} height={600}>
            {drawing.plates.map((p) => (
              <g key={p.slot}>
                <path d={p.body} fill="#f4f5f7" {...line} />
                <path d={p.top} fill="#ffffff" {...line} />
                <path d={p.panel} fill="none" {...line} />
                {p.slot === 4 && (
                  <g>
                    <path d={model.side} fill="#d9a400" stroke="#9a7300" strokeWidth={0.012} />
                    <path d={model.front} fill="#f0b90c" stroke="#9a7300" strokeWidth={0.012} />
                    <path d={model.top} fill="#ffc61a" stroke="#9a7300" strokeWidth={0.012} />
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
