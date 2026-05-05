"use client";

import { motion } from "framer-motion";
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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 36, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as any } }
  };

  return (
    <section id="about" className="py-[120px] relative z-10 max-w-[1200px] mx-auto px-[5vw]">
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-center">
        {/* Visual col */}
        <div className="relative max-w-[400px] lg:max-w-none mx-auto lg:mx-0">
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-color-blue/8 to-color-purple/6 border border-border2 rounded-[36px] p-8 lg:p-11 text-center relative overflow-hidden shadow-card">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(10,132,255,0.12),transparent_60%)] pointer-events-none"></div>
              
              <div className="w-[110px] h-[110px] rounded-full mx-auto mb-5 bg-gradient-to-br from-color-blue to-color-purple flex items-center justify-center text-[52px] shadow-[0_0_48px_rgba(10,132,255,0.22)] animate-[avatarFloat_5s_ease-in-out_infinite]">
                👨‍💻
              </div>
              <div className="font-display text-[26px] font-extrabold mb-1">Shaan Satsangi</div>
              <div className="text-muted text-[13px] font-mono">CS undergrad · Data Engineer & AI/ML developer</div>
              <div className="inline-flex items-center gap-1.5 text-muted text-[12px] mt-2.5">
                <MapPin className="w-3.5 h-3.5" />
                Jaipur, Rajasthan, India
              </div>
              
              <div className="flex flex-col gap-2.5 mt-6">
                <a href="mailto:shaansatsangi@gmail.com" className="flex items-center gap-2.5 bg-glass border border-border rounded-[14px] p-2.5 px-3.5 text-muted2 text-[13px] transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:bg-glass2 hover:border-border2 hover:text-foreground hover:translate-x-1 group">
                  <Mail className="w-4 h-4 text-color-blue shrink-0" />
                  <span className="truncate">shaansatsangi@gmail.com</span>
                </a>
                <a href="tel:+919521587085" className="flex items-center gap-2.5 bg-glass border border-border rounded-[14px] p-2.5 px-3.5 text-muted2 text-[13px] transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:bg-glass2 hover:border-border2 hover:text-foreground hover:translate-x-1 group">
                  <Phone className="w-4 h-4 text-color-blue shrink-0" />
                  <span className="truncate">+91 95215 87085</span>
                </a>
                <a href="https://linkedin.com/in/shaansatsangi" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-glass border border-border rounded-[14px] p-2.5 px-3.5 text-muted2 text-[13px] transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:bg-glass2 hover:border-border2 hover:text-foreground hover:translate-x-1 group">
                  <LinkedinIcon className="w-4 h-4 text-color-blue shrink-0" />
                  <span className="truncate">linkedin.com/in/shaansatsangi</span>
                </a>
                <a href="https://github.com/Shaan-alpha" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-glass border border-border rounded-[14px] p-2.5 px-3.5 text-muted2 text-[13px] transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:bg-glass2 hover:border-border2 hover:text-foreground hover:translate-x-1 group">
                  <GithubIcon className="w-4 h-4 text-color-blue shrink-0" />
                  <span className="truncate">github.com/Shaan-alpha</span>
                </a>
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
            <div className="bg-glass border border-border rounded-[14px] py-4 px-3.5 text-center transition-[transform,background-color,border-color,color,box-shadow] duration-400 hover:bg-glass2 hover:border-border2 hover:-translate-y-1 shadow-sm hover:shadow-card">
              <div className="font-display text-[22px] lg:text-[26px] font-black grad-blue">5</div>
              <div className="text-[11px] text-muted mt-0.5">Projects Shipped</div>
            </div>
            <div className="bg-glass border border-border rounded-[14px] py-4 px-3.5 text-center transition-[transform,background-color,border-color,color,box-shadow] duration-400 hover:bg-glass2 hover:border-border2 hover:-translate-y-1 shadow-sm hover:shadow-card">
              <div className="font-display text-[22px] lg:text-[26px] font-black grad-purple">2</div>
              <div className="text-[11px] text-muted mt-0.5">Internships</div>
            </div>
            <div className="bg-glass border border-border rounded-[14px] py-4 px-3.5 text-center transition-[transform,background-color,border-color,color,box-shadow] duration-400 hover:bg-glass2 hover:border-border2 hover:-translate-y-1 shadow-sm hover:shadow-card col-span-2 lg:col-span-1 shadow-sm hover:shadow-card">
              <div className="font-display text-[22px] lg:text-[26px] font-black grad-green">5+</div>
              <div className="text-[11px] text-muted mt-0.5">Certifications</div>
            </div>
          </motion.div>
        </div>

        {/* Text col */}
        <div>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">About me</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Dedicated. <br/><span className="grad-blue">Innovative.</span></motion.h2>
          <motion.p variants={itemVariants} className="text-[15px] lg:text-[17px] leading-[1.75] text-muted2 mb-6">
            I&apos;m a Computer Science undergraduate at JECRC, Jaipur, aspiring to become a Data Engineer.
            My philosophy: <em className="text-foreground">clean data &gt; clever models, reliable pipelines &gt; cool demos</em>.
            I love building systems that solve real problems across the full stack.
          </motion.p>
          <motion.p variants={itemVariants} className="text-[15px] lg:text-[17px] leading-[1.75] text-muted2 mb-6">
            From ETL/ELT pipelines with Airflow & Spark, to facial recognition platforms, cross-platform safety apps,
            and offline AI voice assistants — every project I ship has genuine real-world impact.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mt-5">
            {["Python", "SQL", "Apache Airflow", "Apache Spark", "dbt", "TensorFlow", "Scikit-learn", "OpenCV", "Flutter", "Flask", "Docker", "PostgreSQL", "Firebase", "Google Cloud", "C / C++"].map(skill => (
              <span key={skill} className="text-[12px] font-medium py-1 px-3.5 rounded-full bg-glass border border-border text-muted2 font-mono transition-[transform,background-color,border-color,color,box-shadow] duration-300 hover:bg-glass2 hover:border-border2 hover:text-foreground">
                {skill}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
