"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; r: number };
type Packet = { from: number; to: number; t: number; speed: number };

// A layered node graph (pipeline columns: source -> bronze -> silver -> gold -> sink)
// with packets flowing left->right. Phosphor on near-black. Reduced-motion paints once.
export default function HeroNetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3fb950";

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const COLS = 5;
    const PER = [2, 4, 4, 3, 1];
    let nodes: Node[] = [];
    let edges: [number, number][] = [];
    let packets: Packet[] = [];

    const build = () => {
      nodes = [];
      edges = [];
      const colStarts: number[] = [];
      for (let c = 0; c < COLS; c++) {
        colStarts[c] = nodes.length;
        const n = PER[c];
        for (let i = 0; i < n; i++) {
          nodes.push({
            x: ((c + 0.5) / COLS) * w,
            y: ((i + 0.5) / n) * h * 0.7 + h * 0.15,
            r: c === 0 || c === COLS - 1 ? 3.5 : 2.5,
          });
        }
      }
      for (let c = 0; c < COLS - 1; c++) {
        const a0 = colStarts[c];
        const a1 = colStarts[c + 1];
        const an = PER[c];
        const bn = PER[c + 1];
        for (let i = 0; i < an; i++) {
          for (let j = 0; j < bn; j++) {
            if ((i + j) % 2 === 0) edges.push([a0 + i, a1 + j]);
          }
        }
      }
      packets = edges.map((e, i) => ({
        from: e[0],
        to: e[1],
        t: (i % 7) / 7,
        speed: 0.0016 + (i % 5) * 0.0004,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.12;
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = accent;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of packets) {
        const a = nodes[p.from];
        const b = nodes[p.to];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) draw();
    };

    const tick = () => {
      for (const p of packets) {
        p.t += p.speed;
        if (p.t > 1) p.t -= 1;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 w-full h-full" />;
}
