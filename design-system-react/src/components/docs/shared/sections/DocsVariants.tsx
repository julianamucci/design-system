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
  id?: string;
  note?: string;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, o
   * botão "Ver código / Ocultar código" de cada variant recebe
   * `data-track="code"` + `data-track-id="{slug}:code:{variant.name}"`
   * + `data-track-label="Copiar código"`.
   * Se ausente, `data-track-id` é omitido e o observer ignora o click.
   */
  componentSlug?: string;
}

function VariantCard({ item, componentSlug }: { item: DocsVariantItem; componentSlug?: string }) {
  const [open, setOpen] = useState(false);
  const trackId = componentSlug ? `${componentSlug}:code:${item.name}` : undefined;
  return (
    <Card className="p-4 space-y-2">
      <div>
        <p className="text-sm font-semibold">{item.name}</p>
        <p
          className="text-xs text-muted-foreground mt-0.5 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      </div>
      <div className="flex items-center justify-center">
        {item.preview}
      </div>
      {item.code && (
        <div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="px-0 h-auto"
            onClick={() => setOpen((v) => !v)}
            data-track="code"
            data-track-id={trackId}
            data-track-label="Copiar código"
          >
            {open ? 'Ocultar código' : 'Ver código'}
          </Button>
          {open && (
            <Card className="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none mt-2">
              <code className="whitespace-pre">{item.code}</code>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
}

export function DocsVariants({ title, items, id = "variantes", componentSlug }: DocsVariantsProps) {
  return (
    <section id={id}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <VariantCard key={i} item={item} componentSlug={componentSlug} />
        ))}
      </div>
    </section>
  );
}
