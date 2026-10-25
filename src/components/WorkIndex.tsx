"use client";

import { useActiveSection } from "@/lib/useActiveSection";
import { spell } from "@/lib/format";

type Item = { id: string; name: string; kicker: string };

/** The table of contents for the case studies, pinned beside them on wide
 *  screens. It follows the reader down the page and jumps on click. */
export default function WorkIndex({ items, archiveId, archiveCount }: { items: Item[]; archiveId: string; archiveCount: number }) {
  const ids = items.map((i) => i.id);
  const active = useActiveSection(ids);

  return (
    <nav aria-label="Projects" className="sticky top-[calc(var(--header)+2rem)]">
      <ol className="flex flex-col border-l border-line">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                className={`relative -ml-px block border-l-2 py-2.5 pl-4 pr-2 transition-colors ${
                  on ? "border-ink" : "border-transparent hover:border-line-2"
                }`}
              >
                <span className={`block text-[15px] font-semibold leading-tight ${on ? "text-ink" : "text-ink-2"}`}>{it.name}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{it.kicker}</span>
              </a>
            </li>
          );
        })}
      </ol>
      <a href={`#${archiveId}`} className="link mt-6 inline-block pl-4 text-[14px] text-ink-2">
        {spell(archiveCount, true)} more projects
      </a>
    </nav>
  );
}
