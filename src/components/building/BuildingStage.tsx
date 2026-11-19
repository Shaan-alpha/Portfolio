"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { layers, type LayerId } from "@/content/stack";
import { projects } from "@/content/projects";
import { play } from "@/lib/sound";
import type { Anchor, BuildingScene } from "./scene";

const nameOf = Object.fromEntries(projects.map((p) => [p.id, p.name]));
const LEVEL: Record<LayerId, string | null> = { state: "level B", interfaces: "level 0", guards: "level 1", orchestration: "level 2", model: null };
/** Act II holds the hero for this much scroll, in viewport heights. */
const PIN = 2.5;

type Status = "loading" | "ready" | "static";

/** `still` is the site still (see Still.tsx), shown until the 3D is live,
 *  and `sectionStill` the act II still, rendered only when the stage stays
 *  static, so only those visitors download it. `resting` holds each
 *  callout's top, in percent, before the model loads (see resting.ts).
 *  `sectionAt` is the section beat's scroll progress, and `settledAt` the
 *  progress where the camera is back outside after the dive. All of it comes
 *  from the server so none of it ships as first-load JS. */
export default function BuildingStage({
  still,
  sectionStill,
  resting,
  sectionAt,
  settledAt,
}: {
  still: React.ReactNode;
  sectionStill: React.ReactNode;
  resting: number[];
  sectionAt: number;
  settledAt: number;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<BuildingScene | null>(null);
  const calloutsRef = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [selected, setSelected] = useState<LayerId | null>(null);
  const [hovered, setHovered] = useState<LayerId | null>(null);
  const [previewed, setPreviewed] = useState<LayerId | null>(null);
  const [rotated, setRotated] = useState(false);
  const [callouts, setCallouts] = useState(false);
  // True while the camera is over or inside the atrium, where the callouts
  // have nothing outside the building to point at.
  const [inside, setInside] = useState(false);
  const insideRef = useRef(false);
  // Without the 3D, the stage still shows act II: past the middle of the
  // hero, the section still replaces the site still.
  const [staticSection, setStaticSection] = useState(false);
  const { setTheme } = useTheme();

  // Still mode's theme, through next-themes, which would otherwise put its own
  // class back. Kept apart from the scene's effect so a theme change can
  // never recreate the scene.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("still")) setTheme(params.get("theme") === "dark" ? "dark" : "light");
  }, [setTheme]);

  /** Drop positions written by placeCallouts, so the CSS resting positions
   *  (or the wrapped row on small screens) apply again. */
  const clearPlacement = () => {
    listRef.current?.querySelectorAll<HTMLElement>("li[data-layer]").forEach((li) => {
      li.style.top = "";
      li.style.transform = "";
    });
  };

  // Desktop draws the layer names as callouts beside the model; smaller
  // screens list them as a row of buttons under it. The query is in rem to
  // match Tailwind's lg breakpoint, which moves with the default font size.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const sync = () => {
      calloutsRef.current = mq.matches;
      setCallouts(mq.matches);
      if (mq.matches) sceneRef.current?.redraw();
      else clearPlacement();
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Load three.js, GSAP and the scene only on the client and only when they
  // can run. Save-Data and a missing WebGL context both leave the still.
  useEffect(() => {
    const canvas = canvasRef.current;
    const figure = figureRef.current;
    if (!canvas || !figure) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    if (nav.connection?.saveData || !gl) {
      setStatus("static");
      return;
    }
    let disposed = false;
    let revert: (() => void) | null = null;
    // Whether the visitor has scrolled, pressed or touched anything since load,
    // so a late correction to a deep link never yanks someone who has moved.
    let touched = false;
    const touch = () => {
      touched = true;
    };
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    inputs.forEach((t) => window.addEventListener(t, touch, { passive: true, once: true }));
    // Still mode (?still=site|section&theme=light|dark) renders one shot,
    // full screen and at full quality, for scripts/render-stills.mjs.
    const params = new URLSearchParams(window.location.search);
    const stillShot = params.get("still");
    const stillAt = stillShot === "site" ? 0 : stillShot === "section" ? sectionAt : null;
    const stillDark = params.get("theme") === "dark";
    if (stillAt !== null) document.documentElement.dataset.still = "";
    const reducedMotion = stillAt === null && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const detail =
      stillAt === null && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900 || (nav.deviceMemory ?? 8) <= 4) ? "low" : "high";

    const placeCallouts = (anchors: Anchor[]) => {
      const list = listRef.current;
      const lines = linesRef.current;
      const stage = stageRef.current;
      if (!list || !lines || !stage || !calloutsRef.current) return;
      const labelX = stage.offsetWidth + 24;
      // Keep labels at least 44px apart when the building is turned.
      const items = anchors
        .map((a) => ({ ...a, el: list.querySelector<HTMLElement>(`[data-layer="${a.id}"]`) }))
        .sort((a, b) => a.y - b.y);
      let floor = -Infinity;
      for (const it of items) {
        const y = Math.max(it.y, floor + 44);
        floor = y;
        if (it.el) {
          it.el.style.top = "0px";
          it.el.style.transform = `translateY(${(y - it.el.offsetHeight / 2).toFixed(1)}px)`;
        }
        const path = lines.querySelector<SVGPathElement>(`[data-line="${it.id}"]`);
        const dot = lines.querySelector<SVGCircleElement>(`[data-dot="${it.id}"]`);
        if (path) path.setAttribute("d", `M${it.x.toFixed(1)} ${it.y.toFixed(1)}H${(labelX - 22).toFixed(1)}L${(labelX - 8).toFixed(1)} ${y.toFixed(1)}`);
        if (dot) {
          dot.setAttribute("cx", it.x.toFixed(1));
          dot.setAttribute("cy", it.y.toFixed(1));
        }
      }
    };

    // GSAP only drives the pinned flight, so reduced motion and still mode
    // never download it.
    const flies = !reducedMotion && stillAt === null;
    Promise.all([import("./scene"), flies ? import("gsap") : Promise.resolve(null), flies ? import("gsap/ScrollTrigger") : Promise.resolve(null)])
      .then(([{ createBuildingScene }, gsapModule, triggerModule]) => {
        if (disposed) return;
        let scene: BuildingScene;
        try {
          scene = createBuildingScene({
            canvas,
            detail,
            reducedMotion,
            onReady: () => {
              if (!disposed) setStatus("ready");
            },
            onHover: setHovered,
            onPick: (id) => setSelected((cur) => (id === null || id === cur ? null : id)),
            onRotated: setRotated,
            // A detented dial: a quiet tick per notch, at least 45 ms apart so
            // a hard spin never buzzes, each a few percent off in pitch.
            onDetent: () => play("typing", { cooldownMs: 45, playbackRate: 0.97 + Math.random() * 0.06 }),
            onAnchors: placeCallouts,
            // A lost context takes the model down for good: dispose it so the
            // hidden canvas stops answering, and hand back to the still. The
            // pin stays, so nothing on the page moves under the visitor.
            onLost: () => {
              sceneRef.current?.dispose();
              sceneRef.current = null;
              clearPlacement();
              setHovered(null);
              setRotated(false);
              setStatus("static");
            },
          });
        } catch {
          setStatus("static");
          return;
        }
        sceneRef.current = scene;

        if (stillAt !== null) {
          scene.setProgress(stillAt);
          // The theme class lands a frame or two after setTheme; the scene
          // re-reads its palette when it does, so wait for it first.
          const themed = () =>
            new Promise<void>((done) => {
              const check = (n: number) =>
                document.documentElement.classList.contains("dark") === stillDark || n > 120 ? done() : requestAnimationFrame(() => check(n + 1));
              check(0);
            });
          document.fonts?.ready
            .catch(() => {})
            .then(themed)
            .then(() => scene.renderStill())
            .then(() => {
              document.documentElement.dataset.stillReady = "1";
            });
          return;
        }

        if (reducedMotion) {
          // No camera flight: hold the site shot until the stage has mostly
          // scrolled away, then cut to the section behind a short dip.
          const io = new IntersectionObserver(
            ([entry]) => {
              const p = entry.intersectionRatio < 0.6 && entry.boundingClientRect.top < 0 ? sectionAt : 0;
              canvas.style.opacity = "0";
              window.setTimeout(() => {
                sceneRef.current?.setProgress(p);
                canvas.style.opacity = "";
              }, 150);
            },
            { threshold: [0.6] },
          );
          io.observe(figure);
          revert = () => io.disconnect();
          return;
        }

        if (!gsapModule || !triggerModule) return;
        const { gsap } = gsapModule;
        const { ScrollTrigger } = triggerModule;
        gsap.registerPlugin(ScrollTrigger);
        const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header")) || 64;
        // Through the ref: after a lost context the scene is gone, but the pin
        // stays so the page keeps its height and scroll position.
        const onProgress = (p: number) => {
          sceneRef.current?.setProgress(p);
          const now = p > sectionAt + 0.03 && p < settledAt - 0.03;
          if (now !== insideRef.current) {
            insideRef.current = now;
            setInside(now);
          }
        };
        // scrub only smooths an animation, so the pin drives a tween of a
        // plain number and the scene reads it: a wheel's steps become a
        // glide that catches up over a second.
        const fly = (trigger: Element) => {
          const flight = { p: 0 };
          gsap.to(flight, {
            p: 1,
            ease: "none",
            onUpdate: () => onProgress(flight.p),
            // Refreshed before every other trigger (higher runs first), so the
            // pin's height is counted in the route stage's triggers below it,
            // whichever of the two loaded first.
            scrollTrigger: { trigger, start: `top top+=${header}`, end: `+=${PIN * 100}%`, pin: true, scrub: 1, refreshPriority: 1 },
          });
        };
        const ctx = gsap.context(() => {
          const mm = gsap.matchMedia();
          // Wide screens hold the whole hero, text beside the model. Narrow
          // ones hold the figure (stage, layer buttons, caption), which sits
          // under the text and fits a phone screen.
          mm.add("(min-width: 64rem)", () => {
            fly(figure.closest("section") ?? figure);
          });
          mm.add("(max-width: 63.99rem)", () => {
            fly(figure);
          });
        }, figure);
        revert = () => ctx.revert();
        ScrollTrigger.refresh();
        // A deep link (#atlas, #contact) was resolved by the browser before
        // the pin added its height above the target, so the page now sits
        // that much short of it. Land it again, once, if nobody has moved.
        // Later refreshes (the font swap, the route stage's triggers) move it
        // again, so it lands on each refresh for the first few seconds.
        const hash = decodeURIComponent(window.location.hash.slice(1));
        const target = hash && hash !== "top" ? document.getElementById(hash) : null;
        const landing = header + 24; // html's scroll-padding-top
        const land = () => {
          if (target && !touched && Math.abs(target.getBoundingClientRect().top - landing) > 40) {
            target.scrollIntoView({ block: "start", behavior: "instant" });
          }
        };
        if (target) {
          land();
          // Not every late layout change refreshes ScrollTrigger, so it also
          // checks on a short schedule while the page settles.
          const timers = [300, 800, 1500, 2500, 4000].map((ms) => window.setTimeout(land, ms));
          ScrollTrigger.addEventListener("refresh", land);
          const stop = window.setTimeout(() => ScrollTrigger.removeEventListener("refresh", land), 5000);
          const prev = revert;
          revert = () => {
            timers.forEach((t) => window.clearTimeout(t));
            window.clearTimeout(stop);
            ScrollTrigger.removeEventListener("refresh", land);
            prev?.();
          };
        }
        // Fonts and the callout column change the layout the pin measured.
        document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
      })
      .catch(() => setStatus("static"));

    return () => {
      disposed = true;
      inputs.forEach((t) => window.removeEventListener(t, touch));
      revert?.();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [sectionAt, settledAt]);

  // The static stage's act II: the same half-way cut reduced motion uses.
  useEffect(() => {
    const figure = figureRef.current;
    if (status !== "static" || !figure) return;
    const io = new IntersectionObserver(([entry]) => setStaticSection(entry.intersectionRatio < 0.6 && entry.boundingClientRect.top < 0), {
      threshold: [0.6],
    });
    io.observe(figure);
    return () => io.disconnect();
  }, [status]);

  useEffect(() => sceneRef.current?.setSelected(selected), [selected, status]);
  // Selecting and clearing a layer sound the same whichever way they happen:
  // the model, a tag, a phone button, a second press, or Escape. Comparing with
  // the last value keeps Strict Mode's second effect run silent.
  const wasSelected = useRef(selected);
  useEffect(() => {
    if (wasSelected.current === selected) return;
    wasSelected.current = selected;
    play(selected ? "select" : "deselect");
  }, [selected]);
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);
  useEffect(() => sceneRef.current?.setHighlighted(previewed), [previewed, status]);

  const shown = layers.find((l) => l.id === (hovered ?? previewed ?? selected)) ?? null;
  const live = status === "ready";

  return (
    <figure ref={figureRef} className="relative grid grid-cols-1 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(150px,190px)] lg:gap-x-6">
      <div ref={stageRef} data-stage="" className="relative aspect-[1/1.05] w-full bg-ground sm:aspect-[5/4] lg:aspect-[4/3] lg:self-start">
        <div className={`absolute inset-0 transition-opacity duration-500 ${live || staticSection ? "opacity-0" : "opacity-100"}`}>{still}</div>
        {status === "static" && (
          <div className={`absolute inset-0 transition-opacity duration-500 ${staticSection ? "opacity-100" : "opacity-0"}`}>{sectionStill}</div>
        )}
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`absolute inset-0 h-full w-full touch-pan-y transition-opacity duration-500 ${live ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
        {rotated && live && (
          <button type="button" onClick={() => sceneRef.current?.resetView()} className="key key-secondary key-sm absolute right-0 top-0">
            Reset view
          </button>
        )}
      </div>

      {callouts && (
        // One pixel tall and overflow-visible: the paths carry absolute
        // coordinates, so the box itself never needs to match the stage.
        <svg
          ref={linesRef}
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 h-px w-full overflow-visible transition-opacity duration-500 ${live && !inside ? "opacity-100" : "opacity-0"}`}
        >
          {layers.map((l) => {
            const on = shown?.id === l.id || selected === l.id;
            return (
              <g key={l.id}>
                <path data-line={l.id} fill="none" stroke={on ? "var(--ink)" : "var(--line-2)"} strokeWidth={1} />
                <circle data-dot={l.id} r={on ? 3.5 : 2.5} fill={on ? "var(--ink)" : "var(--line-2)"} />
              </g>
            );
          })}
        </svg>
      )}

      <div className="lg:relative">
        <p className="mb-6 hidden text-[13px] leading-snug text-ink-3 lg:block">
          {live ? "Drag to turn the model. Select a layer for details." : "Select a layer for details."}
        </p>
        <ul
          ref={listRef}
          aria-label="Layers of the model"
          className={`flex flex-wrap gap-2 transition-opacity duration-300 lg:absolute lg:inset-0 lg:block ${inside ? "lg:pointer-events-none lg:opacity-0" : ""}`}
        >
          {layers.map((l, slot) => {
            const on = selected === l.id;
            const lit = shown?.id === l.id && !on;
            return (
              <li
                key={l.id}
                data-layer={l.id}
                className="lg:absolute lg:left-0 lg:right-0 lg:top-[var(--t)] lg:[transform:translateY(-50%)]"
                style={{ "--t": `${resting[slot].toFixed(2)}%` } as React.CSSProperties}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  data-lit={lit || undefined}
                  className="layer-btn"
                  onClick={() => setSelected(on ? null : l.id)}
                  // Only a real mouse previews. Touch browsers send an emulated
                  // hover on tap and no leave, which would pin the preview.
                  onPointerEnter={(e) => e.pointerType === "mouse" && setPreviewed(l.id)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && setPreviewed(null)}
                  onFocus={(e) => e.currentTarget.matches(":focus-visible") && setPreviewed(l.id)}
                  // Tabbing on into the caption keeps the preview, so its
                  // "Seen in" links stay mounted long enough to take focus.
                  onBlur={(e) => {
                    if (!captionRef.current?.contains(e.relatedTarget as Node | null)) setPreviewed(null);
                  }}
                >
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${
                      l.id === "model" ? "bg-model shadow-[inset_0_0_0_1px_var(--model-edge)]" : on ? "bg-[var(--key-text)] lg:bg-ground" : "bg-line-2"
                    }`}
                  />
                  <span className="flex min-w-0 flex-row items-baseline gap-1.5 lg:flex-col lg:items-start lg:gap-0">
                    <span>{l.name}</span>
                    {LEVEL[l.id] && <span className="text-[12px] font-normal text-ink-3">{LEVEL[l.id]}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <figcaption
        ref={captionRef}
        className="min-h-[7.5rem] border-t border-line pt-4 lg:col-span-2"
        aria-live="polite"
        // Focus leaving the figure from a caption link ends a keyboard preview.
        onBlur={(e) => {
          if (!figureRef.current?.contains(e.relatedTarget as Node | null)) setPreviewed(null);
        }}
      >
        {shown ? (
          <div>
            <p className="semi text-[17px] font-bold text-ink">
              {shown.name}
              {LEVEL[shown.id] && <span className="font-normal text-ink-3">, {LEVEL[shown.id]}</span>}
            </p>
            <p className="mt-1 max-w-[62ch] text-[15px] leading-[1.55] text-ink-2">{shown.summary}</p>
            <p className="mt-2 text-[14px] text-ink-3">
              Seen in{" "}
              {shown.seenIn.map((id, i) => (
                <span key={id}>
                  {i > 0 && (i === shown.seenIn.length - 1 ? " and " : ", ")}
                  <a href={`#${id}`} className="link text-ink-2">
                    {nameOf[id]}
                  </a>
                </span>
              ))}
              .
            </p>
          </div>
        ) : (
          <div>
            <p className="semi text-[17px] font-bold text-ink">The model is a component, not the architecture.</p>
            <p className="mt-1 max-w-[62ch] text-[15px] leading-[1.55] text-ink-2">
              Most of what I build has this shape. The yellow block is the model; everything around it decides what the
              model sees, checks what it says, and keeps a record.{" "}
              <span className="lg:hidden">
                {live ? (
                  <>
                    <span className="pointer-coarse:hidden">Drag to turn it, and select a layer to see where it shows up in my work.</span>
                    <span className="hidden pointer-coarse:inline">Swipe sideways to turn it, and tap a layer to see where it shows up in my work.</span>
                  </>
                ) : (
                  "Select a layer to see where it shows up in my work."
                )}
              </span>
            </p>
          </div>
        )}
      </figcaption>
    </figure>
  );
}
