/** What each system's dots do, taken from that system's own text in
 *  `src/content/projects.ts`. Keyed by project id, then by step label. Each
 *  entry is quiet and loops over its `period`; it never shows anything the
 *  text does not also say. `flowTargets` turns an entry into each dot's
 *  program (`morph.ts`).
 *
 *  Windows and `still` are points in one cycle, 0 to 1. `still` is the moment
 *  a reduced-motion visitor sees, chosen so the frame still makes its point.
 *  `gap` delays packet j by j·gap; `spread` and `stopShort` are in step radii;
 *  `share` is a program's part of its edge's stream. */

export type StepBehaviour = {
  /** Draw the step as a 10×10 lattice, a rectangle around its whole flow, or
   *  `posts` posts on alternating sides of the stream. */
  shape?: "grid" | "box" | "posts";
  posts?: number;
  /** Multiplies the ambient drift: 0 holds the step rigid. */
  wander?: number;
  /** The step's dots pulse from this cycle point, then settle. */
  pulseAt?: number;
  /** A bright approval travels into the step's centre in this window. */
  arrive?: [number, number];
};

export type EdgeProgram =
  | { kind: "stream"; share?: number }
  | { kind: "packets"; window: [number, number]; count: number; gap?: number; spread?: number }
  | { kind: "hold"; window: [number, number]; share: number; stopShort: number }
  | { kind: "bounce"; window: [number, number]; count: number; gap?: number; stopShort: number };

export type Behaviour = {
  /** Seconds per cycle: 2 to 4. */
  period: number;
  still: number;
  steps?: Record<string, StepBehaviour>;
  /** The edge leaving the step with this label (by default, one stream). */
  edges?: Record<string, EdgeProgram[]>;
  /** An edge out past the step with this label, the last of its flow. */
  exits?: Record<string, EdgeProgram[]>;
};

export const BEHAVIOURS: Record<string, Behaviour> = {
  // "The score is computed; the model only narrates it."
  "skill-issue": {
    period: 3,
    still: 0,
    steps: { Score: { shape: "grid", wander: 0 }, Narrate: { wander: 3 } },
  },
  // "Returns send: false when nothing matters": the briefing stream stops at
  // the check, and only now and then does one packet reach Briefing.
  atlas: {
    period: 4,
    still: 0.48,
    edges: { "Salience check": [{ kind: "packets", window: [0.3, 0.58], count: 1 }] },
  },
  // "Five guards", then "Single-use SHA-256 approval": the approval arrives,
  // exactly one packet goes on, and execution pulses "until live state
  // converges".
  syntrueno: {
    period: 3.6,
    still: 0.52,
    steps: {
      "Five guards": { shape: "posts", posts: 5 },
      "Human gate": { arrive: [0.2, 0.38] },
      "Execute and verify": { pulseAt: 0.64 },
    },
    edges: { "Human gate": [{ kind: "packets", window: [0.42, 0.62], count: 1 }] },
  },
  // "Up to 3 ideas a run", through a fact-check that "cannot switch itself off".
  "ai-reel-factory": {
    period: 4,
    still: 0.53,
    edges: {
      "Research and pitch": [{ kind: "packets", window: [0.04, 0.3], count: 6, gap: 0.02, spread: 0.7 }],
      Approve: [{ kind: "packets", window: [0.42, 0.56], count: 3, gap: 0.025 }],
      Script: [{ kind: "packets", window: [0.6, 0.71], count: 3, gap: 0.025 }],
      "Fact-check": [{ kind: "packets", window: [0.74, 0.85], count: 3, gap: 0.025 }],
      "Voice and B-roll": [{ kind: "packets", window: [0.88, 0.95], count: 3, gap: 0.015 }],
    },
  },
  // "Row-level security": the audit runs inside the agency's own box.
  // "No review gating": every packet passes consent and carries on.
  vouchrank: {
    period: 3,
    still: 0,
    steps: { "Agency workspace": { shape: "box" } },
    exits: { Consent: [{ kind: "stream" }] },
  },
  // "Superseded documents withheld", and "Refusal recall 1.000": some packets
  // turn back instead of becoming an answer.
  "think9-brain": {
    period: 3.6,
    still: 0.66,
    edges: {
      Question: [{ kind: "stream", share: 0.6 }, { kind: "hold", window: [0, 0.34], share: 0.4, stopShort: 1 }],
      Cite: [{ kind: "stream", share: 0.6 }, { kind: "bounce", window: [0.3, 0.82], count: 2, gap: 0.12, stopShort: 0.9 }],
    },
    exits: { "Answer or refuse": [{ kind: "stream" }] },
  },
};
