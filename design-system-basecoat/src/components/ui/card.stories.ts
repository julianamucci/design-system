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
import { createCardDocs } from '@/components/docs/CardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CardArgs = {
  title: string;
  description: string;
  price: string;
  showFooter: boolean;
};

const meta: Meta<CardArgs> = {
  title: 'UI/Card',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createCardDocs) },
  },
  argTypes: {
    title: { control: 'text', description: 'Texto do CardTitle (substantivo, sem ponto final).' },
    description: { control: 'text', description: 'Texto do CardDescription (frase completa, máx. 2 linhas).' },
    price: { control: 'text', description: 'Valor exibido no CardContent.' },
    showFooter: { control: 'boolean', description: 'Exibe o CardFooter com botões.' },
  },
  args: {
    title: 'Cadeira Gamer Pro',
    description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
    price: 'R$ 1.299,00',
    showFooter: true,
  },
};

export default meta;
type Story = StoryObj<CardArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildPlaygroundCard(args: CardArgs): HTMLElement {
  // Ciência: a API vanilla atual (createCard/Header/Title/Description/Content/Footer)
  // não expõe prop size, data-slot="card" nem CardAction. Usamos apenas o que existe.
  const card = createCard({ className: 'w-full max-w-sm' });

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: args.title, level: 3 }));
  header.appendChild(createCardDescription({ text: args.description }));

  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'text-lg font-semibold';
  price.textContent = args.price;
  content.appendChild(price);

  card.append(header, content);

  if (args.showFooter) {
    const footer = createCardFooter({ className: 'justify-end gap-2' });
    footer.appendChild(
      createButton({
        variant: 'outline',
        label: 'Editar',
        ariaLabel: `Editar produto ${args.title}`,
      }),
    );
    footer.appendChild(
      createButton({
        variant: 'destructive',
        label: 'Excluir',
        ariaLabel: `Excluir produto ${args.title}`,
      }),
    );
    card.appendChild(footer);
  }

  return card;
}

export const Playground: Story = {
  render: (args) => buildPlaygroundCard(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Card é um container estrutural presente no DOM', async () => {
      // Ciência: o vanilla atual não adiciona data-slot="card" — validamos a classe .card.
      const card = canvasElement.querySelector('.card') as HTMLElement | null;
      await expect(card).toBeInTheDocument();
      // Se um dia o data-slot for adicionado, a asserção abaixo passa a fazer sentido:
      if (card?.hasAttribute('data-slot')) {
        await expect(card.getAttribute('data-slot')).toBe('card');
      }
    });

    await step('CardTitle (heading) é acessível pelo nome', async () => {
      await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
    });

    await step('Botões internos expõem aria-label contextual incluindo o título do card', async () => {
      const editar = canvas.getByRole('button', { name: 'Editar produto Cadeira Gamer Pro' });
      const excluir = canvas.getByRole('button', { name: 'Excluir produto Cadeira Gamer Pro' });
      await expect(editar).toBeInTheDocument();
      await expect(excluir).toBeInTheDocument();
    });
  },
};
