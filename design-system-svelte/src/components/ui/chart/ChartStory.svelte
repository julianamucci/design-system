<script lang="ts">
  import { BarChart, LineChart } from 'layerchart';
  import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';

  type ChartType = 'bar' | 'line';

  let {
    type = 'bar' as ChartType,
    ariaLabel = 'Gráfico de acessos mensais',
    class: className = 'h-[220px] w-[340px]',
    data = [
      { month: 'Jan', value: 186 },
      { month: 'Fev', value: 305 },
      { month: 'Mar', value: 237 },
      { month: 'Abr', value: 173 },
      { month: 'Mai', value: 209 },
      { month: 'Jun', value: 264 },
    ],
    config = {
      value: { label: 'Acessos', color: 'var(--chart-1)' },
    } as ChartConfig,
    multiSeries = false,
    data2 = [
      { month: 'Jan', value: 120 },
      { month: 'Fev', value: 198 },
      { month: 'Mar', value: 145 },
      { month: 'Abr', value: 220 },
      { month: 'Mai', value: 175 },
      { month: 'Jun', value: 310 },
    ],
    config2 = {
      value: { label: 'Desktop', color: 'var(--chart-1)' },
      value2: { label: 'Mobile', color: 'var(--chart-2)' },
    } as ChartConfig,
  } = $props<{
    type?: ChartType;
    ariaLabel?: string;
    class?: string;
    data?: { month: string; value: number }[];
    config?: ChartConfig;
    multiSeries?: boolean;
    data2?: { month: string; value: number }[];
    config2?: ChartConfig;
  }>();

  const mergedData = $derived(
    multiSeries
      ? data.map((d, i) => ({ month: d.month, value: d.value, value2: data2[i]?.value ?? 0 }))
      : data
  );

  const activeConfig = $derived(multiSeries ? config2 : config);
</script>

<ChartContainer config={activeConfig} class={className} aria-label={ariaLabel}>
  {#if type === 'bar'}
    <BarChart
      data={mergedData}
      x="month"
      y="value"
      series={multiSeries
        ? [
            { key: 'value',  value: (d: any) => d.value,  color: 'var(--color-value)',  label: config2.value?.label  ?? 'Desktop' },
            { key: 'value2', value: (d: any) => d.value2, color: 'var(--color-value2)', label: config2.value2?.label ?? 'Mobile'  },
          ]
        : [{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: config.value?.label ?? 'Acessos' }]}
      seriesLayout={multiSeries ? 'group' : 'overlap'}
      bandPadding={0.3}
    >
      <ChartTooltip />
    </BarChart>
  {:else}
    <LineChart
      data={mergedData}
      x="month"
      y="value"
      series={multiSeries
        ? [
            { key: 'value',  value: (d: any) => d.value,  color: 'var(--color-value)',  label: config2.value?.label  ?? 'Desktop' },
            { key: 'value2', value: (d: any) => d.value2, color: 'var(--color-value2)', label: config2.value2?.label ?? 'Mobile'  },
          ]
        : [{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: config.value?.label ?? 'Acessos' }]}
    >
      <ChartTooltip />
    </LineChart>
  {/if}
</ChartContainer>
