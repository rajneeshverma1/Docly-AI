'use client';

import Link from 'next/link';
import { FileText, MessageSquare, CheckCircle, ArrowRight, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm text-gray-300 font-medium">AI-Powered Document Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Docly AI
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Chat with your documents. Upload any PDF and get instant, cited answers powered by Groq + Jina AI.
          </p>
          
          <Link href="/chat">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-black px-8 py-6 text-lg rounded-lg font-semibold transition-all">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 hover:border-zinc-600 transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Upload PDFs</h3>
            <p className="text-gray-400">
              Simply drag and drop your PDF documents. We'll process them instantly and make them searchable.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 hover:border-zinc-600 transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Ask Anything</h3>
            <p className="text-gray-400">
              Ask questions in natural language. Our AI understands context and provides relevant answers.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 hover:border-zinc-600 transition-all">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Get Cited Answers</h3>
            <p className="text-gray-400">
              Every answer includes citations showing exactly which document and page the information came from.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to transform how you work with documents?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Start chatting with your PDFs in seconds. No signup required.
          </p>
          <Link href="/chat">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg rounded-lg font-semibold">
              Try Docly AI Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 Docly AI — Built by Rajneesh Verma. Powered by Groq + Jina AI.</p>
        </div>
      </footer>
    </div>
  );
}
