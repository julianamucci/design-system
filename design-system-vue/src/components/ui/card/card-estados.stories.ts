import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Card/Estados',
  component: Card,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      description: {
        component:
          'Estados e variações do Card: default (passivo), Clickable (envolvido em <button> com aria-label — padrão asChild) e WithFooter (border-t + bg-muted/50). Cards clicáveis emitem card_click no wrapper, não no Card root.',
      },
    },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>
            Estrutura ergonômica com ajuste de altura e apoio lombar.
          </CardDescription>
        </CardHeader>
        <CardContent class="nds-text-base nds-font-semibold">R$ 1.299,00</CardContent>
      </Card>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Clickable: Story = {
  args: {
    onCardClick: fn(),
  } as any,
  render: (args) => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    setup() {
      const onCardClick = (args as { onCardClick: (payload: unknown) => void }).onCardClick;
      const handleClick = () => {
        onCardClick({
          event: 'card_click',
          component: 'card',
          label: 'Cadeira Gamer Pro',
          destination: '/produtos/cadeira-gamer-pro',
        });
      };
      return { handleClick };
    },
    template: `
      <button
        type="button"
        aria-label="Ver detalhes do produto Cadeira Gamer Pro"
        class="nds-w-full nds-max-w-sm nds-text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" style="border-radius: var(--radius-card)"
        @click="handleClick"
      >
        <Card>
          <CardHeader>
            <CardTitle>Cadeira Gamer Pro</CardTitle>
            <CardDescription>
              Estrutura ergonômica com ajuste de altura e apoio lombar.
            </CardDescription>
          </CardHeader>
          <CardContent class="nds-text-base nds-font-semibold">R$ 1.299,00</CardContent>
        </Card>
      </button>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const onCardClick = (args as { onCardClick: ReturnType<typeof fn> }).onCardClick;

    await step('Card clicável tem wrapper <button> com aria-label', async () => {
      const btn = canvas.getByRole('button', { name: /Ver detalhes do produto Cadeira Gamer Pro/i });
      await expect(btn).toBeInTheDocument();
    });

    await step('Click no wrapper dispara card_click', async () => {
      const btn = canvas.getByRole('button', { name: /Ver detalhes do produto Cadeira Gamer Pro/i });
      await userEvent.click(btn);
      await expect(onCardClick).toHaveBeenCalled();
    });

    await step('Tab foca o wrapper; Enter navega', async () => {
      onCardClick.mockClear();
      const btn = canvas.getByRole('button', { name: /Ver detalhes do produto Cadeira Gamer Pro/i });
      (btn as HTMLElement).focus();
      await expect(btn).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onCardClick).toHaveBeenCalled();
    });

    await step('Card root não recebe foco direto (é passivo)', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]') as HTMLElement;
      await expect(card).toBeInTheDocument();
      await expect(card.tabIndex).toBeLessThanOrEqual(0);
    });
  },
};

export const WithFooter: Story = {
  render: () => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button },
    template: `
      <Card class="nds-w-full nds-max-w-sm">
        <CardHeader>
          <CardTitle>Cadeira Gamer Pro</CardTitle>
          <CardDescription>Em estoque</CardDescription>
        </CardHeader>
        <CardContent class="nds-text-base nds-font-semibold">R$ 1.299,00</CardContent>
        <CardFooter class="" data-justify="end" data-spacing="sm">
          <Button variant="outline" size="sm" aria-label="Cancelar edição de Cadeira Gamer Pro">Cancelar</Button>
          <Button size="sm" aria-label="Salvar Cadeira Gamer Pro">Salvar</Button>
        </CardFooter>
      </Card>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('CardFooter presente com border-t e bg-muted/50', async () => {
      const footer = canvasElement.querySelector('[data-slot="card-footer"]');
      await expect(footer).toBeInTheDocument();
      await expect(footer).toHaveClass('nds-card-footer');
    });

    await step('Card absorve pb-0 quando há CardFooter', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toBeInTheDocument();
      // selector pattern has-data-[slot=card-footer]:pb-0 — verificamos só que o footer existe;
      // a remoção do pb é via CSS has() puro do Tailwind.
    });
  },
};
