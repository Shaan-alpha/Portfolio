/** The field reads its layout from the page: HTML lays out, dots follow.
 *  Positions come from the scene's own markers, with x in viewport pixels and
 *  y relative to the scene's top, which is the top of the screen once the
 *  scene has snapped. Read on load, resize and theme change only, never in
 *  the frame loop. */
import type { FieldColors } from "./engine.ts";
import type { FlowInput, FlowNode, Rect } from "./targets.ts";

/** `textRight` is the right edge of the scene's text column
 *  (`data-mask="text"`), which no morph path crosses; 0 when it has none. */
export type SceneLayout = { flows: FlowInput[]; stackBox: Rect | null; mask: Rect[]; textRight: number };

/** The field's viewport is the canvas's own box. With a classic scrollbar
 *  the window is wider, and drawing to its width would set every dot off its
 *  marker by a few pixels. */
export function viewportOf(el: { clientWidth: number; clientHeight: number }): { w: number; h: number } {
  return { w: Math.max(1, el.clientWidth), h: Math.max(1, el.clientHeight) };
}

const sized = (r: Rect) => r.w > 0 && r.h > 0;

export function readScene(section: HTMLElement): SceneLayout {
  const top = section.getBoundingClientRect().top;
  const rect = (el: Element): Rect => {
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top - top, w: b.width, h: b.height };
  };

  // One flow per `data-flow` id, nodes in document order (top to bottom).
  const flows = new Map<string, FlowInput>();
  for (const el of section.querySelectorAll<HTMLElement>("[data-node]")) {
    const b = rect(el);
    const id = el.dataset.flow ?? "0";
    const flow = flows.get(id) ?? { nodes: [], radius: Math.min(b.w, b.h) / 2 };
    const node: FlowNode = { x: b.x + b.w / 2, y: b.y + b.h / 2, kind: el.dataset.kind as FlowNode["kind"] };
    if (el.dataset.step) node.step = el.dataset.step;
    flow.nodes.push(node);
    flows.set(id, flow);
  }

  // The header overlays every scene, so its band is always masked. It comes
  // first: the engine keeps only the first few masks.
  const mask: Rect[] = [];
  const header = document.querySelector("header[data-mask]");
  if (header) {
    const b = header.getBoundingClientRect();
    mask.push({ x: b.left, y: b.top, w: b.width, h: b.height });
  }
  // A label hidden at this width has an empty box: it masks nothing.
  for (const el of section.querySelectorAll("[data-mask]")) {
    const r = rect(el);
    if (sized(r)) mask.push(r);
  }
  let textRight = 0;
  for (const el of section.querySelectorAll('[data-mask="text"]')) {
    const r = rect(el);
    if (sized(r)) textRight = Math.max(textRight, r.x + r.w);
  }
  const box = section.querySelector("[data-stack-box]");
  return { flows: [...flows.values()], stackBox: box ? rect(box) : null, mask, textRight };
}

function rgb(value: string): [number, number, number] {
  const hex = value.trim().replace(/^#/, "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [0.5, 0.5, 0.5];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** The theme's tokens, as the field's colours. */
export function readColors(): FieldColors {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const v = (name: string) => rgb(css.getPropertyValue(name));
  const dark = root.classList.contains("dark");
  return {
    system: v(dark ? "--ink-2" : "--ink-3"),
    bright: v("--ink"),
    dust: v("--line-2"),
    model: v("--model"),
    modelEdge: v("--model-edge"),
    line: v("--line"),
    dark,
  };
}
