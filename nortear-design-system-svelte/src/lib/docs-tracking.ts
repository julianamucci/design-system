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
 * (e opcionalmente `data-track-label` — id ESTÁVEL, nunca texto —, `data-track-extra`) são rastreados
 * automaticamente. O observer delega o listener ao root — adicionar/remover
 * elementos depois do mount é transparente.
 *
 * Padrão do id: `{component}:{section}:{element}` — 3 partes separadas por `:`.
 */

import { track } from './analytics';
import { resolverRotulo } from '@shared/primitives/rotulo-de-rastreio';
import { avisarRotuloDescartado } from '@shared/primitives/analytics-debug';

export interface MountDocsTrackingOptions {
  /** Slug do componente. Se omitido, é derivado do `?id=` do iframe do
   *  Storybook (ex.: `ui-button--docs` → `button`). */
  componentSlug?: string;
}

/** Deriva o slug do componente a partir da URL do iframe do Storybook.
 *  Exportado para o `DocsNav` montar o mesmo `data-track-id` nas páginas que
 *  não passam `componentSlug` — a derivação tem de ser a mesma do observer. */
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
    // Extrai o segmento `element` (parte 3 do id estruturado).
    const parts = id.split(':');
    const section = parts[1] ?? '';
    let element = parts.slice(2).join(':');

    // `label` é id ESTÁVEL, nunca texto — decisão de 2026-09-10. Ele saía de
    // `data-track-label ?? textContent`, e no modo contêiner de
    // `aria-label ?? textContent`: nas duas rotas, o texto da tela no idioma de
    // quem clicou, partindo o mesmo clique em um valor por idioma no GA4. Agora
    // sai do atributo declarado SE ele tiver forma de id; senão, do segmento
    // estável do `data-track-id`. Texto não é mais lido. A decisão de qual valor
    // vale mora em `@shared/primitives/rotulo-de-rastreio`, igual nas cinco.
    let rotulo = resolverRotulo(trigger.getAttribute('data-track-label'), element, section);

    // Container auto-instrumentado (ex.: área de demonstração): resolve o
    // elemento interativo REALMENTE clicado; cliques no vazio são ignorados.
    // O rótulo dele sai do `data-track-label` do próprio elemento ou do
    // `data-slot`, que é contrato do design system — nunca do `aria-label`.
    if (trigger.hasAttribute('data-track-container')) {
      const interactive = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (!interactive || !trigger.contains(interactive)) return;
      rotulo = resolverRotulo(
        interactive.getAttribute('data-track-label'),
        interactive.getAttribute('data-slot'),
      );
      element = interactive.id || rotulo.label || element;
    }
    if (rotulo.descartado !== undefined) avisarRotuloDescartado(rotulo.descartado, rotulo.label);
    const label = rotulo.label;

    switch (type) {
      case 'nav':
        // No nav o id é `{component}:nav:{seção de destino}` — o segmento
        // `section` é literalmente "nav". O que interessa medir é o destino,
        // então `section_id` vem do `element`; `section` só serve de fallback
        // para ids fora do formato de 3 partes.
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
