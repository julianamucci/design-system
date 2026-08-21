import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";
import {
  textareaDesabilitadoSource,
  textareaInvalidoSource,
  textareaPreenchidoSource,
  textareaSomenteLeituraSource,
  textareaSource,
} from "./textarea.source";
import {
  anelDeFocoAssentado,
  contrasteTextoFundo,
  resizeComputado,
} from "@shared/testing/textarea-probe";

const meta = {
  title: "UI/Textarea/States",
  tags: ["form"],
  component: Textarea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: textareaSource },
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
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="state-default">Descrição</Label>
      <Textarea
        id="state-default"
        placeholder="ex: Descreva o produto..."
        className="nds-resize-y nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    covers: ["accessibility.item1", "visual.item1"],
    docs: {
      description: {
        story: "Estado padrão — borda --input e placeholder --muted-foreground.",
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
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="state-focus">Descrição</Label>
      <Textarea
        id="state-focus"
        placeholder="ex: Descreva o produto..."
        className="nds-resize-y nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      description: {
        story:
          "Focado — borda --ring e anel de 2px da mesma cor a 30% de opacidade.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea recebe foco via teclado", async () => {
      textarea.focus();
      await expect(textarea).toHaveFocus();
    });

    await step("O anel de foco existe e é opaco o bastante para ser visto", async () => {
      // Medido DEPOIS da transição: lido no primeiro quadro, o computado
      // devolve `rgba(0,0,0,0) 0px 0px 0px 0px` e um anel pintado passa por
      // inexistente.
      const { boxShadow, corDaBorda } = anelDeFocoAssentado(textarea);
      await expect(boxShadow).not.toBe("none");
      await expect(boxShadow).toMatch(/2px/);
      await expect(corDaBorda).not.toBe("rgba(0, 0, 0, 0)");
    });
  },
};

export const Filled: Story = {
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="state-filled">Biografia</Label>
      <Textarea
        id="state-filled"
        defaultValue="Designer de interfaces há 8 anos, apaixonada por sistemas de design escaláveis e acessibilidade web."
        className="nds-resize-y nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    covers: ["accessibility.item2", "visual.item2"],
    docs: {
      // O conteúdo inicial só existe no `render`, via defaultValue.
      source: { transform: textareaPreenchidoSource },
      description: {
        story:
          "Com conteúdo — texto --foreground, placeholder some. A altura não muda: o conteúdo rola.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Biografia") as HTMLTextAreaElement;

    await step("Textarea exibe o conteúdo inicial", async () => {
      await expect(textarea.value).toContain("Designer de interfaces");
    });

    await step("Texto digitado tem contraste de pelo menos 4.5:1", async () => {
      const razao = contrasteTextoFundo(textarea);
      await expect(razao).not.toBeNull();
      await expect(razao!).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="state-disabled">Descrição</Label>
      <Textarea
        id="state-disabled"
        placeholder="Não disponível"
        disabled
        className="nds-resize-y nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // Estado que só existe no `render`.
      source: { transform: textareaDesabilitadoSource },
      description: {
        story:
          "Desabilitado — opacidade 50%, cursor bloqueado, fundo --muted a 30% e redimensionamento travado.",
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

    await step("Desabilitado também trava o redimensionamento", async () => {
      await expect(resizeComputado(textarea)).toBe("none");
    });
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="state-invalid">Descrição</Label>
      <Textarea
        id="state-invalid"
        defaultValue="curto"
        aria-invalid="true"
        aria-describedby="state-invalid-msg"
        className="nds-resize-y nds-min-h-30"
      />
      <p id="state-invalid-msg" className="nds-text-caption nds-text-destructive">
        A descrição precisa de pelo menos 20 caracteres.
      </p>
    </div>
  ),
  parameters: {
    covers: ["accessibility.item5", "visual.item3"],
    docs: {
      // O par aria-invalid + mensagem ligada é sub-composição do render.
      source: { transform: textareaInvalidoSource },
      description: {
        story:
          'aria-invalid="true" — borda --destructive e mensagem ligada via aria-describedby.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea tem aria-invalid=true", async () => {
      await expect(textarea).toHaveAttribute("aria-invalid", "true");
    });

    await step("aria-describedby aponta para uma mensagem que existe", async () => {
      const id = textarea.getAttribute("aria-describedby")!;
      await expect(canvasElement.ownerDocument.getElementById(id)).toBeInTheDocument();
      await expect(canvas.getByText(/pelo menos 20 caracteres/)).toBeVisible();
    });

    await step("A borda inválida difere da borda em repouso", async () => {
      const invalida = getComputedStyle(textarea).borderTopColor;
      const referencia = canvasElement.ownerDocument.createElement("textarea");
      referencia.className = "nds-textarea";
      textarea.parentElement!.appendChild(referencia);
      const repouso = getComputedStyle(referencia).borderTopColor;
      referencia.remove();
      await expect(invalida).not.toBe(repouso);
    });
  },
};

export const ReadOnly: Story = {
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="state-readonly">Observações</Label>
      <Textarea
        id="state-readonly"
        defaultValue="Pedido confirmado em 02/05/2026. Entrega prevista em até 5 dias úteis."
        readOnly
        className="nds-resize-y nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    covers: ["visual.item5"],
    docs: {
      // Estado que só existe no `render`.
      source: { transform: textareaSomenteLeituraSource },
      description: {
        story:
          "Somente leitura — texto selecionável mas não editável; sem mudança de fundo.",
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
