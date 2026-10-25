"use client";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { ArrowUpRight, Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <header className="site-header" lang={language}>
      <div className="container header-inner">
        <Link href="/" className="brand"><span className="brand-mark"><Compass size={24} strokeWidth={1.8} aria-hidden="true" /></span><span>PathForge<span className="brand-ai"> AI</span><small>BY CYBERSTARS</small></span></Link>
        <nav aria-label="Main navigation" className="header-nav"><Link href="/dashboard" className="nav-link">{t("My pathways")}</Link><Link href="/roadmap" className="nav-link">{t("Learning plan")}</Link><Link href="/assessments" className="nav-link">{t("Assessments")}</Link><Link href="/experts" className="nav-link">{t("Experts")}</Link><label className="language-control"><span className="sr-only">Interface language</span><select aria-label="Interface language" value={language} onChange={event => setLanguage(event.target.value === "mr" ? "mr" : "en")}><option value="en">English</option><option value="mr">मराठी</option></select></label><Link href="/onboarding" className={buttonVariants({ variant: "secondary", size: "small" })}>{t("Find my pathway")} <ArrowUpRight size={16} aria-hidden="true" /></Link></nav>
      </div>
    </header>
  );
}
