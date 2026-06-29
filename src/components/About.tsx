"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const stats = [
    { value: "7+", label: "Projects Shipped" },
    { value: "2", label: "Internships" },
    { value: "5+", label: "Certifications" },
  ];

  const contacts = [
    { Icon: Mail, label: "shaansatsangi@gmail.com", href: "mailto:shaansatsangi@gmail.com" },
    { Icon: Phone, label: "+91 95215 87085", href: "tel:+919521587085" },
    { Icon: LinkedinIcon, label: "linkedin.com/in/shaansatsangi", href: "https://linkedin.com/in/shaansatsangi" },
    { Icon: GithubIcon, label: "github.com/Shaan-alpha", href: "https://github.com/Shaan-alpha" },
  ];

  return (
    <section id="about" className="py-16 sm:py-[120px] relative z-10 max-w-[1200px] mx-auto px-[5vw]">
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-center">
        {/* Visual col */}
        <div className="relative max-w-[400px] lg:max-w-none mx-auto lg:mx-0">
          <motion.div variants={itemVariants}>
            <div className="bg-surface border border-border rounded-[var(--r2)] p-6 sm:p-8 lg:p-10 text-center relative overflow-hidden">
              <div className="w-[96px] h-[96px] rounded-[var(--r2)] mx-auto mb-5 bg-bg2 border border-border2 overflow-hidden relative">
                <Image
                  src="/me.jpg"
                  alt="Shaan Satsangi"
                  fill
                  sizes="96px"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="font-display text-[20px] sm:text-[24px] font-bold mb-1">Shaan Satsangi</div>
              <div className="text-muted mono text-[12px]">data engineer · ai/ml developer</div>
              <div className="inline-flex items-center gap-1.5 text-muted mono text-[11px] mt-2.5">
                <MapPin className="w-3.5 h-3.5" />
                Jaipur, Rajasthan, India
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {contacts.map(({ Icon, label, href }) => (
                  <a
                    key={href}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                    className="flex items-center gap-2.5 bg-bg1 border border-border rounded-[var(--r)] p-2.5 px-3.5 text-muted2 mono text-[12px] transition-colors duration-200 hover:border-accent/50 hover:text-foreground"
                  >
                    <Icon className="w-4 h-4 text-accent shrink-0" />
                    <span className="truncate">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mt-5">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-[var(--r)] py-4 px-2 text-center transition-colors duration-200 hover:border-accent/50">
                <div className="font-display text-[22px] lg:text-[26px] font-bold accent">{s.value}</div>
                <div className="text-[10px] text-muted mono mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Text col */}
        <div>
          <motion.div variants={itemVariants} className="eyebrow mb-4.5">about</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">
            Pipelines over <br /><span className="accent">flashy demos.</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="text-[15px] lg:text-[17px] leading-[1.75] text-muted2 mb-6">
            I&apos;m a Computer Science undergrad at JECRC, Jaipur, working across the full data stack — <span className="accent font-medium">Data Engineering</span>, <span className="accent font-medium">Data Science</span>, and <span className="accent font-medium">Analytics</span>. I like turning messy inputs into systems that run themselves.
          </motion.p>
          <motion.p variants={itemVariants} className="text-[15px] lg:text-[17px] leading-[1.75] text-muted2 mb-6">
            My philosophy is simple: <em className="text-foreground">clean data over clever models, and bulletproof pipelines over flashy demos</em>. Whether it&apos;s a medallion lakehouse or an autonomous content factory, I care about the thing still working tomorrow.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mt-5">
            {["Python", "SQL", "Apache Airflow", "Apache Spark", "dbt", "TensorFlow", "Scikit-learn", "OpenCV", "Next.js", "FastAPI", "Flask", "Docker", "PostgreSQL", "Redis", "Firebase", "Google Cloud", "C / C++"].map((skill) => (
              <span key={skill} className="mono text-[11px] py-1 px-3 rounded-[6px] bg-surface border border-border text-muted2 transition-colors duration-200 hover:border-accent/50 hover:text-foreground">
                {skill}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
