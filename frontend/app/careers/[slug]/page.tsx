import type { Metadata } from "next";
import { CareerDetail } from "@/components/career-detail";

export const metadata: Metadata = { title: "Explore a career" };

export default async function CareerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <main id="main-content" className="container career-page"><CareerDetail slug={slug} /></main>;
}
