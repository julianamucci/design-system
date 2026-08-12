<!--
  Dois gráficos empilhados — barras e linhas — para a story de tema escuro.

  Existe porque o item de regressão visual do contrato fala dos dois tipos, e um
  só deixaria metade dele sem ninguém fotografando. Nesta stack não dá para
  compor dois componentes dentro do `.ts` da story: o andaime é um `.svelte`,
  como em ChartCardStory.
-->
<script lang="ts">
  import type { EChartsCoreOption } from 'echarts/core';
  import { ChartContainer, buildBarOption, buildLineOption } from './index';

  // Props todas opcionais: o render das stories tipa o componente contra `Args`,
  // e prop obrigatória faz o `Component<Props>` sair incompatível.
  interface Props {
    optionBar?: EChartsCoreOption;
    optionLine?: EChartsCoreOption;
    labelBar?: string;
    labelLine?: string;
    height?: number;
  }

  const PADRAO = {
    xAxis: ['Jan', 'Fev', 'Mar', 'Abr'],
    series: [
      { name: 'Desktop', data: [186, 305, 237, 73] },
      { name: 'Mobile', data: [80, 200, 120, 190] },
    ],
  };

  let {
    optionBar = buildBarOption(PADRAO),
    optionLine = buildLineOption(PADRAO),
    labelBar = 'Acessos mensais por dispositivo, em barras',
    labelLine = 'Acessos mensais por dispositivo, em linhas',
    height = 260,
  }: Props = $props();
</script>

<div class="nds-stack nds-w-full">
  <ChartContainer option={optionBar} {height} class="nds-w-full" aria-label={labelBar} />
  <ChartContainer option={optionLine} {height} class="nds-w-full" aria-label={labelLine} />
</div>
