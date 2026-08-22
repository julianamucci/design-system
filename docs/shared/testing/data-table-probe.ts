/**
 * Sonda de comparação do DataTable entre as cinco stacks.
 *
 * Um componente com ordenação, filtro, seleção, edição e paginação tem
 * superfície demais para ser comparado a olho: cada rodada anterior corrigia o
 * defeito relatado e deixava os vizinhos de pé. Aqui a medição é uma só, roda
 * nas cinco e devolve o mesmo registro, então a divergência aparece como
 * diferença de VALOR e não como impressão de quem olha.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` compartilhado. Onde o
 * contrato não é cumprido o campo vem `null` — e isso É o achado, não uma falha
 * da medição.
 *
 * Armadilhas já tropeçadas e evitadas aqui:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbe`.
 *   - atributo de presença casa valor `"false"`: use `[attr]:not([attr="false"])`.
 *   - divergência de NOME de classe entre stacks faz o seletor não casar e o
 *     campo vir `null`. Onde há duas formas conhecidas, as duas são aceitas e
 *     `familiaDeClasses` registra qual casou.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BoxMeasurement {
  largura: number;
  altura: number;
  background: string;
  cor: string;
  padding: string;
  gap: string;
  alinhamentoDeTexto: string;
  pesoDaFonte: string;
  varianteNumerica: string;
  alturaDeLinha: string;
  tamanhoDaFonte: string;
  raio: number;
}

export interface ClickReach {
  finding: boolean;
  clickable: boolean;
  porCima: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function caixa(el: Element | null | undefined): BoxMeasurement | null {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    largura: Math.round(r.width),
    altura: Math.round(r.height),
    background: cs.backgroundColor,
    cor: cs.color,
    padding: cs.padding,
    gap: cs.gap,
    alinhamentoDeTexto: cs.textAlign,
    pesoDaFonte: cs.fontWeight,
    varianteNumerica: cs.fontVariantNumeric,
    alturaDeLinha: cs.lineHeight,
    tamanhoDaFonte: cs.fontSize,
    raio: Math.round(parseFloat(cs.borderTopLeftRadius) || 0),
  };
}

function descreve(el: Element | null | undefined): string | null {
  if (!el) return null;
  const classes = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
  return `${el.tagName.toLowerCase()}${classes.length ? '.' + classes.join('.') : ''}`;
}

function reach(el: Element | null | undefined): ClickReach {
  if (!el) return { finding: false, clickable: false, porCima: null };
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { finding: true, clickable: false, porCima: 'sem-caixa' };
  const noTopo = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const clickable = noTopo === el || el.contains(noTopo);
  return { finding: true, clickable, porCima: clickable ? null : descreve(noTopo) };
}

/**
 * Nome acessível de um controle, pela ordem que o leitor usa.
 *
 * Existe porque `aria-label` ausente não é o único jeito de um campo ficar sem
 * nome — e porque "tem aria-label" é uma pergunta diferente de "tem nome".
 */
function accessibleName(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const alvo = el.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const labelInside = el.closest('label');
  if (labelInside?.textContent?.trim()) return labelInside.textContent.trim();
  const titulo = el.getAttribute('title');
  if (titulo?.trim()) return titulo.trim();
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return null;
  return el.textContent?.trim().replace(/\s+/g, ' ') || null;
}

/** Nome acessível de uma `<table>`: caption, aria-label ou aria-labelledby. */
function tableName(tabela: Element | null): string | null {
  if (!tabela) return null;
  const rotulo = tabela.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const labelled = tabela.getAttribute('aria-labelledby');
  if (labelled) {
    const alvo = tabela.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const legenda = tabela.querySelector('caption');
  return legenda?.textContent?.trim() || null;
}

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

/** Compõe uma cor sobre o ancestral opaco — `backgroundColor` com alfa mente. */
function backgroundEffective(el: Element | null): string | null {
  let atual: Element | null = el;
  while (atual) {
    const cor = getComputedStyle(atual).backgroundColor;
    const m = /rgba?\(([^)]+)\)/.exec(cor);
    if (m) {
      const partes = m[1].split(',').map((p) => parseFloat(p));
      if ((partes[3] ?? 1) > 0.99) return cor;
    }
    atual = atual.parentElement;
  }
  return null;
}

function luminancia(cor: string): number | null {
  const m = /rgba?\(([^)]+)\)/.exec(cor);
  if (!m) return null;
  const [r, g, b] = m[1].split(',').map((p) => parseFloat(p) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Razão WCAG entre o texto do elemento e o primeiro fundo opaco acima dele. */
export function contraste(el: Element | null): { ratio: number; frente: string; background: string } | null {
  if (!el) return null;
  const frente = getComputedStyle(el).color;
  const background = backgroundEffective(el);
  if (!background) return null;
  const a = luminancia(frente);
  const b = luminancia(background);
  if (a === null || b === null) return null;
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return { ratio: Math.round(ratio * 100) / 100, frente, background };
}

// ─── Rolagem ──────────────────────────────────────────────────────────────────

export interface ScrollCamada {
  /** Nome legível da camada, para a mensagem de falha dizer QUEM está errado. */
  nome: string;
  finding: boolean;
  overflowX: string;
  /** `-1` quando o elemento não está na ordem de tabulação. */
  tabIndex: number;
  /** `true` quando o conteúdo é mais largo que a caixa — só aí a rolagem existe. */
  transborda: boolean;
}

export interface ScrollMeasurement {
  externo: ScrollCamada;
  interno: ScrollCamada;
  /** Camadas com `overflow-x: auto|scroll` — tem de ser exatamente uma. */
  camadasRolaveis: string[];
  /** Camadas roláveis que NÃO estão na ordem de tabulação (WCAG 2.1.1). */
  rolaveisForaDoTeclado: string[];
}

/**
 * Quem rola a tabela na horizontal, e se está ao alcance do teclado.
 *
 * Mede o ESTILO COMPUTADO, não a presença de classe: classe morta não protege
 * nada, e foi exatamente uma classe (`.nds-data-table-table-wrapper`) que
 * neutralizava o contêiner alcançável e empurrava a rolagem para o que não é.
 *
 * O contrato é: exatamente uma camada rola, e ela está na ordem de tabulação.
 */
export function measureScroll(raiz: HTMLElement): ScrollMeasurement {
  const camada = (nome: string, el: Element | null): ScrollCamada => {
    if (!el) return { nome, finding: false, overflowX: 'ausente', tabIndex: -1, transborda: false };
    const cs = getComputedStyle(el);
    return {
      nome,
      finding: true,
      overflowX: cs.overflowX,
      tabIndex: (el as HTMLElement).tabIndex,
      transborda: el.scrollWidth > el.clientWidth,
    };
  };

  const alvo = raiz.matches('.nds-data-table') ? raiz : (raiz.querySelector<HTMLElement>('.nds-data-table') ?? raiz);
  const externo = camada('nds-data-table-scroll', alvo.querySelector('.nds-data-table-scroll'));
  const interno = camada(
    'nds-table-wrapper',
    alvo.querySelector('[data-slot="table-container"]') ?? alvo.querySelector('.nds-table-wrapper'),
  );

  const scrollable = (c: ScrollCamada) => c.finding && (c.overflowX === 'auto' || c.overflowX === 'scroll');
  const camadas = [externo, interno];
  return {
    externo,
    interno,
    camadasRolaveis: camadas.filter(scrollable).map((c) => c.nome),
    rolaveisForaDoTeclado: camadas.filter((c) => scrollable(c) && c.tabIndex < 0).map((c) => c.nome),
  };
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/**
 * Mede UMA tabela. `raiz` é o `.nds-data-table` (ou o contêiner que o envolve).
 */
export function measureTable(raiz: HTMLElement) {
  const um = (sel: string) => raiz.querySelector(sel);
  const todos = (sel: string) => Array.from(raiz.querySelectorAll(sel));
  const conta = (sel: string) => raiz.querySelectorAll(sel).length;

  const tabela = um('table');
  const search = um('.nds-data-table-search-input') ?? um('input[type="search"]');
  const ordenarButton = um('.nds-data-table-sort-btn');
  const thOrdenavel = ordenarButton?.closest('th') ?? null;

  const selectionBoxes = todos('[role="checkbox"], input[type="checkbox"]');
  const allBox = raiz.querySelector('thead')?.querySelector('[role="checkbox"], input[type="checkbox"]') ?? null;
  const lineBoxes = Array.from(
    raiz.querySelector('tbody')?.querySelectorAll('[role="checkbox"], input[type="checkbox"]') ?? [],
  );

  const linhas = todos('tbody tr').filter((tr) => !tr.hasAttribute('aria-hidden'));
  const lineSelecionada = um('tbody tr[data-state="selected"]');
  const lineNormal = linhas.find((tr) => tr.getAttribute('data-state') !== 'selected') ?? null;

  const regiaoViva = um('[role="status"], [aria-live]');

  const pageButtons = todos('.nds-data-table-pagination-nav button');
  const sizeSelector = um('.nds-data-table-page-size-select');

  const textFilter = um('.nds-data-table-filter-input');
  const selectFilter = um('.nds-data-table-filter-select');
  const filtersLine =
    um('.nds-data-table-filter-row') ?? (textFilter?.closest('tr') ?? selectFilter?.closest('tr') ?? null);
  const filterTh = textFilter?.closest('th') ?? selectFilter?.closest('th') ?? null;

  const editButton = um('.nds-data-table-edit-btn');
  const editField = um('.nds-data-table-edit-input');

  const vazio = um('.nds-data-table-empty');

  // Última célula da primeira linha: é a coluna de dinheiro nas cinco stacks.
  const cellNumerica = linhas[0]?.querySelector('td:last-child') ?? null;
  const contentNumerico = (cellNumerica?.firstElementChild as HTMLElement | null) ?? cellNumerica;
  const thNumerico = todos('thead tr:first-child th').slice(-1)[0] ?? null;

  return {
    estrutura: {
      raiz: descreve(raiz.matches('.nds-data-table') ? raiz : um('.nds-data-table')),
      slotDaRaiz: (um('.nds-data-table') ?? raiz).getAttribute('data-slot'),
      tabela: descreve(tabela),
      slotDaTabela: tabela?.getAttribute('data-slot') ?? null,
      contagens: {
        toolbar: conta('.nds-data-table-toolbar'),
        search: conta('.nds-data-table-search'),
        searchField: conta('.nds-data-table-search-input'),
        botaoDeColunas: conta('.nds-data-table-columns-btn'),
        scroll: conta('.nds-data-table-scroll'),
        wrapperDoPrimitivo: conta('.nds-table-wrapper'),
        tabelaFixa: conta('.nds-table-fixed'),
        th: conta('.nds-data-table-th'),
        thInner: conta('.nds-data-table-th-inner'),
        thLabel: conta('.nds-data-table-th-label'),
        ordenarButton: conta('.nds-data-table-sort-btn'),
        filtersLine: conta('.nds-data-table-filter-row'),
        textFilter: conta('.nds-data-table-filter-input'),
        selectFilter: conta('.nds-data-table-filter-select'),
        tr: conta('.nds-data-table-tr'),
        td: conta('.nds-data-table-td'),
        vazio: conta('.nds-data-table-empty'),
        editavel: conta('.nds-data-table-editable'),
        editButton: conta('.nds-data-table-edit-btn'),
        editField: conta('.nds-data-table-edit-input'),
        pagination: conta('.nds-data-table-pagination'),
        contagemDaPaginacao: conta('.nds-data-table-pagination-count'),
        sizeSelector: conta('.nds-data-table-page-size-select'),
        navigation: conta('.nds-data-table-pagination-nav'),
        alcaDeRedimensionar: conta('.nds-data-table-resize-handle'),
        somenteLeitor: conta('.nds-sr-only'),
        // Classes que só uma parte das stacks emite — a contagem denuncia quem.
        menuDeColunasRowForaDoMenu: Array.from(
          raiz.querySelectorAll('.nds-data-table-columns-menu-row'),
        ).filter((el) => !!el.closest('thead')).length,
      },
      linhasNoCorpo: linhas.length,
      colunasNoCabecalho: conta('thead tr:first-child th'),
      colspanDoVazio: vazio?.getAttribute('colspan') ?? null,
    },
    semantica: {
      tableName: tableName(tabela),
      papelDaBusca: search?.getAttribute('role') ?? (search?.getAttribute('type') === 'search' ? 'searchbox' : null),
      tipoDaBusca: search?.getAttribute('type') ?? null,
      nomeDaBusca: accessibleName(search),
      placeholderDaBusca: search?.getAttribute('placeholder') ?? null,
      scopeDoTh: thOrdenavel?.getAttribute('scope') ?? null,
      ariaSortNaoOrdenada: thOrdenavel?.getAttribute('aria-sort') ?? null,
      ariaSortNoBotao: ordenarButton?.getAttribute('aria-sort') ?? null,
      nomeDoBotaoDeOrdenar: accessibleName(ordenarButton),
      // Coluna não ordenável: promete ordenação que não existe?
      ariaSortEmColunaFixa: (() => {
        const th = todos('thead tr:first-child th').find((c) => !c.querySelector('.nds-data-table-sort-btn'));
        return th ? (th.hasAttribute('aria-sort') ? th.getAttribute('aria-sort') : 'ausente') : null;
      })(),
      tagDoCheckbox: selectionBoxes[0]?.tagName.toLowerCase() ?? null,
      papelDoCheckbox: selectionBoxes[0]?.getAttribute('role') ?? null,
      nomeDoCheckboxDeTudo: accessibleName(allBox),
      estadoDoCheckboxDeTudo: allBox?.getAttribute('aria-checked') ?? null,
      nomesDasLinhas: lineBoxes.slice(0, 3).map((c) => accessibleName(c)),
      nomesDeLinhaDistintos: new Set(lineBoxes.map((c) => accessibleName(c))).size,
      totalDeCheckboxesDeLinha: lineBoxes.length,
      regiaoViva: regiaoViva
        ? {
            papel: regiaoViva.getAttribute('role'),
            ariaLive: regiaoViva.getAttribute('aria-live'),
            classe: regiaoViva.getAttribute('class'),
            texto: texto(regiaoViva),
          }
        : null,
      nomesDaPaginacao: pageButtons.map((b) => accessibleName(b)),
      estadoDaPaginacao: pageButtons.map((b) => (b as HTMLButtonElement).disabled),
      textoDoIndicador: texto(todos('.nds-data-table-pagination-count').slice(-1)[0]),
      contagemText: texto(todos('.nds-data-table-pagination-count')[0]),
      nomeDoSeletorDeTamanho: accessibleName(sizeSelector),
      nomeDoFiltroDeTexto: accessibleName(textFilter),
      nomeDoFiltroDeSelect: accessibleName(selectFilter),
      textoSemFiltro: (() => {
        const th = filtersLine
          ? Array.from(filtersLine.querySelectorAll('th')).find(
              (c) => !c.querySelector('input, select'),
            )
          : null;
        return th ? texto(th.querySelector('.nds-sr-only')) ?? th.getAttribute('aria-label') : null;
      })(),
      nomeDoBotaoDeEdicao: accessibleName(editButton),
      nomeDoCampoDeEdicao: accessibleName(editField),
      textoDoVazio: texto(vazio),
      pinadoNoTh: um('thead th.nds-data-table-th-pinned') ? 'th-pinned' : um('thead th.nds-data-table-td-pinned') ? 'td-pinned' : null,
      pinadoNoTd: um('tbody td.nds-data-table-td-pinned') ? 'td-pinned' : um('tbody td.nds-data-table-th-pinned') ? 'th-pinned' : null,
    },
    geometria: {
      larguraDaRaiz: Math.round(raiz.getBoundingClientRect().width),
      th: caixa(thOrdenavel),
      thInner: caixa(um('.nds-data-table-th-inner') ?? ordenarButton?.parentElement),
      td: caixa(linhas[0]?.querySelector('td:nth-child(2)')),
      filterTh: caixa(filterTh),
      filtersLine: caixa(filtersLine),
      editButton: caixa(editButton),
      editField: caixa(editField),
      celulaVazia: caixa(vazio),
      ordenarButton: caixa(ordenarButton),
    },
    states: {
      lineSelecionada: lineSelecionada
        ? { dataState: lineSelecionada.getAttribute('data-state'), background: getComputedStyle(lineSelecionada).backgroundColor }
        : null,
      lineNormal: lineNormal ? { background: getComputedStyle(lineNormal).backgroundColor } : null,
      cellNumerica: caixa(cellNumerica),
      contentNumerico: caixa(contentNumerico),
      classeDoConteudoNumerico: contentNumerico?.getAttribute('class') ?? null,
      cabecalhoNumerico: caixa(thNumerico),
    },
    contraste: {
      celulaVazia: contraste(vazio),
      contagem: contraste(um('.nds-data-table-pagination-count')),
      header: contraste(thOrdenavel),
    },
    clickReach: {
      checkboxDeTudo: reach(allBox),
      ordenarButton: reach(ordenarButton),
      primeiraPagina: reach(pageButtons[0]),
      editButton: reach(editButton),
    },
  };
}

/**
 * Mede todas as tabelas marcadas com `data-sonda="<cenario>"` dentro de `raiz`.
 * Cenário sem tabela vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureDataTable(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? measureTable(alvo) : null;
  }
  return registro;
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest. A
 * mensagem de erro chega — é o único canal de saída disponível daqui.
 */
export function reportProbe(stack: string, raiz: HTMLElement, cenarios: string[]) {
  throw new Error(`SONDA::${stack}::${JSON.stringify(measureDataTable(raiz, cenarios))}`);
}
