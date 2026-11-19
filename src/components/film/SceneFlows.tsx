import { KIND_LABEL, KindTile } from "@/components/Pipeline";
import type { Flow } from "@/content/projects";
import { withCode } from "@/lib/withCode";

/** A system's flows as its scene shows them: a rail running top to bottom,
 *  each step a marker with its label and note beside it. The field forms
 *  each step's shape on its marker (`data-node`); until it does, and wherever
 *  it does not, the marker shows the step as a tile (`data-glyph`), the way
 *  the legend draws it. Two flows of one system sit side by side. The labels
 *  and notes are masks, so no dust drifts behind them. */
export default function SceneFlows({ flows, name }: { flows: Flow[]; name: string }) {
  const named = flows.length > 1;
  return (
    <div className={`grid gap-x-6 gap-y-8 ${named ? "grid-cols-2" : "grid-cols-1"}`}>
      {flows.map((flow, f) => {
        const title = named ? `${name}, ${flow.name?.toLowerCase()}` : name;
        return (
          <div key={flow.name ?? f} className="min-w-0">
            {named && (
              <h3 data-mask className="mb-3 text-[14px] font-semibold text-ink-2 md:mb-5">
                {flow.name}
              </h3>
            )}
            <ol aria-label={`How ${title} runs, step by step`} className="flex flex-col gap-y-2.5 md:gap-y-[clamp(0.75rem,3.6svh,2.25rem)]">
              {flow.steps.map((s) => (
                <li key={s.label} className="flex items-center gap-3 md:gap-4">
                  <span
                    data-node
                    data-kind={s.kind}
                    data-flow={String(f)}
                    data-step={s.label}
                    className="relative size-6 shrink-0 md:size-[clamp(1.75rem,4.4svh,2.5rem)]"
                  >
                    <KindTile kind={s.kind} />
                  </span>
                  <span data-mask className="min-w-0">
                    {/* Non-breaking hyphens, as in Pipeline: "Fact-check" wraps
                        between words, never at its own hyphen. */}
                    <span className="block text-[15px] font-semibold leading-tight text-ink">
                      {s.label.replace(/-/g, "‑")}
                      {KIND_LABEL[s.kind] && <span className="sr-only"> ({KIND_LABEL[s.kind]})</span>}
                    </span>
                    <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-3 max-md:hidden">{withCode(s.note)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
