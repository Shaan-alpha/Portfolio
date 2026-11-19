import { ArrowUpRight } from "lucide-react";
import { StatusLabel } from "./ProjectCase";
import { GithubIcon } from "./icons";
import { lab } from "@/content/projects";
import { spell } from "@/lib/format";
import { withCode } from "@/lib/withCode";

/** Everything else, as an index: one row per project on the page's 12-column
 *  grid, so the eye runs down names, then descriptions, then links. */
export default function Archive() {
  return (
    <section id="also-shipped" aria-labelledby="also-title" className="border-t border-line">
      <div className="container-x py-20 lg:py-24">
        <h2 id="also-title" className="t-h3 text-ink">
          Also shipped
        </h2>
        <p className="mt-3 text-[15px] text-ink-3">
          {spell(lab.length, true)} more, from a local MCP server to a pixel-art idle game.
        </p>
        <ul className="mt-10 border-t border-line">
          {lab.map((p) => (
            <li
              key={p.id}
              id={p.id}
              className="grid grid-cols-1 gap-x-8 gap-y-3 border-b border-line py-7 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:grid-cols-12"
            >
              <div className="lg:col-span-3">
                <h3 className="text-[18px] font-bold leading-snug text-ink">{p.name}</h3>
                <p className="mt-1 text-[14px] text-ink-3">{p.kicker}</p>
                <p className="mt-2 flex items-center gap-3 text-[13.5px] text-ink-3">
                  <StatusLabel status={p.status} />
                  <span aria-hidden className="h-3.5 w-px bg-line-2" />
                  <span className="tabular-nums">{p.date}</span>
                </p>
              </div>
              <div className="lg:col-span-7">
                <p className="text-[15.5px] leading-[1.6] text-ink-2">{withCode(p.desc)}</p>
                <p className="mt-2 text-[13.5px] text-ink-3">{p.tags.join(", ")}</p>
              </div>
              <p className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold md:col-start-2 lg:col-span-2 lg:col-start-auto lg:flex-col lg:items-end lg:text-right">
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
