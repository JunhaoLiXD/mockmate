import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Interviewer personas, rubrics and company styles are read from content/ at runtime.
  outputFileTracingIncludes: {
    "/api/session": ["./content/*.md"],
    "/api/plan": ["./content/*.md"],
    "/api/report": ["./content/*.md"],
  },
  partialPrefetching: true,
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
