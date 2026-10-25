import Image from "next/image";
import { profile } from "@/content/profile";
import { skills, type Depth } from "@/content/skills";

const DEPTH_STYLE: Record<Depth, string> = {
  core: "text-ink font-semibold",
  strong: "text-ink-2",
  working: "text-ink-3",
};

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-line">
      <div className="container-x py-24 lg:py-32">
        <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
          {/* Text first on small screens, so the section opens with its heading
              rather than a full-width photo; the photo leads on wide ones. */}
          <div className="order-2 lg:order-1 lg:col-span-4">
            {/* A tighter 4:5 crop trims the studio-white backdrop of the ID-style
                photo, and dark mode tones it down so it is not the brightest
                thing on the page. */}
            <div className="aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-[14px] bg-ground-2 shadow-[inset_0_0_0_1px_var(--line)] lg:max-w-[340px]">
              <Image
                src="/me-450.webp"
                alt="Portrait of Shaan Satsangi"
                width={450}
                height={600}
                sizes="(min-width: 1024px) 340px, 240px"
                className="h-full w-full object-cover object-top dark:brightness-[0.78] dark:contrast-[1.05]"
              />
            </div>
            <dl className="mt-8 grid max-w-[340px] grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[14.5px]">
              <dt className="text-ink-3">Based in</dt>
              <dd className="text-ink">Jaipur, India</dd>
              <dt className="text-ink-3">Studied</dt>
              <dd className="text-ink">B.Tech CSE, JECRC, 2026</dd>
              <dt className="text-ink-3">Elsewhere</dt>
              <dd className="flex gap-4 text-ink">
                <a className="link" href={profile.github} target="_blank" rel="noreferrer">
                  GitHub
                </a>
                <a className="link" href={profile.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </dd>
            </dl>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
            <h2 id="about-title" className="t-h2 text-ink">
              About me
            </h2>
            <div className="mt-8 max-w-[64ch] space-y-5 text-[18px] leading-[1.65] text-ink-2">
              <p>
                I design and ship AI systems: agents that plan, retrieve and finish the job. I graduated from JECRC
                Jaipur in 2026 with a B.Tech in Computer Science and now do this full-time, mostly multi-agent pipelines,
                retrieval over real document sets and MCP-style tool routing, along with the plumbing that keeps them
                running in production. LangChain and LangGraph come out when a graph is clearer than hand-written
                orchestration.
              </p>
              <p>
                I created{" "}
                <a className="link" href={profile.flagship.href} target="_blank" rel="noreferrer">
                  Skill Issue
                </a>
                , a GitHub code-intelligence platform where the score is computed deterministically and the language
                model only explains it. That split runs through all of my work. The model is one component; the system
                around it supplies the retries, caches, idempotent state and human approvals that make it safe to rely
                on.
              </p>
              <p>Away from the keyboard: movies, music and history.</p>
            </div>
          </div>
        </div>

        <div className="mt-24 border-t border-line pt-14 lg:mt-28">
          <div className="grid grid-cols-1 gap-x-12 gap-y-4 lg:grid-cols-12">
            <h3 className="semi text-[24px] font-bold leading-tight text-ink lg:col-span-4">Toolkit</h3>
            <p className="max-w-[60ch] text-[15px] text-ink-3 lg:col-span-7 lg:col-start-6">
              Ranked by depth rather than a percentage. <span className="font-semibold text-ink">Core</span> is what I
              reach for first, <span className="text-ink-2">strong</span> is what I have shipped with, and working is
              what I use and am still building on.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((g) => (
              <div key={g.title}>
                <h4 className="border-b border-line-2 pb-2.5 text-[15px] font-bold text-ink">{g.title}</h4>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-[14.5px]">
                      <span className="text-ink-2">{it.name}</span>
                      <span className={`shrink-0 text-[13px] ${DEPTH_STYLE[it.depth]}`}>{it.depth}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
