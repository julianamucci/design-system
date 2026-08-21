import type { Meta, StoryObj } from "@storybook/react-vite";
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
import {
  inputGroupAlinhamentosSource,
  inputGroupBotaoInternoSource,
  inputGroupCliqueNoAddonSource,
  inputGroupComErroSource,
  inputGroupDesabilitadoSource,
  inputGroupIconeFimSource,
  inputGroupPrefixoESufixoSource,
  inputGroupPrefixoTextoSource,
  inputGroupSenhaSource,
  inputGroupSource,
} from "./input.source";

const meta = {
  title: "UI/Input/Compositions",
  tags: ["form"],
  component: InputGroup,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O `component` deste arquivo é o InputGroup, não o Input: a transform do
      // campo simples deixaria o snippet padrão ensinando outro componente. A
      // do grupo cai no ícone à esquerda, que é a forma canônica.
      source: { transform: inputGroupSource },
      description: {
        component:
          "Composicoes do InputGroup — container que combina Input com addons, ícones, textos decorativos e botões internos.",
      },
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddonIconLeft: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-icon-left" className="nds-text-body nds-font-medium">
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

export const AddonIconRight: Story = {
  // O lado do addon é o assunto: muda o `align` E a ordem das peças no JSX.
  parameters: { docs: { source: { transform: inputGroupIconeFimSource } } },
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-icon-right" className="nds-text-body nds-font-medium">
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

export const AddonTextLeft: Story = {
  // `InputGroupText` é a peça que o snippet do ícone nu não mostra.
  parameters: { docs: { source: { transform: inputGroupPrefixoTextoSource } } },
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-text-left" className="nds-text-body nds-font-medium">
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

export const AddonTextRight: Story = {
  // Dois addons no mesmo grupo, com uma moldura só: é o que a story prova.
  parameters: { docs: { source: { transform: inputGroupPrefixoESufixoSource } } },
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-text-right" className="nds-text-body nds-font-medium">
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

export const InnerButton: Story = {
  // `InputGroupButton` dentro do addon, com nome acessível próprio — um botão
  // só de ícone é mudo sem o `aria-label`.
  parameters: { docs: { source: { transform: inputGroupBotaoInternoSource } } },
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-btn-search" className="nds-text-body nds-font-medium">
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

export const PasswordWithToggle: Story = {
  // Única composição com estado: o `useState` e a troca dupla (tipo do campo e
  // nome do botão) não existem em nenhum snippet estático.
  parameters: { docs: { source: { transform: inputGroupSenhaSource } } },
  render: function SenhaComToggleRender() {
    const [show, setShow] = useState(false);
    return (
      <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
        <label htmlFor="comp-password-toggle" className="nds-text-body nds-font-medium">
          Senha
        </label>
        <InputGroup>
          <InputGroupInput
            id="comp-password-toggle"
            type={show ? "text" : "password"}
            placeholder="••••••••"
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

export const Disabled: Story = {
  // O `disabled` vai no CONTROLE, não no contêiner: é a lição da story.
  parameters: { docs: { source: { transform: inputGroupDesabilitadoSource } } },
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-disabled" className="nds-text-body nds-font-medium">
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

export const WithError: Story = {
  // As marcas de ARIA ficam no controle interno, e a mensagem é peça a mais que
  // o snippet do grupo padrão não tem.
  parameters: { docs: { source: { transform: inputGroupComErroSource } } },
  render: () => (
    <div className="nds-stack" data-spacing="xs" style={{ width: "18rem" }}>
      <label htmlFor="comp-error" className="nds-text-body nds-font-medium">
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
      <p id="comp-error-msg" className="nds-text-body nds-text-destructive">
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

/**
 * Fecha `functional.item7` e `visual.item4`. Os três alinhamentos numa captura
 * só — e as asserções afirmam o PIXEL, não o atributo: quem posiciona é a
 * propriedade `order` no CSS, e um `align` no elemento errado passaria batido.
 */
export const Alignments: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item4"],
    // Os três alinhamentos juntos: o assunto é a comparação, e um grupo sozinho
    // não mostraria que `block-start` empilha.
    docs: { source: { transform: inputGroupAlinhamentosSource } },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="lg">
      <div className="nds-stack" data-spacing="xs">
        <label htmlFor="ig-inicio" className="nds-text-body nds-font-medium">Buscar</label>
        <InputGroup>
          <InputGroupAddon align="inline-start" data-testid="addon-inicio">
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput id="ig-inicio" type="search" placeholder="Buscar" />
        </InputGroup>
      </div>

      <div className="nds-stack" data-spacing="xs">
        <label htmlFor="ig-fim" className="nds-text-body nds-font-medium">Atalho</label>
        <InputGroup>
          <InputGroupInput id="ig-fim" placeholder="Comando" />
          <InputGroupAddon align="inline-end" data-testid="addon-fim">
            <InputGroupText>Ctrl+K</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="nds-stack" data-spacing="xs">
        <label htmlFor="ig-bloco" className="nds-text-body nds-font-medium">Mensagem</label>
        <InputGroup>
          <InputGroupAddon align="block-start" data-testid="addon-bloco">
            <InputGroupText>Para: suporte</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput id="ig-bloco" placeholder="Assunto" />
        </InputGroup>
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const q = <T extends HTMLElement>(sel: string) => canvasElement.querySelector<T>(sel)!;

    await step("O alinhamento vira data-align, que é o que o CSS lê", async () => {
      for (const [id, align] of [
        ["addon-inicio", "inline-start"],
        ["addon-fim", "inline-end"],
        ["addon-bloco", "block-start"],
      ] as const) {
        await expect(q(`[data-testid="${id}"]`)).toHaveAttribute("data-align", align);
      }
    });

    await step("O addon fica DO LADO que o nome promete", async () => {
      await expect(q('[data-testid="addon-inicio"]').getBoundingClientRect().left)
        .toBeLessThan(q("#ig-inicio").getBoundingClientRect().left);
      await expect(q('[data-testid="addon-fim"]').getBoundingClientRect().left)
        .toBeGreaterThan(q("#ig-fim").getBoundingClientRect().left);
    });

    await step("block-start empilha: o grupo vira coluna", async () => {
      await expect(q('[data-testid="addon-bloco"]').getBoundingClientRect().bottom)
        .toBeLessThanOrEqual(q("#ig-bloco").getBoundingClientRect().top + 1);
    });

    await step("A moldura é do GRUPO; o campo interno fica nu", async () => {
      // É o ponto do componente: uma borda só em volta de tudo. Se o campo
      // mantivesse a própria, apareceria uma linha dupla no meio.
      const grupo = q('[data-slot="input-group"]');
      await expect(parseFloat(getComputedStyle(grupo).borderTopWidth)).toBeGreaterThan(0);
      await expect(parseFloat(getComputedStyle(q("#ig-inicio")).borderTopWidth)).toBe(0);
    });

    await step("O grupo é uma região só para o leitor de tela", async () => {
      await expect(q('[data-slot="input-group"]')).toHaveAttribute("role", "group");
    });
  },
};

/** Fecha `functional.item8`. */
export const AddonClick: Story = {
  parameters: {
    covers: ["functional.item8"],
    // O assunto é a exceção: o addon leva o foco ao campo, MENOS quando o alvo
    // é um botão. Sem o botão ao lado, o snippet esconderia metade da regra.
    docs: { source: { transform: inputGroupCliqueNoAddonSource } },
  },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="xs">
      <label htmlFor="ig-clique" className="nds-text-body nds-font-medium">Usuário</label>
      <InputGroup>
        <InputGroupAddon align="inline-start" data-testid="addon">
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput id="ig-clique" placeholder="nome.usuario" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="button" aria-label="Limpar">
            <Search aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const campo = () => canvasElement.querySelector<HTMLInputElement>("#ig-clique")!;

    await step("Clicar no addon leva o foco ao campo", async () => {
      // A área toda parece o campo. Quem mira o "@" espera começar a digitar.
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="addon"]')!);
      await expect(campo()).toHaveFocus();
    });

    await step("Clicar no BOTÃO dentro do addon não devolve o foco ao campo", async () => {
      // Sem esta distinção, apertar "Limpar" devolveria o foco ao campo no meio
      // da ação — e quem navega por teclado perderia o lugar.
      await userEvent.click(canvas.getByRole("button", { name: "Limpar" }));
      await expect(campo()).not.toHaveFocus();
    });
  },
};
