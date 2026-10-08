import Link from "next/link";
import { ShieldCheck, Search, Gauge, Cpu, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScoreBar } from "@/components/ui/score-bar";

const sections = [
  "What we analyze",
  "Technology detection",
  "AI recommendations",
  "Dashboard preview",
  "How it works",
  "Use cases",
  "Pricing",
  "FAQ",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          Auditly
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[var(--muted-foreground)] md:flex">
          {sections.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="hover:text-[var(--foreground)]">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <Link href="/audits/new">
            <Button>Run an audit</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-10 pt-10 md:grid-cols-2 md:px-8 md:pt-16">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">AI-powered website intelligence</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">Find what is holding your website back.</h1>
          <p className="mt-5 max-w-xl text-base text-[var(--muted-foreground)] md:text-lg">
            Scan performance, SEO, accessibility, security signals, technology, and user experience — then get clear
            recommendations for what to fix next.
          </p>
          <form action="/audits/new" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="url" className="sr-only">
              Website URL
            </label>
            <Input id="url" name="url" defaultValue="https://example.com" className="h-12 text-sm" required />
            <Button className="h-12 px-6">Run Audit</Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
            <span>Deterministic scoring</span>
            <span>Evidence-backed findings</span>
            <span>AI-assisted explanations</span>
          </div>
        </div>

        <Card className="bg-[var(--surface-elevated)]">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Website audit</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">example.com</p>
          <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-4">
            <p className="mono text-4xl font-semibold">82</p>
            <p className="text-sm text-[var(--muted-foreground)]">Overall score · Needs improvement</p>
          </div>
          <div className="mt-5 space-y-3">
            <ScoreBar label="Performance" score={88} />
            <ScoreBar label="SEO" score={76} />
            <ScoreBar label="Accessibility" score={91} />
            <ScoreBar label="Security" score={79} />
            <ScoreBar label="Mobile UX" score={86} />
          </div>
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-4 text-sm text-[var(--muted-foreground)]">
            <p>Technology: Next.js · React · Tailwind CSS · Vercel · Cloudflare</p>
            <p className="mt-2">Priority findings: 3 High · 7 Medium · 14 Low</p>
          </div>
        </Card>
      </section>

      <section id="what-we-analyze" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
        <h2 className="text-2xl font-semibold">What we analyze</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Performance", Gauge, "Core loading and responsiveness signals with measurable evidence."],
            ["SEO", Search, "Metadata, indexability signals, heading structure, and crawl-readiness."],
            ["Security signals", ShieldCheck, "HTTPS and externally verifiable security-header coverage."],
            ["Accessibility", CheckCircle2, "Automated semantic checks with clear manual-review boundaries."],
            ["Technology stack", Cpu, "Framework, CMS, analytics, and infrastructure signal detection."],
            ["AI recommendations", Sparkles, "Prioritized fixes explained in technical and business language."],
          ].map(([title, Icon, body]) => (
            <Card key={String(title)}>
              <Icon className="h-5 w-5 text-[var(--primary)]" aria-hidden />
              <h3 className="mt-3 text-base font-semibold">{String(title)}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{String(body)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-5 grid list-none gap-4 md:grid-cols-5">
          {[
            "Enter URL",
            "Validate target",
            "Run technical analyzers",
            "Compute deterministic scores",
            "Get prioritized recommendations",
          ].map((step, index) => (
            <li key={step} className="surface p-4 shadow-[var(--shadow-sm)]">
              <p className="mono text-xs text-[var(--muted-foreground)]">0{index + 1}</p>
              <p className="mt-2 text-sm font-medium">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8">
        <h2 className="text-2xl font-semibold">Pricing</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Free", "For individuals getting started", ["Limited audits", "Single user", "Basic report access"]],
            ["Pro", "For freelancers and teams", ["More monthly audits", "History and trends", "PDF exports"]],
            ["Agency", "For multi-site client operations", ["Multiple websites", "Team collaboration", "Brandable reports"]],
          ].map(([plan, desc, features]) => (
            <Card key={String(plan)}>
              <h3 className="text-lg font-semibold">{String(plan)}</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{String(desc)}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {(features as string[]).map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-5 space-y-3">
          {[
            ["Are scores AI-generated?", "No. Scores are computed from deterministic weighted checks."],
            ["Does AI invent evidence?", "No. AI only explains verified findings collected by analyzers."],
            ["Can I track progress over time?", "Yes. Audit history and trends are available per website."],
          ].map(([q, a]) => (
            <Card key={String(q)} className="p-4">
              <h3 className="text-sm font-semibold">{String(q)}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{String(a)}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border-subtle)] py-8 text-center text-sm text-[var(--muted-foreground)]">
        <p>Auditly · Technical website intelligence for developers, agencies, and modern businesses.</p>
      </footer>
    </main>
  );
}
