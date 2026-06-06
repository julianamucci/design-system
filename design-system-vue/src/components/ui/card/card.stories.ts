import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from './index';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CardDocs from '@/components/docs/CardDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs', 'layout'],
  parameters: {
    docs: {
      page: withAutoDocsTab(CardDocs),
      description: {
        component:
          'Card agrupa conteúdo relacionado em uma unidade visualmente delimitada. Composto por 7 subcomponentes (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter) com prop size="default"|"sm" que propaga via data-size para ajustar padding e tipografia.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Tamanho do Card — afeta padding e fonte do título via data-size',
    },
  },
  args: {
    size: 'default',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, Button, Badge },
    setup() { return { args }; },
    template: `
      <Card v-bind="args" class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>
            Estrutura ergonômica com ajuste de altura e apoio lombar.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">Em estoque</Badge>
          </CardAction>
        </CardHeader>
        <CardContent class="text-base font-semibold">R$ 1.299,00</CardContent>
        <CardFooter class="justify-end gap-2">
          <Button variant="outline" size="sm" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
          <Button size="sm" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
        </CardFooter>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Card root renderiza com data-slot="card"', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toBeInTheDocument();
      await expect(card).toHaveAttribute('data-size', 'default');
    });

    await step('CardHeader vira grid [1fr_auto] por conter CardAction', async () => {
      const header = canvasElement.querySelector('[data-slot="card-header"]');
      await expect(header).toBeInTheDocument();
      const action = canvasElement.querySelector('[data-slot="card-action"]');
      await expect(action).toBeInTheDocument();
    });

    await step('CardTitle e CardDescription estão visíveis', async () => {
      await expect(canvas.getByText('Cadeira Gamer Pro')).toBeVisible();
      await expect(canvas.getByText(/Estrutura ergonômica/)).toBeVisible();
    });

    await step('CardFooter ganha border-t e bg-muted/50', async () => {
      const footer = canvasElement.querySelector('[data-slot="card-footer"]');
      await expect(footer).toBeInTheDocument();
      await expect(footer).toHaveClass('border-t');
      await expect(footer).toHaveClass('bg-muted/50');
    });

    await step('Botões internos têm aria-label contextual incluindo o título do Card', async () => {
      const editBtn = canvas.getByRole('button', { name: /Editar produto Cadeira Gamer Pro/i });
      const deleteBtn = canvas.getByRole('button', { name: /Excluir produto Cadeira Gamer Pro/i });
      await expect(editBtn).toBeInTheDocument();
      await expect(deleteBtn).toBeInTheDocument();
    });

    await step('Ordem DOM: título → descrição → ação (leitura linear)', async () => {
      const header = canvasElement.querySelector('[data-slot="card-header"]');
      const children = Array.from(header?.children ?? []);
      const slots = children.map((c) => c.getAttribute('data-slot'));
      await expect(slots).toEqual(['card-title', 'card-description', 'card-action']);
    });
  },
};
