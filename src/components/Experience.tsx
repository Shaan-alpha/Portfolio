import { achievements, certifications, timeline, type Credential } from "@/content/experience";

function CredentialList({ items }: { items: Credential[] }) {
  return (
    <ul className="mt-3 border-t border-line-2">
      {items.map((c) => (
        <li key={c.name} className="border-b border-line py-3.5">
          <p className="text-[15px] font-semibold leading-snug text-ink">{c.name}</p>
          {/* Issuer and date share one line, so a credential without a date
              leaves no gap in a column of dates. */}
          <p className="mt-0.5 text-[13.5px] text-ink-3">
            {c.issuer}
            {c.date && <span className="tabular-nums">, {c.date}</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="border-t border-line">
      <div className="container-x py-24 lg:py-32">
        <h2 id="experience-title" className="t-h2 max-w-[14ch] text-ink">
          Experience and education
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-x-12 gap-y-16 lg:grid-cols-12">
          <ol className="lg:col-span-7">
            {timeline.map((r) => (
              <li
                key={`${r.org}-${r.period}`}
                className="grid grid-cols-1 gap-x-8 gap-y-2 border-t border-line py-8 first:border-t-0 first:pt-0 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
              >
                <div className="text-[14px] text-ink-3">
                  <p className="tabular-nums">{r.period}</p>
                  <p className="mt-1">{r.kind}</p>
                </div>
                <div>
                  <h3 className="text-[19px] font-bold leading-snug text-ink">{r.title}</h3>
                  <p className="mt-1 text-[15.5px] text-ink-2">
                    {r.org}, {r.location}
                  </p>
                  {r.summary && <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-ink-2">{r.summary}</p>}
                </div>
              </li>
            ))}
          </ol>

          <div className="lg:col-span-4 lg:col-start-9">
            <h3 className="text-[15px] font-bold text-ink">Certifications</h3>
            <CredentialList items={certifications} />
            <h3 className="mt-12 text-[15px] font-bold text-ink">Recognition</h3>
            <CredentialList items={achievements} />
          </div>
        </div>
      </div>
    </section>
  );
}
