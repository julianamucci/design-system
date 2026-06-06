import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createLabel } from './label';
import { createLabelDocs } from '@/components/docs/LabelDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type LabelArgs = {
  text: string;
  className: string;
};

const meta: Meta<LabelArgs> = {
  title: 'UI/Label',
  tags: ['autodocs', 'form'],
  parameters: {
    docs: { page: withAutoDocsTab(createLabelDocs) },
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Texto do rótulo exibido ao usuário.',
    },
    className: {
      control: 'text',
      description: 'Classes Tailwind adicionais para personalização.',
    },
  },
  args: {
    text: 'Nome completo',
    className: '',
  },
};

export default meta;
type Story = StoryObj<LabelArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const inputId = 'playground-input';
    const label = createLabel({ text: args.text, htmlFor: inputId, className: args.className });

    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.className = 'input';
    input.placeholder = 'Digite aqui…';

    wrapper.append(label, input);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label está presente no DOM', async () => {
      const label = canvas.getByText('Nome completo');
      await expect(label.tagName.toLowerCase()).toBe('label');
    });

    await step('Label possui htmlFor correto', async () => {
      const label = canvasElement.querySelector('label');
      await expect(label?.htmlFor).toBe('playground-input');
    });

    await step('Input associado está presente', async () => {
      const input = canvasElement.querySelector('#playground-input');
      await expect(input).toBeInTheDocument();
    });
  },
};
