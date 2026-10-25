import { ArrowUpRight } from "lucide-react";
import Pipeline from "./Pipeline";
import { GithubIcon } from "./icons";
import { hostOf, type Project } from "@/content/projects";
import { lookupTech, TechLogo } from "@/lib/techIcons";
import { withCode } from "@/lib/withCode";

export function StatusLabel({ status }: { status: Project["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
        <span aria-hidden className="h-2 w-2 rounded-full bg-ok" />
        Live
      </span>
    );
  }
  return <span className="font-semibold text-ink-2">{status === "shipped" ? "Shipped" : "Building"}</span>;
}

export default function ProjectCase({ project: p }: { project: Project }) {
  return (
    <article id={p.id} aria-labelledby={`${p.id}-title`} className="border-t border-line py-14 first:border-t-0 first:pt-0 lg:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 id={`${p.id}-title`} className="t-h3 text-ink">
          {p.name}
        </h3>
        <p className="flex items-center gap-3 text-[14px] text-ink-3">
          <StatusLabel status={p.status} />
          <span aria-hidden className="h-3.5 w-px bg-line-2" />
          <span className="tabular-nums">{p.date}</span>
        </p>
      </div>
      <p className="semi mt-2 text-[17px] font-semibold text-ink-2">{p.kicker}</p>
      <p className="mt-5 max-w-[66ch] text-ink-2">{withCode(p.desc)}</p>

      {p.flows && (
        <div className="mt-9">
          <Pipeline flows={p.flows} name={p.name} />
        </div>
      )}

      <ul className="mt-10 max-w-[70ch] space-y-3">
        {p.bullets.map((b) => (
          <li key={b} className="relative pl-5 text-[15.5px] leading-[1.6] text-ink-2">
            <span aria-hidden className="absolute left-0 top-[0.62em] h-[5px] w-[5px] rounded-[1px] bg-ink-3" />
            {withCode(b)}
          </li>
        ))}
      </ul>

      <div className="mt-9 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <ul aria-label={`${p.name} is built with`} className="flex max-w-[52ch] flex-wrap gap-x-4 gap-y-2 text-[13.5px] text-ink-3">
          {p.tags.map((t) => {
            const logo = lookupTech(t);
            return (
              <li key={t} className="inline-flex items-center gap-1.5">
                {logo && <TechLogo file={logo.file} invert={logo.invert} alt="" className="h-3.5 w-3.5" />}
                {t}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-3">
          {p.liveLink && (
            <a href={p.liveLink} target="_blank" rel="noreferrer" className="key key-primary key-sm">
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
    </article>
  );
}
