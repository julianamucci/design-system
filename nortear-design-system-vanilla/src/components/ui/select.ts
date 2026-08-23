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

  let valor = defaultValue ?? '';
  let isOpen = false;
  let posicionador: HTMLElement | null = null;
  let conteudo: HTMLElement | null = null;
  let opcoes: Option[] = [];
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

  const raiz = document.createElement('div');
  raiz.dataset.slot = 'select';
  // `display: contents` faz o gatilho ser o filho de layout de quem consome —
  // como o root das outras stacks, que não emite caixa nenhuma. Mesma forma de
  // `popover.ts` e `dropdown-menu.ts`.
  raiz.style.display = 'contents';

  // ── Gatilho ────────────────────────────────────────────────────────────────

  const gatilho = document.createElement('button');
  gatilho.type = 'button';
  gatilho.className = cn('nds-select-trigger', options.class);
  gatilho.dataset.slot = 'select-trigger';
  gatilho.dataset.size = size;
  // `data-state` é o contrato de estado que a tabela de Estados do conteúdo
  // compartilhado descreve e que as demais stacks emitem pela lib headless.
  gatilho.dataset.state = 'closed';
  gatilho.setAttribute('role', 'combobox');
  gatilho.setAttribute('aria-haspopup', 'listbox');
  gatilho.setAttribute('aria-expanded', 'false');
  if (id) gatilho.id = id;
  if (disabled) gatilho.disabled = true;
  if (required) gatilho.setAttribute('aria-required', 'true');
  if (options['aria-invalid']) gatilho.setAttribute('aria-invalid', 'true');
  if (options['aria-describedby']) gatilho.setAttribute('aria-describedby', options['aria-describedby']);

  const valueEl = document.createElement('span');
  valueEl.id = `nds-select-value-${seq}`;
  valueEl.className = 'nds-select-value';
  valueEl.dataset.slot = 'select-value';

  gatilho.append(valueEl, createIcon(TRACO_CHEVRON, 'nds-select-trigger-icon'));

  // Nome acessível. `role="combobox"` NÃO aceita nome vindo do próprio conteúdo,
  // e o conteúdo do gatilho é justamente o valor exibido: sem `aria-label` ou
  // `aria-labelledby` o campo fica anônimo.
  //
  // A fábrica NÃO inventa um nome de reserva. Nomear o campo pelo próprio valor
  // faria o axe passar num campo que ninguém rotulou — trocaria uma violação
  // visível por um defeito silencioso, e é a fábrica de referência que ditaria a
  // troca para as outras quatro stacks.
  if (options['aria-label']) gatilho.setAttribute('aria-label', options['aria-label']);
  if (options['aria-labelledby']) gatilho.setAttribute('aria-labelledby', options['aria-labelledby']);

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

  raiz.append(gatilho, fieldHidden);

  // ── Valor ──────────────────────────────────────────────────────────────────

  function pintarValue(): void {
    const rotulo = rotulos.get(valor);
    valueEl.textContent = rotulo ?? placeholder;
    fieldHidden.value = valor;
    // Onde o `data-placeholder` pousa depende da lib: umas marcam o gatilho,
    // outras o elemento do valor. A folha compartilhada aceita as duas, e as
    // duas pintam o mesmo texto na mesma cor.
    if (rotulo === undefined) {
      gatilho.dataset.placeholder = '';
      valueEl.dataset.placeholder = '';
    } else {
      delete gatilho.dataset.placeholder;
      delete valueEl.dataset.placeholder;
    }
  }

  function definirValue(novo: string): void {
    valor = novo;
    pintarValue();
    for (const opcao of opcoes) {
      const escolhido = opcao.value === valor;
      opcao.el.setAttribute('aria-selected', String(escolhido));
      opcao.el.replaceChild(createIndicador(escolhido), opcao.el.lastElementChild!);
    }
    onValueChange?.(novo);
  }

  pintarValue();

  // ── Lista ──────────────────────────────────────────────────────────────────

  function mountOption(def: SelectOption, inside: HTMLElement): void {
    const indice = opcoes.length;
    const { value, label } = def;

    const el = document.createElement('div');
    el.id = `${listId}-opcao-${indice}`;
    el.className = 'nds-select-item';
    el.dataset.slot = 'select-item';
    el.dataset.value = value;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', String(value === valor));
    if (def.disabled) {
      el.dataset.disabled = '';
      el.setAttribute('aria-disabled', 'true');
    }

    const texto = document.createElement('span');
    texto.className = 'nds-select-item-text';
    texto.dataset.slot = 'select-item-text';
    // O ícone entra DENTRO do texto, antes do rótulo, como nas demais stacks: é
    // `.nds-select-item-text` que declara o `gap` entre os dois.
    if (def.icon) texto.appendChild(createIcon(def.icon));
    texto.appendChild(document.createTextNode(label));

    el.append(texto, createIndicador(value === valor));

    // A folha põe `pointer-events: none` no item desabilitado, então o clique
    // nem chega; a guarda existe para o caminho de teclado, que chega.
    el.addEventListener('mousemove', () => {
      if (!def.disabled) destacar(indice);
    });
    el.addEventListener('click', () => choose(indice));

    inside.appendChild(el);
    opcoes.push({ el, value, label, disabled: def.disabled ?? false });
  }

  function mountContent(): HTMLElement {
    const painel = document.createElement('div');
    painel.id = listId;
    painel.className = 'nds-select-content';
    painel.dataset.slot = 'select-content';
    painel.dataset.state = 'open';
    // `data-open` é o atributo (sem valor) que a animação de entrada da folha
    // compartilhada procura; `data-state` é o contrato de estado documentado.
    painel.setAttribute('data-open', '');
    // O papel mora no PAINEL, e não num invólucro interno: sem botões de rolagem
    // (que a anatomia não descreve), os únicos filhos do painel são grupos,
    // opções e separadores — os filhos que a ARIA permite dentro de um
    // `listbox`. Um nível a menos é um lugar a menos para o contrato divergir, e
    // é o painel que carrega a animação: gatear a espera do teste pela opacidade
    // dele mede o que a pessoa vê, e não um filho que já nasce opaco.
    painel.setAttribute('role', 'listbox');
    painel.setAttribute('aria-label', listLabel);

    // O foco não pode escapar do gatilho quando o ponteiro pousa no painel: sem
    // isto o `mousedown` num `<div>` leva o foco ao `<body>`, e o Escape
    // seguinte fica sem dono.
    painel.addEventListener('mousedown', (e) => e.preventDefault());

    opcoes = [];

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
        painel.appendChild(sep);
        continue;
      }

      if (entry.type === 'group') {
        const grupo = document.createElement('div');
        grupo.className = 'nds-select-group';
        grupo.dataset.slot = 'select-group';
        grupo.setAttribute('role', 'group');

        const rotulo = document.createElement('div');
        rotulo.id = `${listId}-grupo-${painel.childElementCount}`;
        rotulo.className = 'nds-select-label';
        rotulo.dataset.slot = 'select-label';
        rotulo.textContent = entry.label;
        // O cabeçalho NOMEIA o grupo — é o que faz o leitor de tela anunciar
        // "Sudeste" ao entrar nele, em vez de "grupo".
        grupo.setAttribute('aria-labelledby', rotulo.id);

        grupo.appendChild(rotulo);
        for (const item of entry.items) mountOption(item, grupo);
        painel.appendChild(grupo);
        continue;
      }

      // Lista plana: as opções são filhas diretas do `listbox`, sem grupo — um
      // grupo de um só existe para o olho e mente para o leitor de tela.
      mountOption(entry, painel);
    }

    return painel;
  }

  // ── Posição ────────────────────────────────────────────────────────────────

  function posicionar(): void {
    /* v8 ignore next -- guarda de corrida: `resize` e `scroll` são soltos dentro
       de `fechar()`, no mesmo tique em que o painel é anulado. Um evento já
       enfileirado pelo navegador chegaria depois disso, e sem esta linha leria
       `offsetHeight` de `null`. Não há caminho de teste até a fila do navegador. */
    if (!posicionador || !conteudo) return;
    const r = gatilho.getBoundingClientRect();
    const panelHeight = conteudo.offsetHeight;
    const folga = 4;

    const espacoBelow = window.innerHeight - r.bottom - folga;
    const espacoAbove = r.top - folga;
    // Vira para cima só quando não cabe embaixo E cabe melhor em cima: virar por
    // pouco faria o painel pular de lado a cada rolagem.
    const above = espacoBelow < panelHeight && espacoAbove > espacoBelow;

    posicionador.dataset.side = above ? 'top' : 'bottom';
    conteudo.dataset.side = above ? 'top' : 'bottom';
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
    return opcoes.reduce<number[]>((acc, o, i) => (o.disabled ? acc : [...acc, i]), []);
  }

  function destacar(indice: number): void {
    active = indice;
    opcoes.forEach((o, i) => {
      if (i === indice) o.el.dataset.highlighted = '';
      else delete o.el.dataset.highlighted;
    });
    const alvo = opcoes[indice];
    if (alvo) {
      gatilho.setAttribute('aria-activedescendant', alvo.el.id);
      alvo.el.scrollIntoView({ block: 'nearest' });
    } else {
      gatilho.removeAttribute('aria-activedescendant');
    }
  }

  /**
   * Onde o destaque nasce ao abrir: na opção escolhida, senão na primeira
   * disponível. É o que faz reabrir a lista mostrar de onde a escolha partiu.
   */
  function highlightInitial(): number {
    const escolhida = opcoes.findIndex((o) => o.value === valor && !o.disabled);
    if (escolhida !== -1) return escolhida;
    return habilitadas()[0] ?? -1;
  }

  /** Anda `passo` opções, pulando as desabilitadas, sem dar a volta. */
  function mover(passo: number): void {
    const lista = habilitadas();
    if (lista.length === 0) return;
    const atual = lista.indexOf(active);
    /* v8 ignore next 4 -- o destaque nunca pousa fora da lista de habilitadas:
       `highlightInitial` só devolve índice habilitado (ou -1, e aí `lista` está
       vazia e a guarda acima já saiu), e nada torna uma opção indisponível depois
       de montada. A guarda cobre a ordem de chamada, não um estado alcançável. */
    if (atual === -1) {
      destacar(passo > 0 ? lista[0] : lista[lista.length - 1]);
      return;
    }
    const next = Math.min(Math.max(atual + passo, 0), lista.length - 1);
    destacar(lista[next]);
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

    const lista = habilitadas();
    const partida = lista.indexOf(active);
    const order = lista.slice(partida + 1).concat(lista.slice(0, Math.max(partida + 1, 0)));
    return order.find((i) => opcoes[i].label.toLowerCase().startsWith(search)) ?? -1;
  }

  /** Busca com a lista FECHADA: sem painel para destacar, ela escolhe direto. */
  function procurarClosed(letra: string): void {
    search += letra.toLowerCase();
    if (timerSearch !== null) clearTimeout(timerSearch);
    timerSearch = setTimeout(clearSearch, SEARCH_MS_WINDOW);

    const candidatos = [...rotulos.entries()];
    const partida = candidatos.findIndex(([v]) => v === valor);
    const order = candidatos
      .slice(partida + 1)
      .concat(candidatos.slice(0, Math.max(partida + 1, 0)));
    const finding = order.find(([, rotulo]) => rotulo.toLowerCase().startsWith(search));
    if (finding && finding[0] !== valor) definirValue(finding[0]);
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

  function abrir(): void {
    /* v8 ignore next -- os dois chamadores já filtram: o `click` nativo não
       dispara em botão desabilitado, e o `keydown` sai antes por `gatilho.disabled`
       e só chama isto com a lista fechada. A guarda existe para quem chamar a
       fábrica de outro lugar amanhã. */
    if (isOpen || gatilho.disabled) return;
    // Reabrir enquanto o painel anterior ainda desaparece deixaria DOIS
    // `role="listbox"` no documento, e o segundo com `data-state="closed"` —
    // exatamente o estado que faz a espera do teste travar.
    recolherOutput();

    posicionador = document.createElement('div');
    posicionador.className = 'nds-select-positioner';
    posicionador.dataset.slot = 'select-positioner';
    posicionador.style.position = 'absolute';

    conteudo = mountContent();
    posicionador.appendChild(conteudo);
    document.body.appendChild(posicionador);
    posicionar();

    isOpen = true;
    gatilho.setAttribute('aria-expanded', 'true');
    gatilho.setAttribute('aria-controls', listId);
    gatilho.dataset.state = 'open';

    // O gatilho é quem comanda o teclado, então ele tem de estar com o foco —
    // um clique de mouse não o garante em toda plataforma.
    gatilho.focus();
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

  function fechar({ devolverFocus = true }: { devolverFocus?: boolean } = {}): void {
    /* v8 ignore next -- todos os chamadores já filtram: o `keydown` só trata
       Escape e Tab dentro do ramo de lista aberta, `onClickOutside` só existe
       enquanto ela está aberta, e `destroy()` pergunta antes. A guarda torna
       `fechar()` idempotente para quem chamar de fora amanhã. */
    if (!isOpen) return;

    const painel = conteudo;
    const portal = posicionador;
    isOpen = false;
    conteudo = null;
    posicionador = null;
    opcoes = [];
    active = -1;

    gatilho.setAttribute('aria-expanded', 'false');
    gatilho.removeAttribute('aria-controls');
    gatilho.removeAttribute('aria-activedescendant');
    gatilho.dataset.state = 'closed';

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

    if (painel && portal) {
      painel.removeAttribute('data-open');
      painel.setAttribute('data-closed', '');
      painel.dataset.state = 'closed';
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
      if (getComputedStyle(painel).animationName === 'none') {
        recolherOutput();
      } else {
        painel.addEventListener('animationend', recolherOutput, { once: true });
        timerOutput = setTimeout(recolherOutput, OUTPUT_MS_DURATION);
      }
    }

    if (devolverFocus) gatilho.focus();

    onOpenChange?.(false);
  }

  function choose(indice: number): void {
    const opcao = opcoes[indice];
    if (!opcao || opcao.disabled) return;
    definirValue(opcao.value);
    fechar();
  }

  // ── Teclado ────────────────────────────────────────────────────────────────
  //
  // Um ouvinte só, e NO GATILHO: como o foco nunca sai dele, toda tecla chega
  // aqui. Um ouvinte de `keydown` em `document` — a forma do dropdown-menu, onde
  // o foco entra no painel — seria um segundo dono para o mesmo evento.

  gatilho.addEventListener('keydown', (e) => {
    /* v8 ignore next -- botão desabilitado não recebe foco, e sem foco não chega
       `keydown`: o navegador fecha esse caminho antes de nós. A guarda protege
       quem trocar `disabled` por `aria-disabled` amanhã, que continua focável. */
    if (gatilho.disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        abrir();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        abrir();
        const lista = habilitadas();
        if (lista.length) destacar(lista[lista.length - 1]);
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        abrir();
        const lista = habilitadas();
        if (lista.length) destacar(e.key === 'Home' ? lista[0] : lista[lista.length - 1]);
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
        fechar();
        return;
      case 'Tab':
        // Fechar sem `preventDefault`: o Tab segue para o controle seguinte, e o
        // foco não deve voltar ao gatilho que a pessoa está deixando.
        fechar({ devolverFocus: false });
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
        const lista = habilitadas();
        if (lista.length) destacar(lista[0]);
        return;
      }
      case 'End': {
        e.preventDefault();
        const lista = habilitadas();
        if (lista.length) destacar(lista[lista.length - 1]);
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

  gatilho.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) fechar();
    else abrir();
  });

  function onClickOutside(e: MouseEvent): void {
    const alvo = e.target as Node;
    if (!posicionador?.contains(alvo) && !gatilho.contains(alvo)) {
      // O foco fica onde a pessoa o pôs: puxá-lo de volta ao gatilho seria
      // roubá-lo do controle que ela acabou de clicar. Mesma decisão do popover.
      fechar({ devolverFocus: false });
    }
  }

  return tornarDestruivel(raiz, raiz, () => {
    if (isOpen) fechar({ devolverFocus: false });
    // O painel pode estar tocando a saída no instante em que a raiz sai do
    // documento: sem isto ele sobreviveria por cima do conteúdo seguinte, que é
    // exatamente o vazamento que a forma compartilhada de limpeza fechou.
    recolherOutput();
    clearSearch();
  });
}
