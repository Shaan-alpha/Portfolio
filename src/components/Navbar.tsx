"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const isScrolled = latest > 80;
    setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    
    // Explicitly set home if we are at the top
    if (latest < 100) {
      setActiveSection("home");
    }
  });

  useEffect(() => {
    // Use IntersectionObserver instead of expensive getBoundingClientRect on scroll
    const sections = ["home", "about", "skills", "projects", "internships", "certifications", "contact"];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-40% 0px -40% 0px", // Trigger when section is in the middle of the viewport
        threshold: 0,
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      sections.forEach((id) => {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      });
    };
  }, []);

  const navLinks = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Skills", id: "skills" },
    { name: "Projects", id: "projects" },
    { name: "Experience", id: "internships" },
    { name: "Certs", id: "certifications" },
    { name: "Contact", id: "contact" },
  ];

  return (
    <nav
      className={`fixed top-[18px] left-1/2 z-[1000] flex items-center gap-0.5 rounded-full border border-border p-1 sm:p-1.5 shadow-nav transition-[background-color,border-color] duration-300 max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar ${
        scrolled ? "bg-bg1/95" : "bg-bg1/80"
      }`}
      style={{ transform: "translateX(-50%) translateZ(0)", backfaceVisibility: "hidden" }}
    >
      <div className="w-[7px] h-[7px] rounded-full bg-color-green ml-1 mr-1.5 sm:mr-2 shrink-0 shadow-[0_0_10px_var(--color-green)] animate-[statusPulse_2.5s_ease-in-out_infinite]"></div>

      {navLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={`relative px-2.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-[13px] font-medium tracking-[0.015em] transition-colors duration-300 whitespace-nowrap ${
            activeSection === link.id ? "text-foreground bg-white/10" : "text-muted hover:text-foreground"
          }`}
        >
          {activeSection === link.id && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 rounded-full bg-white/10 -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {link.name}
        </a>
      ))}
    </nav>
  );
}
