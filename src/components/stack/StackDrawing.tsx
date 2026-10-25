import { drawing } from "./drawing";

/** A flat isometric drawing of the stack, projected with the same camera as
 *  the WebGL scene. It is what visitors see before the 3D model loads, what
 *  they keep if WebGL is unavailable, and what the model resolves out of. */
export default function StackDrawing({ className }: { className?: string }) {
  // vector-effect does not inherit, so every path carries it; set on a <g> it
  // would leave each stroke one world unit (about 100px) wide.
  const stroke = { stroke: "var(--line-2)", strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };
  const edge = { ...stroke, stroke: "var(--model-edge)" };
  const { model } = drawing;
  return (
    <svg viewBox={drawing.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
      {drawing.plates.map((p) => (
        <g key={p.slot}>
          <path d={p.body} fill="var(--plate)" {...stroke} />
          <path d={p.top} fill="var(--plate-top)" {...stroke} />
          <path d={p.panel} fill="none" {...stroke} />
          {p.slot === 4 && (
            <g>
              <path d={model.side} fill="var(--model)" {...edge} />
              <path d={model.side} fill="#000" fillOpacity={0.2} stroke="none" />
              <path d={model.front} fill="var(--model)" {...edge} />
              <path d={model.front} fill="#000" fillOpacity={0.08} stroke="none" />
              <path d={model.top} fill="var(--model)" {...edge} />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
