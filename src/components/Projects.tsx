"use client";

import { motion } from "framer-motion";

export default function Projects() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 36, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as any } }
  };

  const projects = [
    {
      id: "youtube-wrapped",
      icon: "🎬",
      date: "May 2025",
      title: "YouTube Wrapped — Data Pipeline",
      desc: "A personal 'Spotify Wrapped' for YouTube. End-to-end data pipeline that transforms Google Takeout exports into a polished year-in-review analytics dashboard.",
      tags: ["Databricks", "Delta Lake", "FastAPI", "Next.js", "Neon Postgres"],
      bullets: [
        "Medallion lakehouse pipeline (Bronze → Silver → Gold) in Databricks with Delta Lake tables",
        "FastAPI backend on Render serving analytics from Neon Postgres fact tables",
        "Next.js dashboard with animated cards, genre splits, binge sessions & listening rhythm charts"
      ],
      link: "https://github.com/Shaan-alpha/youtube-wrapped",
      colors: {
        bg: "bg-gradient-to-br from-[#1a0005] to-[#330010]",
        accent: "var(--color-pink)",
        glow: "var(--color-pink-glow)",
        badgeBg: "bg-[rgba(255,55,95,0.1)]",
        badgeBorder: "border-[rgba(255,55,95,0.2)]",
        badgeText: "text-color-pink"
      }
    },
    {
      id: "jarvis",
      icon: "🤖",
      date: "Oct 2025",
      title: "JARVIS — AI Voice Bot",
      desc: "A locally-trained voice assistant built entirely without external AI APIs. Performs intelligent actions via speech recognition and intent classification.",
      tags: ["Python", "TensorFlow", "Keras", "Speech Recognition", "NLP"],
      bullets: [
        "Deployed a locally trained ML model for intent classification without external AI APIs",
        "Implemented speech recognition, intent classification & system automation in one integrated pipeline",
        "Built on Python + TensorFlow + NLP for real-time command processing"
      ],
      link: "https://github.com/Shaan-alpha/jarvis-py",
      colors: {
        bg: "bg-gradient-to-br from-[#050d1f] to-[#0a1a3a]",
        accent: "var(--color-blue)",
        glow: "var(--color-blue-glow)",
        badgeBg: "bg-[rgba(10,132,255,0.1)]",
        badgeBorder: "border-[rgba(10,132,255,0.2)]",
        badgeText: "text-color-blue"
      }
    },
    {
      id: "review-reader",
      icon: "📝",
      date: "Aug 2025",
      title: "Review Reader — Sentiment Analysis",
      desc: "A high-accuracy NLP pipeline that classifies sentiments across 1,000+ reviews in milliseconds using classical ML with advanced text preprocessing.",
      tags: ["Python", "Pandas", "Scikit-learn", "TF-IDF", "Jupyter"],
      bullets: [
        "Pipeline handling 1,000+ reviews at 85% accuracy using Scikit-learn & Pandas",
        "Classifies sentiments in under 0.5 seconds per review via Jupyter Notebook",
        "TF-IDF vectorization, tokenization & stop-word removal boosted precision by 20%"
      ],
      link: "https://github.com/Shaan-alpha",
      colors: {
        bg: "bg-gradient-to-br from-[#130820] to-[#200d35]",
        accent: "var(--color-purple)",
        glow: "var(--color-purple-glow)",
        badgeBg: "bg-[rgba(191,90,242,0.1)]",
        badgeBorder: "border-[rgba(191,90,242,0.2)]",
        badgeText: "text-color-purple"
      }
    },
    {
      id: "sahara",
      icon: "🛡️",
      date: "Feb 2025",
      title: "Sahara — Women Safety App",
      desc: "A mobile-first safety web app with gesture-based SOS, real-time location tracking, and Twilio-powered alerts to trusted contacts — all backed by Supabase.",
      tags: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "Twilio", "MapLibre"],
      bullets: [
        "Gesture-based SOS trigger with real-time location tracking via MapLibre GL",
        "Supabase (Postgres + auth) backend with row-level security and PLpgSQL functions",
        "Twilio-powered SMS alerts dispatched to saved trusted contacts on emergency"
      ],
      link: "https://github.com/Shaan-alpha/Sahaara_APP",
      liveLink: "https://sahaara-app.vercel.app/",
      colors: {
        bg: "bg-gradient-to-br from-[#1f060c] to-[#350a14]",
        accent: "var(--color-pink)",
        glow: "var(--color-pink-glow)",
        badgeBg: "bg-[rgba(255,55,95,0.1)]",
        badgeBorder: "border-[rgba(255,55,95,0.2)]",
        badgeText: "text-color-pink"
      }
    },
    {
      id: "facefilter",
      icon: "👁️",
      date: "2025",
      title: "FaceFilter AI — Facial Recognition",
      desc: "A locally-run face-recognition platform that detects, matches, and organizes photos by face — no cloud uploads, no API keys.",
      tags: ["Python", "Flask", "OpenCV DNN", "SQLite", "SSE"],
      bullets: [
        "YuNet face detection + SFace 128-dimensional embeddings (ONNX) with cosine-similarity matching at a configurable threshold",
        "Caches pre-computed embeddings keyed on file hash to eliminate redundant inference",
        "Real-time progress streaming via Server-Sent Events; three-table SQLite schema for resumable runs"
      ],
      link: "https://github.com/Shaan-alpha/face-sort-studio",
      colors: {
        bg: "bg-gradient-to-br from-[#041515] to-[#082525]",
        accent: "var(--color-teal)",
        glow: "var(--color-teal-glow)",
        badgeBg: "bg-[rgba(90,200,250,0.1)]",
        badgeBorder: "border-[rgba(90,200,250,0.25)]",
        badgeText: "text-color-teal"
      }
    }
  ];

  return (
    <section id="projects" className="py-16 sm:py-[120px] relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">What I&apos;ve built</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Featured <span className="grad-blue">Projects</span></motion.h2>
          <motion.p variants={itemVariants} className="text-[15px] lg:text-[17px] leading-[1.75] text-muted2 max-w-[560px]">End-to-end projects spanning AI, NLP, mobile, and automation — all real, all shipped.</motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5 mt-[60px]">
            {projects.map((proj, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                style={{ "--proj-accent": proj.colors.accent, "--proj-glow": proj.colors.glow } as React.CSSProperties}
                className={`bg-glass border border-border rounded-[22px] overflow-hidden transition-[transform,background-color,border-color,color,box-shadow] duration-500 transform-gpu hover:-translate-y-3 hover:border-border2 shadow-card hover:shadow-card-hover flex flex-col ${i === 0 ? 'md:col-span-2' : ''}`}
              >
                <div className={`h-[120px] sm:h-[180px] flex items-center justify-center text-[48px] sm:text-[68px] relative overflow-hidden ${proj.colors.bg}`}>
                  {proj.icon}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/100"></div>
                </div>
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full mb-3 self-start ${proj.colors.badgeBg} border ${proj.colors.badgeBorder} ${proj.colors.badgeText}`}>
                    ● {proj.date}
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-3.5">
                    {proj.tags.map(t => (
                      <span key={t} className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full bg-white/5 border border-border text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="font-display text-[18px] sm:text-[22px] font-extrabold mb-2.5">{proj.title}</div>
                  <div className="text-[12.5px] sm:text-[13.5px] text-muted leading-[1.7] mb-5">{proj.desc}</div>
                  <ul className="flex flex-col gap-1.5 mb-5.5 flex-1">
                    {proj.bullets.map((b, bi) => (
                      <li key={bi} className="text-[11.5px] sm:text-[12.5px] text-muted leading-[1.5] pl-3 sm:pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[var(--proj-accent)]">
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2.5 mt-auto flex-wrap">
                    <a href={proj.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-medium px-4.5 py-2 rounded-full text-white bg-[var(--proj-accent)] transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:shadow-[0_0_32px_var(--proj-glow)] hover:scale-105">
                      View on GitHub ↗
                    </a>
                    {(proj as any).liveLink && (
                      <a href={(proj as any).liveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12px] font-medium px-4.5 py-2 rounded-full border border-[var(--proj-accent)] text-[var(--proj-accent)] transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:bg-[var(--proj-accent)] hover:text-white hover:scale-105">
                        Live Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </section>
  );
}
