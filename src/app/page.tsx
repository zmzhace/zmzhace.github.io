import Link from "next/link";
import { Github, Mail, ChevronRight, Sprout, Sparkles, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-balance mb-6">
          Hi, I&apos;m <span className="text-[#1c1917] dark:text-[#f5f5f4]">Ace (zmzhace)</span> 👋
        </h1>
        <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mb-10 leading-relaxed">
          Algorithm Engineer & Full-Stack Developer.
          Currently building <a href="https://github.com/zmzhace/SeedWorld" className="underline underline-offset-4 decoration-emerald-500 hover:text-emerald-600 transition-colors font-medium">SeedWorld</a> — an emergent world simulation engine where LLM-driven characters write their own stories.
        </p>

        <div className="flex items-center gap-4">
          <a href="https://github.com/zmzhace" target="_blank" rel="noreferrer"
             className="flex items-center gap-2 px-5 py-2.5 bg-[var(--foreground)] text-[var(--background)] rounded-full font-medium hover:opacity-90 transition-opacity">
            <Github size={18} />
            GitHub
          </a>
          <a href="mailto:zmzhace@gmail.com"
             className="flex items-center gap-2 px-5 py-2.5 bg-[var(--muted)] text-[var(--foreground)] rounded-full font-medium hover:bg-[var(--border)] transition-colors">
            <Mail size={18} />
            Contact
          </a>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto w-full border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Featured Projects</h2>
          <a href="https://github.com/zmzhace" target="_blank" rel="noreferrer" className="text-sm flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            View all <ChevronRight size={16} />
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* SeedWorld - Featured */}
          <a href="https://github.com/zmzhace/SeedWorld" target="_blank" rel="noreferrer" className="group border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors block md:col-span-2">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-2xl">🌱</div>
                <div>
                  <h3 className="text-xl font-medium group-hover:underline decoration-emerald-500 underline-offset-4">
                    SeedWorld
                  </h3>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Plant a world. Watch it grow.</span>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">Active</span>
            </div>
            <p className="text-[var(--muted-foreground)] mb-4 leading-relaxed">
              An emergent world simulation engine. Describe a world, the engine generates characters with personalities, goals, and grudges — then lets them loose. 12 mechanism systems (reputation, resources, tension, memes...) form LLM feedback loops. Betrayals, alliances, negotiations — all emergent, never scripted.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">Next.js</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">TypeScript</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">LLM Agents</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">Emergence</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">graphology</span>
            </div>
          </a>

          {/* Open-Cowork */}
          <a href="https://github.com/zmzhace/open-cowork" target="_blank" rel="noreferrer" className="group border border-[var(--border)] p-6 rounded-2xl hover:border-[var(--muted-foreground)] transition-colors block">
            <h3 className="text-xl font-medium mb-3 group-hover:underline decoration-[var(--muted-foreground)] underline-offset-4">
              Open-Cowork
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4 line-clamp-2">
              Cross-platform AI collaborative workspace with transparent execution tracing and intelligent assistant features.
            </p>
            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">React</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">Electron</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">Python Agent</span>
            </div>
          </a>

          {/* memfog */}
          <a href="https://github.com/zmzhace/memfog" target="_blank" rel="noreferrer" className="group border border-[var(--border)] p-6 rounded-2xl hover:border-[var(--muted-foreground)] transition-colors block">
            <h3 className="text-xl font-medium mb-3 group-hover:underline decoration-[var(--muted-foreground)] underline-offset-4">
              memfog
            </h3>
            <p className="text-[var(--muted-foreground)] mb-4 line-clamp-2">
              Personal knowledge atomization & LLM augmented memory system designed to empower AI Agents.
            </p>
            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">Python</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">RAG</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)] font-mono">FastAPI</span>
            </div>
          </a>
        </div>
      </section>

      {/* What I'm Working On */}
      <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto w-full border-t border-[var(--border)]">
        <h2 className="text-2xl font-semibold mb-8">What I&apos;m Building</h2>
        <div className="border border-[var(--border)] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} className="text-emerald-500" />
            <h3 className="text-lg font-medium">SeedWorld — Emergent World Simulation</h3>
          </div>
          <p className="text-[var(--muted-foreground)] mb-6 leading-relaxed max-w-3xl">
            The core idea: give an LLM a world description, generate characters with desires and grudges, and let them interact freely. Stories emerge from chaos — no scripts, no behavior trees. 12 interlocking mechanism systems create realistic social dynamics through LLM feedback loops.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)]">
              <span className="text-emerald-500 font-bold mt-0.5">01</span>
              <div>
                <div className="font-medium mb-0.5">Emergent Narrative</div>
                <div className="text-[var(--muted-foreground)] text-xs">Characters scheme, negotiate, and betray based on personality + context, not rules</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)]">
              <span className="text-emerald-500 font-bold mt-0.5">02</span>
              <div>
                <div className="font-medium mb-0.5">LLM Feedback Loops</div>
                <div className="text-[var(--muted-foreground)] text-xs">Agents self-evaluate social impact → systems update → next prompt reflects changes</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)]">
              <span className="text-emerald-500 font-bold mt-0.5">03</span>
              <div>
                <div className="font-medium mb-0.5">Chat with Your World</div>
                <div className="text-[var(--muted-foreground)] text-xs">Type events into the chat, LLM interprets them, agents react naturally</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)]">
              <span className="text-emerald-500 font-bold mt-0.5">04</span>
              <div>
                <div className="font-medium mb-0.5">Universal Engine</div>
                <div className="text-[var(--muted-foreground)] text-xs">Wuxia, cyberpunk, medieval — any world setting works with zero hardcoding</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Writings */}
      <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto w-full border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Latest Writings</h2>
          <Link
            href="/posts"
            className="text-sm flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Explore all posts <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="border border-[var(--border)] rounded-2xl p-8 text-[var(--muted-foreground)]">
          Dive into notes on emergent AI simulation, multi-agent systems, and the journey of building SeedWorld.
        </div>
      </section>
    </div>
  );
}
