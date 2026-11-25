import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH only when hosting under a sub-path,
// e.g. GitHub Pages project sites ("/repo-name"). Leave unset on Vercel.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  env: {
    // Frozen into the static HTML. Event greying renders from this first,
    // then re-checks against the visitor's real clock after hydration.
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
