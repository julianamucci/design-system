import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { ChartContainer, ChartLegendContent, type ChartConfig } from './index';
import { VisXYContainer, VisGroupedBar, VisAxis } from '@unovis/vue';
import ChartDocs from '@/components/docs/ChartDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73,  mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const chartConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile:  { label: 'Mobile',  color: 'var(--chart-2)' },
};

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(ChartDocs) },
  },
  argTypes: {
    cursor: {
      control: 'boolean',
      description: 'Exibe linha vertical do crosshair no hover',
    },
  },
  args: {
    cursor: false,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const Playground: Story = {
  render: (args) => ({
    components: { ChartContainer, ChartLegendContent, VisXYContainer, VisGroupedBar, VisAxis },
    setup() {
      const data = chartData;
      const config = chartConfig;
      const xTicks = data.map(d => d.month);
      const barX = (_d: typeof chartData[number], i: number) => i;
      const barDesktop = (d: typeof chartData[number]) => d.desktop;
      const barMobile = (d: typeof chartData[number]) => d.mobile;
      return { args, data, config, xTicks, barX, barDesktop, barMobile };
    },
    template: `
      <div class="flex flex-col gap-4 w-[480px]">
        <ChartContainer
          v-bind="args"
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ChartContainer está presente no DOM', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });

    await step('ChartContainer está visível', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeVisible();
    });

    await step('Legenda é renderizada com labels corretos', async () => {
      await expect(canvas.getByText('Desktop')).toBeVisible();
      await expect(canvas.getByText('Mobile')).toBeVisible();
    });
  },
};
