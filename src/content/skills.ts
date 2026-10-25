/** Depth, not a percentage: core is what I reach for first, strong is what I
 *  have shipped with, working is what I use and am still building on. */
export type Depth = "core" | "strong" | "working";

export type SkillGroup = { title: string; items: { name: string; depth: Depth }[] };

export const skills: SkillGroup[] = [
  {
    title: "Agentic AI and LLMs",
    items: [
      { name: "LangGraph (stateful agent graphs)", depth: "working" },
      { name: "LangChain (chains & tool-calling)", depth: "working" },
      { name: "Multi-Agent Orchestration", depth: "strong" },
      { name: "MCP / Structured Tool Routing", depth: "strong" },
      { name: "LLM APIs (Claude / Gemini / Groq)", depth: "strong" },
      { name: "Local LLM Inference (Ollama)", depth: "working" },
    ],
  },
  {
    title: "Retrieval and machine learning",
    items: [
      { name: "RAG / Vector DBs (FAISS)", depth: "core" },
      { name: "Embeddings & Semantic Search", depth: "strong" },
      { name: "PyTorch / TensorFlow", depth: "working" },
      { name: "Scikit-learn / Pandas", depth: "core" },
      { name: "OpenCV / NLP", depth: "strong" },
    ],
  },
  {
    title: "Systems and architecture",
    items: [
      { name: "System Design", depth: "strong" },
      { name: "Distributed Systems & Scalability", depth: "working" },
      { name: "Idempotency, Retries & Fail-Soft State", depth: "strong" },
      { name: "Caching & Cache-Stampede Prevention", depth: "strong" },
      { name: "OOP / DSA / C / C++", depth: "strong" },
    ],
  },
  {
    title: "Backend and platform",
    items: [
      { name: "FastAPI / REST APIs", depth: "core" },
      { name: "PostgreSQL / Neon / Supabase", depth: "core" },
      { name: "Redis (Upstash) / Queues", depth: "strong" },
      { name: "Docker / GitHub Actions CI/CD", depth: "strong" },
      { name: "Linux / Bash / Shell Tooling", depth: "strong" },
      { name: "Observability (PostHog / Sentry)", depth: "working" },
    ],
  },
  {
    title: "Data engineering",
    items: [
      { name: "Apache Airflow / Spark", depth: "strong" },
      { name: "dbt / SQL (PostgreSQL)", depth: "core" },
      { name: "Databricks / Delta Lake", depth: "working" },
      { name: "ETL / ELT Pipelines", depth: "strong" },
    ],
  },
  {
    title: "Data analysis",
    items: [
      { name: "Power BI", depth: "strong" },
      { name: "SQL (Complex Queries)", depth: "core" },
      { name: "Matplotlib / Seaborn", depth: "strong" },
      { name: "Actionable Insights", depth: "strong" },
    ],
  },
];
