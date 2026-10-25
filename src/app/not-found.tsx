import type { Metadata } from "next";
import Link from "next/link";
import Mark from "@/components/Mark";

export const metadata: Metadata = {
  title: "Page not found | Shaan Satsangi",
};

export default function NotFound() {
  return (
    <main className="container-x flex min-h-dvh flex-col justify-center py-20">
      <Mark className="h-10 w-10 text-ink" />
      <h1 className="t-h2 mt-10 max-w-[16ch] text-ink">This page does not exist.</h1>
      <p className="t-lead mt-5 max-w-[42ch] text-ink-2">
        The address may be mistyped, or the page has moved. Everything on this site lives on the homepage.
      </p>
      <div className="mt-10">
        <Link href="/" className="key key-primary">
          Go to the homepage
        </Link>
      </div>
    </main>
  );
}
