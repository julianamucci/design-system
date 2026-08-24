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
// Os chips vivem dentro de `.nds-combobox-chips`, que é `display: contents`:
// o elemento existe na árvore — a anatomia publica esse slot, e as outras
// quatro stacks o emitem — mas não gera caixa própria, então os chips seguem
// quebrando linha junto com o input, que era o motivo de omiti-lo antes.
//
// ── Modo controlado, na forma que uma fábrica permite ────────────────────────
//
// Aqui não existe re-render de framework: ninguém volta a chamar a fábrica com
// um valor novo. Então "controlado" tem esta forma:
//
//   • passar `value` faz a fábrica DEIXAR de ser dona da escolha. Escolher,
//     remover chip e limpar passam a apenas ANUNCIAR por `onValueChange`;
//     chips, campo escondido e marcas de escolhido só se movem quando quem
//     manda responde com `setValue()`.
//   • passar `inputValue` faz o mesmo com o texto de busca: digitar anuncia por
//     `onInputValueChange` e o campo devolve o texto de quem manda; a tela só
//     muda em `setInputValue()`.
//
// Os dois verbos ficam no elemento devolvido, no mesmo lugar em que `destroy()`
// mora. Sem `value` e sem `inputValue` nada disso existe: a fábrica continua
// dona do estado e `defaultValue` é o caminho de sempre.

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
  /**
   * Escolha em modo CONTROLADO.
   *
   * Definida, a fábrica não é dona do estado: a interação só anuncia por
   * `onValueChange`, e a tela espera por `setValue()`. Em modo simples, só o
   * primeiro valor é considerado.
   */
  value?: string[];
  /** Valores iniciais. Em modo simples, só o primeiro é considerado. */
  defaultValue?: string[];
  /**
   * Texto de busca em modo CONTROLADO.
   *
   * Definido, digitar apenas anuncia por `onInputValueChange` — o campo volta a
   * exibir o texto de quem manda, que só muda em `setInputValue()`.
   */
  inputValue?: string;
  /**
   * Substitui o filtro.
   *
   * Recebe o texto digitado CRU: normalizar, casar por sinônimo ou por código
   * interno passa a ser decisão de quem filtra. O padrão compara o rótulo
   * ignorando acento e caixa.
   */
  filter?: (item: ComboboxItem, query: string) => boolean;
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
  /**
   * Frase que a região viva anuncia ao remover um chip. É função, e não sufixo,
   * para o rótulo poder cair em qualquer ponto da frase — em pt, en e es ele
   * abre ("React removido"), mas amarrar a posição na assinatura fecharia a
   * porta para o idioma em que não abre.
   */
  removedAnnouncement?: (label: string) => string;
  onValueChange?: (value: string[]) => void;
  onInputValueChange?: (text: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

/** O que a fábrica devolve. */
export type ComboboxElement = DestroyableElement<HTMLDivElement> & {
  /** Escreve a escolha. É por aqui que o modo controlado empurra o valor novo. */
  setValue: (value: string[]) => void;
  /** Escolha atual, sempre como lista — também em modo simples. */
  getValue: () => string[];
  /** Escreve o texto de busca. É o caminho do modo controlado de texto. */
  setInputValue: (text: string) => void;
  /** Texto de busca exibido agora. */
  getInputValue: () => string;
};

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
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Filtro padrão: o rótulo casa se contiver o texto digitado, sem acento e sem
 * caixa. É o valor padrão da opção `filter`, e não um caminho separado — quem
 * substitui o filtro substitui exatamente isto.
 */
const defaultFilter = (item: ComboboxItem, query: string): boolean =>
  normalize(item.label).includes(normalize(query));

export function createCombobox(options: ComboboxOptions): ComboboxElement {
  const {
    items,
    label,
    placeholder = '',
    multiple = false,
    defaultValue = [],
    filter = defaultFilter,
    disabled = false,
    invalid = false,
    name,
    id,
    emptyMessage = 'Nenhum resultado',
    clearLabel = 'Limpar',
    triggerLabel = 'Abrir lista',
    removeLabel = 'Remover',
    removedAnnouncement = (label: string) => `${label} removido`,
    onValueChange,
    onInputValueChange,
    onOpenChange,
    className,
  } = options;

  const seq = ++_comboboxCounter;
  const baseId = id ?? `nds-combobox-${seq}`;
  const listId = `${baseId}-list`;

  // `value` e `inputValue` são lidos de `options` e não desestruturados: os dois
  // nomes já são parâmetro de meia dúzia de funções aqui dentro, e a versão
  // desestruturada ficaria sombreada exatamente onde importa.
  const valueControlled = options.value !== undefined;
  const inputControlled = options.inputValue !== undefined;

  /** Só o primeiro valor conta em modo simples — a lista é a forma, não o modo. */
  const fit = (list: string[]): string[] => (multiple ? [...list] : list.slice(0, 1));

  let selected: string[] = fit(valueControlled ? options.value ?? [] : defaultValue);
  /** Texto exibido no campo. Controlado, é o texto de quem manda. */
  let inputText = '';
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

  // Contêiner real, como nas outras quatro e como a anatomia publica. Ele não
  // cria caixa de flex própria — `.nds-combobox-chips` é `display: contents`,
  // justamente para os chips continuarem quebrando linha junto com o input.
  const chipsEl = document.createElement('div');
  chipsEl.className = 'nds-combobox-chips';
  chipsEl.dataset.slot = 'combobox-chips';
  wrapper.appendChild(chipsEl);

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
    chipsEl.replaceChildren();
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
      chipsEl.appendChild(chip);
    }
  }

  function announce(text: string): void {
    liveRegion.textContent = text;
  }

  /**
   * Escreve a escolha na tela. É o ÚNICO caminho que mexe em `selected` — no
   * modo controlado ele só roda a pedido de quem manda, por `setValue()`.
   */
  function applyValue(next: string[]): void {
    selected = fit(next);
    renderChips();
    syncHidden();
    // Em escolha única o texto do campo É a escolha exibida, então ele anda
    // junto. No múltiplo quem mostra a escolha são os chips, e o texto continua
    // sendo do filtro.
    if (!multiple) requestInputText(selected.length ? labelOf(selected[0]) : '');
    if (isOpen) runFilter();
  }

  /**
   * Intenção de mudança vinda de uma INTERAÇÃO.
   *
   * Controlada, ela é apenas anunciada — quem manda responde por `setValue()`.
   * Fora do modo controlado, é aplicada na hora e anunciada depois, para quem
   * ouve encontrar o campo escondido já com o valor novo.
   */
  function requestValue(next: string[]): void {
    const wanted = fit(next);
    if (!valueControlled) applyValue(wanted);
    onValueChange?.([...wanted]);
  }

  /**
   * Escreve o texto de busca na tela, venha de onde vier. Não refiltra sozinho:
   * quem chama sabe se a lista precisa ser reconstruída no mesmo gesto, e
   * refiltrar aqui duplicaria a varredura no caminho da digitação.
   */
  function applyInputText(text: string): void {
    inputText = text;
    input.value = text;
  }

  /**
   * Intenção de mudança do texto de busca.
   *
   * Controlado, o campo devolve o texto de quem manda e só anuncia — é isso que
   * faz `inputValue` valer contra a digitação, que já escreveu no DOM quando
   * este caminho roda.
   */
  function requestInputText(text: string): void {
    // Nada mudou de fato: não há intenção a anunciar. Sem esta cerca, limpar o
    // campo em escolha única anunciaria o texto vazio duas vezes.
    if (text === inputText) return;
    if (inputControlled) input.value = inputText;
    else applyInputText(text);
    onInputValueChange?.(text);
  }

  function select(value: string): void {
    if (multiple) {
      if (selected.includes(value)) return;
      requestValue([...selected, value]);
      // O texto sai do caminho: no múltiplo, escolher significa "já registrei,
      // pode digitar o próximo". Manter o filtro esconderia os itens restantes.
      requestInputText('');
    } else {
      requestValue([value]);
      close();
    }
    if (isOpen) runFilter();
  }

  function deselect(value: string): void {
    if (!selected.includes(value)) return;
    requestValue(selected.filter((v) => v !== value));
    announce(removedAnnouncement(labelOf(value)));
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
    // O texto vai CRU para o filtro: normalizar aqui esconderia do filtro de
    // fora exatamente o que a pessoa digitou.
    const query = input.value.trim();
    visible = query ? items.filter((i) => filter(i, query)) : [...items];

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
    // O DOM já escreveu o texto digitado: no modo controlado é `requestInputText`
    // que o devolve ao texto de quem manda, e por isso a leitura vem antes.
    requestInputText(input.value);
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
          requestInputText('');
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
    requestValue([]);
    // Em escolha única o texto já saiu junto da escolha, e a cerca de
    // `requestInputText` engole a segunda chamada; no múltiplo, é esta linha que
    // limpa o filtro.
    requestInputText('');
    announce(clearLabel);
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
  // Controlado, o texto inicial é o de quem manda — mesmo em escolha única, em
  // que fora do modo controlado ele seria o rótulo do escolhido.
  applyInputText(
    inputControlled
      ? options.inputValue ?? ''
      : !multiple && selected.length
        ? labelOf(selected[0])
        : '',
  );

  // `Object.assign` e não um `as`: os quatro verbos entram no tipo do próprio
  // alvo, e `tornarDestruivel` devolve exatamente `ComboboxElement`.
  return tornarDestruivel(
    root,
    Object.assign(root, {
      setValue: applyValue,
      getValue: () => [...selected],
      setInputValue: (text: string) => {
        applyInputText(text);
        if (isOpen) runFilter();
      },
      getInputValue: () => inputText,
    }),
    () => {
      document.removeEventListener('mousedown', onClickOutside);
      close();
    },
  );
}
