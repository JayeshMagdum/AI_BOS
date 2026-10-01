/**
 * app/page.tsx
 *
 * AI BOS Marketing Landing Page.
 *
 * If the user is already authenticated, redirects directly to /dashboard.
 * Otherwise, renders an enterprise document intelligence product homepage.
 */
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileStack,
  Cpu,
  Workflow,
  BarChart3,
  ShieldCheck,
  Database,
  ArrowRight,
  Layers,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  CornerDownRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users immediately to /dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // While auth state is resolving, render a dark backdrop without layout flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Verifying workspace session…</span>
        </div>
      </div>
    );
  }

  // If already authenticated and redirect is pending, keep minimal screen
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>Redirecting to dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ── STICKY TOP NAV ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Left */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-foreground">AI BOS</span>
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Business OS
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-base font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Capabilities
            </a>
            <a href="#preview" className="hover:text-foreground transition-colors">
              Platform Demo
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </nav>

          {/* Actions Right: Login (Ghost/Outline) + Sign up (Filled Primary) */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="default" asChild className="text-base">
              <Link href="/login" id="nav-btn-login">
                Sign in
              </Link>
            </Button>
            <Button
              variant="default"
              size="default"
              className="shadow-sm shadow-primary/25 font-medium px-5 text-base"
              asChild
            >
              <Link href="/signup" id="nav-btn-signup">
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border/40">
        {/* Subtle engineered background grid & illumination */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted/80 border border-border text-muted-foreground mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Enterprise Knowledge Retrieval &amp; RAG System</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            Transform complex business files into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-sky-300">
              instant, verified answers
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-normal leading-relaxed">
            AI BOS ingests your balance sheets, technical specifications, legal contracts, and operational spreadsheets. Ask natural language questions and receive precise, citation-backed answers with zero guesswork.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base font-semibold px-8 h-12 shadow-lg shadow-primary/20 group"
              asChild
            >
              <Link href="/signup" id="hero-btn-get-started">
                Get started free
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base font-medium px-6 h-12"
              asChild
            >
              <Link href="/login" id="hero-btn-demo">
                Sign in to workspace
              </Link>
            </Button>
          </div>

          {/* Trust points */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Grounded Citations with Relevance Scores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Multi-Format (PDF, Word, Excel, CSV)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Tenant-Isolated Qdrant Vector DB</span>
            </div>
          </div>
        </div>

        {/* ── LIVE INTERFACE PREVIEW MOCKUP ────────────────────────── */}
        <div id="preview" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16">
          <div className="rounded-xl border border-border/80 bg-card shadow-2xl shadow-black/40 overflow-hidden">
            {/* Window Header */}
            <div className="h-10 bg-muted/60 border-b border-border/80 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-muted-foreground">
                  AI BOS / Enterprise Knowledge Retrieval
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Vector cluster live
              </div>
            </div>

            {/* Window Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/60 bg-card/60">
              {/* Left Column: Active Ingested Files */}
              <div className="md:col-span-4 p-5 space-y-3 bg-muted/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Indexed Business Files</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">3 Active</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border border-border bg-card/80 flex items-start gap-2.5">
                    <FileText className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">Q3_Financial_Statement.pdf</p>
                      <p className="text-[11px] text-muted-foreground font-mono">42 chunks · 100% indexed</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border bg-card/80 flex items-start gap-2.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">Supply_Chain_Unit_Economics.xlsx</p>
                      <p className="text-[11px] text-muted-foreground font-mono">28 chunks · 100% indexed</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border bg-card/80 flex items-start gap-2.5">
                    <FileText className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">Enterprise_MSA_Master_2026.docx</p>
                      <p className="text-[11px] text-muted-foreground font-mono">19 chunks · 100% indexed</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="rounded-md bg-background/50 border border-dashed border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Drag &amp; drop any PDF, DOCX, XLSX, or CSV</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Active RAG Query & Grounded Answer */}
              <div className="md:col-span-8 p-5 sm:p-6 space-y-4">
                {/* User Prompt */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="rounded-xl rounded-tr-sm bg-primary px-4 py-2.5 text-xs sm:text-sm text-primary-foreground max-w-lg shadow-sm">
                    What were our net operating margins across Q2 and Q3, and what was the main driver of the change?
                  </div>
                </div>

                {/* AI Assistant Grounded Answer */}
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="rounded-xl rounded-tl-sm border border-border bg-card p-4 text-xs sm:text-sm text-foreground/90 space-y-2 leading-relaxed shadow-sm">
                      <p>
                        Based on your uploaded financial statements, net operating margin expanded from <strong className="text-foreground font-semibold">18.4% in Q2</strong> to <strong className="text-foreground font-semibold">22.1% in Q3 (+370 bps)</strong>.
                      </p>
                      <p className="text-muted-foreground text-xs">
                        The primary driver was a 14.2% decrease in raw logistics unit costs reported on Page 14, complemented by a favorable shift toward high-margin recurring enterprise software licensing contracts.
                      </p>

                      {/* Source Citation Cards */}
                      <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Grounding Citations
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-muted/80 border border-border text-foreground/80">
                            <span className="text-primary font-bold">[1]</span> Q3_Financial_Statement.pdf (p. 14, Chunk 8)
                            <span className="text-emerald-400 font-semibold">98.4% match</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-muted/80 border border-border text-foreground/80">
                            <span className="text-primary font-bold">[2]</span> Supply_Chain_Unit_Economics.xlsx (Row 34)
                            <span className="text-emerald-400 font-semibold">96.2% match</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES / FEATURES ──────────────────────────── */}
      <section id="features" className="py-20 md:py-28 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Engineered for Precision
            </h2>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              A complete operating system for organizational knowledge
            </p>
            <p className="mt-4 text-base text-muted-foreground">
              Built from the ground up to eliminate hallucinations. Every insight is retrieved from authoritative files you control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
              <div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                  <FileStack className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Universal Document Ingestion
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Extract structured and unstructured text from PDF, DOCX, CSV, and complex multi-sheet Excel files with recursive hierarchical chunking.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center text-xs font-medium text-primary">
                <span>PDF · DOCX · XLSX · CSV</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
              <div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Citation-Grounded RAG
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vector retrieval using Qdrant Cloud and Gemini. Every answer displays the source file name, chunk index, excerpt, and mathematical similarity score.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center text-xs font-medium text-emerald-400">
                <span>Zero Hallucinations Guarantee</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
              <div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                  <Workflow className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Multi-Turn Context Sessions
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Retain conversational memory across complex investigation sessions. Filter queries to specific documents or query the full workspace corpus.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center text-xs font-medium text-amber-400">
                <span>Scoped or Global Search</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
              <div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Live Business Analytics
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time telemetry on document storage, format breakdown, 14-day upload/query velocity, and system accuracy metrics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center text-xs font-medium text-violet-400">
                <span>Executive Dashboards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE & SECURITY ───────────────────────────────── */}
      <section id="architecture" className="py-20 md:py-24 bg-muted/10 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-border bg-card/80 p-7">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Hybrid Relational &amp; Vector Core
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PostgreSQL (Neon) manages transactional user, session, and metadata states, while Qdrant Cloud handles dense vector similarity queries with millisecond retrieval.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-7">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Tenant-Isolated Security
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every document payload and vector point is partitioned by user ID. Your company’s data is never intermingled, leakable, or used to train public foundational models.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-7">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Gemini 2.5 Intelligence Engine
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Harnesses high-reasoning Gemini models via the modern Google GenAI SDK, providing sophisticated multi-step deduction, synthesis, and tabular analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ────────────────────────────────────────── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Ready to empower your workspace with AI BOS?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your first business document and start querying your organization’s private knowledge in under two minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base font-semibold px-8 h-12 shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/signup" id="cta-btn-get-started">
                Get started free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base font-medium px-6 h-12"
              asChild
            >
              <Link href="/login" id="cta-btn-login">
                Sign in to existing account
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/40 py-8 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">AI BOS</span>
            <span className="text-xs text-muted-foreground">· Enterprise Document Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Create account
            </Link>
            <span>&copy; {new Date().getFullYear()} AI BOS Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
