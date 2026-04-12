import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DoDontPair {
  do: {
    visual: React.ReactNode;
    description: string;
  };
  dont: {
    visual: React.ReactNode;
    description: string;
  };
}

export function DoDont({ pairs }: { pairs: DoDontPair[] }) {
  return (
    <div className="space-y-12">
      {pairs.map((pair, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* DO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Faça isso</span>
            </div>
            <div className="border border-emerald-500/20 rounded-xl p-6 bg-emerald-500/5 min-h-[160px] flex items-center justify-center">
              {pair.do.visual}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pair.do.description}
            </p>
          </div>

          {/* DON'T */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">Não faça isso</span>
            </div>
            <div className="border border-rose-500/20 rounded-xl p-6 bg-rose-500/5 min-h-[160px] flex items-center justify-center">
              {pair.dont.visual}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {pair.dont.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
