import { Box, Hand, ShieldCheck } from "lucide-react";
import type { Flow, StepKind } from "@/content/projects";
import { withCode } from "@/lib/withCode";

const KIND_LABEL: Record<StepKind, string> = {
  io: "",
  step: "",
  model: "model",
  guard: "guard",
  human: "human approval",
};

function KindIcon({ kind, className }: { kind: StepKind; className?: string }) {
  if (kind === "model") return <Box aria-hidden className={className} />;
  if (kind === "guard") return <ShieldCheck aria-hidden className={className} />;
  if (kind === "human") return <Hand aria-hidden className={className} />;
  return null;
}

/* A flow turns horizontal only when its own box is wide enough for the widest
   unbreakable label ("User-scoped", "Fact-check") to sit inside its block:
   51rem for up to six steps, 54rem for seven. These are container queries on
   the wrapper (`@container` in ProjectCase), so the sidebar, the viewport and
   the visitor's font size all count. The class strings are spelled out in
   full because Tailwind only generates classes it can read in the source. */
const ACROSS = {
  six: {
    list: "@min-[51rem]:grid-cols-[repeat(var(--n),minmax(0,11rem))] @min-[51rem]:grid-rows-[auto_auto] @min-[51rem]:gap-x-3 @min-[51rem]:gap-y-3",
    step: "@min-[51rem]:row-span-2 @min-[51rem]:grid-cols-1 @min-[51rem]:grid-rows-subgrid @min-[51rem]:items-stretch @min-[51rem]:gap-y-3",
    link: "@min-[51rem]:bottom-auto @min-[51rem]:left-auto @min-[51rem]:right-[-0.75rem] @min-[51rem]:top-[21px] @min-[51rem]:h-px @min-[51rem]:w-3",
    note: "@min-[51rem]:pt-0",
  },
  seven: {
    list: "@min-[54rem]:grid-cols-[repeat(var(--n),minmax(0,11rem))] @min-[54rem]:grid-rows-[auto_auto] @min-[54rem]:gap-x-3 @min-[54rem]:gap-y-3",
    step: "@min-[54rem]:row-span-2 @min-[54rem]:grid-cols-1 @min-[54rem]:grid-rows-subgrid @min-[54rem]:items-stretch @min-[54rem]:gap-y-3",
    link: "@min-[54rem]:bottom-auto @min-[54rem]:left-auto @min-[54rem]:right-[-0.75rem] @min-[54rem]:top-[21px] @min-[54rem]:h-px @min-[54rem]:w-3",
    note: "@min-[54rem]:pt-0",
  },
};

/** A system drawn as the path work takes through it. With room, a flow reads
 *  left to right with each note under its block and every block in the row
 *  the same height (subgrid). Without, it becomes a vertical rail with the
 *  note beside each block. */
export default function Pipeline({ flows, name }: { flows: Flow[]; name: string }) {
  const named = flows.length > 1;
  return (
    <div className="flex flex-col gap-8">
      {flows.map((flow, f) => {
        const across = flow.steps.length > 6 ? ACROSS.seven : ACROSS.six;
        const title = named ? `${name}, ${flow.name?.toLowerCase()}` : name;
        return (
          <div key={flow.name ?? f} className="@container">
            {named && <h4 className="mb-3 text-[14px] font-semibold text-ink-2">{flow.name}</h4>}
            <ol
              aria-label={`How ${title} runs, step by step`}
              className={`grid grid-cols-1 gap-y-4 ${across.list}`}
              style={{ "--n": flow.steps.length } as React.CSSProperties}
            >
              {flow.steps.map((s, i) => {
                const last = i === flow.steps.length - 1;
                return (
                  <li
                    key={s.label}
                    className={`relative grid grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] items-start gap-x-4 ${across.step}`}
                  >
                    {/* Connector to the next step: down the rail when vertical,
                        across the gap when horizontal. */}
                    {!last && <span aria-hidden className={`absolute bottom-[-1rem] left-5 top-10 w-px bg-line-2 ${across.link}`} />}
                    <span className={`tile ${s.kind === "model" ? "tile-model" : s.kind === "guard" ? "tile-guard" : ""}`}>
                      <KindIcon kind={s.kind} className="h-4 w-4 shrink-0" />
                      {/* Non-breaking hyphens: "Fact-check" wraps between words,
                          never at its own hyphen. break-word is the last resort
                          if a label still cannot fit. */}
                      <span className="min-w-0 [overflow-wrap:break-word]">{s.label.replace(/-/g, "‑")}</span>
                      {KIND_LABEL[s.kind] && <span className="sr-only"> ({KIND_LABEL[s.kind]})</span>}
                    </span>
                    <span className={`pt-2.5 text-[13.5px] leading-[1.45] text-ink-3 ${across.note}`}>{withCode(s.note)}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

export function PipelineLegend() {
  const items: { kind: StepKind; text: string; tile: string }[] = [
    { kind: "model", text: "An AI model runs here", tile: "tile-model" },
    { kind: "guard", text: "A guard or check", tile: "tile-guard" },
    { kind: "human", text: "A person approves", tile: "" },
  ];
  return (
    <ul aria-label="Key to the diagrams" className="flex flex-wrap gap-x-6 gap-y-3">
      {items.map((it) => (
        <li key={it.kind} className="flex items-center gap-2.5 text-[14px] text-ink-2">
          <span className={`tile ${it.tile} !min-h-0 !p-1.5`} aria-hidden>
            <KindIcon kind={it.kind} className="h-3.5 w-3.5" />
          </span>
          {it.text}
        </li>
      ))}
    </ul>
  );
}
