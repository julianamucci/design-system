
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

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                  onClick={() => scrollTo(section.id)}
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
