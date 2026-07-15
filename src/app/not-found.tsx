import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center grid-bg px-[6vw]">
      <div className="text-center">
        <div className="eyebrow mb-5">error 404</div>
        <h1 className="display mb-6">
          Page not <span className="accent">found</span>
        </h1>
        <p className="mono text-[13px] text-muted2 mb-9">
          <span className="accent">$</span> ls: cannot access this path: No such file or directory
        </p>
        <Link
          href="/"
          className="mono text-[13px] px-5 py-2.5 border border-accent text-accent hover:bg-accent hover:text-background transition-colors duration-200 rounded-[var(--r)]"
        >
          [ cd ~/ ]
        </Link>
      </div>
    </main>
  );
}
