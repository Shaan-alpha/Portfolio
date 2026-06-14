"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function Experience() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const experiences = [
    {
      period: "Jul 2024 – Aug 2024",
      company: "Upflairs Pvt. Ltd.",
      role: "Data Science with AI/ML in Python",
      location: "Jaipur, Rajasthan",
      bullets: [
        "Built ML classification and prediction models using Python with real-world datasets",
        "Cleaned, analyzed & engineered features to extract key business insights from raw data",
        "Worked on practical projects leveraging Scikit-learn, Pandas, and data visualization libraries",
      ],
    },
    {
      period: "Aug 2023 – Sep 2023",
      company: "Upflairs Pvt. Ltd.",
      role: "Frontend Web Development",
      location: "Jaipur, Rajasthan",
      bullets: [
        "Designed fully responsive web pages using HTML, CSS, and Bootstrap framework",
        "Improved UI/UX through clean, accessible layouts and user-centered design principles",
        "Delivered polished frontend interfaces for client-facing products",
      ],
    },
  ];

  return (
    <section id="internships" className="py-16 sm:py-[120px] bg-bg1 relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">experience</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">
            Internship <span className="accent">journey</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[60px]">
            {experiences.map((exp, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-surface border border-border rounded-[var(--r2)] p-5 sm:p-8 transition-colors duration-300 hover:border-accent/50"
              >
                <div className="mono text-[11px] text-muted mb-3.5 flex items-center gap-2">
                  <span className="accent">›</span> {exp.period}
                </div>
                <div className="font-display text-[18px] sm:text-[22px] font-bold mb-1">{exp.company}</div>
                <div className="text-[13px] sm:text-[14px] text-muted2 mb-4">{exp.role}</div>
                <div className="inline-flex items-center gap-1.5 mono text-[11px] text-muted mb-4.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {exp.location}
                </div>
                <ul className="flex flex-col gap-2">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi} className="text-[12.5px] sm:text-[13.5px] text-muted2 leading-[1.6] pl-4 relative break-words before:content-['—'] before:absolute before:left-0 before:text-accent">
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
