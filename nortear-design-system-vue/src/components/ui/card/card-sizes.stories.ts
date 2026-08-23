import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from './index';
import { cardCompactoSource, cardSimpleSource } from './card.source';

const meta = {
  title: 'UI/Card/Sizes',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: cardSimpleSource },
      description: {
        component:
          'Tamanhos do Card: "default" para uso geral e "sm" para listas densas e dashboards. O tamanho propaga via data-size e ajusta padding e tamanho do título das partes internas.',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mede a mesma propriedade com o outro `data-size` e devolve o atributo ao
 * valor original. É o único jeito de comparar os dois tamanhos numa story que
 * mostra um só — e prova que a regra de CSS existe, em vez de afirmar que o
 * atributo está escrito. Restaura o estado, então sobrevive ao replay.
 */
function otherSizeMeasure(
  card: HTMLElement,
  other: 'default' | 'sm',
  ler: () => number,
): number {
  const original = card.getAttribute('data-size')!;
  card.setAttribute('data-size', other);
  const value = ler();
  card.setAttribute('data-size', original);
  return value;
}

export const Default: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card class="nds-w-sm">
        <CardHeader>
          <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
          <CardDescription>
            Estrutura ergonômica com ajuste de altura e apoio lombar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="nds-text-h4">R$ 1.299,00</p>
        </CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('O tamanho padrão é o declarado quando ninguém escolhe', async () => {
      await expect(card).toHaveAttribute('data-size', 'default');
    });

    await step('O título continua sendo heading no tamanho padrão', async () => {
      await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
    });
  },
};

export const Small: Story = {
  // Outro tamanho, outro conteúdo e outra moldura: os args não descrevem nada
  // nesta story, e a do meta mostraria o card no tamanho padrão.
  parameters: {
    covers: ['functional.item2'],
    docs: { source: { transform: cardCompactoSource } },
  },
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card size="sm" class="nds-w-xs">
        <CardHeader>
          <CardTitle as="h3">Assinantes ativos</CardTitle>
          <CardDescription>+12% no mês</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="nds-text-h4 nds-tabular-nums">8.742</p>
        </CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const title = card.querySelector<HTMLElement>('[data-slot="card-title"]')!;

    await step('data-size="sm" chega ao root', async () => {
      await expect(card).toHaveAttribute('data-size', 'sm');
    });

    await step('O tamanho sm reduz o padding de verdade', async () => {
      const padSm = Number.parseFloat(getComputedStyle(card).paddingTop);
      const padDefault = otherSizeMeasure(card, 'default', () =>
        Number.parseFloat(getComputedStyle(card).paddingTop),
      );
      await expect(padSm).toBeLessThan(padDefault);
    });

    await step('O tamanho sm reduz o título de verdade', async () => {
      const fonteSm = Number.parseFloat(getComputedStyle(title).fontSize);
      const fonteDefault = otherSizeMeasure(card, 'default', () =>
        Number.parseFloat(getComputedStyle(title).fontSize),
      );
      await expect(fonteSm).toBeLessThan(fonteDefault);
    });
  },
};
