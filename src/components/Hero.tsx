"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 4500], [0, 500]);
  const floatsY = useTransform(scrollY, [0, 4500], [0, 350]);
  // Fade out early so the animation can be seen alone
  const heroOpacity = useTransform(scrollY, [0, 800, 1500], [1, 1, 0]);

  return (
    <motion.section 
      id="hero" 
      style={{ opacity: heroOpacity, willChange: "opacity" }} 
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden p-0 w-full"
    >
      {/* Grid decoration */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 80%)'
        }}
      />

      <motion.div style={{ y: floatsY }} className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
          className="absolute top-[18%] left-[4%] bg-bg1/90 border border-border2 rounded-[22px] px-[18px] shadow-card py-[14px] text-[13px] font-medium flex flex-col gap-[3px] whitespace-nowrap will-change-transform"
        >
          <div className="text-[22px] mb-1">🧠</div>
          <div className="text-foreground font-semibold">AI / ML</div>
          <div className="text-muted text-[11px] font-mono">TensorFlow · Scikit-learn</div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
          className="absolute top-[22%] right-[5%] bg-bg1/90 border border-border2 rounded-[22px] px-[18px] shadow-card py-[14px] text-[13px] font-medium flex flex-col gap-[3px] whitespace-nowrap will-change-transform"
        >
          <div className="text-[22px] mb-1">📱</div>
          <div className="text-foreground font-semibold">Cross-Platform</div>
          <div className="text-muted text-[11px] font-mono">Flutter · Firebase</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
          className="absolute bottom-[20%] left-[6%] bg-bg1/90 border border-border2 rounded-[22px] px-[18px] shadow-card py-[14px] text-[13px] font-medium flex flex-col gap-[3px] whitespace-nowrap will-change-transform"
        >
          <div className="text-[22px] mb-1">⚙️</div>
          <div className="text-foreground font-semibold">Data Engineering</div>
          <div className="text-muted text-[11px] font-mono">Airflow · Spark · dbt</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
          className="absolute bottom-[25%] right-[4%] bg-bg1/90 border border-border2 rounded-[22px] px-[18px] shadow-card py-[14px] text-[13px] font-medium flex flex-col gap-[3px] whitespace-nowrap will-change-transform"
        >
          <div className="text-[22px] mb-1">🎓</div>
          <div className="text-foreground font-semibold">BTech CSE</div>
          <div className="text-muted text-[11px] font-mono">JECRC · Jaipur</div>
        </motion.div>
      </motion.div>

      <motion.div style={{ y }} className="relative z-10 px-[5vw] max-w-[1200px] mx-auto w-full pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          className="inline-flex items-center gap-[9px] bg-color-green/5 border border-color-green/20 rounded-full py-[7px] pr-[18px] pl-[12px] text-[12px] font-medium text-color-green mb-[36px]"
        >
          <span className="w-[7px] h-[7px] rounded-full bg-color-green animate-[statusPulse_2.5s_infinite]"></span>
          Available for opportunities
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          className="font-display text-[clamp(44px,10vw,140px)] font-black leading-[1] sm:leading-[0.9] tracking-[-0.05em]"
        >
          <span className="block text-foreground">Shaan</span>
          <span className="block bg-gradient-to-r from-color-blue via-color-purple to-color-pink bg-clip-text text-transparent">Satsangi.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          className="text-[clamp(15px,2.2vw,21px)] font-light text-muted2 max-w-[600px] mx-auto mt-[28px] mb-[40px]"
        >
          <strong className="text-foreground font-medium">CS undergrad → Data Engineer in the making</strong> building intelligent, data-driven systems —<br className="hidden sm:block"/>
          from ML pipelines to facial recognition platforms, driven by curiosity and clean code.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }}
          className="flex gap-2.5 sm:gap-[14px] justify-center flex-wrap"
        >
          <a href="#projects" className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full text-[13px] sm:text-sm font-medium bg-color-blue text-white shadow-[0_0_48px_rgba(10,132,255,0.22),0_4px_16px_rgba(0,0,0,0.3)] transition-[transform,background-color,border-color,color,box-shadow] duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_0_70px_rgba(10,132,255,0.5),0_8px_24px_rgba(0,0,0,0.35)]">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M3 12h18M13 5l7 7-7 7"/></svg>
            View Projects
          </a>
          <a href="mailto:shaansatsangi@gmail.com" className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full text-[13px] sm:text-sm font-medium bg-white/50 dark:bg-glass2 border border-border2/60 dark:border-border2 text-foreground transition-[transform,background-color,border-color] duration-300 hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-white/10 hover:border-border2 shadow-sm hover:shadow-md">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Say Hello
          </a>
          <a href="https://github.com/Shaan-alpha" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full text-[13px] sm:text-sm font-medium bg-white/50 dark:bg-glass2 border border-border2/60 dark:border-border2 text-foreground transition-[transform,background-color,border-color] duration-300 hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-white/10 hover:border-border2 shadow-sm hover:shadow-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </a>
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted text-[11px] tracking-[0.1em] uppercase pointer-events-none"
      >
        <div className="w-[1px] h-[52px] bg-white/10 rounded-[1px] overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-color-blue to-color-purple rounded-[1px]"
            animate={{ top: ["0%", "66%", "66%"], opacity: [1, 1, 0] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
        scroll
      </motion.div>
    </motion.section>
  );
}
