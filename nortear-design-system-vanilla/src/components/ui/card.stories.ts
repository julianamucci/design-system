import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
  createCardFooter,
} from './card';
import { cardSource } from './card.source';
import { createButton } from '@/components/ui/button';
import { createCardDocs } from '@/components/docs/CardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CardArgs = {
  size: 'default' | 'sm';
  title: string;
  description: string;
  price: string;
  showFooter: boolean;
};

const meta: Meta<CardArgs> = {
  title: 'UI/Card',
  tags: ['autodocs', 'layout'],
  parameters: {
    docs: {
      page: withAutoDocsTab(createCardDocs),
      source: { transform: cardSource },
    },
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['default', 'sm'],
      description: 'Tamanho do Card — propaga via data-size para as partes internas.',
      table: {
        type: { summary: '"default" | "sm"' },
        defaultValue: { summary: '"default"' },
      },
    },
    title: {
      control: 'text',
      description: 'Texto do CardTitle (substantivo, sem ponto final).',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Texto do CardDescription (frase completa, máx. 2 linhas).',
      table: { type: { summary: 'string' } },
    },
    price: {
      control: 'text',
      description: 'Valor exibido no CardContent.',
      table: { type: { summary: 'string' } },
    },
    showFooter: {
      control: 'boolean',
      description: 'Exibe o CardFooter com as ações do card.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    size: 'default',
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
  const card = createCard({ size: args.size, className: 'nds-w-sm' });

  const header = createCardHeader();
  header.appendChild(createCardTitle({ text: args.title, level: 3 }));
  header.appendChild(createCardDescription({ text: args.description }));

  const content = createCardContent();
  const price = document.createElement('p');
  price.className = 'nds-text-h4';
  price.textContent = args.price;
  content.appendChild(price);

  card.append(header, content);

  if (args.showFooter) {
    const footer = createCardFooter({ className: 'nds-cluster' });
    footer.dataset.spacing = 'sm';
    footer.dataset.justify = 'end';
    footer.appendChild(
      createButton({
        variant: 'outline',
        label: 'Editar',
        'aria-label': `Editar produto ${args.title}`,
      }),
    );
    footer.appendChild(
      createButton({
        variant: 'destructive',
        label: 'Excluir',
        'aria-label': `Excluir produto ${args.title}`,
      }),
    );
    card.appendChild(footer);
  }

  return card;
}

export const Playground: Story = {
  parameters: {
    // accessibility.item1 e item6 saem do axe, que o addon-a11y roda em toda
    // story — mas o auditor só enxerga o critério se alguma story o declarar.
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item3',
      'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => buildPlaygroundCard(args),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('As partes do Card emitem os data-slot esperados', async () => {
      // data-slot é o contrato de markup que as cinco stacks compartilham —
      // classe muda de tema para tema, o slot não.
      await expect(card).toBeInTheDocument();
      for (const slot of ['card-header', 'card-title', 'card-description', 'card-content']) {
        await expect(card.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
      }
    });

    await step('Header, conteúdo e rodapé são filhos DIRETOS, nessa ordem', async () => {
      // A regra que zera o padding inferior do card exige o rodapé como filho
      // direto; um wrapper entre os dois a mataria sem mudar nada visível aqui.
      // A lista acompanha o control, então a asserção segue valendo se alguém
      // desligar o rodapé no painel e a play reexecutar.
      const esperado = ['card-header', 'card-content'];
      if (args.showFooter) esperado.push('card-footer');
      const slots = [...card.children].map((el) => el.getAttribute('data-slot'));
      await expect(slots).toEqual(esperado);
    });

    await step('O rodapé se separa do conteúdo por uma borda superior', async () => {
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]');
      const borda = footer
        ? Number.parseFloat(getComputedStyle(footer).borderTopWidth)
        : Number.NaN;
      await expect(args.showFooter ? borda > 0 : Number.isNaN(borda)).toBe(true);
    });

    await step('O título é um heading de verdade', async () => {
      // O CSS dá aparência de título; quem dá a semântica é o elemento.
      await expect(canvas.getByRole('heading', { name: args.title })).toBeInTheDocument();
    });

    await step('O tamanho escolhido chega ao DOM', async () => {
      await expect(card).toHaveAttribute('data-size', args.size);
    });

    await step('Os botões do rodapé nomeiam o produto que editam', async () => {
      // "Excluir" sozinho vira uma fileira de botões idênticos numa lista de
      // cards para quem navega por leitor de tela.
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]');
      const nomes = footer
        ? [...footer.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))
        : [];
      await expect(nomes).toEqual(
        args.showFooter
          ? [`Editar produto ${args.title}`, `Excluir produto ${args.title}`]
          : [],
      );
    });
  },
};
