import type { Metadata } from "next";
import { RoadmapView } from "@/components/roadmap-view";

export const metadata: Metadata = { title: "Your weekly learning plan" };

export default function RoadmapPage() { return <main id="main-content" className="container roadmap-page"><RoadmapView /></main>; }
