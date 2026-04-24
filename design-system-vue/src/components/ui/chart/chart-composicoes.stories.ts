import type { Meta, StoryObj } from '@storybook/vue3';
import { ChartContainer, ChartLegendContent, ChartTooltipContent, type ChartConfig } from './index';
import { VisXYContainer, VisGroupedBar, VisAxis, VisCrosshair } from '@unovis/vue';
import { Card } from '@/components/ui/card';

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73,  mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const multiConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile:  { label: 'Mobile',  color: 'var(--chart-2)' },
};

const meta = {
  title: 'UI/Chart/Composicoes',
  component: ChartContainer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComCard: Story = {
  render: () => ({
    components: { ChartContainer, ChartLegendContent, VisXYContainer, VisGroupedBar, VisAxis, Card },
    setup() {
      const data = chartData;
      const config = multiConfig;
      const xTicks = data.map(d => d.month);
      const barX = (_d: typeof chartData[number], i: number) => i;
      const barDesktop = (d: typeof chartData[number]) => d.desktop;
      const barMobile = (d: typeof chartData[number]) => d.mobile;
      return { data, config, xTicks, barX, barDesktop, barMobile };
    },
    template: `
      <Card class="p-6 w-[520px]">
        <h3 class="text-sm font-semibold mb-1">Acessos mensais</h3>
        <p class="text-xs text-muted-foreground mb-4">Desktop vs Mobile — Jan a Jun</p>
        <ChartContainer
          :config="config"
          class="h-[280px] w-full"
          aria-label="Bar chart dentro de Card: acessos mensais por dispositivo"
        >
          <template #default>
            <VisXYContainer :data="data" :height="280">
              <VisGroupedBar
                :x="barX"
                :y="[barDesktop, barMobile]"
                :color="['var(--chart-1)', 'var(--chart-2)']"
              />
              <VisAxis type="x" :tick-format="(i) => xTicks[i]" />
            </VisXYContainer>
          </template>
        </ChartContainer>
        <ChartLegendContent :config="config" class="mt-3" />
      </Card>
    `,
  }),
};

export const TooltipCustom: Story = {
  render: () => ({
    components: { ChartContainer, ChartLegendContent, VisXYContainer, VisGroupedBar, VisAxis, VisCrosshair },
    setup() {
      const data = chartData;
      const config = multiConfig;
      const xTicks = data.map(d => d.month);
      const barX = (_d: typeof chartData[number], i: number) => i;
      const barDesktop = (d: typeof chartData[number]) => d.desktop;
      const barMobile = (d: typeof chartData[number]) => d.mobile;

      const tooltipTemplate = (d: typeof chartData[number]) => {
        return `<div class="rounded-lg border bg-background p-2 shadow-sm text-xs">
          <div class="font-semibold mb-1">${xTicks[data.indexOf(d)]}</div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-sm" style="background:var(--chart-1)"></span>
            Desktop: <strong>${d.desktop}</strong>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-sm" style="background:var(--chart-2)"></span>
            Mobile: <strong>${d.mobile}</strong>
          </div>
        </div>`;
      };

      return { data, config, xTicks, barX, barDesktop, barMobile, tooltipTemplate };
    },
    template: `
      <div class="flex flex-col gap-4 w-[480px]">
        <ChartContainer
          :config="config"
          :cursor="true"
          class="h-[300px] w-full"
          aria-label="Bar chart com tooltip customizado: acessos mensais"
        >
          <template #default>
            <VisXYContainer :data="data" :height="300">
              <VisGroupedBar
                :x="barX"
                :y="[barDesktop, barMobile]"
                :color="['var(--chart-1)', 'var(--chart-2)']"
              />
              <VisAxis type="x" :tick-format="(i) => xTicks[i]" />
              <VisCrosshair color="var(--border)" :template="tooltipTemplate" />
            </VisXYContainer>
          </template>
        </ChartContainer>
        <ChartLegendContent :config="config" />
      </div>
    `,
  }),
};
