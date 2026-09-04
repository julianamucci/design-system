import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';
import {
  separatorDecorativoSource,
  separatorSemanticoSource,
  separatorSource,
} from './separator.source';

const meta: Meta = {
  title: 'Components/Layout/Separator/States',
  component: SeparatorStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: separatorSource },
      description: {
        component:
          'Modos do Separator: decorativo (padrão, ignorado por leitores de tela) e semântico (anunciado como divisor, com a própria orientação).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Decorative: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item2', 'accessibility.item3'],
    docs: { source: { transform: separatorDecorativoSource } },
  },
  render: () => ({
    Component: SeparatorStory,
    props: { caso: 'estados', decorative: true },
  }),
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('Sai da árvore de acessibilidade', async () => {
      await expect(sep).toHaveAttribute('role', 'none');
      await expect(sep).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Não anuncia orientação', async () => {
      // `aria-orientation` não é permitido em role="none" e nada informaria
      // fora da árvore de acessibilidade — o atributo é ruído, não detalhe.
      await expect(sep).not.toHaveAttribute('aria-orientation');
    });
  },
};

export const Semantic: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4'],
    docs: { source: { transform: separatorSemanticoSource } },
  },
  render: () => ({
    Component: SeparatorStory,
    props: { caso: 'estados', decorative: false },
  }),
  play: async ({ canvasElement, step }) => {
    const sep = canvasElement.querySelector<HTMLElement>('.nds-separator');

    await step('Exposto como divisor', async () => {
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).not.toHaveAttribute('aria-hidden');
    });

    await step('Anuncia a própria orientação', async () => {
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};
