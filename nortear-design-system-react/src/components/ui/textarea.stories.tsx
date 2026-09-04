import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn, userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { textareaSource } from "./textarea.source";
import { Label } from "./label";
import { TextareaDocs } from "@/components/docs/TextareaDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { resizeComputado } from "@shared/testing/textarea-probe";

const meta = {
  title: "Components/Form/Textarea",
  component: Textarea,
  tags: ["autodocs", "form"],
  parameters: {
    docs: {
      page: withAutoDocsTab(TextareaDocs),
      source: { transform: textareaSource },
    },
  },
  argTypes: {
    placeholder: {
      control: "text",
      description: "Texto exibido quando o campo está vazio",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o textarea",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Torna o textarea somente leitura",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    maxLength: {
      control: { type: "number", min: 0, step: 10 },
      description: "Limite de caracteres",
      table: { type: { summary: "number" }, defaultValue: { summary: "—" } },
    },
    rows: {
      control: { type: "number", min: 1, max: 20, step: 1 },
      description:
        "Linhas visíveis. Só aumenta a altura acima do mínimo da classe .nds-min-h-*",
      table: { type: { summary: "number" }, defaultValue: { summary: "2" } },
    },
    // Sem control: são callbacks, e o painel Actions é quem os mostra. Sem
    // entrada aqui eles somem da aba API Reference — foi o achado
    // `arg_without_argtype`.
    onChange: {
      control: false,
      description: "Disparado a cada caractere digitado",
      table: { type: { summary: "(e: ChangeEvent<HTMLTextAreaElement>) => void" } },
    },
    onBlur: {
      control: false,
      description: "Disparado quando o campo perde o foco",
      table: { type: { summary: "(e: FocusEvent<HTMLTextAreaElement>) => void" } },
    },
  },
  args: {
    placeholder: "ex: Descreva o produto em até 500 caracteres...",
    disabled: false,
    readOnly: false,
    maxLength: 500,
    rows: 3,
    onChange: fn(),
    onBlur: fn(),
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlaygroundRender(args: React.ComponentProps<typeof Textarea>) {
  const [value, setValue] = useState("");
  const max = args.maxLength ?? 500;
  return (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="playground-textarea">Descrição</Label>
      <Textarea
        id="playground-textarea"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          args.onChange?.(e);
        }}
        onBlur={args.onBlur}
        placeholder={args.placeholder}
        disabled={args.disabled}
        readOnly={args.readOnly}
        maxLength={args.maxLength}
        rows={args.rows}
        className="nds-resize-y nds-min-h-30"
      />
      <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
        <span>Descreva o produto com clareza.</span>
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

export const Playground: Story = {
  parameters: {
    covers: ["functional.item1", "functional.item2", "functional.item4"],
  },
  render: (args) => <PlaygroundRender {...args} />,
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição") as HTMLTextAreaElement;

    await step("Textarea presente com data-slot=textarea", async () => {
      await expect(textarea).toBeInTheDocument();
      await expect(textarea).toHaveAttribute("data-slot", "textarea");
    });

    await step("Clique no Label foca o Textarea via htmlFor", async () => {
      const label = canvas.getByText("Descrição");
      await userEvent.click(label);
      await expect(textarea).toHaveFocus();
    });

    await step("Digitar texto atualiza o value e dispara onChange", async () => {
      // Limpa antes: no replay do painel Interactions o campo chega com o
      // texto da rodada anterior, e o passo tem de estabelecer a própria
      // precondição.
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Camiseta de algodão");
      await expect(args.onChange).toHaveBeenCalled();
      await expect(textarea.value).toBe("Camiseta de algodão");
    });

    await step("Enter insere quebra de linha em vez de enviar", async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Linha 1{Enter}Linha 2");
      await expect(textarea.value).toBe("Linha 1\nLinha 2");
    });

    await step("Contador reflete o número de caracteres com aria-live", async () => {
      const counter = canvas.getByLabelText(/de 500 caracteres usados/);
      await expect(counter).toHaveAttribute("aria-live", "polite");
      await expect(counter).toHaveTextContent("15/500");
    });

    await step("O campo redimensiona só na vertical", async () => {
      // Efeito computado, não nome de classe: `resize-y` sem prefixo é inerte
      // e a asserção de classe passava sem nada estar aplicado.
      await expect(resizeComputado(textarea)).toBe("vertical");
    });

    await step("Blur dispara onBlur", async () => {
      textarea.focus();
      textarea.blur();
      await expect(args.onBlur).toHaveBeenCalled();
    });
  },
};
