import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { ChartContainer, ChartLegendContent, type ChartConfig } from './index';
import { VisXYContainer, VisGroupedBar, VisAxis } from '@unovis/vue';

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
  title: 'UI/Chart/Estados',
  component: ChartContainer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vazio: Story = {
  render: () => ({
    components: { ChartContainer },
    setup() {
      const config = singleConfig;
      return { config };
    },
    template: `
      <div class="w-[480px]">
        <ChartContainer
          :config="config"
          class="h-[300px] w-full"
          aria-label="Gráfico sem dados"
        >
          <template #default>
            <div class="flex h-full items-center justify-center text-muted-foreground text-sm">
              Nenhum dado disponível para o período selecionado.
            </div>
          </template>
        </ChartContainer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ChartContainer está presente no DOM', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });

    await step('Mensagem de estado vazio está visível', async () => {
      await expect(canvas.getByText(/Nenhum dado disponível/)).toBeVisible();
    });
  },
};

export const UmaSerie: Story = {
  render: () => ({
    components: { ChartContainer, VisXYContainer, VisGroupedBar, VisAxis },
    setup() {
      const data = chartData;
      const config = singleConfig;
      const xTicks = data.map(d => d.month);
      const barX = (_d: typeof chartData[number], i: number) => i;
      const barDesktop = (d: typeof chartData[number]) => d.desktop;
      return { data, config, xTicks, barX, barDesktop };
    },
    template: `
      <div class="w-[480px]">
        <ChartContainer
          :config="config"
          class="h-[300px] w-full"
          aria-label="Bar chart: acessos desktop por mês"
        >
          <template #default>
            <VisXYContainer :data="data" :height="300">
              <VisGroupedBar
                :x="barX"
                :y="[barDesktop]"
                :color="['var(--chart-1)']"
              />
              <VisAxis type="x" :tick-format="(i) => xTicks[i]" />
            </VisXYContainer>
          </template>
        </ChartContainer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ChartContainer está presente e visível', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeVisible();
    });
  },
};

export const MultiplasSeries: Story = {
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
          aria-label="Bar chart multi-séries: desktop e mobile por mês"
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Legenda exibe labels de todas as séries', async () => {
      await expect(canvas.getByText('Desktop')).toBeVisible();
      await expect(canvas.getByText('Mobile')).toBeVisible();
    });
  },
};
