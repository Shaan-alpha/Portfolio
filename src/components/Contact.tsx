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
      const res = await fetch("https://portfolio-backend-wrwo.onrender.com/contact", {
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
    <section id="contact" className="py-[120px] bg-bg1 text-center relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">Let&apos;s connect</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Get in <span className="grad-blue">Touch</span></motion.h2>
          <motion.p variants={itemVariants} className="text-[15px] lg:text-[17px] leading-[1.75] text-muted2 max-w-[480px] mx-auto">
            Have a project, an opportunity, or just want to say hello? I&apos;d love to hear from you.
          </motion.p>

          <div className="max-w-[680px] mx-auto mt-[60px]">
            <motion.form 
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="bg-glass border border-border rounded-[32px] p-6 sm:p-11 relative overflow-hidden text-left isolation-isolate shadow-card"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(10,132,255,0.07),transparent_60%)] pointer-events-none -z-10"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted">Your Name</label>
                  <input required name="name" type="text" placeholder="John Smith" className="bg-white/5 border border-border rounded-[14px] px-4.5 py-3.5 text-foreground text-[15px] font-outfit outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-350 focus:border-color-blue focus:bg-color-blue/5 focus:shadow-[0_0_0_3.5px_rgba(10,132,255,0.14)]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted">Email Address</label>
                  <input required name="email" type="email" placeholder="john@example.com" className="bg-white/5 border border-border rounded-[14px] px-4.5 py-3.5 text-foreground text-[15px] font-outfit outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-350 focus:border-color-blue focus:bg-color-blue/5 focus:shadow-[0_0_0_3.5px_rgba(10,132,255,0.14)]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted">Subject</label>
                <input name="subject" type="text" placeholder="Project idea, internship, collaboration…" className="bg-white/5 border border-border rounded-[14px] px-4.5 py-3.5 text-foreground text-[15px] font-outfit outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-350 focus:border-color-blue focus:bg-color-blue/5 focus:shadow-[0_0_0_3.5px_rgba(10,132,255,0.14)]" />
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <label className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted">Message</label>
                <textarea required name="message" placeholder="Tell me what's on your mind…" className="h-[120px] resize-none bg-white/5 border border-border rounded-[14px] px-4.5 py-3.5 text-foreground text-[15px] font-outfit outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-350 focus:border-color-blue focus:bg-color-blue/5 focus:shadow-[0_0_0_3.5px_rgba(10,132,255,0.14)]"></textarea>
              </div>

              {errorMsg && <div className="text-color-pink text-sm mb-4">{errorMsg}</div>}

              <button disabled={loading || success} type="submit" className={`w-full flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-medium text-white transition-[transform,background-color,border-color,color,box-shadow] duration-350 ${success ? "bg-color-green shadow-[0_0_48px_rgba(50,215,75,0.22)]" : "bg-color-blue shadow-[0_0_48px_rgba(10,132,255,0.22),0_4px_16px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[0_0_70px_rgba(10,132,255,0.5),0_8px_24px_rgba(0,0,0,0.35)]"} disabled:opacity-70 disabled:cursor-not-allowed`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-4 h-4" />}
                {loading ? "Sending..." : success ? "Message Sent!" : "Send Message"}
              </button>
            </motion.form>

            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 mt-7">
              <a href="mailto:shaansatsangi@gmail.com" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-glass text-[13px] font-medium text-muted2 transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:text-foreground hover:border-border2 hover:bg-glass2 hover:-translate-y-1">
                <Mail className="w-[15px] h-[15px]" /> Email
              </a>
              <a href="https://linkedin.com/in/shaansatsangi" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-glass text-[13px] font-medium text-muted2 transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:text-foreground hover:border-border2 hover:bg-glass2 hover:-translate-y-1">
                <LinkedinIcon className="w-[15px] h-[15px]" /> LinkedIn
              </a>
              <a href="https://github.com/Shaan-alpha" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-glass text-[13px] font-medium text-muted2 transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:text-foreground hover:border-border2 hover:bg-glass2 hover:-translate-y-1">
                <GithubIcon className="w-[15px] h-[15px]" /> GitHub
              </a>
              <a href="tel:+919521587085" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-glass text-[13px] font-medium text-muted2 transition-[transform,background-color,border-color,color,box-shadow] duration-350 hover:text-foreground hover:border-border2 hover:bg-glass2 hover:-translate-y-1">
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
            className="fixed bottom-9 left-1/2 z-[9000] bg-[#0c0e20]/95 border border-border2 rounded-full px-6 py-3 text-[14px] text-white whitespace-nowrap"
          >
            ✅ Message sent! I&apos;ll reply soon.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
