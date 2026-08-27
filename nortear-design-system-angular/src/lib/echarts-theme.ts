// ─── ECharts theme builder ────────────────────────────────────────────────────
// Bridge entre tokens CSS do Nortear e o sistema de tema do ECharts.
//
// Responsabilidades:
//   1. buildNortearTheme()      → JSON do tema lido dos tokens resolvidos no <html>.
//   2. registerNortearTheme()   → registra o tema no echarts core.
//   3. watchTheme(callback)     → MutationObserver no <html> dispara callback
//      quando classe muda (tema/dark/densidade/fonte) — consumer re-aplica.
//
// Os tamanhos de texto NÃO são números cravados: nascem do tamanho de fonte
// RAIZ resolvido, porque o componente que este tema serve prometia, desde o
// desenho em SVG à mão, que "aumentar a fonte do navegador aumenta o rótulo do
// eixo junto" (WCAG 1.4.4). O ECharts exige número em pixel — então o número é
// medido, não escolhido.

import * as echarts from 'echarts/core';

// ─── Tipo do tema ─────────────────────────────────────────────────────────────

export interface NortearChartTheme {
  color: string[];
  backgroundColor: string;
  textStyle: { color: string; fontFamily: string; fontSize: number };
  title: { textStyle: { color: string; fontFamily: string; fontWeight: number; fontSize: number } };
  legend: { textStyle: { color: string; fontSize: number }; itemGap: number };
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
  radar: ChartRadarStyle;
}

/**
 * O bloco do radar — e ele responde por DUAS coisas ao mesmo tempo.
 *
 * `radar` é nome de série e nome de componente na lib, e a resolução de tema usa
 * chaves diferentes para cada um: a série procura o tipo dela (`radar`), o
 * componente procura o tipo dele (`radar`). Cai no mesmo lugar. Medido: o mesmo
 * bloco chega aos dois, e cada um lê o que lhe diz respeito — o componente pega
 * eixo, grade e nome do eixo, a série pega o contorno do símbolo; o que sobra de
 * um lado é ignorado do outro. Por isso os dois vivem aqui, e não em dois blocos
 * que a lib não saberia distinguir.
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
  // Sintaxe com VÍRGULA, e não a moderna separada por espaço.
  //
  // O navegador entende as duas; o analisador de cor da lib entende só esta.
  // Medido contra `zrender/lib/tool/color`:
  //
  //   parse("hsl(350 72% 36%)")   → undefined
  //   parse("hsl(350, 72%, 36%)") → [158, 26, 48, 1]
  //
  // O desenho PARADO pintava certo, porque quem lê o atributo ali é o
  // navegador. O defeito aparecia quando a lib precisava CALCULAR uma cor — e
  // o realce do ponteiro é exatamente isso: sem conseguir ler a base, ela
  // devolvia `fill: none`, e a forma sob o mouse desaparecia junto com a trama
  // dela. Valia para todo tipo de gráfico e para as cinco stacks.
  const partes = raw.split(/\s+/);
  if (partes.length < 3) return alpha === 1 ? `hsl(${raw})` : `hsla(${raw} / ${alpha})`;
  const [h, s, l] = partes;
  return alpha === 1 ? `hsl(${h}, ${s}, ${l})` : `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

function cssToken(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Tamanho de fonte raiz, em pixels.
 *
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()` e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado.
 * O que é mensurável — e o que de fato muda quando a pessoa aumenta a fonte do
 * navegador ou troca a fonte pela barra de ferramentas — é o `font-size`
 * resolvido do `<html>`.
 */
export function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const medida = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(medida) && medida > 0 ? medida : 16;
}

/**
 * Degrau tipográfico do desenho, em pixels, relativo à fonte raiz.
 *
 * Exportado porque o espaço que o desenho reserva para título e legenda é
 * medido no MESMO degrau do texto que vai ali dentro: cravar 48px reserva
 * espaço para a fonte de hoje e corta o rótulo quando a pessoa aumenta a do
 * navegador (WCAG 1.4.4). Quem precisa de pixel pede o degrau, não o número.
 */
export function scaled(fator: number): number {
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
  // `--text-control`, que é o tamanho do título.
  const bodySize = scaled(0.75);
  const titleSize = scaled(0.875);

  const axisStyle: ChartAxisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted, fontSize: bodySize },
    // O NOME do eixo — a grandeza que a posição mede. Só a dispersão o usa hoje;
    // nos tipos de categoria não há nome a colocar.
    //
    // A folga mora no TEMA, e não no construtor de option: o nome é texto e
    // cresce com a fonte do navegador (WCAG 1.4.4), e o tema é o que já se
    // reconstrói quando a fonte raiz muda.
    nameGap: Math.round(bodySize * 2.2),
    nameTextStyle: { color: muted, fontSize: bodySize },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };

  return {
    // Oito séries, e a ORDEM não é decorativa: cada posição é a cor que mais se
    // afasta em matiz das anteriores — a menor separação é de 38° dentro das
    // cinco primeiras e de 20° dentro das oito. Reordenar aproxima matizes
    // vizinhas e devolve ao desenho o problema que a ordem resolve.
    color: [
      hsl('chart-1'), hsl('chart-2'), hsl('chart-3'), hsl('chart-4'),
      hsl('chart-5'), hsl('chart-6'), hsl('chart-7'), hsl('chart-8'),
    ],
    backgroundColor: 'transparent',
    textStyle: { color: fg, fontFamily, fontSize: bodySize },
    title: { textStyle: { color: fg, fontFamily, fontWeight: 600, fontSize: titleSize } },
    legend: {
      textStyle: { color: muted, fontSize: bodySize },
      // A folga ENTRE os itens da legenda sai da fonte, não de um pixel cravado.
      // O padrão da lib é 10px fixos, e com o nome de cada série ao lado do
      // ícone os itens encostam — em legenda de muitos itens, como a da rosca
      // aninhada, a lista lê como um bloco só.
      //
      // Derivada do corpo, ela cresce junto com o texto quando a pessoa aumenta
      // a fonte do navegador (WCAG 1.4.4): cravada, a folga encolheria em
      // proporção a cada degrau de aumento, que é o oposto do que se quer.
      itemGap: Math.round(bodySize * 2),
    },
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
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta, e quem
    // sustenta isso é o CONTORNO em --foreground, que passa de 3:1 em qualquer
    // tema. Ele nasceu quando as cores de série iam de 2.07 a 13.23 no claro e
    // de 1.00 a 6.41 no escuro — uma delas ERA o fundo, com contraste 1.00, e
    // sumia. Com a paleta por modo o pior caso passou a 7.32 no claro e 6.83 no
    // escuro, nos três temas, e a cor sozinha já sustentaria o critério; o
    // contorno fica porque a medida contra o FUNDO não diz nada sobre a
    // fronteira entre duas formas VIZINHAS — barras encostadas, fatias
    // adjacentes —, e é essa fronteira que o traço delimita. É o mesmo contorno
    // que o desenho em SVG à mão traçava, e o motivo de ele existir não mudou
    // com a troca de motor.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O símbolo da dispersão é a única marca do tipo, e é pequeno: sem contorno
    // ele se perde contra o fundo e contra o vizinho. Traço de 1px, como barra e
    // fatia — o de 2px do traçado existe porque lá a linha é o objeto, e aqui
    // engrossar comeria a forma por dentro, que é justamente a pista.
    scatter: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O radar traz EIXOS PRÓPRIOS, e é por isso que ele precisa de bloco aqui.
    //
    // Os outros tipos desenham no cartesiano ou não desenham em eixo nenhum, e
    // `categoryAxis`/`valueAxis` acima já os cobrem. O radar tem os seus, com
    // nomes de chave só dele (`axisName`, `splitLine`, `axisLine`,
    // `splitArea`), e sem esta entrada eles saem com o padrão da lib: cinzas
    // fixos, alheios ao tema, ao modo e à fonte. Um gráfico do design system com
    // eixos que não são do design system.
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
    // fundo escuro viram uma lavagem clara por baixo do desenho inteiro. A malha
    // que informa já está nos anéis, em `--border`; a faixa não acrescenta
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
