"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mail, Phone, Loader2, CheckCircle2 } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const contentType = res.headers.get("content-type");
      const result = contentType?.includes("application/json") ? await res.json() : null;

      if (!res.ok || result?.status !== "success") {
        throw new Error(result?.message || "Request failed");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 36, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as any } }
  };

  return (
    <section id="contact" className="py-16 sm:py-[120px] bg-bg1 text-center relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="eyebrow mb-4.5 inline-block">contact</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Get in <span className="accent">touch</span></motion.h2>
          <motion.p variants={itemVariants} className="mono text-[13px] lg:text-[14px] leading-[1.75] text-muted2 max-w-[480px] mx-auto">
            Have a project, an opportunity, or just want to say hello? I&apos;d love to hear from you.
          </motion.p>

          <div className="max-w-[680px] mx-auto mt-[60px]">
            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="bg-surface border border-border rounded-[var(--r2)] p-6 sm:p-10 text-left"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="mono text-[11px] tracking-[0.04em] text-muted">name</label>
                  <input required id="name" name="name" type="text" placeholder="John Smith" className="bg-bg1 border border-border rounded-[var(--r)] px-4 py-3 text-foreground text-[14px] outline-none transition-colors duration-200 focus:border-accent" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="mono text-[11px] tracking-[0.04em] text-muted">email</label>
                  <input required id="email" name="email" type="email" placeholder="john@example.com" className="bg-bg1 border border-border rounded-[var(--r)] px-4 py-3 text-foreground text-[14px] outline-none transition-colors duration-200 focus:border-accent" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label htmlFor="subject" className="mono text-[11px] tracking-[0.04em] text-muted">subject</label>
                <input id="subject" name="subject" type="text" placeholder="Project idea, internship, collaboration…" className="bg-bg1 border border-border rounded-[var(--r)] px-4 py-3 text-foreground text-[14px] outline-none transition-colors duration-200 focus:border-accent" />
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label htmlFor="message" className="mono text-[11px] tracking-[0.04em] text-muted">message</label>
                <textarea required id="message" name="message" placeholder="Tell me what's on your mind…" className="h-[120px] resize-none bg-bg1 border border-border rounded-[var(--r)] px-4 py-3 text-foreground text-[14px] outline-none transition-colors duration-200 focus:border-accent"></textarea>
              </div>

              {/* Honeypot — bots fill this; humans never see it */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] w-px h-px opacity-0" />

              {errorMsg && <div className="mono text-red-400 text-[13px] mb-4">{errorMsg}</div>}

              <button disabled={loading || success} type="submit" className={`w-full flex items-center justify-center gap-2 px-7 py-3 rounded-[var(--r)] mono text-[14px] bg-accent text-background transition-[transform,opacity] duration-200 ${success ? "" : "hover:-translate-y-0.5"} disabled:opacity-70 disabled:cursor-not-allowed`}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {loading ? "sending…" : success ? "message sent ✓" : "send message"}
              </button>
            </motion.form>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 mt-7">
              <a href="mailto:shaansatsangi@gmail.com" className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r)] border border-border bg-surface mono text-[12px] text-muted2 transition-colors duration-200 hover:text-foreground hover:border-accent/50">
                <Mail className="w-[15px] h-[15px]" /> email
              </a>
              <a href="https://linkedin.com/in/shaansatsangi" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r)] border border-border bg-surface mono text-[12px] text-muted2 transition-colors duration-200 hover:text-foreground hover:border-accent/50">
                <LinkedinIcon className="w-[15px] h-[15px]" /> linkedin
              </a>
              <a href="https://github.com/Shaan-alpha" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r)] border border-border bg-surface mono text-[12px] text-muted2 transition-colors duration-200 hover:text-foreground hover:border-accent/50">
                <GithubIcon className="w-[15px] h-[15px]" /> github
              </a>
              <a href="tel:+919521587085" className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--r)] border border-border bg-surface mono text-[12px] text-muted2 transition-colors duration-200 hover:text-foreground hover:border-accent/50">
                <Phone className="w-[15px] h-[15px]" /> +91 95215 87085
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-9 left-1/2 z-[9000] bg-surface border border-accent rounded-[var(--r)] px-6 py-3 mono text-[13px] text-foreground whitespace-nowrap"
          >
            <span className="accent">✓</span> message sent — I&apos;ll reply soon.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
