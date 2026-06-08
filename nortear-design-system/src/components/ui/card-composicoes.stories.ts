import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardAction,
  createCardContent,
  createCardFooter,
} from './card';
import { createButton } from '@/components/ui/button';

const meta: Meta = {
  tags: ['layout'],
  title: 'UI/Card/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composicoes canônicas do Card: com footer (ações), com slot de ação no header via `createCardAction` e com imagem como primeiro filho (padding automático removido).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProductCardWithFooter(): HTMLElement {
  const card = createCard({ className: 'nds-w-full nds-max-w-sm' });

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: 'Cadeira Gamer Pro', level: 3 }));
  header.appendChild(createCardDescription({ text: 'Estrutura ergonômica com ajuste de altura e apoio lombar.' }));

  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'nds-text-h4 nds-font-semibold';
  price.textContent = 'R$ 1.299,00';
  content.appendChild(price);

  const footer = createCardFooter({ className: 'nds-cluster' });
  footer.dataset.spacing = 'sm';
  footer.dataset.justify = 'end';
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
          'Slot de ação no header via `createCardAction` — posiciona o botão em `col-start-2 row-span-2` ao lado do título/descrição, usando o grid `has-data-[slot=card-action]:grid-cols-[1fr_auto]` do CardHeader.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-full nds-max-w-sm' });

    const header = createCardHeader();
    header.appendChild(createCardTitle({ text: 'Assinantes ativos', level: 3 }));
    header.appendChild(createCardDescription({ text: '+12% no mês' }));

    const action = createCardAction();
    action.appendChild(
      createButton({
        variant: 'outline',
        size: 'sm',
        label: 'Editar',
        ariaLabel: 'Editar métrica Assinantes ativos',
      }),
    );
    header.appendChild(action);

    const content = createCardContent();
    const value = document.createElement('p');
    value.className = 'nds-text-h3 nds-font-semibold';
    value.textContent = '8.742';
    content.appendChild(value);

    card.append(header, content);
    return card;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvasElement.querySelector('[data-slot="card-action"]') as HTMLElement | null;
    await expect(action).toBeInTheDocument();
    await expect(canvas.getByRole('heading', { name: 'Assinantes ativos' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Editar métrica Assinantes ativos' })).toBeInTheDocument();
  },
};

export const WithImage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Imagem como primeiro filho do Card — a classe `has-[>img:first-child]:pt-0` remove o padding-top automaticamente, e `*:[img:first-child]:rounded-t-(--radius-card)` arredonda o topo da imagem.',
      },
    },
  },
  render: () => {
    const card = createCard({ className: 'nds-w-full nds-max-w-sm' });

    const img = document.createElement('img');
    img.src = 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80';
    img.alt = 'Cadeira Gamer Pro';
    img.className = 'nds-w-full';
    img.style.height = '10rem';
    img.style.objectFit = 'cover';

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
