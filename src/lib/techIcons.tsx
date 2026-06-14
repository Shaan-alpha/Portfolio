// Static export is served under basePath /Portfolio, and plain <img> srcs are
// NOT auto-prefixed, so prefix asset paths manually (same reason the frame
// sequence does). basePath is hard-coded in next.config.ts, so this is constant.
export const BP = "/Portfolio";

type Logo = { file: string; invert?: boolean };

// Devicon brand logos. `invert` = mostly-black logo that needs flipping in dark mode.
const TECH: Record<string, Logo> = {
  python: { file: "python" },
  fastapi: { file: "fastapi" },
  "next.js": { file: "nextjs", invert: true },
  nextjs: { file: "nextjs", invert: true },
  react: { file: "react" },
  typescript: { file: "typescript" },
  postgresql: { file: "postgresql" },
  "neon postgres": { file: "postgresql" },
  redis: { file: "redis" },
  "upstash redis": { file: "redis" },
  docker: { file: "docker" },
  tensorflow: { file: "tensorflow" },
  "scikit-learn": { file: "scikitlearn" },
  opencv: { file: "opencv" },
  "apache spark": { file: "apachespark" },
  "apache airflow": { file: "apacheairflow" },
  git: { file: "git" },
  "git / github": { file: "github", invert: true },
  github: { file: "github", invert: true },
  "vs code": { file: "vscode" },
  "linux / bash": { file: "linux" },
  linux: { file: "linux" },
  flask: { file: "flask", invert: true },
  firebase: { file: "firebase" },
  "google cloud": { file: "googlecloud" },
  jupyter: { file: "jupyter" },
  vercel: { file: "vercel", invert: true },
  sqlite: { file: "sqlite" },
  pandas: { file: "pandas", invert: true },
  supabase: { file: "supabase" },
  gemini: { file: "gemini", invert: true },
  "google gemini": { file: "gemini", invert: true },
  "github actions": { file: "github", invert: true },
};

export function lookupTech(name: string): Logo | null {
  return TECH[name.trim().toLowerCase()] ?? null;
}

export function TechLogo({ file, invert, alt, className }: Logo & { alt: string; className?: string }) {
  return (
    <img
      src={`${BP}/devicon/${file}.svg`}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`${className ?? ""} ${invert ? "dark:invert" : ""}`}
    />
  );
}
