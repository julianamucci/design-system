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
  /** Slug do componente. Se omitido, é derivado do `?id=` do iframe do
   *  Storybook (ex.: `ui-button--docs` → `button`). */
  componentSlug?: string;
}

/**
 * Deriva o slug do componente a partir da URL do iframe do Storybook.
 *
 * Exportado porque o `DocsNav` precisa do MESMO fallback ao montar o
 * `data-track-id`: o `componentSlug` é opcional por contrato e a maioria das
 * docs pages não o passa. Sem isso o id do nav ficava ausente nessas páginas.
 */
export function deriveSlugFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') ?? params.get('path')?.split('/').pop() ?? '';
    const slug = id.replace(/^ui-/, '').replace(/--.*$/, '');
    return slug || 'docs';
  } catch {
    return 'docs';
  }
}

/** Elementos considerados interativos ao resolver cliques dentro de um
 *  container `data-track-container` (demos auto-instrumentadas). */
const INTERACTIVE_SELECTOR = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="switch"]', '[role="checkbox"]', '[role="radio"]',
  '[role="tab"]', '[role="menuitem"]', '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]', '[role="option"]', '[role="slider"]',
  '[role="combobox"]', '[role="link"]',
].join(', ');

/**
 * Monta click listener no root. Retorna função de cleanup.
 * Eventos disparados dependem de `data-track`: nav | demo | variant | code | related | link.
 */
export function mountDocsTracking(
  root: HTMLElement | null,
  { componentSlug: slugOption }: MountDocsTrackingOptions = {},
): () => void {
  if (!root) return () => {};
  const componentSlug = slugOption ?? deriveSlugFromUrl();

  const handler = (ev: Event) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    const trigger = target.closest<HTMLElement>('[data-track]');
    if (!trigger) return;

    const type = trigger.getAttribute('data-track');
    const id = trigger.getAttribute('data-track-id') ?? '';
    const labelAttr = trigger.getAttribute('data-track-label') ?? trigger.textContent?.trim() ?? '';

    // Extrai o segmento `element` (parte 3 do id estruturado).
    const parts = id.split(':');
    const section = parts[1] ?? '';
    let element = parts.slice(2).join(':');
    let label = labelAttr;

    // Container auto-instrumentado (ex.: área de demonstração): resolve o
    // elemento interativo REALMENTE clicado; cliques no vazio são ignorados.
    if (trigger.hasAttribute('data-track-container')) {
      const interactive = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (!interactive || !trigger.contains(interactive)) return;
      label =
        interactive.getAttribute('aria-label') ??
        interactive.textContent?.trim().slice(0, 80) ??
        '';
      element = interactive.id || label || element;
    }

    switch (type) {
      case 'nav':
        // No nav o id é `{component}:nav:{seção de destino}` — o segmento
        // `section` é literalmente "nav" e o DESTINO está no `element`.
        // Reportar `section` aqui fazia todo docs_nav_click sair com
        // section_id:"nav", sem dizer para onde o usuário navegou.
        track('docs_nav_click', {
          component: componentSlug,
          section_id: element || section,
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

      case 'code': {
        // Exige que o clique tenha caído num controle, não em qualquer lugar do
        // trigger. Enquanto `data-track="code"` vivia sempre num <Button>, a
        // distinção não importava; o CodeBlock marca a RAIZ do bloco, e sem esta
        // guarda selecionar o código ou clicar no título emitia "copiou".
        const control = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
        if (!control || !trigger.contains(control)) return;
        track('docs_code_copy', {
          component: componentSlug,
          snippet_id: element || id,
        });
        break;
      }

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
