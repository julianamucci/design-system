import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
  preview: React.ReactNode;
  /**
   * Chave estável de tracking. Sem ela o id cai em `name`, que pode vir
   * traduzido — e aí o mesmo evento sai com um valor por idioma.
   */
  trackId?: string;
}

export interface DocsVariantsProps {
  title: string;
  items: DocsVariantItem[];
  id?: string;
  note?: string;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, o
   * botão "Ver código / Ocultar código" de cada variant recebe
   * `data-track="code"` + `data-track-id="{slug}:code:{variant.trackId ?? variant.name}"`
   * + `data-track-label="Copiar código"`.
   * Se ausente, `data-track-id` é omitido e o observer ignora o click.
   */
  componentSlug?: string;
}

function VariantCard({ item, componentSlug }: { item: DocsVariantItem; componentSlug?: string }) {
  const [open, setOpen] = useState(false);
  const trackId = componentSlug ? `${componentSlug}:code:${item.trackId ?? item.name}` : undefined;
  return (
    <Card className="nds-p-4">
      <div>
        <p className="nds-text-body nds-font-semibold nds-m-0">{item.name}</p>
        <p
          className="nds-text-body nds-mt-1 nds-leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.description) }}
        />
      </div>
      <div className="nds-cluster" data-justify="center">
        {item.preview}
      </div>
      {item.code && (
        <div>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="nds-px-0"
            onClick={() => setOpen((v) => !v)}
            data-track="code"
            data-track-id={trackId}
            data-track-label="Copiar código"
          >
            {open ? 'Ocultar código' : 'Ver código'}
          </Button>
          {open && (
            <pre className="nds-code-block nds-mt-2">
              <code>{item.code}</code>
            </pre>
          )}
        </div>
      )}
    </Card>
  );
}

export function DocsVariants({ title, items, id = "variantes", note, componentSlug }: DocsVariantsProps) {
  return (
    <section id={id}>
      <h2 className="nds-section-title">{title}</h2>
      {note && (
        <p
          className="nds-text-body nds-text-muted-foreground nds-mt-1 nds-mb-4 nds-leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note) }}
        />
      )}
      <div className="nds-stack" data-spacing="md">
        {items.map((item, i) => (
          <VariantCard key={i} item={item} componentSlug={componentSlug} />
        ))}
      </div>
    </section>
  );
}
