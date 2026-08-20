import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";
import {
  textareaComContadorSource,
  textareaSemRedimensionarSource,
  textareaSource,
} from "./textarea.source";
import {
  alturaMinimaPx,
  preencherAte,
  resizeComputado,
} from "@shared/testing/textarea-probe";

const meta = {
  title: "UI/Textarea/Variants",
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
          "Variantes visuais do Textarea: padrão (redimensiona na vertical), com contador de caracteres e sem redimensionamento.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="nds-stack nds-w-cap-md" data-spacing="sm">
      <Label htmlFor="var-default">Biografia</Label>
      <Textarea
        id="var-default"
        placeholder="Conte um pouco sobre você..."
        className="nds-resize-y nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Variante padrão: redimensionamento vertical e 120px de altura mínima.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Biografia");

    await step("Redimensiona só na vertical", async () => {
      await expect(resizeComputado(textarea)).toBe("vertical");
    });

    await step("Altura mínima de 120px", async () => {
      // A classe morta `min-h-[120px]` prometia isto e não aplicava nada;
      // a asserção mede o valor computado, não o nome.
      await expect(alturaMinimaPx(textarea)).toBe(120);
    });
  },
};

function WithCounterRender() {
  const [value, setValue] = useState("");
  const max = 500;
  return (
    <div className="nds-stack nds-w-cap-md" data-spacing="sm">
      <Label htmlFor="var-counter">Descrição</Label>
      <Textarea
        id="var-counter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ex: Camiseta de algodão, gola redonda..."
        className="nds-resize-y nds-min-h-30"
        maxLength={max}
      />
      <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
        <span>Descreva com clareza.</span>
        <span
          aria-live="polite"
          aria-label={`${value.length} de ${max} caracteres usados`}
        >
          {value.length}/{max}
        </span>
      </div>
    </div>
  );
}

export const WithCounter: Story = {
  render: () => <WithCounterRender />,
  parameters: {
    covers: ["functional.item3", "visual.item4"],
    docs: {
      // A contagem exige o valor em estado — composição que o meta sem args
      // não imprime.
      source: { transform: textareaComContadorSource },
      description: {
        story:
          'Com contador de caracteres — maxLength + span com aria-live="polite" e aria-label descritivo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea tem maxLength=500", async () => {
      await expect(textarea).toHaveAttribute("maxLength", "500");
    });

    await step("Contador tem aria-live polite", async () => {
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute("aria-live", "polite");
    });

    await step("Atingir o limite bloqueia novos caracteres", async () => {
      // Chega à borda por escrita programática (maxLength não se aplica a
      // ela) e digita os últimos de verdade — é aí que o bloqueio acontece.
      preencherAte(textarea, 496);
      await userEvent.type(textarea, "abcdefgh");
      await expect(textarea.value.length).toBe(500);
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveTextContent("500/500");
    });
  },
};

export const NoResize: Story = {
  render: () => (
    <div className="nds-stack nds-w-cap-md" data-spacing="sm">
      <Label htmlFor="var-noresize">Feedback</Label>
      <Textarea
        id="var-noresize"
        placeholder="O que poderíamos melhorar?"
        className="nds-resize-none nds-min-h-30"
      />
    </div>
  ),
  parameters: {
    docs: {
      // A classe que trava a alça É o assunto, e nenhum control a descreve.
      source: { transform: textareaSemRedimensionarSource },
      description: {
        story:
          "Sem redimensionamento — útil em modais ou layouts onde arrastar a alça quebra a UI.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Feedback");

    await step("Redimensionamento desligado", async () => {
      await expect(resizeComputado(textarea)).toBe("none");
    });
  },
};
