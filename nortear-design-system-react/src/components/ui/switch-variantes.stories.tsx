import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "UI/Switch/Variants",
  tags: ["form"],
  component: Switch,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
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
    <div className="nds-cluster" data-spacing="sm">
      <Switch id="var-default" />
      <Label htmlFor="var-default">Receber notificações por email</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Switch padrão — trilho de 36×20px com thumb de 16px, Label à direita.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("O degrau padrão vira data-size", async () => {
      await expect(switchEl).toHaveAttribute("data-size", "default");
    });

    await step("O rótulo nomeia o controle", async () => {
      await expect(canvas.getByRole("switch", { name: /Receber notificações por email/i }))
        .toBe(switchEl);
    });
  },
};

export const WithDescription: Story = {
  render: () => (
    <div
      className="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4"
      data-align="center"
      data-justify="between"
    >
      <div className="nds-stack" data-spacing="xs">
        <Label htmlFor="var-marketing">Emails de marketing</Label>
        <p className="nds-text-body">Receba novidades e promoções da plataforma.</p>
      </div>
      <Switch id="var-marketing" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Switch em painel de configurações — texto à esquerda, controle à direita.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O controle e a descrição auxiliar estão visíveis", async () => {
      await expect(canvas.getByRole("switch")).toBeVisible();
      await expect(
        canvas.getByText("Receba novidades e promoções da plataforma."),
      ).toBeVisible();
    });

    await step("Só o rótulo nomeia o controle — a descrição não entra no nome", async () => {
      await expect(canvas.getByRole("switch", { name: /Emails de marketing/i })).toBeVisible();
    });
  },
};

export const Sm: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="sm">
      <div className="nds-cluster" data-spacing="sm">
        <Switch id="var-sm-referencia" />
        <Label htmlFor="var-sm-referencia">Tamanho padrão</Label>
      </div>
      <div className="nds-cluster" data-spacing="sm">
        <Switch id="var-sm" size="sm" />
        <Label htmlFor="var-sm" className="nds-text-caption">
          Tamanho compacto
        </Label>
      </div>
    </div>
  ),
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Degrau compacto — trilho de 24×16px com thumb de 12px, ao lado do padrão para comparação. Indicado para listas e menus densos.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const [padrao, compacto] = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="switch"]'),
    );

    await step("O degrau de tamanho vira data-size", async () => {
      await expect(padrao).toHaveAttribute("data-size", "default");
      await expect(compacto).toHaveAttribute("data-size", "sm");
    });

    await step("O compacto é de fato menor que o padrão", async () => {
      // O atributo sozinho não prova nada: a medida vive no CSS compartilhado,
      // e uma regra ausente deixaria os dois do mesmo tamanho com o data-size
      // certo em ambos.
      await expect(compacto.getBoundingClientRect().width).toBeLessThan(
        padrao.getBoundingClientRect().width,
      );
    });

    await step("O thumb acompanha o degrau do trilho", async () => {
      const thumbPadrao = padrao.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      const thumbCompacto = compacto.querySelector<HTMLElement>('[data-slot="switch-thumb"]')!;
      await expect(thumbCompacto.getBoundingClientRect().width).toBeLessThan(
        thumbPadrao.getBoundingClientRect().width,
      );
    });
  },
};
