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
  /**
   * Nome acessível da lista de abas — vai no elemento `role="tablist"`, que é
   * quem o leitor de tela anuncia ao entrar no conjunto. OBRIGATÓRIO: sem ele
   * o anúncio é só "lista de abas", e uma página com dois conjuntos fica com
   * dois controles indistinguíveis.
   *
   * A opção mora na raiz porque a lista não é um elemento que quem consome
   * receba: até aqui só se escrevia o nome com
   * `root.querySelector('[role="tablist"]').setAttribute(...)` depois de
   * construir — um contorno preso à estrutura interna da fábrica, que quebra
   * calado se ela mudar.
   */
  'aria-label'?: string;
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
  if (options['aria-label']) listEl.setAttribute('aria-label', options['aria-label']);

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

    // `aria-disabled`, e NÃO o `disabled` nativo do botão.
    //
    // O padrão WAI-ARIA para `tab` manda a aba desabilitada continuar
    // alcançável pela seta: é assim que o leitor de tela chega nela, anuncia o
    // rótulo e diz que está indisponível. Um `<button disabled>` faz o oposto —
    // sai do alcance do foco, e quem navega por teclado nunca descobre que a
    // aba existe. O bloqueio real da ativação está nos dois lugares que podem
    // ativar: o `click` (que cobre também o Enter/Espaço, porque o navegador os
    // converte em clique num botão) e a ativação automática da seta, ambos
    // logo abaixo. `pointer-events: none` na folha é o reforço visual, não a
    // trava.
    if (item.disabled) triggerEl.setAttribute('aria-disabled', 'true');

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
  //
  // O ouvinte é registrado SEMPRE, inclusive na aba desabilitada, e a guarda
  // mora dentro dele. Não registrar era uma trava por omissão: bastava alguém
  // remover o `pointer-events: none` da folha, ou a pessoa chegar pelo teclado,
  // para o comportamento mudar sem nenhum aviso. A guarda explícita também é o
  // que barra Enter e Espaço, que o navegador entrega como clique.
  items.forEach((item) => {
    const trigger = triggerMap.get(item.value)!;
    trigger.addEventListener('click', () => {
      if (item.disabled) return;
      activate(item.value);
    });
  });

  // Keyboard navigation
  //
  // A tecla segue a ORIENTAÇÃO: num conjunto empilhado, Left/Right não descreve
  // o movimento que o olho vê. Home/End valem nas duas direções.
  // A seta ATIVA a aba (ativação automática) — é o contrato do design system.
  //
  // A seta percorre TODAS as abas, inclusive a desabilitada: ela recebe o foco
  // para ser anunciada, e só não é ativada. Filtrar as desabilitadas do percurso
  // era o que as escondia de quem navega por teclado.
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

  listEl.addEventListener('keydown', (e) => {
    if (items.length === 0) return;

    // A referência é a aba FOCADA, não a ativa. Com a desabilitada dentro do
    // percurso as duas deixam de ser a mesma, e partir da ativa faria a seta
    // saltar de volta para ela a cada toque.
    const focado = listEl.ownerDocument.activeElement;
    const idxFocado = items.findIndex(i => triggerMap.get(i.value) === focado);
    const currentIdx = idxFocado !== -1 ? idxFocado : items.findIndex(i => i.value === activeValue);
    if (currentIdx === -1) return;

    const irPara = (idx: number) => {
      e.preventDefault();
      const item = items[idx];
      triggerMap.get(item.value)?.focus();
      // Ativação automática só vale para a aba habilitada. A desabilitada
      // ganha o foco — e mais nada.
      if (!item.disabled) activate(item.value);
    };

    if (e.key === nextKey) {
      irPara((currentIdx + 1) % items.length);
    } else if (e.key === prevKey) {
      irPara((currentIdx - 1 + items.length) % items.length);
    } else if (e.key === 'Home') {
      irPara(0);
    } else if (e.key === 'End') {
      irPara(items.length - 1);
    }
  });

  root.appendChild(listEl);
  panelMap.forEach(panel => root.appendChild(panel));

  return root;
}
