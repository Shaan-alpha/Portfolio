"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function Experience() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 36, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as any } }
  };

  const experiences = [
    {
      period: "July 2024 – August 2024",
      company: "Upflairs Pvt. Ltd.",
      role: "Data Science with AI/ML in Python",
      location: "Jaipur, Rajasthan",
      bullets: [
        "Built ML classification and prediction models using Python with real-world datasets",
        "Cleaned, analyzed & engineered features to extract key business insights from raw data",
        "Worked on practical projects leveraging Scikit-learn, Pandas, and data visualization libraries"
      ],
      grad: "from-color-blue to-color-purple",
      color: "var(--color-blue)"
    },
    {
      period: "August 2023 – September 2023",
      company: "Upflairs Pvt. Ltd.",
      role: "Frontend Web Development",
      location: "Jaipur, Rajasthan",
      bullets: [
        "Designed fully responsive web pages using HTML, CSS, and Bootstrap framework",
        "Improved UI/UX through clean, accessible layouts and user-centered design principles",
        "Delivered polished frontend interfaces for client-facing products"
      ],
      grad: "from-color-green to-color-teal",
      color: "var(--color-green)"
    }
  ];

  return (
    <section id="internships" className="py-16 sm:py-[120px] bg-bg1 relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">Work experience</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Internship <span className="grad-green">Journey</span></motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5 mt-[60px]">
            {experiences.map((exp, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                style={{ "--ic-color": exp.color } as React.CSSProperties}
                className="bg-glass border border-border rounded-[22px] p-5 sm:p-8 transition-[transform,background-color,border-color,color,box-shadow] duration-500 relative overflow-hidden group hover:border-border2 hover:-translate-y-1.5 shadow-card hover:shadow-card-hover"
              >
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${exp.grad} scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100`}></div>
                
                <div className="text-[11px] font-mono text-muted mb-3.5 flex items-center gap-2 before:content-[''] before:block before:w-4 before:h-[1px] before:bg-muted">
                  {exp.period}
                </div>
                <div className="font-display text-[18px] sm:text-[22px] font-extrabold mb-1">{exp.company}</div>
                <div className="text-[13px] sm:text-[14px] font-medium text-muted2 mb-4.5">{exp.role}</div>
                <div className="inline-flex items-center gap-1.5 text-[12px] text-muted mb-4.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {exp.location}
                </div>
                <ul className="flex flex-col gap-2">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi} className="text-[12.5px] sm:text-[13.5px] text-muted2 leading-[1.6] pl-3.5 sm:pl-4.5 relative break-words before:content-[''] before:absolute before:left-0 before:top-2 before:w-[5px] before:h-[5px] before:rounded-full before:bg-[var(--ic-color)] before:shadow-[0_0_8px_var(--ic-color)]">
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
