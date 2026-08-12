<!--
  Gráfico dentro de um Card — a composição mais comum do componente.

  O card é o componente do design system, não uma caixa desenhada à mão: título
  e apoio saem de CardTitle/CardDescription, que já carregam a tipografia e o
  espaçamento certos. É também o que garante que a story continue certa quando o
  Card mudar.
-->
<script lang="ts">
  import type { EChartsCoreOption } from 'echarts/core';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  import { ChartContainer, buildBarOption } from './index';

  // Props todas opcionais: o render das stories tipa o componente contra `Args`,
  // e prop obrigatória faz o `Component<Props>` sair incompatível.
  interface Props {
    option?: EChartsCoreOption;
    title?: string;
    description?: string;
    label?: string;
    height?: number;
  }

  let {
    option = buildBarOption({
      xAxis: ['Jan', 'Fev', 'Mar', 'Abr'],
      series: [{ name: 'Vendas', data: [186, 305, 237, 73] }],
    }),
    title = 'Acessos mensais',
    description = 'Janeiro a abril, acessos no desktop.',
    label = 'Gráfico de barras: acessos mensais no desktop, de janeiro a abril',
    height = 200,
  }: Props = $props();
</script>

<Card class="nds-w-full nds-max-w-sm">
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    <ChartContainer {option} {height} class="nds-w-full" aria-label={label} />
  </CardContent>
</Card>
