import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect } from "storybook/test";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Button } from "./button";

const meta = {
  title: "UI/Textarea/Composicoes",
  tags: ["form"],
  component: Textarea,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes reais do Textarea: com Label + descrição, com contador acessível, em formulário e controlado.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabelEDescricao: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <Label htmlFor="comp-desc">Descrição</Label>
      <Textarea
        id="comp-desc"
        placeholder="ex: Camiseta de algodão, gola redonda..."
        className="resize-y min-h-[120px]"
        aria-describedby="comp-desc-help"
      />
      <p id="comp-desc-help" className="text-xs text-muted-foreground">
        Descreva o produto com clareza para aparecer melhor na busca.
      </p>
    </div>
  ),
  parameters: {
    docs: {
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

    await step("aria-describedby aponta para o texto auxiliar", async () => {
      await expect(textarea).toHaveAttribute("aria-describedby", "comp-desc-help");
    });
  },
};

function ComContadorRender() {
  const [value, setValue] = useState("");
  const max = 280;
  return (
    <div className="w-96 space-y-2">
      <Label htmlFor="comp-counter">Mensagem</Label>
      <Textarea
        id="comp-counter"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ex: Compartilhe seu pensamento..."
        className="resize-y min-h-[120px]"
        maxLength={max}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
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

export const ComContadorAcessivel: Story = {
  render: () => <ComContadorRender />,
  parameters: {
    docs: {
      description: {
        story:
          'maxLength=280 combinado com contador "X/Y" + aria-live="polite" + aria-label descritivo para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Mensagem") as HTMLTextAreaElement;

    await step("Digitar atualiza o contador acessível", async () => {
      await userEvent.type(textarea, "Olá mundo");
      const counter = canvas.getByLabelText(/9 de 280 caracteres usados/);
      await expect(counter).toHaveTextContent("9/280");
    });

    await step("maxLength bloqueia entrada além do limite", async () => {
      await expect(textarea).toHaveAttribute("maxLength", "280");
    });
  },
};

function EmFormularioRender() {
  const [bio, setBio] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const max = 500;
  return (
    <form
      className="w-96 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(bio);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="form-bio">Biografia</Label>
        <Textarea
          id="form-bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Conte um pouco sobre você..."
          className="resize-y min-h-[120px]"
          maxLength={max}
          required
        />
        <div className="flex justify-between text-xs text-muted-foreground">
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
        <p className="text-xs text-muted-foreground">
          Enviado: <span className="font-mono">{submitted.length} chars</span>
        </p>
      )}
    </form>
  );
}

export const EmFormulario: Story = {
  render: () => <EmFormularioRender />,
  parameters: {
    docs: {
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

function ControladoRender() {
  const [value, setValue] = useState("Texto inicial controlado.");
  return (
    <div className="w-96 space-y-2">
      <Label htmlFor="comp-controlled">Observações</Label>
      <Textarea
        id="comp-controlled"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="resize-y min-h-[120px]"
      />
      <p className="text-xs text-muted-foreground">
        Tamanho atual: <code className="font-mono">{value.length} chars</code>
      </p>
    </div>
  );
}

export const Controlado: Story = {
  render: () => <ControladoRender />,
  parameters: {
    docs: {
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
