import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Bold } from "lucide-react";
import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle/Estados",
  tags: ["form"],
  component: Toggle,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados visuais e interativos do Toggle: off, on, focus, disabled e invalid.",
      },
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  render: () => (
    <Toggle aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Estado inativo (padrão). aria-pressed="false", fundo transparente, data-state="off".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle está em aria-pressed=false", async () => {
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    });
  },
};

export const On: Story = {
  render: () => (
    <Toggle defaultPressed aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Estado ativo via defaultPressed. aria-pressed="true", fundo --muted, data-state="on".',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle está em aria-pressed=true", async () => {
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
  },
};

export const Focus: Story = {
  render: () => (
    <Toggle aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Estado de foco via teclado — anel ring-[3px] ring-ring/50 visível ao tabular até o Toggle.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle recebe foco via teclado", async () => {
      toggle.focus();
      await expect(toggle).toHaveFocus();
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <Toggle disabled aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Toggle desabilitado. opacity-50 e pointer-events-none — clique não altera o estado.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle está desabilitado", async () => {
      await expect(toggle).toBeDisabled();
    });

    await step("Clique com disabled não altera aria-pressed", async () => {
      const before = toggle.getAttribute("aria-pressed");
      await userEvent.click(toggle, { pointerEventsCheck: 0 });
      await expect(toggle.getAttribute("aria-pressed")).toBe(before);
    });
  },
};

export const DisabledPressed: Story = {
  render: () => (
    <Toggle disabled defaultPressed aria-label="Negrito">
      <Bold aria-hidden="true" />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Toggle disabled e pressed simultaneamente — mostra o estado ativo sem permitir alteração.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle está disabled e pressed", async () => {
      await expect(toggle).toBeDisabled();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
    });
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Toggle aria-invalid="true" aria-label="Negrito">
        <Bold aria-hidden="true" />
      </Toggle>
      <p className="text-sm text-destructive">Selecione ao menos uma formatação.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Toggle em estado inválido via aria-invalid="true". Borda --destructive e anel --destructive/20.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Negrito" });

    await step("Toggle tem aria-invalid=true", async () => {
      await expect(toggle).toHaveAttribute("aria-invalid", "true");
    });

    await step("Mensagem de erro está visível", async () => {
      await expect(canvas.getByText("Selecione ao menos uma formatação.")).toBeVisible();
    });
  },
};
