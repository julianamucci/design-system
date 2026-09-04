import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import DOMPurify from 'dompurify';

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
      <h2 className="nds-section-title">{title}</h2>
      <div className="nds-stack" data-spacing="md">
        {items.map((item, i) => {
          const trackId = componentSlug ? `${componentSlug}:link:notes-${i + 1}` : undefined;
          return (
            <div key={i} data-track="link" data-track-id={trackId}>
              {/* role="note": as notas são conteúdo estático, já presente no
                  carregamento. Com o `alert` default cada nota vira live
                  region assertiva e o leitor de tela salta para cá assim que
                  a página monta — era o bug em todas as docs pages. */}
              <Alert variant="default" role="note">
                {/* `as="h3"` e não o h5 padrão do Alert: a seção acima é h2, e
                    h5 pularia dois níveis — `heading-order` do axe. */}
                {item.title && <AlertTitle as="h3">{item.title}</AlertTitle>}
                <AlertDescription>
                  {/* O <p> é obrigatório: `.nds-alert-description` é `display:
                      grid`, então cada filho vira um item em sua própria linha —
                      sem ele, os <code> inline quebram o texto. Mesma marcação
                      nas 4 stacks. */}
                  <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }} />
                </AlertDescription>
              </Alert>
            </div>
          );
        })}
      </div>
    </section>
  );
}
