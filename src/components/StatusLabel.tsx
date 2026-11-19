import type { Project } from "@/content/projects";

/** A project's status as one word, with a green dot when it is live. */
export function StatusLabel({ status }: { status: Project["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
        <span aria-hidden className="h-2 w-2 rounded-full bg-ok" />
        Live
      </span>
    );
  }
  return <span className="font-semibold text-ink-2">{status === "shipped" ? "Shipped" : "Building"}</span>;
}
