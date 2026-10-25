"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { layers, type LayerId } from "@/content/stack";
import { projects } from "@/content/projects";
import type { Anchor, StackScene } from "./scene";
import { AZIMUTH, CUBE, ELEVATION, MODEL_SLOT, PLATE_D, PLATE_H, PLATE_W, VIEW_H, basis, project, slotY, type Vec3 } from "./geometry";

const nameOf = Object.fromEntries(projects.map((p) => [p.id, p.name]));

/** Where each callout sits before the model has measured itself, as a
 *  percentage of the stage height. That is exact because the stage is never
 *  narrower than the drawing's aspect ratio on wide screens (see the stage's
 *  classes), so the drawing always scales to the stage height. The model's
 *  anchor is its right edge at mid-height, on the yellow face itself. */
function restingTop(slot: number) {
  const b = basis(AZIMUTH, ELEVATION);
  const y = slotY(slot);
  const pts: Vec3[] =
    slot === MODEL_SLOT
      ? [CUBE / 2, -CUBE / 2].flatMap((x) => [CUBE / 2, -CUBE / 2].map((z) => [x, y, z] as Vec3))
      : [PLATE_W / 2, -PLATE_W / 2].flatMap((x) => [PLATE_D / 2, -PLATE_D / 2].map((z) => [x, y + PLATE_H / 2, z] as Vec3));
  const best = pts.map((p) => project(p, b)).sort((a, c) => c[0] - a[0])[0];
  return 50 - (best[1] / VIEW_H) * 100;
}

type Status = "loading" | "ready" | "static";

export default function StackStage({ drawing }: { drawing: React.ReactNode }) {
  const figureRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);
  const captionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<StackScene | null>(null);
  const calloutsRef = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [selected, setSelected] = useState<LayerId | null>(null);
  const [hovered, setHovered] = useState<LayerId | null>(null);
  const [previewed, setPreviewed] = useState<LayerId | null>(null);
  const [rotated, setRotated] = useState(false);
  const [callouts, setCallouts] = useState(false);

  const resting = useMemo(() => layers.map((_, slot) => restingTop(slot)), []);

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

  // Load three.js only on the client and only when it can run. Save-Data and
  // a missing WebGL context both leave the drawing in place.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    // Probe for WebGL on a throwaway canvas first, so a device without it
    // never downloads three.js only to have the renderer throw.
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    if (nav.connection?.saveData || !gl) {
      setStatus("static");
      return;
    }
    let disposed = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const placeCallouts = (anchors: Anchor[]) => {
      const list = listRef.current;
      const lines = linesRef.current;
      const stage = stageRef.current;
      if (!list || !lines || !stage || !calloutsRef.current) return;
      const labelX = stage.offsetWidth + 24;
      // Keep labels at least 44px apart when the stack is turned steeply.
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

    import("./scene")
      .then(({ createStackScene }) => {
        if (disposed) return;
        try {
          sceneRef.current = createStackScene({
            canvas,
            layers: layers.map((l) => l.id),
            reducedMotion,
            onReady: () => {
              if (disposed) return;
              setStatus("ready");
              sceneRef.current?.playIntro();
            },
            onHover: setHovered,
            onPick: (id) => setSelected((cur) => (id === null || id === cur ? null : id)),
            onRotated: setRotated,
            onAnchors: placeCallouts,
            // A lost context (iOS drops them in the background) takes the
            // model down for good: dispose it so the hidden canvas stops
            // answering drags and clicks, and hand the labels back to the
            // drawing's resting positions.
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
        }
      })
      .catch(() => setStatus("static"));

    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current?.setSelected(selected), [selected, status]);
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);
  useEffect(() => sceneRef.current?.setHighlighted(previewed), [previewed, status]);

  // The stack turns and opens a little as the hero scrolls away. Motion tied
  // to scroll is skipped entirely under reduced motion.
  useEffect(() => {
    if (status !== "ready") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = stageRef.current?.closest("section");
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      sceneRef.current?.setScroll(-r.top / (r.height * 0.8));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [status]);

  const shown = layers.find((l) => l.id === (hovered ?? previewed ?? selected)) ?? null;
  const live = status === "ready";

  return (
    <figure ref={figureRef} className="relative grid grid-cols-1 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(150px,190px)] lg:gap-x-6">
      {/* On wide screens the stage keeps at least the drawing's own aspect
          ratio (VIEW_MIN_W : VIEW_H = 4.5 : 6.1): it is as tall as that ratio
          allows, up to the height cap, so the drawing and the camera always
          scale to its height and the callouts' resting percentages hold. */}
      <div
        ref={stageRef}
        className="relative aspect-[1/1.05] w-full sm:aspect-[5/4] lg:aspect-[4.5/6.1] lg:max-h-[min(70vh,680px)] lg:self-start"
      >
        <div className={`absolute inset-0 transition-opacity duration-500 ${live ? "opacity-0" : "opacity-100"}`} aria-hidden>
          {drawing}
        </div>
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`absolute inset-0 h-full w-full touch-pan-y transition-opacity duration-500 ${
            live ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        {rotated && live && (
          <button
            type="button"
            onClick={() => sceneRef.current?.resetView()}
            className="key key-secondary key-sm absolute right-0 top-0"
          >
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
          className={`pointer-events-none absolute left-0 top-0 h-px w-full overflow-visible transition-opacity duration-500 ${
            live ? "opacity-100" : "opacity-0"
          }`}
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
        <ul ref={listRef} aria-label="Layers of the model" className="flex flex-wrap gap-2 lg:absolute lg:inset-0 lg:block">
          {layers.map((l, slot) => {
            const on = selected === l.id;
            const lit = shown?.id === l.id && !on;
            return (
              // The resting position ships in the HTML as --t, so the
              // callouts sit beside their plates before hydration and without
              // JS. Once the model has measured itself, placeCallouts writes
              // inline top and transform, which override these classes.
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
                  // Only a real mouse previews. Touch browsers send an
                  // emulated hover on tap and no leave, which would pin the
                  // preview over the selection; a tap-focus is not
                  // :focus-visible, a Tab is.
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
                  {l.name}
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
            <p className="semi text-[17px] font-bold text-ink">{shown.name}</p>
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
              {/* Wide screens show this instruction beside the labels instead.
                  Only offer turning when there is a model that can turn. */}
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
