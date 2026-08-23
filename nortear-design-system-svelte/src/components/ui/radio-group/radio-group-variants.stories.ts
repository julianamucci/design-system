import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';
import {
  radioGroupWithDescriptionSource,
  radioGroupHorizontalSource,
  radioGroupSource,
  radioGroupVerticalSource,
} from './radio-group.source';

const meta: Meta = {
  title: 'UI/RadioGroup/Variants',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria lista de opções logo abaixo.
      source: { transform: radioGroupSource },
      description: {
        component:
          'Variantes do RadioGroup: vertical (padrão para 4+ opções), horizontal (2–3 opções curtas) e withDescription (cada item com descrição auxiliar).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

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
      source: { transform: radioGroupVerticalSource },
      description: {
        story: 'Vertical — empilhamento padrão do grupo, recomendado para 4+ opções.',
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
    await step('As linhas ficam empilhadas, com o alvo livre da WCAG 2.5.8', async () => {
      // O rádio tem 16px de lado, abaixo dos 24px de alvo mínimo. A norma
      // aceita o alvo menor quando há espaçamento: os centros ficam a 24px ou
      // mais um do outro. É o gap do grupo que paga essa conta.
      const items = canvas.getAllByRole('radio');
      const topos = new Set(items.map((el) => Math.round(el.getBoundingClientRect().top)));
      await expect(topos.size).toBe(3);
      const [a, b] = items.map((el) => el.getBoundingClientRect());
      await expect(b.top + b.height / 2 - (a.top + a.height / 2)).toBeGreaterThanOrEqual(24);
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
      source: { transform: radioGroupHorizontalSource },
      description: {
        story:
          'Horizontal — sai de `aria-orientation="horizontal"` no grupo: o mesmo atributo anuncia a direção das setas e dispõe as opções lado a lado. Recomendado para 2–3 opções curtas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup');
    await step('O grupo anuncia a orientação horizontal', async () => {
      await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    });
    await step('As três opções ficam na mesma linha', async () => {
      // O atributo sozinho não prova nada: antes desta asserção o layout saía
      // de classes que não existem mais no CSS, e a variante "horizontal"
      // renderizava empilhada sem ninguém reprovar.
      const topos = new Set(
        canvas.getAllByRole('radio').map((el) => Math.round(el.getBoundingClientRect().top)),
      );
      await expect(topos.size).toBe(1);
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
      options: [
        { value: 'cartao', label: 'Cartão de crédito', description: 'Aprovação imediata em até 12x.' },
        { value: 'pix', label: 'Pix', description: 'Pagamento instantâneo com 5% de desconto.' },
        { value: 'boleto', label: 'Boleto bancário', description: 'Compensação em até 3 dias úteis.' },
      ],
    },
  }),
  parameters: {
    docs: {
      source: { transform: radioGroupWithDescriptionSource },
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
