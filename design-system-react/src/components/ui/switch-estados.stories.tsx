import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";

const meta = {
  title: "UI/Switch/Estados",
  tags: ["form"],
  component: Switch,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados visuais e interativos do Switch: unchecked, checked, focus, disabled e invalid.",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="state-unchecked" />
      <Label htmlFor="state-unchecked">Receber notificações por email</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Estado padrão desativado. data-unchecked, fundo --input, thumb à esquerda, aria-checked="false".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch está desativado por padrão", async () => {
      await expect(switchEl).toHaveAttribute("aria-checked", "false");
      await expect(switchEl).toHaveAttribute("data-unchecked");
    });
  },
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="state-checked" defaultChecked />
      <Label htmlFor="state-checked">Modo escuro</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Estado ativado. data-checked, fundo --primary, thumb à direita, aria-checked="true".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch está ativado", async () => {
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
      await expect(switchEl).toHaveAttribute("data-checked");
    });
  },
};

export const Focus: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="state-focus" />
      <Label htmlFor="state-focus">Receber notificações por email</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado de foco via teclado. Use Tab para navegar e verificar o anel ring-3 ring-ring/50.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch recebe foco via teclado", async () => {
      switchEl.focus();
      await expect(switchEl).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="state-disabled" disabled />
      <Label htmlFor="state-disabled">Receber notificações por email</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Switch desabilitado. opacity-50 e cursor-not-allowed. Clique não altera o estado.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch está marcado como desabilitado", async () => {
      await expect(switchEl).toHaveAttribute("data-disabled");
    });

    await step("Clique com disabled não altera o estado", async () => {
      const before = switchEl.getAttribute("aria-checked");
      await userEvent.click(switchEl, { pointerEventsCheck: 0 });
      await expect(switchEl.getAttribute("aria-checked")).toBe(before);
    });
  },
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="state-disabled-checked" disabled defaultChecked />
      <Label htmlFor="state-disabled-checked">Modo escuro</Label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Switch desabilitado e ativado simultaneamente — mostra o estado sem permitir alteração.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch está disabled e checked", async () => {
      await expect(switchEl).toHaveAttribute("data-disabled");
      await expect(switchEl).toHaveAttribute("aria-checked", "true");
    });
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center space-x-2">
        <Switch id="state-invalid" aria-invalid="true" />
        <Label htmlFor="state-invalid">Aceitar política de privacidade</Label>
      </div>
      <p className="text-sm text-destructive pl-1">
        Você precisa aceitar a política para continuar.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Switch em estado inválido via aria-invalid="true". Borda --destructive e anel --destructive/20.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");

    await step("Switch tem aria-invalid=true", async () => {
      await expect(switchEl).toHaveAttribute("aria-invalid", "true");
    });

    await step("Mensagem de erro está visível", async () => {
      await expect(
        canvas.getByText("Você precisa aceitar a política para continuar."),
      ).toBeVisible();
    });
  },
};
