"use client";

import { motion } from "framer-motion";
import { TechLogo } from "@/lib/techIcons";

type Tier = "core" | "strong" | "working";

export default function Skills() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const skillsData: { title: string; label: string; items: { name: string; tier: Tier }[] }[] = [
    {
      title: "Data Engineering",
      label: "> data_engineering",
      items: [
        { name: "Apache Airflow / Spark", tier: "strong" },
        { name: "dbt / SQL (PostgreSQL)", tier: "core" },
        { name: "Databricks / Delta Lake", tier: "working" },
        { name: "ETL / ELT Pipelines", tier: "strong" },
      ],
    },
    {
      title: "Data Science & AI",
      label: "> data_science_ai",
      items: [
        { name: "TensorFlow / Keras", tier: "strong" },
        { name: "Scikit-learn / Pandas", tier: "core" },
        { name: "OpenCV / NLP", tier: "strong" },
        { name: "Local LLM Inference", tier: "working" },
      ],
    },
    {
      title: "Data Analysis & Analytics",
      label: "> analytics",
      items: [
        { name: "Power BI / Tableau", tier: "strong" },
        { name: "SQL (Complex Queries)", tier: "core" },
        { name: "Matplotlib / Seaborn", tier: "strong" },
        { name: "Actionable Insights", tier: "strong" },
      ],
    },
    {
      title: "Software Engineering",
      label: "> software_eng",
      items: [
        { name: "C / C++", tier: "strong" },
        { name: "System Design", tier: "working" },
        { name: "OOP / DSA", tier: "strong" },
        { name: "Linux / Bash / Docker", tier: "strong" },
      ],
    },
  ];

  const tools = [
    { file: "python", name: "Python" }, { file: "fastapi", name: "FastAPI" },
    { file: "nextjs", name: "Next.js", invert: true }, { file: "react", name: "React" },
    { file: "typescript", name: "TypeScript" }, { file: "postgresql", name: "PostgreSQL" },
    { file: "redis", name: "Redis" }, { file: "docker", name: "Docker" },
    { file: "tensorflow", name: "TensorFlow" }, { file: "scikitlearn", name: "Scikit-learn" },
    { file: "opencv", name: "OpenCV" }, { file: "pandas", name: "Pandas", invert: true },
    { file: "apachespark", name: "Apache Spark" }, { file: "apacheairflow", name: "Airflow" },
    { file: "jupyter", name: "Jupyter" }, { file: "git", name: "Git" },
    { file: "github", name: "GitHub", invert: true }, { file: "vscode", name: "VS Code" },
    { file: "flask", name: "Flask", invert: true }, { file: "supabase", name: "Supabase" },
    { file: "googlecloud", name: "Google Cloud" }, { file: "sqlite", name: "SQLite" },
    { file: "linux", name: "Linux" }, { file: "vercel", name: "Vercel", invert: true },
    { file: "cloudflare", name: "Cloudflare" },
  ];

  return (
    <section id="skills" className="py-16 sm:py-[120px] bg-bg1 relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">skills</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">
            Technical <span className="accent">stack</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[60px]">
            {skillsData.map((cat) => (
              <motion.div
                key={cat.title}
                variants={itemVariants}
                className="bg-surface border border-border rounded-[var(--r2)] p-5 lg:p-7 transition-colors duration-200 hover:border-accent/50"
              >
                <div className="mono text-[12px] accent mb-1">{cat.label}</div>
                <div className="font-display text-[17px] font-bold mb-4">{cat.title}</div>
                <div className="flex flex-col">
                  {cat.items.map((item) => (
                    <div key={item.name} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-[13px] text-muted2">{item.name}</span>
                      <span className="mono text-[10px] accent">{item.tier}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants} className="eyebrow mt-[60px] mb-4.5">tools</motion.div>
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mt-4">
            {tools.map((tool) => (
              <motion.div
                key={tool.name}
                variants={itemVariants}
                className="bg-surface border border-border rounded-[var(--r)] p-3 flex flex-col items-center gap-1.5 text-center mono text-[11px] text-muted2 transition-colors duration-200 hover:border-accent/50 hover:text-foreground group"
              >
                <TechLogo file={tool.file} invert={tool.invert} alt={tool.name} className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                {tool.name}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
