"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function Certifications() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 36, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as any } }
  };

  const certs = [
    {
      logo: "🪟", org: "Microsoft", name: "Fundamentals of Machine Learning", date: "December 26, 2023",
      badge: { text: "Verified", color: "text-color-blue", bg: "bg-color-blue/10", border: "border-color-blue/20" }
    },
    {
      logo: "🪟", org: "Microsoft", name: "Fundamental AI Concepts", date: "December 26, 2023",
      badge: { text: "Verified", color: "text-color-blue", bg: "bg-color-blue/10", border: "border-color-blue/20" }
    },
    {
      logo: "🌐", org: "CISCO Networking Academy", name: "Introduction to Cybersecurity", date: "Networking Academy Program",
      badge: { text: "Completed", color: "text-color-green", bg: "bg-color-green/10", border: "border-color-green/20" }
    },
    {
      logo: "🌐", org: "CISCO Networking Academy", name: "Cybersecurity Essentials", date: "Networking Academy Program",
      badge: { text: "Completed", color: "text-color-green", bg: "bg-color-green/10", border: "border-color-green/20" }
    },
    {
      logo: "🏆", org: "IEEE", name: "2nd Position — Debate Competition", date: "IEEE Student Chapter",
      badge: { text: "🥈 Runner-up", color: "text-color-orange", bg: "bg-color-orange/10", border: "border-color-orange/20" }
    },
    {
      logo: "✅", org: "micro1", name: "Data Science, AI/ML Engineer & Data Engineer", date: "May 3, 2026",
      badge: { text: "AI Certified", color: "text-color-green", bg: "bg-color-green/10", border: "border-color-green/20" },
      style: "bg-gradient-to-br from-color-green/5 to-color-teal/5 border-color-green/15"
    },
    {
      logo: "🎯", org: "Hobbies & Interests", name: "Movies · Music · Exploring History", date: "Always curious, always learning",
      badge: { text: "Personal", color: "text-color-purple", bg: "bg-color-purple/10", border: "border-color-purple/20" },
      style: "bg-gradient-to-br from-color-blue/5 to-color-purple/5 border-color-blue/15"
    }
  ];

  return (
    <section id="certifications" className="py-16 sm:py-[120px] bg-bg1 relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          {/* Education first */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">Where I study</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5"><span className="grad-purple">Education</span></motion.h2>

          <motion.div variants={itemVariants} className="bg-glass border border-border rounded-[22px] p-5 sm:p-9 mt-10 sm:mt-[60px] mb-16 sm:mb-[120px] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center transition-[transform,background-color,border-color,color,box-shadow] duration-400 hover:border-border2 hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(10,132,255,0.06),transparent_60%)] pointer-events-none"></div>
            <div className="relative z-10">
              <div className="font-display text-[20px] sm:text-[26px] font-extrabold mb-1.5">Jaipur Engineering College<br/>and Research Center</div>
              <div className="text-[13px] sm:text-[15px] text-muted2 mb-3.5">Bachelor of Technology in Computer Science & Engineering</div>
              <div className="flex gap-5 flex-wrap">
                <div className="flex items-center gap-1.5 text-[13px] text-muted">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Nov 2022 – Present
                </div>
              </div>
            </div>
            <div className="relative z-10 text-center bg-gradient-to-br from-color-blue/10 to-color-purple/10 border border-border2 rounded-[22px] py-4 px-6 sm:py-6 sm:px-8 flex flex-col items-center">
              <div className="font-display text-[32px] sm:text-[42px] font-black grad-blue">7.39</div>
              <div className="text-[12px] text-muted mt-0.5">CGPA</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">Credentials & wins</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Certs & <span className="grad-blue">Achievements</span></motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 mt-[60px]">
            {certs.map((cert, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className={`bg-glass border border-border rounded-[22px] p-6 transition-[transform,background-color,border-color,color,box-shadow] duration-400 flex flex-col gap-3 hover:bg-glass2 hover:border-border2 hover:-translate-y-1.5 shadow-card hover:shadow-card-hover ${cert.style || ""}`}
              >
                <div className="text-[36px] leading-none">{cert.logo}</div>
                <div className="text-[11px] font-mono text-muted tracking-[0.05em] uppercase">{cert.org}</div>
                <div className="font-display text-[14px] sm:text-[16px] font-bold leading-[1.3]">{cert.name}</div>
                <div className="text-[12px] text-muted">{cert.date}</div>
                <div className={`mt-auto self-start text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-[0.05em] border ${cert.badge.bg} ${cert.badge.border} ${cert.badge.color}`}>
                  {cert.badge.text}
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </section>
  );
}
