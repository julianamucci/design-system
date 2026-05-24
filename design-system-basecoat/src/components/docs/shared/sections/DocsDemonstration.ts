import { createComponentDemo } from '@/components/ComponentDemo';

export interface DocsDemonstrationProps {
  title: string;
  demoFactory: () => HTMLElement;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Informativo — este
   * container não injeta `data-track*` nos elementos interativos porque eles
   * vêm via `demoFactory()` e são controlados pela docs page. Consumidores
   * devem aplicar os atributos manualmente nos triggers dentro da factory:
   *
   * @example
   *   createDocsDemonstration({
   *     title: '...',
   *     componentSlug: 'alert',
   *     demoFactory: () => {
   *       const btn = createButton({ label: 'Salvar' });
   *       btn.setAttribute('data-track', 'demo');
   *       btn.setAttribute('data-track-id', 'alert:demo:save');
   *       btn.setAttribute('data-track-label', 'Salvar');
   *       return btn;
   *     },
   *   });
   *
   * O observer global do DocsPageLayout captura o click via
   * `.closest('[data-track]')`.
   */
  componentSlug?: string;
}

export function createDocsDemonstration(props: DocsDemonstrationProps): HTMLElement {
  const section = document.createElement('section');
  section.id = 'demonstracao';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;

  const demo = createComponentDemo(props.demoFactory());

  section.append(h2, demo);
  return section;
}
