import type { Meta, StoryObj } from '@storybook/vue3';
import { ChartContainer, ChartLegendContent, type ChartConfig } from './index';
import { VisXYContainer, VisGroupedBar, VisLine, VisArea, VisAxis } from '@unovis/vue';

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73,  mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const singleConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
};

const multiConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile:  { label: 'Mobile',  color: 'var(--chart-2)' },
};

const meta = {
  title: 'UI/Chart/Variantes',
  component: ChartContainer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  render: () => ({
    components: { ChartContainer, ChartLegendContent, VisXYContainer, VisGroupedBar, VisAxis },
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
      <div class="flex flex-col gap-4 w-[480px]">
        <ChartContainer
          :config="config"
          class="h-[300px] w-full"
          aria-label="Bar chart: acessos mensais por dispositivo"
        >
          <template #default>
            <VisXYContainer :data="data" :height="300">
              <VisGroupedBar
                :x="barX"
                :y="[barDesktop, barMobile]"
                :color="['var(--chart-1)', 'var(--chart-2)']"
              />
              <VisAxis type="x" :tick-format="(i) => xTicks[i]" />
            </VisXYContainer>
          </template>
        </ChartContainer>
        <ChartLegendContent :config="config" />
      </div>
    `,
  }),
};

export const Linha: Story = {
  render: () => ({
    components: { ChartContainer, VisXYContainer, VisLine, VisAxis },
    setup() {
      const data = chartData;
      const config = singleConfig;
      const xTicks = data.map(d => d.month);
      const lineX = (_d: typeof chartData[number], i: number) => i;
      const lineY = (d: typeof chartData[number]) => d.desktop;
      return { data, config, xTicks, lineX, lineY };
    },
    template: `
      <div class="flex flex-col gap-4 w-[480px]">
        <ChartContainer
          :config="config"
          class="h-[300px] w-full"
          aria-label="Line chart: tendência de acessos mensais"
        >
          <template #default>
            <VisXYContainer :data="data" :height="300">
              <VisLine
                :x="lineX"
                :y="lineY"
                color="var(--chart-1)"
              />
              <VisAxis type="x" :tick-format="(i) => xTicks[i]" />
            </VisXYContainer>
          </template>
        </ChartContainer>
      </div>
    `,
  }),
};

export const Area: Story = {
  render: () => ({
    components: { ChartContainer, VisXYContainer, VisArea, VisAxis },
    setup() {
      const data = chartData;
      const config = singleConfig;
      const xTicks = data.map(d => d.month);
      const areaX = (_d: typeof chartData[number], i: number) => i;
      const areaY = (d: typeof chartData[number]) => d.desktop;
      return { data, config, xTicks, areaX, areaY };
    },
    template: `
      <div class="flex flex-col gap-4 w-[480px]">
        <ChartContainer
          :config="config"
          class="h-[300px] w-full"
          aria-label="Area chart: volume acumulado de acessos"
        >
          <template #default>
            <VisXYContainer :data="data" :height="300">
              <VisArea
                :x="areaX"
                :y="areaY"
                color="var(--chart-1)"
              />
              <VisAxis type="x" :tick-format="(i) => xTicks[i]" />
            </VisXYContainer>
          </template>
        </ChartContainer>
      </div>
    `,
  }),
};
