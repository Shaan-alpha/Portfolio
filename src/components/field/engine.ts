/** The dot field: one three.js `Points` draw call whose motion is computed
 *  entirely in the vertex shader. Each frame the CPU only sets uniforms. On a
 *  scene change it works out where every dot is (`snapshot`, the same maths
 *  as the shader) and starts the next morph from there, so nothing jumps.
 *  Nothing here reads the scroll position. */
import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  GLSL3,
  NormalBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OrthographicCamera,
  Points,
  RawShaderMaterial,
  Scene,
  SrcAlphaFactor,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";
import { AZIMUTH, ELEVATION, VIEW_H } from "../stack/geometry.ts";
import { IDENTITY_FRAME, TIMING, snapshot, stackFrame, type Carry, type Frame, type MorphState } from "./morph.ts";
import { lineAlpha, type Rect, type Targets } from "./targets.ts";
import { FRAGMENT, MAX_MASKS, VERTEX } from "./shaders.ts";
import { createLoop } from "./loop.ts";
import { fadeAlpha, pushPast, refade, tiltWanted } from "./polish.ts";

export { MAX_MASKS };

type RGB = [number, number, number];

export type FieldColors = { system: RGB; bright: RGB; dust: RGB; model: RGB; modelEdge: RGB; line: RGB; dark: boolean };

export type Field = {
  /** Morph to a new set of targets, which must hold exactly as many dots as
   *  the field. `quick` is a short move of the same shape (after a resize);
   *  `instant` places the dots with no morph at all (the first frame, on top
   *  of the drawing). */
  show(t: Targets, opts?: { quick?: boolean; instant?: boolean }): void;
  setStackBox(box: Rect): void;
  /** The first `MAX_MASKS` rects fade the dots inside them. No morph path
   *  crosses left of `textRight`, the text column's right edge (0: none). */
  setMask(rects: Rect[], textRight: number): void;
  setPointer(x: number, y: number, inside: boolean): void;
  highlight(group: number): void;
  setColors(c: FieldColors): void;
  setRunning(on: boolean): void;
  resize(w: number, h: number, dpr: number): void;
  dispose(): void;
};

const DRIFT_PX = 1.2;
/** A scene's behaviour starts this long after its morph, as its shape forms. */
const LOOP_LEAD = 0.7;
/** Reduced motion's scene change: out over this long, then back in. */
const FADE_HALF = 0.1;
const TURN_DEG_PER_S = 4;
const TILT_DEG = 8;
const SPRING = (2 * Math.PI) / 0.6; // a critically damped spring settling in about 0.6 s

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createField(o: { canvas: HTMLCanvasElement; count: number; reducedMotion: boolean; onLost: () => void }): Field {
  const n = o.count;
  const motion = !o.reducedMotion;
  const drift = motion ? DRIFT_PX : 0;
  const renderer = new WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: true, powerPreference: "default" });
  renderer.setClearColor(0x000000, 0);
  const t0 = performance.now();
  const clock = () => (performance.now() - t0) / 1000;

  // The CPU mirror of what the GPU draws.
  const st: MorphState = {
    n,
    from: new Float32Array(3 * n),
    mid: new Float32Array(3 * n),
    to: new Float32Array(3 * n),
    delay: new Float32Array(n),
    seed: Float32Array.from({ length: n }, Math.random),
    flow: new Float32Array(4 * n),
    loop: new Float32Array(4 * n),
    wander: new Float32Array(n).fill(1),
    start: -1e3,
    duration: 0,
    stagger: 0,
  };
  // Each dot's target kind, which the CPU mirror reads for the dot's look.
  const kindTo = new Float32Array(n);
  st.kind = kindTo;
  const group = new Float32Array(n).fill(-1);
  const visFrom = new Float32Array(n).fill(1);
  // A scene change's snapshot and what it carries, allocated once: how much
  // of each dot shows, its look (weights of its kinds) and its tints.
  const snap = new Float32Array(3 * n);
  const lookFrom = new Float32Array(4 * n);
  for (let i = 0; i < n; i++) lookFrom[4 * i] = 1;
  const tintFrom = new Float32Array(2 * n);
  const carry: Carry = { visFrom, progress: new Float32Array(n), look: lookFrom, tint: tintFrom };
  let targetFrame: Targets["frame"] = "screen";

  // The scene's loop clock: its behaviour runs from `loopStart`; with reduced
  // motion it stands still on the scene's chosen frame.
  let loopStart = 0;
  let still = 0;
  const loopClock = (now: number) => (motion ? now - loopStart : still);

  const geometry = new BufferGeometry();
  const attr = (name: string, array: Float32Array, size: number) => {
    const a = new BufferAttribute(array, size);
    geometry.setAttribute(name, a);
    return a;
  };
  const aFrom = attr("position", st.from, 3);
  const aMid = attr("aMid", st.mid, 3);
  const aTo = attr("aTo", st.to, 3);
  const aDelay = attr("aDelay", st.delay, 1);
  attr("aSeed", st.seed, 1);
  const aFlow = attr("aFlow", st.flow, 4);
  const aLoop = attr("aLoop", st.loop, 4);
  const aWander = attr("aWander", st.wander, 1);
  const aVisFrom = attr("aVisFrom", visFrom, 1);
  const aLookFrom = attr("aLookFrom", lookFrom, 4);
  const aTintFrom = attr("aTintFrom", tintFrom, 2);
  const aKindTo = attr("aKindTo", kindTo, 1);
  const aGroup = attr("aGroup", group, 1);

  const u = {
    uNow: { value: 0 },
    uStart: { value: st.start },
    uDuration: { value: 0 },
    uStagger: { value: 0 },
    uLoopClock: { value: 0 },
    uDrift: { value: drift },
    uRow0: { value: new Vector3(1, 0, 0) },
    uRow1: { value: new Vector3(0, 1, 0) },
    uRow2: { value: new Vector3(0, 0, 1) },
    uFrameT: { value: new Vector3() },
    uFrameS: { value: 1 },
    uDepthScale: { value: 1 },
    uViewport: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uMask: { value: Array.from({ length: MAX_MASKS }, () => new Vector4()) },
    uMaskCount: { value: 0 },
    uPointer: { value: new Vector2(-1e4, -1e4) },
    uPointerAmt: { value: 0 },
    uHighlight: { value: -1 },
    uHighlightAmt: { value: 0 },
    uSystem: { value: new Vector3() },
    uBright: { value: new Vector3() },
    uDust: { value: new Vector3() },
    uModel: { value: new Vector3() },
    uModelEdge: { value: new Vector3() },
    uLine: { value: new Vector3() },
    uDustAlpha: { value: 0.25 },
    uLineAlpha: { value: 0.1 },
    uFade: { value: 1 },
    uLight: { value: 1 },
  };
  const material = new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: u,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const scene = new Scene();
  scene.add(points);
  const camera = new OrthographicCamera();

  let w = 1;
  let h = 1;
  let dark = false;
  let center: [number, number] = [0, 0];
  let scale = 1;
  let az = AZIMUTH;
  let turnFrom = Infinity;
  const tilt = [0, 0];
  const tiltVel = [0, 0];
  const pointer = { x: -1e4, y: -1e4, inside: false };
  let highlightGroup = -1;
  let textRight = 0;

  const COLOR_KEYS = ["system", "bright", "dust", "model", "modelEdge", "line"] as const;
  const colorsNow = { system: [0, 0, 0], bright: [0, 0, 0], dust: [0, 0, 0], model: [0, 0, 0], modelEdge: [0, 0, 0], line: [0, 0, 0] };
  let colorsFrom = structuredClone(colorsNow);
  let colorsTo = structuredClone(colorsNow);
  let colorStart = -1e3;
  let haveColors = false;

  const frameNow = (): Frame =>
    targetFrame === "stack" ? stackFrame(az, ELEVATION, [tilt[0], tilt[1]], center, scale) : IDENTITY_FRAME;

  const loop = createLoop({
    raf: (cb) => requestAnimationFrame(cb),
    caf: (id) => cancelAnimationFrame(id),
    hidden: () => document.hidden,
    clock,
    motion,
    frame: (now, dt) => {
      // A held scene is placed as the fade-out ends.
      if (pending && now >= fadeStart + FADE_HALF) {
        const t = pending;
        pending = null;
        apply(t, {}, true);
      }
      update(now, dt);
      renderer.render(scene, camera);
    },
  });
  let disposed = false;
  // A disposed field ignores late calls (a timer or an observer that fires
  // after the page has moved on).
  const wake = () => {
    if (!disposed) loop.wake();
  };

  function update(now: number, dt: number) {
    if (motion && targetFrame === "stack") az += TURN_DEG_PER_S * smoothstep(turnFrom, turnFrom + 1.5, now) * dt;
    // The pointer tilts the stack on a spring, once it has started to turn,
    // and parts nearby dots.
    const want = tiltWanted({ motion, inside: pointer.inside, stack: targetFrame === "stack", x: pointer.x, y: pointer.y, w, h, now, turnFrom, tiltDeg: TILT_DEG });
    for (let k = 0; k < 2; k++) {
      tiltVel[k] += (SPRING * SPRING * (want[k] - tilt[k]) - 2 * SPRING * tiltVel[k]) * dt;
      tilt[k] += tiltVel[k] * dt;
    }
    const ease = (v: number, target: number, rate: number) => v + (target - v) * Math.min(1, dt * rate);
    u.uPointerAmt.value = ease(u.uPointerAmt.value, motion && pointer.inside ? 1 : 0, 4);
    u.uPointer.value.set(pointer.x, pointer.y);
    u.uHighlightAmt.value = dt ? ease(u.uHighlightAmt.value, highlightGroup >= 0 ? 1 : 0, 6) : highlightGroup >= 0 ? 1 : 0;
    if (highlightGroup >= 0) u.uHighlight.value = highlightGroup;

    const c = haveColors ? smoothstep(colorStart, colorStart + 0.4, now) : 1;
    for (const key of COLOR_KEYS) {
      const a = colorsFrom[key];
      const b = colorsTo[key];
      for (let k = 0; k < 3; k++) colorsNow[key][k] = a[k] + (b[k] - a[k]) * c;
    }
    u.uSystem.value.fromArray(colorsNow.system);
    u.uBright.value.fromArray(colorsNow.bright);
    u.uDust.value.fromArray(colorsNow.dust);
    u.uModel.value.fromArray(colorsNow.model);
    u.uModelEdge.value.fromArray(colorsNow.modelEdge);
    u.uLine.value.fromArray(colorsNow.line);

    const f = frameNow();
    u.uRow0.value.set(f.m[0], f.m[1], f.m[2]);
    u.uRow1.value.set(f.m[3], f.m[4], f.m[5]);
    u.uRow2.value.set(f.m[6], f.m[7], f.m[8]);
    u.uFrameT.value.set(f.t[0], f.t[1], f.t[2]);
    u.uFrameS.value = f.s;
    // Depth sizes the stack's dots in every frame, so leaving the stack never
    // snaps their size; never zero, so a flat scene's depth of 0 stays 0.
    u.uDepthScale.value = Math.max(scale, 1e-3);
    u.uNow.value = now;
    u.uLoopClock.value = loopClock(now);
    u.uFade.value = fadeAlpha(now, fadeStart, FADE_HALF);
  }

  const onVisibility = () => {
    if (!document.hidden) wake();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const onLost = (e: Event) => {
    e.preventDefault();
    o.onLost();
  };
  o.canvas.addEventListener("webglcontextlost", onLost);

  // A scene held for reduced motion's fade, and when that fade began.
  let pending: Targets | null = null;
  let fadeStart = -1e3;

  /** Morph to `t` from wherever every dot is now. */
  function apply(t: Targets, opts: { quick?: boolean; instant?: boolean }, fromFrame = false) {
    const now = clock();
    const clk = loopClock(now);
    // Where every dot is right now, drift included, and how it looks, in
    // the frame and the programs it is leaving: one pass. Then the new
    // targets' kinds.
    const base = snapshot(st, now, frameNow(), clk, drift, snap, carry);
    for (let i = 0; i < n; i++) {
      kindTo[i] = t.kind[i];
      group[i] = t.group[i];
    }
    const wasStack = targetFrame === "stack";
    st.from.set(base);
    st.to.set(t.to);
    st.delay.set(t.delay);
    st.flow.set(t.flow);
    st.loop.set(t.loop);
    st.wander.set(t.wander);
    targetFrame = t.frame;
    if (t.frame === "stack" && !wasStack) turnFrom = now + (opts.instant ? 0.35 : TIMING.shape);
    // A new scene's behaviour starts as its shape forms; a resize keeps it.
    if (opts.instant) loopStart = now;
    else if (!opts.quick) loopStart = now + LOOP_LEAD;
    still = t.still;

    // A dot leaves for its target through a scattered midpoint, never
    // through the text column, so the morph reads as dissolve-then-form.
    // (No allocation per dot: this runs for every dot on a scene change.)
    const f = frameNow();
    const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = f.m;
    const [t0x, t0y, t0z] = f.t;
    const fs = f.s;
    const scatter = (opts.quick || opts.instant ? 0 : 1) * Math.min(w, h);
    const push = scatter && w >= 1024 ? textRight + 24 : -Infinity;
    const spread = Math.min(240, Math.max(0, w - push));
    for (let i = 0; i < n; i++) {
      const j = 3 * i;
      const lx = st.to[j];
      const ly = st.to[j + 1];
      const lz = st.to[j + 2];
      const tx = t0x + fs * (m0 * lx + m1 * ly + m2 * lz);
      const ty = t0y + fs * (m3 * lx + m4 * ly + m5 * lz);
      const tz = t0z + fs * (m6 * lx + m7 * ly + m8 * lz);
      const a = Math.random() * Math.PI * 2;
      const r = scatter * (0.06 + Math.random() * 0.06);
      let mx = (st.from[j] + tx) / 2 + Math.cos(a) * r;
      if (mx < push) mx = pushPast(mx, push, spread);
      st.mid[j] = mx;
      st.mid[j + 1] = (st.from[j + 1] + ty) / 2 + Math.sin(a) * r;
      st.mid[j + 2] = (st.from[j + 2] + tz) / 2;
    }

    if (opts.instant || !motion) {
      st.start = now - 1e3;
      st.duration = 0;
      st.stagger = 0;
    } else if (opts.quick) {
      st.start = now;
      st.stagger = 0.1;
      st.duration = TIMING.move - 0.1;
    } else {
      st.start = now;
      st.stagger = TIMING.stagger;
      st.duration = TIMING.shape - TIMING.stagger;
    }
    u.uStart.value = st.start;
    u.uDuration.value = st.duration;
    u.uStagger.value = st.stagger;
    for (const a of [aFrom, aMid, aTo, aDelay, aFlow, aLoop, aWander, aVisFrom, aLookFrom, aTintFrom, aKindTo, aGroup]) a.needsUpdate = true;
    // Inside a frame there is no need to ask for another.
    if (!fromFrame) wake();
  }

  return {
    show(t, opts = {}) {
      if (t.n !== n) throw new Error(`field: targets for ${t.n} dots, but the field draws ${n}`);
      // With reduced motion a scene change is a 200 ms fade: the field fades
      // out, the new scene is placed (frame callback), and it fades back in.
      // A second change mid-fade carries on from the level showing now.
      if (!motion && !opts.instant && !opts.quick) {
        const now = clock();
        fadeStart = now < fadeStart + 2 * FADE_HALF ? refade(now, fadeStart, FADE_HALF) : now;
        pending = t;
        if (!disposed) loop.runFor(fadeStart + 2 * FADE_HALF - now);
        return;
      }
      pending = null;
      apply(t, opts);
    },
    setStackBox(box) {
      center = [box.x + box.w / 2, box.y + box.h / 2];
      scale = box.h / VIEW_H;
      wake();
    },
    setMask(rects, right) {
      const list = rects.slice(0, MAX_MASKS);
      list.forEach((r, k) => u.uMask.value[k].set(r.x, r.y, r.w, r.h));
      u.uMaskCount.value = list.length;
      textRight = right;
      wake();
    },
    setPointer(x, y, inside) {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
    },
    highlight(g) {
      highlightGroup = g;
      wake();
    },
    setColors(c) {
      colorsFrom = structuredClone(colorsNow);
      colorsTo = { system: c.system, bright: c.bright, dust: c.dust, model: c.model, modelEdge: c.modelEdge, line: c.line };
      if (!haveColors) colorsFrom = structuredClone(colorsTo);
      haveColors = true;
      // With reduced motion only single frames are drawn, so switch at once.
      colorStart = motion ? clock() : -1e3;
      dark = c.dark;
      u.uDustAlpha.value = c.dark ? 0.28 : 0.22;
      u.uLineAlpha.value = lineAlpha(n, w, c.dark);
      u.uLight.value = c.dark ? 0 : 1;
      if (c.dark) {
        // Dense clusters glow on a dark ground.
        material.blending = CustomBlending;
        material.blendSrc = SrcAlphaFactor;
        material.blendDst = OneFactor;
        material.blendSrcAlpha = OneFactor;
        material.blendDstAlpha = OneMinusSrcAlphaFactor;
      } else {
        material.blending = NormalBlending;
      }
      material.needsUpdate = true;
      wake();
    },
    setRunning(on) {
      if (!disposed) loop.setRunning(on);
    },
    resize(width, height, dpr) {
      w = Math.max(1, width);
      h = Math.max(1, height);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      u.uViewport.value.set(w, h);
      u.uDpr.value = dpr;
      u.uLineAlpha.value = lineAlpha(n, w, dark);
      wake();
    },
    dispose() {
      disposed = true;
      loop.cancel();
      document.removeEventListener("visibilitychange", onVisibility);
      o.canvas.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
