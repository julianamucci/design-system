import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import ToggleGroupStory from './ToggleGroupStory.svelte';
import {
  toggleGroupItemDesabilitadoSource,
  toggleGroupSelectionMultiplaSource,
  toggleGroupSource,
} from './toggle-group.source';

const meta: Meta = {
  title: 'UI/ToggleGroup/States',
  component: ToggleGroupStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; as que trocam o conjunto de
      // opções sobrescrevem com a sua própria marcação logo abaixo.
      source: { transform: toggleGroupSource },
      description: {
        component:
          'Estados do ToggleGroup: default, selected (aria-pressed=true), disabled (no grupo) e disabled item individual.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Sem seleção, nenhum item está marcado', async () => {
      for (const it of items) {
        await expect(it).toHaveAttribute('aria-checked', 'false');
        await expect(it).toHaveAttribute('data-state', 'off');
      }
    });

    await step('Mesmo sem seleção, um item entra na ordem de tabulação', async () => {
      // Roving tabindex não depende de haver item ativo: sem isto o grupo
      // inteiro sairia da navegação por Tab.
      const naOrdem = items.filter((b) => (b as HTMLElement).tabIndex === 0);
      await expect(naOrdem).toHaveLength(1);
    });
  },
};

export const Selected: Story = {
  args: {
    type: 'single',
    value: 'center',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: { covers: ['accessibility.item2'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Item "center" começa selecionado', async () => {
      await expect(items[1]).toHaveAttribute('aria-checked', 'true');
      await expect(items[1]).toHaveAttribute('data-state', 'on');
    });

    await step('Demais items não selecionados', async () => {
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
      await expect(items[2]).toHaveAttribute('aria-checked', 'false');
    });

    await step('accessibility.item2 — o item ativo tem fundo próprio, não só o atributo', async () => {
      // O contraste de 4.5:1 é medido pelo axe; aqui a garantia é mais rasa e
      // complementar: sem a regra de CSS, ativo e inativo pintariam igual.
      await expect(getComputedStyle(items[1]).backgroundColor).not.toBe(
        getComputedStyle(items[0]).backgroundColor,
      );
    });
  },
};

export const FocusVisible: Story = {
  args: {
    type: 'single',
    value: 'left',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  parameters: { covers: ['accessibility.item3'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Roving tabindex — apenas 1 item na ordem de tabulação', async () => {
      const naOrdem = items.filter((b) => (b as HTMLElement).tabIndex === 0);
      await expect(naOrdem).toHaveLength(1);
    });

    await step('accessibility.item3 — o anel de foco aparece na navegação por teclado', async () => {
      // `userEvent.tab()` e não `focus()`: `:focus-visible` só casa quando o
      // foco veio do teclado, e um `focus()` programático deixaria a regra
      // fora — o teste passaria verde com o anel invisível na prática.
      (items[0] as HTMLElement).blur();
      await userEvent.tab();
      await expect(items[0]).toHaveFocus();
      const sombra = getComputedStyle(items[0]).boxShadow;
      await expect(sombra).not.toBe('none');
      await expect(sombra.length).toBeGreaterThan(0);
    });

    await step('Tab sai do grupo inteiro, não item a item', async () => {
      // É a contrapartida do roving tabindex: o segundo Tab abandona a barra.
      await userEvent.tab();
      await expect(items[0]).not.toHaveFocus();
      await expect(items[1]).not.toHaveFocus();
    });
  },
};

export const MultipleSelected: Story = {
  args: {
    type: 'multiple',
    value: ['bold', 'italic'],
    kind: 'formatting',
    ariaLabel: 'Formatação',
  },
  parameters: {
    docs: { source: { transform: toggleGroupSelectionMultiplaSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('button');

    await step('Bold e Italic começam pressionados', async () => {
      await expect(items[0]).toHaveAttribute('aria-pressed', 'true');
      await expect(items[1]).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Underline não pressionado', async () => {
      await expect(items[2]).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const Disabled: Story = {
  args: {
    type: 'single',
    disabled: true,
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Todos os items estão desabilitados', async () => {
      for (const it of items) await expect(it).toBeDisabled();
    });

    await step('Clicar não altera estado', async () => {
      await userEvent.click(items[0], { pointerEventsCheck: 0 });
      await expect(items[0]).toHaveAttribute('aria-checked', 'false');
    });
  },
};

export const DisabledItem: Story = {
  args: {
    type: 'single',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
    items: [
      { value: 'left', ariaLabel: 'Alinhar à esquerda', icon: 'alignLeft' },
      { value: 'center', ariaLabel: 'Centralizar', icon: 'alignCenter', disabled: true },
      { value: 'right', ariaLabel: 'Alinhar à direita', icon: 'alignRight' },
    ],
  },
  parameters: {
    docs: { source: { transform: toggleGroupItemDesabilitadoSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('radio');

    await step('Apenas o item "center" está desabilitado', async () => {
      await expect(items[0]).not.toBeDisabled();
      await expect(items[1]).toBeDisabled();
      await expect(items[2]).not.toBeDisabled();
    });
  },
};

export const Sm: Story = {
  args: {
    type: 'single',
    size: 'sm',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-size=sm', async () => {
      await expect(group).toHaveAttribute('data-size', 'sm');
    });
  },
};

export const Lg: Story = {
  args: {
    type: 'single',
    size: 'lg',
    kind: 'alignment',
    ariaLabel: 'Alinhamento do texto',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group');

    await step('Grupo tem data-size=lg', async () => {
      await expect(group).toHaveAttribute('data-size', 'lg');
    });
  },
};
