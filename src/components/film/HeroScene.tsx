import StackDrawing from "./StackDrawing";
import { profile } from "@/content/profile";
import { flagship } from "@/content/projects";
import { spell } from "@/lib/format";

/** Scene 1: who. The text column is a mask for the field (no dots behind the
 *  copy); the stack box on the right is where the dots form the October
 *  stack, starting exactly on its drawing. */
export default function HeroScene() {
  return (
    <section
      data-scene="hero"
      aria-labelledby="hero-title"
      className="container-x grid grid-cols-1 content-center gap-x-12 gap-y-8 pb-10 lg:grid-cols-12"
    >
      <div data-mask="text" className="lg:col-span-5">
        <h1 id="hero-title" className="t-display text-ink">
          Shaan
          <br />
          Satsangi
        </h1>
        <p className="semi mt-7 text-[19px] font-semibold text-ink">AI systems engineer in Jaipur, India</p>
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

      <div className="flex justify-center lg:col-span-7 lg:justify-start lg:pl-[6%]">
        {/* On wide screens the box leaves room for its labels: it narrows
            before they could run off the screen, never the other way round. */}
        <div
          data-stack-box
          className="relative aspect-[4.5/6.1] h-[34svh] lg:h-auto lg:w-[min(100%_-_10.5rem,calc(min(70svh,640px)*0.7377))]"
        >
          <StackDrawing />
        </div>
      </div>
    </section>
  );
}
