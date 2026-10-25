import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Hides the floating dev badge without hiding the error overlay, which the
  // old CSS rule (`nextjs-portal { display: none }`) was also swallowing.
  devIndicators: false,
};

export default nextConfig;
