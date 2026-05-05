"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from "framer-motion";

const FRAME_COUNT = 240;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const getFramePath = (index: number) => {
  const paddedIndex = index.toString().padStart(3, "0");
  return `${BASE_PATH}/frames-webp/frame-${paddedIndex}.webp`;
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

  const rawFrameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

  const smoothFrameIndex = useSpring(rawFrameIndex, {
    damping: 40,
    stiffness: 200,
    mass: 0.3
  });

  const drawImage = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
    if (!img.complete || img.naturalWidth === 0) return;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const x = (w - img.naturalWidth * scale) / 2;
    const y = (h - img.naturalHeight * scale) / 2;
    ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
  }, []);

  const renderFrame = useCallback((floatIndex: number) => {
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

    const quantized = Math.round(clamped * 50);
    if (quantized === lastRenderedRef.current) return;
    lastRenderedRef.current = quantized;

    const imgA = imagesRef.current[floor];
    const imgB = imagesRef.current[ceil];

    if (!imgA) return;

    if (!imgB || blend < 0.05 || floor === ceil) {
      ctx.globalAlpha = 1;
      drawImage(ctx, imgA, w, h);
    } else {
      drawImage(ctx, imgA, w, h);
      ctx.globalAlpha = blend;
      drawImage(ctx, imgB, w, h);
      ctx.globalAlpha = 1;
    }
  }, [drawImage]);

  // Preload all frames — small WebP files load fast in parallel
  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      // Load first frame immediately to show something
      const first = new Image();
      first.src = getFramePath(1);
      try { await first.decode(); } catch {}
      if (cancelled) return;
      imagesRef.current[1] = first;
      setLoaded(true);
      renderFrame(1);

      // Load remaining frames in larger parallel batches (files are small now)
      const BATCH_SIZE = 30;
      for (let b = 2; b <= FRAME_COUNT; b += BATCH_SIZE) {
        if (cancelled) return;
        const batch = [];
        for (let i = b; i < Math.min(b + BATCH_SIZE, FRAME_COUNT + 1); i++) {
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

  useMotionValueEvent(smoothFrameIndex, "change", (latest) => {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      renderFrame(latest);
    });
  });

  // Resize
  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const setSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastRenderedRef.current = -1;
      renderFrame(smoothFrameIndex.get());
    };
    setSize();

    let timer: NodeJS.Timeout;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(setSize, 100); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(timer); window.removeEventListener("resize", onResize); };
  }, [smoothFrameIndex, renderFrame]);

  return (
    <div ref={containerRef} className="relative w-full h-[600vh]">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full canvas-filter-wrap"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
            willChange: "transform",
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
