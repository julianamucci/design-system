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
  /** Slug do componente — usado no data-track-id (ex: "alert" → `alert:nav:anatomia`). */
  componentSlug?: string;
}

export interface DocsNavHandle {
  element: HTMLElement;
  setActiveSection(id: string | undefined): void;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function createDocsNav(props: DocsNavProps): DocsNavHandle {
  const root = document.createElement('div');
  root.className = 'nds-docs-nav';

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
      if (props.componentSlug) {
        btn.setAttribute('data-track-id', `${props.componentSlug}:nav:${section.id}`);
      }
      btn.setAttribute('data-track-label', section.label);
      btn.addEventListener('click', () => scrollTo(section.id));

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
