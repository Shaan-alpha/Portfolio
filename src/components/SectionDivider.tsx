"use client";

import { motion } from "framer-motion";

// A thin gradient hairline that draws itself in as it scrolls into view.
export default function SectionDivider() {
  return (
    <div className="relative z-10 max-w-[1200px] mx-auto px-[5vw]" aria-hidden>
      <motion.div
        className="h-px w-full origin-center bg-gradient-to-r from-transparent via-border2 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      />
    </div>
  );
}
