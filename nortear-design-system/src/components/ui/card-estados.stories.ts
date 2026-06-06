import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, fn, userEvent } from 'storybook/test';
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
  tags: ['layout'],
  title: 'UI/Card/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estados canônicos do Card: padrão (container passivo), clicável (envolvido em <a>/<button>) e com footer de ações.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBasicCard(): HTMLElement {
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

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Container passivo — o Card por si só não recebe foco nem eventos de teclado. Toda a interatividade vive no conteúdo interno.',
      },
    },
  },
  render: () => buildBasicCard(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
  },
};

export const Clickable: Story = {
  args: {
    onNavigate: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card envolvido em `<a>` (ou `<button>`) com `aria-label` descritivo e `focus-visible:ring-2`. Padrão "asChild" para manter semântica e navegação por teclado.',
      },
    },
  },
  render: (args) => {
    const onNavigate = (args as { onNavigate: (payload: unknown) => void }).onNavigate;

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'nds-block nds-w-full nds-max-w-sm nds-rounded-lg';
    link.setAttribute('aria-label', 'Abrir detalhes do produto Cadeira Gamer Pro');
    link.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate({ event: 'card_click', label: 'Cadeira Gamer Pro' });
    });

    link.appendChild(buildBasicCard());
    return link;
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onNavigate = (args as { onNavigate: ReturnType<typeof fn> }).onNavigate;

    await step('Link envolvendo o Card tem aria-label descritivo', async () => {
      const link = canvas.getByRole('link', { name: /Abrir detalhes do produto/ });
      await expect(link).toBeInTheDocument();
    });

    await step('Tab foca o link; Enter dispara navegação', async () => {
      await userEvent.tab();
      const link = canvas.getByRole('link', { name: /Abrir detalhes do produto/ });
      await expect(link).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onNavigate).toHaveBeenCalled();
    });
  },
};

export const WithFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Card com CardFooter e botões de ação — o Card detecta o footer via `has-data-[slot=card-footer]:pb-0` e remove o padding-bottom automaticamente para alinhar a borda superior do footer com o container.',
      },
    },
  },
  render: () => {
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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Editar produto Cadeira Gamer Pro' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Excluir produto Cadeira Gamer Pro' })).toBeInTheDocument();
  },
};
