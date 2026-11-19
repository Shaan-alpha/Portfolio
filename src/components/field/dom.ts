/** The field reads its layout from the page: HTML lays out, dots follow.
 *  Positions come from the scene's own markers, with x in viewport pixels and
 *  y relative to the scene's top, which is the top of the screen once the
 *  scene has snapped. Read on load, resize and theme change only, never in
 *  the frame loop. */
import type { FieldColors } from "./engine.ts";
import type { FlowInput, FlowNode, Rect } from "./targets.ts";

export type SceneLayout = { flows: FlowInput[]; stackBox: Rect | null; mask: Rect[] };

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
    flow.nodes.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, kind: el.dataset.kind as FlowNode["kind"] });
    flows.set(id, flow);
  }

  const box = section.querySelector("[data-stack-box]");
  const mask = [...section.querySelectorAll("[data-mask]")].map(rect);
  // The header overlays every scene: its band is part of the mask too.
  const header = document.querySelector("header[data-mask]");
  if (header) {
    const b = header.getBoundingClientRect();
    mask.push({ x: b.left, y: b.top, w: b.width, h: b.height });
  }
  return { flows: [...flows.values()], stackBox: box ? rect(box) : null, mask };
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
    dark,
  };
}
