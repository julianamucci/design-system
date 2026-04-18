import React from 'react';
import { ComponentDemo } from '@/components/ComponentDemo';
import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsAnatomyProps {
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
}

export function DocsAnatomy({ title, items, structureCode, structureLabel }: DocsAnatomyProps) {
  return (
    <section id="anatomia">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ComponentDemo>
        <div className="space-y-4 w-full">
          <ol className="space-y-3 text-sm list-none p-0 m-0">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3 list-none">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
              </li>
            ))}
          </ol>
          <div className="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
            {structureLabel && (
              <p className="text-xs text-muted-foreground mb-2">{structureLabel}</p>
            )}
            <pre className="font-mono text-sm whitespace-pre">{structureCode}</pre>
          </div>
        </div>
      </ComponentDemo>
    </section>
  );
}
