'use client';

export default function LoadingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1" aria-label="Loading response">
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  );
}

// Dev note 7: incremental maintenance update on 2026-03-02.

// Dev note 17: incremental maintenance update on 2026-03-12.

// Dev note 27: incremental maintenance update on 2026-03-22.
