"use client";

import { motion, useScroll, useSpring } from "framer-motion";

// Thin gradient bar at the very top that tracks overall page scroll progress.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[1200] origin-left bg-gradient-to-r from-color-blue via-color-purple to-color-pink"
      style={{ scaleX }}
    />
  );
}
