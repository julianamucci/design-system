import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "UI/Switch/Variantes",
  tags: ["form"],
  component: Switch,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes visuais do Switch: padrão, com descrição em painel e tamanho compacto.",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="var-default" />
      <Label htmlFor="var-default">Receber notificações por email</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Switch padrão (32×18.4px) com Label à direita. Layout flex items-center space-x-2.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch tem data-size=default", async () => {
      await expect(switchEl).toHaveAttribute("data-size", "default");
    });

    await step("Label associada via htmlFor", async () => {
      await expect(canvas.getByText("Receber notificações por email")).toBeVisible();
    });
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex items-center justify-between w-80 rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor="var-marketing">Emails de marketing</Label>
        <p className="text-sm text-muted-foreground">
          Receba novidades e promoções da plataforma.
        </p>
      </div>
      <Switch id="var-marketing" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Switch em painel de configurações: Label + descrição à esquerda, Switch à direita. Layout flex justify-between.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Switch e descrição estão visíveis", async () => {
      await expect(canvas.getByRole("switch")).toBeVisible();
      await expect(
        canvas.getByText("Receba novidades e promoções da plataforma."),
      ).toBeVisible();
    });
  },
};

export const Sm: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="var-sm" size="sm" />
      <Label htmlFor="var-sm" className="text-xs">
        Tamanho compacto
      </Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Variante compacta com size="sm" (24×14px). Ideal para listas e menus densos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch tem data-size=sm", async () => {
      await expect(switchEl).toHaveAttribute("data-size", "sm");
    });
  },
};
