import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
export default function NotFoundPage() {
  return <main id="main-content" className="container empty-state"><h1>That page isn’t on this pathway.</h1><p>Return to your saved career directions or start a new profile.</p><Link href="/dashboard" className={buttonVariants({})}>Back to my pathways</Link></main>;
}
