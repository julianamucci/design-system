/**
 * Sonda de comparação do Calendar entre as quatro stacks.
 *
 * Existe porque a comparação vinha sendo feita defeito a defeito, a cada
 * relato: cada rodada custava quatro suítes e revelava só o que tinha sido
 * apontado. Aqui a medição é uma só, roda nas quatro e devolve o mesmo
 * registro, então a divergência aparece como diferença de valor e não como
 * impressão de quem olha.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` compartilhado. Onde o
 * contrato não é cumprido o campo vem `null` — e isso É o achado, não uma falha
 * da medição.
 */

export interface AlcanceDoClique {
  achado: boolean;
  /** O elemento no topo do ponto central é ele mesmo (ou filho dele)? */
  clicavel: boolean;
  /** Quem está por cima, quando não é ele. */
  porCima: string | null;
}

export interface CaixaMedida {
  largura: number;
  altura: number;
  raioTopoEsquerda: number;
  raioTopoDireita: number;
  fundo: string;
  cor: string;
  larguraDaBorda: number;
  alinhamento: string;
  justificacao: string;
  padding: string;
}

function caixa(el: HTMLElement | null): CaixaMedida | null {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    largura: Math.round(r.width),
    altura: Math.round(r.height),
    raioTopoEsquerda: Math.round(parseFloat(cs.borderTopLeftRadius) || 0),
    raioTopoDireita: Math.round(parseFloat(cs.borderTopRightRadius) || 0),
    fundo: cs.backgroundColor,
    cor: cs.color,
    larguraDaBorda: Math.round(parseFloat(cs.borderTopWidth) || 0),
    alinhamento: cs.alignItems,
    justificacao: cs.justifyContent,
    padding: cs.padding,
  };
}

function descreve(el: Element | null): string | null {
  if (!el) return null;
  const classes = (el.className || "").toString().split(/\s+/).filter(Boolean);
  return `${el.tagName.toLowerCase()}${classes.length ? "." + classes.slice(0, 2).join(".") : ""}`;
}

function alcance(el: HTMLElement | null): AlcanceDoClique {
  if (!el) return { achado: false, clicavel: false, porCima: null };
  const r = el.getBoundingClientRect();
  const noTopo = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const clicavel = noTopo === el || el.contains(noTopo);
  return { achado: true, clicavel, porCima: clicavel ? null : descreve(noTopo) };
}

export function medirCalendario(raiz: HTMLElement) {
  const um = <T extends HTMLElement>(sel: string) => raiz.querySelector<T>(sel);
  const todos = (sel: string) => Array.from(raiz.querySelectorAll<HTMLElement>(sel));
  const conta = (sel: string) => raiz.querySelectorAll(sel).length;

  // O Vanilla nomeia a raiz, a paginação e o dia com uma família de classes
  // diferente da das outras três. A sonda aceita as duas e registra qual casou.
  const raizDoCalendario = um(".nds-calendar-root") ?? um(".nds-calendar");
  const familiaDeClasses = um(".nds-calendar-root") ? "root" : um(".nds-calendar") ? "calendar" : "nenhuma";
  const diaBotao = um(".nds-calendar-day-btn") ?? um(".nds-calendar-day");
  const legenda = um(".nds-calendar-caption") ?? um(".nds-calendar-caption-dropdown") ?? um(".nds-calendar-month-label");
  const semana = um("thead");
  const seletores = todos(".nds-calendar-select");

  const botaoAnterior =
    todos("button").find((b) => /previous|anterior|mês anterior/i.test(b.getAttribute("aria-label") ?? "")) ?? null;
  const botaoProximo =
    todos("button").find((b) => /next|próximo|proximo/i.test(b.getAttribute("aria-label") ?? "")) ?? null;

  const respiro =
    legenda && semana
      ? Math.round(semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom)
      : null;

  const diasDaSemana = Array.from(raiz.querySelectorAll("thead th, thead td")).map(
    (th) => th.textContent?.trim() ?? "",
  );

  const selecionado = um(".nds-calendar-day-btn[data-selected], .nds-calendar-day-btn[data-selected='true'], .nds-calendar-day[data-selected='true']");
  const hoje = um(".nds-calendar-day-btn[data-today], .nds-calendar-day-btn[data-today='true'], .nds-calendar-day[data-today='true']");
  const foraDoMes = um(
    ".nds-calendar-day-btn[data-outside-view], .nds-calendar-day-btn[data-outside-month], .nds-calendar-outside .nds-calendar-day-btn, .nds-calendar-day[data-outside='true']",
  );
  const desabilitado = um(".nds-calendar-day-btn[data-disabled], .nds-calendar-day-btn:disabled, .nds-calendar-day:disabled");
  const inicioDoIntervalo = um(
    ".nds-calendar-day-btn[data-selection-start]:not([data-selection-start='false']), .nds-calendar-range-start .nds-calendar-day-btn, .nds-calendar-day[data-range='start']",
  );
  const meioDoIntervalo = um(
    ".nds-calendar-day-btn[data-range-middle]:not([data-range-middle='false']), .nds-calendar-range-middle .nds-calendar-day-btn, .nds-calendar-day[data-range='middle']",
  );
  const fimDoIntervalo = um(
    ".nds-calendar-day-btn[data-selection-end]:not([data-selection-end='false']), .nds-calendar-range-end .nds-calendar-day-btn, .nds-calendar-day[data-range='end']",
  );

  return {
    familiaDeClasses,
    estrutura: {
      raiz: descreve(raizDoCalendario),
      temMonths: conta(".nds-calendar-months"),
      temMonth: conta(".nds-calendar-month"),
      temNavOverlay: conta(".nds-calendar-nav-overlay"),
      temNav: conta(".nds-calendar-nav"),
      temCaption: conta(".nds-calendar-caption"),
      temCaptionDropdown: conta(".nds-calendar-caption-dropdown"),
      seletores: seletores.length,
      celulas: conta(".nds-calendar-day-cell"),
      dias: conta(".nds-calendar-day-btn, .nds-calendar-day"),
      tabela: descreve(um("table")),
    },
    semantica: {
      papelDoGrid: um("[role=grid]") ? "grid" : um("table") ? "table-sem-role" : null,
      celulasComGridcell: conta("[role=gridcell]"),
      semanaEscondida: semana?.getAttribute("aria-hidden") ?? null,
      rotuloAnterior: botaoAnterior?.getAttribute("aria-label") ?? null,
      rotuloProximo: botaoProximo?.getAttribute("aria-label") ?? null,
      rotuloDoDia: diaBotao?.getAttribute("aria-label") ?? null,
      diasDaSemana,
      textoDaLegenda: legenda?.textContent?.trim().replace(/\s+/g, " ") ?? null,
    },
    geometria: {
      larguraDaRaiz: raizDoCalendario ? Math.round(raizDoCalendario.getBoundingClientRect().width) : null,
      larguraDoPai: raizDoCalendario?.parentElement
        ? Math.round(raizDoCalendario.parentElement.getBoundingClientRect().width)
        : null,
      respiroLegendaSemana: respiro,
      dia: caixa(diaBotao),
      navAnterior: caixa(botaoAnterior),
      seletor: caixa(seletores[0] ?? null),
    },
    estados: {
      selecionado: caixa(selecionado),
      hoje: caixa(hoje),
      foraDoMes: caixa(foraDoMes),
      desabilitado: caixa(desabilitado),
      intervaloInicio: caixa(inicioDoIntervalo),
      intervaloMeio: caixa(meioDoIntervalo),
      intervaloFim: caixa(fimDoIntervalo),
    },
    miolo: meioDoIntervalo
      ? {
          botao: descreve(meioDoIntervalo),
          celula: descreve(meioDoIntervalo.parentElement),
          fundoDaCelula: meioDoIntervalo.parentElement
            ? getComputedStyle(meioDoIntervalo.parentElement).backgroundColor
            : null,
          dataDoBotao: JSON.stringify({ ...meioDoIntervalo.dataset }),
        }
      : null,
    alcanceDoClique: {
      navAnterior: alcance(botaoAnterior),
      navProximo: alcance(botaoProximo),
      seletorDeMes: alcance(seletores[0] ?? null),
      seletorDeAno: alcance(seletores[1] ?? null),
      dia: alcance(diaBotao),
    },
    listas: {
      opcoesDeMes: seletores[0] ? (seletores[0] as HTMLSelectElement).options.length : null,
      opcoesDeAno: seletores[1] ? (seletores[1] as HTMLSelectElement).options.length : null,
    },
  };
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest. A
 * mensagem de erro chega — é o único canal de saída disponível daqui.
 */
export function reportarSonda(stack: string, cenario: string, raiz: HTMLElement) {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(medirCalendario(raiz))}`);
}
