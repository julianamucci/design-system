import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import SeparatorStory from './SeparatorStory.svelte';

const meta: Meta = {
  title: 'UI/Separator/Compositions',
  component: SeparatorStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composições do Separator: dentro de um Card, dentro de um menu vertical e com a ênfase forte.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const InCard: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({ Component: SeparatorStory, props: { caso: 'card' } }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('.nds-card')!;
    const sep = card.querySelector<HTMLElement>('.nds-separator');

    await step('Separa o cabeçalho do conteúdo dentro do Card', async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    });

    await step('Não estoura a largura do Card', async () => {
      // Separador dentro de um contêiner com padding é onde a largura costuma
      // vazar — medir o par prova que ele respeita a caixa.
      const caixa = sep!.getBoundingClientRect();
      await expect(caixa.width).toBeGreaterThan(0);
      await expect(caixa.width).toBeLessThanOrEqual(card.getBoundingClientRect().width);
    });
  },
};

export const InMenu: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({ Component: SeparatorStory, props: { caso: 'menu' } }),
  play: async ({ canvasElement, step }) => {
    const menu = canvasElement.querySelector<HTMLElement>('.nds-stack')!;
    const sep = menu.querySelector<HTMLElement>('.nds-separator')!;
    const itens = [...menu.children].filter((c) => !c.classList.contains('nds-separator'));

    await step('A divisão entre grupos é anunciada', async () => {
      await expect(sep).toHaveAttribute('role', 'separator');
      await expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
    });

    await step('Fica ENTRE os dois grupos, não dentro de um deles', async () => {
      const meio = sep.getBoundingClientRect().top;
      await expect(itens).toHaveLength(3);
      await expect(itens[1].getBoundingClientRect().bottom).toBeLessThanOrEqual(meio + 1);
      await expect(itens[2].getBoundingClientRect().top).toBeGreaterThanOrEqual(meio - 1);
    });
  },
};

export const EmphasisStrong: Story = {
  parameters: { covers: ['functional.item5', 'functional.item6', 'visual.item5'] },
  render: () => ({ Component: SeparatorStory, props: { caso: 'emphasis' } }),
  play: async ({ canvasElement, step }) => {
    const padrao = canvasElement.querySelector<HTMLElement>('[data-testid="padrao"]')!;
    const forte = canvasElement.querySelector<HTMLElement>('[data-testid="forte"]')!;

    await step('A ênfase forte dobra a espessura', async () => {
      await expect(forte).toHaveAttribute('data-emphasis', 'strong');
      await expect(padrao.getBoundingClientRect().height).toBeCloseTo(1, 1);
      await expect(forte.getBoundingClientRect().height).toBeCloseTo(2, 1);
    });

    await step('A ênfase forte troca o token de cor da linha', async () => {
      // Comparar com o separador padrão renderizado ao lado, e não com um valor
      // literal: o token muda por tema, a diferença entre os dois não.
      await expect(getComputedStyle(forte).backgroundColor).not.toBe(
        getComputedStyle(padrao).backgroundColor,
      );
    });

    await step('A classe extra convive com a classe base', async () => {
      await expect(forte).toHaveClass('nds-separator');
      await expect(forte).toHaveClass('nds-mt-4');
    });
  },
};
