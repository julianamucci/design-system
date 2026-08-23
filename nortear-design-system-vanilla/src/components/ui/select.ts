// ─── Select — Vanilla factory standalone ────────────────────────────────────
//
// Gatilho + lista PORTALIZADA, as peças que a anatomia compartilhada descreve.
// Antes desta fábrica o Vanilla entregava um `<select>` nativo, e a consequência
// não era estética: seis dos catorze itens do contrato eram declarados
// `coversNotApplicable` porque a lista aberta era o popup do sistema
// operacional, desenhado FORA do documento — não havia elemento para observar,
// nem atributo ARIA para afirmar. Como o Vanilla é a referência cross-stack, a
// regra "o que o Vanilla não tem não é contrato" se voltava contra o próprio
// sistema: a anatomia prometia Trigger, Content e Item, e a referência não tinha
// nenhum dos três.
//
// Markup (o `data-slot` de cada peça é o contrato que as cinco stacks partilham):
//
//   <div data-slot="select">                          ← raiz, `display: contents`
//     <button class="nds-select-trigger" data-slot="select-trigger"
//             role="combobox" aria-expanded aria-haspopup="listbox">
//       <span class="nds-select-value" data-slot="select-value">…</span>
//       <svg class="nds-select-trigger-icon" data-slot="select-icon">
//     </button>
//     <input type="hidden" data-slot="select-hidden-input">
//   </div>
//
//   … e no `body`, só enquanto aberto:
//
//   <div class="nds-select-positioner" data-slot="select-positioner">
//     <div class="nds-select-content" data-slot="select-content" role="listbox">
//       <div class="nds-select-group" data-slot="select-group" role="group">
//         <div class="nds-select-label" data-slot="select-label">…</div>
//         <div class="nds-select-item" data-slot="select-item" role="option">
//           <span class="nds-select-item-text" data-slot="select-item-text">…</span>
//           <span class="nds-select-item-indicator" data-slot="select-item-indicator">
//         </div>
//       </div>
//       <div class="nds-select-separator" data-slot="select-separator" aria-hidden>
//     </div>
//   </div>
//
// ── Por que `aria-activedescendant`, e não foco real na opção ────────────────
//
// O gatilho é o `combobox` e NUNCA perde o foco do DOM; quem aponta a opção
// corrente é `aria-activedescendant`. Quatro razões, na ordem em que pesam:
//
//   1. é o padrão WAI-ARIA para o "Select-Only Combobox", que é exatamente a
//      forma que a anatomia descreve (gatilho `combobox` + `listbox` + `option`);
//   2. é o mecanismo que esta stack JÁ usa em `command.ts`. Duas fábricas de
//      lista com dois mecanismos de destaque seria vocabulário dividido no lugar
//      onde o Vanilla serve de referência;
//   3. `aria-expanded` só é anunciado a quem está com o foco. Com foco real
//      dentro do painel, o estado aberto/fechado passa a ser dito por um
//      elemento que já não tem o foco — e o item `accessibility.item5` do
//      contrato promete o contrário;
//   4. "o foco volta ao gatilho ao fechar" deixa de ser um caminho que pode
//      falhar: o foco nunca saiu. O que resta é o caso do clique de mouse numa
//      opção, e esse é tratado prevenindo o `mousedown` do painel — sem isso o
//      foco cairia no `<body>` e o Escape seguinte não teria dono.
//
// ── Limpeza ─────────────────────────────────────────────────────────────────
//
// O painel mora em portal no `body` e o ouvinte de clique-fora mora em
// `document`. Quem remove a raiz com a lista ABERTA — troca de story, desmonte
// de tela — deixaria painel órfão sobre o conteúdo seguinte e um ouvinte preso a
// um nó que não está em lugar nenhum. `tornarDestruivel` dá o `destroy()`
// idempotente e o dispara sozinho quando a raiz sai do documento.

import { cn } from '@/lib/utils';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Uma opção escolhível da lista. */
export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /**
   * Um ou mais `d` de traçado 24×24 desenhados antes do rótulo. Decorativo:
   * entra `aria-hidden`, então o nome acessível da opção continua sendo só o
   * rótulo.
   *
   * Aceita lista porque ícone de verdade raramente é um traçado só — o envelope
   * do e-mail são dois, e reduzi-lo a um daria um desenho diferente do que as
   * outras stacks mostram.
   */
  icon?: string | string[];
};

/**
 * Entrada da lista: opção, grupo com cabeçalho ou linha separadora.
 *
 * União DISCRIMINADA, e não um objeto com tudo opcional. A diferença aparece na
 * fábrica: com tudo opcional, cada leitura de `value` e de `label` precisa de um
 * `??` defensivo — e nenhum desses caminhos é alcançável pela API pública, então
 * eles nascem como ramo sem teste que ninguém consegue fechar. Aqui o tipo já
 * garante que uma opção tem valor e rótulo, e que um grupo tem cabeçalho e itens.
 */
export type SelectItem =
  | (SelectOption & { type?: 'item' })
  | { type: 'group'; label: string; items: SelectOption[] }
  | { type: 'separator' };

export type SelectOptions = {
  items: SelectItem[];
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** Densidade do gatilho. A altura sai do `padding-block`, nunca cravada. */
  size?: 'default' | 'sm';
  /**
   * Nome do campo no formulário. Serializa por um `<input type="hidden">` dentro
   * da raiz — é ele que o `FormData` nativo enxerga, sem código de quem consome.
   */
  name?: string;
  /** `id` do gatilho — é o alvo do `for` de um `<label>` externo. */
  id?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  /** Nome acessível da lista. Um `listbox` sem nome é violação de axe. */
  listLabel?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  /** Classes extra NO GATILHO — é ele que carrega a moldura do campo. */
  class?: string;
};

// ─── Ícones ───────────────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Traçado do chevron do gatilho (lucide `chevron-down`). */
const TRACO_CHEVRON = 'm6 9 6 6 6-6';
/** Traçado da marca de escolhido (lucide `check`). */
const TRACO_CHECK = 'M20 6 9 17l-5-5';

/**
 * Ícone montado nó a nó, e não por `innerHTML`.
 *
 * Aqui não há conteúdo de fora para sanitizar, mas `innerHTML` numa fábrica é o
 * caminho por onde a injeção entra na próxima vez que alguém passar um rótulo
 * por ali. Mesma decisão de `dropdown-menu.ts`.
 *
 * Sem classe com `size-`: a folha compartilhada dimensiona por
 * `.nds-select-item svg:not([class*="size-"])`, e uma classe dessas desligaria a
 * regra e devolveria o SVG no tamanho intrínseco.
 */
function createIcon(tracos: string | string[], className?: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  for (const traco of Array.isArray(tracos) ? tracos : [tracos]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', traco);
    svg.appendChild(path);
  }
  return svg;
}

/**
 * Marca da opção escolhida. Fica sempre no DOM; o que muda é o conteúdo.
 *
 * `aria-hidden` porque `aria-selected` no `role="option"` já anuncia o estado:
 * para o leitor de tela a marca é eco, para quem enxerga é o estado inteiro.
 */
function createIndicador(escolhido: boolean): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'nds-select-item-indicator';
  span.dataset.slot = 'select-item-indicator';
  span.setAttribute('aria-hidden', 'true');
  if (escolhido) span.appendChild(createIcon(TRACO_CHECK));
  return span;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _selectCounter = 0;

/** Prazo de segurança para a animação de saída, quando `animationend` não vem. */
const OUTPUT_MS_DURATION = 400;

/** Janela em que as letras da busca por digitação se acumulam (padrão WAI-ARIA). */
const SEARCH_MS_WINDOW = 1000;

/** Altura mínima reservada ao painel quando o campo está perto de uma borda. */
const HEIGHT_MINIMA_PX = 120;

function ehImprimivel(e: KeyboardEvent): boolean {
  return e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && /\S/.test(e.key);
}

// ─── createSelect ─────────────────────────────────────────────────────────────

export function createSelect(options: SelectOptions): DestroyableElement<HTMLDivElement> {
  const {
    items,
    placeholder = '',
    defaultValue,
    disabled = false,
    size = 'default',
    name,
    id,
    required = false,
    listLabel = 'Opções',
    onValueChange,
    onOpenChange,
  } = options;

  const seq = ++_selectCounter;
  const listId = `nds-select-content-${seq}`;

  /** Uma opção montada: o nó, o que ele vale e se aceita ser escolhido. */
  type Option = { el: HTMLElement; value: string; label: string; disabled: boolean };

  let value = defaultValue ?? '';
  let isOpen = false;
  let posicionador: HTMLElement | null = null;
  let content: HTMLElement | null = null;
  let optionList: Option[] = [];
  let active = -1;

  let timerClickOutside: ReturnType<typeof setTimeout> | null = null;
  let timerSearch: ReturnType<typeof setTimeout> | null = null;
  let timerOutput: ReturnType<typeof setTimeout> | null = null;
  /** Painel ainda no DOM tocando a animação de saída. */
  let saindo: HTMLElement | null = null;
  let search = '';

  // ── Rótulos ────────────────────────────────────────────────────────────────
  //
  // O rótulo do valor escolhido tem de existir ANTES da primeira abertura: um
  // valor inicial (ou vindo do formulário) precisa aparecer no campo fechado, e
  // as opções só existem enquanto a lista está montada. Sem este mapa o campo
  // mostraria o valor cru ("rj") no lugar do rótulo.
  const rotulos = new Map<string, string>();
  for (const entry of items) {
    if (entry.type === 'separator') continue;
    if (entry.type === 'group') {
      for (const opcao of entry.items) rotulos.set(opcao.value, opcao.label);
      continue;
    }
    rotulos.set(entry.value, entry.label);
  }

  // ── Raiz ───────────────────────────────────────────────────────────────────

  const root = document.createElement('div');
  root.dataset.slot = 'select';
  // `display: contents` faz o gatilho ser o filho de layout de quem consome —
  // como o root das outras stacks, que não emite caixa nenhuma. Mesma forma de
  // `popover.ts` e `dropdown-menu.ts`.
  root.style.display = 'contents';

  // ── Gatilho ────────────────────────────────────────────────────────────────

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = cn('nds-select-trigger', options.class);
  trigger.dataset.slot = 'select-trigger';
  trigger.dataset.size = size;
  // `data-state` é o contrato de estado que a tabela de Estados do conteúdo
  // compartilhado descreve e que as demais stacks emitem pela lib headless.
  trigger.dataset.state = 'closed';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  if (id) trigger.id = id;
  if (disabled) trigger.disabled = true;
  if (required) trigger.setAttribute('aria-required', 'true');
  if (options['aria-invalid']) trigger.setAttribute('aria-invalid', 'true');
  if (options['aria-describedby']) trigger.setAttribute('aria-describedby', options['aria-describedby']);

  const valueEl = document.createElement('span');
  valueEl.id = `nds-select-value-${seq}`;
  valueEl.className = 'nds-select-value';
  valueEl.dataset.slot = 'select-value';

  trigger.append(valueEl, createIcon(TRACO_CHEVRON, 'nds-select-trigger-icon'));

  // Nome acessível. `role="combobox"` NÃO aceita nome vindo do próprio conteúdo,
  // e o conteúdo do gatilho é justamente o valor exibido: sem `aria-label` ou
  // `aria-labelledby` o campo fica anônimo.
  //
  // A fábrica NÃO inventa um nome de reserva. Nomear o campo pelo próprio valor
  // faria o axe passar num campo que ninguém rotulou — trocaria uma violação
  // visível por um defeito silencioso, e é a fábrica de referência que ditaria a
  // troca para as outras quatro stacks.
  if (options['aria-label']) trigger.setAttribute('aria-label', options['aria-label']);
  if (options['aria-labelledby']) trigger.setAttribute('aria-labelledby', options['aria-labelledby']);

  // ── Campo escondido ────────────────────────────────────────────────────────
  //
  // A serialização nativa é a prova da integração com `<form>`: `FormData` lê
  // este campo sem nenhum código de quem consome. `required` NÃO vem para cá —
  // campo escondido é barrado da validação de restrição do navegador —, e vira
  // `aria-required` no gatilho, que é onde a exigência é anunciada.
  const fieldHidden = document.createElement('input');
  fieldHidden.type = 'hidden';
  fieldHidden.dataset.slot = 'select-hidden-input';
  if (name) fieldHidden.name = name;

  root.append(trigger, fieldHidden);

  // ── Valor ──────────────────────────────────────────────────────────────────

  function pintarValue(): void {
    const label = rotulos.get(value);
    valueEl.textContent = label ?? placeholder;
    fieldHidden.value = value;
    // Onde o `data-placeholder` pousa depende da lib: umas marcam o gatilho,
    // outras o elemento do valor. A folha compartilhada aceita as duas, e as
    // duas pintam o mesmo texto na mesma cor.
    if (label === undefined) {
      trigger.dataset.placeholder = '';
      valueEl.dataset.placeholder = '';
    } else {
      delete trigger.dataset.placeholder;
      delete valueEl.dataset.placeholder;
    }
  }

  function definirValue(novo: string): void {
    value = novo;
    pintarValue();
    for (const opcao of optionList) {
      const escolhido = opcao.value === value;
      opcao.el.setAttribute('aria-selected', String(escolhido));
      opcao.el.replaceChild(createIndicador(escolhido), opcao.el.lastElementChild!);
    }
    onValueChange?.(novo);
  }

  pintarValue();

  // ── Lista ──────────────────────────────────────────────────────────────────

  function mountOption(def: SelectOption, inside: HTMLElement): void {
    const index = optionList.length;
    const { value, label } = def;

    const el = document.createElement('div');
    el.id = `${listId}-opcao-${index}`;
    el.className = 'nds-select-item';
    el.dataset.slot = 'select-item';
    el.dataset.value = value;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', String(value === value));
    if (def.disabled) {
      el.dataset.disabled = '';
      el.setAttribute('aria-disabled', 'true');
    }

    const text = document.createElement('span');
    text.className = 'nds-select-item-text';
    text.dataset.slot = 'select-item-text';
    // O ícone entra DENTRO do texto, antes do rótulo, como nas demais stacks: é
    // `.nds-select-item-text` que declara o `gap` entre os dois.
    if (def.icon) text.appendChild(createIcon(def.icon));
    text.appendChild(document.createTextNode(label));

    el.append(text, createIndicador(value === value));

    // A folha põe `pointer-events: none` no item desabilitado, então o clique
    // nem chega; a guarda existe para o caminho de teclado, que chega.
    el.addEventListener('mousemove', () => {
      if (!def.disabled) destacar(index);
    });
    el.addEventListener('click', () => choose(index));

    inside.appendChild(el);
    optionList.push({ el, value, label, disabled: def.disabled ?? false });
  }

  function mountContent(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = listId;
    panel.className = 'nds-select-content';
    panel.dataset.slot = 'select-content';
    panel.dataset.state = 'open';
    // `data-open` é o atributo (sem valor) que a animação de entrada da folha
    // compartilhada procura; `data-state` é o contrato de estado documentado.
    panel.setAttribute('data-open', '');
    // O papel mora no PAINEL, e não num invólucro interno: sem botões de rolagem
    // (que a anatomia não descreve), os únicos filhos do painel são grupos,
    // opções e separadores — os filhos que a ARIA permite dentro de um
    // `listbox`. Um nível a menos é um lugar a menos para o contrato divergir, e
    // é o painel que carrega a animação: gatear a espera do teste pela opacidade
    // dele mede o que a pessoa vê, e não um filho que já nasce opaco.
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', listLabel);

    // O foco não pode escapar do gatilho quando o ponteiro pousa no painel: sem
    // isto o `mousedown` num `<div>` leva o foco ao `<body>`, e o Escape
    // seguinte fica sem dono.
    panel.addEventListener('mousedown', (e) => e.preventDefault());

    optionList = [];

    for (const entry of items) {
      if (entry.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'nds-select-separator';
        sep.dataset.slot = 'select-separator';
        // Dentro de um `listbox` a linha é DECORATIVA. Sem `aria-hidden` ela
        // seria um filho não permitido (axe `aria-required-children`) e a lista
        // inteira perderia a validade semântica por causa de um traço. Quem
        // separa para o leitor de tela é o grupo. Mesma decisão nas outras stacks.
        sep.setAttribute('aria-hidden', 'true');
        panel.appendChild(sep);
        continue;
      }

      if (entry.type === 'group') {
        const group = document.createElement('div');
        group.className = 'nds-select-group';
        group.dataset.slot = 'select-group';
        group.setAttribute('role', 'group');

        const label = document.createElement('div');
        label.id = `${listId}-grupo-${panel.childElementCount}`;
        label.className = 'nds-select-label';
        label.dataset.slot = 'select-label';
        label.textContent = entry.label;
        // O cabeçalho NOMEIA o grupo — é o que faz o leitor de tela anunciar
        // "Sudeste" ao entrar nele, em vez de "grupo".
        group.setAttribute('aria-labelledby', label.id);

        group.appendChild(label);
        for (const item of entry.items) mountOption(item, group);
        panel.appendChild(group);
        continue;
      }

      // Lista plana: as opções são filhas diretas do `listbox`, sem grupo — um
      // grupo de um só existe para o olho e mente para o leitor de tela.
      mountOption(entry, panel);
    }

    return panel;
  }

  // ── Posição ────────────────────────────────────────────────────────────────

  function posicionar(): void {
    /* v8 ignore next -- guarda de corrida: `resize` e `scroll` são soltos dentro
       de `fechar()`, no mesmo tique em que o painel é anulado. Um evento já
       enfileirado pelo navegador chegaria depois disso, e sem esta linha leria
       `offsetHeight` de `null`. Não há caminho de teste até a fila do navegador. */
    if (!posicionador || !content) return;
    const r = trigger.getBoundingClientRect();
    const panelHeight = content.offsetHeight;
    const folga = 4;

    const espacoBelow = window.innerHeight - r.bottom - folga;
    const espacoAbove = r.top - folga;
    // Vira para cima só quando não cabe embaixo E cabe melhor em cima: virar por
    // pouco faria o painel pular de lado a cada rolagem.
    const above = espacoBelow < panelHeight && espacoAbove > espacoBelow;

    posicionador.dataset.side = above ? 'top' : 'bottom';
    content.dataset.side = above ? 'top' : 'bottom';
    posicionador.style.left = `${r.left + window.scrollX}px`;
    posicionador.style.top = above
      ? `${r.top + window.scrollY - panelHeight - folga}px`
      : `${r.bottom + window.scrollY + folga}px`;

    // A folha compartilhada dimensiona o painel pelo ANCORADOURO — as libs
    // headless publicam estas duas custom properties e `.nds-select-content` tira
    // delas a largura e a altura máxima. Sem publicá-las aqui a largura cairia no
    // `auto` do fallback e o painel sairia mais estreito que o campo.
    posicionador.style.setProperty('--anchor-width', `${r.width}px`);
    posicionador.style.setProperty(
      '--available-height',
      `${Math.max(above ? espacoAbove : espacoBelow, HEIGHT_MINIMA_PX)}px`,
    );
  }

  // ── Destaque ───────────────────────────────────────────────────────────────

  function habilitadas(): number[] {
    return optionList.reduce<number[]>((acc, o, i) => (o.disabled ? acc : [...acc, i]), []);
  }

  function destacar(index: number): void {
    active = index;
    optionList.forEach((o, i) => {
      if (i === index) o.el.dataset.highlighted = '';
      else delete o.el.dataset.highlighted;
    });
    const target = optionList[index];
    if (target) {
      trigger.setAttribute('aria-activedescendant', target.el.id);
      target.el.scrollIntoView({ block: 'nearest' });
    } else {
      trigger.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * Onde o destaque nasce ao abrir: na opção escolhida, senão na primeira
   * disponível. É o que faz reabrir a lista mostrar de onde a escolha partiu.
   */
  function highlightInitial(): number {
    const escolhida = optionList.findIndex((o) => o.value === value && !o.disabled);
    if (escolhida !== -1) return escolhida;
    return habilitadas()[0] ?? -1;
  }

  /** Anda `step` opções, pulando as desabilitadas, sem dar a volta. */
  function mover(step: number): void {
    const list = habilitadas();
    if (list.length === 0) return;
    const current = list.indexOf(active);
    /* v8 ignore next 4 -- o destaque nunca pousa fora da lista de habilitadas:
       `highlightInitial` só devolve índice habilitado (ou -1, e aí `list` está
       vazia e a guarda acima já saiu), e nada torna uma opção indisponível depois
       de montada. A guarda cobre a ordem de chamada, não um estado alcançável. */
    if (current === -1) {
      destacar(step > 0 ? list[0] : list[list.length - 1]);
      return;
    }
    const next = Math.min(Math.max(current + step, 0), list.length - 1);
    destacar(list[next]);
  }

  // ── Busca por digitação ────────────────────────────────────────────────────
  //
  // As letras se acumulam por 1s, como no padrão WAI-ARIA: digitar "mi" rápido
  // procura "mi", e não "m" e depois "i". A varredura recomeça DEPOIS da opção
  // corrente para que repetir a mesma letra percorra as homônimas em vez de
  // travar na primeira.

  function clearSearch(): void {
    if (timerSearch !== null) {
      clearTimeout(timerSearch);
      timerSearch = null;
    }
    search = '';
  }

  function procurar(letra: string): number {
    search += letra.toLowerCase();
    if (timerSearch !== null) clearTimeout(timerSearch);
    timerSearch = setTimeout(clearSearch, SEARCH_MS_WINDOW);

    const list = habilitadas();
    const partida = list.indexOf(active);
    const order = list.slice(partida + 1).concat(list.slice(0, Math.max(partida + 1, 0)));
    return order.find((i) => optionList[i].label.toLowerCase().startsWith(search)) ?? -1;
  }

  /** Busca com a lista FECHADA: sem painel para destacar, ela escolhe direto. */
  function procurarClosed(letra: string): void {
    search += letra.toLowerCase();
    if (timerSearch !== null) clearTimeout(timerSearch);
    timerSearch = setTimeout(clearSearch, SEARCH_MS_WINDOW);

    const candidatos = [...rotulos.entries()];
    const partida = candidatos.findIndex(([v]) => v === value);
    const order = candidatos
      .slice(partida + 1)
      .concat(candidatos.slice(0, Math.max(partida + 1, 0)));
    const finding = order.find(([, label]) => label.toLowerCase().startsWith(search));
    if (finding && finding[0] !== value) definirValue(finding[0]);
  }

  // ── Abrir / fechar ─────────────────────────────────────────────────────────

  /** Remove agora o painel que estava tocando a animação de saída. */
  function recolherOutput(): void {
    if (timerOutput !== null) {
      clearTimeout(timerOutput);
      timerOutput = null;
    }
    saindo?.remove();
    saindo = null;
  }

  function open(): void {
    /* v8 ignore next -- os dois chamadores já filtram: o `click` nativo não
       dispara em botão desabilitado, e o `keydown` sai antes por `gatilho.disabled`
       e só chama isto com a lista fechada. A guarda existe para quem chamar a
       fábrica de outro lugar amanhã. */
    if (isOpen || trigger.disabled) return;
    // Reabrir enquanto o painel anterior ainda desaparece deixaria DOIS
    // `role="listbox"` no documento, e o segundo com `data-state="closed"` —
    // exatamente o estado que faz a espera do teste travar.
    recolherOutput();

    posicionador = document.createElement('div');
    posicionador.className = 'nds-select-positioner';
    posicionador.dataset.slot = 'select-positioner';
    posicionador.style.position = 'absolute';

    content = mountContent();
    posicionador.appendChild(content);
    document.body.appendChild(posicionador);
    posicionar();

    isOpen = true;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-controls', listId);
    trigger.dataset.state = 'open';

    // O gatilho é quem comanda o teclado, então ele tem de estar com o foco —
    // um clique de mouse não o garante em toda plataforma.
    trigger.focus();
    destacar(highlightInitial());
    // Medir DE NOVO: focar o gatilho e trazer a opção destacada à vista podem
    // rolar a página, e aí a caixa lida antes de rolar aponta para o lugar
    // errado. O ouvinte de `scroll` só entra depois, então esta segunda passada é
    // a única que alcança essas duas rolagens.
    posicionar();

    // Adiado para o clique que ABRIU não fechar em seguida. O timer é guardado
    // porque o fechamento pode chegar antes dele: sem cancelar, o ouvinte era
    // registrado DEPOIS da limpeza e ficava para sempre.
    timerClickOutside = setTimeout(() => {
      timerClickOutside = null;
      document.addEventListener('click', onClickOutside);
    }, 0);
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);

    onOpenChange?.(true);
  }

  function close({ devolverFocus = true }: { devolverFocus?: boolean } = {}): void {
    /* v8 ignore next -- todos os chamadores já filtram: o `keydown` só trata
       Escape e Tab dentro do ramo de lista aberta, `onClickOutside` só existe
       enquanto ela está aberta, e `destroy()` pergunta antes. A guarda torna
       `fechar()` idempotente para quem chamar de fora amanhã. */
    if (!isOpen) return;

    const panel = content;
    const portal = posicionador;
    isOpen = false;
    content = null;
    posicionador = null;
    optionList = [];
    active = -1;

    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-controls');
    trigger.removeAttribute('aria-activedescendant');
    trigger.dataset.state = 'closed';

    document.removeEventListener('click', onClickOutside);
    window.removeEventListener('resize', posicionar);
    window.removeEventListener('scroll', posicionar, true);
    /* v8 ignore next 4 -- só alcançável fechando no MESMO tique da abertura,
       antes de o `setTimeout(…, 0)` correr. Toda play espera o painal aparecer
       antes de fechar, então nenhuma alcança essa fresta — e é ela que impede o
       ouvinte de clique-fora de ser registrado DEPOIS da limpeza e ficar preso
       para sempre, que foi o vazamento medido no dropdown-menu. */
    if (timerClickOutside !== null) {
      clearTimeout(timerClickOutside);
      timerClickOutside = null;
    }
    clearSearch();

    if (panel && portal) {
      panel.removeAttribute('data-open');
      panel.setAttribute('data-closed', '');
      panel.dataset.state = 'closed';
      saindo = portal;
      // `prefers-reduced-motion` desliga a animação na folha, e aí `animationend`
      // NUNCA chega: o painel ficaria no documento até o prazo de segurança
      // estourar. Ler o nome da animação já recalculado responde qual dos dois
      // caminhos vale, em vez de esperar por um evento que pode não vir.
      /* v8 ignore next 3 -- caminho de `prefers-reduced-motion: reduce`, onde a
         folha desliga a animação e `animationend` nunca chega. O browser da suíte
         roda COM animação de propósito (a emulação foi removida porque deixava o
         CI verde escondendo asserção racy), então este ramo não é alcançável aqui
         — e é justamente o que protege quem navega com movimento reduzido. */
      if (getComputedStyle(panel).animationName === 'none') {
        recolherOutput();
      } else {
        panel.addEventListener('animationend', recolherOutput, { once: true });
        timerOutput = setTimeout(recolherOutput, OUTPUT_MS_DURATION);
      }
    }

    if (devolverFocus) trigger.focus();

    onOpenChange?.(false);
  }

  function choose(index: number): void {
    const opcao = optionList[index];
    if (!opcao || opcao.disabled) return;
    definirValue(opcao.value);
    close();
  }

  // ── Teclado ────────────────────────────────────────────────────────────────
  //
  // Um ouvinte só, e NO GATILHO: como o foco nunca sai dele, toda tecla chega
  // aqui. Um ouvinte de `keydown` em `document` — a forma do dropdown-menu, onde
  // o foco entra no painel — seria um segundo dono para o mesmo evento.

  trigger.addEventListener('keydown', (e) => {
    /* v8 ignore next -- botão desabilitado não recebe foco, e sem foco não chega
       `keydown`: o navegador fecha esse caminho antes de nós. A guarda protege
       quem trocar `disabled` por `aria-disabled` amanhã, que continua focável. */
    if (trigger.disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        open();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        open();
        const list = habilitadas();
        if (list.length) destacar(list[list.length - 1]);
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        open();
        const list = habilitadas();
        if (list.length) destacar(e.key === 'Home' ? list[0] : list[list.length - 1]);
        return;
      }
      if (ehImprimivel(e)) {
        e.preventDefault();
        procurarClosed(e.key);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        // Fecha SEM tocar no valor — e `fechar()` devolve o foco ao gatilho, que
        // nunca o perdeu.
        close();
        return;
      case 'Tab':
        // Fechar sem `preventDefault`: o Tab segue para o controle seguinte, e o
        // foco não deve voltar ao gatilho que a pessoa está deixando.
        close({ devolverFocus: false });
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        return;
      case 'ArrowDown':
        e.preventDefault();
        mover(1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        mover(-1);
        return;
      case 'Home': {
        e.preventDefault();
        const list = habilitadas();
        if (list.length) destacar(list[0]);
        return;
      }
      case 'End': {
        e.preventDefault();
        const list = habilitadas();
        if (list.length) destacar(list[list.length - 1]);
        return;
      }
    }

    if (ehImprimivel(e)) {
      e.preventDefault();
      const finding = procurar(e.key);
      if (finding !== -1) destacar(finding);
    }
  });

  // ── Ponteiro ───────────────────────────────────────────────────────────────

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) close();
    else open();
  });

  function onClickOutside(e: MouseEvent): void {
    const target = e.target as Node;
    if (!posicionador?.contains(target) && !trigger.contains(target)) {
      // O foco fica onde a pessoa o pôs: puxá-lo de volta ao gatilho seria
      // roubá-lo do controle que ela acabou de clicar. Mesma decisão do popover.
      close({ devolverFocus: false });
    }
  }

  return tornarDestruivel(root, root, () => {
    if (isOpen) close({ devolverFocus: false });
    // O painel pode estar tocando a saída no instante em que a raiz sai do
    // documento: sem isto ele sobreviveria por cima do conteúdo seguinte, que é
    // exatamente o vazamento que a forma compartilhada de limpeza fechou.
    recolherOutput();
    clearSearch();
  });
}
