"use client";

import { motion } from "framer-motion";

/** A flat rule that draws itself in as it scrolls into view. Previously a
 *  gradient hairline, which contradicted the site's own no-gradient rule —
 *  this carries the same beat using a border the theme already defines. */
export default function SectionDivider() {
  return (
    <div className="relative z-10 max-w-[1200px] mx-auto px-[5vw]" aria-hidden>
      <motion.div
        className="h-px w-full origin-left bg-border2"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />
    </div>
  );
}
