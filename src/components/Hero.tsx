import StackStage from "./stack/StackStage";
import StackDrawing from "./stack/StackDrawing";
import { profile } from "@/content/profile";
import { flagship } from "@/content/projects";
import { spell } from "@/lib/format";

export default function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="container-x grid grid-cols-1 items-center gap-x-12 gap-y-14 pb-20 pt-12 sm:pt-16 lg:min-h-[calc(100svh-var(--header))] lg:grid-cols-12 lg:pb-14 lg:pt-8"
    >
      <div className="lg:col-span-5">
        <h1 id="hero-title" className="t-display text-ink">
          Shaan
          <br />
          Satsangi
        </h1>
        <p className="semi mt-7 text-[19px] font-semibold text-ink">AI systems engineer in Jaipur, India</p>
        <p className="t-lead mt-4 max-w-[36ch] text-ink-2">
          I build agents and retrieval systems with the guardrails designed in: deterministic scoring, checks that fail
          closed, and a human approval wherever a mistake would be expensive.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#work" className="key key-primary">
            See the work
          </a>
          <a href={`mailto:${profile.email}`} className="key key-secondary">
            Email me
          </a>
        </div>
        <p className="mt-10 max-w-[44ch] text-[15px] leading-relaxed text-ink-3">
          Creator of{" "}
          <a className="link text-ink-2" href={profile.flagship.href} target="_blank" rel="noreferrer">
            {profile.flagship.name}
          </a>
          . {spell(flagship.length, true)} of my systems are running in production.
        </p>
      </div>

      <div className="lg:col-span-7">
        <StackStage drawing={<StackDrawing className="h-full w-full" />} />
      </div>
    </section>
  );
}
