import type { Metadata } from "next";
import { connection } from "next/server";
import { ProfileProvider } from "@/components/profile-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SessionNotice } from "@/components/session-notice";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PathForge AI — Find your next direction", template: "%s | PathForge AI" },
  description: "Explore career pathways and weekly learning plans from your skills, interests, and the time and tools available to you. A CYBERSTARS prototype.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection(); // per-request CSP nonces must never use a cached/static HTML shell
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to main content</a><ProfileProvider><LanguageProvider><SiteHeader /><SessionNotice />{children}<SiteFooter /></LanguageProvider></ProfileProvider></body></html>;
}
