"use client";

import { useActiveSection } from "@/lib/useActiveSection";
import { spell } from "@/lib/format";

type Item = { id: string; name: string; kicker: string };

/** The building's directory: the table of contents for the case studies,
 *  held beside them on wide screens above the route stage. It follows the
 *  reader down the page and jumps on click. Names only, so it and the stage
 *  fit one screen together; each kicker is right there in its case study. */
export default function WorkIndex({ items, archiveId, archiveCount }: { items: Item[]; archiveId: string; archiveCount: number }) {
  const ids = items.map((i) => i.id);
  const active = useActiveSection(ids);

  return (
    <nav aria-label="Projects">
      <ol className="flex flex-col border-l border-line">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                className={`relative -ml-px block border-l-2 py-1.5 pl-4 pr-2 transition-colors ${
                  on ? "border-ink" : "border-transparent hover:border-line-2"
                }`}
              >
                <span className={`block text-[15px] font-semibold leading-tight ${on ? "text-ink" : "text-ink-2"}`}>{it.name}</span>
              </a>
            </li>
          );
        })}
      </ol>
      <a href={`#${archiveId}`} className="link mt-3 inline-block pl-4 text-[14px] text-ink-2">
        {spell(archiveCount, true)} more projects
      </a>
    </nav>
  );
}
