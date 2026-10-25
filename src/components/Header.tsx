"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveSection } from "@/lib/useActiveSection";
import ThemeToggle from "./ThemeToggle";
import Mark from "./Mark";
import { profile } from "@/content/profile";

const NAV = [
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

const IDS = NAV.map((n) => n.id);

export default function Header() {
  const active = useActiveSection(IDS);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock the page behind it, move focus in, Escape closes and
  // hands focus back to the button that opened it. The page behind is made
  // inert, so Tab cannot wander into links hidden under the panel and screen
  // readers do not read through it.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    // The skip link goes too: it points into the page the panel is covering.
    const behind = [
      document.getElementById("main"),
      document.querySelector("body > footer"),
      document.querySelector('body > a[href="#main"]'),
    ];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    // rem, like Tailwind's md breakpoint, so a larger default font size moves
    // both together.
    const onResize = () => {
      if (window.matchMedia("(min-width: 48rem)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.style.overflow = prev;
      behind.forEach((el) => el?.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      data-scrolled={scrolled || open || undefined}
      className="sticky top-0 z-[1000] h-[var(--header)] border-b border-transparent bg-ground transition-[border-color] duration-200 data-[scrolled]:border-line"
    >
      <div className="container-x flex h-full items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2.5 rounded-md text-ink" onClick={() => setOpen(false)}>
          <Mark className="h-6 w-6" />
          <span className="semi text-[15px] font-bold tracking-[-0.01em]">{profile.name}</span>
        </a>

        <div className="flex items-center gap-1 md:gap-2">
          <nav aria-label="Sections" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const on = active === n.id;
                return (
                  <li key={n.id}>
                    <a
                      href={`#${n.id}`}
                      aria-current={on ? "location" : undefined}
                      className={`relative block rounded-md px-3 py-2 text-[15px] font-medium transition-colors ${
                        on ? "text-ink" : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      {n.label}
                      <span
                        aria-hidden
                        className={`absolute inset-x-3 -bottom-[1px] h-[2px] origin-left rounded-full bg-ink transition-transform duration-300 ease-[var(--ease)] ${
                          on ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <ThemeToggle />

          <button
            ref={menuButton}
            type="button"
            className="key key-secondary key-sm md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panel}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[var(--header)] overflow-y-auto bg-ground md:hidden"
      >
        <nav aria-label="Sections" className="container-x flex min-h-full flex-col justify-between gap-12 pb-10 pt-8">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.id} className="border-b border-line">
                <a
                  href={`#${n.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === n.id ? "location" : undefined}
                  className="t-h3 flex items-center justify-between py-5 text-ink"
                >
                  {n.label}
                  {active === n.id && <span className="h-2.5 w-2.5 rounded-full bg-ink" aria-hidden />}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 text-[15px] text-ink-2">
            <a className="link w-fit" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <div className="flex gap-5">
              <a className="link" href={profile.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a className="link" href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
