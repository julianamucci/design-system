import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect } from "storybook/test";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox/Composicoes",
  tags: ["form"],
  component: Checkbox,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="with-label" />
      <label
        htmlFor="with-label"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Aceito os termos e condições
      </label>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Par obrigatório Checkbox + Label. Associação via htmlFor/id garante acessibilidade: clicar no label aciona o checkbox.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Label está associada — clique no label aciona checkbox", async () => {
      const label = canvas.getByText("Aceito os termos e condições");
      const checkbox = canvas.getByRole("checkbox");
      await userEvent.click(label);
      await expect(checkbox).toBeChecked();
    });
  },
};

export const ComDescricao: Story = {
  render: () => (
    <div className="flex gap-2">
      <Checkbox id="with-desc" className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor="with-desc"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          Receber novidades por email
        </label>
        <p className="text-sm text-muted-foreground">
          Enviaremos no máximo 2 emails por semana.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Checkbox + Label + texto auxiliar abaixo. Para contexto adicional sobre a opção selecionada.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Label e descrição estão visíveis", async () => {
      await expect(canvas.getByText("Receber novidades por email")).toBeVisible();
      await expect(
        canvas.getByText("Enviaremos no máximo 2 emails por semana.")
      ).toBeVisible();
    });
  },
};

export const GrupoComFieldset: Story = {
  render: () => (
    <fieldset className="space-y-3 border-none p-0 m-0">
      <legend className="text-sm font-semibold mb-3">Preferências de contato</legend>
      {[
        { id: "contact-email", label: "Email" },
        { id: "contact-sms", label: "SMS" },
        { id: "contact-push", label: "Notificações push" },
      ].map(({ id, label }) => (
        <div key={id} className="flex items-center gap-2">
          <Checkbox id={id} />
          <label htmlFor={id} className="text-sm font-medium leading-none">
            {label}
          </label>
        </div>
      ))}
    </fieldset>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Grupo de checkboxes em fieldset + legend. Obrigatório para WCAG 1.3.1 quando os itens pertencem ao mesmo conjunto.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Fieldset contém 3 checkboxes independentes", async () => {
      const checkboxes = canvas.getAllByRole("checkbox");
      await expect(checkboxes).toHaveLength(3);
    });

    await step("Legend está visível", async () => {
      await expect(
        canvas.getByText("Preferências de contato")
      ).toBeVisible();
    });
  },
};

export const SelecionarTodos: Story = {
  render: function SelecionarTodosRender() {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Checkbox id="select-all" />
          <label
            htmlFor="select-all"
            className="text-sm font-semibold leading-none cursor-pointer"
          >
            Selecionar todos os itens
          </label>
        </div>
        {[
          { id: "item-1", label: "Relatório mensal" },
          { id: "item-2", label: "Relatório trimestral" },
          { id: "item-3", label: "Relatório anual" },
        ].map(({ id, label }) => (
          <div key={id} className="flex items-center gap-2 pl-4">
            <Checkbox id={id} />
            <label htmlFor={id} className="text-sm font-medium leading-none">
              {label}
            </label>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Padrão de seleção em massa: checkbox pai + checkboxes filhos. O pai usaria estado indeterminate (disponível nativamente no Svelte) quando alguns itens estão selecionados.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Há 4 checkboxes no total", async () => {
      const checkboxes = canvas.getAllByRole("checkbox");
      await expect(checkboxes).toHaveLength(4);
    });
  },
};

export const DentroDeCard: Story = {
  render: () => (
    <div className="rounded-lg border border-border p-4 shadow-sm max-w-sm">
      <div className="flex items-start gap-3">
        <Checkbox id="card-checkbox" className="mt-0.5" />
        <div className="flex flex-col gap-1">
          <label
            htmlFor="card-checkbox"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Plano Pro
          </label>
          <p className="text-sm text-muted-foreground">
            Acesso ilimitado a todos os recursos premium.
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Checkbox integrado em card de seleção. Útil em interfaces de comparação de planos ou seleção de itens em listas.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Checkbox e label estão visíveis dentro do card", async () => {
      await expect(canvas.getByRole("checkbox")).toBeVisible();
      await expect(canvas.getByText("Plano Pro")).toBeVisible();
    });

    await step("Clique no label seleciona o checkbox", async () => {
      const label = canvas.getByText("Plano Pro");
      await userEvent.click(label);
      await expect(canvas.getByRole("checkbox")).toBeChecked();
    });
  },
};
