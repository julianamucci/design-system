// ─── Tabs — Vanilla factory standalone ──────────────────────────────────────
//
// Visual: classes .nds-tabs-* (standalone).
// Estado via data-state="active|inactive" no trigger; painéis usam hidden.
//
// Contrato de layout do design system (docs/shared/styles/nds/tabs.css):
//   - `data-orientation` na raiz  → direção do fluxo e gap entre lista e painel
//   - `data-variant` na lista     → "default" (trilho) ou "line" (indicador ::after)
// Os dois são ESCRITOS AQUI. Antes, as stories fingiam as variantes mutando o
// DOM com classe morta e `style.*` inline — valor de design fora do tema e da
// densidade, e sem exercitar o CSS que o sistema já publica.

import { cn } from '@/lib/utils';

export type TabsItemDef = {
  value: string;
  label: string;
  content: HTMLElement;
  disabled?: boolean;
};

export type TabsVariant = 'default' | 'line';
export type TabsOrientation = 'horizontal' | 'vertical';

export type TabsOptions = {
  defaultValue: string;
  items: TabsItemDef[];
  /** "default" desenha o trilho; "line" some com ele e marca o ativo por baixo. */
  variant?: TabsVariant;
  /** Direção do conjunto. Também define qual par de setas navega. */
  orientation?: TabsOrientation;
  onValueChange?: (value: string) => void;
  class?: string;
};

let _tabsCounter = 0;

export function createTabs(options: TabsOptions): HTMLElement {
  const {
    defaultValue,
    items,
    onValueChange,
    variant = 'default',
    orientation = 'horizontal',
  } = options;

  const id = ++_tabsCounter;
  let activeValue = defaultValue;

  const root = document.createElement('div');
  root.dataset.slot = 'tabs';
  root.dataset.orientation = orientation;
  root.className = cn('nds-tabs', options.class);

  // Tab list
  const listEl = document.createElement('div');
  listEl.setAttribute('role', 'tablist');
  listEl.className = 'nds-tabs-list';
  listEl.dataset.slot = 'tabs-list';
  listEl.dataset.variant = variant;
  // `aria-orientation` só no vertical: horizontal é o padrão implícito do papel
  // `tablist`, e repetir o padrão é ruído para quem lê com leitor de tela.
  if (orientation === 'vertical') listEl.setAttribute('aria-orientation', 'vertical');

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
  //
  // A tecla segue a ORIENTAÇÃO: num conjunto empilhado, Left/Right não descreve
  // o movimento que o olho vê. Home/End valem nas duas direções.
  // A seta ATIVA a aba (ativação automática) — é o contrato do design system.
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

  listEl.addEventListener('keydown', (e) => {
    const enabledItems = items.filter(i => !i.disabled);
    if (enabledItems.length === 0) return;
    const currentIdx = enabledItems.findIndex(i => i.value === activeValue);

    const irPara = (idx: number) => {
      e.preventDefault();
      const value = enabledItems[idx].value;
      activate(value);
      triggerMap.get(value)?.focus();
    };

    if (e.key === nextKey) {
      irPara((currentIdx + 1) % enabledItems.length);
    } else if (e.key === prevKey) {
      irPara((currentIdx - 1 + enabledItems.length) % enabledItems.length);
    } else if (e.key === 'Home') {
      irPara(0);
    } else if (e.key === 'End') {
      irPara(enabledItems.length - 1);
    }
  });

  root.appendChild(listEl);
  panelMap.forEach(panel => root.appendChild(panel));

  return root;
}
