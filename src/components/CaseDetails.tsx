import { ArrowUpRight } from "lucide-react";
import Pipeline from "./Pipeline";
import { GithubIcon } from "./icons";
import { hostOf, type Project } from "@/content/projects";
import { lookupTech, TechLogo } from "@/lib/techIcons";
import { withCode } from "@/lib/withCode";

/** The rest of a system's case study, read in its sheet: the bullets, the
 *  tags with their logos, and the live and source links. On phones the scene
 *  leaves out the description and the step notes, so they come first here. */
export default function CaseDetails({ project: p }: { project: Project }) {
  return (
    <>
      <div className="mb-10 md:hidden">
        <p className="text-ink-2">{withCode(p.desc)}</p>
        {p.flows && (
          <div className="mt-8">
            <Pipeline flows={p.flows} name={p.name} />
          </div>
        )}
      </div>

      <ul className="max-w-[70ch] space-y-3">
        {p.bullets.map((b) => (
          <li key={b} className="relative pl-5 text-[15.5px] leading-[1.6] text-ink-2">
            <span aria-hidden className="absolute left-0 top-[0.62em] h-[5px] w-[5px] rounded-[1px] bg-ink-3" />
            {withCode(b)}
          </li>
        ))}
      </ul>

      <ul aria-label={`${p.name} is built with`} className="mt-9 flex flex-wrap gap-x-4 gap-y-2 text-[13.5px] text-ink-3">
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

      <div className="mt-9 flex flex-wrap gap-3">
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
    </>
  );
}
