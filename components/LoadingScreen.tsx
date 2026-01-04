
import React from 'react';

const LoadingScreen: React.FC = () => {
  const skeletons = Array.from({ length: 15 });

  return (
    <div className="w-full animate-fadeIn">
      <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-stone-100 pb-8 gap-4">
        <div className="space-y-3">
          <div className="h-12 w-48 bg-stone-100 animate-pulse rounded-sm"></div>
          <div className="flex gap-3">
            <div className="h-5 w-20 bg-stone-100 animate-pulse rounded-full"></div>
            <div className="h-5 w-20 bg-stone-100 animate-pulse rounded-full"></div>
          </div>
        </div>
        <div className="h-8 w-32 bg-stone-50 animate-pulse rounded-md"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16">
        {skeletons.map((_, i) => (
          <div key={i} className="flex flex-col">
            <div className="relative aspect-square mb-5 bg-stone-100 border border-stone-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              <div className="w-full h-full bg-stone-100 animate-pulse"></div>
            </div>
            <div className="px-1 space-y-2">
              <div className="h-5 w-3/4 bg-stone-100 animate-pulse rounded-sm"></div>
              <div className="h-3 w-1/2 bg-stone-50 animate-pulse rounded-sm"></div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
