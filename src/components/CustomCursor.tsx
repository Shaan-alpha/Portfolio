"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Dot follows instantly; the ring trails with a slight spring lag.
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const ringConfig = { damping: 28, stiffness: 380, mass: 0.4 };
  const ringX = useSpring(cursorX, ringConfig);
  const ringY = useSpring(cursorY, ringConfig);

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
      {/* Outline ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-color-blue/60 pointer-events-none z-[9998]"
        style={{ x: ringX, y: ringY, marginLeft: -16, marginTop: -16, willChange: "transform" }}
        animate={{ scale: isHovering ? 1.6 : 1, opacity: isHovering ? 1 : 0.65 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      {/* Center dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-color-blue pointer-events-none z-[9999]"
        style={{ x: cursorX, y: cursorY, marginLeft: -3, marginTop: -3, willChange: "transform" }}
        animate={{ scale: isHovering ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
