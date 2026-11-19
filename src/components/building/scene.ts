import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CurvePath,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HalfFloatType,
  HemisphereLight,
  InstancedMesh,
  LineCurve3,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Object3D,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import type { LayerId } from "@/content/stack";
import { buildBlueprint, CYLINDER_SEGMENTS, type Blueprint, type Detail, type MaterialId, type Owner, type StoreyId } from "./blueprint";
import { choreograph, lerpShot, shotFor } from "./shots";
import { routeShot, travelAt, type Route } from "./routes";
import { createDetents } from "./detents";
import { createDegrade } from "./degrade";

export type Anchor = { id: LayerId; x: number; y: number };

export type BuildingSceneOptions = {
  canvas: HTMLCanvasElement;
  detail: Detail;
  reducedMotion: boolean;
  /** "hero" is acts I and II. "routes" is acts III and IV: the cut-away open,
   *  the levels closed, no dragging, and the camera following a project's
   *  route (see routes.ts) or looking into the vault. */
  mode?: "hero" | "routes";
  /** Each project's routes, by project id, for routes mode. */
  routes?: Record<string, Route[]>;
  onReady: () => void;
  onHover: (id: LayerId | null) => void;
  onPick: (id: LayerId | null) => void;
  onRotated: (rotated: boolean) => void;
  /** The visitor's own turning crossed into a new detent (see DETENT_DEG). */
  onDetent?: () => void;
  onAnchors: (anchors: Anchor[]) => void;
  onLost: () => void;
};

export type BuildingScene = {
  /** Acts I and II, 0 to 1: see BEATS in shots.ts. */
  setProgress(p: number): void;
  /** Routes mode: show project `id`'s routes at point `p` (0 to 1) of its
   *  scroll, or the vault with "vault", or the overview with null. */
  setRoute(id: string | null, p: number): void;
  setSelected(id: LayerId | null): void;
  setHighlighted(id: LayerId | null): void;
  resetView(): void;
  /** Render one frame and re-emit anchors, e.g. after the callout layout changes. */
  redraw(): void;
  /** Settle everything and render one frame at full quality, for the stills. */
  renderStill(): Promise<void>;
  dispose(): void;
};

/** Degrees between the dial's detents: 24 ticks to a full turn. */
const DETENT_DEG = 15;
/** How far each level rises when the section opens, per level above ground. */
const SEPARATION = 0.3;
const RISE: Record<StoreyId | "model", number> = { state: 0, interfaces: 0, guards: 1, orchestration: 2, model: 1.5 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (d: number) => (d * Math.PI) / 180;

type Palette = { card: Color; alu: Color; acrylic: Color; glow: Color; model: Color; ground: Color; ink: Color; part: Color; route: Color };

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => new Color().setStyle(cs.getPropertyValue(name).trim() || fallback);
  return {
    card: v("--card", "#f8f9fa"),
    alu: v("--alu", "#a7aeb6"),
    acrylic: v("--acrylic", "#cfd8df"),
    glow: v("--glow", "#8d96a2"),
    model: v("--model", "#ffc61a"),
    ground: v("--ground", "#eceef1"),
    ink: v("--ink", "#111318"),
    part: v("--part", "#c4cad2"),
    route: v("--route", "#111318"),
  };
}

const baseColor = (p: Palette, m: MaterialId): Color =>
  m === "card" ? p.card : m === "aluminium" ? p.alu : m === "acrylic" ? p.acrylic : m === "model" ? p.model : p.glow;

type Rig = { id: StoreyId | "model"; root: Group; lift: number; dim: number; hit: Object3D; corners: Vector3[] };
type Tinted = { mat: MeshStandardMaterial | MeshBasicMaterial; material: MaterialId; rig: Rig | null };
type CutMesh = { mesh: InstancedMesh; dir: Vector3; mats: Tinted };

export function createBuildingScene(opts: BuildingSceneOptions): BuildingScene {
  const { canvas, reducedMotion } = opts;
  let detail: Detail = opts.detail;
  let bp: Blueprint = buildBlueprint(detail);

  // A transparent canvas: the page's own ground shows through, exactly, in
  // both themes. Post-processing keeps the alpha (GTAO multiplies into the
  // frame with the destination alpha preserved; OutputPass copies it).
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const maxDpr = () => (detail === "high" ? 2 : 1.5);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr()));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  let palette = readPalette();

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTexture = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(30, 1, 0.05, 200);

  // ── Lights: a low sun for long shadows, a sky fill, a weak back light ──
  const hemi = new HemisphereLight(0xffffff, palette.part, 0.6);
  scene.add(hemi);
  const sun = new DirectionalLight(0xffffff, 2.8);
  sun.position.set(-7, 7.5, 8);
  sun.target.position.set(0, 0.5, 0);
  sun.castShadow = true;
  const sc = sun.shadow.camera;
  sc.left = -9;
  sc.right = 9;
  sc.top = 9;
  sc.bottom = -9;
  sc.near = 1;
  sc.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const back = new DirectionalLight(0xffffff, 0.5);
  back.position.set(8, 4, -6);
  scene.add(back);

  // ── The world: everything the visitor turns by dragging ─────────────────
  const world = new Group();
  scene.add(world);
  const site = new Group();
  world.add(site);

  const unitBox = new BoxGeometry(1, 1, 1);
  const unitCyl = new CylinderGeometry(0.5, 0.5, 1, CYLINDER_SEGMENTS, 1);
  const modelGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.06);
  const hitGeo = new BoxGeometry(1, 1, 1);
  const hitMat = new MeshBasicMaterial({ visible: false });
  const shared: BufferGeometry[] = [unitBox, unitCyl, modelGeo, hitGeo];

  const rigs = new Map<StoreyId | "model", Rig>();
  let tinted: Tinted[] = [];
  let cuts: CutMesh[] = [];
  let built: { meshes: InstancedMesh[]; mats: Material[] } = { meshes: [], mats: [] };
  let modelMesh: Mesh | null = null;

  const boxCorners = (c: number[], s: number[]) =>
    [-1, 1].flatMap((dx) => [-1, 1].flatMap((dy) => [-1, 1].map((dz) => new Vector3(c[0] + (dx * s[0]) / 2, c[1] + (dy * s[1]) / 2, c[2] + (dz * s[2]) / 2))));

  function makeMaterial(material: MaterialId, cut: boolean): MeshStandardMaterial | MeshBasicMaterial {
    const color = baseColor(palette, material).clone();
    if (material === "light") return new MeshBasicMaterial({ color, transparent: cut });
    if (material === "acrylic") return new MeshStandardMaterial({ color, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.35, depthWrite: false });
    if (material === "aluminium") return new MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.55, transparent: cut });
    if (material === "model") return new MeshStandardMaterial({ color, roughness: 0.42, emissive: color.clone(), emissiveIntensity: 0.12 });
    return new MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, transparent: cut });
  }

  function rigFor(owner: Owner): Rig | null {
    return owner === "frame" || owner === "plinth" ? null : (rigs.get(owner) ?? null);
  }

  function build() {
    // Level rigs: a root per level that rises when the section opens, with
    // an invisible box for picking and corners for the callout anchors.
    for (const s of bp.storeys) {
      const root = new Group();
      world.add(root);
      const hit = new Mesh(hitGeo, hitMat);
      const size = s.id === "state" ? [8.4, s.y1 - s.y0, 5.4] : [8.5, s.y1 - s.y0, 5.5];
      const center = [0, (s.y0 + s.y1) / 2, 0];
      hit.scale.set(size[0], size[1], size[2]);
      hit.position.set(center[0], center[1], center[2]);
      hit.userData.id = s.id;
      root.add(hit);
      rigs.set(s.id, { id: s.id, root, lift: 0, dim: 0, hit, corners: boxCorners(center, size) });
    }
    const modelRoot = new Group();
    world.add(modelRoot);
    const modelMat = makeMaterial("model", false) as MeshStandardMaterial;
    modelMesh = new Mesh(modelGeo, modelMat);
    modelMesh.scale.set(...bp.model.size);
    modelMesh.position.set(...bp.model.center);
    modelMesh.castShadow = true;
    modelMesh.receiveShadow = true;
    modelMesh.userData.id = "model";
    modelRoot.add(modelMesh);
    const modelRig: Rig = { id: "model", root: modelRoot, lift: 0, dim: 0, hit: modelMesh, corners: boxCorners(bp.model.center, bp.model.size) };
    rigs.set("model", modelRig);
    tinted.push({ mat: modelMat, material: "model", rig: modelRig });
    built.mats.push(modelMat);

    const m4 = new Matrix4();
    const q = new Quaternion();
    const qy = new Quaternion();
    const pos = new Vector3();
    const scl = new Vector3();
    const Y = new Vector3(0, 1, 0);
    const X = new Vector3(1, 0, 0);
    const Z = new Vector3(0, 0, 1);

    // One material per owner, material and cut state, so a level dims and a
    // cut-away fades on its own.
    const mats = new Map<string, Tinted>();
    for (const g of bp.groups) {
      if (g.material === "model") continue;
      const rig = rigFor(g.owner);
      const key = `${g.owner}:${g.material}:${g.cut ? "cut" : ""}`;
      let t = mats.get(key);
      if (!t) {
        t = { mat: makeMaterial(g.material, !!g.cut), material: g.material, rig };
        mats.set(key, t);
        tinted.push(t);
        built.mats.push(t.mat);
      }
      const mesh = new InstancedMesh(g.shape === "box" ? unitBox : unitCyl, t.mat, g.parts.length);
      g.parts.forEach((p, i) => {
        pos.set(...p.center);
        qy.setFromAxisAngle(Y, p.rotY ?? 0);
        if (g.shape === "cylinder" && p.axis === "x") {
          q.setFromAxisAngle(Z, -Math.PI / 2);
          scl.set(p.size[1], p.size[0], p.size[2]);
        } else if (g.shape === "cylinder" && p.axis === "z") {
          q.setFromAxisAngle(X, Math.PI / 2);
          scl.set(p.size[0], p.size[2], p.size[1]);
        } else {
          q.identity();
          scl.set(...p.size);
        }
        m4.compose(pos, qy.clone().multiply(q), scl);
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
      const solid = g.material === "card" || g.material === "aluminium";
      mesh.castShadow = solid;
      mesh.receiveShadow = solid;
      mesh.computeBoundingSphere();
      (rig ? rig.root : site).add(mesh);
      built.meshes.push(mesh);
      if (g.cut) cuts.push({ mesh, dir: new Vector3(...g.cut), mats: t });
    }
  }

  function unbuild() {
    for (const m of built.meshes) m.removeFromParent();
    for (const m of built.mats) m.dispose();
    for (const r of rigs.values()) r.root.removeFromParent();
    rigs.clear();
    tinted = [];
    cuts = [];
    built = { meshes: [], mats: [] };
    modelMesh = null;
  }

  build();

  // ── The plinth engraving: the line, set like a competition model's title ─
  const front = bp.plinthFront;
  const engraveCanvas = document.createElement("canvas");
  engraveCanvas.width = 2048;
  engraveCanvas.height = Math.round((2048 * front.size[1]) / front.size[0]);
  const engraveTexture = new CanvasTexture(engraveCanvas);
  engraveTexture.colorSpace = SRGBColorSpace;
  engraveTexture.anisotropy = 4;
  const engraveMat = new MeshBasicMaterial({ map: engraveTexture, transparent: true, depthWrite: false });
  const engraving = new Mesh(new PlaneGeometry(front.size[0], front.size[1]), engraveMat);
  engraving.position.set(front.center[0], front.center[1], front.center[2] + 0.004);
  site.add(engraving);
  let fontsReady = false;
  function engrave() {
    const ctx = engraveCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, engraveCanvas.width, engraveCanvas.height);
    // Never bake a fallback face into the texture: draw once Archivo is in.
    if (!fontsReady) return;
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() || "sans-serif";
    const px = Math.round(engraveCanvas.height * 0.2);
    ctx.font = `600 ${px}px ${family}`;
    (ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
    ctx.fillStyle = `#${palette.ink.getHexString()}`;
    ctx.globalAlpha = 0.72;
    ctx.textBaseline = "middle";
    ctx.fillText("The model is a component, not the architecture.", Math.round(engraveCanvas.width * 0.035), Math.round(engraveCanvas.height * 0.5));
    engraveTexture.needsUpdate = true;
  }
  engrave();
  document.fonts?.ready
    .then(() => {
      fontsReady = true;
      engrave();
      invalidate();
    })
    .catch(() => {});

  // ── Routes mode: each project's flows as lit lines through the building ─
  // Polylines, not splines: a travelling marker placed by arc length then
  // lands exactly on each stop when the camera does (see travelAt).
  const routesMode = opts.mode === "routes";
  type RouteRig = { group: Group; curves: CurvePath<Vector3>[]; routes: Route[] };
  const routeRigs = new Map<string, RouteRig>();
  const routeMat = new MeshBasicMaterial({ color: palette.route.clone() });
  const discGeo = new CylinderGeometry(0.1, 0.1, 0.02, 20);
  const travelerGeo = new SphereGeometry(0.075, 16, 12);
  const routeGeoms: BufferGeometry[] = [discGeo, travelerGeo];
  const traveler = new Mesh(travelerGeo, routeMat);
  traveler.visible = false;
  if (routesMode && opts.routes) {
    for (const [id, routes] of Object.entries(opts.routes)) {
      const group = new Group();
      group.visible = false;
      const curves = routes.map((r) => {
        const path = new CurvePath<Vector3>();
        for (let i = 1; i < r.path.length; i++) path.add(new LineCurve3(new Vector3(...r.path[i - 1]), new Vector3(...r.path[i])));
        if (r.path.length > 1) {
          const tube = new TubeGeometry(path, Math.max(24, r.path.length * 16), 0.028, 6, false);
          routeGeoms.push(tube);
          group.add(new Mesh(tube, routeMat));
        }
        // A disc on the floor under each stop. The model needs none: the
        // block itself brightens when the route reaches it.
        for (const s of r.stops) {
          if (s.kind === "model") continue;
          const disc = new Mesh(discGeo, routeMat);
          disc.position.set(s.position[0], s.position[1] - 0.34, s.position[2]);
          group.add(disc);
        }
        return path;
      });
      world.add(group);
      routeRigs.set(id, { group, curves, routes });
    }
    world.add(traveler);
  }
  let activeRoute: string | null = null;
  let routeP = 0;
  let modelGlow = 0.12;

  // ── Post-processing: ambient occlusion at high detail only ──────────────
  let composer: EffectComposer | null = null;
  let gtao: GTAOPass | null = null;
  let usePost = detail === "high";
  function makeComposer() {
    composer?.dispose();
    composer = new EffectComposer(renderer, new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1, thickness: 1.2, scale: 1, distanceFallOff: 1 });
    composer.addPass(gtao);
    composer.addPass(new OutputPass());
  }
  if (usePost) makeComposer();

  // ── State ───────────────────────────────────────────────────────────────
  let width = 1;
  let height = 1;
  let progress = 0;
  let azUser = 0;
  let azShown = 0;
  let azVel = 0;
  let selected: LayerId | null = null;
  let highlighted: LayerId | null = null;
  let hovered: LayerId | null = null;
  let rotatedReported = false;
  const detents = createDetents(DETENT_DEG);
  const degrade = createDegrade();
  const smoothing = reducedMotion ? 60 : 9;

  function applyPalette() {
    hemi.groundColor.copy(palette.part);
    routeMat.color.copy(palette.route);
    engrave();
  }

  function tint(t: Tinted) {
    const dim = t.rig?.dim ?? 0;
    const base = baseColor(palette, t.material);
    t.mat.color.copy(base).lerp(palette.ground, dim * (t.material === "model" ? 0.45 : 0.55));
    if (t.material === "model" && "emissive" in t.mat) t.mat.emissive.copy(base);
  }

  /** Advance every animated value by dt seconds. Returns true while anything
   *  is still moving, so the render loop can stop when the scene is at rest. */
  function step(dt: number) {
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
    azShown = approach(azShown, azUser);
    if (detents(azShown)) opts.onDetent?.();
    world.rotation.y = rad(azShown);

    // Camera, separation and the cut-away all follow the scroll progress,
    // which ScrollTrigger has already smoothed.
    const aspect = width / height;
    let shot;
    let separation;
    let cut;
    let glowTarget = 0.12;
    if (routesMode) {
      const rig = activeRoute && activeRoute !== "vault" ? routeRigs.get(activeRoute) : undefined;
      shot = activeRoute === "vault" ? shotFor("vault", aspect, bp) : rig ? routeShot(rig.routes, routeP, aspect, bp) : shotFor("section", aspect, bp);
      separation = 0;
      cut = 1;
      traveler.visible = !!rig;
      if (rig) {
        const { route, t } = travelAt(rig.routes, routeP);
        const r = rig.routes[route];
        const curve = rig.curves[route];
        if (curve.curves.length) traveler.position.copy(curve.getPointAt(clamp(t, 0, 1)));
        else traveler.position.set(...r.path[0]);
        if (r.stops.some((s, i) => s.kind === "model" && Math.abs(r.at[i] - t) < 0.04)) glowTarget = 0.35;
      }
    } else {
      const { from, to, t } = choreograph(progress);
      shot = lerpShot(shotFor(from.shot, aspect, bp), shotFor(to.shot, aspect, bp), t);
      separation = lerp(from.separation, to.separation, t);
      cut = lerp(from.cut, to.cut, t);
    }
    camera.position.set(...shot.position);
    camera.fov = shot.fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.lookAt(...shot.target);
    modelGlow = approach(modelGlow, glowTarget);
    const modelMat = modelMesh?.material;
    if (modelMat instanceof MeshStandardMaterial) modelMat.emissiveIntensity = modelGlow;

    const focus = hovered ?? highlighted ?? selected;
    for (const r of rigs.values()) {
      const raised = r.id === focus || r.id === selected;
      r.lift = approach(r.lift, raised ? 0.14 : 0);
      r.dim = approach(r.dim, focus && !raised ? 1 : 0);
      r.root.position.y = RISE[r.id] * SEPARATION * separation + r.lift;
    }
    for (const t2 of tinted) tint(t2);
    for (const c of cuts) {
      c.mesh.position.copy(c.dir).multiplyScalar(cut * 0.9);
      c.mats.mat.opacity = 1 - cut;
      c.mesh.visible = cut < 0.98;
    }
    return moving;
  }

  // ── Render loop (on demand) ─────────────────────────────────────────────
  let raf = 0;
  let running = false;
  let last = 0;
  let visible = true;
  let firstFrame = true;
  let wasMoving = false;
  const tmp = new Vector3();

  function draw() {
    if (usePost && composer) composer.render();
    else renderer.render(scene, camera);
  }

  function emitAnchors() {
    const anchors: Anchor[] = [];
    for (const r of rigs.values()) {
      let best: { x: number; y: number } | null = null;
      for (const c of r.corners) {
        tmp.copy(c);
        r.root.localToWorld(tmp);
        tmp.project(camera);
        // A corner behind the camera projects through it, mirrored.
        if (tmp.z > 1) continue;
        const x = ((tmp.x + 1) / 2) * width;
        const y = ((1 - tmp.y) / 2) * height;
        if (!best || x > best.x) best = { x, y };
      }
      if (best) anchors.push({ id: r.id, ...best });
    }
    opts.onAnchors(anchors);
  }

  function tick(now: number) {
    const ms = now - last;
    const dt = Math.min(0.05, ms / 1000 || 0.016);
    last = now;
    const moving = step(dt);
    draw();
    if (!routesMode) emitAnchors();
    if (firstFrame) {
      firstFrame = false;
      opts.onReady();
    }
    // Only steady animation tells us about the GPU; the first frame after
    // a pause measures the pause.
    if (wasMoving && moving) {
      const verdict = degrade(ms);
      if (verdict === "post-off") usePost = false;
      if (verdict === "low-detail" && detail === "high") {
        detail = "low";
        bp = buildBlueprint("low");
        unbuild();
        build();
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.map?.dispose();
        sun.shadow.map = null;
        resize();
      }
    }
    wasMoving = moving;
    if (moving && visible) {
      raf = requestAnimationFrame(tick);
    } else {
      running = false;
      wasMoving = false;
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
  let down: { x: number; az: number; id: number } | null = null;
  let dragging = false;
  let lastMove = { x: 0, t: 0 };

  function pick(clientX: number, clientY: number): LayerId | null {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const targets = [...rigs.values()].map((r) => r.hit);
    const hits = raycaster.intersectObjects(targets, false);
    // The model block sits inside the guards' pick box; it wins when hit.
    const model = hits.find((h) => h.object.userData.id === "model");
    return ((model ?? hits[0])?.object.userData.id as LayerId | undefined) ?? null;
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
    down = { x: e.clientX, az: azUser, id: e.pointerId };
    lastMove = { x: e.clientX, t: performance.now() };
    azVel = 0;
    canvas.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (down && e.pointerId === down.id) {
      const dx = e.clientX - down.x;
      if (!dragging && Math.abs(dx) > 5) {
        dragging = true;
        setHover(null);
        canvas.style.cursor = "grabbing";
      }
      if (dragging) {
        azUser = down.az + dx * 0.4;
        const now = performance.now();
        const dtm = Math.max(1, now - lastMove.t);
        azVel = azVel * 0.6 + (e.clientX - lastMove.x) * 0.4 * (1000 / dtm) * 0.4;
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

  // Routes mode only watches: the camera follows the page, so there is
  // nothing to turn or pick.
  if (!routesMode) {
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("pointerleave", onLeave);
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  // ── Size, theme, visibility ─────────────────────────────────────────────
  const container = canvas.parentElement ?? canvas;
  let still = false;
  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    const dpr = still ? 2 : Math.min(window.devicePixelRatio || 1, maxDpr());
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    sun.shadow.mapSize.setScalar(detail === "high" ? 2048 : 1024);
    if (composer) {
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
    }
    // Resizing clears the drawing buffer; draw now rather than next frame.
    if (!firstFrame) {
      step(0);
      draw();
      emitAnchors();
    }
    invalidate();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

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
  applyPalette();
  invalidate();

  return {
    setProgress(p) {
      const next = clamp(p, 0, 1);
      if (Math.abs(next - progress) < 1e-5) return;
      progress = next;
      invalidate();
    },
    setRoute(id, p) {
      const next = clamp(p, 0, 1);
      if (id === activeRoute && Math.abs(next - routeP) < 1e-5) return;
      if (id !== activeRoute) {
        for (const [key, rig] of routeRigs) rig.group.visible = key === id;
        activeRoute = id;
      }
      routeP = next;
      invalidate();
    },
    setSelected(id) {
      selected = id;
      invalidate();
    },
    setHighlighted(id) {
      highlighted = id;
      invalidate();
    },
    resetView() {
      azUser = 0;
      azVel = 0;
      rotatedReported = false;
      opts.onRotated(false);
      invalidate();
    },
    redraw() {
      invalidate();
    },
    async renderStill() {
      still = true;
      if (fontsReady === false) {
        await document.fonts?.ready.catch(() => {});
        fontsReady = true;
        engrave();
      }
      for (const r of rigs.values()) {
        r.lift = 0;
        r.dim = 0;
      }
      azShown = azUser;
      resize();
      step(0);
      draw();
      await new Promise<void>((done) =>
        requestAnimationFrame(() => {
          step(0);
          draw();
          done();
        }),
      );
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
      unbuild();
      shared.forEach((g) => g.dispose());
      routeGeoms.forEach((g) => g.dispose());
      routeMat.dispose();
      hitMat.dispose();
      engraving.geometry.dispose();
      engraveMat.dispose();
      engraveTexture.dispose();
      composer?.dispose();
      gtao?.dispose();
      envTexture.dispose();
      pmrem.dispose();
      room.dispose?.();
      renderer.dispose();
    },
  };
}
