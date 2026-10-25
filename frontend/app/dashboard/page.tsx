import type { Metadata } from "next";
import { MatchResults } from "@/components/match-results";

export const metadata: Metadata = { title: "Your career directions" };

export default function DashboardPage() { return <main id="main-content" className="container dashboard-page"><MatchResults /></main>; }
