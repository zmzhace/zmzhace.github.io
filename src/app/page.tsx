import Link from "next/link";
import { Github, Mail, Construction, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-balance mb-6">
          Hi, I&apos;m <span className="text-[#1c1917] dark:text-[#f5f5f4]">Ace (zmzhace)</span> 👋
        </h1>
        <p className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-2xl mb-10 leading-relaxed">
          Algorithm Engineer & Full-Stack Developer based in Shenzhen. 
          Specializing in AI Agents, LLM Fine-Tuning, and building modern web applications.
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
          {/* Project 1 */}
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

          {/* Project 2 */}
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

      {/* Latest Blog Posts Placeholder */}
      <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto w-full border-t border-[var(--border)]">
        <h2 className="text-2xl font-semibold mb-8">Latest Writings</h2>
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[var(--border)] rounded-2xl text-center">
          <Construction size={32} className="text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-medium mb-2">Blog coming soon</h3>
          <p className="text-[var(--muted-foreground)] max-w-md">
            I am currently setting up the markdown infrastructure for my blog. Check back later for articles on AI, Agent systems, and Full-Stack Engineering.
          </p>
        </div>
      </section>
    </div>
  );
}
