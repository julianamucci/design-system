import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';
import {
  radioGroupEntregaWithDescriptionSource,
  radioGroupEntregaHorizontalSource,
  radioGroupSource,
  radioGroupVerticalSource,
} from './radio-group.source';

const meta: Meta = {
  title: 'Primitives/Form/RadioGroup/Compositions',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: radioGroupSource },
      description: {
        component:
          'Padrões de composição do RadioGroup: forma de pagamento (vertical), forma de entrega (horizontal) e com descrição auxiliar por item.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const PaymentMethod: Story = {
  parameters: {
    docs: { source: { transform: radioGroupVerticalSource } },
  },
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
      // O rótulo faz parte do alvo de clique. Clicar num rótulo já escolhido o
      // mantém escolhido, então o passo sobrevive ao replay.
      await userEvent.click(canvas.getByText('Pix'));
      await expect(canvas.getByRole('radio', { name: 'Pix' })).toHaveAttribute('aria-checked', 'true');
      await expect(canvas.getByRole('radio', { name: 'Cartão de crédito' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });
  },
};

export const HorizontalDeliveryMethod: Story = {
  parameters: {
    docs: { source: { transform: radioGroupEntregaHorizontalSource } },
  },
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
    await step('Grupo está em orientação horizontal, e as opções na mesma linha', async () => {
      await expect(canvas.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal');
      const topos = new Set(
        canvas.getAllByRole('radio').map((el) => Math.round(el.getBoundingClientRect().top)),
      );
      await expect(topos.size).toBe(1);
    });
    await step('3 opções de entrega', async () => {
      await expect(canvas.getAllByRole('radio')).toHaveLength(3);
    });
  },
};

export const WithDescription: Story = {
  parameters: {
    docs: { source: { transform: radioGroupEntregaWithDescriptionSource } },
  },
  render: () => ({
    Component: RadioGroupStory,
    props: {
      withDescription: true,
      ariaLabel: 'Forma de entrega',
      idPrefix: 'comp-desc',
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
