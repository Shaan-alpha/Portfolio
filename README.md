# 🦄 Data Unicorn Portfolio

A high-performance, scrollytelling developer portfolio built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**. This project showcases a unique blend of **Data Engineering**, **Data Science**, and **Software Engineering** through a buttery-smooth, GPU-accelerated interface.

> "Clean data over clever models, and bulletproof pipelines over flashy demos."

## 🌟 Visual Experience

- **Interactive Preloader**: An animated monogram + progress ring masks the 240-frame hero load and reveals the site the moment the critical frames are ready — theme-aware and reduced-motion safe.
- **GPU-Accelerated Scrollytelling**: Custom HTML5 Canvas engine with sub-frame interpolation for 60FPS fluid background sequences.
- **Data Unicorn Identity**: A narrative-driven UI that highlights cross-disciplinary expertise in data pipelines, machine learning, and full-stack development.
- **Glassmorphic Design**: Modern, Apple-like aesthetics with blurred backgrounds, vibrant gradients, drifting ambient blobs, animated section dividers, and a scroll-progress indicator.
- **Adaptive Theme Engine**: Custom-built animated "lightbulb" toggle with full accessibility and theme persistence.

## 🛠️ Technical Powerhouse

### **Core Stack**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Runtime**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
- **Scrolling**: [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)

### **Backend & AI (across projects)**
- **APIs**: [FastAPI](https://fastapi.tiangolo.com/) · Flask (the portfolio's contact form posts to a small Flask service on Render)
- **Data**: [Neon Postgres](https://neon.tech/) · [Upstash Redis](https://upstash.com/) · Supabase · SQLite
- **AI/ML**: [Groq](https://groq.com/) LLM inference · TensorFlow · Scikit-learn · OpenCV DNN

### **Architecture**
- **Medallion Lakehouse Philosophy**: Applied across data projects (Bronze → Silver → Gold).
- **Responsive Geometry**: Fluid layouts optimized for everything from mobile (375px) to high-res desktops.
- **GPU Pipelines**: Leverages CSS filters and hardware-accelerated transforms for zero layout thrashing.

## 💡 Featured Projects

### **🧾 Skill Issue — GitHub Intelligence Platform**
- AI-powered platform that analyzes any GitHub profile into a deterministic **100-point engineering score**, a 7-tier identity ladder, stackable badges, and shareable "GitHub Receipts."
- **FastAPI + Next.js** with **Neon Postgres** persistence, GitHub OAuth, and an **Upstash Redis** warm cache (repeat analysis p95 ≤ 200 ms); the narrative layer (Roast + Mentor) runs on **Groq** `llama-3.3-70b`.
- [Live Demo](https://skill-issue-tau.vercel.app) | [GitHub](https://github.com/Shaan-alpha/Skill-Issue)

### **📊 CRM Sales Warehouse — ETL Pipeline**
- Architected an automated ETL pipeline with **Apache Airflow** that ingests and transforms 10k+ CRM records into a star-schema **PostgreSQL** warehouse.
- Surfaced sales-performance insights via a dynamic **Power BI** dashboard.
- [GitHub](https://github.com/Shaan-alpha/CRM-Sales-Warehouse)

### **🎬 YouTube Wrapped — Data Pipeline**
- End-to-end Medallion lakehouse pipeline (Bronze → Silver → Gold) built on **Databricks** + **Delta Lake**.
- **FastAPI** backend serving analytics from **Neon Postgres** into an animated **Next.js** dashboard.
- [Live Demo](https://youtube-wrapped-by-shaan.vercel.app) | [GitHub](https://github.com/Shaan-alpha/youtube-wrapped)

### **🤖 JARVIS — Offline AI Assistant**
- Privacy-first voice assistant with local LLM inference, semantic memory, and wake-word detection — fully offline, no external APIs.
- Built on **Python + TensorFlow + NLP** for real-time intent classification and system automation.
- [GitHub](https://github.com/Shaan-alpha/jarvis-py)

### **👁️ FaceFilter AI — Facial Recognition**
- Locally-run face recognition using **OpenCV DNN** (YuNet detection + SFace 128-D embeddings, ONNX) with cosine-similarity matching — no cloud uploads.
- Real-time progress via Server-Sent Events; resumable runs backed by a three-table **SQLite** schema.
- [GitHub](https://github.com/Shaan-alpha/face-sort-studio)

### **🛡️ Sahara — Women's Safety App**
- Mobile-first **Next.js / TypeScript** safety app with gesture-based SOS, real-time **MapLibre** location tracking, and **Twilio**-powered SMS alerts.
- **Supabase** (Postgres + auth) backend with row-level security.
- [Live Demo](https://sahaara-app.vercel.app) | [GitHub](https://github.com/Shaan-alpha/Sahaara_APP)

### **📝 Review Reader — Sentiment Analysis**
- High-accuracy NLP pipeline classifying 1,000+ reviews in milliseconds via **Scikit-learn** + **TF-IDF**, with tokenization and stop-word removal.

## 🎓 Academic & Certifications
- **JECRC University**: CS Undergrad (CGPA: **7.39**)
- **micro1 AI Certified**: Verified proficiency in Data Science & AI/ML Engineering.
- **IEEE Honors**: 2nd Position in Regional Debate Competition.

## 🚀 Installation & Development

1. **Clone & Enter**
   ```bash
   git clone https://github.com/Shaan-alpha/Portfolio.git && cd Portfolio
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Launch Dev Environment**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   ```

---
Crafted with 🦄 by **Shaan Satsangi**
