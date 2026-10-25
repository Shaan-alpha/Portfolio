/** The layers of the hero model, top to bottom. The scene, the callouts and the
 *  detail panel all read this one list, so the 3D object and the text that
 *  explains it cannot disagree. `seenIn` holds project ids from projects.ts,
 *  and every claim in a summary is backed by at least one of them. */
export type LayerId = "interfaces" | "guards" | "orchestration" | "model" | "state";

export type Layer = { id: LayerId; name: string; summary: string; seenIn: string[] };

export const layers: Layer[] = [
  {
    id: "interfaces",
    name: "Interfaces",
    summary: "Where people and other agents meet the system: a Telegram chat, a web app, or an MCP server.",
    seenIn: ["atlas", "skill-issue", "telegram-mcp"],
  },
  {
    id: "guards",
    name: "Guards",
    summary:
      "Checks that fail closed, a salience gate that keeps a bot quiet, and a human approval before anything irreversible.",
    seenIn: ["syntrueno", "atlas", "ai-reel-factory"],
  },
  {
    id: "orchestration",
    name: "Orchestration",
    summary: "Agent loops and graphs that plan, call tools, and pass work between agents.",
    seenIn: ["atlas", "think9-brain", "syntrueno"],
  },
  {
    id: "model",
    name: "Model",
    summary:
      "Gemini, Groq, Claude or a local model through Ollama. It drafts, narrates and calls tools. It never computes the score.",
    seenIn: ["skill-issue", "atlas", "think9-brain"],
  },
  {
    id: "state",
    name: "Memory and state",
    summary:
      "Caches, Postgres, cited retrieval and hash-chained audit logs, plus run state that can be retried safely.",
    seenIn: ["skill-issue", "think9-brain", "syntrueno", "ai-reel-factory"],
  },
];
