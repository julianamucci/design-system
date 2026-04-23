/**
 * docs-tracking.ts — observer global para instrumentar docs pages via `data-track*`.
 *
 * Uso:
 *   import { mountDocsTracking } from '@/lib/docs-tracking';
 *
 *   useEffect(() => {
 *     return mountDocsTracking(rootRef.current, { componentSlug: 'alert' });
 *   }, []);
 *
 * Elementos interativos com `data-track="{type}"` + `data-track-id="{structured-id}"`
 * (e opcionalmente `data-track-label`, `data-track-extra`) são rastreados
 * automaticamente. O observer delega o listener ao root — adicionar/remover
 * elementos depois do mount é transparente.
 *
 * Padrão do id: `{component}:{section}:{element}` — 3 partes separadas por `:`.
 */

import { track } from './analytics';

export interface MountDocsTrackingOptions {
  /** Slug do componente (primeiro segmento de todo `data-track-id`). */
  componentSlug: string;
}

/**
 * Monta click listener no root. Retorna função de cleanup.
 * Eventos disparados dependem de `data-track`: nav | demo | variant | code | related | link.
 */
export function mountDocsTracking(
  root: HTMLElement | null,
  { componentSlug }: MountDocsTrackingOptions,
): () => void {
  if (!root) return () => {};

  const handler = (ev: Event) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    const trigger = target.closest<HTMLElement>('[data-track]');
    if (!trigger) return;

    const type = trigger.getAttribute('data-track');
    const id = trigger.getAttribute('data-track-id') ?? '';
    const label = trigger.getAttribute('data-track-label') ?? trigger.textContent?.trim() ?? '';

    // Extrai o segmento `element` (parte 3 do id estruturado).
    const parts = id.split(':');
    const section = parts[1] ?? '';
    const element = parts.slice(2).join(':');

    switch (type) {
      case 'nav':
        track('docs_nav_click', {
          component: componentSlug,
          section_id: section || element,
          label,
        });
        break;

      case 'demo':
        track('docs_demo_click', {
          component: componentSlug,
          element_id: element || id,
          label,
        });
        break;

      case 'variant':
        track('docs_variant_click', {
          component: componentSlug,
          variant_name: element || id,
          label,
        });
        break;

      case 'code':
        track('docs_code_copy', {
          component: componentSlug,
          snippet_id: element || id,
        });
        break;

      case 'related': {
        const href = trigger.getAttribute('href') ?? '';
        track('docs_related_click', {
          component: componentSlug,
          target_slug: element || id,
          label,
        });
        // Swallow href vazio no payload — `docs_link_click` cobre casos genéricos.
        void href;
        break;
      }

      case 'link': {
        const href = trigger.getAttribute('href') ?? '';
        track('docs_link_click', {
          component: componentSlug,
          section_id: section || element,
          href,
        });
        break;
      }

      default:
        // Tipo desconhecido — ignorar silenciosamente para não poluir analytics.
        break;
    }
  };

  root.addEventListener('click', handler);
  return () => root.removeEventListener('click', handler);
}
