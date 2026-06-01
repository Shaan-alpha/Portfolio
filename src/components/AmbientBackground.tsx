"use client";

import { motion, useReducedMotion } from "framer-motion";

// Slow-drifting accent blobs that add depth behind the content sections.
// Scoped (absolute) to the content wrapper so they never touch the hero canvas.
const BLOBS = [
  {
    style: { top: "4%", left: "-6%", width: 460, height: 460, background: "var(--color-blue)", opacity: 0.1 },
    drift: { x: [0, 40, 0], y: [0, 28, 0] },
    duration: 17,
  },
  {
    style: { top: "38%", right: "-8%", left: "auto", width: 520, height: 520, background: "var(--color-purple)", opacity: 0.09 },
    drift: { x: [0, -36, 0], y: [0, 36, 0] },
    duration: 21,
  },
  {
    style: { top: "74%", left: "12%", width: 420, height: 420, background: "var(--color-pink)", opacity: 0.08 },
    drift: { x: [0, 30, 0], y: [0, -30, 0] },
    duration: 19,
  },
];

export default function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className="ambient-blob"
          style={blob.style as React.CSSProperties}
          animate={reduceMotion ? undefined : blob.drift}
          transition={{ duration: blob.duration, ease: "easeInOut", repeat: Infinity }}
        />
      ))}
    </div>
  );
}
