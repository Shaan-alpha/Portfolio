import { PipelineLegend } from "@/components/Pipeline";
import { flagship, lab, liveCount, projects } from "@/content/projects";
import { spell } from "@/lib/format";

/** Scene 3: the six systems side by side. The thesis's one flow splits into
 *  six lanes, one per system, each its real flows step by step (an empty gap
 *  between two flows of one system), so a lane's length is its number of
 *  steps and its yellow is where its models run. The names are the way in. */
export default function WorkScene() {
  return (
    <section
      id="work"
      data-scene="work"
      aria-labelledby="work-title"
      className="container-x grid grid-cols-1 content-center gap-x-12 gap-y-10 pb-10 lg:grid-cols-12"
    >
      <div data-mask="text" className="lg:col-span-5">
        <h2 id="work-title" className="t-h2 text-ink">
          Selected work
        </h2>
        <p className="t-lead mt-7 text-ink-2">
          {spell(flagship.length, true)} systems in production, each drawn the way work moves through it, then{" "}
          {spell(lab.length)} more projects. {spell(liveCount, true)} of the {spell(projects.length)} have a live
          version you can open.
        </p>
        <div className="mt-7">
          <PipelineLegend />
        </div>
      </div>

      <ul className="grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-6 lg:col-span-7">
        {flagship.map((p, lane) => (
          <li key={p.id} className="flex flex-col items-center gap-5">
            <a href={`#${p.id}`} data-mask className="link min-h-[2.6em] text-center text-[13.5px] font-semibold leading-snug text-ink-2">
              {p.name}
            </a>
            <ol aria-hidden className="flex flex-col items-center gap-y-3.5">
              {(p.flows ?? []).flatMap((flow, f) => [
                ...(f > 0 ? [<li key={`gap-${f}`} className="h-3" />] : []),
                ...flow.steps.map((s, k) => (
                  <li key={`${f}-${k}`} data-node data-kind={s.kind} data-flow={`${lane}-${f}`} className="h-5 w-5" />
                )),
              ])}
            </ol>
          </li>
        ))}
      </ul>
    </section>
  );
}
