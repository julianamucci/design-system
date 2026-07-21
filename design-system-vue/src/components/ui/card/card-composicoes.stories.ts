import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const meta = {
  title: 'UI/Card/Composicoes',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Composicoes reais do Card: com CardFooter (border-t + bg-muted/50), com CardAction (header vira grid [1fr_auto]), com imagem como primeiro filho (auto-radius) e 3 exemplos de produto (ProductCard), métrica (MetricCard) e perfil (ProfileCard).',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFooter: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>Estrutura ergonômica com ajuste de altura.</CardDescription>
        </CardHeader>
        <CardContent class="nds-text-base nds-font-semibold">R$ 1.299,00</CardContent>
        <CardFooter class="" data-justify="end" data-spacing="sm">
          <Button variant="outline" size="sm" aria-label="Cancelar edição de Cadeira Gamer Pro">Cancelar</Button>
          <Button size="sm" aria-label="Salvar Cadeira Gamer Pro">Salvar</Button>
        </CardFooter>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const WithAction: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, Button },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>Em estoque</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
          </CardAction>
        </CardHeader>
        <CardContent class="nds-text-base nds-font-semibold">R$ 1.299,00</CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const WithImage: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <div class="aspect-video nds-w-full nds-bg-muted" aria-hidden="true" />
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>Estrutura ergonômica com ajuste de altura.</CardDescription>
        </CardHeader>
        <CardContent class="nds-text-base nds-font-semibold">R$ 1.299,00</CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ProductCard: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, Button, Badge },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <div class="aspect-video nds-w-full nds-bg-muted" aria-hidden="true" />
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>Estrutura ergonômica com ajuste de altura e apoio lombar.</CardDescription>
          <CardAction>
            <Badge variant="secondary">Em estoque</Badge>
          </CardAction>
        </CardHeader>
        <CardContent class="nds-font-semibold" style="font-size: 1.25rem">R$ 1.299,00</CardContent>
        <CardFooter class="" data-justify="end" data-spacing="sm">
          <Button variant="outline" size="sm" aria-label="Ver detalhes de Cadeira Gamer Pro">Detalhes</Button>
          <Button size="sm" aria-label="Comprar Cadeira Gamer Pro">Comprar</Button>
        </CardFooter>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ProductCard tem header, content e footer renderizados', async () => {
      await expect(canvasElement.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
      await expect(canvasElement.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
      await expect(canvasElement.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
    });

    await step('CardAction é slot à direita com Badge de status', async () => {
      const action = canvasElement.querySelector('[data-slot="card-action"]');
      await expect(action).toBeInTheDocument();
    });

    await step('Botões do footer têm aria-label contextual com o título do produto', async () => {
      await expect(canvas.getByRole('button', { name: /Ver detalhes de Cadeira Gamer Pro/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /Comprar Cadeira Gamer Pro/i })).toBeInTheDocument();
    });
  },
};

export const MetricCard: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card size="sm" class="nds-w-full nds-max-w-xs">
        <CardHeader>
          <CardTitle>Assinantes ativos</CardTitle>
          <CardDescription>+12% no mês</CardDescription>
        </CardHeader>
        <CardContent class="text-3xl nds-font-semibold">8.742</CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ProfileCard: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Avatar, AvatarFallback },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <CardHeader class="" data-align="center" data-spacing="sm">
          <Avatar class="" style="height: 2.5rem; width: 2.5rem">
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
          <div class="nds-flex-1">
            <CardTitle>Maria Rodrigues</CardTitle>
            <CardDescription>Designer de produto · São Paulo, BR</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="nds-text-body nds-text-muted-foreground">
          Atua há 8 anos com design de sistemas e experiência em produtos B2B.
        </CardContent>
        <CardFooter class="" data-justify="end" data-spacing="sm">
          <Button variant="outline" size="sm" aria-label="Ver perfil de Maria Rodrigues">Ver perfil</Button>
          <Button size="sm" aria-label="Enviar mensagem para Maria Rodrigues">Mensagem</Button>
        </CardFooter>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
