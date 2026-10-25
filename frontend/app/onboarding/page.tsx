import type { Metadata } from "next";
import { OnboardingForm } from "@/components/onboarding-form";

export const metadata: Metadata = { title: "Your starting point" };

export default function OnboardingPage() { return <main id="main-content" className="container onboarding-page"><OnboardingForm /></main>; }
