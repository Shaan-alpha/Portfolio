"use client";

import { useEffect, useRef, useState } from "react";
import { flagship } from "@/content/projects";
import type { BuildingScene } from "./scene";

type Status = "loading" | "ready" | "static";

/** Acts III and IV beside the case studies on wide screens: the building
 *  with the current project's routes walked through it as its case study
 *  scrolls past, and the vault while the archive does. Built only at lg and
 *  up, and torn down below it; the pipeline tiles carry each route there.
 *  `still` (the section still) stands in without WebGL or with Save-Data. */
export default function RouteStage({ still }: { still: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BuildingScene | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    /** Show a route, and say which on the stage (data-route), so the page's
     *  state can be read from outside, by a test or by an inspector. */
    const show = (id: string | null, p: number) => {
      sceneRef.current?.setRoute(id, p);
      if (stageRef.current) stageRef.current.dataset.route = id ?? "";
    };
    const mq = window.matchMedia("(min-width: 64rem)");
    let teardown: (() => void) | null = null;

    const start = () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      if (nav.connection?.saveData || !gl) {
        setStatus("static");
        return () => {};
      }
      let disposed = false;
      let revert: (() => void) | null = null;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const detail = (nav.deviceMemory ?? 8) <= 4 ? "low" : "high";
      const flies = !reducedMotion;

      Promise.all([
        import("./scene"),
        import("./blueprint"),
        import("./routes"),
        flies ? import("gsap") : Promise.resolve(null),
        flies ? import("gsap/ScrollTrigger") : Promise.resolve(null),
      ])
        .then(([{ createBuildingScene }, { buildBlueprint }, { routesFor }, gsapModule, triggerModule]) => {
          if (disposed) return;
          const bp = buildBlueprint(detail);
          const routes = Object.fromEntries(flagship.map((p) => [p.id, routesFor(p.flows ?? [], bp)]));
          let scene: BuildingScene;
          try {
            scene = createBuildingScene({
              canvas,
              detail,
              reducedMotion,
              mode: "routes",
              routes,
              onReady: () => {
                if (!disposed) setStatus("ready");
              },
              onHover: () => {},
              onPick: () => {},
              onRotated: () => {},
              onAnchors: () => {},
              onLost: () => {
                sceneRef.current?.dispose();
                sceneRef.current = null;
                setStatus("static");
              },
            });
          } catch {
            setStatus("static");
            return;
          }
          sceneRef.current = scene;
          const targets = [...flagship.map((p) => p.id), "vault"]
            .map((id) => ({ id, el: document.getElementById(id === "vault" ? "also-shipped" : id) }))
            .filter((t): t is { id: string; el: HTMLElement } => !!t.el);

          if (!gsapModule || !triggerModule) {
            // Reduced motion: each case study's overview, changed behind a
            // short dip as it comes into view. No flight between stops.
            const io = new IntersectionObserver(
              (entries) => {
                for (const e of entries) {
                  if (!e.isIntersecting) continue;
                  const id = targets.find((t) => t.el === e.target)?.id ?? null;
                  canvas.style.opacity = "0";
                  window.setTimeout(() => {
                    show(id, 0);
                    canvas.style.opacity = "";
                  }, 150);
                }
              },
              { rootMargin: "-45% 0px -45% 0px" },
            );
            targets.forEach((t) => io.observe(t.el));
            revert = () => io.disconnect();
            return;
          }

          const { gsap } = gsapModule;
          const { ScrollTrigger } = triggerModule;
          gsap.registerPlugin(ScrollTrigger);
          // Which section the middle of the screen is in, straight from the
          // scroll position. Each section also scrubs a number for a smooth
          // camera, and a section's late, smoothed updates after the reader
          // has moved on are ignored, so a fast scroll never leaves a stale
          // route drawn.
          let current: string | null = null;
          const ctx = gsap.context(() => {
            for (const t of targets) {
              const walk = { p: 0 };
              gsap.to(walk, {
                p: 1,
                ease: "none",
                onUpdate: () => {
                  if (current === t.id) show(t.id, walk.p);
                },
                scrollTrigger: {
                  trigger: t.el,
                  start: "top center",
                  end: "bottom center",
                  scrub: 1,
                  onToggle: (self) => {
                    if (!self.isActive) return;
                    current = t.id;
                    show(t.id, walk.p);
                  },
                },
              });
            }
          });
          revert = () => ctx.revert();
          // The hero's pin may already exist; refresh sorts by priority, so
          // its height is counted in these triggers either way.
          ScrollTrigger.refresh();
        })
        .catch(() => setStatus("static"));

      return () => {
        disposed = true;
        revert?.();
        sceneRef.current?.dispose();
        sceneRef.current = null;
      };
    };

    const sync = () => {
      if (mq.matches && !teardown) teardown = start();
      else if (!mq.matches && teardown) {
        teardown();
        teardown = null;
        setStatus("loading");
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      teardown?.();
    };
  }, []);

  const live = status === "ready";
  return (
    <div ref={stageRef} className="relative aspect-[4/3] max-h-[46vh] w-full bg-ground">
      {status === "static" && <div className="absolute inset-0">{still}</div>}
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
