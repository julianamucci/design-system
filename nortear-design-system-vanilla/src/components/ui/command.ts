// ─── Command — Vanilla factory standalone ───────────────────────────────────
//
// Visual: classes `.nds-command-*` (docs/shared/styles/nds/command.css). Este
// arquivo é a REFERÊNCIA cross-stack do markup:
//
//   <div class="nds-command" data-slot="command">
//     <div class="nds-command-input-wrapper">
//       <svg>…lupa…</svg>
//       <input class="nds-command-input" data-slot="command-input" role="combobox">
//     </div>
//     <div class="nds-command-list" data-slot="command-list" role="listbox">
//       <div class="nds-command-group" data-slot="command-group" role="group">
//         <div class="nds-command-group-heading">Categoria</div>
//         <div class="nds-command-item" data-slot="command-item" role="option">…</div>
//       </div>
//       <div class="nds-command-separator" data-slot="command-separator" aria-hidden="true"></div>
//     </div>
//     <div data-slot="command-empty" role="status" aria-live="polite">…</div>
//   </div>
//
// ─── Três decisões que o conteúdo compartilhado cobra ─────────────────────────
//
// 1. A região de "sem resultados" fica MONTADA o tempo todo, fora do listbox.
//    Uma região viva só é lida quando o conteúdo muda DENTRO dela — criar o
//    parágrafo no instante em que a busca esvazia não anuncia coisa nenhuma.
//    O que entra e sai é o texto (e a classe, que traz 24px de respiro e
//    deixaria um vão embaixo da lista cheia). Fora do listbox porque
//    `role="status"` não é filho permitido de `role="listbox"` e o axe reprova
//    por `aria-required-children`.
// 2. O campo publica `aria-activedescendant`. As setas movem o DESTAQUE e nunca
//    o foco — sem esse atributo quem usa leitor de tela não ouve qual comando
//    está em destaque, e a navegação por teclado vira um silêncio.
// 3. O item marcado emite `data-checked` e carrega o ícone de marca. A folha já
//    trazia `.nds-command-item[data-checked="true"] .nds-command-item-check`, e
//    o estado estava especificado sem nada que o entregasse.

import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommandItem = {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  /**
   * Estado de marcação. Indefinido = o item não é marcável e não ganha marca;
   * definido, vira `data-checked` e a marca acende quando verdadeiro.
   */
  checked?: boolean;
  /**
   * Atalho exibido à direita do comando. NÃO recebe `aria-hidden`: ele faz
   * parte do nome da opção ("Buscar, Command K"), que é o que dá serventia ao
   * atalho para quem usa leitor de tela.
   */
  shortcut?: string;
};

export type CommandOptions = {
  placeholder?: string;
  /** Frase anunciada quando a busca não encontra nada. */
  emptyMessage?: string;
  items: CommandItem[];
  onSelect?: (value: string) => void;
  class?: string;
};

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Construídos por `createElementNS`, nunca por `innerHTML`: conteúdo estático
// não precisa de parser de HTML, e a guideline 09 não deixa a rota aberta.

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}

function createSearchIcon(): SVGSVGElement {
  const svg = createSvg();
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '8');
  const cabo = document.createElementNS(SVG_NS, 'path');
  cabo.setAttribute('d', 'm21 21-4.3-4.3');
  svg.append(circle, cabo);
  return svg;
}

/**
 * Marca do item escolhido.
 *
 * Decorativa: quem anuncia o estado é o `data-checked` lido pela aplicação, não
 * o desenho. Fica sempre no DOM quando o item é marcável — a folha alterna a
 * OPACIDADE, e um ícone que entra e sai faria a largura do item pular a cada
 * mudança.
 */
function createCheckIcon(): SVGSVGElement {
  const svg = createSvg();
  svg.setAttribute('class', 'nds-command-item-check');
  const traco = document.createElementNS(SVG_NS, 'path');
  traco.setAttribute('d', 'M20 6 9 17l-5-5');
  svg.appendChild(traco);
  return svg;
}

// ─── createCommand ────────────────────────────────────────────────────────────

export function createCommand(options: CommandOptions): HTMLElement {
  const {
    placeholder = 'Search…',
    emptyMessage = 'No results found.',
    items,
    onSelect,
  } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'command';
  root.className = cn('nds-command', options.class);

  const _cmdId = `cmd-${Math.random().toString(36).slice(2, 8)}`;
  const _listboxId = `${_cmdId}-listbox`;

  // Id estável por item (índice na lista ORIGINAL, não na filtrada): é o que o
  // `aria-activedescendant` aponta, e ele não pode mudar de dono a cada filtro.
  const idDoItem = new Map<CommandItem, string>(
    items.map((item, i) => [item, `${_cmdId}-opt-${i}`]),
  );

  // Search input wrapper
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'nds-command-input-wrapper';
  inputWrapper.appendChild(createSearchIcon());

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className = 'nds-command-input';
  input.dataset.slot = 'command-input';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', _listboxId);
  input.setAttribute('aria-label', placeholder || 'Buscar');
  inputWrapper.appendChild(input);
  root.appendChild(inputWrapper);

  // List
  const list = document.createElement('div');
  list.className = 'nds-command-list';
  list.dataset.slot = 'command-list';
  list.id = _listboxId;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', placeholder || 'Resultados');
  list.setAttribute('tabindex', '0');
  root.appendChild(list);

  // Região viva de "sem resultados" — montada de uma vez, fora do listbox.
  const empty = document.createElement('div');
  empty.dataset.slot = 'command-empty';
  empty.setAttribute('role', 'status');
  empty.setAttribute('aria-live', 'polite');
  empty.setAttribute('aria-atomic', 'true');
  root.appendChild(empty);

  let activeIndex = -1;
  /** Todos os itens desenhados na rodada atual do filtro. */
  let visibleItems: HTMLElement[] = [];
  /** Só os que o teclado alcança — o desabilitado nunca é destino. */
  let navigableItems: HTMLElement[] = [];

  function agrupar(filtrados: CommandItem[]): Map<string, CommandItem[]> {
    const mapa = new Map<string, CommandItem[]>();
    for (const item of filtrados) {
      const chave = item.group ?? '';
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(item);
    }
    return mapa;
  }

  /**
   * Divisor entre grupos — decorativo.
   *
   * `aria-hidden` de propósito: uma linha de 1px dentro de `role="listbox"` não
   * é filho permitido pela ARIA (só `option` e `group` são), e o que separa os
   * blocos para quem não vê a tela é o rótulo de cada grupo, não o traço.
   */
  function criarSeparador(): HTMLElement {
    const sep = document.createElement('div');
    sep.className = 'nds-command-separator';
    sep.dataset.slot = 'command-separator';
    sep.setAttribute('aria-hidden', 'true');
    return sep;
  }

  function renderList(query: string): void {
    // `replaceChildren()` e não `innerHTML = ''`: o efeito é o mesmo e o arquivo
    // fica sem nenhuma escrita de HTML por string (guideline 09).
    list.replaceChildren();
    visibleItems = [];
    navigableItems = [];
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');

    const q = query.toLowerCase();
    const filtrados = items.filter(
      (item) => !q || item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    );

    const semResultado = filtrados.length === 0;
    empty.textContent = semResultado ? emptyMessage : '';
    // Sem a classe o elemento continua no DOM e na árvore de acessibilidade,
    // com altura zero — o oposto de `display: none`, e é o que preserva o
    // anúncio da próxima busca vazia.
    empty.className = semResultado ? 'nds-command-empty' : '';
    if (semResultado) empty.setAttribute('data-empty', '');
    else empty.removeAttribute('data-empty');

    if (semResultado) return;

    const grupos = agrupar(filtrados);
    let primeiro = true;
    let indiceDoGrupo = 0;

    grupos.forEach((itensDoGrupo, nomeDoGrupo) => {
      if (!primeiro) list.appendChild(criarSeparador());
      primeiro = false;

      const groupEl = document.createElement('div');
      groupEl.className = 'nds-command-group';
      groupEl.dataset.slot = 'command-group';

      if (nomeDoGrupo) {
        const heading = document.createElement('div');
        heading.className = 'nds-command-group-heading';
        heading.id = `${_cmdId}-group-${indiceDoGrupo}`;
        heading.textContent = nomeDoGrupo;
        groupEl.appendChild(heading);
        // O grupo é nomeado pelo próprio cabeçalho — e o cabeçalho não vira
        // uma opção da lista, que é o erro clássico deste componente.
        groupEl.setAttribute('role', 'group');
        groupEl.setAttribute('aria-labelledby', heading.id);
      }

      for (const item of itensDoGrupo) {
        const el = buildItemEl(item);
        groupEl.appendChild(el);
        visibleItems.push(el);
        if (!item.disabled) navigableItems.push(el);
      }

      list.appendChild(groupEl);
      indiceDoGrupo += 1;
    });
  }

  function buildItemEl(item: CommandItem): HTMLElement {
    const el = document.createElement('div');
    el.id = idDoItem.get(item) ?? `${_cmdId}-opt-${item.value}`;
    el.dataset.slot = 'command-item';
    el.dataset.value = item.value;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', 'false');
    el.className = 'nds-command-item';
    if (item.disabled) el.setAttribute('aria-disabled', 'true');

    el.appendChild(document.createTextNode(item.label));

    if (item.shortcut) {
      const atalho = document.createElement('span');
      atalho.className = 'nds-command-shortcut';
      atalho.dataset.slot = 'command-shortcut';
      atalho.textContent = item.shortcut;
      el.appendChild(atalho);
    }

    if (item.checked !== undefined) {
      el.dataset.checked = String(item.checked);
      // A folha esconde a marca quando há atalho no mesmo item — os dois
      // disputariam a borda direita.
      el.appendChild(createCheckIcon());
    }

    if (!item.disabled) {
      el.addEventListener('click', () => selectItem(item.value));
      el.addEventListener('mouseenter', () => {
        setActive(navigableItems.indexOf(el));
      });
    }

    return el;
  }

  function setActive(index: number): void {
    const alvo = index >= 0 ? navigableItems[index] ?? null : null;

    for (const el of visibleItems) {
      el.setAttribute('aria-selected', String(el === alvo));
    }

    if (alvo) {
      alvo.scrollIntoView({ block: 'nearest' });
      // Sem isto o leitor de tela não tem como dizer QUAL comando está em
      // destaque: o foco nunca sai do campo de busca.
      input.setAttribute('aria-activedescendant', alvo.id);
      activeIndex = index;
    } else {
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }
  }

  function selectItem(value: string): void {
    onSelect?.(value);
    input.value = '';
    renderList('');
  }

  input.addEventListener('input', () => renderList(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, navigableItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const el = navigableItems[activeIndex];
      if (el) selectItem(el.dataset.value!);
    } else if (e.key === 'Escape') {
      input.blur();
    }
  });

  renderList('');
  return root;
}
