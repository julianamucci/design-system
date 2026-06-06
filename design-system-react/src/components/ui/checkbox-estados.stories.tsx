import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox/Estados",
  tags: ["form"],
  component: Checkbox,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desmarcado: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="unchecked" />
      <label htmlFor="unchecked" className="text-sm font-medium leading-none">
        Receber novidades por email
      </label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão desmarcado. Borda --input, fundo transparente, aria-checked=\"false\".",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox está desmarcado por padrão", async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step("Não possui atributo data-checked", async () => {
      await expect(checkbox).not.toHaveAttribute("data-checked");
    });
  },
};

export const Marcado: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="checked" defaultChecked />
      <label htmlFor="checked" className="text-sm font-medium leading-none">
        Manter sessão ativa
      </label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado marcado. Fundo --primary, CheckIcon visível, aria-checked=\"true\".",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox está marcado", async () => {
      await expect(checkbox).toBeChecked();
    });

    await step("Possui atributo data-checked", async () => {
      await expect(checkbox).toHaveAttribute("data-checked");
    });
  },
};

export const Desabilitado: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="disabled" disabled />
      <label
        htmlFor="disabled"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Receber notificações push
      </label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado desabilitado. opacity-50, cursor-not-allowed. Não responde a interações.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox está desabilitado", async () => {
      await expect(checkbox).toHaveAttribute("aria-disabled", "true");
    });

    await step("Clique não altera estado quando disabled", async () => {
      const wasChecked = checkbox.getAttribute("data-checked");
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
      await expect(checkbox.getAttribute("data-checked")).toBe(wasChecked);
    });
  },
};

export const DesabilitadoMarcado: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <label
        htmlFor="disabled-checked"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Selecionar todos os itens
      </label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado desabilitado e marcado simultaneamente. Mostra o estado de seleção sem permitir alteração.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox está desabilitado", async () => {
      await expect(checkbox).toHaveAttribute("aria-disabled", "true");
    });

    await step("Checkbox está marcado mesmo disabled", async () => {
      await expect(checkbox).toBeChecked();
    });
  },
};

export const Erro: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Checkbox id="error" aria-invalid="true" />
        <label htmlFor="error" className="text-sm font-medium leading-none">
          Aceito os termos e condições
        </label>
      </div>
      <p className="text-sm text-destructive pl-6">
        Você precisa aceitar os termos para continuar.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado de erro via aria-invalid=\"true\". Borda e ring --destructive. Use FormMessage para exibir a mensagem.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox tem aria-invalid=true", async () => {
      await expect(checkbox).toHaveAttribute("aria-invalid", "true");
    });

    await step("Mensagem de erro está visível", async () => {
      const errorMsg = canvas.getByText(
        "Você precisa aceitar os termos para continuar."
      );
      await expect(errorMsg).toBeVisible();
    });
  },
};

export const FocoVisivel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="focus" />
      <label htmlFor="focus" className="text-sm font-medium leading-none">
        Foco visível via teclado
      </label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado de foco via teclado. Use Tab para navegar e verificar o ring de foco --ring.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox recebe foco via teclado", async () => {
      checkbox.focus();
      await expect(checkbox).toHaveFocus();
    });
  },
};
