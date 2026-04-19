import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
  preview: React.ReactNode;
}

export interface DocsVariantsProps {
  title: string;
  items: DocsVariantItem[];
}

function VariantCard({ item }: { item: DocsVariantItem }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-center min-h-[60px]">
        {item.preview}
      </div>
      <div>
        <p className="text-sm font-semibold">{item.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
      </div>
      {item.code && (
        <div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0 h-auto"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Ocultar código' : 'Ver código'}
          </Button>
          {open && (
            <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-2">
              <code className="whitespace-pre">{item.code}</code>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function DocsVariants({ title, items }: DocsVariantsProps) {
  return (
    <section id="variantes">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <VariantCard key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
