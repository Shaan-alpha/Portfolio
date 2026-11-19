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
import { IDENTITY_FRAME, TIMING, dotProgress, snapshot, stackFrame, type Frame, type MorphState } from "./morph.ts";
import type { Rect, Targets } from "./targets.ts";
import { FRAGMENT, VERTEX } from "./shaders.ts";

type RGB = [number, number, number];

export type FieldColors = { system: RGB; bright: RGB; dust: RGB; model: RGB; modelEdge: RGB; dark: boolean };

export type Field = {
  /** Morph to a new set of targets. `quick` is a short move of the same
   *  shape (after a resize); `instant` places the dots with no morph at all
   *  (the first frame, on top of the drawing). */
  show(t: Targets, opts?: { quick?: boolean; instant?: boolean }): void;
  setStackBox(box: Rect): void;
  setMask(rects: Rect[]): void;
  setPointer(x: number, y: number, inside: boolean): void;
  highlight(group: number): void;
  setColors(c: FieldColors): void;
  setRunning(on: boolean): void;
  resize(w: number, h: number, dpr: number): void;
  dispose(): void;
};

const FLOW_SPEED = 0.25; // edge lengths per second
const DRIFT_PX = 1.2;
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
  const renderer = new WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
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
    start: -1e3,
    duration: 0,
    stagger: 0,
  };
  const kindFrom = new Float32Array(n);
  const kindTo = new Float32Array(n);
  const group = new Float32Array(n).fill(-1);
  let targetFrame: Targets["frame"] = "screen";

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
  const aKindFrom = attr("aKindFrom", kindFrom, 1);
  const aKindTo = attr("aKindTo", kindTo, 1);
  const aGroup = attr("aGroup", group, 1);

  const u = {
    uNow: { value: 0 },
    uStart: { value: st.start },
    uDuration: { value: 0 },
    uStagger: { value: 0 },
    uFlowSpeed: { value: motion ? FLOW_SPEED : 0 },
    uDrift: { value: motion ? DRIFT_PX : 0 },
    uRow0: { value: new Vector3(1, 0, 0) },
    uRow1: { value: new Vector3(0, 1, 0) },
    uRow2: { value: new Vector3(0, 0, 1) },
    uFrameT: { value: new Vector3() },
    uFrameS: { value: 1 },
    uStack: { value: 0 },
    uViewport: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uMask: { value: [new Vector4(), new Vector4(), new Vector4(), new Vector4()] },
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
    uDustAlpha: { value: 0.25 },
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
  let center: [number, number] = [0, 0];
  let scale = 1;
  let az = AZIMUTH;
  let turnFrom = Infinity;
  const tilt = [0, 0];
  const tiltVel = [0, 0];
  const pointer = { x: -1e4, y: -1e4, inside: false };
  let highlightGroup = -1;
  let textRight = 0;

  const colorsNow = { system: [0, 0, 0], bright: [0, 0, 0], dust: [0, 0, 0], model: [0, 0, 0], modelEdge: [0, 0, 0] };
  let colorsFrom = structuredClone(colorsNow);
  let colorsTo = structuredClone(colorsNow);
  let colorStart = -1e3;
  let haveColors = false;

  const frameNow = (): Frame =>
    targetFrame === "stack" ? stackFrame(az, ELEVATION, [tilt[0], tilt[1]], center, scale) : IDENTITY_FRAME;

  let raf = 0;
  let running = false;
  let lastTick = 0;
  const render = () => renderer.render(scene, camera);
  const wake = () => {
    if (raf || document.hidden) return;
    if (running && motion) {
      lastTick = clock();
      raf = requestAnimationFrame(tick);
    } else {
      // Reduced motion, or stopped: draw the new state once.
      raf = requestAnimationFrame(() => {
        raf = 0;
        update(clock(), 0);
        render();
      });
    }
  };

  function update(now: number, dt: number) {
    if (motion && targetFrame === "stack") az += TURN_DEG_PER_S * smoothstep(turnFrom, turnFrom + 1.5, now) * dt;
    // The pointer tilts the stack on a spring, and parts nearby dots.
    const want =
      motion && pointer.inside && targetFrame === "stack"
        ? [(0.5 - pointer.y / h) * TILT_DEG, (pointer.x / w - 0.5) * TILT_DEG]
        : [0, 0];
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
    for (const key of ["system", "bright", "dust", "model", "modelEdge"] as const) {
      const a = colorsFrom[key];
      const b = colorsTo[key];
      for (let k = 0; k < 3; k++) colorsNow[key][k] = a[k] + (b[k] - a[k]) * c;
    }
    u.uSystem.value.fromArray(colorsNow.system);
    u.uBright.value.fromArray(colorsNow.bright);
    u.uDust.value.fromArray(colorsNow.dust);
    u.uModel.value.fromArray(colorsNow.model);
    u.uModelEdge.value.fromArray(colorsNow.modelEdge);

    const f = frameNow();
    u.uRow0.value.set(f.m[0], f.m[1], f.m[2]);
    u.uRow1.value.set(f.m[3], f.m[4], f.m[5]);
    u.uRow2.value.set(f.m[6], f.m[7], f.m[8]);
    u.uFrameT.value.set(f.t[0], f.t[1], f.t[2]);
    u.uFrameS.value = f.s;
    u.uStack.value = targetFrame === "stack" ? 1 : 0;
    u.uNow.value = now;
  }

  function tick() {
    raf = 0;
    if (!running || document.hidden) return;
    const now = clock();
    const dt = Math.min(0.05, Math.max(0, now - lastTick));
    lastTick = now;
    update(now, dt);
    render();
    raf = requestAnimationFrame(tick);
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

  return {
    show(t, opts = {}) {
      const now = clock();
      // Where every dot is right now, in the frame it is heading for now.
      const base = snapshot(st, now, frameNow(), u.uFlowSpeed.value);
      for (let i = 0; i < n; i++) {
        const p = dotProgress(now, st.start, st.delay[i], st.duration, st.stagger);
        kindFrom[i] = p >= 0.5 ? kindTo[i] : kindFrom[i];
        kindTo[i] = t.kind[i];
        group[i] = t.group[i];
      }
      const wasStack = targetFrame === "stack";
      st.from.set(base);
      st.to.set(t.to);
      st.delay.set(t.delay);
      st.flow.set(t.flow);
      targetFrame = t.frame;
      if (t.frame === "stack" && !wasStack) turnFrom = now + (opts.instant ? 0.35 : TIMING.shape);

      // A dot leaves for its target through a scattered midpoint, never
      // through the text column, so the morph reads as dissolve-then-form.
      const f = frameNow();
      const scatter = (opts.quick || opts.instant ? 0 : 1) * Math.min(w, h);
      for (let i = 0; i < n; i++) {
        const j = 3 * i;
        const [lx, ly, lz] = [st.to[j], st.to[j + 1], st.to[j + 2]];
        const tx = f.t[0] + f.s * (f.m[0] * lx + f.m[1] * ly + f.m[2] * lz);
        const ty = f.t[1] + f.s * (f.m[3] * lx + f.m[4] * ly + f.m[5] * lz);
        const a = Math.random() * Math.PI * 2;
        const r = scatter * (0.06 + Math.random() * 0.06);
        let mx = (st.from[j] + tx) / 2 + Math.cos(a) * r;
        const my = (st.from[j + 1] + ty) / 2 + Math.sin(a) * r;
        if (scatter && w >= 1024 && mx < textRight + 24) mx = textRight + 24 + Math.random() * 60;
        st.mid[j] = mx;
        st.mid[j + 1] = my;
        st.mid[j + 2] = (st.from[j + 2] + (f.t[2] + f.s * (f.m[6] * lx + f.m[7] * ly + f.m[8] * lz))) / 2;
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
      for (const a of [aFrom, aMid, aTo, aDelay, aFlow, aKindFrom, aKindTo, aGroup]) a.needsUpdate = true;
      wake();
    },
    setStackBox(box) {
      center = [box.x + box.w / 2, box.y + box.h / 2];
      scale = box.h / VIEW_H;
      wake();
    },
    setMask(rects) {
      const list = rects.slice(0, 4);
      list.forEach((r, k) => u.uMask.value[k].set(r.x, r.y, r.w, r.h));
      u.uMaskCount.value = list.length;
      // The text column: masks narrower than most of the screen (not the header band).
      textRight = Math.max(0, ...list.filter((r) => r.w < w * 0.9).map((r) => r.x + r.w));
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
      colorsTo = { system: c.system, bright: c.bright, dust: c.dust, model: c.model, modelEdge: c.modelEdge };
      if (!haveColors) colorsFrom = structuredClone(colorsTo);
      haveColors = true;
      // With reduced motion only single frames are drawn, so switch at once.
      colorStart = motion ? clock() : -1e3;
      u.uDustAlpha.value = c.dark ? 0.28 : 0.22;
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
      running = on;
      if (on) wake();
    },
    resize(width, height, dpr) {
      w = Math.max(1, width);
      h = Math.max(1, height);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      u.uViewport.value.set(w, h);
      u.uDpr.value = dpr;
      wake();
    },
    dispose() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      document.removeEventListener("visibilitychange", onVisibility);
      o.canvas.removeEventListener("webglcontextlost", onLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
