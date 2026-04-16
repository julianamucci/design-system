# Navigation Components (Basecoat — Vanilla TypeScript)

---

## Breadcrumb

**Propósito**: indica a posição do usuário na hierarquia de navegação.

**Implementação**:
```ts
export interface BreadcrumbItem {
  label: string;
  href?: string; // undefined = item atual (não link)
}

export function createBreadcrumb(items: BreadcrumbItem[]): HTMLElement {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Localização na página');

  const ol = document.createElement('ol');
  ol.className = 'flex items-center gap-1.5 text-muted-foreground';

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-1.5';

    if (index > 0) {
      const sep = document.createElement('span');
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '/';
      sep.className = 'text-muted-foreground/50';
      li.appendChild(sep);
    }

    if (item.href) {
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      a.className = 'hover:text-foreground transition-colors';
      li.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.textContent = item.label;
      span.setAttribute('aria-current', 'page');
      span.className = 'text-foreground font-medium';
      li.appendChild(span);
    }

    ol.appendChild(li);
  });

  nav.appendChild(ol);
  return nav;
}
```

---

## Tabs

**Propósito**: organizar conteúdo em seções alternáveis.

**Implementação**:
```ts
export interface TabsOptions {
  tabs: Array<{ value: string; label: string; content: HTMLElement }>;
  defaultValue?: string;
}

export function createTabs({ tabs, defaultValue }: TabsOptions): HTMLElement {
  const container = document.createElement('div');
  const activeTab = defaultValue ?? tabs[0]?.value;

  // Tab list
  const tablist = document.createElement('div');
  tablist.setAttribute('role', 'tablist');
  tablist.className = 'inline-flex h-9 items-center rounded-lg bg-muted p-1';

  // Tab panels
  const panels = new Map<string, HTMLElement>();

  tabs.forEach(({ value, label, content }) => {
    const btn = document.createElement('button');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', value === activeTab ? 'true' : 'false');
    btn.setAttribute('aria-controls', `panel-${value}`);
    btn.id = `tab-${value}`;
    btn.className = cn(
      'inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-medium transition-all',
      value === activeTab
        ? 'bg-background text-foreground shadow'
        : 'text-muted-foreground hover:text-foreground'
    );
    btn.textContent = label;

    btn.addEventListener('click', () => activateTab(value));
    tablist.appendChild(btn);

    const panel = document.createElement('div');
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${value}`);
    panel.id = `panel-${value}`;
    panel.className = 'mt-2';
    if (value !== activeTab) panel.hidden = true;
    panel.appendChild(content);
    panels.set(value, panel);
  });

  function activateTab(value: string) {
    tablist.querySelectorAll('[role="tab"]').forEach((tab) => {
      const t = tab as HTMLButtonElement;
      const isActive = t.id === `tab-${value}`;
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.className = cn(
        'inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-medium transition-all',
        isActive ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
      );
    });
    panels.forEach((panel, v) => { panel.hidden = v !== value; });
  }

  container.appendChild(tablist);
  panels.forEach((panel) => container.appendChild(panel));
  return container;
}
```

---

## Pagination

**Propósito**: navegar entre páginas de uma lista.

**Implementação**:
```ts
export function createPagination(options: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}): HTMLElement {
  const { currentPage, totalPages, onPageChange } = options;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Paginação dos resultados');
  nav.className = 'flex items-center gap-1';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '←';
  prevBtn.className = 'h-9 px-3 rounded-md border border-input hover:bg-accent disabled:opacity-50';
  prevBtn.disabled = currentPage === 1;
  prevBtn.setAttribute('aria-label', 'Página anterior');
  prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '→';
  nextBtn.className = 'h-9 px-3 rounded-md border border-input hover:bg-accent disabled:opacity-50';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.setAttribute('aria-label', 'Próxima página');
  nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));

  const pageInfo = document.createElement('span');
  pageInfo.className = 'px-3 text-sm text-muted-foreground';
  pageInfo.textContent = `${currentPage} / ${totalPages}`;

  nav.append(prevBtn, pageInfo, nextBtn);
  return nav;
}
```
