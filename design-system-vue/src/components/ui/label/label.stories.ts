import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Label } from './index';
import LabelDocs from '@/components/docs/LabelDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(LabelDocs) },
  },
  argTypes: {
    for: {
      control: 'text',
      description: 'Associa o Label ao campo com o id correspondente (htmlFor no HTML nativo).',
    },
    class: {
      control: 'text',
      description: 'Classes Tailwind adicionais para personalização do rótulo.',
    },
  },
  args: {
    for: 'demo-input',
    class: '',
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Label },
    setup() { return { args }; },
    template: `
      <div class="flex flex-col gap-2">
        <Label v-bind="args">Nome completo</Label>
        <input id="demo-input" type="text" class="border rounded px-3 py-1 text-sm" placeholder="Digite aqui" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está presente e visível', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeInTheDocument();
      await expect(label).toBeVisible();
    });

    await step('Label possui data-slot="label"', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toHaveAttribute('data-slot', 'label');
    });
  },
};
