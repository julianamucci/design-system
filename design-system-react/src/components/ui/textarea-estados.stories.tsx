import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta = {
  title: "UI/Textarea/Estados",
  tags: ["form"],
  component: Textarea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados visuais e interativos do Textarea: default, focus, filled, disabled, invalid e readonly.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="state-default">Descrição</Label>
      <Textarea
        id="state-default"
        placeholder="ex: Descreva o produto..."
        className="resize-y min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Estado padrão — borda input, placeholder muted-foreground.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea está vazio com placeholder visível", async () => {
      await expect(textarea.value).toBe("");
      await expect(textarea).toHaveAttribute("placeholder");
    });
  },
};

export const Focus: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="state-focus">Descrição</Label>
      <Textarea
        id="state-focus"
        placeholder="ex: Descreva o produto..."
        className="resize-y min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Focado — borda ring + anel ring-3 ring-ring/50. Use Tab para visualizar.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição");

    await step("Textarea recebe foco via teclado", async () => {
      (textarea as HTMLTextAreaElement).focus();
      await expect(textarea).toHaveFocus();
    });
  },
};

export const Filled: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="state-filled">Biografia</Label>
      <Textarea
        id="state-filled"
        defaultValue="Designer de interfaces há 8 anos, apaixonada por sistemas de design escaláveis e acessibilidade web."
        className="resize-y min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Com conteúdo — texto foreground, placeholder some. Cobre regressão visual de Filled.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Biografia") as HTMLTextAreaElement;

    await step("Textarea exibe o conteúdo inicial", async () => {
      await expect(textarea.value).toContain("Designer de interfaces");
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="state-disabled">Descrição</Label>
      <Textarea
        id="state-disabled"
        placeholder="Não disponível"
        disabled
        className="resize-y min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "disabled — opacity-50, cursor-not-allowed, fundo input/50. Clique e digitação são bloqueados.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea está desabilitado", async () => {
      await expect(textarea).toBeDisabled();
    });

    await step("Digitação não altera o value", async () => {
      await userEvent.type(textarea, "teste", { pointerEventsCheck: 0 });
      await expect(textarea.value).toBe("");
    });
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="state-invalid">Email</Label>
      <Textarea
        id="state-invalid"
        defaultValue="email-invalido"
        aria-invalid="true"
        aria-describedby="state-invalid-msg"
        className="resize-y min-h-[120px]"
      />
      <p id="state-invalid-msg" className="text-sm text-destructive">
        Conteúdo inválido. Revise antes de enviar.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'aria-invalid="true" — borda destructive, anel destructive/20. Mensagem ligada via aria-describedby.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Email");

    await step("Textarea tem aria-invalid=true", async () => {
      await expect(textarea).toHaveAttribute("aria-invalid", "true");
    });

    await step("aria-describedby aponta para a mensagem de erro", async () => {
      await expect(textarea).toHaveAttribute("aria-describedby", "state-invalid-msg");
      await expect(canvas.getByText("Conteúdo inválido. Revise antes de enviar.")).toBeVisible();
    });
  },
};

export const Readonly: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="state-readonly">Observações</Label>
      <Textarea
        id="state-readonly"
        defaultValue="Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis."
        readOnly
        className="resize-y min-h-[120px]"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "readOnly — texto selecionável mas não editável; sem mudança de fundo.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Observações") as HTMLTextAreaElement;

    await step("Textarea está em modo somente leitura", async () => {
      await expect(textarea).toHaveAttribute("readonly");
    });

    await step("Conteúdo é selecionável mas não editável", async () => {
      const before = textarea.value;
      await userEvent.type(textarea, "teste");
      await expect(textarea.value).toBe(before);
    });
  },
};
