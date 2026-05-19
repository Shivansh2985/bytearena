'use client';

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Eye, BarChart3, Users, Code2, Zap, Shield, Sparkles, CheckCircle2, Sun, Moon } from "lucide-react";
import { useSession } from 'next-auth/react';

// --- Mocks and inline components to satisfy missing imports ---
const CONTESTS = [
  { id: 'c1', title: 'ByteBlitz Weekly #18', difficulty: 'Medium', status: 'live', startTime: Date.now() - 3600000, endTime: Date.now() + 5400000, participants: 3842, tags: ['Graphs', 'DP', 'Trees'] },
  { id: 'c2', title: 'AlgoArena Qualifier #6', difficulty: 'Hard', status: 'live', startTime: Date.now() - 1800000, endTime: Date.now() + 9900000, participants: 1204, tags: ['Segment Tree', 'Greedy'] },
  { id: 'c3', title: 'CodeStorm Sprint #4', difficulty: 'Easy', status: 'upcoming', startTime: Date.now() + 86400000, endTime: Date.now() + 90000000, participants: 0, tags: ['Arrays', 'Strings', 'Math'] },
];

import { useTheme } from 'next-themes';

function PublicNav() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.id;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 font-bold text-lg text-foreground">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Zap size={18} fill="currentColor" />
        </div>
        ByteArena
      </div>
      
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <Link href="/" className="text-foreground">Home</Link>
        <Link href="/contests" className="hover:text-foreground transition-colors">Contests</Link>
        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
        <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link href="#contact" className="hover:text-foreground transition-colors">Contact</Link>
      </div>

      <div className="flex gap-4 items-center">
        <button 
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors" 
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {!isLoaded ? null : userId ? (
          <Link href="/user-dashboard" className="bg-primary px-4 py-2 rounded-md text-sm font-semibold text-white hover:opacity-90 transition-opacity">Go to Dashboard</Link>
        ) : (
          <>
            <Link href="/sign-up-login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/sign-up-login" className="bg-primary px-4 py-2 rounded-md text-sm font-semibold text-white hover:opacity-90 transition-opacity">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function PublicFooter() {
  return (
    <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/60">
      &copy; 2026 ByteArena. All rights reserved.
    </footer>
  );
}

function GlowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-border/60 glass overflow-hidden hover:shadow-glow transition-shadow duration-300">
      {children}
    </div>
  );
}

function ContestCard({ contest, index }: { contest: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="p-5 border border-border/60 rounded-2xl glass"
    >
      <div className="flex justify-between items-start mb-4">
        <span className={`text-xs px-2 py-1 rounded ${contest.status === 'live' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {contest.status.toUpperCase()}
        </span>
        <span className="text-xs text-muted-foreground">{contest.difficulty}</span>
      </div>
      <h3 className="font-semibold text-lg">{contest.title}</h3>
      <div className="mt-4 flex gap-2 flex-wrap">
        {contest.tags.map((t: string) => <span key={t} className="text-xs bg-muted/40 px-2 py-1 rounded">{t}</span>)}
      </div>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <Hero />
      <Stats />
      <FeaturedContests />
      <Features />
      <Testimonials />
      <CTA />
      <PublicFooter />
    </div>
  );
}

function Hero() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.id;
  
  return (
    <section className="relative overflow-hidden bg-galaxy">
      <div className="absolute inset-0 stars-bg opacity-50 dark:opacity-80 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 glass px-4 py-1.5 text-xs font-medium mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live: Quantum Clash 2026 — 4,821 coders battling now
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            Code. Compete.
            <br />
            <span className="text-gradient">Conquer the arena.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            ByteArena is the premium competitive coding platform for serious students and institutions —
            live contests, AI-assisted proctoring, and analytics that level you up.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {userId ? (
              <Link
                href="/user-dashboard"
                className="group inline-flex h-12 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-all hover:scale-[1.03]"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/sign-up-login"
                className="group inline-flex h-12 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-all hover:scale-[1.03]"
              >
                Start coding free
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <Link
              href="/contests"
              className="inline-flex h-12 items-center rounded-md border border-border glass px-6 text-sm font-semibold hover:bg-secondary"
            >
              Browse contests
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            {["No setup required", "Live proctoring", "1M+ submissions / week"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Floating code preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl border border-border/60 glass overflow-hidden shadow-glow animate-float">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              </div>
              <span className="ml-3 text-xs text-muted-foreground font-mono">stellar_subarray.cpp · Quantum Clash 2026 · 02:14:38</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-success">Auto-saved</span>
            </div>
            <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto">
              <code className="text-muted-foreground">
                <span className="text-primary">#include</span> <span className="text-accent">&lt;bits/stdc++.h&gt;</span>{"\n"}
                <span className="text-primary">using namespace</span> std;{"\n\n"}
                <span className="text-info">int</span> <span className="text-accent">main</span>() {"{"}{"\n"}
                {"  "}<span className="text-info">int</span> n, k; cin {">>"} n {">>"} k;{"\n"}
                {"  "}vector{"<"}<span className="text-info">long long</span>{">"} a(n);{"\n"}
                {"  "}<span className="text-primary">for</span> (<span className="text-info">auto</span>{" "}&x : a) cin {">>"} x;{"\n"}
                {"  "}<span className="text-info">long long</span> sum = 0, best = LLONG_MIN;{"\n"}
                {"  "}<span className="text-primary">for</span> (<span className="text-info">int</span> i = 0; i {"<"} k; ++i) sum += a[i];{"\n"}
                {"  "}best = sum;{"\n"}
                {"  "}<span className="text-primary">for</span> (<span className="text-info">int</span> i = k; i {"<"} 2*n; ++i) {"{"}{"\n"}
                {"    "}sum += a[i%n] - a[(i-k)%n];{"\n"}
                {"    "}best = max(best, sum);{"\n"}
                {"  "}{"}"}{"\n"}
                {"  "}cout {"<<"} best {"<<"} <span className="text-success">"\n"</span>;{"\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { label: "Active coders", value: "180K+" },
    { label: "Contests run", value: "2,400" },
    { label: "Submissions / wk", value: "1.2M" },
    { label: "Partner colleges", value: "320" },
  ];
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="text-center"
          >
            <div className="font-display text-3xl sm:text-4xl font-bold text-gradient">{s.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturedContests() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Live & upcoming</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">Jump into the arena</h2>
        </div>
        <Link href="/contests" className="text-sm font-medium text-primary hover:underline">View all →</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CONTESTS.slice(0, 3).map((c, i) => <ContestCard key={c.id} contest={c} index={i} />)}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Trophy, title: "Live contests", desc: "Real-time leaderboards, dynamic scoring, and 60-second status updates." },
    { icon: Eye, title: "AI proctoring", desc: "Camera + behavior analysis with snapshot review and flag escalation." },
    { icon: BarChart3, title: "Deep analytics", desc: "10+ visualizations across rating, accuracy, language, and topic coverage." },
    { icon: Code2, title: "Polished editor", desc: "Multi-language editor with custom tests, run/submit, and resizable panes." },
    { icon: Shield, title: "Admin suite", desc: "Manage contests, questions, hidden testcases, ratings, and participants." },
    { icon: Zap, title: "Real-time rank", desc: "Position updates the moment a verdict lands. No refresh needed." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Everything you need</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">Built like a flagship product</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <GlowCard key={it.title}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="p-6"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-border">
                <it.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
            </motion.div>
          </GlowCard>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const t = [
    { name: "Sneha P.", role: "CSE @ IIT Bombay", quote: "ByteArena's proctored mocks gave me actual interview confidence. UI is gorgeous." },
    { name: "Prof. Rao", role: "NIT Trichy", quote: "We ran our department contest for 600 students with zero hiccups. Admin tools are excellent." },
    { name: "Karan J.", role: "ICPC Regionalist", quote: "The analytics dashboard alone is worth it. Rating graphs feel motivating." },
  ];
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Loved by coders</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">From dorm rooms to campus toppers</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {t.map((x, i) => (
            <GlowCard key={x.name}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="mt-4 text-sm leading-relaxed">"{x.quote}"</p>
                <div className="mt-5 pt-4 border-t border-border/60">
                  <p className="font-semibold text-sm">{x.name}</p>
                  <p className="text-xs text-muted-foreground">{x.role}</p>
                </div>
              </motion.div>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const userId = session?.user?.id;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 glass p-10 md:p-16 text-center">
        <div className="absolute inset-0 stars-bg opacity-30 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative">
          <h2 className="font-display text-3xl sm:text-5xl font-bold">Ready to level up?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join 180K+ students competing weekly. It's free to start, and your first contest is just a click away.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {userId ? (
              <Link href="/user-dashboard" className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 hover:scale-105 transition-all">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-up-login" className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 hover:scale-105 transition-all">
                  Create my account
                </Link>
                <Link href="/sign-up-login" className="inline-flex h-12 items-center rounded-md border border-border px-6 text-sm font-semibold hover:bg-secondary">
                  I have an account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}