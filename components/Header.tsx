'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

interface HeaderProps {
  variant?: 'dark' | 'cream';
}

export default function Header({ variant = 'dark' }: HeaderProps) {
  if (variant === 'cream') {
    return (
      <header className="border-b border-[#E5E2D9] bg-[#FBF9F5]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-[#FF6600] text-white flex items-center justify-center font-bold text-base shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-[#1A1A1A] tracking-tight">Docly AI</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-zinc-800/80 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded bg-[#FF6600] text-white flex items-center justify-center font-bold text-base shadow-sm">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Docly AI</span>
        </Link>
      </div>
    </header>
  );
}
