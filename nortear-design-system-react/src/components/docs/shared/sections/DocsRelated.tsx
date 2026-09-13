import { useTituloDeSecao } from './useTituloDeSecao';
import { managerHref } from '@shared/primitives/manager-href';

export interface DocsRelatedItem {
  name: string;
  description: string;
  path: string;
}

export interface DocsRelatedProps {
  items: DocsRelatedItem[];
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, cada
   * card relacionado recebe `data-track="related"` +
   * `data-track-id="{slug}:related:{item.name.slug}"`,
   * o rótulo do evento sai do fim do id, nunca do nome exibido. Se ausente, omite `data-track-id`.
   */
  componentSlug?: string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-');
}

export function DocsRelated({ items, componentSlug }: DocsRelatedProps) {
  const title = useTituloDeSecao('relacionados');
  return (
    <section id="relacionados">
      <h2 className="nds-section-title">{title}</h2>
      <div className="nds-grid" data-cols="2" data-spacing="md">
        {items.map((item, i) => {
          const trackId = componentSlug ? `${componentSlug}:related:${slugify(item.name)}` : undefined;
          return (
            // Card clicável com aparência do button outline (border + bg + hover accent).
            // Implementado como classe própria .nds-related-card em vez de usar
            // .nds-button-outline porque o layout difere (vertical, multi-linha,
            // padding maior, sem white-space:nowrap nem inline-flex centralizado).
            <a
              key={i}
              href={managerHref(item.path)}
              target="_top"
              className="nds-related-card"
              data-track="related"
              data-track-id={trackId}
            >
              <p className="nds-related-card-title">{item.name}</p>
              <p className="nds-related-card-description">{item.description}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
