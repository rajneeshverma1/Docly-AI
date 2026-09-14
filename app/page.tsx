'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1A1A] flex flex-col justify-between font-sans selection:bg-[#FF6600]/20 selection:text-[#FF6600]">
      <Header variant="cream" />
      
      {/* YC-Style Hero Section with Bigger Typography */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6600]/10 border border-[#FF6600]/20 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-[#FF6600]" />
            <span className="text-sm font-semibold uppercase tracking-wide text-[#D95500]">
              AI-Powered Document Intelligence
            </span>
          </div>
          
          {/* Main Title - Extra Large */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-[#111111] mb-8 leading-[1.05]">
            Docly AI
          </h1>
          
          {/* Subtitle - Bigger */}
          <p className="text-xl sm:text-2xl md:text-3xl text-[#444444] mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Chat with your documents instantly. Upload any PDF and get accurate, cited answers powered by Groq + Jina AI.
          </p>
          
          {/* Main Call To Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <button className="w-full sm:w-auto px-10 py-5 bg-[#FF6600] hover:bg-[#E55C00] text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group">
                Get Started with Docly AI
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Minimalist Bottom Bar */}
      <div className="border-t border-[#E5E2D9] py-6 text-center text-sm font-medium text-[#777777]">
        Powered by Groq LLM & Jina Embeddings
      </div>
    </div>
  );
}
