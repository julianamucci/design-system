import React from 'react';
import { Button } from '@/components/ui/button';

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
          <Button
            key={i}
            asChild
            variant="ghost"
            className="text-left h-auto p-4 border rounded-xl shadow-sm bg-card hover:bg-muted/50 w-full flex-col items-start space-y-1 whitespace-normal"
          >
            <a href={item.path} target="_top">
              <p className="text-sm font-semibold text-primary">{item.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
}
