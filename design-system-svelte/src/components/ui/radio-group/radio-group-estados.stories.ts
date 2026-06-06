import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { RadioGroup } from './index';
import RadioGroupStory from './RadioGroupStory.svelte';

const meta = {
  title: 'UI/RadioGroup/Estados',
  component: RadioGroup,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do RadioGroup: default, checked, focus, disabled (grupo inteiro), itemDisabled (somente um item) e invalid (aria-invalid).',
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultOptions = [
  { value: 'cartao', label: 'Cartão de crédito' },
  { value: 'pix', label: 'Pix' },
];

export const Default: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-def',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Nenhum item selecionado por padrão', async () => {
      for (const r of radios) await expect(r).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const Checked: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      value: 'pix',
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-chk',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pix = canvas.getByRole('radio', { name: /Pix/ });
    await step('Item Pix está selecionado', async () => {
      await expect(pix).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const FocoVisivel: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-foc',
      options: defaultOptions,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Foco via teclado: Tab entra no grupo, setas movem entre itens com auto-seleção em desktop.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Primeiro item recebe foco programaticamente', async () => {
      (radios[0] as HTMLElement).focus();
      await expect(radios[0]).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      disabled: true,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-dis',
      options: defaultOptions,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const radios = canvas.getAllByRole('radio');
    await step('Todos os itens estão desabilitados', async () => {
      for (const r of radios) {
        await expect(r).toBeDisabled();
      }
    });
    await step('Clicar não altera seleção', async () => {
      await userEvent.click(radios[0], { pointerEventsCheck: 0 });
      await expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-itd',
      options: [
        { value: 'cartao', label: 'Cartão de crédito' },
        { value: 'pix', label: 'Pix (indisponível)', disabled: true },
        { value: 'boleto', label: 'Boleto bancário' },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const pix = canvas.getByRole('radio', { name: /Pix/i });
    await step('Apenas o item Pix está desabilitado', async () => {
      await expect(pix).toBeDisabled();
    });
  },
};

export const Invalid: Story = {
  render: () => ({
    Component: RadioGroupStory,
    props: {
      ariaInvalid: true,
      ariaLabel: 'Forma de pagamento',
      idPrefix: 'est-inv',
      options: defaultOptions,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Grupo com `aria-invalid="true"` — borda destrutiva e anel destrutivo de 20% opacidade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup');
    await step('Grupo está marcado como aria-invalid', async () => {
      await expect(group).toHaveAttribute('aria-invalid', 'true');
    });
  },
};
