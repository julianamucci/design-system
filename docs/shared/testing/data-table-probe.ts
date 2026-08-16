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
 *     da play). O canal é a exceção — ver `reportarSonda`.
 *   - atributo de presença casa valor `"false"`: use `[attr]:not([attr="false"])`.
 *   - divergência de NOME de classe entre stacks faz o seletor não casar e o
 *     campo vir `null`. Onde há duas formas conhecidas, as duas são aceitas e
 *     `familiaDeClasses` registra qual casou.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CaixaMedida {
  largura: number;
  altura: number;
  fundo: string;
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

export interface AlcanceDoClique {
  achado: boolean;
  clicavel: boolean;
  porCima: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function caixa(el: Element | null | undefined): CaixaMedida | null {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    largura: Math.round(r.width),
    altura: Math.round(r.height),
    fundo: cs.backgroundColor,
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

function alcance(el: Element | null | undefined): AlcanceDoClique {
  if (!el) return { achado: false, clicavel: false, porCima: null };
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return { achado: true, clicavel: false, porCima: 'sem-caixa' };
  const noTopo = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const clicavel = noTopo === el || el.contains(noTopo);
  return { achado: true, clicavel, porCima: clicavel ? null : descreve(noTopo) };
}

/**
 * Nome acessível de um controle, pela ordem que o leitor usa.
 *
 * Existe porque `aria-label` ausente não é o único jeito de um campo ficar sem
 * nome — e porque "tem aria-label" é uma pergunta diferente de "tem nome".
 */
function nomeAcessivel(el: Element | null | undefined): string | null {
  if (!el) return null;
  const rotulado = el.getAttribute('aria-labelledby');
  if (rotulado) {
    const alvo = el.ownerDocument.getElementById(rotulado.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const rotulo = el.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const dentroDeLabel = el.closest('label');
  if (dentroDeLabel?.textContent?.trim()) return dentroDeLabel.textContent.trim();
  const titulo = el.getAttribute('title');
  if (titulo?.trim()) return titulo.trim();
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return null;
  return el.textContent?.trim().replace(/\s+/g, ' ') || null;
}

/** Nome acessível de uma `<table>`: caption, aria-label ou aria-labelledby. */
function nomeDaTabela(tabela: Element | null): string | null {
  if (!tabela) return null;
  const rotulo = tabela.getAttribute('aria-label');
  if (rotulo?.trim()) return rotulo.trim();
  const rotulado = tabela.getAttribute('aria-labelledby');
  if (rotulado) {
    const alvo = tabela.ownerDocument.getElementById(rotulado.split(/\s+/)[0]);
    if (alvo?.textContent?.trim()) return alvo.textContent.trim();
  }
  const legenda = tabela.querySelector('caption');
  return legenda?.textContent?.trim() || null;
}

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

/** Compõe uma cor sobre o ancestral opaco — `backgroundColor` com alfa mente. */
function fundoEfetivo(el: Element | null): string | null {
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
export function contraste(el: Element | null): { razao: number; frente: string; fundo: string } | null {
  if (!el) return null;
  const frente = getComputedStyle(el).color;
  const fundo = fundoEfetivo(el);
  if (!fundo) return null;
  const a = luminancia(frente);
  const b = luminancia(fundo);
  if (a === null || b === null) return null;
  const razao = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return { razao: Math.round(razao * 100) / 100, frente, fundo };
}

// ─── Rolagem ──────────────────────────────────────────────────────────────────

export interface CamadaDeRolagem {
  /** Nome legível da camada, para a mensagem de falha dizer QUEM está errado. */
  nome: string;
  achado: boolean;
  overflowX: string;
  /** `-1` quando o elemento não está na ordem de tabulação. */
  tabIndex: number;
  /** `true` quando o conteúdo é mais largo que a caixa — só aí a rolagem existe. */
  transborda: boolean;
}

export interface MedidaDeRolagem {
  externo: CamadaDeRolagem;
  interno: CamadaDeRolagem;
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
export function medirRolagem(raiz: HTMLElement): MedidaDeRolagem {
  const camada = (nome: string, el: Element | null): CamadaDeRolagem => {
    if (!el) return { nome, achado: false, overflowX: 'ausente', tabIndex: -1, transborda: false };
    const cs = getComputedStyle(el);
    return {
      nome,
      achado: true,
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

  const rolavel = (c: CamadaDeRolagem) => c.achado && (c.overflowX === 'auto' || c.overflowX === 'scroll');
  const camadas = [externo, interno];
  return {
    externo,
    interno,
    camadasRolaveis: camadas.filter(rolavel).map((c) => c.nome),
    rolaveisForaDoTeclado: camadas.filter((c) => rolavel(c) && c.tabIndex < 0).map((c) => c.nome),
  };
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/**
 * Mede UMA tabela. `raiz` é o `.nds-data-table` (ou o contêiner que o envolve).
 */
export function medirTabela(raiz: HTMLElement) {
  const um = (sel: string) => raiz.querySelector(sel);
  const todos = (sel: string) => Array.from(raiz.querySelectorAll(sel));
  const conta = (sel: string) => raiz.querySelectorAll(sel).length;

  const tabela = um('table');
  const busca = um('.nds-data-table-search-input') ?? um('input[type="search"]');
  const botaoDeOrdenar = um('.nds-data-table-sort-btn');
  const thOrdenavel = botaoDeOrdenar?.closest('th') ?? null;

  const caixasDeSelecao = todos('[role="checkbox"], input[type="checkbox"]');
  const caixaDeTudo = raiz.querySelector('thead')?.querySelector('[role="checkbox"], input[type="checkbox"]') ?? null;
  const caixasDeLinha = Array.from(
    raiz.querySelector('tbody')?.querySelectorAll('[role="checkbox"], input[type="checkbox"]') ?? [],
  );

  const linhas = todos('tbody tr').filter((tr) => !tr.hasAttribute('aria-hidden'));
  const linhaSelecionada = um('tbody tr[data-state="selected"]');
  const linhaNormal = linhas.find((tr) => tr.getAttribute('data-state') !== 'selected') ?? null;

  const regiaoViva = um('[role="status"], [aria-live]');

  const botoesDePagina = todos('.nds-data-table-pagination-nav button');
  const seletorDeTamanho = um('.nds-data-table-page-size-select');

  const filtroDeTexto = um('.nds-data-table-filter-input');
  const filtroDeSelect = um('.nds-data-table-filter-select');
  const linhaDeFiltros =
    um('.nds-data-table-filter-row') ?? (filtroDeTexto?.closest('tr') ?? filtroDeSelect?.closest('tr') ?? null);
  const thDeFiltro = filtroDeTexto?.closest('th') ?? filtroDeSelect?.closest('th') ?? null;

  const botaoDeEdicao = um('.nds-data-table-edit-btn');
  const campoDeEdicao = um('.nds-data-table-edit-input');

  const vazio = um('.nds-data-table-empty');

  // Última célula da primeira linha: é a coluna de dinheiro nas cinco stacks.
  const celulaNumerica = linhas[0]?.querySelector('td:last-child') ?? null;
  const conteudoNumerico = (celulaNumerica?.firstElementChild as HTMLElement | null) ?? celulaNumerica;
  const thNumerico = todos('thead tr:first-child th').slice(-1)[0] ?? null;

  return {
    estrutura: {
      raiz: descreve(raiz.matches('.nds-data-table') ? raiz : um('.nds-data-table')),
      slotDaRaiz: (um('.nds-data-table') ?? raiz).getAttribute('data-slot'),
      tabela: descreve(tabela),
      slotDaTabela: tabela?.getAttribute('data-slot') ?? null,
      contagens: {
        toolbar: conta('.nds-data-table-toolbar'),
        busca: conta('.nds-data-table-search'),
        campoDeBusca: conta('.nds-data-table-search-input'),
        botaoDeColunas: conta('.nds-data-table-columns-btn'),
        scroll: conta('.nds-data-table-scroll'),
        wrapperDoPrimitivo: conta('.nds-table-wrapper'),
        tabelaFixa: conta('.nds-table-fixed'),
        th: conta('.nds-data-table-th'),
        thInner: conta('.nds-data-table-th-inner'),
        thLabel: conta('.nds-data-table-th-label'),
        botaoDeOrdenar: conta('.nds-data-table-sort-btn'),
        linhaDeFiltros: conta('.nds-data-table-filter-row'),
        filtroDeTexto: conta('.nds-data-table-filter-input'),
        filtroDeSelect: conta('.nds-data-table-filter-select'),
        tr: conta('.nds-data-table-tr'),
        td: conta('.nds-data-table-td'),
        vazio: conta('.nds-data-table-empty'),
        editavel: conta('.nds-data-table-editable'),
        botaoDeEdicao: conta('.nds-data-table-edit-btn'),
        campoDeEdicao: conta('.nds-data-table-edit-input'),
        paginacao: conta('.nds-data-table-pagination'),
        contagemDaPaginacao: conta('.nds-data-table-pagination-count'),
        seletorDeTamanho: conta('.nds-data-table-page-size-select'),
        navegacao: conta('.nds-data-table-pagination-nav'),
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
      nomeDaTabela: nomeDaTabela(tabela),
      papelDaBusca: busca?.getAttribute('role') ?? (busca?.getAttribute('type') === 'search' ? 'searchbox' : null),
      tipoDaBusca: busca?.getAttribute('type') ?? null,
      nomeDaBusca: nomeAcessivel(busca),
      placeholderDaBusca: busca?.getAttribute('placeholder') ?? null,
      scopeDoTh: thOrdenavel?.getAttribute('scope') ?? null,
      ariaSortNaoOrdenada: thOrdenavel?.getAttribute('aria-sort') ?? null,
      ariaSortNoBotao: botaoDeOrdenar?.getAttribute('aria-sort') ?? null,
      nomeDoBotaoDeOrdenar: nomeAcessivel(botaoDeOrdenar),
      // Coluna não ordenável: promete ordenação que não existe?
      ariaSortEmColunaFixa: (() => {
        const th = todos('thead tr:first-child th').find((c) => !c.querySelector('.nds-data-table-sort-btn'));
        return th ? (th.hasAttribute('aria-sort') ? th.getAttribute('aria-sort') : 'ausente') : null;
      })(),
      tagDoCheckbox: caixasDeSelecao[0]?.tagName.toLowerCase() ?? null,
      papelDoCheckbox: caixasDeSelecao[0]?.getAttribute('role') ?? null,
      nomeDoCheckboxDeTudo: nomeAcessivel(caixaDeTudo),
      estadoDoCheckboxDeTudo: caixaDeTudo?.getAttribute('aria-checked') ?? null,
      nomesDasLinhas: caixasDeLinha.slice(0, 3).map((c) => nomeAcessivel(c)),
      nomesDeLinhaDistintos: new Set(caixasDeLinha.map((c) => nomeAcessivel(c))).size,
      totalDeCheckboxesDeLinha: caixasDeLinha.length,
      regiaoViva: regiaoViva
        ? {
            papel: regiaoViva.getAttribute('role'),
            ariaLive: regiaoViva.getAttribute('aria-live'),
            classe: regiaoViva.getAttribute('class'),
            texto: texto(regiaoViva),
          }
        : null,
      nomesDaPaginacao: botoesDePagina.map((b) => nomeAcessivel(b)),
      estadoDaPaginacao: botoesDePagina.map((b) => (b as HTMLButtonElement).disabled),
      textoDoIndicador: texto(todos('.nds-data-table-pagination-count').slice(-1)[0]),
      textoDaContagem: texto(todos('.nds-data-table-pagination-count')[0]),
      nomeDoSeletorDeTamanho: nomeAcessivel(seletorDeTamanho),
      nomeDoFiltroDeTexto: nomeAcessivel(filtroDeTexto),
      nomeDoFiltroDeSelect: nomeAcessivel(filtroDeSelect),
      textoSemFiltro: (() => {
        const th = linhaDeFiltros
          ? Array.from(linhaDeFiltros.querySelectorAll('th')).find(
              (c) => !c.querySelector('input, select'),
            )
          : null;
        return th ? texto(th.querySelector('.nds-sr-only')) ?? th.getAttribute('aria-label') : null;
      })(),
      nomeDoBotaoDeEdicao: nomeAcessivel(botaoDeEdicao),
      nomeDoCampoDeEdicao: nomeAcessivel(campoDeEdicao),
      textoDoVazio: texto(vazio),
      pinadoNoTh: um('thead th.nds-data-table-th-pinned') ? 'th-pinned' : um('thead th.nds-data-table-td-pinned') ? 'td-pinned' : null,
      pinadoNoTd: um('tbody td.nds-data-table-td-pinned') ? 'td-pinned' : um('tbody td.nds-data-table-th-pinned') ? 'th-pinned' : null,
    },
    geometria: {
      larguraDaRaiz: Math.round(raiz.getBoundingClientRect().width),
      th: caixa(thOrdenavel),
      thInner: caixa(um('.nds-data-table-th-inner') ?? botaoDeOrdenar?.parentElement),
      td: caixa(linhas[0]?.querySelector('td:nth-child(2)')),
      thDeFiltro: caixa(thDeFiltro),
      linhaDeFiltros: caixa(linhaDeFiltros),
      botaoDeEdicao: caixa(botaoDeEdicao),
      campoDeEdicao: caixa(campoDeEdicao),
      celulaVazia: caixa(vazio),
      botaoDeOrdenar: caixa(botaoDeOrdenar),
    },
    estados: {
      linhaSelecionada: linhaSelecionada
        ? { dataState: linhaSelecionada.getAttribute('data-state'), fundo: getComputedStyle(linhaSelecionada).backgroundColor }
        : null,
      linhaNormal: linhaNormal ? { fundo: getComputedStyle(linhaNormal).backgroundColor } : null,
      celulaNumerica: caixa(celulaNumerica),
      conteudoNumerico: caixa(conteudoNumerico),
      classeDoConteudoNumerico: conteudoNumerico?.getAttribute('class') ?? null,
      cabecalhoNumerico: caixa(thNumerico),
    },
    contraste: {
      celulaVazia: contraste(vazio),
      contagem: contraste(um('.nds-data-table-pagination-count')),
      cabecalho: contraste(thOrdenavel),
    },
    alcanceDoClique: {
      checkboxDeTudo: alcance(caixaDeTudo),
      botaoDeOrdenar: alcance(botaoDeOrdenar),
      primeiraPagina: alcance(botoesDePagina[0]),
      botaoDeEdicao: alcance(botaoDeEdicao),
    },
  };
}

/**
 * Mede todas as tabelas marcadas com `data-sonda="<cenario>"` dentro de `raiz`.
 * Cenário sem tabela vem `null` — é o achado de "a stack não monta este caso".
 */
export function medirDataTable(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? medirTabela(alvo) : null;
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
export function reportarSonda(stack: string, raiz: HTMLElement, cenarios: string[]) {
  throw new Error(`SONDA::${stack}::${JSON.stringify(medirDataTable(raiz, cenarios))}`);
}
