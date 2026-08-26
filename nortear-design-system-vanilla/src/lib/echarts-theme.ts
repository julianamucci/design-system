// ─── ECharts theme builder ────────────────────────────────────────────────────
// Bridge entre tokens CSS do Nortear e o sistema de tema do ECharts.
//
// Responsabilidades:
//   1. buildNortearTheme()      → JSON do tema lido dos tokens resolvidos no <html>.
//   2. registerNortearTheme()   → registra o tema no echarts core.
//   3. watchTheme(callback)     → MutationObserver no <html> dispara callback
//      quando classe muda (tema/dark/densidade/fonte) — consumer re-aplica.

import * as echarts from 'echarts/core';

// ─── Tipo do tema ─────────────────────────────────────────────────────────────

export interface NortearChartTheme {
  color: string[];
  backgroundColor: string;
  textStyle: { color: string; fontFamily: string; fontSize: number };
  title: { textStyle: { color: string; fontFamily: string; fontWeight: number; fontSize: number } };
  legend: { textStyle: { color: string; fontSize: number } };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    textStyle: { color: string; fontSize: number };
  };
  axisPointer: { lineStyle: { color: string } };
  categoryAxis: ChartAxisStyle;
  valueAxis: ChartAxisStyle;
  logAxis: ChartAxisStyle;
  timeAxis: ChartAxisStyle;
  line: { itemStyle: { borderColor: string; borderWidth: number }; lineStyle: { width: number } };
  bar: { itemStyle: { borderColor: string; borderWidth: number } };
  pie: { itemStyle: { borderColor: string; borderWidth: number } };
  scatter: { itemStyle: { borderColor: string; borderWidth: number } };
  funnel: { itemStyle: { borderColor: string; borderWidth: number } };
  radar: ChartRadarStyle;
}

/**
 * O bloco do radar — e ele responde por DUAS coisas ao mesmo tempo.
 *
 * `radar` é nome de série e nome de componente na lib, e a resolução de tema
 * usa chaves diferentes para cada um: a série procura o tipo dela (`radar`), o
 * componente procura o tipo dele (`radar`). Cai no mesmo lugar. Medido: o mesmo
 * bloco chega aos dois, e cada um lê o que lhe diz respeito — o componente pega
 * eixo, grade e nome do eixo, a série pega o contorno do símbolo; o que sobra
 * de um lado é ignorado do outro. Por isso os dois vivem aqui, e não em dois
 * blocos que a lib não saberia distinguir.
 */
interface ChartRadarStyle {
  axisName: { color: string; fontSize: number };
  axisLine: { lineStyle: { color: string } };
  splitLine: { lineStyle: { color: string } };
  splitArea: { show: boolean; areaStyle: { color: string[] } };
  itemStyle: { borderColor: string; borderWidth: number };
}

interface ChartAxisStyle {
  axisLine: { show: boolean; lineStyle: { color: string } };
  axisTick: { show: boolean; lineStyle: { color: string } };
  axisLabel: { show: boolean; color: string; fontSize: number };
  nameGap: number;
  nameTextStyle: { color: string; fontSize: number };
  splitLine: { show: boolean; lineStyle: { color: string[] | string } };
  splitArea: { show: boolean; areaStyle: { color: string[] } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lê token HSL e devolve cor CSS válida (alpha=1 → hsl, alpha<1 → hsla). */
export function hsl(token: string, alpha = 1): string {
  if (typeof document === 'undefined') return 'transparent';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  if (!raw) return 'transparent';
  return alpha === 1 ? `hsl(${raw})` : `hsla(${raw} / ${alpha})`;
}

function cssToken(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Tamanho de fonte raiz, em pixels.
 *
 * A lib de gráfico só aceita NÚMERO em pixel para tamanho de texto — não existe
 * `em`, não existe `rem`, não existe token. Número escolhido à mão fica surdo
 * ao navegador: o tema não declarava `fontSize` nenhum, então valia o padrão da
 * lib (12) para rótulo, legenda e dica, e o option cravava 14 no título.
 * Nenhum dos dois crescia quando a pessoa aumentava a fonte do navegador,
 * enquanto a frase do estado vazio — que é CSS — crescia ao lado, no mesmo
 * componente. Em 200% o desenho ficava com o texto do tamanho de 100% (WCAG
 * 1.4.4).
 *
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()`, e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado. O
 * que é mensurável — e o que de fato muda quando a fonte do navegador muda ou a
 * barra de ferramentas troca a família — é o `font-size` resolvido do `<html>`.
 * Daí o número sai medido, não escolhido.
 */
export function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const medida = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(medida) && medida > 0 ? medida : 16;
}

/** Degrau tipográfico do desenho, em pixels, relativo à fonte raiz. */
function scaled(fator: number): number {
  return Math.round(rootFontSize() * fator);
}

// ─── Theme builder ────────────────────────────────────────────────────────────

export function buildNortearTheme(): NortearChartTheme {
  const fontFamily =
    cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const border = hsl('border');
  const card = hsl('card');

  // 0.75 = 12px na base 16, o degrau `--text-control-sm`; 0.875 = 14px, o
  // `--text-control`. São exatamente os números que estavam cravados antes —
  // o que muda é que agora eles acompanham a fonte raiz em vez de ignorá-la.
  const bodySize = scaled(0.75);
  const titleSize = scaled(0.875);

  const axisStyle: ChartAxisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted, fontSize: bodySize },
    // O NOME do eixo — a grandeza que a posição mede. Só a dispersão o usa
    // hoje; nos tipos de categoria não há nome a colocar, e estas duas linhas
    // não têm efeito.
    //
    // A folga mora no TEMA, e não no construtor de option, por dois motivos que
    // andam juntos. O primeiro é que o nome é texto e cresce com a fonte do
    // navegador (WCAG 1.4.4): cravado em pixel, ele encostaria nos números do
    // eixo no primeiro degrau de aumento, e o tema é o que já se reconstrói
    // quando a fonte raiz muda — é dele que sai o `fontSize` de todo o resto.
    // O segundo é que ler a fonte raiz exige o DOM, e os construtores de option
    // são PUROS de propósito: uma folga calculada lá dentro tornaria impura uma
    // função que hoje se verifica sem navegador.
    nameGap: Math.round(bodySize * 2.2),
    nameTextStyle: { color: muted, fontSize: bodySize },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };

  return {
    // Oito séries, e a ORDEM não é decorativa: cada posição é a cor que mais se
    // afasta em matiz das anteriores — a menor separação é de 38° dentro das
    // cinco primeiras e de 20° dentro das oito. Reordenar aproxima matizes
    // vizinhas e devolve ao desenho o problema que a ordem resolve. A paleta
    // também tem variante por modo: a mesma cor não servia à página quase
    // branca e ao fundo quase preto, e no escuro uma das séries chegava a
    // medir 1.00 contra o fundo — invisível. Medido agora, o pior caso é 7.32
    // no claro e 6.83 no escuro, nos três temas de marca.
    color: [
      hsl('chart-1'), hsl('chart-2'), hsl('chart-3'), hsl('chart-4'),
      hsl('chart-5'), hsl('chart-6'), hsl('chart-7'), hsl('chart-8'),
    ],
    backgroundColor: 'transparent',
    textStyle: { color: fg, fontFamily, fontSize: bodySize },
    title: { textStyle: { color: fg, fontFamily, fontWeight: 600, fontSize: titleSize } },
    legend: { textStyle: { color: muted, fontSize: bodySize } },
    tooltip: {
      backgroundColor: card,
      borderColor: border,
      textStyle: { color: fg, fontSize: bodySize },
    },
    axisPointer: { lineStyle: { color: hsl('primary', 0.5) } },
    categoryAxis: axisStyle,
    valueAxis: axisStyle,
    logAxis: axisStyle,
    timeAxis: axisStyle,
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta, e o
    // CONTORNO em --foreground é quem entrega isso: passa de 3:1 em qualquer
    // tema, qualquer que seja a cor de série. Ele nasceu quando a paleta ficava
    // em torno de 2:1 contra o fundo; hoje ela mede 7.32 no pior caso claro e
    // 6.83 no escuro e sustentaria o critério sozinha, mas o contorno continua
    // porque a medida contra o FUNDO não diz nada sobre a fronteira entre duas
    // formas VIZINHAS — barras encostadas, fatias adjacentes —, e é essa
    // fronteira que o traço delimita. O nome anterior
    // (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha efeito
    // nenhum na v5 — o contorno documentado nunca chegou a ser desenhado.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O símbolo da dispersão é a única marca do tipo, e é pequeno: sem contorno
    // ele se perde contra o fundo e contra o símbolo vizinho. Traço de 1px, como
    // barra e fatia — o de 2px do traçado existe porque lá a linha é o objeto, e
    // aqui engrossar comeria a forma por dentro, que é justamente a pista.
    scatter: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O funil entra pela mesma porta que as outras séries de área: o contorno é
    // do TEMA, não do option. É o que faz a troca de tema recolorir o traço no
    // lugar, por `setTheme`, sem remontar o desenho — no option ele ficaria
    // congelado na cor do tema em que a instância nasceu. E é o contorno que
    // separa uma faixa da seguinte, que aqui se tocam de perto.
    funnel: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O radar traz EIXOS PRÓPRIOS, e é por isso que ele precisa de bloco aqui.
    //
    // Os outros tipos desenham no cartesiano ou não desenham em eixo nenhum, e
    // `categoryAxis`/`valueAxis` acima já os cobrem. O radar tem os seus, com
    // nomes de chave só dele (`axisName`, `splitLine`, `axisLine`,
    // `splitArea`), e sem esta entrada eles saem com o padrão da lib: cinzas
    // fixos, alheios ao tema, ao modo e à fonte. Um gráfico do design system
    // com eixos que não são do design system.
    //
    // O NOME DO EIXO é texto, então segue a regra do texto: cor de
    // `--muted-foreground`, como o rótulo do eixo cartesiano e a legenda, e
    // tamanho no mesmo degrau MEDIDO — nunca pixel escolhido, senão ele para de
    // crescer com a fonte do navegador (WCAG 1.4.4).
    //
    // A GRADE e o EIXO usam `--border`, nas mesmas duas intensidades do
    // cartesiano: o traço que sai do centro é o eixo (0.6), os anéis são grade
    // (0.3). Assim o radar e o gráfico de barras ao lado dele desenham a mesma
    // malha.
    //
    // SPLITAREA DESLIGADO, e por dois motivos que se somam. O primeiro é de
    // desenho: o padrão da lib alterna DUAS faixas cinza entre os anéis, cores
    // cravadas que não vêm de token nenhum — sobre o fundo claro elas viram um
    // degrau que disputa com o preenchimento translúcido do polígono, e sobre o
    // fundo escuro viram uma lavagem clara por baixo do desenho inteiro. A
    // malha que informa já está nos anéis, em `--border`; a faixa não acrescenta
    // leitura, só um segundo fundo que o tema não escolheu. É a mesma decisão
    // que o eixo cartesiano aqui em cima já toma. O segundo é de medição, e foi
    // verificado plantando o defeito: uma das duas faixas sai com
    // `fill-opacity="0"`, e essa marca é justamente como as stories reconhecem o
    // fundo da legenda. Com a faixa ligada há DOIS retângulos transparentes na
    // tela, a espera de assentamento não fecha ("expected 2 to be less than or
    // equal to 1") e o coletor passaria a excluir a área errada.
    radar: {
      axisName: { color: muted, fontSize: bodySize },
      axisLine: { lineStyle: { color: hsl('border', 0.6) } },
      splitLine: { lineStyle: { color: hsl('border', 0.3) } },
      splitArea: { show: false, areaStyle: { color: ['transparent'] } },
      // Contorno do símbolo de vértice, pela mesma porta do traçado: no radar,
      // como na linha, a forma de dado é o ponto — o polígono já é delimitado
      // pelo próprio traço, na cor da série, e é o vértice que precisa se
      // separar do que está por baixo dele.
      itemStyle: { borderColor: fg, borderWidth: 2 },
    },
  };
}

// ─── Theme registration ───────────────────────────────────────────────────────

export const THEME_NAME = 'nortear';

/** Registra/sobrescreve o tema no echarts. Idempotente. */
export function registerNortearTheme(): void {
  // O cast é necessário porque o tipo público do registerTheme do echarts é
  // `Record<string, unknown>` (eles documentam o shape mas não exportam tipo).
  echarts.registerTheme(THEME_NAME, buildNortearTheme() as unknown as Record<string, unknown>);
}

// ─── Theme observer ───────────────────────────────────────────────────────────

/**
 * Observa mudanças na classe do <html> e dispara callback. Cleanup via return.
 */
export function watchTheme(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}
