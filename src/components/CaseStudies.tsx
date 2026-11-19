import ProjectCase from "./ProjectCase";
import { flagship } from "@/content/projects";

/** The six case studies, read in full. Each keeps its id, so the lanes in the
 *  film and any old link land on it. Phase 2 turns each into its own scene. */
export default function CaseStudies() {
  return (
    // Not a second "Selected work" landmark: the film's work scene is that.
    <div className="container-x pb-6 pt-[calc(var(--header)+3rem)]">
      <div className="max-w-[60rem]">
        {flagship.map((p) => (
          <ProjectCase key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
