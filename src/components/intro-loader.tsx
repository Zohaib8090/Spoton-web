
'use client';

import { SpotonLogo } from '@/components/spoton-logo';
import { cn } from '@/lib/utils';

export function IntroLoader({ loading }: { loading: boolean }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000',
        loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <SpotonLogo className="h-24 w-24 text-white" />
        <h1 className="text-4xl font-bold tracking-tight text-white">Spoton</h1>
      </div>
      <div className="absolute bottom-8 text-center">
        <p className="text-sm text-gray-400">By zohaib</p>
      </div>
    </div>
  );
}
