import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
} from './card';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Card/Tamanhos',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tamanhos disponíveis do Card. A API vanilla expõe `size: "default" | "sm"`, que propaga via `data-size` e ajusta padding/fonte via `group-data-[size=sm]/card:*`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function buildProductCard(): HTMLElement {
  const card = createCard({ className: 'nds-w-full nds-max-w-sm' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
  header.appendChild(createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }));
  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'nds-text-h4 nds-font-semibold';
  price.textContent = 'R$ 1.299,00';
  content.appendChild(price);
  card.append(header, content);
  return card;
}

function buildSmallCard(): HTMLElement {
  const card = createCard({ size: 'sm', className: 'nds-w-full nds-max-w-xs' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Assinantes ativos', level: 4 }));
  const content = createCardContent();
  const value = document.createElement('p');
  value.className = 'nds-text-h4 nds-font-semibold';
  value.textContent = '8.742';
  content.appendChild(value);
  card.append(header, content);
  return card;
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tamanho padrão do Card — `data-size="default"`, padding `py-4 px-4` e título em `text-base`.',
      },
    },
  },
  render: () => buildProductCard(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector('[data-slot="card"]') as HTMLElement | null;
    await expect(card).toBeInTheDocument();
    await expect(card?.getAttribute('data-size')).toBe('default');
    await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
  },
};

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Card compacto via `createCard({ size: "sm" })` — propaga `data-size="sm"`, reduz padding/gap e ajusta o título para `text-sm`. Ideal para listas densas e dashboards.',
      },
    },
  },
  render: () => buildSmallCard(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector('[data-slot="card"]') as HTMLElement | null;
    await expect(card).toBeInTheDocument();
    await expect(card?.getAttribute('data-size')).toBe('sm');
    await expect(canvas.getByRole('heading', { name: 'Assinantes ativos' })).toBeInTheDocument();
  },
};
