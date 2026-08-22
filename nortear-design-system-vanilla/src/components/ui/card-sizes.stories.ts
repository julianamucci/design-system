import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
} from './card';
import { cardSource, cardSourceWith } from './card.source';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Card/Sizes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: cardSource },
      description: {
        component:
          'Tamanhos do Card: "default" para uso geral e "sm" para listas densas e dashboards. O tamanho propaga via data-size e ajusta padding e tamanho do título das partes internas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Mede a mesma propriedade com o outro `data-size` e devolve o atributo ao
 * valor original. É o único jeito de comparar os dois tamanhos numa story que
 * mostra um só — e prova que a regra de CSS existe, em vez de afirmar que o
 * atributo está escrito. Restaura o estado, então sobrevive ao replay.
 */
function medirNoOutroTamanho(
  card: HTMLElement,
  outro: 'default' | 'sm',
  ler: () => number,
): number {
  const original = card.getAttribute('data-size')!;
  card.setAttribute('data-size', outro);
  const valor = ler();
  card.setAttribute('data-size', original);
  return valor;
}

function buildProductCard(): HTMLElement {
  const card = createCard({ className: 'nds-w-sm' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
  header.appendChild(
    createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }),
  );
  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'nds-text-h4';
  price.textContent = 'R$ 1.299,00';
  content.appendChild(price);
  card.append(header, content);
  return card;
}

function buildSmallCard(): HTMLElement {
  const card = createCard({ size: 'sm', className: 'nds-w-xs' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Assinantes ativos', level: 3 }));
  header.appendChild(createCardDescription({ text: '+12% no mês' }));
  const content = createCardContent();
  const value = document.createElement('p');
  value.className = 'nds-text-h4 nds-tabular-nums';
  value.textContent = '8.742';
  content.appendChild(value);
  card.append(header, content);
  return card;
}

export const Default: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story: 'Tamanho padrão do Card — padding e título na escala base.',
      },
    },
  },
  render: () => buildProductCard(),
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
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // Override de story: o tamanho é o assunto e não passa por control aqui.
      source: { transform: cardSourceWith({ size: 'sm' }) },
      description: {
        story:
          'Card compacto: o tamanho sm propaga por data-size, reduz padding e diminui o título. Ideal para listas densas e dashboards.',
      },
    },
  },
  render: () => buildSmallCard(),
  play: async ({ canvasElement, step }) => {
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;
    const title = card.querySelector<HTMLElement>('[data-slot="card-title"]')!;

    await step('data-size="sm" chega ao root', async () => {
      await expect(card).toHaveAttribute('data-size', 'sm');
    });

    await step('O tamanho sm reduz o padding de verdade', async () => {
      const padSm = Number.parseFloat(getComputedStyle(card).paddingTop);
      const padDefault = medirNoOutroTamanho(card, 'default', () =>
        Number.parseFloat(getComputedStyle(card).paddingTop),
      );
      await expect(padSm).toBeLessThan(padDefault);
    });

    await step('O tamanho sm reduz o título de verdade', async () => {
      const fonteSm = Number.parseFloat(getComputedStyle(title).fontSize);
      const fonteDefault = medirNoOutroTamanho(card, 'default', () =>
        Number.parseFloat(getComputedStyle(title).fontSize),
      );
      await expect(fonteSm).toBeLessThan(fonteDefault);
    });
  },
};
