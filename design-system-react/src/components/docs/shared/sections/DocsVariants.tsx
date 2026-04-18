import React from 'react';

export interface DocsVariantItem {
  name: string;
  description: string;
  preview: React.ReactNode;
}

export interface DocsVariantsProps {
  title: string;
  items: DocsVariantItem[];
}

export function DocsVariants({ title, items }: DocsVariantsProps) {
  return (
    <section id="variantes">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={i} className="border rounded-xl p-5 shadow-sm space-y-3 bg-card">
            <div className="flex items-center justify-center min-h-[60px]">
              {item.preview}
            </div>
            <div>
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
