"use client";

import HeroNetworkCanvas from "./HeroNetworkCanvas";
import TypedLine from "./TypedLine";
import { BUILD_SHA } from "@/lib/buildInfo";

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden grid-bg">
      {/* A mask, not a gradient scrim: it paints no color of its own, so it cannot
          band or tint the graph in either theme. */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
        }}
      >
        <HeroNetworkCanvas />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-[5vw] w-full">
        <div className="eyebrow mb-5">whoami</div>
        <h1 className="display">
          Shaan Satsangi<span className="accent">.</span>
        </h1>
        <p className="mono text-[clamp(13px,1.8vw,18px)] text-muted2 mt-6">
          <span className="accent">&gt; </span>
          <TypedLine phrases={["ai systems engineer", "multi-agent orchestration", "rag, retrieval & mcp tooling", "langchain / langgraph", "creator of skill issue", "systems, not demos"]} />
        </p>

        <div className="flex flex-wrap gap-3 mt-9">
          <a
            href="#projects"
            className="mono text-[13px] px-5 py-2.5 border border-accent text-accent hover:bg-accent hover:text-background transition-colors duration-200 rounded-[var(--r)]"
          >
            [ view projects ]
          </a>
          <a
            href="mailto:shaansatsangi@gmail.com"
            className="mono text-[13px] px-5 py-2.5 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]"
          >
            [ say hello ]
          </a>
          <a
            href="https://github.com/Shaan-alpha"
            target="_blank"
            rel="noreferrer"
            className="mono text-[13px] px-5 py-2.5 border border-border2 text-muted2 hover:text-foreground hover:border-foreground/40 transition-colors duration-200 rounded-[var(--r)]"
          >
            [ github ]
          </a>
        </div>

        {/* Stamped from git at build time — the boot line the old fake preloader
            was only pretending to be. */}
        <div className="mono text-[10.5px] text-muted mt-8">
          <span className="accent">build</span> {BUILD_SHA} · static export · cloudflare workers
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 mono text-[10px] tracking-[0.2em] uppercase text-muted">
        scroll ↓
      </div>
    </section>
  );
}
