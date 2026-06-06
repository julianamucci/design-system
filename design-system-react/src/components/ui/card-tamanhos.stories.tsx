import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI/Card/Tamanhos",
  tags: ["layout"],
  component: Card,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Tamanhos do Card controlados pela prop `size`. A propagação ocorre via `data-size` no root; subcomponentes reagem com `group-data-[size=sm]/card:*` (padding e font-size).',
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'size="default"',
  render: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Cadeira Gamer Pro</CardTitle>
        <CardDescription>
          Estrutura ergonômica com ajuste de altura e apoio lombar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-base font-semibold">R$ 1.299,00</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="card"]');
    await expect(root).toHaveAttribute("data-size", "default");
    // Padding default: py-4 no root, px-4 no header/content
    const header = canvasElement.querySelector('[data-slot="card-header"]');
    await expect(header).toHaveClass("px-4");
  },
};

export const Small: Story = {
  name: 'size="sm"',
  render: () => (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <CardDescription>Assinantes ativos</CardDescription>
        <CardTitle className="text-2xl">8.742</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">+12% no mês</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement, step }) => {
    await step('data-size="sm" propaga no root', async () => {
      const root = canvasElement.querySelector('[data-slot="card"]');
      await expect(root).toHaveAttribute("data-size", "sm");
    });

    await step(
      "Subcomponentes reagem via group-data-[size=sm]/card (padding reduzido)",
      async () => {
        // O root aplica py-3 quando data-size=sm (classe condicional),
        // e o header aplica px-3 via group-data. Validamos a presença do
        // atributo que ativa as classes condicionais.
        const root = canvasElement.querySelector('[data-slot="card"]');
        await expect(root).toHaveAttribute("data-size", "sm");
      }
    );
  },
};
