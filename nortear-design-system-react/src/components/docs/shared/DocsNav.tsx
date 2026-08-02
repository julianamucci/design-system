
export interface DocsNavSection {
  id: string;
  label: string;
}

export interface DocsNavGroup {
  label: string;
  sections: DocsNavSection[];
}

export interface DocsNavProps {
  groups: DocsNavGroup[];
  activeSection?: string;
  /** Slug do componente (prefixo do `data-track-id` — ex: "alert" → `alert:nav:anatomia`). */
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
                  data-track-id={componentSlug ? `${componentSlug}:nav:${section.id}` : undefined}
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
