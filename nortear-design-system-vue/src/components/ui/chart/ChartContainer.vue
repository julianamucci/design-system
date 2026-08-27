<!--
  ChartContainer — wrapper de vue-echarts. Substitui o wrapper anterior
  baseado em @unovis/vue. API agora é declarativa: `<ChartContainer :option="..." />`.
-->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import VChart from 'vue-echarts';
import {
  withNestLabelTokens,
  type NestLabelTokens,
} from '@shared/primitives/chart-nest-labels';
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, FunnelChart, RadarChart, ScatterChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent, RadarComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
import { cn } from '@/lib/utils';
import {
  CHART_EMPTY_LABEL, CHART_TABLE_LABELS, chartDecals, chartTable, isChartOptionEmpty,
} from './chart-state';
import type { HTMLAttributes } from 'vue';

// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada.
//
// O radar entra por DUAS portas, e é a única série daqui assim: `RadarChart` é
// o desenho, `RadarComponent` é o SISTEMA DE COORDENADAS em que ele desenha.
// Barra e linha desenham no cartesiano do `GridComponent`; rosca e funil não
// desenham em coordenada nenhuma. O radar traz a sua, e ela é um componente
// próprio — o option tem um bloco `radar` no primeiro nível, ao lado de
// `series`, e não dentro dela.
//
// A segunda porta está declarada, e a medição diz que hoje ela não é
// obrigatória: nesta versão o instalador de `RadarChart` já puxa o do
// componente, e removendo `RadarComponent` daqui o desenho continua saindo.
// Fica escrita mesmo assim, e não por precaução vaga — o que este `use` diz é
// de que módulos o componente depende, e o sistema de coordenadas é um deles.
// Inferir a dependência do detalhe de empacotamento de uma versão é como o
// registro some no dia em que o detalhe muda.
echarts.use([
  BarChart, LineChart, PieChart, FunnelChart, RadarChart, ScatterChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent, RadarComponent,
  SVGRenderer, CanvasRenderer,
]);

const props = defineProps<{
  option: echarts.EChartsCoreOption;
  class?: HTMLAttributes['class'];
  renderer?: 'svg' | 'canvas';
  /**
   * Altura do container em pixels. Existe porque a documentação mandava
   * definir a altura por uma classe utilitária de altura fixa do Tailwind —
   * vocabulário que saiu do projeto e não tem efeito em runtime. Sem valor
   * vale o `min-height` de `.nds-chart`.
   */
  height?: number;
  /** Frase mostrada no lugar do gráfico quando não há série com dado. */
  emptyLabel?: string;
  /**
   * Rótulo do desenho para leitor de tela — escreve-se `aria-label="…"` no
   * template, que é o mesmo nome em camelCase.
   *
   * É prop DECLARADA, e não atributo herdado, porque o componente precisa LER o
   * valor (para decidir o encadeamento de nome acessível) e, ao mesmo tempo,
   * NÃO aplicá-lo no estado vazio. Como atributo herdado ele fazia as duas
   * coisas erradas: chegava só via `useAttrs`, invisível para o tipo e para a
   * tabela de props, e a herança de atributos sobrescrevia o `undefined` que o
   * template define de propósito quando não há dado — o rótulo de imagem
   * pousava no `div` mesmo sem imagem alguma para nomear.
   */
  ariaLabel?: string;
  /**
   * Torna a alternativa textual visível para todo mundo, não só para leitor de
   * tela. Sem ela a tabela continua no DOM — o que muda é quem a enxerga.
   */
  showData?: boolean;
  /** Rótulo da coluna de categorias na alternativa textual. */
  categoryLabel?: string;
  /** Rótulo da coluna de valores quando a série não tem nome próprio. */
  valueLabel?: string;
  /**
   * Rótulo da coluna de participação — a que escreve o que o desenho diz pela
   * forma. Na rosca é a fatia contra o todo; no funil, a etapa contra a
   * primeira. O rótulo é o mesmo porque a leitura é a mesma: quanto disto
   * aquilo representa.
   */
  shareLabel?: string;
  /**
   * Rótulo da coluna de máximo do eixo — só o radar a tem.
   *
   * Existe pelo mesmo motivo da coluna de participação: o desenho comunica uma
   * RAZÃO, e o valor sozinho não a carrega. A diferença é o denominador, que
   * aqui muda de eixo para eixo e por isso precisa de uma célula por linha.
   */
  maxLabel?: string;
  /** Cabeçalho da primeira coluna da dispersão — ver `ChartTableLabels`. */
  seriesLabel?: string;
  /** Cabeçalho da coluna de grupo da rosca aninhada — ver `ChartTableLabels`. */
  groupLabel?: string;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

function hsl(token: string, alpha = 1): string {
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
 * A lib exige NÚMERO em pixel para todo texto do desenho — não aceita `rem`,
 * nem `calc()`, nem custom property. Cravar 12 e 14 era o caminho curto, e o
 * preço era o texto do gráfico não crescer quando a pessoa aumenta a fonte do
 * navegador (WCAG 1.4.4, texto a 200%), no MESMO componente cujo
 * `.nds-chart-empty` cresce porque usa `var(--text-control)`. Então o número
 * não é escolhido, é medido.
 *
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()`, e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado. O
 * que é mensurável — e o que de fato muda quando a fonte do navegador cresce ou
 * a barra de ferramentas troca a família — é o `font-size` resolvido do
 * `<html>`.
 */
/**
 * As cores e o degrau do rótulo da rosca aninhada, do tema em vigor.
 *
 * A trama do decal mora no TEMA e é recolorida sozinha por `setTheme`. O
 * rótulo não cabe lá — posição e texto rico diferem entre os dois anéis, e o
 * tema não distingue um do outro, porque as duas séries são `pie`. Ele viaja
 * no option, e por isso precisa ser REAPLICADO quando o tema muda.
 *
 * O degrau sai da fonte raiz, não de pixel cravado (WCAG 1.4.4).
 */
function nestLabelTokens(): NestLabelTokens {
  return {
    foreground: hsl('foreground'),
    background: hsl('background'),
    border: hsl('border'),
    muted: hsl('muted'),
    mutedForeground: hsl('muted-foreground'),
    fontSize: Math.round(rootFontSize() * 0.75),
  };
}

function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const measured = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(measured) && measured > 0 ? measured : 16;
}

/** Degrau tipográfico do desenho, em pixels, relativo à fonte raiz. */
function scaled(step: number): number {
  return Math.round(rootFontSize() * step);
}

function buildTheme() {
  const fontFamily = cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const card = hsl('card');
  const border = hsl('border');

  // 0.75 = 12px na base 16, o degrau `--text-control-sm`, que a lib usa como
  // padrão em rótulo de eixo, legenda e dica; 0.875 = 14px, o `--text-control`,
  // que é o tamanho do título. Na base 16 o desenho não muda de aparência —
  // muda o fato de que agora ele ACOMPANHA a fonte raiz.
  const bodySize = scaled(0.75);
  const titleSize = scaled(0.875);

  const axisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted, fontSize: bodySize },
    // O NOME do eixo — a grandeza que a posição mede. Só a dispersão o usa hoje;
    // nos tipos de categoria não há nome a colocar, e estas duas linhas não têm
    // efeito.
    //
    // A folga mora no TEMA, e não no construtor de option: o nome é texto e
    // cresce com a fonte do navegador (WCAG 1.4.4), e o tema é o que já se
    // reconstrói quando a fonte raiz muda. Calculá-la no construtor exigiria ler
    // o DOM, e os construtores são puros de propósito.
    nameGap: Math.round(bodySize * 2.2),
    nameTextStyle: { color: muted, fontSize: bodySize },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };
  return {
    // Oito séries, na ordem numérica dos tokens. A ordem é o desenho: cada cor
    // é a que MAIS se afasta das anteriores em matiz — 38° de separação mínima
    // dentro das cinco primeiras, 20° dentro das oito. Reordenar aqui aproxima
    // séries vizinhas e desfaz a escolha feita no tema.
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
    // A trama do decal entra pelo TEMA, e não pelo option, porque a cor dela é
    // valor de tema: traçada no fundo da página, ela é recolorida por
    // `setTheme` junto com a paleta. No option ficaria congelada na cor do tema
    // em que o desenho nasceu. O porquê de não usar a lista padrão da lib está
    // em `chartDecals` — em resumo, a trama dela é preto a 20% e se destaca do
    // preenchimento entre 1.14 e 1.54.
    aria: { decal: { decals: chartDecals(hsl('background', HATCH_OPACITY)) } },
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta. A
    // paleta de série passa disso por conta própria desde que ganhou variante
    // por modo — pior caso medido, 7.32 no claro e 6.83 no escuro —, mas o
    // CONTORNO em --foreground continua: é ele que delimita o objeto seja qual
    // for a paleta que um tema derivado escolher, e é ele que separa duas
    // formas VIZINHAS, que o contraste contra o fundo não mede. O nome anterior
    // (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha efeito
    // nenhum na v5 — o contorno documentado nunca chegou a ser desenhado.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O símbolo da dispersão é a única marca do tipo, e é pequeno: sem contorno
    // ele se perde contra o fundo e contra o vizinho. Traço de 1px, como barra e
    // fatia — o de 2px do traçado existe porque lá a linha é o objeto, e aqui
    // engrossar comeria a forma por dentro, que é justamente a pista.
    scatter: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // A faixa do funil é forma cheia como a barra e a fatia, e pelo mesmo
    // motivo leva contorno: ele separa uma etapa da ETAPA VIZINHA, que encosta
    // nela, e nenhuma medida contra o fundo cobre isso. A chave é o próprio
    // nome do tipo de série — é assim que a lib casa tema com série.
    funnel: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    // O radar traz EIXOS PRÓPRIOS, e é por isso que ele precisa de bloco aqui.
    //
    // Os outros tipos desenham no cartesiano ou não desenham em eixo nenhum, e
    // `categoryAxis`/`valueAxis` acima já os cobrem. O radar tem os seus, com
    // nomes de chave só dele (`axisName`, `axisLine`, `splitLine`,
    // `splitArea`), e sem esta entrada eles saem com o padrão da lib: cinzas
    // fixos, alheios ao tema, ao modo e à fonte. Um gráfico do design system
    // com eixos que não são do design system.
    //
    // Um bloco só serve a duas coisas: `radar` é nome de série E nome de
    // componente na lib, e a resolução de tema cai no mesmo lugar para os dois.
    // Cada um lê o que lhe diz respeito — o componente pega eixo, grade e nome
    // do eixo; a série pega o contorno do símbolo —, e o que sobra de um lado é
    // ignorado do outro.
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
    // `fill-opacity="0"`, e essa marca é justamente como as stories reconhecem
    // o fundo da legenda. Com a faixa ligada há DOIS retângulos transparentes
    // na tela e a espera de assentamento nunca fecha.
    radar: {
      axisName: { color: muted, fontSize: bodySize },
      axisLine: { lineStyle: { color: hsl('border', 0.6) } },
      splitLine: { lineStyle: { color: hsl('border', 0.3) } },
      splitArea: { show: false, areaStyle: { color: ['transparent'] } },
      // Contorno do símbolo de vértice, pela mesma porta do traçado: no radar,
      // como na linha, a forma de dado é o VÉRTICE — o polígono já é delimitado
      // pelo próprio traço, na cor da série, e é o vértice que precisa se
      // separar do que está por baixo dele.
      itemStyle: { borderColor: fg, borderWidth: 2 },
    },
  };
}

/**
 * Conta as trocas de tema. É a dependência que faz o rótulo ser remontado —
 * sem ela o computed abaixo nunca reavaliaria, porque `props.option` não muda
 * quando só a classe do documento muda.
 */
const themeVersion = ref(0);

/**
 * Tema desta instância, calculado AGORA.
 *
 * De propósito não passa pelo registro global da lib: o registro guarda o
 * último tema calculado por quem quer que seja, e quem monta depois herda a
 * paleta de quem montou antes. Medido no navegador: uma tela clara nascia com o
 * contorno em rgb(250,250,250) sobre fundo branco — 1.04:1, reprovando o
 * critério de objeto gráfico por acidente de ordem, não por escolha de cor.
 * Tema por instância não tem esse acidente.
 */
/**
 * O tema entregue ao wrapper — recalculado a cada troca, e não fotografado na
 * montagem.
 *
 * Era `buildTheme()` uma vez só, e isso abria uma janela silenciosa: o
 * observador de classe faz `instanciaDoGrafico()?.setTheme(…)`, com
 * encadeamento opcional, então quando a classe muda ANTES de a lib criar a
 * instância a atualização é descartada sem aviso — e o desenho nasce depois com
 * o tema da foto. Medido: a story de contraste desenhava com a paleta ESCURA
 * enquanto o documento estava no claro, e o portão acusou 1.02 porque media o
 * traço quase branco contra a página branca.
 *
 * Reativo, o caminho deixa de depender do instante: o wrapper observa a prop,
 * chama `setTheme` por conta e reaplica o option. E some a diferença entre um
 * gráfico que sofre `setOption` na troca de tema e um que não — que era o que
 * fazia o defeito aparecer só com rótulo de valor ligado.
 */
const mountTheme = computed(() => {
  themeVersion.value;
  return buildTheme() as Record<string, unknown>;
});

// Recolore quando o tema do <html> muda (marca / escuro / densidade / fonte).
//
// A instância guarda o tema resolvido desde a criação, e nem uma nova opção nem
// uma re-renderização o relêem. O caminho anterior era remontar o gráfico
// inteiro trocando a chave de renderização, o que recolore mas PISCA — e a
// documentação promete o contrário. Repintar a instância no lugar não recria nó
// nenhum.
/**
 * A instância do ECharts por trás do wrapper, achada pelo DOM.
 *
 * Deliberadamente NÃO passa pelo `expose` do wrapper: ali `chart` é um
 * shallowRef, o desembrulho depende do caminho de acesso, e um `undefined` em
 * silêncio significa gráfico que não recolore — foi assim que uma story mediu
 * contraste de 1.04:1, com o desenho ainda na paleta do tema anterior. O
 * registro da lib é por elemento, e o elemento nós temos.
 *
 * A busca varre a subárvore do desenho em vez de pegar o primeiro filho: o
 * wrapper monta a lib num elemento INTERNO ao que ele próprio renderiza, então
 * perguntar ao primeiro nó devolvia `undefined` — e `undefined` aqui é
 * exatamente o gráfico que não recolore, calado.
 */
function instanciaDoGrafico(): echarts.ECharts | undefined {
  const root = containerRef.value;
  if (!root) return undefined;
  for (const node of root.querySelectorAll<HTMLElement>('[data-slot="chart-canvas"] *')) {
    const instance = echarts.getInstanceByDom(node);
    if (instance) return instance;
  }
  return undefined;
}

const optionWithLabels = computed(() => {
  themeVersion.value;
  return withNestLabelTokens(props.option as Record<string, unknown>, nestLabelTokens());
});

let observer: MutationObserver | null = null;
let fontObserver: ResizeObserver | null = null;
onMounted(() => {
  let lastFontSize = rootFontSize();

  observer = new MutationObserver(() => {
    instanciaDoGrafico()?.setTheme(buildTheme() as Record<string, unknown>);
    themeVersion.value += 1;
    // A barra de ferramentas troca a fonte por classe, e a classe já passou por
    // aqui: anotar a medida evita que o observador de tamanho, logo abaixo,
    // repita o mesmo trabalho no quadro seguinte.
    lastFontSize = rootFontSize();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Aumentar a fonte do navegador NÃO escreve classe no `<html>`, então o
  // observador acima não a vê. O que ela muda é a CAIXA do documento, e é isso
  // que este observa. Sem ele, os tamanhos medidos em `buildTheme` ficariam
  // congelados no valor do primeiro desenho: o rótulo do eixo continuaria no
  // corpo antigo depois do zoom de texto, que é exatamente a falha que a WCAG
  // 1.4.4 cobra.
  //
  // Divergência de API de framework, registrada: o redimensionamento do desenho
  // é do wrapper (`autoresize`), então aqui o observador serve só à MEDIDA da
  // fonte — a outra stack, que inicia a lib na mão, mede a fonte no mesmo
  // observador que já chama `resize()`. O contrato é o mesmo nas duas.
  fontObserver = new ResizeObserver(() => {
    const fontSize = rootFontSize();
    if (fontSize === lastFontSize) return;
    lastFontSize = fontSize;
    instanciaDoGrafico()?.setTheme(buildTheme() as Record<string, unknown>);
    themeVersion.value += 1;
  });
  fontObserver.observe(document.documentElement);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  fontObserver?.disconnect();
});

/**
 * Os números do desenho em forma de tabela.
 *
 * Sai do MESMO option que a lib desenha: uma segunda fonte divergiria já no
 * primeiro dado atualizado, e a alternativa textual passaria a descrever um
 * gráfico que não está na tela.
 */
const table = computed(() =>
  chartTable(props.option, {
    category: props.categoryLabel ?? CHART_TABLE_LABELS.category,
    value: props.valueLabel ?? CHART_TABLE_LABELS.value,
    share: props.shareLabel ?? CHART_TABLE_LABELS.share,
    max: props.maxLabel ?? CHART_TABLE_LABELS.max,
    series: props.seriesLabel ?? CHART_TABLE_LABELS.series,
    group: props.groupLabel ?? CHART_TABLE_LABELS.group,
  }),
);

/**
 * A caixa que rola só existe quando a tabela está À VISTA, e aí ela é
 * alcançável por teclado — como no primitivo Table. Fora da tela a tabela mede
 * 1px, então o `overflow-x` automático a tornaria uma região rolável sem foco
 * (scrollable-region-focusable) e sem nada para rolar: colunas que só existem
 * para quem usa mouse, num elemento que ninguém enxerga.
 */
const dataClass = computed(() => (props.showData ? 'nds-table-wrapper' : 'nds-sr-only'));

const containerClass = computed(() => cn('nds-chart', props.class));
const rendererName = computed(() => props.renderer ?? 'svg');

/**
 * Rótulo do gráfico, na ordem: o que o consumidor passou, o título do próprio
 * option, e por último uma palavra genérica. Nunca fica sem nome — `role="img"`
 * sem nome acessível é violação de axe, e um desenho mudo é conteúdo perdido.
 */
const accessibleLabel = computed(() => {
  const fornecido = props.ariaLabel;
  if (fornecido) return fornecido;
  const title = (props.option as { title?: { text?: string } | { text?: string }[] }).title;
  const doOption = Array.isArray(title) ? title[0]?.text : title?.text;
  return doOption ?? 'Gráfico';
});

// Sem série com dado não existe desenho a anunciar: entra a frase. É contrato
// do componente, não detalhe desta implementação.
const vazio = computed(() => isChartOptionEmpty(props.option));
const emptyText = computed(() => props.emptyLabel ?? CHART_EMPTY_LABEL);
/**
 * Altura pedida. Veste o elemento do DESENHO quando há desenho — o bloco em
 * volta cresce com ele e ainda cabe a tabela abaixo sem ser recortada — e o
 * próprio bloco no estado vazio, onde não há desenho e o piso é o que impede a
 * página de saltar quando o dado chega.
 */
const heightStyle = computed(() =>
  props.height === undefined ? undefined : { height: `${props.height}px` },
);
</script>

<template>
  <!--
    O bloco em volta NÃO leva papel nenhum.

    `role="img"` poda a subárvore da árvore de acessibilidade. No bloco ele
    podaria a tabela de dados junto, e a alternativa textual sumiria — o papel
    vai no elemento do desenho, logo abaixo, e a tabela fica ao lado dele, na
    árvore. No estado vazio não há papel em lugar nenhum: a frase que explica a
    ausência de dado é justamente o conteúdo, e atrás de um rótulo genérico ela
    não seria lida.
  -->
  <div
    ref="containerRef"
    data-slot="chart"
    :class="containerClass"
    :style="vazio ? heightStyle : undefined"
  >
    <p v-if="vazio" class="nds-chart-empty">{{ emptyText }}</p>
    <template v-else>
      <!-- O elemento em que a lib desenha. A altura nasce da proporção aplicada
           à largura do container quando não vem pedida em pixel. -->
      <div
        class="nds-chart-canvas"
        data-slot="chart-canvas"
        role="img"
        :aria-label="accessibleLabel"
        :style="heightStyle"
      >
        <VChart
          :option="optionWithLabels"
          :theme="mountTheme"
          :init-options="{ renderer: rendererName }"
          autoresize
          style="width: 100%; height: 100%;"
        />
      </div>

      <!-- Alternativa textual equivalente. Não é enfeite: é o mesmo dado, em
           forma que leitor de tela, busca e cópia alcançam. -->
      <div :class="dataClass" :tabindex="showData ? 0 : undefined" data-slot="chart-data">
        <table class="nds-table">
          <caption>{{ accessibleLabel }}</caption>
          <thead>
            <tr>
              <!-- Chaveado pela POSIÇÃO: duas séries podem ter o mesmo nome, e
                   chave repetida numa lista é chave que não distingue. -->
              <th v-for="(column, place) of table.header" :key="place" scope="col">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) of table.rows" :key="index">
              <th scope="row">{{ row[0] }}</th>
              <td v-for="(cell, position) of row.slice(1)" :key="position">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
