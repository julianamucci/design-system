import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, screen, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import { MailIcon, PhoneIcon, MessageCircleIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select/Variantes",
  tags: ["form"],
  component: Select,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do Select: Default (lista plana), WithGroups (SelectGroup + SelectLabel) e WithIcon (SelectItem com ícone inline).",
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
          "Lista simples — apenas SelectItem dentro do SelectContent. Placeholder \"Selecione...\" visível até o usuário escolher.",
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
          <SelectItem value="mg">Minas Gerais</SelectItem>
          <SelectItem value="es">Espírito Santo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger exibe placeholder \"Selecione...\"", async () => {
      await expect(trigger).toHaveTextContent(/Selecione/);
      await expect(trigger).toHaveAttribute("aria-label", "Selecionar estado");
    });
    await step("Abre listbox em portal ao clicar", async () => {
      await userEvent.click(trigger);
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toBeVisible();
      const options = await screen.findAllByRole("option");
      await expect(options).toHaveLength(4);
    });
  },
};

export const WithGroups: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "SelectGroup + SelectLabel agrupam opções por categoria. Use quando há ≥2 categorias claras com ≥2 itens cada.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar região">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sudeste</SelectLabel>
            <SelectItem value="sp">São Paulo</SelectItem>
            <SelectItem value="rj">Rio de Janeiro</SelectItem>
            <SelectItem value="mg">Minas Gerais</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Sul</SelectLabel>
            <SelectItem value="rs">Rio Grande do Sul</SelectItem>
            <SelectItem value="sc">Santa Catarina</SelectItem>
            <SelectItem value="pr">Paraná</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Abre dropdown e exibe cabeçalhos de grupo", async () => {
      await userEvent.click(trigger);
      await waitForPortal("listbox");
      await expect(await screen.findByText("Sudeste")).toBeVisible();
      await expect(await screen.findByText("Sul")).toBeVisible();
    });
    await step("Selecionar item de um grupo atualiza valor", async () => {
      const option = await waitForPortal("option", { name: "Santa Catarina" });
      await userEvent.click(option);
      await waitFor(async () => {
        await expect(trigger).toHaveTextContent(/Santa Catarina/);
      });
    });
  },
};

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "SelectItem com ícone inline antes do texto. Ícone deve ter size-4 (padrão via SVG não-classed) e ficar à esquerda do label.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar canal de contato">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="email">
            <MailIcon /> E-mail
          </SelectItem>
          <SelectItem value="phone">
            <PhoneIcon /> Telefone
          </SelectItem>
          <SelectItem value="chat">
            <MessageCircleIcon /> Chat
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Abre e exibe opções com ícones", async () => {
      await userEvent.click(trigger);
      await waitForPortal("listbox");
      const options = await screen.findAllByRole("option");
      await expect(options).toHaveLength(3);
      // ícone svg dentro do primeiro item
      await expect(options[0].querySelector("svg")).toBeTruthy();
    });
  },
};
