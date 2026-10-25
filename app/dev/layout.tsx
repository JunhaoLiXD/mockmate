import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/**
 * Debug pages under /dev are available locally and on preview deployments, never on production.
 * VERCEL_ENV is set by Vercel: "production", "preview" or "development"; it is unset locally.
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return children;
}
