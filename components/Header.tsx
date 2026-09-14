'use client';

import Link from 'next/link';

interface HeaderProps {
  variant?: 'dark' | 'cream';
}

export default function Header({ variant = 'dark' }: HeaderProps) {
  if (variant === 'cream') {
    return (
      <header className="border-b border-[#E5E2D9] bg-[#FBF9F5]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded bg-[#FF6600] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              Y
            </div>
            <span className="font-bold text-lg text-[#1A1A1A] tracking-tight">Docly AI</span>
          </Link>
          <Link
            href="/chat"
            className="px-4 py-2 bg-[#FF6600] hover:bg-[#E55C00] text-white text-sm font-semibold rounded-md transition-all shadow-sm"
          >
            Launch App
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="font-bold text-lg text-white">Docly AI</span>
        </Link>
      </div>
    </header>
  );
}

