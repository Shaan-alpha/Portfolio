"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Use values directly for immediate response (no lag)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Only the outer ring has a spring, to follow the inner dot smoothly
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const ringX = useSpring(cursorX, springConfig);
  const ringY = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setIsMobile(false);
    }

    const moveCursor = (e: MouseEvent) => {
      // Adjust exactly by half the size to avoid using translateY/X in CSS which can conflict
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
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
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-color-blue rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          marginLeft: "-4px",
          marginTop: "-4px",
          willChange: "transform"
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border-[1.5px] border-color-blue/50 rounded-full pointer-events-none z-[9998] flex items-center justify-center"
        style={{
          x: ringX,
          y: ringY,
          marginLeft: "-16px",
          marginTop: "-16px",
          willChange: "transform, width, height"
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          borderColor: isHovering ? "rgba(191, 90, 242, 0.6)" : "rgba(10, 132, 255, 0.5)",
          backgroundColor: isHovering ? "rgba(191, 90, 242, 0.05)" : "rgba(191, 90, 242, 0)"
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
    </>
  );
}
