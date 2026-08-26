<!--
  ChartContainer — wrapper de vue-echarts. Substitui o wrapper anterior
  baseado em @unovis/vue. API agora é declarativa: `<ChartContainer :option="..." />`.
-->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import VChart from 'vue-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
import { cn } from '@/lib/utils';
import { CHART_EMPTY_LABEL, CHART_TABLE_LABELS, chartTable, isChartOptionEmpty } from './chart-state';
import type { HTMLAttributes } from 'vue';

// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada.
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent,
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
  /** Rótulo da coluna de participação — só a pizza a escreve. */
  shareLabel?: string;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

function hsl(token: string, alpha = 1): string {
  if (typeof document === 'undefined') return 'transparent';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  if (!raw) return 'transparent';
  return alpha === 1 ? `hsl(${raw})` : `hsla(${raw} / ${alpha})`;
}
function cssToken(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildTheme() {
  const fontFamily = cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const card = hsl('card');
  const border = hsl('border');
  const axisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };
  return {
    color: [hsl('chart-1'), hsl('chart-2'), hsl('chart-3'), hsl('chart-4'), hsl('chart-5')],
    backgroundColor: 'transparent',
    textStyle: { color: fg, fontFamily },
    title: { textStyle: { color: fg, fontFamily, fontWeight: 600 } },
    legend: { textStyle: { color: muted } },
    tooltip: { backgroundColor: card, borderColor: border, textStyle: { color: fg } },
    axisPointer: { lineStyle: { color: hsl('primary', 0.5) } },
    categoryAxis: axisStyle,
    valueAxis: axisStyle,
    logAxis: axisStyle,
    timeAxis: axisStyle,
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta, e as
    // cores de série (--chart-1 a --chart-5) ficam em torno de 2:1 contra o fundo:
    // sozinhas não sustentam o critério. Quem sustenta é o CONTORNO em
    // --foreground, o mesmo caminho que o Angular desenha à mão. O nome anterior
    // (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha efeito
    // nenhum na v5 — o contorno documentado nunca chegou a ser desenhado.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
  };
}

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
const mountTheme = buildTheme();

// Recolore quando o tema do <html> muda (marca / escuro / densidade / fonte).
//
// A instância guarda o tema resolvido desde a criação, e nem uma nova opção nem
// uma re-renderização o relêem. O caminho anterior era remontar o gráfico
// inteiro por uma chave de React/Vue, o que recolore mas PISCA — e a
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

let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => {
    instanciaDoGrafico()?.setTheme(buildTheme() as Record<string, unknown>);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => observer?.disconnect());

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

// Sem série com dado não existe desenho a anunciar: entra a frase, como no
// Vanilla (referência) e no Angular.
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
          :option="option"
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
