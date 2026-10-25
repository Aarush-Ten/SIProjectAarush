"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { useProfile } from "@/components/profile-provider";

export function SiteFooter() {
  const { clearSavedData } = useProfile();
  return <footer className="site-footer"><div className="container footer-inner"><p><Compass size={17} aria-hidden="true" /> PathForge AI <span>by CYBERSTARS</span></p><span>Career exploration · A learning pathway prototype</span><div className="footer-links"><Link href="/about#privacy">Privacy & limitations <span aria-hidden="true">↗</span></Link><button type="button" className="clear-data-button" onClick={clearSavedData}>Clear saved data</button></div></div></footer>;
}
