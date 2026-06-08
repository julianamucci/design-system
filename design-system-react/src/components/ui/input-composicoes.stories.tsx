import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Search, Mail, Eye, EyeOff, AtSign, DollarSign } from "lucide-react";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupText,
} from "./input-group";

const meta = {
  title: "UI/Input/Composicoes",
  tags: ["form"],
  component: InputGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes do InputGroup — container que combina Input com addons, ícones, textos decorativos e botões internos.",
      },
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddonIconeEsquerda: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-icon-left" className="text-sm font-medium">
        Buscar
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="comp-icon-left"
          type="search"
          placeholder="Buscar componentes..."
        />
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");

    await step("Input dentro do InputGroup está visível", async () => {
      await expect(input).toBeVisible();
    });

    await step("Aceita digitação", async () => {
      await userEvent.type(input, "Button");
      await expect(input).toHaveValue("Button");
      await userEvent.clear(input);
    });
  },
};

export const AddonIconeDireita: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-icon-right" className="text-sm font-medium">
        Email
      </label>
      <InputGroup>
        <InputGroupInput
          id="comp-icon-right"
          type="email"
          placeholder="ex: joao@empresa.com"
        />
        <InputGroupAddon align="inline-end">
          <Mail aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input com ícone à direita está visível", async () => {
      await expect(input).toBeVisible();
    });
  },
};

export const AddonTextoEsquerda: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-text-left" className="text-sm font-medium">
        Usuário
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <AtSign aria-hidden="true" />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id="comp-text-left"
          type="text"
          placeholder="nome.usuario"
        />
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/usuário/i)).toBeInTheDocument();
  },
};

export const AddonTextoDireita: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-text-right" className="text-sm font-medium">
        Preço
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <DollarSign aria-hidden="true" />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id="comp-text-right"
          type="number"
          placeholder="0,00"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>BRL</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText(/preço/i)).toBeInTheDocument();
    await expect(canvas.getByText("BRL")).toBeInTheDocument();
  },
};

export const BotaoInterno: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-btn-search" className="text-sm font-medium">
        Buscar
      </label>
      <InputGroup>
        <InputGroupInput
          id="comp-btn-search"
          type="search"
          placeholder="Buscar componentes..."
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" aria-label="Buscar">
            <Search aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Botão interno está visível", async () => {
      const button = canvas.getByRole("button", { name: "Buscar" });
      await expect(button).toBeVisible();
    });

    await step("Input e botão coexistem no grupo", async () => {
      const input = canvas.getByRole("searchbox");
      await expect(input).toBeVisible();
      await userEvent.type(input, "Card");
      await expect(input).toHaveValue("Card");
    });
  },
};

export const SenhaComToggle: Story = {
  render: function SenhaComToggleRender() {
    const [show, setShow] = useState(false);
    return (
      <div className="flex flex-col gap-1.5 w-72">
        <label htmlFor="comp-password-toggle" className="text-sm font-medium">
          Senha
        </label>
        <InputGroup>
          <InputGroupInput
            id="comp-password-toggle"
            type={show ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              aria-label={show ? "Ocultar senha" : "Exibir senha"}
              onClick={() => setShow((v) => !v)}
            >
              {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Campo inicia como tipo password", async () => {
      const input = canvas.getByLabelText("Senha");
      await expect(input).toHaveAttribute("type", "password");
    });

    await step("Clicar no botão alterna para tipo text", async () => {
      const toggleBtn = canvas.getByRole("button", { name: "Exibir senha" });
      await userEvent.click(toggleBtn);
      const input = canvas.getByLabelText("Senha");
      await expect(input).toHaveAttribute("type", "text");
    });

    await step("Clicar novamente volta para tipo password", async () => {
      const toggleBtn = canvas.getByRole("button", { name: "Ocultar senha" });
      await userEvent.click(toggleBtn);
      const input = canvas.getByLabelText("Senha");
      await expect(input).toHaveAttribute("type", "password");
    });
  },
};

export const Desabilitado: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-disabled" className="text-sm font-medium">
        Campo desabilitado
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="comp-disabled"
          type="text"
          placeholder="Não disponível"
          disabled
        />
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input desabilitado dentro do grupo", async () => {
      await expect(input).toBeDisabled();
    });
  },
};

export const ComErro: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-72">
      <label htmlFor="comp-error" className="text-sm font-medium">
        Email
      </label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Mail aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="comp-error"
          type="email"
          placeholder="ex: joao@empresa.com"
          aria-invalid="true"
          aria-describedby="comp-error-msg"
        />
      </InputGroup>
      <p id="comp-error-msg" className="text-sm text-destructive">
        Email inválido. Use o formato nome@dominio.com
      </p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");

    await step("Input dentro do grupo tem aria-invalid=true", async () => {
      await expect(input).toHaveAttribute("aria-invalid", "true");
    });

    await step("Mensagem de erro visível", async () => {
      const errorMsg = canvas.getByText(/Email inválido/);
      await expect(errorMsg).toBeVisible();
    });
  },
};
