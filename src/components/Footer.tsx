import Mark from "./Mark";
import { profile } from "@/content/profile";
import { BUILD_SHA } from "@/lib/buildInfo";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-col gap-6 py-10 text-[14px] text-ink-3 md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-2.5 text-ink">
          <Mark className="h-5 w-5" />
          <span className="font-semibold">© 2026 {profile.name}</span>
        </p>
        <p>
          Built with Next.js and three.js, served from Cloudflare.{" "}
          <a className="link text-ink-2" href={profile.repo} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
          {/* Stamped from git at build time: the commit this page was built from,
              suffixed -dirty when it was built with uncommitted changes. */}
          , build <code className="text-ink-2">{BUILD_SHA}</code>.
        </p>
        <nav aria-label="Footer">
          <a className="link text-ink-2" href="#top">
            Back to top
          </a>
        </nav>
      </div>
    </footer>
  );
}
