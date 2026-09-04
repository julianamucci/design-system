import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_CARD } from './card';
import { NdsButton } from './button';
import { cardPlaygroundSource, type CardArgs } from './card.source';
import { NdsCardDocs } from '@/components/docs/CardDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<CardArgs> = {
  title: 'Components/Layout/Card',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [...NDS_CARD, NdsButton] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsCardDocs) },
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'sm'],
      description: 'Tamanho do Card. Propaga padding e tipografia para as partes internas.',
      table: {
        type: { summary: '"default" | "sm"' },
        defaultValue: { summary: '"default"' },
      },
    },
    title: { control: 'text', description: 'Título do Card.', table: { type: { summary: 'string' } } },
    description: { control: 'text', description: 'Texto secundário sob o título.', table: { type: { summary: 'string' } } },
    content: { control: 'text', description: 'Corpo do Card.', table: { type: { summary: 'string' } } },
    withFooter: { control: 'boolean', description: 'Exibe o rodapé com as ações do card.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    withAction: { control: 'boolean', description: 'Exibe o slot de ação no canto do header.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
  },
  args: {
    size: 'default',
    title: 'Cadeira Gamer Pro',
    description: 'Estrutura ergonômica com ajuste de altura e apoio lombar.',
    content: 'R$ 1.299,00',
    withFooter: true,
    withAction: false,
  },
};

export default meta;
type Story = StoryObj<CardArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: cardPlaygroundSource } },
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
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsCard [size]="size" class="nds-w-sm">
        <div ndsCardHeader>
          <h3 ndsCardTitle>{{ title }}</h3>
          <p ndsCardDescription>{{ description }}</p>
          @if (withAction) {
            <div ndsCardAction>
              <button ndsButton variant="ghost" size="sm" [attr.aria-label]="'Editar produto ' + title">Editar</button>
            </div>
          }
        </div>
        <div ndsCardContent>{{ content }}</div>
        @if (withFooter) {
          <div ndsCardFooter class="nds-cluster" data-justify="end" data-spacing="md">
            <button ndsButton variant="outline" [attr.aria-label]="'Editar produto ' + title">Editar</button>
            <button ndsButton variant="destructive" [attr.aria-label]="'Excluir produto ' + title">Excluir</button>
          </div>
        }
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
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

    await step('O markup é <div>, como nas outras stacks', async () => {
      // Diretiva de atributo e não elemento próprio: se alguém trocar por
      // <nds-card>, classe e data-slot continuam certos e só isto acusa.
      await expect(card.tagName).toBe('DIV');
    });

    await step('Header, conteúdo e rodapé são filhos DIRETOS, nessa ordem', async () => {
      // A regra que zera o padding inferior do card exige o rodapé como filho
      // direto. A lista acompanha o control, então a asserção segue valendo se
      // alguém desligar o rodapé no painel e a play reexecutar.
      const esperado = ['card-header', 'card-content'];
      if (args.withFooter) esperado.push('card-footer');
      const slots = [...card.children].map((el) => el.getAttribute('data-slot'));
      await expect(slots).toEqual(esperado);
    });

    await step('O rodapé se separa do conteúdo por uma borda superior', async () => {
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]');
      const border = footer
        ? Number.parseFloat(getComputedStyle(footer).borderTopWidth)
        : Number.NaN;
      await expect(args.withFooter ? border > 0 : Number.isNaN(border)).toBe(true);
    });

    await step('O título é um heading de verdade', async () => {
      // O CSS dá aparência de título; quem dá a semântica é o elemento.
      await expect(canvas.getByRole('heading', { name: args.title })).toBeTruthy();
    });

    await step('O tamanho escolhido chega ao DOM', async () => {
      await expect(card).toHaveAttribute('data-size', args.size);
    });

    await step('Os botões do rodapé nomeiam o produto que editam', async () => {
      // "Excluir" sozinho vira uma fileira de botões idênticos numa lista de
      // cards para quem navega por leitor de tela.
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]');
      const names = footer
        ? [...footer.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))
        : [];
      await expect(names).toEqual(
        args.withFooter
          ? [`Editar produto ${args.title}`, `Excluir produto ${args.title}`]
          : [],
      );
    });
  },
};
