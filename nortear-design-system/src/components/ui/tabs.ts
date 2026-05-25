// ─── Tabs — Vanilla factory standalone ──────────────────────────────────────
//
// Visual: classes .nds-tabs-* (zero Tailwind/basecoat-css).
// Estado via data-state="active|inactive" no trigger; painéis usam hidden.

export type TabsItemDef = {
  value: string;
  label: string;
  content: HTMLElement;
  disabled?: boolean;
};

export type TabsOptions = {
  defaultValue: string;
  items: TabsItemDef[];
  onValueChange?: (value: string) => void;
  class?: string;
};

let _tabsCounter = 0;

export function createTabs(options: TabsOptions): HTMLElement {
  const { defaultValue, items, onValueChange } = options;

  const id = ++_tabsCounter;
  let activeValue = defaultValue;

  const root = document.createElement('div');
  root.dataset.slot = 'tabs';
  root.className = 'nds-tabs';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  // Tab list
  const listEl = document.createElement('div');
  listEl.setAttribute('role', 'tablist');
  listEl.className = 'nds-tabs-list';
  listEl.dataset.slot = 'tabs-list';

  const panelMap = new Map<string, HTMLElement>();
  const triggerMap = new Map<string, HTMLButtonElement>();

  // Panels (hidden by default)
  items.forEach((item) => {
    const tabId = `tab-${id}-${item.value}`;
    const panelId = `tabpanel-${id}-${item.value}`;

    const panelEl = document.createElement('div');
    panelEl.id = panelId;
    panelEl.setAttribute('role', 'tabpanel');
    panelEl.setAttribute('aria-labelledby', tabId);
    panelEl.setAttribute('tabindex', '0');
    panelEl.className = 'nds-tabs-content';
    panelEl.dataset.slot = 'tabs-content';
    panelEl.dataset.value = item.value;
    panelEl.appendChild(item.content);

    panelMap.set(item.value, panelEl);
  });

  // Triggers
  items.forEach((item) => {
    const tabId = `tab-${id}-${item.value}`;
    const panelId = `tabpanel-${id}-${item.value}`;

    const triggerEl = document.createElement('button');
    triggerEl.type = 'button';
    triggerEl.id = tabId;
    triggerEl.setAttribute('role', 'tab');
    triggerEl.setAttribute('aria-controls', panelId);
    triggerEl.setAttribute('aria-selected', 'false');
    triggerEl.setAttribute('tabindex', '-1');
    triggerEl.className = 'nds-tabs-trigger';
    triggerEl.dataset.slot = 'tabs-trigger';
    triggerEl.dataset.value = item.value;
    triggerEl.textContent = item.label;

    if (item.disabled) triggerEl.disabled = true;

    triggerMap.set(item.value, triggerEl);
    listEl.appendChild(triggerEl);
  });

  function activate(value: string): void {
    if (activeValue === value) return;

    const prevTrigger = triggerMap.get(activeValue);
    const prevPanel = panelMap.get(activeValue);
    if (prevTrigger) {
      prevTrigger.setAttribute('aria-selected', 'false');
      prevTrigger.setAttribute('tabindex', '-1');
      prevTrigger.dataset.state = 'inactive';
    }
    if (prevPanel) prevPanel.hidden = true;

    activeValue = value;

    const nextTrigger = triggerMap.get(value);
    const nextPanel = panelMap.get(value);
    if (nextTrigger) {
      nextTrigger.setAttribute('aria-selected', 'true');
      nextTrigger.setAttribute('tabindex', '0');
      nextTrigger.dataset.state = 'active';
    }
    if (nextPanel) nextPanel.hidden = false;

    onValueChange?.(value);
  }

  // Initial state
  items.forEach((item) => {
    const trigger = triggerMap.get(item.value)!;
    const panel = panelMap.get(item.value)!;

    if (item.value === defaultValue) {
      trigger.setAttribute('aria-selected', 'true');
      trigger.setAttribute('tabindex', '0');
      trigger.dataset.state = 'active';
      panel.hidden = false;
    } else {
      trigger.dataset.state = 'inactive';
      panel.hidden = true;
    }
  });

  // Click events
  items.forEach((item) => {
    const trigger = triggerMap.get(item.value)!;
    if (!item.disabled) {
      trigger.addEventListener('click', () => activate(item.value));
    }
  });

  // Keyboard navigation
  listEl.addEventListener('keydown', (e) => {
    const enabledItems = items.filter(i => !i.disabled);
    const currentIdx = enabledItems.findIndex(i => i.value === activeValue);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (currentIdx + 1) % enabledItems.length;
      const nextValue = enabledItems[next].value;
      activate(nextValue);
      triggerMap.get(nextValue)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (currentIdx - 1 + enabledItems.length) % enabledItems.length;
      const prevValue = enabledItems[prev].value;
      activate(prevValue);
      triggerMap.get(prevValue)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstValue = enabledItems[0]?.value;
      if (firstValue) { activate(firstValue); triggerMap.get(firstValue)?.focus(); }
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastValue = enabledItems[enabledItems.length - 1]?.value;
      if (lastValue) { activate(lastValue); triggerMap.get(lastValue)?.focus(); }
    }
  });

  root.appendChild(listEl);
  panelMap.forEach(panel => root.appendChild(panel));

  return root;
}
