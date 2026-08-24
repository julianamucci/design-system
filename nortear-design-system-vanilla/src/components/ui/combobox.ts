import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

// ─── Combobox ─────────────────────────────────────────────────────────────────
//
// Campo de texto que filtra uma lista. No modo múltiplo os escolhidos viram
// CHIPS dentro do próprio campo.
//
// Esta fábrica é a REFERÊNCIA cross-stack: não há lib headless por baixo, então
// o que sai daqui é o que o design system realmente define. As outras quatro
// stacks espelham este markup.
//
// Markup (o `data-slot` de cada peça é o contrato compartilhado):
//
//   <div data-slot="combobox">                     ← raiz, `display: contents`
//     <label class="nds-combobox-label" data-slot="combobox-label">
//     <div class="nds-combobox-input-wrapper" data-slot="combobox-input-wrapper">
//       <span class="nds-combobox-chip" data-slot="combobox-chip">
//         <span data-slot="combobox-chip-text">
//         <button class="nds-combobox-chip-remove" data-slot="combobox-chip-remove">
//       <input class="nds-combobox-input" data-slot="combobox-input" role="combobox">
//       <button class="nds-combobox-clear" data-slot="combobox-clear">
//       <button class="nds-combobox-trigger" data-slot="combobox-trigger">
//     <input type="hidden" data-slot="combobox-hidden-input">
//
// `role="combobox"` vai no INPUT, não num wrapper — é o padrão ARIA 1.2. O foco
// NUNCA sai do input enquanto a lista navega: a opção ativa é apontada por
// `aria-activedescendant` e realçada por `[data-highlighted]`. Mover o foco para
// a opção quebraria a digitação, que é o ponto do componente.
//
// Os chips são filhos DIRETOS do wrapper. O `.nds-combobox-chips` do contrato é
// `display: contents` justamente para isso: um contêiner real criaria uma caixa
// de flex própria e os chips deixariam de quebrar linha junto com o input.

export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
  /** Rótulo do grupo. Itens com o mesmo texto saem sob o mesmo cabeçalho. */
  group?: string;
}

export interface ComboboxOptions {
  items: ComboboxItem[];
  /** Rótulo visível do campo. Sem ele, passe `aria-label`. */
  label?: string;
  'aria-label'?: string;
  placeholder?: string;
  /** Modo múltiplo: os escolhidos viram chips dentro do campo. */
  multiple?: boolean;
  /** Valores iniciais. Em modo simples, só o primeiro é considerado. */
  defaultValue?: string[];
  disabled?: boolean;
  invalid?: boolean;
  /** Nome do campo no formulário. */
  name?: string;
  id?: string;
  /** Texto do estado vazio. */
  emptyMessage?: string;
  /** Nome acessível do botão que limpa tudo. */
  clearLabel?: string;
  /** Nome acessível do botão que abre a lista. */
  triggerLabel?: string;
  /** Prefixo do nome acessível de cada botão de remover: "<prefixo> <rótulo>". */
  removeLabel?: string;
  onValueChange?: (value: string[]) => void;
  onInputValueChange?: (textEl: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

let _comboboxCounter = 0;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Traçado do chevron do gatilho (lucide `chevron-down`). */
const PATH_CHEVRON = 'm6 9 6 6 6-6';
/** Traçados do X — usado no botão de limpar e no de remover chip (lucide `x`). */
const PATH_X = ['M18 6 6 18', 'M6 6l12 12'];
/** Traçado da marca de escolhido (lucide `check`). */
const PATH_CHECK = 'M20 6 9 17l-5-5';

/**
 * Ícone montado nó a nó, e não por `innerHTML`. Mesma decisão do `select` e do
 * `dropdown-menu`: aqui não há conteúdo de fora para sanitizar, mas `innerHTML`
 * numa fábrica é o caminho por onde a injeção entra na próxima vez que alguém
 * passar um rótulo por ali.
 */
function createIcon(paths: string | string[], className?: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  for (const d of Array.isArray(paths) ? paths : [paths]) {
    const pathEl = document.createElementNS(SVG_NS, 'path');
    pathEl.setAttribute('d', d);
    svg.appendChild(pathEl);
  }
  return svg;
}

/** Comparação sem acento e sem caixa — filtrar "sao" tem de achar "São Paulo". */
function normalize(textEl: string): string {
  return textEl
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function createCombobox(options: ComboboxOptions): DestroyableElement<HTMLDivElement> {
  const {
    items,
    label,
    placeholder = '',
    multiple = false,
    defaultValue = [],
    disabled = false,
    invalid = false,
    name,
    id,
    emptyMessage = 'Nenhum resultado',
    clearLabel = 'Limpar',
    triggerLabel = 'Abrir list',
    removeLabel = 'Remover',
    onValueChange,
    onInputValueChange,
    onOpenChange,
    className,
  } = options;

  const seq = ++_comboboxCounter;
  const baseId = id ?? `nds-combobox-${seq}`;
  const listId = `${baseId}-list`;

  let selected: string[] = multiple ? [...defaultValue] : defaultValue.slice(0, 1);
  let isOpen = false;
  let activeIndex = -1;
  let positioner: HTMLElement | null = null;
  let list: HTMLElement | null = null;
  /** Itens visíveis na ordem em que estão na lista — é sobre eles que a seta anda. */
  let visible: ComboboxItem[] = [];

  const labelOf = (value: string): string =>
    items.find((i) => i.value === value)?.label ?? value;

  // ── Raiz ───────────────────────────────────────────────────────────────────

  const root = document.createElement('div');
  root.dataset.slot = 'combobox';
  if (className) root.className = cn(className);

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'nds-combobox-label';
    labelEl.dataset.slot = 'combobox-label';
    labelEl.htmlFor = `${baseId}-input`;
    labelEl.textContent = label;
    root.appendChild(labelEl);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'nds-combobox-input-wrapper';
  wrapper.dataset.slot = 'combobox-input-wrapper';
  if (disabled) wrapper.dataset.disabled = '';
  if (invalid) wrapper.setAttribute('aria-invalid', 'true');
  root.appendChild(wrapper);

  const input = document.createElement('input');
  input.id = `${baseId}-input`;
  input.className = 'nds-combobox-input';
  input.dataset.slot = 'combobox-input';
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = placeholder;
  input.disabled = disabled;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-autocomplete', 'list');
  if (options['aria-label']) input.setAttribute('aria-label', options['aria-label']);
  if (invalid) input.setAttribute('aria-invalid', 'true');

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'nds-combobox-clear';
  clearButton.dataset.slot = 'combobox-clear';
  clearButton.setAttribute('aria-label', clearLabel);
  clearButton.appendChild(createIcon(PATH_X));

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nds-combobox-trigger';
  trigger.dataset.slot = 'combobox-trigger';
  // Fora da ordem de tabulação: quem tem foco é o input, e o Tab tem de sair do
  // campo, não parar num segundo alvo que faz o que a seta já faz.
  trigger.tabIndex = -1;
  trigger.disabled = disabled;
  trigger.setAttribute('aria-label', triggerLabel);
  const triggerIcon = createIcon(PATH_CHEVRON, 'nds-combobox-icon');
  triggerIcon.setAttribute('data-slot', 'combobox-icon');
  trigger.appendChild(triggerIcon);

  wrapper.append(input, clearButton, trigger);

  // Região viva: remover um chip é mudança de estado que não move o foco, então
  // quem não vê a tela não recebe nada sem isto.
  const liveRegion = document.createElement('span');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.className = 'nds-sr-only';
  root.appendChild(liveRegion);

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.dataset.slot = 'combobox-hidden-input';
  if (name) hidden.name = name;
  root.appendChild(hidden);

  // ── Estado ─────────────────────────────────────────────────────────────────

  function syncHidden(): void {
    hidden.value = selected.join(',');
  }

  function renderChips(): void {
    wrapper.querySelectorAll('[data-slot="combobox-chip"]').forEach((n) => n.remove());
    if (!multiple) return;

    for (const value of selected) {
      const chip = document.createElement('span');
      chip.className = 'nds-combobox-chip';
      chip.dataset.slot = 'combobox-chip';
      chip.dataset.value = value;

      const textEl = document.createElement('span');
      textEl.dataset.slot = 'combobox-chip-text';
      textEl.textContent = labelOf(value);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'nds-combobox-chip-remove';
      removeButton.dataset.slot = 'combobox-chip-remove';
      removeButton.disabled = disabled;
      // Nome PRÓPRIO: numa lista de cinco chips, cinco botões chamados
      // "Remover" são indistinguíveis para quem navega por lista de controles.
      removeButton.setAttribute('aria-label', `${removeLabel} ${labelOf(value)}`);
      removeButton.appendChild(createIcon(PATH_X));
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deselect(value);
      });

      chip.append(textEl, removeButton);
      wrapper.insertBefore(chip, input);
    }
  }

  function announce(textEl: string): void {
    liveRegion.textContent = textEl;
  }

  function emit(): void {
    syncHidden();
    onValueChange?.([...selected]);
  }

  function select(value: string): void {
    if (multiple) {
      if (selected.includes(value)) return;
      selected.push(value);
      renderChips();
      // O texto sai do caminho: no múltiplo, escolher significa "já registrei,
      // pode digitar o próximo". Manter o filtro esconderia os itens restantes.
      input.value = '';
      onInputValueChange?.('');
    } else {
      selected = [value];
      input.value = labelOf(value);
      onInputValueChange?.(input.value);
      close();
    }
    emit();
    if (isOpen) runFilter();
  }

  function deselect(value: string): void {
    const before = selected.length;
    selected = selected.filter((v) => v !== value);
    if (selected.length === before) return;
    renderChips();
    announce(`${labelOf(value)} removido`);
    emit();
    input.focus();
    if (isOpen) runFilter();
  }

  // ── Lista ──────────────────────────────────────────────────────────────────

  function mountList(): void {
    positioner = document.createElement('div');
    positioner.className = 'nds-combobox-positioner';
    positioner.dataset.slot = 'combobox-positioner';

    const popup = document.createElement('div');
    popup.className = 'nds-combobox-popup';
    popup.dataset.slot = 'combobox-popup';

    list = document.createElement('div');
    list.id = listId;
    list.className = 'nds-combobox-list';
    list.dataset.slot = 'combobox-list';
    list.setAttribute('role', 'listbox');
    if (multiple) list.setAttribute('aria-multiselectable', 'true');

    popup.appendChild(list);
    positioner.appendChild(popup);
    root.appendChild(positioner);
  }

  function runFilter(): void {
    if (!list) return;
    const query = normalize(input.value.trim());
    visible = query
      ? items.filter((i) => normalize(i.label).includes(query))
      : [...items];

    list.textContent = '';

    if (visible.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'nds-combobox-empty';
      emptyEl.dataset.slot = 'combobox-empty';
      emptyEl.textContent = emptyMessage;
      list.appendChild(emptyEl);
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
      return;
    }

    let currentGroup: string | undefined;
    let destination: HTMLElement = list;

    visible.forEach((item, index) => {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        if (currentGroup) {
          const group = document.createElement('div');
          group.className = 'nds-combobox-group';
          group.dataset.slot = 'combobox-group';
          group.setAttribute('role', 'group');

          const groupLabelEl = document.createElement('div');
          groupLabelEl.className = 'nds-combobox-group-label';
          groupLabelEl.dataset.slot = 'combobox-group-label';
          groupLabelEl.id = `${baseId}-group-${index}`;
          groupLabelEl.textContent = currentGroup;

          group.setAttribute('aria-labelledby', groupLabelEl.id);
          group.appendChild(groupLabelEl);
          list!.appendChild(group);
          destination = group;
        } else {
          destination = list!;
        }
      }

      const option = document.createElement('div');
      option.id = `${baseId}-item-${index}`;
      option.className = 'nds-combobox-item';
      option.dataset.slot = 'combobox-item';
      option.dataset.value = item.value;
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(selected.includes(item.value)));
      if (item.disabled) option.setAttribute('aria-disabled', 'true');

      const textEl = document.createElement('span');
      textEl.dataset.slot = 'combobox-item-text';
      textEl.textContent = item.label;

      const indicator = document.createElement('span');
      indicator.className = 'nds-combobox-item-indicator';
      indicator.dataset.slot = 'combobox-item-indicator';
      indicator.appendChild(createIcon(PATH_CHECK));

      option.append(textEl, indicator);
      option.addEventListener('mousedown', (e) => {
        // `mousedown` e não `click`: o clique tiraria o foco do input antes de
        // a escolha acontecer, e o campo fecharia por blur no meio do gesto.
        e.preventDefault();
        if (item.disabled) return;
        selected.includes(item.value) && multiple
          ? deselect(item.value)
          : select(item.value);
      });
      option.addEventListener('mouseenter', () => highlight(index));

      destination.appendChild(option);
    });

    highlight(visible.length ? 0 : -1);
  }

  function optionAt(index: number): HTMLElement | null {
    return list?.querySelector(`#${CSS.escape(`${baseId}-item-${index}`)}`) ?? null;
  }

  function highlight(index: number): void {
    list?.querySelectorAll('[data-highlighted]').forEach((n) => {
      (n as HTMLElement).removeAttribute('data-highlighted');
    });
    activeIndex = index;
    const target = optionAt(index);
    if (!target) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    target.dataset.highlighted = '';
    // É `aria-activedescendant` e não foco: o input precisa continuar recebendo
    // a digitação enquanto a seta anda pela lista.
    input.setAttribute('aria-activedescendant', target.id);
    target.scrollIntoView({ block: 'nearest' });
  }

  function move(step: number): void {
    if (!visible.length) return;
    let next = activeIndex;
    for (let i = 0; i < visible.length; i++) {
      next = (next + step + visible.length) % visible.length;
      if (!visible[next].disabled) break;
    }
    highlight(next);
  }

  function open(): void {
    if (isOpen || disabled) return;
    isOpen = true;
    mountList();
    runFilter();
    input.setAttribute('aria-expanded', 'true');
    onOpenChange?.(true);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    positioner?.remove();
    positioner = null;
    list = null;
    activeIndex = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    onOpenChange?.(false);
  }

  // ── Teclado ────────────────────────────────────────────────────────────────

  input.addEventListener('input', () => {
    onInputValueChange?.(input.value);
    if (!isOpen) open();
    else runFilter();
  });

  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        isOpen ? move(1) : open();
        break;
      case 'ArrowUp':
        e.preventDefault();
        isOpen ? move(-1) : open();
        break;
      case 'Home':
        if (!isOpen) return;
        e.preventDefault();
        highlight(0);
        break;
      case 'End':
        if (!isOpen) return;
        e.preventDefault();
        highlight(visible.length - 1);
        break;
      case 'Enter':
        if (!isOpen || activeIndex < 0) return;
        e.preventDefault();
        if (!visible[activeIndex].disabled) select(visible[activeIndex].value);
        break;
      case 'Escape':
        // Duas funções na mesma tecla, e a ordem importa: fechar primeiro, e só
        // limpar o texto quando já não há o que fechar.
        if (isOpen) {
          e.preventDefault();
          close();
        } else if (input.value) {
          e.preventDefault();
          input.value = '';
          onInputValueChange?.('');
        }
        break;
      case 'Backspace':
        // O gesto que define o chip: sem ele, desfazer exige o mouse.
        if (multiple && input.value === '' && selected.length) {
          e.preventDefault();
          deselect(selected[selected.length - 1]);
        }
        break;
      case 'Tab':
        if (isOpen) close();
        break;
      default:
        break;
    }
  });

  trigger.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isOpen ? close() : open();
    input.focus();
  });

  clearButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    selected = [];
    input.value = '';
    renderChips();
    onInputValueChange?.('');
    announce(clearLabel);
    emit();
    input.focus();
    if (isOpen) runFilter();
  });

  // Clicar em qualquer canto do campo vai para o input — é o `cursor: text` do
  // wrapper cumprindo o que promete.
  wrapper.addEventListener('mousedown', (e) => {
    if (e.target === wrapper) {
      e.preventDefault();
      input.focus();
      if (!isOpen) open();
    }
  });

  function onClickOutside(e: MouseEvent): void {
    const target = e.target as Node;
    if (!root.contains(target)) close();
  }
  document.addEventListener('mousedown', onClickOutside);

  // ── Estado inicial ─────────────────────────────────────────────────────────

  renderChips();
  syncHidden();
  if (!multiple && selected.length) input.value = labelOf(selected[0]);

  return tornarDestruivel(root, root, () => {
    document.removeEventListener('mousedown', onClickOutside);
    close();
  });
}
