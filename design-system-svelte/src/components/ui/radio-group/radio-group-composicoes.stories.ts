import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';

const meta = {
  title: 'UI/RadioGroup/Composicoes',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Padrões de composição do RadioGroup: forma de pagamento (vertical), forma de entrega (horizontal) e com descrição auxiliar por item.',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FormaDePagamento: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'comp-pag',
      options: [
        { value: 'cartao', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix' },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');

    await step('3 opções renderizadas e associadas às labels', async () => {
      await expect(radios).toHaveLength(3);
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toBeInTheDocument();
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toBeInTheDocument();
      await expect(canvas.getByRole('radio', { name: 'Boleto bancário' })).toBeInTheDocument();
    });

    await step('Clicar na label seleciona o radio', async () => {
      await userEvent.click(canvas.getByText('Pix'));
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const FormaDeEntregaHorizontal: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      orientation: 'horizontal',
      ariaLabel: 'Forma de entrega',
      idPrefix: 'comp-ent',
      options: [
        { value: 'standard', label: 'Padrão (5 dias)' },
        { value: 'express', label: 'Expressa (1 dia)' },
        { value: 'pickup', label: 'Retirar na loja' },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Grupo está em orientação horizontal', async () => {
      await expect(canvas.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal');
    });
    await step('3 opções de entrega', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const ComDescricao: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      withDescription: true,
      ariaLabel: 'Forma de entrega',
      idPrefix: 'comp-desc',
      class: 'w-80',
      options: [
        { value: 'standard', label: 'Padrão', description: 'Entrega em até 5 dias úteis.' },
        { value: 'express', label: 'Expressa', description: 'Entrega em 1 dia útil.' },
        { value: 'pickup', label: 'Retirar na loja', description: 'Disponível em 2 horas.' },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Texto auxiliar visível em cada opção', async () => {
      await expect(canvas.getByText('Entrega em até 5 dias úteis.')).toBeVisible();
      await expect(canvas.getByText('Entrega em 1 dia útil.')).toBeVisible();
      await expect(canvas.getByText('Disponível em 2 horas.')).toBeVisible();
    });
    await step('Radio Padrão tem aria-describedby', async () => {
      const padrao = canvas.getByRole('radio', { name: 'Padrão' });
      await expect(padrao).toHaveAttribute('aria-describedby', 'comp-desc-standard-desc');
    });
  },
};
