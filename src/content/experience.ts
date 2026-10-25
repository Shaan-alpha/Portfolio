export type Role = {
  period: string;
  org: string;
  title: string;
  kind: "Education" | "Internship";
  location: string;
  /** One plain sentence on what the work was. */
  summary?: string;
};

/** Newest first. Education sits on the same timeline as the internships so the
 *  whole path reads in one place. The summaries condense the original résumé
 *  bullets: the same facts, without the adjectives. */
export const timeline: Role[] = [
  {
    period: "Nov 2022 – Jun 2026",
    org: "Jaipur Engineering College and Research Centre",
    title: "B.Tech in Computer Science & Engineering",
    kind: "Education",
    location: "Jaipur, Rajasthan",
  },
  {
    period: "Jul 2024 – Aug 2024",
    org: "Upflairs Pvt. Ltd.",
    title: "Data Science with AI/ML in Python",
    kind: "Internship",
    location: "Jaipur, Rajasthan",
    summary:
      "Built classification and prediction models in Python on real-world datasets, from cleaning and feature engineering through to scikit-learn and pandas.",
  },
  {
    period: "Aug 2023 – Sep 2023",
    org: "Upflairs Pvt. Ltd.",
    title: "Frontend Web Development",
    kind: "Internship",
    location: "Jaipur, Rajasthan",
    summary: "Built responsive pages with HTML, CSS and Bootstrap for client-facing products.",
  },
];

export type Credential = { name: string; issuer: string; date?: string };

export const certifications: Credential[] = [
  { name: "Introduction to Model Context Protocol", issuer: "Anthropic", date: "Jun 2026" },
  { name: "Data Science, AI/ML & Data Engineer", issuer: "micro1", date: "May 2026" },
  { name: "Fundamentals of Machine Learning", issuer: "Microsoft", date: "Dec 2023" },
  { name: "Fundamental AI Concepts", issuer: "Microsoft", date: "Dec 2023" },
  { name: "Introduction to Cybersecurity", issuer: "Cisco Networking Academy" },
  { name: "Cybersecurity Essentials", issuer: "Cisco Networking Academy" },
];

export const achievements: Credential[] = [
  { name: "2nd position, debate competition", issuer: "IEEE Student Chapter" },
];
