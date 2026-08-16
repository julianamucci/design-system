import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { alturaResultante, campoDe } from "@shared/testing/input-probe";
import { Input } from "./input";

const meta = {
  title: "UI/Input/Types",
  tags: ["form"],
  component: Input,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "O Input não tem variantes via prop. A aparência muda conforme o `type` HTML — text, email, password, number e file são os mais comuns.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="tipo-text" className="nds-text-body nds-font-medium">
        Nome completo
      </label>
      <Input id="tipo-text" type="text" placeholder="ex: João da Silva" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type text está presente", async () => {
      const input = canvas.getByRole("textbox");
      await expect(input).toHaveAttribute("type", "text");
    });
  },
};

export const Email: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="tipo-email" className="nds-text-body nds-font-medium">
        Email
      </label>
      <Input id="tipo-email" type="email" placeholder="ex: joao@empresa.com" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type email está presente", async () => {
      const input = canvas.getByRole("textbox");
      await expect(input).toHaveAttribute("type", "email");
    });
  },
};

export const Password: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="tipo-password" className="nds-text-body nds-font-medium">
        Senha
      </label>
      <Input id="tipo-password" type="password" placeholder="••••••••" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type password está presente", async () => {
      const input = canvas.getByLabelText("Senha");
      await expect(input).toHaveAttribute("type", "password");
    });
  },
};

export const Number: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="tipo-number" className="nds-text-body nds-font-medium">
        Quantidade
      </label>
      <Input id="tipo-number" type="number" placeholder="0" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Input type number está presente", async () => {
      const input = canvas.getByRole("spinbutton");
      await expect(input).toHaveAttribute("type", "number");
    });
  },
};

/**
 * `type="search"` não tinha story em stack nenhuma — e é um dos tipos que a
 * seção Variantes documenta e que o contrato pede em `visual.item3`.
 */
export const Search: Story = {
  parameters: { covers: ["visual.item3"] },
  render: () => (
    <div className="nds-stack nds-w-xs" data-spacing="xs">
      <label htmlFor="tipo-search" className="nds-text-body nds-font-medium">
        Buscar
      </label>
      <Input id="tipo-search" type="search" placeholder="Buscar componentes..." />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("O campo de busca é anunciado como busca, não como texto", async () => {
      // `type="search"` muda o papel implícito para searchbox — é o que o
      // leitor de tela anuncia, e nada no visual denuncia se estiver errado.
      const input = canvas.getByRole("searchbox", { name: "Buscar" });
      await expect(input).toHaveAttribute("type", "search");
    });

    await step("Aceita digitação", async () => {
      const input = canvas.getByRole("searchbox", { name: "Buscar" });
      await userEvent.clear(input);
      await userEvent.type(input, "Button");
      await expect(input).toHaveValue("Button");
      await userEvent.clear(input);
    });
  },
};

export const File: Story = {
  parameters: { covers: ["functional.item5"] },
  render: () => (
    <div className="nds-stack nds-w-xs" data-spacing="xs">
      <label htmlFor="tipo-file" className="nds-text-body nds-font-medium">
        Arquivo
      </label>
      <Input id="tipo-file" type="file" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Input type file está presente e rotulado", async () => {
      const input = canvas.getByLabelText("Arquivo");
      await expect(input).toHaveAttribute("type", "file");
    });

    await step("O botão nativo recebe estilo próprio do design system", async () => {
      // `::file-selector-button` é a única parte do campo que o navegador
      // desenha sozinho; sem a regra do design system ele sai com o cinza do
      // sistema operacional e o exemplo mente sobre o resultado.
      const botao = getComputedStyle(campoDe(canvasElement)!, "::file-selector-button");
      await expect(botao.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      await expect(parseFloat(botao.borderTopLeftRadius)).toBeGreaterThan(0);
    });

    await step("A altura continua saindo do respiro, não de um valor cravado", async () => {
      const medida = alturaResultante(campoDe(canvasElement)!);
      await expect(medida.alturaCravada).toBe(false);
      await expect(parseFloat(medida.paddingBloco[0])).toBeGreaterThan(0);
    });
  },
};
