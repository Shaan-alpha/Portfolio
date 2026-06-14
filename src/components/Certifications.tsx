"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Award, ShieldCheck, Trophy, BadgeCheck, Compass } from "lucide-react";

type Cert = {
  Icon: React.ComponentType<{ className?: string }>;
  org: string;
  name: string;
  date: string;
  badge: string;
};

export default function Certifications() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const certs: Cert[] = [
    { Icon: Award, org: "Microsoft", name: "Fundamentals of Machine Learning", date: "Dec 2023", badge: "verified" },
    { Icon: Award, org: "Microsoft", name: "Fundamental AI Concepts", date: "Dec 2023", badge: "verified" },
    { Icon: ShieldCheck, org: "CISCO Networking Academy", name: "Introduction to Cybersecurity", date: "Networking Academy", badge: "completed" },
    { Icon: ShieldCheck, org: "CISCO Networking Academy", name: "Cybersecurity Essentials", date: "Networking Academy", badge: "completed" },
    { Icon: Trophy, org: "IEEE", name: "2nd Position — Debate Competition", date: "IEEE Student Chapter", badge: "runner-up" },
    { Icon: BadgeCheck, org: "micro1", name: "Data Science, AI/ML & Data Engineer", date: "May 2026", badge: "ai certified" },
    { Icon: Compass, org: "Interests", name: "Movies · Music · History", date: "Always curious", badge: "personal" },
  ];

  return (
    <section id="certifications" className="py-16 sm:py-[120px] bg-bg1 relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          {/* Education */}
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">education</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">
            <span className="accent">Education</span>
          </motion.h2>

          <motion.div variants={itemVariants} className="bg-surface border border-border rounded-[var(--r2)] p-5 sm:p-9 mt-10 sm:mt-[60px] mb-16 sm:mb-[120px] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center transition-colors duration-300 hover:border-accent/50">
            <div>
              <div className="font-display text-[20px] sm:text-[26px] font-bold mb-1.5">Jaipur Engineering College<br />and Research Center</div>
              <div className="text-[13px] sm:text-[15px] text-muted2 mb-3.5">B.Tech in Computer Science & Engineering</div>
              <div className="flex items-center gap-1.5 mono text-[12px] text-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Nov 2022 – Present
              </div>
            </div>
            <div className="text-center bg-bg2 border border-border2 rounded-[var(--r2)] py-4 px-6 sm:py-6 sm:px-8 flex flex-col items-center">
              <div className="font-display text-[32px] sm:text-[42px] font-bold accent">7.39</div>
              <div className="mono text-[11px] text-muted mt-0.5">CGPA</div>
            </div>
          </motion.div>

          {/* Certs */}
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">credentials</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">
            Certs & <span className="accent">achievements</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-[60px]">
            {certs.map((cert, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-surface border border-border rounded-[var(--r2)] p-6 transition-colors duration-300 flex flex-col gap-3 hover:border-accent/50"
              >
                <cert.Icon className="w-7 h-7 text-accent" />
                <div className="mono text-[11px] text-muted tracking-[0.05em] uppercase">{cert.org}</div>
                <div className="font-display text-[14px] sm:text-[16px] font-bold leading-[1.3]">{cert.name}</div>
                <div className="mono text-[12px] text-muted">{cert.date}</div>
                <div className="mt-auto self-start mono text-[10px] px-2 py-0.5 border border-accent text-accent">
                  [ {cert.badge} ]
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
