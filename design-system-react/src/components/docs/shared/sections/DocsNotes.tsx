import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsNoteItem {
  title: string;
  content: string;
}

export interface DocsNotesProps {
  title: string;
  items: DocsNoteItem[];
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, cada
   * nota recebe um wrapper `<div>` com `data-track="link"` +
   * `data-track-id="{slug}:link:notes-{idx}"` (idx = índice 1-based). Como o
   * conteúdo é injetado via `dangerouslySetInnerHTML`, não conseguimos marcar
   * cada `<a>` individualmente — o observer global usa `.closest('[data-track]')`
   * para capturar clicks em qualquer link descendente.
   */
  componentSlug?: string;
}

export function DocsNotes({ title, items, componentSlug }: DocsNotesProps) {
  return (
    <section id="notas">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map((item, i) => {
          const trackId = componentSlug ? `${componentSlug}:link:notes-${i + 1}` : undefined;
          return (
            <div key={i} data-track="link" data-track-id={trackId}>
              <Alert variant="default">
                {item.title && <AlertTitle>{item.title}</AlertTitle>}
                <AlertDescription
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
                />
              </Alert>
            </div>
          );
        })}
      </div>
    </section>
  );
}
