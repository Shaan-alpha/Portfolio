"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from "framer-motion";

const FRAME_COUNT = 240;

const getFramePath = (index: number) => {
  const paddedIndex = index.toString().padStart(3, "0");
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/frames/ezgif-frame-${paddedIndex}.png`;
};

export default function CanvasScrollSequence({ children }: { children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastRenderedRef = useRef<number>(-1);
  const rafIdRef = useRef<number>(0);
  
  const [loaded, setLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Basic frame index based on scroll
  const rawFrameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);
  
  // ADD SPRING: This makes the frame index change smoothly with momentum
  const smoothFrameIndex = useSpring(rawFrameIndex, {
    damping: 35,
    stiffness: 300,
    mass: 0.2
  });

  const drawImage = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
    if (!img.complete || img.naturalWidth === 0) return;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const x = (w - img.naturalWidth * scale) / 2;
    const y = (h - img.naturalHeight * scale) / 2;
    ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
  }, []);

  const renderInterpolated = useCallback((floatIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const clamped = Math.max(1, Math.min(FRAME_COUNT, floatIndex));
    const floor = Math.floor(clamped);
    const ceil = Math.min(FRAME_COUNT, floor + 1);
    const blend = clamped - floor;

    // Quantize to avoid over-drawing if change is microscopic
    const quantized = Math.round(clamped * 100);
    if (quantized === lastRenderedRef.current) return;
    lastRenderedRef.current = quantized;

    const imgA = imagesRef.current[floor];
    const imgB = imagesRef.current[ceil];

    if (!imgA) return;

    // Fast path: No blending if at integer frame or near it
    if (!imgB || blend < 0.05 || floor === ceil) {
      ctx.globalAlpha = 1;
      drawImage(ctx, imgA, w, h);
    } else {
      // Draw A then B with alpha for smooth crossfade
      drawImage(ctx, imgA, w, h);
      ctx.globalAlpha = blend;
      drawImage(ctx, imgB, w, h);
      ctx.globalAlpha = 1;
    }
  }, [drawImage]);

  // Preload images
  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      const first = new Image();
      first.src = getFramePath(1);
      try { await first.decode(); } catch {}
      if (cancelled) return;
      imagesRef.current[1] = first;
      setLoaded(true);
      renderInterpolated(1);

      for (let b = 2; b <= FRAME_COUNT; b += 12) {
        if (cancelled) return;
        const batch = [];
        for (let i = b; i < Math.min(b + 12, FRAME_COUNT + 1); i++) {
          const img = new Image();
          img.src = getFramePath(i);
          batch.push(img.decode().then(() => {
            if (!cancelled) imagesRef.current[i] = img;
          }).catch(() => {}));
        }
        await Promise.all(batch);
      }
    };

    preload();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use the SPRING index for rendering
  useMotionValueEvent(smoothFrameIndex, "change", (latest) => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      renderInterpolated(latest);
    });
  });

  // Resize
  useEffect(() => {
    const setSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        lastRenderedRef.current = -1;
        renderInterpolated(smoothFrameIndex.get());
      }
    };
    setSize();
    
    let timer: NodeJS.Timeout;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(setSize, 100); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(timer); window.removeEventListener("resize", onResize); };
  }, [smoothFrameIndex, renderInterpolated]);

  return (
    <div ref={containerRef} className="relative w-full h-[600vh]">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full canvas-filter-wrap"
          style={{ 
            opacity: loaded ? 1 : 0,
            willChange: "transform, opacity",
            transform: "translateZ(0)"
          }}
        />
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />
      </div>
    </div>
  );
}
