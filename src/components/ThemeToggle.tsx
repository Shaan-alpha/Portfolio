"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isLight = resolvedTheme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="fixed top-6 right-6 z-[1100] group"
      aria-label="Toggle Theme"
      style={{ transform: "translateZ(0)" }}
    >
      {/* Glow ring — visible only in light mode */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: isLight
            ? "0 0 40px 8px rgba(255,200,50,0.35), 0 0 80px 20px rgba(255,180,30,0.15)"
            : "0 0 0px 0px rgba(0,0,0,0)",
          scale: isLight ? 1.1 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* Button body */}
      <motion.div
        className="relative w-12 h-12 rounded-full flex items-center justify-center border overflow-hidden"
        animate={{
          backgroundColor: isLight
            ? "rgba(255, 240, 200, 0.95)"
            : "rgba(255, 255, 255, 0.05)",
          borderColor: isLight
            ? "rgba(255, 200, 50, 0.5)"
            : "rgba(255, 255, 255, 0.1)",
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isLight ? (
            <motion.div
              key="bulb-on"
              initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Lightbulb ON — glowing */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Rays */}
                <line x1="12" y1="1" x2="12" y2="3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="1" y1="12" x2="3" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="21" y1="12" x2="23" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                {/* Bulb body */}
                <path d="M9 21h6M10 17h4M15 8a3 3 0 0 0-6 0c0 2 2 3 2 5h2c0-2 2-3 2-5z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Inner glow */}
                <circle cx="12" cy="9" r="2" fill="rgba(245,158,11,0.4)" />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              key="bulb-off"
              initial={{ opacity: 0, scale: 0.5, rotate: 30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Lightbulb OFF — dim */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21h6M10 17h4M15 8a3 3 0 0 0-6 0c0 2 2 3 2 5h2c0-2 2-3 2-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
}
