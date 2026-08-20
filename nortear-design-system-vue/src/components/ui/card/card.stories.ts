import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './index';
import { Button } from '@/components/ui/button';
import CardDocs from '@/components/docs/CardDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { cardSource } from './card.source';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs', 'layout'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CardDocs),
      source: { transform: cardSource },
      description: {
        component:
          'Card agrupa conteúdo relacionado em uma unidade visualmente delimitada. Composto por 7 partes (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter) e um tamanho que propaga via data-size para ajustar padding e tipografia.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Tamanho do Card — propaga via data-size para as partes internas.',
      table: {
        type: { summary: '"default" | "sm"' },
        defaultValue: { summary: '"default"' },
      },
    },
  },
  args: {
    size: 'default',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

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
  render: (args) => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button },
    setup() { return { args }; },
    template: `
      <Card v-bind="args" class="nds-w-cap-sm">
        <CardHeader>
          <CardTitle as="h3">Cadeira Gamer Pro</CardTitle>
          <CardDescription>
            Estrutura ergonômica com ajuste de altura e apoio lombar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="nds-text-h4">R$ 1.299,00</p>
        </CardContent>
        <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
          <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
          <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
        </CardFooter>
      </Card>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector<HTMLElement>('[data-slot="card"]')!;

    await step('As partes do Card emitem os data-slot esperados', async () => {
      // data-slot é o contrato de markup que as cinco stacks compartilham —
      // classe muda de tema para tema, o slot não.
      await expect(card).toBeInTheDocument();
      for (const slot of [
        'card-header',
        'card-title',
        'card-description',
        'card-content',
        'card-footer',
      ]) {
        await expect(card.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
      }
    });

    await step('Header, conteúdo e rodapé são filhos DIRETOS, nessa ordem', async () => {
      // A regra que zera o padding inferior do card exige o rodapé como filho
      // direto; um wrapper entre os dois a mataria sem mudar nada visível aqui.
      const slots = [...card.children].map((el) => el.getAttribute('data-slot'));
      await expect(slots).toEqual(['card-header', 'card-content', 'card-footer']);
    });

    await step('O rodapé se separa do conteúdo por uma borda superior', async () => {
      const footer = card.querySelector<HTMLElement>('[data-slot="card-footer"]')!;
      await expect(
        Number.parseFloat(getComputedStyle(footer).borderTopWidth),
      ).toBeGreaterThan(0);
    });

    await step('O título é um heading de verdade', async () => {
      // O CSS dá aparência de título; quem dá a semântica é o elemento.
      await expect(canvas.getByRole('heading', { name: 'Cadeira Gamer Pro' })).toBeInTheDocument();
    });

    await step('O tamanho escolhido chega ao DOM', async () => {
      await expect(card).toHaveAttribute('data-size', args.size!);
    });

    await step('Os botões do rodapé nomeiam o produto que editam', async () => {
      // "Excluir" sozinho vira uma fileira de botões idênticos numa lista de
      // cards para quem navega por leitor de tela.
      await expect(
        canvas.getByRole('button', { name: 'Editar produto Cadeira Gamer Pro' }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('button', { name: 'Excluir produto Cadeira Gamer Pro' }),
      ).toBeInTheDocument();
    });
  },
};
