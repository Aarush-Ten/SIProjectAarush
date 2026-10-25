"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="container empty-state"><h1>We couldn’t load this view.</h1><p>Your saved profile and progress remain on this browser. Try loading the view again.</p><Button onClick={reset}>Try again</Button></main>;
}
