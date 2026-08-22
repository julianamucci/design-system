import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Button } from "./button";
import {
  textareaWithDescriptionSource,
  textareaCounterAccessibleSource,
  textareaControlledSource,
  formTextareaSource,
  textareaSource,
} from "./textarea.source";

const meta = {
  title: "UI/Textarea/Compositions",
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
          "Composicoes reais do Textarea: com Label + descrição, com contador acessível, em formulário e controlado.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabelAndDescription: Story = {
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="comp-desc">Descrição</Label>
      <Textarea
        id="comp-desc"
        placeholder="ex: Camiseta de algodão, gola redonda..."
        className="nds-resize-y nds-min-h-30"
        aria-describedby="comp-desc-help"
      />
      <p id="comp-desc-help" className="nds-text-caption nds-text-muted-foreground">
        Descreva o produto com clareza para aparecer melhor na busca.
      </p>
    </div>
  ),
  parameters: {
    covers: ["accessibility.item4"],
    docs: {
      // O texto de apoio ligado por aria-describedby é sub-composição.
      source: { transform: textareaWithDescriptionSource },
      description: {
        story:
          "Par obrigatório Label (htmlFor) + Textarea (id) com FormDescription auxiliar vinculada via aria-describedby.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Descrição");

    await step("Label vinculada via htmlFor foca o textarea", async () => {
      const label = canvas.getByText("Descrição");
      await userEvent.click(label);
      await expect(textarea).toHaveFocus();
    });

    await step("aria-describedby aponta para um texto que existe", async () => {
      const id = textarea.getAttribute("aria-describedby")!;
      await expect(canvasElement.ownerDocument.getElementById(id)).toBeInTheDocument();
    });
  },
};

function WithCounterRender() {
  const [value, setValue] = useState("");
  const max = 280;
  return (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="comp-counter">Mensagem</Label>
      <Textarea
        id="comp-counter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ex: Compartilhe seu pensamento..."
        className="nds-resize-y nds-min-h-30"
        maxLength={max}
      />
      <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
        <span>Limite: 280 caracteres.</span>
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

export const WithAccessibleCounter: Story = {
  render: () => <WithCounterRender />,
  parameters: {
    docs: {
      // Contagem com limite curto — composição controlada que o meta sem args
      // não imprime.
      source: { transform: textareaCounterAccessibleSource },
      description: {
        story:
          'maxLength=280 combinado com contador "X/Y" + aria-live="polite" + aria-label descritivo para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Mensagem") as HTMLTextAreaElement;

    await step("maxLength está aplicado no campo", async () => {
      await expect(textarea).toHaveAttribute("maxLength", "280");
    });

    await step("Digitar atualiza o contador acessível", async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Olá mundo");
      const counter = canvas.getByLabelText(/9 de 280 caracteres usados/);
      await expect(counter).toHaveTextContent("9/280");
      await expect(counter).toHaveAttribute("aria-live", "polite");
    });
  },
};

function InFormRender() {
  const [bio, setBio] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const max = 500;
  return (
    <form
      className="nds-stack nds-w-md" data-spacing="md"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(bio);
      }}
    >
      <div className="nds-stack" data-spacing="sm">
        <Label htmlFor="form-bio">Biografia</Label>
        <Textarea
          id="form-bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Conte um pouco sobre você..."
          className="nds-resize-y nds-min-h-30"
          maxLength={max}
          required
        />
        <div className="nds-cluster nds-text-caption nds-text-muted-foreground" data-justify="between">
          <span>Aparece no seu perfil público.</span>
          <span
            aria-live="polite"
            aria-label={`${bio.length} de ${max} caracteres usados`}
          >
            {bio.length}/{max}
          </span>
        </div>
      </div>
      <Button type="submit">Salvar</Button>
      {submitted && (
        <p className="nds-text-caption nds-text-muted-foreground">
          Enviado: <span className="nds-font-mono">{submitted.length} chars</span>
        </p>
      )}
    </form>
  );
}

export const InForm: Story = {
  render: () => <InFormRender />,
  parameters: {
    docs: {
      // O campo dentro de <form>, com name, required e botão de envio.
      source: { transform: formTextareaSource },
      description: {
        story:
          "Textarea integrado em <form> com name, required e Button submit. Estado controlado via useState.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Biografia") as HTMLTextAreaElement;
    const submit = canvas.getByRole("button", { name: "Salvar" });

    await step("Submit envia o valor digitado", async () => {
      await userEvent.type(textarea, "Olá");
      await userEvent.click(submit);
      await expect(canvas.getByText(/3 chars/)).toBeVisible();
    });
  },
};

function ControlledRender() {
  const [value, setValue] = useState("Texto inicial controlado.");
  return (
    <div className="nds-stack nds-w-md" data-spacing="sm">
      <Label htmlFor="comp-controlled">Observações</Label>
      <Textarea
        id="comp-controlled"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="nds-resize-y nds-min-h-30"
      />
      <p className="nds-text-caption nds-text-muted-foreground">
        Tamanho atual: <code className="nds-font-mono">{value.length} chars</code>
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledRender />,
  parameters: {
    docs: {
      // O estado externo vive num `useState` que o meta não imprime.
      source: { transform: textareaControlledSource },
      description: {
        story:
          "Textarea controlado via useState — o componente pai mantém o estado e atualiza via onChange.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Observações") as HTMLTextAreaElement;

    await step("Valor inicial reflete o estado controlado", async () => {
      await expect(textarea.value).toBe("Texto inicial controlado.");
      await expect(canvas.getByText(/25 chars/)).toBeVisible();
    });

    await step("Edição atualiza o estado e o contador externo", async () => {
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Novo");
      await expect(canvas.getByText(/4 chars/)).toBeVisible();
    });
  },
};
