import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
} from './card';

// Ciência: a API vanilla de Card NÃO expõe prop `size`. No React/Vue/Svelte,
// `size="default"|"sm"` propaga via `data-size` e ajusta padding + fonte via
// `group-data-[size=sm]/card:*`. Enquanto o vanilla não implementa, simulamos
// o tamanho compacto combinando className (p-3 + gap-2) e level={4} no título.
const meta: Meta = {
  title: 'UI/Card/Tamanhos',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Tamanhos disponíveis do Card. A API vanilla atual não tem prop `size`; o tamanho compacto é simulado via className até a paridade com React.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function buildProductCard(): HTMLElement {
  const card = createCard({ className: 'w-full max-w-sm' });
  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
  header.appendChild(createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }));
  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'text-lg font-semibold';
  price.textContent = 'R$ 1.299,00';
  content.appendChild(price);
  card.append(header, content);
  return card;
}

function buildSmallCard(): HTMLElement {
  // Ciência: size="sm" inexistente — compactamos o Card via className.
  const card = createCard({ className: 'w-full max-w-xs p-3 gap-2' });
  const header = createCardHeader({ className: 'p-0' });
  header.appendChild(createCardTitle({ text: 'Assinantes ativos', level: 4, className: 'text-sm' }));
  const content = createCardContent({ className: 'p-0' });
  const value = document.createElement('p');
  value.className = 'text-lg font-semibold';
  value.textContent = '8.742';
  content.appendChild(value);
  card.append(header, content);
  return card;
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tamanho padrão do Card — padding completo (`p-6` no header/content) e título em `text-base`.',
      },
    },
  },
  render: () => buildProductCard(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
  },
};

export const Small: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Ciência: API vanilla sem prop `size`. Simula-se o tamanho compacto via `className="p-3 gap-2"` no Card e `text-sm` no CardTitle. Em listas densas e dashboards.',
      },
    },
  },
  render: () => buildSmallCard(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Assinantes ativos' })).toBeInTheDocument();
  },
};
