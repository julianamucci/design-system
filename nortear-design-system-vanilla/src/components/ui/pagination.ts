// ─── Pagination — Vanilla factory standalone ────────────────────────────────
//
// Visual: o CONTROLE é o botão (`.nds-button` com variante e tamanho), como nas
// outras quatro stacks; `.nds-pagination*` fica com o que é só da faixa — o
// landmark, a lista, as reticências, o recuo assimétrico dos direcionais e o
// rótulo textual que some em tela estreita.
//
// Até 2026-09-23 esta stack vestia `.nds-pagination-link` / `.nds-pagination-icon`,
// uma segunda implementação de botão que só ela emitia: ~70 das 190 linhas da
// folha compartilhada valiam para uma stack, e a tabela de tokens que as CINCO
// docs pages publicam nomeava aquela classe — descrevendo a realidade de uma
// para leitores de todas.
//
// Desde 2026-09-23 esta fábrica é também o RODAPÉ do DataTable: `showPages:
// false` tira a régua, `showFirstLast` põe os saltos nas pontas e `appearance`
// escolhe a variante dos controles não ativos. Os três eixos existem porque
// havia duas paginações no sistema com a mesma aparência e semânticas
// diferentes — só uma delas era landmark, e não era a que a tabela usava.
//
// A TAG do controle segue a ROTA: com `hrefForPage` ele é `<a href>`, sem ela é
// `<button type="button">`. Até aqui era sempre âncora, e sem rota ela nascia
// `href="#"` — promessa de ida que não existe, anunciada como link e anulada no
// clique. Quem muda com a tag é o estado desabilitado; ver `makeDirecional`.

import { cn } from '@/lib/utils';
import { btnClass } from '@/components/ui/button';

export type PaginationOptions = {
  total: number;
  current: number;
  /**
   * Avisado quando outra página é pedida.
   *
   * Continua sendo chamado com `hrefForPage`: é por ele que passam a analítica
   * e o estado da tela. Opcional porque uma paginação inteiramente de rota não
   * precisa de mais nada além dos endereços.
   */
  onPageChange?: (page: number) => void;
  /**
   * Endereço real de cada página.
   *
   * É ele que decide a TAG do controle. Com ele cada controle é `<a href>`: um
   * destino de verdade, que abre em nova aba e é indexável, e o clique SEGUE —
   * quem usa roteador de cliente o intercepta como faria com qualquer link da
   * página. Sem ele o controle é `<button type="button">`, porque âncora vazia
   * que age na própria página engana quem navega por teclado e por leitor de
   * tela.
   *
   *     createPagination({ …, hrefForPage: (p) => `?page=${p}` })
   */
  hrefForPage?: (page: number) => string;
  showPrevNext?: boolean;
  /**
   * Primeira/última página, nas PONTAS da faixa.
   *
   * Quando verdadeira, entram dois controles de duplo chevron — antes do
   * anterior e depois do próximo —, com `data-slot="pagination-first"` e
   * `"pagination-last"`. Padrão `false`: a faixa numerada já oferece o 1 e o
   * último número, e o salto só vira necessário quando os números somem.
   */
  showFirstLast?: boolean;
  /**
   * A régua numerada.
   *
   * Com `false` a faixa não renderiza número nem reticência, e sobram os
   * direcionais — é a forma do rodapé de tabela, onde quem diz em que página se
   * está é o "Página X de Y" ao lado.
   */
  showPages?: boolean;
  /**
   * Aparência dos controles NÃO ativos. Padrão `ghost`.
   *
   * A página atual continua `outline` sempre: é ela que o realce existe para
   * marcar, e deixá-la seguir o eixo apagaria a marcação justamente quando a
   * faixa inteira fosse `outline`. Com `showPages: false` não há controle
   * ativo, então no rodapé de tabela a regra não compete.
   *
   * Não se resolve por `class`: a lista de `btnClass` já traz uma variante, e
   * quem chega depois pelo `cn` não desfaz a que veio antes.
   */
  appearance?: 'ghost' | 'outline';
  /** Nome acessível do landmark. Padrão: `Paginação`. */
  'aria-label'?: string;
  /** @deprecated Apelido de `aria-label`. */
  label?: string;
  /**
   * Alinhamento da faixa. Sem valor, ela ocupa a linha inteira e fica centrada;
   * `start`/`end` a encolhem e a encostam na ponta — o caso do rodapé de tabela.
   */
  align?: 'start' | 'end';
  class?: string;
  /**
   * Textos dos CONTROLES, parcial — o que não vier usa
   * `PAGINATION_LABELS_DEFAULT`.
   *
   *     createPagination({ …, labels: { previousText: 'Previous' } })
   *
   * Até 2026-09-23 os rótulos eram constante de módulo em pt-BR sem caminho de
   * override, e só o nome do landmark aceitava valor de fora: nas páginas `en`
   * e `es` o leitor de tela anunciava "Ir para a página anterior" em português,
   * enquanto as outras quatro stacks recebiam os rótulos de quem chama e
   * traduziam. Aqui o vanilla não era a referência que expõe o contrato — era a
   * stack menos capaz, e o resultado era texto na língua errada.
   */
  labels?: Partial<PaginationLabels>;
};

/**
 * Textos dos controles da faixa.
 *
 * `navigation`, `previous`, `next` e `page` são NOME ACESSÍVEL; `previousText`
 * e `nextText` são o texto VISÍVEL dos direcionais, que é outra coisa — o Do &
 * Don't desta página pede "Anterior" e "Próxima" por extenso, e
 * `.nds-pagination-label` já os esconde abaixo de 40rem, onde sobra o chevron.
 *
 * Catálogo de rótulo é REGRA e não implementação: nenhuma chave aqui precisa de
 * `HTMLElement` para existir. Ele mora nesta stack porque hoje existe só nela —
 * o molde é `docs/shared/primitives/data-table-labels.ts`, que subiu para
 * `docs/shared/` quando as cópias já eram quatro.
 */
export interface PaginationLabels {
  /** Nome acessível do landmark; `aria-label` na opção da fábrica vence. */
  navigation: string;
  /** Nome acessível do salto para a primeira página (`showFirstLast`). */
  first: string;
  previous: string;
  next: string;
  /** Nome acessível do salto para a última página (`showFirstLast`). */
  last: string;
  page: (n: number) => string;
  previousText: string;
  nextText: string;
}

/** Padrão em pt-BR — o idioma do componente sem configuração. */
export const PAGINATION_LABELS_DEFAULT: PaginationLabels = {
  navigation: 'Paginação',
  first: 'Ir para a primeira página',
  previous: 'Ir para a página anterior',
  next: 'Ir para a próxima página',
  last: 'Ir para a última página',
  page: (n) => `Ir para página ${n}`,
  previousText: 'Anterior',
  nextText: 'Próxima',
};

// ─── SVGs ──────────────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Chevron simples (passo) ou duplo (salto).
 *
 * Os traçados são os mesmos que o rodapé do DataTable já desenhava, e é por
 * isso que a tela não muda quando ele passa a compor esta fábrica.
 */
function createChevronSvg(direction: 'left' | 'right', double = false): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const paths = double
    ? direction === 'left'
      ? ['m11 17-5-5 5-5', 'm18 17-5-5 5-5']
      : ['m6 17 5-5-5-5', 'm13 17 5-5-5-5']
    : [direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'];
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getPages(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

// ─── createPagination ──────────────────────────────────────────────────────

export function createPagination(options: PaginationOptions): HTMLElement {
  const {
    total,
    current,
    onPageChange,
    hrefForPage,
    showPrevNext = true,
    showFirstLast = false,
    showPages = true,
    appearance = 'ghost',
    align,
  } = options;
  // Parcial: quem chama troca só o que quer, e o resto continua em pt-BR.
  const labels: PaginationLabels = { ...PAGINATION_LABELS_DEFAULT, ...options.labels };
  // `label` continua aceito como apelido do nome acessível; o canônico vence.
  const landmarkName = options['aria-label'] ?? options.label ?? labels.navigation;

  /**
   * A TAG do controle segue a rota.
   *
   * Com `hrefForPage` cada controle é `<a href>` — destino de verdade, abre em
   * nova aba, é indexável, e o clique SEGUE para o roteador de cliente. Sem
   * rota não há endereço nenhum a oferecer, e `<a href="#">` seria uma promessa
   * falsa: o leitor de tela anuncia "link", o teclado promete uma ida, e o que
   * acontece é uma ação na própria página. Aí o controle é botão.
   */
  const routed = hrefForPage !== undefined;

  /** `<a>` quando há rota, `<button type="button">` quando não há. */
  function createControl(): HTMLAnchorElement | HTMLButtonElement {
    if (routed) return document.createElement('a');
    const button = document.createElement('button');
    // Sem `type` explícito o botão é `submit` e envia o formulário que o
    // cercar — a faixa costuma viver dentro de um, em filtro de tabela.
    button.type = 'button';
    return button;
  }

  const nav = document.createElement('nav');
  nav.dataset.slot = 'pagination';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', landmarkName);
  if (align) nav.dataset.align = align;
  nav.className = cn('nds-pagination', options.class);

  const ul = document.createElement('ul');
  ul.dataset.slot = 'pagination-content';
  ul.className = 'nds-pagination-list';

  function addItem(child: HTMLElement): void {
    const li = document.createElement('li');
    li.dataset.slot = 'pagination-item';
    li.appendChild(child);
    ul.appendChild(li);
  }

  function makeLink(page: number, isCurrent: boolean): HTMLAnchorElement | HTMLButtonElement {
    const control = createControl();
    if (control instanceof HTMLAnchorElement) control.href = hrefForPage!(page);
    control.dataset.slot = 'pagination-link';
    // Mesma variante e mesmo tamanho das outras quatro: `outline` marca a
    // página atual, o item inativo segue o eixo de aparência, e o número vive
    // num quadrado.
    control.className = btnClass(isCurrent ? 'outline' : appearance, 'icon');

    // Todo controle numerado tem rótulo com contexto — inclusive o da página
    // atual: "3" sozinho não diz nada em voz alta. Quem anuncia que é a página
    // atual é o `aria-current`, nativamente e em qualquer idioma.
    control.setAttribute('aria-label', labels.page(page));
    if (isCurrent) {
      control.setAttribute('aria-current', 'page');
      control.dataset.active = 'true';
    }

    control.textContent = String(page);

    // Nada a anular: o botão não tem ação padrão, e a âncora só existe quando
    // há endereço real — anular ali apagaria o roteador de cliente junto.
    control.addEventListener('click', () => {
      if (!isCurrent) onPageChange?.(page);
    });
    return control;
  }

  /**
   * Controle direcional.
   *
   * O estado desabilitado tem DOIS mecanismos, um por tag, e os dois precisam
   * existir porque a tag segue a rota:
   *
   * - `<button>` — `disabled` nativo. Sai da tabulação, não dispara clique e é
   *   anunciado como indisponível pelo leitor de tela sem nenhum atributo ARIA.
   * - `<a>` — `aria-disabled="true"` MAIS `tabindex="-1"`, porque em âncora não
   *   existe `disabled`. `.nds-button[aria-disabled="true"]` barra o ponteiro, e
   *   sem o tabindex negativo o controle inerte fica na ordem de tabulação.
   */
  function makeDirecional(spec: {
    direction: 'left' | 'right';
    /** Duplo chevron: o controle SALTA para a ponta em vez de andar um passo. */
    double?: boolean;
    label: string;
    /** Texto visível ao lado do chevron. Vazio deixa o controle só de ícone. */
    text?: string;
    slot: string;
    disabled: boolean;
    destination: number;
    onClick: () => void;
  }): HTMLAnchorElement | HTMLButtonElement {
    const { direction, double = false, label, text = '', slot, disabled, destination, onClick } = spec;
    const control = createControl();
    control.dataset.slot = slot;
    control.setAttribute('aria-label', label);
    // Sem texto visível o direcional é um controle SÓ DE ÍCONE, e então ele é
    // quadrado como o numerado — `nds-button-icon`. O recuo assimétrico de
    // `.nds-pagination-prev` / `-next` existe para abrir espaço ENTRE o chevron
    // e a palavra ao lado; num quadrado ele só desalinharia o ícone.
    //
    // As duas classes só valem ACOMPANHADAS de `.nds-button`: sozinhas são
    // (0,1,0) e perdem para `.nds-button:has(> svg)`, que é (0,1,1) e declara o
    // respiro lateral do botão com ícone. `btnClass` põe a base.
    control.className = text
      ? cn(
          btnClass(appearance),
          direction === 'left' ? 'nds-pagination-prev' : 'nds-pagination-next',
        )
      : btnClass(appearance, 'icon');
    if (control instanceof HTMLAnchorElement) {
      // Nos extremos o controle não leva a lugar nenhum: `#` ali é honesto, e um
      // endereço válido convidaria a abrir em nova aba uma página que não existe.
      control.href = disabled ? '#' : hrefForPage!(destination);
      if (disabled) {
        control.setAttribute('aria-disabled', 'true');
        control.tabIndex = -1;
      }
    } else if (disabled) {
      control.disabled = true;
    }
    const icon = createChevronSvg(direction, double);
    icon.setAttribute('data-icon', direction === 'left' ? 'inline-start' : 'inline-end');
    if (text) {
      const caption = document.createElement('span');
      caption.className = 'nds-pagination-label';
      caption.textContent = text;
      // O ícone fica do lado para onde o controle leva.
      if (direction === 'left') control.append(icon, caption);
      else control.append(caption, icon);
    } else {
      // Rótulo vazio não vira `<span>` vazio: `.nds-pagination-label` é `block`
      // acima de 40rem, e um bloco sem texto ainda ocupa uma linha inteira
      // dentro do botão — o quadrado deixaria de ser quadrado. Quem nomeia o
      // controle aqui é o `aria-label`, que já está posto.
      control.appendChild(icon);
    }
    control.addEventListener('click', (e) => {
      // A guarda é do caminho de ÂNCORA, e só dele. Em `<a>` não existe
      // `disabled`: sem ela o Enter do teclado e o clique vindo de script ainda
      // chamariam quem consome. No `<button>` quem barra é o atributo nativo, e
      // uma guarda ali seria um SEGUNDO mecanismo para o mesmo estado — pior,
      // era ela que sustentava a asserção da story, ou seja, a asserção ditando
      // o código de produção. Quem prova o extremo do botão é
      // `elemento.click()`, que o navegador não dispara em controle de
      // formulário desabilitado.
      if (disabled && control instanceof HTMLAnchorElement) {
        e.preventDefault();
        return;
      }
      onClick();
    });
    return control;
  }

  // First — fora do `showPrevNext` de propósito: são eixos independentes, e o
  // rodapé de tabela mostra os quatro sem régua.
  if (showFirstLast) {
    addItem(
      makeDirecional({
        direction: 'left',
        double: true,
        label: labels.first,
        slot: 'pagination-first',
        disabled: current <= 1,
        destination: 1,
        onClick: () => onPageChange?.(1),
      }),
    );
  }

  // Prev
  if (showPrevNext) {
    addItem(
      makeDirecional({
        direction: 'left',
        label: labels.previous,
        text: labels.previousText,
        slot: 'pagination-previous',
        disabled: current <= 1,
        destination: current - 1,
        onClick: () => onPageChange?.(current - 1),
      }),
    );
  }

  // Pages
  if (showPages) {
    const pages = getPages(total, current);
    for (const page of pages) {
      if (page === 'ellipsis') {
        const span = document.createElement('span');
        span.dataset.slot = 'pagination-ellipsis';
        span.className = 'nds-pagination-ellipsis';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = '…';
        const li = document.createElement('li');
        li.dataset.slot = 'pagination-item';
        li.appendChild(span);
        ul.appendChild(li);
      } else {
        addItem(makeLink(page, page === current));
      }
    }
  }

  // Next
  if (showPrevNext) {
    addItem(
      makeDirecional({
        direction: 'right',
        label: labels.next,
        text: labels.nextText,
        slot: 'pagination-next',
        disabled: current >= total,
        destination: current + 1,
        onClick: () => onPageChange?.(current + 1),
      }),
    );
  }

  // Last
  if (showFirstLast) {
    addItem(
      makeDirecional({
        direction: 'right',
        double: true,
        label: labels.last,
        slot: 'pagination-last',
        disabled: current >= total,
        destination: total,
        onClick: () => onPageChange?.(total),
      }),
    );
  }

  nav.appendChild(ul);
  return nav;
}
