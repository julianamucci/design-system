import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Label } from './index';
import LabelStory from './LabelStory.svelte';
import LabelDocs from '@/components/docs/LabelDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(LabelDocs) },
    layout: 'centered',
  },
  argTypes: {
    class: {
      control: 'text',
      description: 'Classes Tailwind adicionais para personalização do rótulo.',
    },
    required: {
      control: 'boolean',
      description: 'Adiciona o marcador de campo obrigatório (asterisco em text-destructive). Implementado pelo código consumidor via <span aria-hidden="true">*</span>.',
    },
  },
  args: {
    class: '',
    required: false,
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: LabelStory,
    props: {
      children: 'Nome completo',
      for: 'nome',
      class: args.class,
      required: (args as unknown as { required: boolean }).required,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está presente no DOM', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeInTheDocument();
    });

    await step('Label é visível', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label).toBeVisible();
    });

    await step('Label possui data-slot="label"', async () => {
      const label = canvasElement.querySelector('[data-slot="label"]');
      await expect(label).toBeInTheDocument();
    });
  },
};
