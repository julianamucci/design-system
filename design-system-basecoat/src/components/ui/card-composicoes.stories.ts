import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
  createCardFooter,
} from './card';
import { createButton } from '@/components/ui/button';

const meta: Meta = {
  title: 'UI/Card/Composições',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composições canônicas do Card: com footer (ações), com slot de ação no header e com imagem como primeiro filho.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProductCardWithFooter(): HTMLElement {
  const card = createCard({ className: 'w-full max-w-sm' });

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
  header.appendChild(createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }));

  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'text-lg font-semibold';
  price.textContent = 'R$ 1.299,00';
  content.appendChild(price);

  const footer = createCardFooter({ className: 'justify-end gap-2' });
  footer.appendChild(
    createButton({ variant: 'outline', label: 'Editar', ariaLabel: 'Editar produto Cadeira Gamer Pro' }),
  );
  footer.appendChild(
    createButton({ variant: 'destructive', label: 'Excluir', ariaLabel: 'Excluir produto Cadeira Gamer Pro' }),
  );

  card.append(header, content, footer);
  return card;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Card com CardFooter para alojar ações primárias e secundárias — botões alinhados à direita com `aria-label` contextual incluindo o título.',
      },
    },
  },
  render: () => buildProductCardWithFooter(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Editar produto Cadeira Gamer Pro' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Excluir produto Cadeira Gamer Pro' })).toBeInTheDocument();
  },
};

export const WithAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Ciência: não existe `createCardAction` no vanilla. Para posicionar um botão/menu à direita do CardHeader, emule com `flex flex-row items-start justify-between` no header.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'w-full max-w-sm' });

    const header = createCardHeader({ className: 'flex flex-row items-start justify-between' });

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex flex-col space-y-1.5';
    titleWrap.appendChild(createCardTitle({ text: 'Assinantes ativos', level: 3 }));
    titleWrap.appendChild(createCardDescription({ text: '+12% no mês' }));

    header.appendChild(titleWrap);
    header.appendChild(
      createButton({
        variant: 'outline',
        size: 'sm',
        label: 'Editar',
        ariaLabel: 'Editar métrica Assinantes ativos',
      }),
    );

    const content = createCardContent();
    const value = document.createElement('p');
    value.className = 'text-2xl font-semibold';
    value.textContent = '8.742';
    content.appendChild(value);

    card.append(header, content);
    return card;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Assinantes ativos' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Editar métrica Assinantes ativos' })).toBeInTheDocument();
  },
};

export const WithImage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Ciência: a vanilla não detecta `img:first-child` automaticamente. Aplique `rounded-t-md` na imagem e remova o `pt` do Card via `p-0` + `CardHeader` normal.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'w-full max-w-sm p-0' });

    const img = document.createElement('img');
    img.src = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80';
    img.alt = 'Cadeira Gamer Pro';
    img.className = 'w-full h-40 object-cover rounded-t-md';

    const header = createCardHeader();
    header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
    header.appendChild(createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }));

    card.append(img, header);
    return card;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const img = canvas.getByRole('img', { name: 'Cadeira Gamer Pro' });
    await expect(img).toBeInTheDocument();
  },
};
