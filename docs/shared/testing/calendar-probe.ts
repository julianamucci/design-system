/**
 * Sonda de comparação do Calendar entre as cinco stacks.
 *
 * Existe porque a comparação vinha sendo feita defeito a defeito, a cada
 * relato: cada rodada custava quatro suítes e revelava só o que tinha sido
 * apontado. Aqui a medição é uma só, roda nas cinco e devolve o mesmo
 * registro, então a divergência aparece como diferença de valor e não como
 * impressão de quem olha.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` compartilhado. Onde o
 * contrato não é cumprido o campo vem `null` — e isso É o achado, não uma falha
 * da medição.
 *
 * Cinco eixos, e nenhum deles é opinião:
 *
 *   · estrutura  — quais classes do contrato existem e quantas;
 *   · semântica  — papel, rótulo e estado ARIA de cada peça;
 *   · geometria  — caixa, raio e distância entre blocos;
 *   · estado     — cor, raio e ALCANCE de cada estado do dia;
 *   · cor        — razão WCAG nos três temas e nos dois modos.
 *
 * Reuso, e não colhedor novo: `cor.ts` dá a varredura por tema e a razão WCAG;
 * `alert-probe.ts` dá o fundo COMPOSTO, que é o que importa aqui — o dia
 * desabilitado é pintado com `opacity`, e ler `color` sem compor devolve um
 * número que ninguém vê.
 */

import { porTema, razao } from './cor';
import { fundoEfetivo } from './alert-probe';

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

/**
 * Um estado do dia, medido inteiro.
 *
 * Antes daqui saía só a caixa — e o que faltava era justamente o que o estado
 * PROMETE: se o dia desabilitado é anunciado, se ele recebe foco, se o clique é
 * bloqueado de verdade. Uma caixa cinza não responde nada disso.
 */
export interface EstadoDoDia {
  existe: boolean;
  /** Qual das formas aceitas casou — a divergência de vocabulário é o achado. */
  seletorQueCasou: string | null;
  texto: string | null;
  ariaLabel: string | null;
  ariaDisabled: string | null;
  ariaPressed: string | null;
  ariaCurrent: string | null;
  /** `aria-selected` na CÉLULA (é ela quem tem papel de gridcell). */
  ariaSelectedNaCelula: string | null;
  /** Atributo `disabled` de verdade no DOM, não só a marca visual. */
  desabilitadoNoDom: boolean;
  tabIndex: number | null;
  pointerEvents: string;
  opacidade: number;
  caixa: CaixaMedida | null;
  alcance: AlcanceDoClique;
  /** Data em ISO, seja qual for o atributo que a stack usa para carregá-la. */
  iso: string | null;
}

export interface ContrasteDoDia {
  tema: string;
  modo: string;
  estado: string;
  /** `false` quando o estado não existe na tela — isso É o achado. */
  presente: boolean;
  frente: string | null;
  fundo: string | null;
  razao: number | null;
}

export interface MedidaDeDensidade {
  densidade: string;
  larguraDaRaiz: number | null;
  celula: number | null;
  respiroLegendaSemana: number | null;
  paddingDaRaiz: string | null;
  gapEntreSemanas: string | null;
}

// ─── Primitivas ───────────────────────────────────────────────────────────────

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
  const classes = (el.className || '').toString().split(/\s+/).filter(Boolean);
  return `${el.tagName.toLowerCase()}${classes.length ? '.' + classes.slice(0, 2).join('.') : ''}`;
}

function alcance(el: HTMLElement | null): AlcanceDoClique {
  if (!el) return { achado: false, clicavel: false, porCima: null };
  const r = el.getBoundingClientRect();
  const noTopo = el.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const clicavel = noTopo === el || el.contains(noTopo);
  return { achado: true, clicavel, porCima: clicavel ? null : descreve(noTopo) };
}

/**
 * Primeiro elemento que casar, e QUAL seletor casou.
 *
 * Registrar o seletor é metade da medição: divergência de vocabulário entre
 * stacks faz o seletor não casar e o campo vir `null`, e é justamente essa
 * divergência o achado mais valioso da sonda.
 */
function primeiroQueCasar(
  raiz: HTMLElement,
  seletores: string[],
): { el: HTMLElement | null; seletor: string | null } {
  for (const seletor of seletores) {
    const el = raiz.querySelector<HTMLElement>(seletor);
    if (el) return { el, seletor };
  }
  return { el: null, seletor: null };
}

/**
 * A data do dia em ISO, seja qual for o atributo que a stack usa.
 *
 * O React põe a data FORMATADA NO LOCALE no `data-day` do botão (não serve para
 * aritmética) e o ISO no `data-day` da célula; as outras quatro põem o ISO no
 * `data-value` ou no `data-day` do próprio botão. Sem normalizar, comparar
 * "onde o foco foi parar" entre stacks é comparar formatos diferentes.
 */
export function isoDoDia(el: Element | null): string | null {
  if (!el) return null;
  const doBotao = el.getAttribute('data-value') ?? el.getAttribute('data-day');
  if (doBotao && /^\d{4}-\d{2}-\d{2}$/.test(doBotao)) return doBotao;
  const daCelula = el.closest('[role=gridcell], td')?.getAttribute('data-day');
  if (daCelula && /^\d{4}-\d{2}-\d{2}$/.test(daCelula)) return daCelula;
  return null;
}

/** ISO do dia que está com o foco AGORA — o que a navegação por teclado move. */
export function isoDoFoco(doc: Document): string | null {
  const ativo = doc.activeElement as HTMLElement | null;
  if (!ativo) return null;
  return isoDoDia(ativo);
}

function estadoDoDia(raiz: HTMLElement, seletores: string[]): EstadoDoDia {
  const { el, seletor } = primeiroQueCasar(raiz, seletores);
  if (!el) {
    return {
      existe: false,
      seletorQueCasou: null,
      texto: null,
      ariaLabel: null,
      ariaDisabled: null,
      ariaPressed: null,
      ariaCurrent: null,
      ariaSelectedNaCelula: null,
      desabilitadoNoDom: false,
      tabIndex: null,
      pointerEvents: 'n/a',
      opacidade: 1,
      caixa: null,
      alcance: { achado: false, clicavel: false, porCima: null },
      iso: null,
    };
  }
  const cs = getComputedStyle(el);
  const celula = el.closest('td, [role=gridcell]');
  return {
    existe: true,
    seletorQueCasou: seletor,
    texto: el.textContent?.trim() ?? null,
    ariaLabel: el.getAttribute('aria-label'),
    ariaDisabled: el.getAttribute('aria-disabled'),
    ariaPressed: el.getAttribute('aria-pressed'),
    ariaCurrent: el.getAttribute('aria-current') ?? celula?.getAttribute('aria-current') ?? null,
    ariaSelectedNaCelula: celula?.getAttribute('aria-selected') ?? null,
    desabilitadoNoDom: (el as HTMLButtonElement).disabled === true,
    tabIndex: el.tabIndex,
    pointerEvents: cs.pointerEvents,
    opacidade: parseFloat(cs.opacity) || 1,
    caixa: caixa(el),
    alcance: alcance(el),
    iso: isoDoDia(el),
  };
}

// ─── Vocabulário de cada estado ───────────────────────────────────────────────
//
// Cada estado tem MAIS DE UMA forma aceita, na ordem em que as stacks a
// emitem. Atributo de presença é casado com `:not([attr="false"])`: algumas
// libs emitem `data-range-middle="false"` em TODOS os dias, e sem a guarda a
// sonda mede o primeiro da grade e relata um defeito que não existe.

const SELETORES: Record<string, string[]> = {
  selecionado: [
    '.nds-calendar-day-btn[data-selected]:not([data-selected="false"])',
    '.nds-calendar-day-btn[data-selected-single="true"]',
    '.nds-calendar-day-btn[aria-pressed="true"]',
    '[aria-selected="true"] .nds-calendar-day-btn',
    '.nds-calendar-day[data-selected="true"]',
  ],
  hoje: [
    '.nds-calendar-day-btn[data-today]:not([data-today="false"])',
    '.nds-calendar-today .nds-calendar-day-btn',
    '.nds-calendar-day-btn[aria-current="date"]',
    '.nds-calendar-day[data-today="true"]',
  ],
  foraDoMes: [
    '.nds-calendar-day-btn[data-outside-view]:not([data-outside-view="false"])',
    '.nds-calendar-day-btn[data-outside-month]:not([data-outside-month="false"])',
    '.nds-calendar-outside .nds-calendar-day-btn',
    '.nds-calendar-day[data-outside="true"]',
  ],
  desabilitado: [
    '.nds-calendar-day-btn[data-disabled]:not([data-disabled="false"])',
    '.nds-calendar-day-btn:disabled',
    '.nds-calendar-day-btn[aria-disabled="true"]',
    '.nds-calendar-disabled .nds-calendar-day-btn',
    '.nds-calendar-day:disabled',
  ],
  intervaloInicio: [
    '.nds-calendar-day-btn[data-selection-start]:not([data-selection-start="false"])',
    '.nds-calendar-day-btn[data-range-start="true"]',
    '.nds-calendar-range-start .nds-calendar-day-btn',
    '.nds-calendar-day[data-range="start"]',
  ],
  intervaloMeio: [
    '.nds-calendar-day-btn[data-range-middle]:not([data-range-middle="false"])',
    '.nds-calendar-range-middle .nds-calendar-day-btn',
    '.nds-calendar-day[data-range="middle"]',
  ],
  intervaloFim: [
    '.nds-calendar-day-btn[data-selection-end]:not([data-selection-end="false"])',
    '.nds-calendar-day-btn[data-range-end="true"]',
    '.nds-calendar-range-end .nds-calendar-day-btn',
    '.nds-calendar-day[data-range="end"]',
  ],
};

export const ESTADOS_DO_DIA = Object.keys(SELETORES);

// ─── Medição principal ────────────────────────────────────────────────────────

export function medirCalendario(raiz: HTMLElement) {
  const um = <T extends HTMLElement>(sel: string) => raiz.querySelector<T>(sel);
  const todos = (sel: string) => Array.from(raiz.querySelectorAll<HTMLElement>(sel));
  const conta = (sel: string) => raiz.querySelectorAll(sel).length;

  // O Vanilla nomeava a raiz, a paginação e o dia com uma família de classes
  // diferente da das outras. A sonda aceita as duas e registra qual casou.
  const raizDoCalendario = um('.nds-calendar-root') ?? um('.nds-calendar');
  const familiaDeClasses = um('.nds-calendar-root') ? 'root' : um('.nds-calendar') ? 'calendar' : 'nenhuma';
  const diaBotao = um('.nds-calendar-day-btn') ?? um('.nds-calendar-day');
  const legenda = um('.nds-calendar-caption') ?? um('.nds-calendar-caption-dropdown') ?? um('.nds-calendar-month-label');
  const semana = um('thead');
  const seletores = todos('.nds-calendar-select');
  const tabela = um('table');

  const botaoAnterior =
    todos('button').find((b) => /previous|anterior|mês anterior/i.test(b.getAttribute('aria-label') ?? '')) ?? null;
  const botaoProximo =
    todos('button').find((b) => /next|próximo|proximo|siguiente/i.test(b.getAttribute('aria-label') ?? '')) ?? null;

  const respiro =
    legenda && semana
      ? Math.round(semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom)
      : null;

  const cabecalhos = Array.from(raiz.querySelectorAll<HTMLElement>('thead th, thead td'));
  const diasDaSemana = cabecalhos.map((th) => th.textContent?.trim() ?? '');

  const estados: Record<string, EstadoDoDia> = {};
  for (const [nome, lista] of Object.entries(SELETORES)) estados[nome] = estadoDoDia(raiz, lista);

  const diasNoDom = todos('.nds-calendar-day-btn, .nds-calendar-day');
  const tabulaveis = diasNoDom.filter((d) => d.tabIndex >= 0);

  const meio = primeiroQueCasar(raiz, SELETORES.intervaloMeio).el;

  return {
    familiaDeClasses,
    estrutura: {
      raiz: descreve(raizDoCalendario),
      temMonths: conta('.nds-calendar-months'),
      temMonth: conta('.nds-calendar-month'),
      temNavOverlay: conta('.nds-calendar-nav-overlay'),
      temNav: conta('.nds-calendar-nav'),
      temCaption: conta('.nds-calendar-caption'),
      temCaptionDropdown: conta('.nds-calendar-caption-dropdown'),
      seletores: seletores.length,
      celulas: conta('.nds-calendar-day-cell'),
      dias: diasNoDom.length,
      semanas: conta('.nds-calendar-week'),
      tabela: descreve(tabela),
    },
    semantica: {
      papelDoGrid: um('[role=grid]') ? 'grid' : tabela ? 'table-sem-role' : null,
      celulasComGridcell: conta('[role=gridcell]'),
      rotuloDaTabela: tabela?.getAttribute('aria-label') ?? null,
      semanaEscondida: semana?.getAttribute('aria-hidden') ?? null,
      // Cabeçalho de coluna: `scope` só é válido em <th>, e o nome por extenso
      // (para quem ouve) mora em `abbr`/`aria-label`/`title` quando existe.
      tagDoCabecalho: cabecalhos[0]?.tagName.toLowerCase() ?? null,
      escopoDoCabecalho: cabecalhos[0]?.getAttribute('scope') ?? null,
      nomeCompletoDoCabecalho:
        cabecalhos[0]?.getAttribute('abbr') ??
        cabecalhos[0]?.getAttribute('aria-label') ??
        cabecalhos[0]?.getAttribute('title') ??
        null,
      rotuloAnterior: botaoAnterior?.getAttribute('aria-label') ?? null,
      rotuloProximo: botaoProximo?.getAttribute('aria-label') ?? null,
      rotuloDoDia: diaBotao?.getAttribute('aria-label') ?? null,
      // Onde mora o estado de seleção: a célula é quem tem papel de gridcell, e
      // é dela que o leitor de tela lê ao percorrer a grade.
      ondeFicaAriaSelected: um('[role=gridcell][aria-selected], td[aria-selected]')
        ? um('.nds-calendar-day-btn[aria-selected]')
          ? 'ambos'
          : 'celula'
        : um('.nds-calendar-day-btn[aria-selected]')
          ? 'botao'
          : null,
      ariaCurrentDeHoje: estados.hoje.ariaCurrent,
      // Um grid é UMA parada de tabulação: só o dia corrente entra na ordem.
      diasTabulaveis: tabulaveis.length,
      diasDaSemana,
      textoDaLegenda: legenda?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
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
    estados,
    miolo: meio
      ? {
          botao: descreve(meio),
          celula: descreve(meio.parentElement),
          fundoDaCelula: meio.parentElement ? getComputedStyle(meio.parentElement).backgroundColor : null,
          dataDoBotao: JSON.stringify({ ...meio.dataset }),
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
      primeiraOpcaoDeMes: seletores[0]?.querySelector('option')?.textContent?.trim() ?? null,
    },
  };
}

// ─── Teclado ──────────────────────────────────────────────────────────────────

export interface PassoDeTeclado {
  tecla: string;
  /** Onde o foco parou. `null` = saiu da grade (o defeito clássico). */
  iso: string | null;
  /** Descrição do elemento em foco — mostra quando o foco caiu no contêiner. */
  ativo: string | null;
  /** A legenda depois da tecla: é ela que prova que o mês virou. */
  legenda: string | null;
}

/**
 * A navegação por teclado, tecla a tecla.
 *
 * `apertar` é injetado pela story (`userEvent.keyboard`) porque o colhedor é
 * compartilhado e não pode depender do `storybook/test` de cada stack.
 *
 * O que se mede não é "a tecla foi tratada", e sim ONDE O FOCO FOI PARAR: um
 * PageDown que muda o mês e devolve o foco ao contêiner é indistinguível de um
 * que funciona, se a asserção olhar só a legenda. Foi assim que a navegação por
 * setas passou anos "verde" numa stack em que ela não movia foco nenhum.
 */
export async function medirTeclado(
  raiz: HTMLElement,
  apertar: (tecla: string) => Promise<void>,
  teclas: string[] = ['ArrowRight', 'ArrowDown', 'Home', 'End', 'PageDown', 'PageUp'],
): Promise<{ inicial: PassoDeTeclado; passos: PassoDeTeclado[] }> {
  const doc = raiz.ownerDocument;
  const legenda = () =>
    raiz.querySelector('.nds-calendar-caption')?.textContent?.trim().replace(/\s+/g, ' ') ?? null;
  const instantaneo = (tecla: string): PassoDeTeclado => ({
    tecla,
    iso: isoDoFoco(doc),
    ativo: descreve(doc.activeElement),
    legenda: legenda(),
  });

  const inicial = instantaneo('(inicial)');
  const passos: PassoDeTeclado[] = [];
  for (const tecla of teclas) {
    await apertar(`{${tecla}}`);
    passos.push(instantaneo(tecla));
  }
  return { inicial, passos };
}

// ─── Contraste ────────────────────────────────────────────────────────────────

/**
 * Cor do texto JÁ COMPOSTA com a opacidade acumulada até o fundo opaco.
 *
 * O dia desabilitado é apagado com `opacity: 0.5` no elemento inteiro — ler
 * `color` direto devolve a cor cheia, que ninguém vê. A opacidade multiplica ao
 * subir: uma célula meio-transparente dentro de um bloco meio-transparente
 * apaga duas vezes.
 */
function frenteComOpacidade(el: HTMLElement): string {
  const cs = getComputedStyle(el);
  let opacidade = parseFloat(cs.opacity);
  if (Number.isNaN(opacidade)) opacidade = 1;
  let atual: HTMLElement | null = el.parentElement;
  while (atual) {
    const o = parseFloat(getComputedStyle(atual).opacity);
    if (!Number.isNaN(o) && o < 1) opacidade *= o;
    atual = atual.parentElement;
  }
  const cor = cs.color;
  if (opacidade >= 0.999) return cor;
  const n = (cor.match(/-?[\d.]+/g) ?? []).map(Number);
  if (n.length < 3) return cor;
  const alfaProprio = n.length > 3 ? n[3] : 1;
  return `rgba(${n[0]}, ${n[1]}, ${n[2]}, ${alfaProprio * opacidade})`;
}

/**
 * Razão WCAG do número do dia em CADA estado, nos três temas e nos dois modos.
 *
 * O axe do test-runner mede o que está na tela, e a tela está sempre no tema
 * claro da marca default — um sexto do produto. O dia escolhido, o dia de hoje
 * e o dia desabilitado são exatamente os três lugares onde a cor muda, e nunca
 * foram medidos no escuro.
 *
 * `raiz` é quem recebe a classe de tema; `porTema` a devolve no `finally` —
 * deixá-la posta envenena a story seguinte e a foto do Chromatic.
 */
export function medirContrasteDoCalendario(raiz: HTMLElement): ContrasteDoDia[] {
  const alvos = ESTADOS_DO_DIA.map((estado) => ({
    estado,
    el: primeiroQueCasar(raiz, SELETORES[estado]).el,
  }));

  // As transições morrem ANTES da troca de tema: o dia declara
  // `transition: background-color, color`, e medir logo depois de trocar a
  // classe devolveria a cor do tema anterior — a armadilha do "contraste ~1.0
  // = elemento em fade", com outra origem.
  const originais = alvos.map(({ el }) => el?.style.transition ?? null);
  alvos.forEach(({ el }) => {
    if (el) el.style.transition = 'none';
  });

  try {
    return porTema(raiz, (tema, modo) =>
      alvos.map(({ estado, el }): ContrasteDoDia => {
        if (!el) return { tema, modo, estado, presente: false, frente: null, fundo: null, razao: null };
        const fundo = fundoEfetivo(el);
        const r = razao(frenteComOpacidade(el), fundo);
        return {
          tema,
          modo,
          estado,
          presente: true,
          frente: r?.frente ?? null,
          fundo,
          razao: r?.razao ?? null,
        };
      }),
    ).flat();
  } finally {
    alvos.forEach(({ el }, i) => {
      if (!el) return;
      const antes = originais[i];
      if (antes) el.style.transition = antes;
      else el.style.removeProperty('transition');
    });
  }
}

/** Linha legível de uma medida — o que a falha da story precisa mostrar. */
export function descreverContraste(m: ContrasteDoDia): string {
  if (!m.presente) return `${m.tema}/${m.modo} · ${m.estado}: estado ausente na tela`;
  return `${m.tema}/${m.modo} · ${m.estado}: ${m.frente} sobre ${m.fundo} = ${m.razao}:1`;
}

/**
 * Os estados do dia que carregam TEXTO com exigência de contraste.
 *
 * O dia bloqueado fica de fora: é texto de interface inativa, isento pela WCAG
 * 1.4.3 — cobrá-lo aqui obrigaria a apagar menos o que precisa parecer apagado.
 */
export const ESTADOS_COM_TEXTO_LEGIVEL = [
  'selecionado',
  'hoje',
  'foraDoMes',
  'intervaloInicio',
  'intervaloMeio',
  'intervaloFim',
] as const;

// ─── Densidade ────────────────────────────────────────────────────────────────

export const DENSIDADES = ['densidade-default', 'densidade-condensado', 'densidade-confortavel'] as const;

/**
 * O calendário nas três densidades.
 *
 * A classe vai no `documentElement`, e NÃO na raiz do componente — é onde a
 * toolbar do Storybook a põe, e é o único lugar onde ela faz efeito. Os degraus
 * `--spacing-1..12` são declarados no `:root` como `calc(var(--spacing-base) * N)`,
 * e custom property tem o `var()` substituído no elemento em que é DECLARADA:
 * o descendente herda o resultado já resolvido com a base do `:root`. Posta num
 * ancestral do calendário, a classe muda `--spacing-base` e não muda nem um
 * pixel — a primeira versão desta função media exatamente isso e devolvia os
 * três valores idênticos, o que parecia achado e era erro de régua.
 *
 * A classe original volta no `finally`: deixá-la posta envenena a story seguinte
 * e a foto do Chromatic.
 */
export function medirDensidadeDoCalendario(raiz: HTMLElement): MedidaDeDensidade[] {
  const html = raiz.ownerDocument.documentElement;
  const classeOriginal = html.className;
  const saida: MedidaDeDensidade[] = [];
  try {
    for (const densidade of DENSIDADES) {
      html.className = `${classeOriginal} ${densidade}`.trim();
      void raiz.offsetHeight;
      const alvo = raiz.querySelector<HTMLElement>('.nds-calendar-root') ?? raiz;
      const dia = raiz.querySelector<HTMLElement>('.nds-calendar-day-btn, .nds-calendar-day');
      const legenda = raiz.querySelector<HTMLElement>('.nds-calendar-caption');
      const semana = raiz.querySelector<HTMLElement>('thead');
      const linha = raiz.querySelector<HTMLElement>('.nds-calendar-week');
      saida.push({
        densidade,
        larguraDaRaiz: Math.round(alvo.getBoundingClientRect().width),
        celula: dia ? Math.round(dia.getBoundingClientRect().width) : null,
        respiroLegendaSemana:
          legenda && semana
            ? Math.round(semana.getBoundingClientRect().top - legenda.getBoundingClientRect().bottom)
            : null,
        paddingDaRaiz: getComputedStyle(alvo).padding,
        gapEntreSemanas: linha ? getComputedStyle(linha).marginTop : null,
      });
    }
  } finally {
    html.className = classeOriginal;
    void raiz.offsetHeight;
  }
  return saida;
}

// ─── Saída ────────────────────────────────────────────────────────────────────

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest. A
 * mensagem de erro chega — é o único canal de saída disponível daqui.
 */
export function reportarSonda(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}
