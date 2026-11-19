import { drawing } from "@/components/stack/drawing";
import { slotLabelTops } from "@/components/field/targets";
import { layers } from "@/content/stack";

const line = { stroke: "var(--line-2)", strokeWidth: 0.012, strokeLinejoin: "round" as const };
const modelLine = { stroke: "var(--model-edge)", strokeWidth: 0.012, strokeLinejoin: "round" as const };

/** The October stack as a flat drawing: the hero's first paint, the stand-in
 *  when WebGL is unavailable, and the shape the dots form on exactly when the
 *  field takes over (same projection, `stack/geometry.ts`). Its box has the
 *  viewBox's aspect ratio, so the drawing fills it edge to edge and the field
 *  can read the stack's frame straight from the box. The layer names sit
 *  beside their slots; the stack only turns about its vertical axis, which
 *  never moves a slot's height. */
export default function StackDrawing() {
  const tops = slotLabelTops();
  const { model } = drawing;
  return (
    <>
      <svg
        data-drawing
        aria-hidden
        viewBox={drawing.viewBox}
        className="absolute inset-0 h-full w-full transition-opacity duration-300"
      >
        {drawing.plates.map((p) => (
          <g key={p.slot}>
            <path d={p.body} style={{ fill: "var(--plate)" }} {...line} />
            <path d={p.top} style={{ fill: "var(--plate-top)" }} {...line} />
            <path d={p.panel} fill="none" {...line} />
            {p.slot === 4 && (
              <g>
                <path d={model.side} style={{ fill: "color-mix(in srgb, var(--model) 80%, #000)" }} {...modelLine} />
                <path d={model.front} style={{ fill: "color-mix(in srgb, var(--model) 92%, #000)" }} {...modelLine} />
                <path d={model.top} style={{ fill: "var(--model)" }} {...modelLine} />
              </g>
            )}
          </g>
        ))}
      </svg>
      <ul className="absolute inset-y-0 left-full hidden w-44 pl-6 lg:block">
        {layers.map((layer, slot) => (
          <li
            key={layer.id}
            className="absolute flex -translate-y-1/2 items-center gap-2 whitespace-nowrap text-[13.5px] text-ink-3"
            style={{ top: `${tops[slot]}%` }}
          >
            {layer.id === "model" && <span aria-hidden className="h-2 w-2 rounded-[2px] bg-model ring-1 ring-model-edge" />}
            {layer.name}
          </li>
        ))}
      </ul>
    </>
  );
}
