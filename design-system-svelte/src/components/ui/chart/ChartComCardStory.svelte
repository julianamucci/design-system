<script lang="ts">
  import { BarChart } from 'layerchart';
  import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

  const data = [
    { month: 'Jan', value: 186 },
    { month: 'Fev', value: 305 },
    { month: 'Mar', value: 237 },
    { month: 'Abr', value: 173 },
    { month: 'Mai', value: 209 },
    { month: 'Jun', value: 264 },
  ];

  const chartConfig: ChartConfig = {
    value: { label: 'Acessos', color: 'var(--chart-1)' },
  };
</script>

<Card class="w-[380px]">
  <CardHeader>
    <CardTitle>Acessos Mensais</CardTitle>
    <CardDescription>Janeiro – Junho 2024</CardDescription>
  </CardHeader>
  <CardContent>
    <ChartContainer config={chartConfig} class="h-[180px] w-full" aria-label="Gráfico de barras: acessos mensais">
      <BarChart
        {data}
        x="month"
        y="value"
        series={[{ key: 'value', value: (d: any) => d.value, color: 'var(--color-value)', label: 'Acessos' }]}
        bandPadding={0.3}
      >
        <ChartTooltip />
      </BarChart>
    </ChartContainer>
  </CardContent>
</Card>
