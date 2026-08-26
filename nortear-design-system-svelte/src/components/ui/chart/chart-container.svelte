<!--
  ChartContainer Svelte 5 — wrapper de vanilla echarts.
  API: <ChartContainer option={buildBarOption({...})} style="height: 16rem" />
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@/lib/utils.js';
  import * as echarts from 'echarts/core';
  import { BarChart, FunnelChart, LineChart, PieChart } from 'echarts/charts';
  import {
    TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
    AriaComponent,
  } from 'echarts/components';
  import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
  import {
    CHART_EMPTY_LABEL, CHART_TABLE_LABELS, chartDecals, chartTable, isChartOptionEmpty,
  } from './chart-state.js';

  // `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado
  // em silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG
  // 1.4.1 quando a cor sai de cena — nunca chega a ser desenhada.
  echarts.use([
    BarChart, LineChart, PieChart, FunnelChart,
    TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
    AriaComponent,
    SVGRenderer, CanvasRenderer,
  ]);

  const THEME_NAME = 'nortear';

  let {
    option,
    class: className,
    renderer = 'svg',
    height,
    emptyLabel = CHART_EMPTY_LABEL,
    'aria-label': ariaLabel = 'Gráfico',
    showData = false,
    categoryLabel = CHART_TABLE_LABELS.category,
    valueLabel = CHART_TABLE_LABELS.value,
    shareLabel = CHART_TABLE_LABELS.share,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & {
    option: echarts.EChartsCoreOption;
    class?: string;
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
     * Torna a alternativa textual visível para todo mundo, não só para leitor
     * de tela. Sem ela a tabela continua no DOM — o que muda é quem a enxerga.
     */
    showData?: boolean;
    /** Rótulo da coluna de categorias na alternativa textual. */
    categoryLabel?: string;
    /** Rótulo da coluna de valores quando a série não tem nome próprio. */
    valueLabel?: string;
    /**
     * Rótulo da coluna de participação — só a pizza e o funil a escrevem.
     *
     * É um rótulo só porque é uma COLUNA só; o que muda entre os dois não é o
     * título, é a referência da conta, e ela vem do desenho: na pizza a fatia é
     * parte de um total, no funil a etapa é o que sobrou da primeira.
     */
    shareLabel?: string;
  } = $props();

  let containerEl: HTMLDivElement | undefined = $state();

  // Sem série com dado não existe desenho a anunciar: entra a frase. É contrato
  // do componente, não detalhe desta implementação.
  const vazio = $derived(isChartOptionEmpty(option));

  /**
   * Os números do desenho em forma de tabela.
   *
   * Sai do MESMO option que a lib desenha: uma segunda fonte divergiria já no
   * primeiro dado atualizado, e a alternativa textual passaria a descrever um
   * gráfico que não está na tela.
   */
  const table = $derived(
    chartTable(option, { category: categoryLabel, value: valueLabel, share: shareLabel }),
  );

  /**
   * A caixa que rola só existe quando a tabela está À VISTA, e aí ela é
   * alcançável por teclado — como no primitivo Table. Fora da tela a tabela
   * mede 1px, então o `overflow-x` automático a tornaria uma região rolável sem
   * foco (scrollable-region-focusable) e sem nada para rolar: colunas que só
   * existem para quem usa mouse, num elemento que ninguém enxerga.
   */
  const dataClass = $derived(showData ? 'nds-table-wrapper' : 'nds-sr-only');

  /**
   * Altura pedida, em CSS. Veste o elemento do DESENHO quando há desenho — o
   * bloco em volta cresce com ele e ainda cabe a tabela abaixo sem recorte — e
   * o próprio bloco no estado vazio, onde não há desenho e o piso é o que
   * impede a página de saltar quando o dado chega.
   */
  const heightStyle = $derived(height === undefined ? undefined : `height: ${height}px`);

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
   * `getComputedStyle` de custom property devolve a expressão, não o resultado.
   * O que é mensurável — e o que de fato muda quando a fonte do navegador
   * cresce ou a barra de ferramentas troca a família — é o `font-size`
   * resolvido do `<html>`.
   */
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
    // padrão em rótulo de eixo, legenda e dica; 0.875 = 14px, o
    // `--text-control`, que é o tamanho do título. Na base 16 o desenho não muda
    // de aparência — muda o fato de que agora ele ACOMPANHA a fonte raiz.
    const bodySize = scaled(0.75);
    const titleSize = scaled(0.875);

    const axisStyle = {
      axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
      axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
      axisLabel: { show: true, color: muted, fontSize: bodySize },
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
      // A trama do decal entra pelo TEMA, e não pelo option, porque a cor dela é
      // valor de tema: traçada no fundo da página, ela é recolorida por
      // `setTheme` junto com a paleta. No option ficaria congelada na cor do
      // tema em que o desenho nasceu. O porquê de não usar a lista padrão da lib
      // está em `chartDecals` — em resumo, a trama dela é preto a 20% e se
      // destaca do preenchimento entre 1.14 e 1.54.
      aria: { decal: { decals: chartDecals(hsl('background')) } },
      // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta. A
      // paleta de série passa disso por conta própria desde que ganhou variante
      // por modo — pior caso medido, 7.32 no claro e 6.83 no escuro —, mas o
      // CONTORNO em --foreground continua: é ele que delimita o objeto seja qual
      // for a paleta que um tema derivado escolher, e é ele que separa duas
      // formas VIZINHAS, que o contraste contra o fundo não mede. O nome
      // anterior (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha
      // efeito nenhum na v5 — o contorno documentado nunca chegou a ser
      // desenhado.
      line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
      bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
      pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
      // O funil entra pela mesma porta que as outras séries de área: o contorno
      // é do TEMA, não do option. É o que faz a troca de tema recolorir o traço
      // no lugar, por `setTheme`, sem remontar o desenho — no option ele
      // ficaria congelado na cor do tema em que a instância nasceu. E é ele que
      // separa uma faixa da seguinte, que aqui se tocam de perto.
      funnel: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    };
  }

  function applyTheme() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts.registerTheme(THEME_NAME, buildTheme() as any);
  }

  onMount(() => {
    if (!containerEl || vazio) return;
    applyTheme();
    const chart = echarts.init(containerEl, THEME_NAME, { renderer });
    chart.setOption(option);

    let lastFontSize = rootFontSize();

    const drawingEl = containerEl;
    const ro = new ResizeObserver((entries) => {
      // Aumentar a fonte do navegador NÃO escreve classe no `<html>`, então o
      // observador de classe abaixo não a vê — o que ela muda é a CAIXA. Sem
      // reler o tema aqui, os tamanhos medidos em `buildTheme` ficariam
      // congelados no valor do primeiro desenho: o rótulo do eixo continuaria no
      // corpo antigo depois do zoom de texto, que é a falha que a WCAG 1.4.4
      // cobra.
      //
      // Divergência de API de framework, registrada: aqui a lib é iniciada na
      // mão, então o mesmo observador que já chamava `resize()` mede a fonte —
      // na outra stack, em que o wrapper redimensiona sozinho, o observador de
      // fonte é um segundo. O contrato é o mesmo nas duas.
      const fontSize = rootFontSize();
      if (fontSize !== lastFontSize) {
        lastFontSize = fontSize;
        applyTheme();
        chart.setTheme(THEME_NAME);
      }
      // Redimensionar continua sendo assunto da caixa do DESENHO. A raiz é
      // observada só pela medida da fonte: repintar por causa dela realimentaria
      // o observador, e é assim que uma volta a mais vira laço que não fecha.
      if (entries.some((entry) => entry.target === drawingEl)) chart.resize();
    });
    ro.observe(drawingEl);
    ro.observe(document.documentElement);

    const observer = new MutationObserver(() => {
      applyTheme();
      // `registerTheme` só atualiza o REGISTRO global. A instância guarda o
      // tema já resolvido desde o `init`, e `setOption` sem `notMerge`
      // reaproveita esse model — trocar a classe do documento não mudava cor
      // nenhuma do desenho, e no tema escuro o gráfico ficava com a paleta
      // clara. Quem relê o registro é `setTheme`, e ele recolore no lugar, sem
      // remontar: é o "não pisca nem requer reload" que a documentação promete.
      chart.setTheme(THEME_NAME);
      // A barra de ferramentas troca a fonte por classe, e a classe passou por
      // aqui: anotar a medida evita que o observador de tamanho refaça o mesmo
      // trabalho no quadro seguinte.
      lastFontSize = rootFontSize();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      ro.disconnect();
      observer.disconnect();
      chart.dispose();
    };
  });

  $effect(() => {
    if (!containerEl) return;
    const inst = echarts.getInstanceByDom(containerEl);
    inst?.setOption(option, { notMerge: false, lazyUpdate: true });
  });
</script>

{#if vazio}
  <!--
    Sem `role="img"` de propósito: o papel PODA a subárvore da árvore de
    acessibilidade, e aqui a frase que explica a ausência de dado é justamente o
    conteúdo — ficaria escondida atrás de um rótulo genérico. Sem papel, ela é
    lida. (E `aria-label` num <div> sem papel é atributo proibido.)
  -->
  <div
    data-slot="chart"
    class={cn('nds-chart', className)}
    style={heightStyle}
    {...restProps}
  >
    <p class="nds-chart-empty">{emptyLabel}</p>
  </div>
{:else}
  <!--
    O bloco em volta NÃO leva papel nenhum: `role="img"` poda a subárvore, e
    aqui embaixo mora a tabela de dados. No bloco, o papel a podaria junto e a
    alternativa textual sumiria da árvore de acessibilidade — por isso ele vai
    no elemento do desenho, e a tabela fica ao lado, não dentro.
  -->
  <div data-slot="chart" class={cn('nds-chart', className)} {...restProps}>
    <!-- O elemento em que a lib desenha. A altura nasce da proporção aplicada à
         largura do container quando não vem pedida em pixel. -->
    <div
      bind:this={containerEl}
      class="nds-chart-canvas"
      data-slot="chart-canvas"
      role="img"
      aria-label={ariaLabel}
      style={heightStyle}
    ></div>

    <!-- Alternativa textual equivalente. Não é enfeite: é o mesmo dado, em
         forma que leitor de tela, busca e cópia alcançam. -->
    <div class={dataClass} tabindex={showData ? 0 : undefined} data-slot="chart-data">
      <table class="nds-table">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <!-- Chaveado pela POSIÇÃO: duas séries podem ter o mesmo nome, e
                 chave repetida num each chaveado é erro em tempo de execução. -->
            {#each table.header as column, place (place)}
              <th scope="col">{column}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each table.rows as row, index (index)}
            <tr>
              <th scope="row">{row[0]}</th>
              {#each row.slice(1) as cell, position (position)}
                <td>{cell}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
