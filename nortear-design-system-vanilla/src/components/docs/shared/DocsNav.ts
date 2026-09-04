import { deriveSlugFromUrl } from '@/lib/docs-tracking';

/**
 * A forma do menu vem de `@shared/primitives/docs-nav`, e é a mesma nas cinco
 * stacks. Reexportada daqui para quem já importava deste arquivo não mudar.
 */
export type { DocsNavSection, DocsNavGroup } from '@shared/primitives/docs-nav';
import type { DocsNavGroup } from '@shared/primitives/docs-nav';

export interface DocsNavProps {
  groups: DocsNavGroup[];
  activeSection?: string;
  /**
   * Slug do componente — usado no data-track-id (ex: "alert" → `alert:nav:anatomia`).
   * Opcional: quando omitido é derivado do `?id=` do iframe do Storybook, o
   * mesmo fallback que o `mountDocsTracking` já usa.
   */
  componentSlug?: string;
}

export interface DocsNavHandle {
  element: HTMLElement;
  setActiveSection(id: string | undefined): void;
}

/**
 * Leva o usuário até a seção: rola E move o foco.
 *
 * Só rolar deixava o foco no botão do menu — o cursor de leitura do leitor de
 * tela não acompanhava (a leitura não continuava do título da seção) e o Tab
 * seguinte ia para o próximo item do menu, não para o conteúdo.
 *
 * `tabindex="-1"` é aplicado no momento do clique (não exige mexer no HTML de
 * cada seção) e `focus({ preventScroll: true })` deixa a rolagem suave
 * acontecer enquanto o foco já se moveu.
 */
function goToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

export function createDocsNav(props: DocsNavProps): DocsNavHandle {
  const root = document.createElement('div');
  root.className = 'nds-docs-nav';

  // A maioria das docs pages não passa `componentSlug` (o prop é opcional por
  // contrato). Sem fallback, essas páginas ficavam sem `data-track-id` e o
  // `docs_nav_click` saía com section_id vazio. Reusamos a MESMA derivação do
  // `mountDocsTracking`, então o `component` do evento e o 1º segmento do id
  // continuam batendo — sem tocar em nenhuma docs page.
  const slug = props.componentSlug ?? deriveSlugFromUrl();

  const buttons = new Map<string, HTMLButtonElement>();

  for (const group of props.groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'nds-docs-nav-group';

    const label = document.createElement('p');
    label.className = 'nds-docs-nav-label';
    label.textContent = group.label;
    groupEl.appendChild(label);

    const list = document.createElement('ul');
    list.className = 'nds-docs-nav-list';

    for (const section of group.sections) {
      const item = document.createElement('li');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nds-docs-nav-button';
      btn.textContent = section.label;
      btn.setAttribute('data-track', 'nav');
      btn.setAttribute('data-track-id', `${slug}:nav:${section.id}`);
      btn.setAttribute('data-track-label', section.label);
      btn.addEventListener('click', () => goToSection(section.id));

      buttons.set(section.id, btn);

      item.appendChild(btn);
      list.appendChild(item);
    }

    groupEl.appendChild(list);
    root.appendChild(groupEl);
  }

  function setActiveSection(activeId: string | undefined) {
    buttons.forEach((btn, id) => {
      const isActive = id === activeId;
      if (isActive) btn.setAttribute('aria-current', 'location');
      else btn.removeAttribute('aria-current');
    });
  }

  setActiveSection(props.activeSection);

  return { element: root, setActiveSection };
}
