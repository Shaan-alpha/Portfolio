"use client";

import { useEffect, useRef, useCallback } from "react";
import { useScroll, useTransform, useMotionValueEvent, useSpring } from "framer-motion";
import { useFrameLoader, FRAME_COUNT } from "./FrameLoaderProvider";

export default function CanvasScrollSequence({ children }: { children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRenderedRef = useRef<number>(-1);
  const rafIdRef = useRef<number>(0);

  // Frames + readiness now come from the shared loader (single source of truth).
  const { imagesRef, ready } = useFrameLoader();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const rawFrameIndex = useTransform(scrollYProgress, [0, 1], [1, FRAME_COUNT]);

  const smoothFrameIndex = useSpring(rawFrameIndex, {
    damping: 40,
    stiffness: 200,
    mass: 0.3,
  });

  const drawImage = useCallback(
    (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
      if (!img.complete || img.naturalWidth === 0) return;
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const x = (w - img.naturalWidth * scale) / 2;
      const y = (h - img.naturalHeight * scale) / 2;
      ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
    },
    []
  );

  const renderFrame = useCallback(
    (floatIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      const clamped = Math.max(1, Math.min(FRAME_COUNT, floatIndex));
      const floor = Math.floor(clamped);
      const ceil = Math.min(FRAME_COUNT, floor + 1);
      const blend = clamped - floor;

      const quantized = Math.round(clamped * 50);
      if (quantized === lastRenderedRef.current) return;

      const imgA = imagesRef.current[floor];
      const imgB = imagesRef.current[ceil];

      if (!imgA) return;
      // Only mark as rendered once we actually have a frame to draw, so a later
      // background-loaded frame still gets painted when the user reaches it.
      lastRenderedRef.current = quantized;

      if (!imgB || blend < 0.05 || floor === ceil) {
        ctx.globalAlpha = 1;
        drawImage(ctx, imgA, w, h);
      } else {
        drawImage(ctx, imgA, w, h);
        ctx.globalAlpha = blend;
        drawImage(ctx, imgB, w, h);
        ctx.globalAlpha = 1;
      }
    },
    [drawImage, imagesRef]
  );

  // Paint the first frame as soon as the loader says we're ready.
  useEffect(() => {
    if (ready) {
      lastRenderedRef.current = -1;
      renderFrame(smoothFrameIndex.get());
    }
  }, [ready, renderFrame, smoothFrameIndex]);

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
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(setSize, 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [smoothFrameIndex, renderFrame]);

  return (
    <div ref={containerRef} className="relative w-full h-[600vh]">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
        <div className="absolute inset-0 bg-background z-0" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full canvas-filter-wrap z-10"
          style={{
            opacity: ready ? 1 : 0,
            transition: "opacity 0.6s ease",
            willChange: "transform",
            transform: "translateZ(0)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none z-20">{children}</div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none z-30" />
      </div>
    </div>
  );
}
