import React from 'react';

export interface DocsRelatedItem {
  name: string;
  description: string;
  path: string;
}

export interface DocsRelatedProps {
  title: string;
  items: DocsRelatedItem[];
}

export function DocsRelated({ title, items }: DocsRelatedProps) {
  return (
    <section id="relacionados">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              (window.top ?? window).location.href = item.path;
            }}
            className="text-left border rounded-xl p-4 shadow-sm bg-card hover:bg-muted/50 transition-colors space-y-1 cursor-pointer"
          >
            <p className="text-sm font-semibold text-primary">{item.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
