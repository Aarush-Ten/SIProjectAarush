import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Compass, Fingerprint, GitBranch, Laptop, Leaf, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  { number: "01", icon: Fingerprint, title: "Start with what you know", text: "Add your skills, interests, and background. You don’t need to have it all figured out." },
  { number: "02", icon: GitBranch, title: "See where you could go", text: "Compare three pathways from a curated mix of technical and vocational careers." },
  { number: "03", icon: ListChecks, title: "Build a plan you can follow", text: "Turn your skill gaps into weekly activities that respect your time, device, and budget." },
];

export default function LandingPage() {
  return <main id="main-content">
    <section className="hero container">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> A little clarity. A world of possibilities.</p>
        <h1>Your skills.<br />A clearer <span className="accent-word">next step<svg viewBox="0 0 340 17" aria-hidden="true"><path d="M3 12C92 1 226 0 336 9" /></svg></span>.</h1>
        <p className="hero-description">Find career directions that connect what you know with what you love—and the time and tools you actually have.</p>
        <div className="hero-actions"><Link href="/onboarding" className={buttonVariants({})}>Find my pathway <ArrowUpRight size={20} aria-hidden="true" /></Link><span>No sign-up. Your pace.</span></div>
        <div className="hero-assurances"><span><Check size={16} /> Free to explore</span><span><Check size={16} /> Every match explained</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustrative example: a student’s Python, HTML, and SQL skills lead to career exploration and a view of missing skills.">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="pathway-paper">
          <div className="paper-header"><span className="mini-compass"><Compass size={20} /></span><span>YOUR STARTING POINT<small>An illustrative student profile</small></span><span className="paper-dot" /></div>
          <h2>Possibility starts<br />with <span>you.</span></h2>
          <div className="skill-preview"><span>Skills you bring</span><div><span><i className="code-dot" /> Python <small>2 / 3</small></span><span><i className="code-dot coral" /> HTML <small>2 / 3</small></span><span><i className="code-dot ochre" /> SQL <small>1 / 3</small></span></div></div>
          <div className="journey-line"><span /><span /><span /><ArrowRight size={18} /></div>
          <div className="direction-preview"><div className="direction-icon"><ShieldCheck size={24} strokeWidth={1.6} /></div><div><p>An interest in cybersecurity</p><strong>A direction to explore</strong></div><ArrowUpRight size={18} /></div>
          <div className="gap-preview"><span>Make the gaps visible</span><p>Networking <ChevronRight size={13} /> Linux <ChevronRight size={13} /> Your next skills</p></div>
        </div>
        <div className="floating-note"><Leaf size={18} /><span>Your starting point is enough.</span></div>
        <span className="visual-caption">Real possibilities. Honest starting points.</span>
      </div>
    </section>
    <section className="principle-band"><div className="container principle-inner"><p>There’s more than one<br /><strong>way forward.</strong></p><span>Technical & vocational pathways</span><span>Built around your constraints</span><span>Clear, rule-based recommendations</span></div></section>
    <section className="container how-section" aria-labelledby="how-heading"><div className="section-heading"><div><p className="eyebrow">FROM “WHAT NOW?” TO “WHAT’S NEXT?”</p><h2 id="how-heading">A starting point you can see.</h2></div><p>Bring your curiosity.<br />We’ll help connect the dots.</p></div><div className="steps-grid">{steps.map(({ number, icon: Icon, title, text }) => <article className="step-card" key={number}><div className="step-top"><span className="step-icon"><Icon size={23} strokeWidth={1.6} /></span><span>{number}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="container honest-section"><div className="honest-icon"><Laptop size={34} strokeWidth={1.4} /></div><div><p className="eyebrow">GUIDANCE, WITH PERSPECTIVE</p><h2>A match is a conversation starter.</h2><p>Our scores reflect self-reported skills, interests, and practical constraints. They help you explore—they don’t predict a job offer or define your future.</p></div><Link href="/about" className="text-link">How it works <ArrowRight size={17} /></Link></section>
    <section className="container future-note"><Sparkles size={18} aria-hidden="true" /><p>Explore career matches, weekly roadmaps and progress saved on this browser. Try practice assessments, initial Marathi onboarding, and optional AI wording with a rules-based fallback.</p></section>
  </main>;
}
