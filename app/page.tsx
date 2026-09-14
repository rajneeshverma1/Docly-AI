'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between font-sans selection:bg-[#FF6600]/30 selection:text-[#FF8533]">
      <Header variant="dark" />
      
      {/* Sleek Dark Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#FF6600]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-full mb-8 shadow-inner">
            <Sparkles className="w-4 h-4 text-[#FF6600]" />
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              AI-Powered Document Intelligence
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-white mb-8 leading-[1.05]">
            Docly AI
          </h1>
          
          {/* Subtitle - High visibility text */}
          <p className="text-xl sm:text-2xl md:text-3xl text-zinc-300 mb-12 max-w-3xl mx-auto font-normal leading-relaxed">
            Chat with your documents instantly. Upload any PDF and get accurate, cited answers powered by Groq + Jina AI.
          </p>
          
          {/* Main Call To Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <button className="w-full sm:w-auto px-10 py-5 bg-[#FF6600] hover:bg-[#E55C00] text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg shadow-[#FF6600]/20 hover:shadow-[#FF6600]/40 flex items-center justify-center gap-3 group">
                Get Started with Docly AI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Bottom Bar */}
      <div className="border-t border-zinc-800/80 py-6 text-center text-sm font-medium text-zinc-400">
        Powered by Groq LLM & Jina Embeddings
      </div>
    </div>
  );
}
