import { useMemo } from 'react';
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
   * Slug do componente (prefixo do `data-track-id` — ex: "alert" →
   * `alert:nav:anatomia`). Opcional: quando omitido, é derivado do `?id=` do
   * iframe do Storybook, a mesma derivação que o `mountDocsTracking` usa.
   */
  componentSlug?: string;
}

/**
 * Rola até a seção **e move o foco para ela**.
 *
 * Só rolar deixa o foco no botão do menu: o cursor de leitura do leitor de
 * tela não acompanha (a leitura não continua a partir do título da seção) e o
 * Tab seguinte volta para o próximo item do menu. O `tabindex="-1"` é aplicado
 * no momento do clique (não exige mexer no HTML das seções) e o
 * `preventScroll` deixa a rolagem suave acontecer enquanto o foco já se move.
 */
function goToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

export function DocsNav({ groups, activeSection, componentSlug }: DocsNavProps) {
  // A maioria das docs pages não passa o slug; sem fallback o `data-track-id`
  // ficava ausente e o `docs_nav_click` saía sem componente nem seção.
  const slug = useMemo(() => componentSlug ?? deriveSlugFromUrl(), [componentSlug]);

  return (
    <div className="nds-docs-nav">
      {groups.map((group) => (
        <div key={group.label} className="nds-docs-nav-group">
          <p className="nds-docs-nav-label">{group.label}</p>
          <ul className="nds-docs-nav-list">
            {group.sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className="nds-docs-nav-button"
                  onClick={() => goToSection(section.id)}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                  data-track="nav"
                  data-track-id={`${slug}:nav:${section.id}`}
                  data-track-label={section.label}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
