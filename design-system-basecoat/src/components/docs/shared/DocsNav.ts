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
}

export interface DocsNavHandle {
  element: HTMLElement;
  setActiveSection(id: string | undefined): void;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const BUTTON_BASE =
  'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const BUTTON_ACTIVE = 'bg-primary/10 text-primary font-medium';
const BUTTON_INACTIVE = 'text-muted-foreground hover:text-foreground hover:bg-muted/50';

export function createDocsNav(props: DocsNavProps): DocsNavHandle {
  const root = document.createElement('div');
  root.className = 'space-y-6';

  const buttons = new Map<string, HTMLButtonElement>();

  for (const group of props.groups) {
    const groupEl = document.createElement('div');

    const label = document.createElement('p');
    label.className =
      'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2';
    label.textContent = group.label;
    groupEl.appendChild(label);

    const list = document.createElement('ul');
    list.className = 'list-none space-y-1 p-0 m-0';

    for (const section of group.sections) {
      const item = document.createElement('li');
      item.className = 'list-none';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = section.label;
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
      btn.className = `${BUTTON_BASE} ${isActive ? BUTTON_ACTIVE : BUTTON_INACTIVE}`;
      if (isActive) btn.setAttribute('aria-current', 'location');
      else btn.removeAttribute('aria-current');
    });
  }

  setActiveSection(props.activeSection);

  return { element: root, setActiveSection };
}
