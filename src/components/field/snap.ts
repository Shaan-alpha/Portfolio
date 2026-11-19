/** The film's scrolling, in the browser. Native CSS snap holds every scene
 *  flush to the top; a wheel gesture moves exactly one scene (the rule is in
 *  `wheel.ts`); touch, keyboard and the scrollbar use the snap alone; the
 *  reading part below scrolls natively. */
import { decideWheel } from "./wheel.ts";

/** Can the reader scroll freely inside a snap area taller than the screen?
 *  The reading part relies on it (CSS Scroll Snap: any position at which a
 *  large area covers the viewport is valid). A hidden box with a short and a
 *  tall snap child is scrolled into the tall one: a browser that supports
 *  this leaves the position alone. */
export function probeCoveringSnap(): Promise<boolean> {
  return new Promise((resolve) => {
    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    Object.assign(box.style, {
      position: "fixed",
      left: "-9999px",
      top: "0",
      width: "100px",
      height: "100px",
      overflow: "auto",
      scrollSnapType: "y mandatory",
      visibility: "hidden",
      pointerEvents: "none",
    });
    for (const h of ["100px", "1000px"]) {
      const child = document.createElement("div");
      Object.assign(child.style, { height: h, scrollSnapAlign: "start" });
      box.appendChild(child);
    }
    document.body.appendChild(box);
    box.scrollTop = 400;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const ok = Math.abs(box.scrollTop - 400) < 2;
        box.remove();
        resolve(ok);
      }),
    );
  });
}

const LINE_PX = 33;

/** Turn the film on: snap, and one scene per wheel gesture. Returns a
 *  teardown that puts the page back to ordinary scrolling. */
export function installFilm(o: { scenes: () => HTMLElement[]; reading: () => HTMLElement; reducedMotion: boolean }): () => void {
  const root = document.documentElement;
  root.dataset.snap = "";
  let lastAt = -Infinity;
  let moving = false;
  let timer = 0;
  const settle = () => {
    moving = false;
    window.clearTimeout(timer);
  };
  const top = (el: HTMLElement) => Math.round(el.getBoundingClientRect().top + window.scrollY);

  const onWheel = (e: WheelEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    // The case-study sheet and the open phone menu scroll themselves.
    const blocked = Boolean(target?.closest("dialog[open]")) || root.style.overflow === "hidden";
    const scale = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1;
    const decision = decideWheel(
      { deltaX: e.deltaX * scale, deltaY: e.deltaY * scale, ctrlKey: e.ctrlKey, timeStamp: e.timeStamp },
      { y: window.scrollY, stops: [...o.scenes().map(top), top(o.reading())], lastAt, moving, blocked },
    );
    if (decision.kind === "pass") return;
    e.preventDefault();
    lastAt = e.timeStamp;
    if (decision.kind !== "step") return;
    moving = true;
    window.clearTimeout(timer);
    // Where scrollend is missing, a step is over well within this.
    timer = window.setTimeout(settle, 900);
    window.scrollTo({ top: decision.to, behavior: o.reducedMotion ? "instant" : "smooth" });
  };
  const onScrollEnd = () => {
    if (moving) settle();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scrollend", onScrollEnd);
  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scrollend", onScrollEnd);
    window.clearTimeout(timer);
    delete root.dataset.snap;
  };
}
