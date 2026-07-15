import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://shaansatsangi.com/",
      // Bump only on real content changes — a build-time new Date() restamps
      // every deploy and makes Google ignore lastmod entirely.
      lastModified: new Date("2026-07-16"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
