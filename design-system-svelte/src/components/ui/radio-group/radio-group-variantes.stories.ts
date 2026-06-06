import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';

const meta = {
  title: 'UI/RadioGroup/Variantes',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do RadioGroup: vertical (padrão para 4+ opções), horizontal (2–3 opções curtas) e withDescription (cada item com descrição auxiliar).',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      orientation: 'vertical',
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'var-vert',
      options: [
        { value: 'cartao', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Vertical (padrão). `grid gap-2` — recomendado para 4+ opções.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Container tem role=radiogroup', async () => {
      await expect(canvas.getByRole('radiogroup')).toBeInTheDocument();
    });
    await step('Renderiza 3 radios', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const Horizontal: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      orientation: 'horizontal',
      ariaLabel: 'Forma de entrega',
      idPrefix: 'var-horiz',
      options: [
        { value: 'standard', label: 'Padrão' },
        { value: 'express', label: 'Expressa' },
        { value: 'pickup', label: 'Retirar' },
      ],
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Horizontal. `flex gap-6` — recomendado para 2–3 opções curtas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup');
    await step('Orientação horizontal aplicada', async () => {
      await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    });
    await step('Renderiza 3 radios', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const WithDescription: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      orientation: 'vertical',
      withDescription: true,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'var-desc',
      class: 'w-80',
      options: [
        { value: 'cartao', label: 'Cartão de crédito', description: 'Aprovação imediata em até 12x.' },
        { value: 'pix', label: 'Pix', description: 'Pagamento instantâneo com 5% de desconto.' },
        { value: 'boleto', label: 'Boleto bancário', description: 'Compensação em até 3 dias úteis.' },
      ],
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Cada item com Label e descrição auxiliar abaixo. Item recebe `aria-describedby`.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Cada radio tem aria-describedby para sua descrição', async () => {
      const cartao = canvas.getByRole('radio', { name: /Cartão de crédito/i });
      await expect(cartao).toHaveAttribute('aria-describedby', 'var-desc-cartao-desc');
    });
    await step('Descrições auxiliares estão visíveis', async () => {
      await expect(canvas.getByText(/Aprovação imediata/)).toBeVisible();
      await expect(canvas.getByText(/Pagamento instantâneo/)).toBeVisible();
    });
  },
};
