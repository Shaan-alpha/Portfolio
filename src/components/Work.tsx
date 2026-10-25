import { ArrowUpRight } from "lucide-react";
import ProjectCase, { StatusLabel } from "./ProjectCase";
import { withCode } from "@/lib/withCode";
import WorkIndex from "./WorkIndex";
import { PipelineLegend } from "./Pipeline";
import { GithubIcon } from "./icons";
import { flagship, lab, liveCount, projects } from "@/content/projects";
import { spell } from "@/lib/format";

export default function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className="border-t border-line">
      <div className="container-x py-24 lg:py-32">
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-12">
          <h2 id="work-title" className="t-h2 text-ink lg:col-span-5">
            Selected work
          </h2>
          <div className="lg:col-span-7">
            <p className="t-lead text-ink-2">
              {spell(flagship.length, true)} systems in production, each drawn the way work moves through it, then{" "}
              {spell(lab.length)} more projects. {spell(liveCount, true)} of the {spell(projects.length)} have a live
              version you can open.
            </p>
            <div className="mt-6">
              <PipelineLegend />
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-x-12 lg:grid-cols-12">
          <div className="hidden lg:col-span-3 lg:block">
            <WorkIndex
              items={flagship.map(({ id, name, kicker }) => ({ id, name, kicker }))}
              archiveId="also-shipped"
              archiveCount={lab.length}
            />
          </div>
          <div className="lg:col-span-9">
            {flagship.map((p) => (
              <ProjectCase key={p.id} project={p} />
            ))}
          </div>
        </div>

        <div id="also-shipped" className="mt-16 grid grid-cols-1 gap-x-12 gap-y-6 border-t border-line pt-16 lg:mt-20 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-3">
            <h3 className="semi text-[24px] font-bold leading-tight text-ink">Also shipped</h3>
            <p className="mt-2 text-[15px] text-ink-3">
              {spell(lab.length, true)} more, from a local MCP server to a pixel-art idle game.
            </p>
          </div>
          <ul className="lg:col-span-9">
            {lab.map((p) => (
              <li
                key={p.id}
                id={p.id}
                className="grid grid-cols-1 gap-x-8 gap-y-3 border-b border-line py-7 first:pt-0 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"
              >
                <div>
                  <h4 className="text-[18px] font-bold leading-snug text-ink">{p.name}</h4>
                  <p className="mt-1 text-[14px] text-ink-3">{p.kicker}</p>
                  <p className="mt-2 flex items-center gap-3 text-[13.5px] text-ink-3">
                    <StatusLabel status={p.status} />
                    <span aria-hidden className="h-3.5 w-px bg-line-2" />
                    <span className="tabular-nums">{p.date}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[15.5px] leading-[1.6] text-ink-2">{withCode(p.desc)}</p>
                  <p className="mt-2 text-[13.5px] text-ink-3">{p.tags.join(", ")}</p>
                  <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold">
                    {p.liveLink && (
                      <a href={p.liveLink} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1">
                        Open the live version
                        <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        <span className="sr-only">of {p.name} (opens in a new tab)</span>
                      </a>
                    )}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1.5">
                        <GithubIcon className="h-3.5 w-3.5" />
                        Source
                        <span className="sr-only">for {p.name} on GitHub (opens in a new tab)</span>
                      </a>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
