import { ArrowUpRight } from "lucide-react";
import CaseSheet from "./CaseSheet";
import SceneFlows from "./SceneFlows";
import CaseDetails from "@/components/CaseDetails";
import { GithubIcon } from "@/components/icons";
import { StatusLabel } from "@/components/StatusLabel";
import { hostOf, type Project } from "@/content/projects";
import { withCode } from "@/lib/withCode";

/** Scenes 4 to 9: one system each. The text column (a mask for the field)
 *  holds the name, status, kicker and description, then the ways in; the
 *  flows fill the right seven columns, where the dots draw each step and the
 *  system's guard doing its job. On phones the description and the step
 *  notes move into the case-study sheet. */
export default function SystemScene({ project: p }: { project: Project }) {
  return (
    <section
      id={p.id}
      data-scene={p.id}
      aria-labelledby={`${p.id}-title`}
      className="container-x grid grid-cols-1 content-center gap-x-12 gap-y-8 pb-10 lg:grid-cols-12"
    >
      <div data-mask="text" className="lg:col-span-5">
        <h2 id={`${p.id}-title`} className="t-h2 text-ink">
          {p.name}
        </h2>
        <p className="mt-4 flex items-center gap-3 text-[14px] text-ink-3">
          <StatusLabel status={p.status} />
          <span aria-hidden className="h-3.5 w-px bg-line-2" />
          <span className="tabular-nums">{p.date}</span>
        </p>
        <p className="semi mt-2 text-[17px] font-semibold text-ink-2">{p.kicker}</p>
        <p className="mt-5 max-w-[52ch] text-ink-2 max-md:hidden">{withCode(p.desc)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CaseSheet id={p.id} name={p.name}>
            <CaseDetails project={p} />
          </CaseSheet>
          {p.liveLink && (
            <a href={p.liveLink} target="_blank" rel="noreferrer" className="key key-secondary key-sm">
              Open {p.liveLabel ?? hostOf(p.liveLink)}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {p.link && (
            <a href={p.link} target="_blank" rel="noreferrer" className="key key-secondary key-sm">
              <GithubIcon className="h-4 w-4" />
              Source
              <span className="sr-only">for {p.name} on GitHub (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>

      <div className="lg:col-span-7">
        <SceneFlows flows={p.flows ?? []} name={p.name} />
      </div>
    </section>
  );
}
