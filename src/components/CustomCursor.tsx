"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Dot follows instantly; the glow halo lags behind for an ambient spotlight.
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const glowConfig = { damping: 26, stiffness: 260, mass: 0.6 };
  const glowX = useSpring(cursorX, glowConfig);
  const glowY = useSpring(cursorY, glowConfig);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsMobile(false);
    }

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(!!(target.closest("a") || target.closest("button")));
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <>
      {/* Soft indigo spotlight glow (trails the cursor) */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998]"
        style={{
          x: glowX,
          y: glowY,
          width: 230,
          height: 230,
          marginLeft: -115,
          marginTop: -115,
          background: "radial-gradient(circle, var(--color-blue-glow) 0%, transparent 58%)",
          filter: "blur(10px)",
          willChange: "transform",
        }}
        animate={{ scale: isHovering ? 1.55 : 1, opacity: isHovering ? 0.95 : 0.6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      {/* Crisp center dot (instant) */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-[9999] bg-color-blue"
        style={{
          x: cursorX,
          y: cursorY,
          marginLeft: -3,
          marginTop: -3,
          willChange: "transform",
          boxShadow: "0 0 8px 1px var(--color-blue-glow)",
        }}
        animate={{ scale: isHovering ? 2.4 : 1 }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
