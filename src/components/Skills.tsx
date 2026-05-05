"use client";

import { motion } from "framer-motion";

export default function Skills() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 36, scale: 0.99 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as any } }
  };

  const skillsData = [
    {
      title: "AI / Machine Learning",
      icon: "🧠",
      gradient: "from-color-blue/9 to-transparent",
      items: [
        { name: "TensorFlow / Keras", val: 85, grad: "from-color-blue to-color-teal" },
        { name: "Scikit-learn", val: 88, grad: "from-color-blue to-color-teal" },
        { name: "OpenCV", val: 78, grad: "from-color-blue to-color-teal" },
        { name: "NLP / Tokenization", val: 80, grad: "from-color-blue to-color-teal" }
      ]
    },
    {
      title: "Data Science",
      icon: "📊",
      gradient: "from-color-purple/9 to-transparent",
      items: [
        { name: "Python", val: 92, grad: "from-color-purple to-color-pink" },
        { name: "Pandas / NumPy", val: 89, grad: "from-color-purple to-color-pink" },
        { name: "Matplotlib / Seaborn", val: 84, grad: "from-color-purple to-color-pink" },
        { name: "Power BI", val: 72, grad: "from-color-purple to-color-pink" }
      ]
    },
    {
      title: "Web & App Dev",
      icon: "🌐",
      gradient: "from-color-green/9 to-transparent",
      items: [
        { name: "HTML / CSS", val: 87, grad: "from-color-green to-color-teal" },
        { name: "Flask / REST APIs", val: 82, grad: "from-color-green to-color-teal" },
        { name: "Flutter", val: 75, grad: "from-color-green to-color-teal" },
        { name: "Firebase", val: 78, grad: "from-color-green to-color-teal" }
      ]
    },
    {
      title: "Data Engineering",
      icon: "⚙️",
      gradient: "from-color-orange/9 to-transparent",
      items: [
        { name: "Apache Airflow", val: 75, grad: "from-color-orange to-color-yellow" },
        { name: "Apache Spark", val: 70, grad: "from-color-orange to-color-yellow" },
        { name: "dbt", val: 72, grad: "from-color-orange to-color-yellow" },
        { name: "ETL / ELT Pipelines", val: 80, grad: "from-color-orange to-color-yellow" }
      ]
    }
  ];

  return (
    <section id="skills" className="py-16 sm:py-[120px] bg-bg1 relative z-10">
      <div className="max-w-[1200px] mx-auto px-[5vw]">
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}>
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">What I work with</motion.div>
          <motion.h2 variants={itemVariants} className="display mb-5.5">Technical <span className="grad-purple">Skills</span></motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[60px]">
            {skillsData.map((cat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="bg-glass border border-border rounded-[22px] p-5 lg:p-7 relative overflow-hidden group hover:border-border2 shadow-card hover:shadow-card-hover"
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-gradient-to-br ${cat.gradient}`} />
                
                <div className="relative z-10">
                  <div className="text-[30px] mb-3.5 transition-transform duration-300 group-hover:scale-110 inline-block">{cat.icon}</div>
                  <div className="font-display text-[18px] font-extrabold mb-4">{cat.title}</div>
                  <div className="flex flex-col gap-3">
                    {cat.items.map((item, j) => (
                      <div key={j} className="group/skill">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[13px] text-muted2 whitespace-nowrap transition-colors duration-200 group-hover/skill:text-foreground">{item.name}</span>
                          <span className="text-[11px] font-mono text-muted whitespace-nowrap">{item.val}%</span>
                        </div>
                        <div className="h-[4px] dark:bg-white/10 bg-black/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            whileInView={{ width: `${item.val}%` }} 
                            viewport={{ once: true }} 
                            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] as any, delay: 0.1 * j }}
                            className={`h-full rounded-full bg-gradient-to-r ${item.grad}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-muted mt-[60px] mb-4.5 before:content-[''] before:block before:w-[22px] before:h-[1px] before:bg-current">Developer tools</motion.div>
          <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mt-4">
            {[
              { icon: "🐙", name: "Git / GitHub" }, { icon: "☁️", name: "Google Cloud" },
              { icon: "🧪", name: "Jupyter" }, { icon: "🤝", name: "Google Colab" },
              { icon: "💻", name: "VS Code" }, { icon: "📊", name: "Power BI" },
              { icon: "🔥", name: "Firebase" }, { icon: "🗺️", name: "Google Maps API" },
              { icon: "🐳", name: "Docker" }, { icon: "🌊", name: "Apache Airflow" },
              { icon: "⚡", name: "Apache Spark" }, { icon: "🔧", name: "dbt" },
              { icon: "🐘", name: "PostgreSQL" }, { icon: "🧮", name: "SQLite" },
              { icon: "🐍", name: "Flask" }, { icon: "🐧", name: "Linux / Bash" }
            ].map((tool, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-glass border border-border rounded-[14px] p-3 text-center text-[12px] font-mono text-muted2 hover:bg-glass2 hover:border-border2 hover:text-foreground hover:shadow-card group"
              >
                <div className="text-[24px] mb-1.5 transition-transform duration-200 group-hover:scale-125">{tool.icon}</div>
                {tool.name}
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
