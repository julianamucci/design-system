import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';
import {
  separatorHorizontalSource,
  separatorSource,
  separatorVerticalSource,
} from './separator.source';

const meta: Meta = {
  title: 'Components/Layout/Separator/Variants',
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
          'Orientações do Separator. A horizontal é uma linha de 1px de altura que ocupa a largura do contêiner; a vertical é uma linha de 1px de largura cuja altura vem do contêiner flex ou de grade, sem medida cravada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: { source: { transform: separatorHorizontalSource } },
  },
  render: () => ({
    Component: SeparatorStory,
    props: { caso: 'variantes', orientation: 'horizontal' },
  }),
  play: async ({ canvasElement, step }) => {
    const wrap = canvasElement.querySelector<HTMLElement>('.nds-stack')!;
    const sep = wrap.querySelector<HTMLElement>('.nds-separator');

    await step('A orientação horizontal chega ao DOM', async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Linha fina na altura e cheia na largura', async () => {
      // O que o horizontal promete é linha cheia e fina. Medir os dois evita
      // que uma troca de folha passe com o atributo certo e o visual errado.
      const box = sep!.getBoundingClientRect();
      await expect(box.height).toBeCloseTo(1, 1);
      await expect(box.width).toBeCloseTo(wrap.getBoundingClientRect().width, 0);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: { source: { transform: separatorVerticalSource } },
  },
  render: () => ({
    Component: SeparatorStory,
    props: { caso: 'variantes', orientation: 'vertical' },
  }),
  play: async ({ canvasElement, step }) => {
    const seps = canvasElement.querySelectorAll<HTMLElement>('.nds-separator');

    await step('As duas linhas verticais chegam ao DOM', async () => {
      await expect(seps).toHaveLength(2);
      await expect(seps[0]).toHaveAttribute('data-orientation', 'vertical');
    });

    await step('Linha fina na largura e esticada na altura, sem medida cravada', async () => {
      // Este é o caso que a asserção antiga jamais pegaria: o separador vertical
      // colapsa para 0px quando o contêiner não é flex nem grade, e continua
      // presente no DOM com o atributo certo. Medir a altura é o que denuncia.
      const box = seps[0].getBoundingClientRect();
      await expect(box.width).toBeCloseTo(1, 1);
      await expect(box.height).toBeGreaterThan(8);
      await expect(seps[0].style.height).toBe('');
    });
  },
};
