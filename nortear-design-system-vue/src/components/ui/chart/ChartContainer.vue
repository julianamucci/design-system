<!--
  ChartContainer — wrapper de vue-echarts. Substitui o wrapper anterior
  baseado em @unovis/vue. API agora é declarativa: `<ChartContainer :option="..." />`.
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, useAttrs } from 'vue';
import VChart from 'vue-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
import { cn } from '@/lib/utils';
import { CHART_EMPTY_LABEL, isChartOptionEmpty } from './chart-state';
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
const temaDaMontagem = buildTheme();

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
 */
function instanciaDoGrafico(): echarts.ECharts | undefined {
  const alvo = containerRef.value?.querySelector<HTMLElement>('*');
  return alvo ? echarts.getInstanceByDom(alvo) : undefined;
}

let observer: MutationObserver | null = null;
onMounted(() => {
  observer = new MutationObserver(() => {
    instanciaDoGrafico()?.setTheme(buildTheme() as Record<string, unknown>);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => observer?.disconnect());

const containerClass = computed(() => cn('nds-chart', props.class));
const rendererName = computed(() => props.renderer ?? 'svg');

const attrs = useAttrs();
/**
 * Rótulo do gráfico, na ordem: o que o consumidor passou, o título do próprio
 * option, e por último uma palavra genérica. Nunca fica sem nome — `role="img"`
 * sem nome acessível é violação de axe, e um desenho mudo é conteúdo perdido.
 */
const accessibleLabel = computed(() => {
  const fornecido = attrs['aria-label'] as string | undefined;
  if (fornecido) return fornecido;
  const titulo = (props.option as { title?: { text?: string } | { text?: string }[] }).title;
  const doOption = Array.isArray(titulo) ? titulo[0]?.text : titulo?.text;
  return doOption ?? 'Gráfico';
});

// Sem série com dado não existe desenho a anunciar: entra a frase, como no
// Vanilla (referência) e no Angular.
const vazio = computed(() => isChartOptionEmpty(props.option));
const emptyText = computed(() => props.emptyLabel ?? CHART_EMPTY_LABEL);
const containerStyle = computed(() =>
  props.height === undefined ? undefined : { height: `${props.height}px` },
);
</script>

<template>
  <!--
    `role="img"` PODA a subárvore da árvore de acessibilidade. Com desenho isso é
    o que se quer: o rótulo substitui um SVG que o leitor de tela não teria como
    narrar. No estado vazio seria o contrário — a frase que explica a ausência de
    dado é justamente o conteúdo, e ficaria escondida atrás de um rótulo
    genérico. Sem papel, ela é lida.
  -->
  <div
    ref="containerRef"
    data-slot="chart"
    :role="vazio ? undefined : 'img'"
    :aria-label="vazio ? undefined : accessibleLabel"
    :class="containerClass"
    :style="containerStyle"
  >
    <p v-if="vazio" class="nds-chart-empty">{{ emptyText }}</p>
    <VChart
      v-else
      :option="option"
      :theme="temaDaMontagem"
      :init-options="{ renderer: rendererName }"
      autoresize
      style="width: 100%; height: 100%;"
    />
  </div>
</template>
