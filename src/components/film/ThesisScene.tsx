import type { StepKind } from "@/content/projects";
import { THESIS_TITLE } from "./places";

/** The thesis rail, top to bottom: input, deterministic scoring, the model,
 *  a check that fails closed, a human approval, output. No labels: the
 *  sentence beside it names the three parts that matter, and each of those
 *  phrases lights its part (`data-group` is the node's index in this rail). */
const RAIL: (StepKind | "grid")[] = ["io", "grid", "model", "guard", "human", "io"];

/** Scene 2: how. The stack's plates slide apart into one flow. */
export default function ThesisScene() {
  return (
    <section
      id="thesis"
      data-scene="thesis"
      aria-labelledby="thesis-title"
      className="container-x grid grid-cols-1 content-center gap-x-12 gap-y-10 pb-10 lg:grid-cols-12"
    >
      <div data-mask="text" className="lg:col-span-5">
        <h2 id="thesis-title" className="t-h2 text-ink">
          {THESIS_TITLE}
        </h2>
        <p className="t-lead mt-7 max-w-[36ch] text-ink-2">
          I build agents and retrieval systems with the guardrails designed in:{" "}
          <span data-phrase="scoring" data-group="1" className="transition-colors hover:text-ink">
            deterministic scoring
          </span>
          ,{" "}
          <span data-phrase="checks" data-group="3" className="transition-colors hover:text-ink">
            checks that fail closed
          </span>
          , and{" "}
          <span data-phrase="approval" data-group="4" className="transition-colors hover:text-ink">
            a human approval
          </span>{" "}
          wherever a mistake would be expensive.
        </p>
      </div>

      <div className="flex justify-center lg:col-span-7">
        <ol aria-hidden className="flex h-[30svh] flex-col items-center justify-between lg:h-[min(62svh,560px)]">
          {RAIL.map((kind, k) => (
            <li key={k} data-node data-kind={kind} data-flow="0" className="h-12 w-12" />
          ))}
        </ol>
      </div>
    </section>
  );
}
