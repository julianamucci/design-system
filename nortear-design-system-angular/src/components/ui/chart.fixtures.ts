// Dados de exemplo e utilitários de medição do Chart.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: uma
// constante de dados exportada apareceria na sidebar como uma story quebrada.
//
// O bloco de contraste existe porque a exigência do gráfico é numérica
// (WCAG 1.4.11 pede 3:1) e "olhar e achar bonito" não a verifica. As play
// functions resolvem o token no navegador e medem.

import { expect, waitFor } from 'storybook/test';
import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';
import { getInstanceByDom } from 'echarts/core';
import type { ECharts } from 'echarts/core';

import type { ChartDataPoint, ChartRadarAxis, ChartSeries } from './chart';

// ─── Dados ────────────────────────────────────────────────────────────────────

export const MONTHS: string[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

export const SERIE_UNICA = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
] satisfies ChartSeries[];

export const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
] satisfies ChartSeries[];

export const SERIES_TRIO = [
  ...SERIES_MULTI,
  { name: 'Tablet', data: [40, 60, 55, 48, 70, 66] },
] satisfies ChartSeries[];

export const DATA_DISPOSITIVO: ChartDataPoint[] = [
  { label: 'Desktop', value: 1224 },
  { label: 'Mobile', value: 860 },
  { label: 'Tablet', value: 320 },
];

/**
 * Quatro etapas de um processo que afunila.
 *
 * Os valores dão participações redondas em relação à primeira etapa — 100%,
 * 60%, 30% e 12% — porque é essa coluna que a tabela do funil repete, e um
 * número redondo torna a asserção legível sem arredondamento no meio.
 */
export const FUNNEL_STAGES: ChartDataPoint[] = [
  { label: 'Visitas', value: 4000 },
  { label: 'Cadastros', value: 2400 },
  { label: 'Carrinho', value: 1200 },
  { label: 'Compra', value: 480 },
];

/**
 * Cinco grandezas de um mesmo item, uma por eixo.
 *
 * Os tetos são DIFERENTES de propósito — 100, 100, 10, 100 e 5. É essa diferença
 * que a coluna de máximo existe para escrever: o 9 de "Boas práticas" é um
 * vértice quase no anel de fora, e o 96 de "SEO" também; só a tabela pode dizer
 * que um vale 9 e o outro 96 sem que o polígono tenha mentido.
 */
/**
 * Séries da dispersão: um grupo do agrupamento compartilhado por série.
 *
 * O agrupamento vem PRONTO de `docs/shared/primitives`, gerado uma vez por
 * `scripts/gerar-agrupamento-scatter.mjs`. Rodar o k-means aqui faria o desenho
 * mudar sozinho entre rodadas — medido, a partição se repete de 92 a 98 vezes em
 * 100 — e a tabela equivalente descreveria outro agrupamento.
 */
export const SCATTER_SERIES = CHART_SCATTER_CLUSTERS.map((c) => ({
  name: c.name,
  points: c.points,
})) satisfies ChartSeries[];

export const SCATTER_POINTS = SCATTER_SERIES.reduce((n, s) => n + s.points.length, 0);
export const SCATTER_X = 'Minutos na página';
export const SCATTER_Y = 'Páginas vistas';

export const RADAR_AXES: ChartRadarAxis[] = [
  { label: 'Desempenho', max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas', max: 10 },
  { label: 'SEO', max: 100 },
  { label: 'Conteúdo', max: 5 },
];

/** Duas medições do mesmo site, para o desenho ser uma comparação. */
export const RADAR_SERIES = [
  { name: 'Antes', data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
] satisfies ChartSeries[];

/** Uma série curta, para o mini gráfico ao lado de um número. */
export const TENDENCIA = [
  { name: 'Acessos', data: [120, 160, 140, 190, 210, 260] },
] satisfies ChartSeries[];

/**
 * Cor autoral de série. Fora da paleta `--chart-*` de propósito: se saísse dela,
 * a story não conseguiria distinguir "veio do autor" de "veio do tema".
 */
export const AUTHOR_COLOR = '#7c3aed';

/** A mesma cor como o navegador a devolve em estilo calculado. */
export const AUTHOR_COLOR_PAINTED = 'rgb(124, 58, 237)';

/** Primeira série com cor autoral; a segunda continua saindo do tema. */
export const SERIES_AUTHOR_COLOR = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214], color: AUTHOR_COLOR },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
] satisfies ChartSeries[];

/**
 * Dado imperfeito, na forma em que ele chega de uma API de verdade.
 *
 * Duas bordas de uma vez, e as duas moram na alternativa textual: casa decimal
 * (o desenho arredonda no eixo, a tabela não pode inventar dígito) e SÉRIE MAIS
 * CURTA que o eixo de categorias — três meses sem medição, que a tabela precisa
 * declarar como ausentes em vez de escrever zero.
 */
export const SERIES_PARTIAL = [
  { name: 'Desktop', data: [12.5, 3.456, 42.375, 9.99, 20, 31] },
  { name: 'Mobile', data: [8, 11, 6] },
] satisfies ChartSeries[];

/** O que a tabela deve escrever para a série decimal acima. */
export const PARTIAL_FORMATTED = ['12.5', '3.46', '42.38', '9.99', '20', '31'];

/**
 * Rosca cujas fatias somam zero.
 *
 * O período sem nenhum acesso existe, e não é o estado vazio: há três
 * categorias, elas só não tiveram movimento. A participação de cada uma é
 * indefinida, e é isso que a coluna precisa dizer.
 */
export const ZERO_TOTAL: ChartDataPoint[] = [
  { label: 'Desktop', value: 0 },
  { label: 'Mobile', value: 0 },
  { label: 'Tablet', value: 0 },
];

/** Um ponto só — o menor dataset que ainda é um gráfico, e não o estado vazio. */
export const SINGLE_POINT: ChartDataPoint[] = [{ label: 'Jan', value: 186 }];

// ─── Contraste ────────────────────────────────────────────────────────────────

export type RGB = [number, number, number];

/** `rgb(r, g, b)` / `rgba(...)` como o navegador devolve em computed style. */
export function rgbColor(css: string): RGB | null {
  const nums = css.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  return [Number(nums[0]) / 255, Number(nums[1]) / 255, Number(nums[2]) / 255];
}

function luminancia([r, g, b]: RGB): number {
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razão de contraste WCAG entre duas cores já em RGB 0..1. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Resolve um token de cor do design system, no tema ativo, para RGB.
 *
 * Os tokens guardam os três componentes de HSL soltos (`199 89% 65%`) para que
 * o CSS possa compor `hsl(var(--x) / 0.5)`. Lê o valor bruto e converte — sem
 * criar elemento de sonda, que exigiria escrever estilo inline.
 */
export function rgbToken(token: string, insideOf: Element = document.documentElement): RGB | null {
  const raw = getComputedStyle(insideOf).getPropertyValue(token).trim();
  const nums = raw.match(/-?[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  return rgbHsl(Number(nums[0]), Number(nums[1]), Number(nums[2]));
}

function rgbHsl(h: number, s: number, l: number): RGB {
  const sat = s / 100;
  const luz = l / 100;
  const a = sat * Math.min(luz, 1 - luz);
  const canal = (n: number) => {
    const k = (n + h / 30) % 12;
    return luz - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
  };
  return [canal(0), canal(8), canal(4)];
}

// ─── Leitura do desenho ───────────────────────────────────────────────────────
//
// O motor é o Apache ECharts com o renderizador SVG: cada forma é um nó do DOM,
// e é por isso que o renderizador de tela não serve aqui — contraste e trama se
// medem, não se afirmam.
//
// Duas camadas por forma de dado, exatamente como no desenho à mão que veio
// antes: a lib emite o caminho preenchido com a cor da série e, por cima, um
// segundo caminho com a TRAMA (`Path._decalEl` do zrender), que herda o mesmo
// contorno. Daí os dois coletores abaixo.
//
// ─── Por que os coletores excluem duas populações ────────────────────────────
//
// O `<svg>` que o zrender emite é PLANO: não há um `<g>` por componente. Legenda,
// eixo, grade e série são todos irmãos dentro do mesmo `<g>` raiz (`Painter.js`
// só cria o `g` principal e os grupos de recorte). Varrer o `<svg>` inteiro,
// portanto, não recolhe "as formas do gráfico" — recolhe também a decoração da
// lib. Medido no DOM real, viewport 1200x800, em 2026-08-26:
//
//   Bar (6 barras)          → 10 formas preenchidas: 6 barras + 4 paths de pattern
//   MultiSeries (12 barras) → 25: 12 barras + 1 fundo de legenda + 2 ícones
//                                 + 10 paths de pattern
//   Pie (3 fatias)          → 21: 3 fatias + 1 fundo + 3 ícones + 14 de pattern
//   MultiSeries, cores      → 4 cores distintas em vez de 2: as duas séries,
//                             mais o fundo da legenda e o branco do pattern
//
// 1. O INTERIOR DE `<defs>`. O decal exige um `<pattern>`, e o interior dele é
//    feito de `<path>` com cor chapada; o recorte de série (`area`) põe outro
//    `<path>` dentro de um `<clipPath>`. Nada disso é desenhado — é vocabulário
//    referenciado por `url(#…)`. Eles atravessavam o filtro porque `getBBox()`
//    devolve a geometria própria do caminho mesmo para elemento não renderizado
//    (1x4, 4.8x4.8, e 1128x504 no recorte), enquanto `getBoundingClientRect()`
//    devolve 0x0. A exclusão é estrutural de propósito — depender do 0x0 seria
//    excluir por efeito colateral de layout, e o dia em que o navegador mudasse
//    esse detalhe o defeito voltaria calado.
//
// 2. A LEGENDA. Ela não é subárvore no DOM (ver acima: tudo é irmão), mas TEM
//    caixa: a lib desenha o fundo da legenda como um `<path>` com
//    `fill-opacity="0"` — retângulo transparente, o único do desenho — e é
//    exatamente o retângulo que envolve ícones e rótulos. Esse fundo é, então,
//    a definição operacional de "dentro da legenda": quem cabe nele é legenda.
//    Sem ele (uma série só, ou `compact`) não há legenda nenhuma e nada é
//    excluído. O que vazava por aqui: o próprio fundo (bbox 143x22) e os ícones,
//    que saem com `stroke-width="2"` literal — e faziam a story de contraste
//    reprovar ao exigir contorno de 1px em toda forma de dado.
//
// A tentação óbvia era filtrar por `stroke-width`: o contorno de dado sai em
// 1px e o ícone de legenda em 2px. Não serve — o símbolo de ponto de `line`
// sai em 0.44px, e o filtro passaria a excluir forma de dado de verdade. A
// contagem encolheria em silêncio, que é o defeito que o `source-snippets.test`
// já cobrou uma vez: portão verde medindo menos.
//
// Corolário para quem for "simplificar" isto: as contagens esperadas nas stories
// são o NÚMERO DE DADOS (6 barras, 3 fatias, 2 séries). Se um coletor voltar a
// divergir, o número esperado não é o que se ajusta.

/**
 * Espera a ANIMAÇÃO DE ENTRADA fechar. Precondição de todo coletor abaixo.
 *
 * "O desenho pintou" é cedo demais para quem vai CONTAR formas: enquanto a
 * entrada corre, cada forma sai com `fill-opacity="0"` e sobe até 1. E isso
 * não borra a medida — mede outra coisa. O único elemento que TERMINA em
 * `fill-opacity="0"` é o fundo da legenda, e é justamente por essa marca que
 * `caixaDaLegenda` o encontra; no meio da animação há um candidato por forma
 * desenhada, o primeiro deles uma faixa do funil, e a caixa da legenda sai
 * sendo a primeira faixa. Nada mais é excluído como legenda, e um funil de
 * quatro etapas devolve oito formas.
 *
 * Por isso a condição de parada é a própria invariante que o coletor assume:
 * no máximo UM `fill-opacity="0"` no desenho. Sem legenda o número é zero e a
 * espera passa direto; com `prefers-reduced-motion` não há animação e também
 * não há o que esperar.
 *
 * O TÍTULO desenhado é a exceção medida, e por isso o número é parâmetro: ele
 * traz o próprio retângulo transparente de fundo, e um gráfico com título e
 * legenda estabiliza em DOIS — a espera fixa em um nunca fechava. Quem passa
 * outro número declara o que há na tela; o padrão continua sendo o caso comum.
 *
 * Corolário para quem depender de `formasPreenchidas` junto de um título: com
 * dois retângulos transparentes, `caixaDaLegenda` pode pegar o do título, e aí
 * os ícones da legenda deixam de ser excluídos. Contagem exata de formas e
 * título desenhado não combinam — meça posição, não quantidade.
 */
export async function drawingSettled(root: ParentNode, transparentes = 1): Promise<void> {
  await waitFor(
    () => expect(root.querySelectorAll('svg path[fill-opacity="0"]').length)
      .toBeLessThanOrEqual(transparentes),
    { timeout: 3000 },
  );
}

/** Molde e recorte referenciados por `url(#…)`: vocabulário, não desenho. */
function emDefs(forma: Element): boolean {
  return forma.closest('defs') !== null;
}

/**
 * A caixa da legenda, lida do retângulo transparente que a própria lib desenha
 * como fundo dela. `null` quando o gráfico não tem legenda.
 */
function caixaDaLegenda(root: ParentNode): DOMRect | null {
  const background = root.querySelector<SVGGraphicsElement>('svg path[fill-opacity="0"]');
  return background ? background.getBoundingClientRect() : null;
}

/**
 * Há legenda desenhada?
 *
 * Lê o mesmo retângulo transparente que serve de caixa a ela, então responde
 * pela definição operacional dos coletores abaixo — e não por um seletor
 * paralelo que poderia discordar deles. Exige o desenho ASSENTADO: no meio da
 * animação toda forma carrega a marca, e a resposta seria sempre `true`.
 */
export function hasLegend(root: ParentNode): boolean {
  return caixaDaLegenda(root) !== null;
}

/** Cabe inteiro na caixa da legenda — a folga de 1px cobre arredondamento. */
function naLegenda(forma: SVGGraphicsElement, caixa: DOMRect | null): boolean {
  if (!caixa) return false;
  const r = forma.getBoundingClientRect();
  return r.left >= caixa.left - 1 && r.right <= caixa.right + 1
    && r.top >= caixa.top - 1 && r.bottom <= caixa.bottom + 1;
}

function temArea(forma: SVGGraphicsElement): boolean {
  const caixa = forma.getBBox();
  return caixa.width > 0 && caixa.height > 0;
}

/** O elemento em que a lib desenha — leva o papel de imagem e o rótulo. */
export function desenhoDe(chart: Element): HTMLElement {
  return chart.querySelector<HTMLElement>('[data-slot="chart-canvas"]')!;
}

/** Caminhos preenchidos com cor de série (a camada de baixo). */
export function formasPreenchidas(root: ParentNode): SVGPathElement[] {
  const legenda = caixaDaLegenda(root);
  return [...root.querySelectorAll<SVGPathElement>('path[fill]')].filter((forma) => {
    const fill = forma.getAttribute('fill') ?? 'none';
    if (fill === 'none' || fill.startsWith('url(')) return false;
    return !emDefs(forma) && !naLegenda(forma, legenda) && temArea(forma);
  });
}

/** Caminhos preenchidos com a trama (a camada de cima, e a que contorna). */
export function formasComTrama(root: ParentNode): SVGPathElement[] {
  const legenda = caixaDaLegenda(root);
  return [...root.querySelectorAll<SVGPathElement>('path[fill^="url("]')].filter(
    (forma) => !emDefs(forma) && !naLegenda(forma, legenda) && temArea(forma),
  );
}

// ─── Coletores do radar ───────────────────────────────────────────────────────
//
// O radar desenha MAIS de uma forma preenchida por série, e é por isso que ele
// precisa dos seus: além da área fechada, cada vértice é um símbolo, também
// preenchido com a cor da série. Medido no DOM real, cinco eixos e duas séries:
// 2 caminhos de área, 10 de símbolo, 2 de traçado (sem preenchimento) e o resto
// é grade, eixo, legenda e o interior dos `<pattern>`. `formasPreenchidas`
// devolveria doze formas para duas séries — todas legítimas, nenhuma delas o que
// a story do radar promete contar.
//
// O que separa a área do resto é a TRANSLUCIDEZ, e ela não é acidente de
// desenho: a área do radar é translúcida DE PROPÓSITO, para que um polígono não
// apague o que está embaixo dele — que é justamente a comparação que o radar
// existe para mostrar. Símbolo, ícone de legenda e molde de trama saem opacos. E
// o critério reprova por onde tem de reprovar: sem `areaStyle` a lib não desenha
// área nenhuma, e a contagem cai a zero em vez de escorregar para outra forma.
//
// Uma advertência para quem for procurar por elemento: o motor de tela emite
// `<polygon>` e `<polyline>` para a área e para o contorno, mas o painter que
// roda no navegador reduz TUDO a `<path>` — medido, zero `<polygon>` no DOM
// real. Seletor de elemento aqui devolve lista vazia, e lista vazia num coletor
// é o portão que passa a medir nada.

/** Preenchimento translúcido — nem apagado, nem opaco. */
function translucida(forma: SVGGraphicsElement): boolean {
  const opacidade = Number.parseFloat(getComputedStyle(forma).fillOpacity || '1');
  return opacidade > 0 && opacidade < 1;
}

/** A área fechada de cada série do radar — a camada de cor. */
export function radarPolygons(root: ParentNode): SVGPathElement[] {
  return formasPreenchidas(root).filter(translucida);
}

/**
 * A trama de CADA área do radar — a camada de cima.
 *
 * O gêmeo hachurado herda o estilo do original, translucidez inclusive, então o
 * mesmo critério separa a trama da área da trama dos símbolos. Contá-la ao lado
 * de `radarPolygons`, com o mesmo número esperado, é o que impede um coletor que
 * exclui demais de ficar verde medindo menos.
 */
export function radarHatches(root: ParentNode): SVGPathElement[] {
  return formasComTrama(root).filter(translucida);
}

/** Traçados de série: sem preenchimento e mais grossos que eixo e grade. */
export function tracadosDeSerie(root: ParentNode): SVGPathElement[] {
  const legenda = caixaDaLegenda(root);
  return [...root.querySelectorAll<SVGPathElement>('path[fill="none"]')].filter((forma) => {
    if (emDefs(forma) || naLegenda(forma, legenda)) return false;
    const grossura = Number.parseFloat(getComputedStyle(forma).strokeWidth);
    return grossura >= 2 && forma.getTotalLength() > 0;
  });
}

/** Todo o texto escrito dentro do desenho — eixo, legenda, título, valor. */
export function textosDoDesenho(root: ParentNode): string[] {
  return [...root.querySelectorAll('svg text')].map((no) => (no.textContent ?? '').trim());
}

/** Duas cores são a mesma dentro da tolerância de arredondamento do navegador. */
export function mesmaCor(a: RGB, b: RGB, tolerancia = 0.01): boolean {
  return [0, 1, 2].every((canal) => Math.abs(a[canal] - b[canal]) < tolerancia);
}

/**
 * Option já resolvida pela lib, lida da instância montada no elemento.
 *
 * Serve para o que é decisão de configuração e não vira nó do DOM — símbolo de
 * ponto e desenho de traço por série. O que vira pixel continua sendo medido no
 * DOM: option verde com desenho errado é exatamente o portão sem dentes.
 */
export function optionOf(desenho: HTMLElement): { series: Record<string, unknown>[] } {
  return instanciaDe(desenho).getOption() as unknown as { series: Record<string, unknown>[] };
}

/** A instância viva da lib. O `id` distingue recolorir de remontar. */
export function instanciaDe(desenho: HTMLElement): ECharts {
  return getInstanceByDom(desenho)!;
}
