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
      className={`fixed top-[18px] left-1/2 z-[1000] flex items-center gap-0.5 rounded-full border border-border p-1 sm:p-1.5 transition-[background-color,border-color] duration-300 max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar ${
        scrolled ? "bg-bg1/95 border-border2" : "bg-bg1/80"
      }`}
      style={{ transform: "translateX(-50%) translateZ(0)", backfaceVisibility: "hidden" }}
    >
      {navLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className={`relative px-2.5 sm:px-3.5 py-1.5 rounded-full mono text-[11px] sm:text-[12px] tracking-[0.01em] transition-colors duration-300 whitespace-nowrap ${
            activeSection === link.id ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          {activeSection === link.id && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 rounded-full bg-accent/12 -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          )}
          {link.name}
        </a>
      ))}
    </nav>
  );
}
