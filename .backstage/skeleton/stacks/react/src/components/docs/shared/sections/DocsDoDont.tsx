import React from 'react';
import { Card } from '@/components/ui/card';

export interface DocsDoDontPair {
  doLabel: string;
  dontLabel: string;
  doPreview: React.ReactNode;
  dontPreview: React.ReactNode;
  doCaption: string;
  dontCaption: string;
}

export interface DocsDoDontProps {
  title: string;
  pairs: DocsDoDontPair[];
}

export function DocsDoDont({ title, pairs }: DocsDoDontProps) {
  return (
    <section id="do-dont">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <Card className="mt-6 p-4">
          <div className="space-y-8 w-full">
            {pairs.map((pair, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DO */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                    <span className="text-sm font-semibold uppercase tracking-wider">{pair.doLabel}</span>
                  </div>
                  <div className="border border-green-200 dark:border-green-900/50 rounded-xl p-4 bg-green-50/50 dark:bg-green-950/10">
                    {pair.doPreview}
                  </div>
                  <p className="text-sm text-muted-foreground italic px-1">{pair.doCaption}</p>
                </div>
                {/* DON'T */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                    <span className="text-sm font-semibold uppercase tracking-wider">{pair.dontLabel}</span>
                  </div>
                  <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-4 bg-red-50/50 dark:bg-red-950/10">
                    {pair.dontPreview}
                  </div>
                  <p className="text-sm text-muted-foreground italic px-1">{pair.dontCaption}</p>
                </div>
              </div>
            ))}
          </div>
      </Card>
    </section>
  );
}
