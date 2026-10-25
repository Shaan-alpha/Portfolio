import {
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  OrthographicCamera,
  PCFShadowMap,
  PMREMGenerator,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { LayerId } from "@/content/stack";
import {
  AZIMUTH,
  CUBE,
  ELEVATION,
  GAP,
  MODEL_SLOT,
  PLATE_D,
  PLATE_H,
  PLATE_R,
  PLATE_W,
  VIEW_H,
  VIEW_MIN_W,
  basis,
  roundedRect,
  slotY,
} from "./geometry";

export type Anchor = { id: LayerId; x: number; y: number };

export type StackSceneOptions = {
  canvas: HTMLCanvasElement;
  /** Layer ids top to bottom; index = slot. */
  layers: LayerId[];
  reducedMotion: boolean;
  onReady: () => void;
  onHover: (id: LayerId | null) => void;
  onPick: (id: LayerId | null) => void;
  onRotated: (rotated: boolean) => void;
  onAnchors: (anchors: Anchor[]) => void;
  onLost: () => void;
};

export type StackScene = {
  setSelected(id: LayerId | null): void;
  setHighlighted(id: LayerId | null): void;
  setScroll(progress: number): void;
  resetView(): void;
  playIntro(): void;
  /** Render one frame and re-emit anchors, e.g. after the callout layout changes. */
  redraw(): void;
  dispose(): void;
};

type Palette = {
  plate: Color;
  part: Color;
  part2: Color;
  ink: Color;
  line: Color;
  ground: Color;
  model: Color;
  shadowOpacity: number;
};

type Rig = {
  id: LayerId;
  slot: number;
  root: Group;
  parts: Group;
  outline: LineLoop | null;
  mats: { plate: MeshStandardMaterial; part: MeshStandardMaterial; part2: MeshStandardMaterial; ink: MeshStandardMaterial };
  lineMat: LineBasicMaterial;
  corners: Vector3[];
  lift: number;
  dim: number;
  grow: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  const shadow = v("--shadow", "rgba(17, 19, 24, 0.22)");
  const alpha = Number(/,\s*([\d.]+)\s*\)$/.exec(shadow)?.[1] ?? 0.22);
  return {
    plate: new Color().setStyle(v("--plate", "#f4f5f7")),
    part: new Color().setStyle(v("--part", "#c4cad2")),
    part2: new Color().setStyle(v("--part-2", "#8d96a2")),
    ink: new Color().setStyle(v("--ink", "#111318")),
    line: new Color().setStyle(v("--line-2", "#a9b0b9")),
    ground: new Color().setStyle(v("--ground", "#eceef1")),
    model: new Color().setStyle(v("--model", "#ffc61a")),
    shadowOpacity: alpha,
  };
}

export function createStackScene(opts: StackSceneOptions): StackScene {
  const { canvas, reducedMotion } = opts;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "default" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  // r186 folded PCFSoft into PCF; softness now comes from shadow.radius.
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTexture = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.5;

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);

  let palette = readPalette();

  // ── Lights ──────────────────────────────────────────────────────────────
  const hemi = new HemisphereLight(0xffffff, palette.part, 0.9);
  scene.add(hemi);
  const key = new DirectionalLight(0xffffff, 2.1);
  key.position.set(-3.2, 9, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new DirectionalLight(0xffffff, 0.55);
  fill.position.set(6, 2.5, -3);
  scene.add(fill);

  // A soft contact shadow under the stack, painted once into a small canvas.
  // A real shadow-catching floor is clipped by the light's frustum into a hard
  // wedge at this camera angle; a falloff texture grounds the object instead.
  const blob = document.createElement("canvas");
  blob.width = blob.height = 128;
  const g2d = blob.getContext("2d");
  if (g2d) {
    const grad = g2d.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.55, "rgba(0,0,0,0.45)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g2d.fillStyle = grad;
    g2d.fillRect(0, 0, 128, 128);
  }
  const blobTexture = new CanvasTexture(blob);
  const floorMat = new MeshBasicMaterial({ map: blobTexture, color: 0x000000, transparent: true, depthWrite: false, opacity: palette.shadowOpacity });
  const floor = new Mesh(new PlaneGeometry(PLATE_W * 1.5, PLATE_D * 1.7), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = -1;
  scene.add(floor);

  // ── Shared geometry ─────────────────────────────────────────────────────
  const geoms: BufferGeometry[] = [];
  const keep = <T extends BufferGeometry>(g: T) => (geoms.push(g), g);
  const plateGeo = keep(new RoundedBoxGeometry(PLATE_W, PLATE_H, PLATE_D, 4, PLATE_R));
  const box = (w: number, h: number, d: number, r = 0.04) => keep(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)));
  const cyl = (r: number, h: number, seg = 40) => keep(new CylinderGeometry(r, r, h, seg));

  const outlinePts = roundedRect(PLATE_W - 0.26, PLATE_D - 0.26, 0.12).map(([x, z]) => new Vector3(x, PLATE_H / 2 + 0.002, z));
  const outlineGeo = keep(new BufferGeometry().setFromPoints(outlinePts));

  const pickables: Object3D[] = [];
  const materials: Material[] = [floorMat];

  const mesh = (geo: BufferGeometry, mat: Material, slot: number, x = 0, y = 0, z = 0) => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.slot = slot;
    pickables.push(m);
    return m;
  };

  const std = (color: Color, roughness: number) => {
    const m = new MeshStandardMaterial({ color: color.clone(), roughness, metalness: 0 });
    materials.push(m);
    return m;
  };

  // ── Layers ──────────────────────────────────────────────────────────────
  const stack = new Group();
  scene.add(stack);

  const rigs: Rig[] = opts.layers.map((id, slot) => {
    const root = new Group();
    const parts = new Group();
    parts.position.y = slot === MODEL_SLOT ? 0 : PLATE_H / 2;
    root.add(parts);
    stack.add(root);

    const mats = {
      plate: std(palette.plate, 0.62),
      part: std(palette.part, 0.55),
      part2: std(palette.part2, 0.5),
      ink: std(palette.ink, 0.45),
    };
    // Push plate faces back a hair so the panel line on top never z-fights.
    mats.plate.polygonOffset = true;
    mats.plate.polygonOffsetFactor = 1;
    mats.plate.polygonOffsetUnits = 1;
    const lineMat = new LineBasicMaterial({ color: palette.line.clone() });
    materials.push(lineMat);

    let outline: LineLoop | null = null;
    let corners: Vector3[];
    if (slot !== MODEL_SLOT) {
      root.add(mesh(plateGeo, mats.plate, slot));
      outline = new LineLoop(outlineGeo, lineMat);
      root.add(outline);
      const t = PLATE_H / 2;
      corners = [
        new Vector3(PLATE_W / 2, t, PLATE_D / 2),
        new Vector3(PLATE_W / 2, t, -PLATE_D / 2),
        new Vector3(-PLATE_W / 2, t, PLATE_D / 2),
        new Vector3(-PLATE_W / 2, t, -PLATE_D / 2),
      ];
    } else {
      // The block's vertical edges at mid-height, so its leader line starts on
      // the yellow face; its top corners sit tucked under the plate above.
      const c = CUBE / 2;
      corners = [new Vector3(c, 0, c), new Vector3(c, 0, -c), new Vector3(-c, 0, c), new Vector3(-c, 0, -c)];
    }

    return { id, slot, root, parts, outline, mats, lineMat, corners, lift: 0, dim: 0, grow: reducedMotion ? 1 : 0 };
  });

  const bySlot = (slot: number) => rigs[slot];

  // Slot 0 — interfaces: a chat surface, a screen, an API socket.
  {
    const r = bySlot(0);
    const p = r.parts;
    p.add(mesh(box(0.7, 0.2, 0.48, 0.07), r.mats.part, 0, -1.0, 0.1, 0.18));
    p.add(mesh(box(0.2, 0.08, 0.16, 0.03), r.mats.part, 0, -0.78, 0.04, 0.5));
    p.add(mesh(box(0.86, 0.52, 0.07, 0.03), r.mats.part, 0, 0.06, 0.3, -0.32));
    p.add(mesh(box(0.7, 0.36, 0.02, 0.01), r.mats.part2, 0, 0.06, 0.32, -0.275));
    p.add(mesh(box(0.28, 0.05, 0.24, 0.02), r.mats.part2, 0, 0.06, 0.025, -0.26));
    p.add(mesh(cyl(0.21, 0.18), r.mats.part, 0, 1.02, 0.09, 0.22));
    p.add(mesh(cyl(0.085, 0.16), r.mats.part2, 0, 1.02, 0.26, 0.22));
  }

  // Slot 1 — guards: a gate, and a row of checks that each must pass.
  {
    const r = bySlot(1);
    const p = r.parts;
    // Kept low and towards the front edge: the plate above hides anything
    // tall or deep at the default camera angle.
    const gx = -0.8;
    const gz = 0.55;
    p.add(mesh(box(0.11, 0.3, 0.11, 0.02), r.mats.ink, 1, gx - 0.32, 0.15, gz));
    p.add(mesh(box(0.11, 0.3, 0.11, 0.02), r.mats.ink, 1, gx + 0.32, 0.15, gz));
    p.add(mesh(box(0.86, 0.1, 0.13, 0.02), r.mats.ink, 1, gx, 0.33, gz));
    p.add(mesh(box(0.54, 0.035, 0.07, 0.012), r.mats.part, 1, gx, 0.12, gz));
    for (let i = 0; i < 5; i++) {
      const x = 0.15 + i * 0.27;
      p.add(mesh(cyl(0.065, 0.2, 28), r.mats.part, 1, x, 0.1, 0.55));
      p.add(mesh(cyl(0.067, 0.045, 28), r.mats.ink, 1, x, 0.22, 0.55));
    }
  }

  // Slot 2 — orchestration: a planner node wired to the tools it calls.
  {
    const r = bySlot(2);
    const p = r.parts;
    const cx = 0.05;
    const cz = 0.12;
    const y = 0.07;
    const ring = 6;
    const rad = 0.66;
    const nodes: Vector3[] = [];
    p.add(mesh(cyl(0.13, 0.14), r.mats.ink, 2, cx, y, cz));
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2 + Math.PI / 6;
      const v = new Vector3(cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad * 0.82);
      nodes.push(v);
      p.add(mesh(cyl(0.09, 0.11), r.mats.part2, 2, v.x, v.y, v.z));
    }
    const rodGeo = cyl(0.017, 1, 10);
    const up = new Vector3(0, 1, 0);
    const rod = (a: Vector3, b: Vector3) => {
      const d = new Vector3().subVectors(b, a);
      const m = mesh(rodGeo, r.mats.part2, 2);
      m.scale.y = d.length();
      m.position.copy(a).addScaledVector(d, 0.5);
      m.quaternion.copy(new Quaternion().setFromUnitVectors(up, d.normalize()));
      p.add(m);
    };
    const hub = new Vector3(cx, y, cz);
    nodes.forEach((n, i) => {
      rod(hub, n);
      rod(n, nodes[(i + 1) % ring]);
    });
  }

  // Slot 3 — the model. One block, no plate, enamel instead of matte.
  const modelMat = new MeshPhysicalMaterial({
    color: palette.model.clone(),
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
  });
  materials.push(modelMat);
  const cube = mesh(keep(new RoundedBoxGeometry(CUBE, CUBE, CUBE, 5, 0.075)), modelMat, MODEL_SLOT);
  bySlot(MODEL_SLOT).parts.add(cube);

  // Slot 4 — memory and state: two databases, an append-only ledger, and
  // four cache blocks (Skill Issue runs four cache layers).
  {
    const r = bySlot(4);
    const p = r.parts;
    for (const [x, z] of [
      [-1.0, -0.05],
      [-0.42, 0.42],
    ] as const) {
      for (let i = 0; i < 3; i++) {
        p.add(mesh(cyl(0.25, 0.09), i === 2 ? r.mats.part2 : r.mats.part, 4, x, 0.045 + i * 0.115, z));
      }
    }
    for (let i = 0; i < 6; i++) {
      p.add(mesh(box(0.62, 0.035, 0.42, 0.012), i % 2 ? r.mats.part2 : r.mats.part, 4, 0.72 + (i % 2) * 0.03, 0.0175 + i * 0.05, -0.2));
    }
    for (let i = 0; i < 4; i++) {
      p.add(mesh(box(0.17, 0.17, 0.17, 0.025), r.mats.ink, 4, 0.3 + i * 0.28, 0.085, 0.62));
    }
  }

  // Parts start folded flat into their plates; playIntro() grows them.
  if (!reducedMotion) {
    for (const r of rigs) if (r.slot !== MODEL_SLOT) r.parts.scale.y = 0.001;
  }

  // ── State ───────────────────────────────────────────────────────────────
  let width = 1;
  let height = 1;
  let az = AZIMUTH;
  let el = ELEVATION;
  let gap = GAP;
  let azUser = 0;
  let elUser = 0;
  let azVel = 0;
  let scroll = 0;
  let selected: LayerId | null = null;
  let highlighted: LayerId | null = null;
  let hovered: LayerId | null = null;
  let introStart = -1;
  let cubeSpin = 0;
  let rotatedReported = false;

  const smoothing = reducedMotion ? 60 : 9;

  function frameCamera() {
    const aspect = width / height;
    const viewH = Math.max(VIEW_H, VIEW_MIN_W / aspect);
    const halfH = viewH / 2;
    const halfW = halfH * aspect;
    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
  }

  function placeCamera() {
    const b = basis(az, el);
    camera.position.set(b.toCamera[0] * 30, b.toCamera[1] * 30, b.toCamera[2] * 30);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
  }

  function applyPalette() {
    hemi.groundColor.copy(palette.part);
    floorMat.opacity = palette.shadowOpacity;
  }

  const tmpColor = new Color();
  function tint(mat: MeshStandardMaterial, base: Color, dim: number) {
    mat.color.copy(tmpColor.copy(base).lerp(palette.ground, dim * 0.55));
  }

  /** Advance every animated value by dt seconds. Returns true while anything
   *  is still moving, so the render loop can stop when the scene is at rest. */
  function step(dt: number, now: number) {
    let moving = false;
    const k = 1 - Math.exp(-smoothing * dt);
    const approach = (cur: number, target: number, eps = 1e-4) => {
      const next = cur + (target - cur) * k;
      if (Math.abs(target - next) > eps) moving = true;
      return Math.abs(target - next) <= eps ? target : next;
    };

    if (!dragging && Math.abs(azVel) > 0.5 && !reducedMotion) {
      azUser += azVel * dt;
      azVel *= Math.exp(-4 * dt);
      moving = true;
    } else if (!dragging) {
      azVel = 0;
    }

    az = approach(az, AZIMUTH + azUser + 28 * scroll);
    el = approach(el, clamp(ELEVATION + elUser + 6 * scroll, 6, 64));
    gap = approach(gap, GAP + 0.14 * scroll);

    const focus = hovered ?? highlighted ?? selected;
    for (const r of rigs) {
      const raised = r.id === focus || r.id === selected;
      r.lift = approach(r.lift, raised ? 0.14 : 0);
      r.dim = approach(r.dim, focus && !raised ? 1 : 0);
      r.root.position.y = slotY(r.slot, gap) + r.lift;
      tint(r.mats.plate, palette.plate, r.dim);
      tint(r.mats.part, palette.part, r.dim);
      tint(r.mats.part2, palette.part2, r.dim);
      tint(r.mats.ink, palette.ink, r.dim);
      r.lineMat.color.copy(r.id === focus ? palette.ink : palette.line);
    }
    modelMat.color.copy(tmpColor.copy(palette.model).lerp(palette.ground, rigs[MODEL_SLOT].dim * 0.45));

    // Intro: parts grow out of their plates from the bottom of the stack up,
    // then the model block makes a quarter turn. Plates are there from frame
    // one, because they are already on screen in the drawing this replaces.
    if (introStart >= 0) {
      const t = now - introStart;
      const order = [4, 2, 1, 0];
      order.forEach((slot, i) => {
        const g = clamp((t - 120 - i * 130) / 520, 0, 1);
        rigs[slot].grow = g;
        rigs[slot].parts.scale.set(1, Math.max(0.001, easeOutBack(g)), 1);
      });
      cubeSpin = clamp((t - 760) / 700, 0, 1);
      cube.rotation.y = easeInOut(cubeSpin) * (Math.PI / 2);
      if (t < 1600) moving = true;
      else introStart = -1;
    }

    floor.position.y = slotY(4, gap) - PLATE_H / 2 - 0.55;
    placeCamera();
    return moving;
  }

  // ── Render loop (on demand) ─────────────────────────────────────────────
  let raf = 0;
  let running = false;
  let last = 0;
  let visible = true;
  let firstFrame = true;
  const tmp = new Vector3();

  function emitAnchors() {
    const anchors: Anchor[] = [];
    for (const r of rigs) {
      let best: { x: number; y: number } | null = null;
      for (const c of r.corners) {
        tmp.copy(c);
        r.root.localToWorld(tmp);
        tmp.project(camera);
        const x = ((tmp.x + 1) / 2) * width;
        const y = ((1 - tmp.y) / 2) * height;
        if (!best || x > best.x) best = { x, y };
      }
      if (best) anchors.push({ id: r.id, ...best });
    }
    opts.onAnchors(anchors);
  }

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const moving = step(dt, now);
    renderer.render(scene, camera);
    emitAnchors();
    if (firstFrame) {
      firstFrame = false;
      opts.onReady();
    }
    // onReady usually starts the intro from inside this frame, where
    // invalidate() is a no-op, so a pending intro keeps the loop alive itself.
    if ((moving || introStart >= 0) && visible) {
      raf = requestAnimationFrame(tick);
    } else {
      running = false;
    }
  }

  function invalidate() {
    if (running || !visible) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  // ── Picking and dragging ────────────────────────────────────────────────
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  let down: { x: number; y: number; az: number; el: number; id: number } | null = null;
  let dragging = false;
  let lastMove = { x: 0, t: 0 };

  function pick(clientX: number, clientY: number): LayerId | null {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? rigs[hit.object.userData.slot as number].id : null;
  }

  function setHover(id: LayerId | null) {
    if (id === hovered) return;
    hovered = id;
    canvas.style.cursor = dragging ? "grabbing" : id ? "pointer" : "grab";
    opts.onHover(id);
    invalidate();
  }

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, az: azUser, el: elUser, id: e.pointerId };
    lastMove = { x: e.clientX, t: performance.now() };
    azVel = 0;
    canvas.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (down && e.pointerId === down.id) {
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (!dragging && Math.hypot(dx, dy) > 5) {
        dragging = true;
        setHover(null);
        canvas.style.cursor = "grabbing";
      }
      if (dragging) {
        azUser = down.az - dx * 0.4;
        elUser = clamp(down.el + dy * 0.25, 6 - ELEVATION, 64 - ELEVATION);
        const now = performance.now();
        const dtm = Math.max(1, now - lastMove.t);
        azVel = azVel * 0.6 + (-(e.clientX - lastMove.x) * 0.4 * (1000 / dtm)) * 0.4;
        lastMove = { x: e.clientX, t: now };
        if (!rotatedReported) {
          rotatedReported = true;
          opts.onRotated(true);
        }
        invalidate();
      }
      return;
    }
    if (e.pointerType === "mouse") setHover(pick(e.clientX, e.clientY));
  };

  const onUp = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    if (!dragging) opts.onPick(pick(e.clientX, e.clientY));
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    down = null;
    dragging = false;
    if (performance.now() - lastMove.t > 80) azVel = 0;
    canvas.style.cursor = hovered ? "pointer" : "grab";
    invalidate();
  };

  const onCancel = () => {
    down = null;
    dragging = false;
    azVel = 0;
    canvas.style.cursor = "grab";
  };

  const onLeave = () => {
    if (!down) setHover(null);
  };

  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("pointerleave", onLeave);

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  // ── Size, theme, visibility ─────────────────────────────────────────────
  const container = canvas.parentElement ?? canvas;
  const resize = () => {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    // Zoom and monitor changes alter the ratio, so it is re-read every time.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    frameCamera();
    // Resizing clears the drawing buffer, and ResizeObserver fires just before
    // paint; drawing now instead of next frame avoids a blank flash per step.
    if (!firstFrame) {
      renderer.render(scene, camera);
      emitAnchors();
    }
    invalidate();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  // Moving the window to a screen with a different pixel ratio changes no CSS
  // size, so ResizeObserver stays quiet; a resolution query catches it.
  let dprQuery: MediaQueryList | null = null;
  const onDpr = () => {
    resize();
    watchDpr();
  };
  const watchDpr = () => {
    dprQuery?.removeEventListener("change", onDpr);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", onDpr);
  };
  watchDpr();

  const mo = new MutationObserver(() => {
    palette = readPalette();
    applyPalette();
    invalidate();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate();
  });
  io.observe(canvas);

  resize();
  placeCamera();
  applyPalette();
  invalidate();

  return {
    setSelected(id) {
      selected = id;
      invalidate();
    },
    setHighlighted(id) {
      highlighted = id;
      invalidate();
    },
    setScroll(p) {
      const next = clamp(p, 0, 1);
      if (Math.abs(next - scroll) < 0.001) return;
      scroll = next;
      invalidate();
    },
    resetView() {
      azUser = 0;
      elUser = 0;
      azVel = 0;
      rotatedReported = false;
      opts.onRotated(false);
      invalidate();
    },
    playIntro() {
      if (reducedMotion) return;
      introStart = performance.now();
      invalidate();
    },
    redraw() {
      invalidate();
    },
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      ro.disconnect();
      dprQuery?.removeEventListener("change", onDpr);
      mo.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      geoms.forEach((g) => g.dispose());
      floor.geometry.dispose();
      blobTexture.dispose();
      materials.forEach((m) => m.dispose());
      envTexture.dispose();
      pmrem.dispose();
      room.dispose?.();
      renderer.dispose();
    },
  };
}
