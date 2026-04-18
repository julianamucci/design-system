import React, { useState } from 'react';
import { ComponentDemo } from '@/components/ComponentDemo';

export interface DocsExampleItem {
  title: string;
  description?: string;
  code: string;
  preview: React.ReactNode;
}

export interface DocsExamplesProps {
  title: string;
  items: DocsExampleItem[];
}

function ExampleCard({ item }: { item: DocsExampleItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">{item.title}</h3>
      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}
      <ComponentDemo>{item.preview}</ComponentDemo>
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          {open ? 'Ocultar código' : 'Ver código'}
        </button>
        {open && (
          <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2">
            <code className="whitespace-pre">{item.code}</code>
          </div>
        )}
      </div>
    </div>
  );
}

export function DocsExamples({ title, items }: DocsExamplesProps) {
  return (
    <section id="exemplos">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-10">
        {items.map((item, i) => (
          <ExampleCard key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
