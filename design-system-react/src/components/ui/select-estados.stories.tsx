import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, screen, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select/Estados",
  tags: ["form"],
  component: Select,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Select: Default (placeholder), Open (dropdown aberto), Selected (com valor), Disabled, Invalid (aria-invalid) e Size SM.",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — trigger com placeholder \"Selecione...\" e ChevronDown. aria-expanded=\"false\".",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger fechado, sem seleção", async () => {
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toHaveTextContent(/Selecione/);
    });
  },
};

export const Selected: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado com valor selecionado via defaultValue. O texto do item substitui o placeholder. (Pré-seleção é apenas para visualizar o estado — em formulários reais, evite pré-selecionar.)",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select defaultValue="rj">
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger exibe o label do item selecionado", async () => {
      await expect(trigger).toHaveTextContent(/Rio de Janeiro/);
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Dropdown aberto após interação. data-state=\"open\" no trigger, role=\"listbox\" no portal. Foco vai ao primeiro item.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 220, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Abre dropdown e listbox aparece em portal", async () => {
      await userEvent.click(trigger);
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toBeVisible();
    });
  },
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Trigger desabilitado via prop disabled. opacity-50, cursor-not-allowed; cliques são ignorados e dropdown não abre.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select disabled>
        <SelectTrigger aria-label="Selecionar estado" disabled>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger está desabilitado", async () => {
      await expect(trigger).toBeDisabled();
    });
    await step("Clique não abre o dropdown", async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  },
};

export const Invalid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado de erro via aria-invalid=\"true\" no trigger. Borda --destructive e anel --destructive/20. Use junto com mensagem auxiliar.",
      },
    },
  },
  render: () => (
    <div
      className="flex flex-col gap-2"
      style={{ contain: "layout", minHeight: 80, position: "relative" }}
    >
      <Select>
        <SelectTrigger aria-label="Selecionar estado" aria-invalid="true">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-destructive">Selecione um estado para continuar.</p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger tem aria-invalid=true", async () => {
      await expect(trigger).toHaveAttribute("aria-invalid", "true");
    });
    await step("Mensagem de erro está visível", async () => {
      await expect(canvas.getByText(/Selecione um estado/)).toBeVisible();
    });
  },
};

export const SizeSm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Variação compacta via size=\"sm\" no SelectTrigger. Altura --height-sm; útil em toolbars, filtros densos ou linhas de tabela.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger size="sm" aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger tem data-size=sm", async () => {
      await expect(trigger).toHaveAttribute("data-size", "sm");
    });
  },
};
