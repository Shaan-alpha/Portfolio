"use client";

import { useEffect, useRef } from "react";
import { installFilm, probeCoveringSnap } from "@/components/field/snap";
import { readColors, readScene, viewportOf } from "@/components/field/dom";
import { createSequence } from "@/components/film/sequence";
import { flowTargets, lineTargets, rng, stackTargets, type Rect, type Targets } from "@/components/field/targets";
import { BEHAVIOURS } from "@/components/field/behaviours";
import { holder } from "@/components/film/holder";
import { resizeNeeds } from "@/components/field/polish";
import type { Field } from "@/components/field/engine";

type Nav = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

/** How many dots this device draws. */
function dotCount(): number {
  const nav = navigator as Nav;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if ((nav.deviceMemory ?? 8) <= 4) return 6000;
  if (w < 768) return 8000;
  if (window.matchMedia("(pointer: coarse)").matches && Math.min(w, h) >= 600) return 12000;
  return 16000;
}

function hasWebGL2(): boolean {
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return Boolean(gl);
}

/** After the page has loaded and the browser has a moment. */
function idle(): Promise<void> {
  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise<void>((r) => window.addEventListener("load", () => r(), { once: true }));
  return loaded.then(
    () =>
      new Promise<void>((r) => {
        const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
        if (w.requestIdleCallback) w.requestIdleCallback(() => r(), { timeout: 800 });
        else window.setTimeout(r, 200);
      }),
  );
}

/** The film: full-screen scenes, the dot field behind them, and the
 *  one-scene-per-gesture scroll. Without JavaScript, or in a browser that
 *  fails the snap test, the scenes are simply sections of an ordinary page
 *  and the hero keeps its drawing. */
export default function Film({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reading = document.getElementById("reading");
    const canvas = canvasRef.current;
    if (!reading || !canvas) return;
    const view: HTMLCanvasElement = canvas;
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    // `data-film` is on while the film holds the screen, that is until the
    // reading part reaches the top of the viewport (a 1% band at the top).
    const filmIo = new IntersectionObserver(
      ([entry]) => {
        // `data-read` is its opposite, set only once the reading part holds
        // the screen: the header's hairline shows then, and not before the
        // film has had a say (so it never flashes in at load).
        if (entry.isIntersecting) {
          delete root.dataset.film;
          root.dataset.read = "";
        } else if (entry.boundingClientRect.top > 0) {
          root.dataset.film = "";
          delete root.dataset.read;
        }
      },
      { rootMargin: "0px 0px -99% 0px" },
    );
    filmIo.observe(reading);
    cleanups.push(() => filmIo.disconnect());

    const scenes = [...document.querySelectorAll<HTMLElement>("[data-scene]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Anything that fails on the way to the field (the probe, the engine's
    // download) leaves the page as it is: scenes, snap if it is on, and the
    // hero's drawing.
    probeCoveringSnap().then(async (snapOk) => {
      if (cancelled || !snapOk) return;
      cleanups.push(installFilm({ scenes: () => scenes, reading: () => reading, reducedMotion }));

      // The field: only with snap (a fixed canvas can only stay on its scene
      // when the scene rests flush with the screen), WebGL 2 and no Save-Data.
      if ((navigator as Nav).connection?.saveData || !hasWebGL2()) return;
      await idle();
      if (cancelled) return;
      let createField: typeof import("@/components/field/engine").createField;
      try {
        ({ createField } = await import("@/components/field/engine"));
      } catch {
        return;
      }
      if (cancelled) return;

      const stackBox = scenes.find((s) => s.dataset.scene === "hero")?.querySelector<HTMLElement>("[data-stack-box]") ?? null;
      // Fixed for the field's life: the engine's buffers and every scene's
      // targets must hold the same number of dots.
      const count = dotCount();
      let field: Field;
      let stopped = false;
      try {
        field = createField({ canvas, count, reducedMotion, onLost: () => stop() });
      } catch {
        return;
      }

      // Every scene's targets, from its own layout.
      let targets = new Map<string, { t: Targets; mask: Rect[]; textRight: number }>();
      let line: Targets | null = null;
      const build = () => {
        // After a lost context there is no field to build for.
        if (stopped) return;
        // The canvas's own box: with a classic scrollbar the window is wider.
        const { w: vw, h: vh } = viewportOf(view);
        field.resize(vw, vh, Math.min(window.devicePixelRatio || 1, 2));
        const next = new Map<string, { t: Targets; mask: Rect[]; textRight: number }>();
        scenes.forEach((s, k) => {
          const layout = readScene(s);
          const name = s.dataset.scene ?? String(k);
          if (layout.stackBox) {
            field.setStackBox(layout.stackBox);
            next.set(name, { t: stackTargets(count, rng(1)), mask: layout.mask, textRight: layout.textRight });
          } else {
            // A scene taller than the screen is scrolled through, and a fixed
            // field cannot follow it: its steps show as tiles, over dust.
            const tall = s.offsetHeight > vh + 1;
            s.toggleAttribute("data-tiles", tall);
            const t = flowTargets(count, tall ? [] : layout.flows, { w: vw, h: vh }, layout.mask, rng(2 + k), BEHAVIOURS[name]);
            next.set(name, { t, mask: layout.mask, textRight: layout.textRight });
          }
        });
        targets = next;
        // The handoff's hairline sits just under the header, where the
        // header's own hairline appears once the reading part holds the
        // screen. The dots come from the last scene, so each keeps its place
        // across the screen and drops straight onto the line.
        const header = document.querySelector("header");
        const last = next.get(scenes[scenes.length - 1]?.dataset.scene ?? "");
        line = lineTargets(count, (header?.getBoundingClientRect().bottom ?? 64) + 0.5, vw, last?.t.frame === "screen" ? last.t.to : undefined);
      };
      build();
      field.setColors(readColors());

      let active: string | null = null;
      let thesisPlayed = false;
      // Once, on the thesis: the three phrases light their parts in turn.
      const sequence = createSequence({
        groups: [1, 3, 4],
        startMs: 1500,
        stepMs: 500,
        highlight: (g) => {
          if (!stopped) field.highlight(g);
        },
        schedule: (fn, ms) => window.setTimeout(fn, ms),
        cancel: (id) => window.clearTimeout(id),
      });
      cleanups.push(() => sequence.stop());
      const visible = (on: boolean) => {
        canvas.style.opacity = on ? "1" : "0";
        field.setRunning(on);
      };
      let fadeTimer = 0;
      const cancelFade = () => {
        window.clearTimeout(fadeTimer);
        fadeTimer = 0;
      };
      const activate = (name: string | null, opts: { quick?: boolean; instant?: boolean } = {}) => {
        if (stopped) return;
        if (name === active && !opts.quick && !opts.instant) {
          if (name) visible(true);
          return;
        }
        if (name !== active) {
          // A new scene: nothing lit carries over from the last one.
          sequence.stop();
          field.highlight(-1);
        }
        active = name;
        cancelFade();
        const scene = name ? targets.get(name) : undefined;
        if (!scene) {
          // The reading part: the dots settle into one hairline under the
          // header, the line the reading starts from, and then the canvas
          // fades and stops. While the line forms the canvas sits above the
          // reading part, which would otherwise slide over it; the line lies
          // in the reading part's empty top padding.
          const showing = canvas.style.opacity === "1";
          if (line) {
            field.setMask([], 0);
            field.show(line, { quick: true });
          }
          if (!showing) {
            visible(false);
            return;
          }
          canvas.style.zIndex = "2";
          fadeTimer = window.setTimeout(() => {
            visible(false);
            fadeTimer = window.setTimeout(() => (canvas.style.zIndex = ""), 320);
          }, 650);
          return;
        }
        canvas.style.zIndex = "";
        field.setMask(scene.mask, scene.textRight);
        field.show(scene.t, opts);
        visible(true);
        if (name === "thesis" && !thesisPlayed && !reducedMotion) {
          thesisPlayed = true;
          sequence.start();
        }
      };

      // The seamless load: the dots appear exactly on the drawing, the
      // drawing steps back, and only then does the stack start to turn.
      // The scene observer then only reveals it if the hero is on screen, and
      // morphs from it if the page opened further down.
      const hero = targets.get("hero");
      if (hero) {
        field.setMask(hero.mask, hero.textRight);
        field.show(hero.t, { instant: true });
        active = "hero";
      }
      stackBox?.setAttribute("data-live", "");
      // The markers' tiles step back too: the dots draw the steps now.
      root.dataset.field = "";

      // Which part of the page the field draws for (`holder.ts`): the scene
      // crossing the band across the middle of the screen, or the reading
      // part as soon as its top comes up past 88% of the screen, so the line
      // forms while the reader still sees it. One decision from both
      // observers, so they can never pull the field two ways.
      const sections = [...scenes, reading];
      const nameOf = (s: Element) => (s === reading ? "reading" : ((s as HTMLElement).dataset.scene ?? ""));
      const order = sections.map(nameOf);
      const inBand = new Set<string>();
      let readingUp = false;
      const decide = () => {
        const next = holder(order, inBand, readingUp);
        if (next !== undefined) activate(next);
      };
      const sceneIo = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) inBand.add(nameOf(e.target));
            else inBand.delete(nameOf(e.target));
          }
          decide();
        },
        { rootMargin: "-38% 0px -58% 0px" },
      );
      sections.forEach((s) => sceneIo.observe(s));
      cleanups.push(() => sceneIo.disconnect());
      const leaving = new IntersectionObserver(
        ([e]) => {
          if (!e) return;
          readingUp = e.isIntersecting;
          decide();
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      leaving.observe(reading);
      cleanups.push(() => leaving.disconnect());

      const onPointer = (e: PointerEvent) => field.setPointer(e.clientX, e.clientY, e.pointerType === "mouse");
      const onLeave = () => field.setPointer(-1e4, -1e4, false);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      });

      const phrases = [...document.querySelectorAll<HTMLElement>("[data-phrase]")];
      const lit = (e: Event) => field.highlight(Number((e.currentTarget as HTMLElement).dataset.group ?? -1));
      const unlit = () => field.highlight(-1);
      phrases.forEach((p) => {
        p.addEventListener("pointerenter", lit);
        p.addEventListener("pointerleave", unlit);
      });
      cleanups.push(() =>
        phrases.forEach((p) => {
          p.removeEventListener("pointerenter", lit);
          p.removeEventListener("pointerleave", unlit);
        }),
      );

      const themeMo = new MutationObserver(() => field.setColors(readColors()));
      themeMo.observe(root, { attributes: true, attributeFilter: ["class"] });
      cleanups.push(() => themeMo.disconnect());

      // A phone's URL bar changes the window's height but not 100svh: the
      // scenes keep their layout, so only the canvas follows. Anything else
      // moves the markers, and every scene's targets are rebuilt.
      const sizeNow = () => ({ ...viewportOf(view), sceneH: scenes[0]?.offsetHeight ?? 0 });
      let size = sizeNow();
      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          const next = sizeNow();
          const need = resizeNeeds(size, next);
          size = next;
          if (need === "rebuild") {
            build();
            if (active) activate(active, { quick: true });
          } else if (need === "canvas" && !stopped) field.resize(next.w, next.h, Math.min(window.devicePixelRatio || 1, 2));
        }, 150);
      };
      window.addEventListener("resize", onResize);
      cleanups.push(() => {
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
      });

      // A lost context, or leaving the page: the drawing comes back.
      function stop() {
        if (stopped) return;
        stopped = true;
        cancelFade();
        view.style.opacity = "0";
        view.style.zIndex = "";
        stackBox?.removeAttribute("data-live");
        delete root.dataset.field;
        field.dispose();
      }
      cleanups.push(stop);
    }).catch(() => {});

    return () => {
      cancelled = true;
      cleanups.reverse().forEach((c) => c());
      delete root.dataset.film;
      delete root.dataset.read;
    };
  }, []);

  return (
    <div data-film-root>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-300"
      />
      {children}
    </div>
  );
}
