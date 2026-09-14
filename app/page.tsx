'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1A1A] flex flex-col justify-between font-sans selection:bg-[#FF6600]/20 selection:text-[#FF6600]">
      <Header variant="cream" />
      
      {/* YC-Style Clean Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-[#FF6600]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D95500]">
              Y Combinator Style • Minimal AI Intelligence
            </span>
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#111111] mb-6 leading-[1.15]">
            Docly AI
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#555555] mb-10 max-w-xl mx-auto font-normal leading-relaxed">
            Chat with your documents instantly. Upload any PDF and get accurate, cited answers powered by Groq + Jina AI.
          </p>
          
          {/* Main Call To Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <button className="w-full sm:w-auto px-8 py-4 bg-[#FF6600] hover:bg-[#E55C00] text-white font-semibold text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group">
                Get Started with Docly AI
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Bottom Bar */}
      <div className="border-t border-[#E5E2D9] py-6 text-center text-xs text-[#888888]">
        Powered by Groq LLM & Jina Embeddings
      </div>
    </div>
  );
}
