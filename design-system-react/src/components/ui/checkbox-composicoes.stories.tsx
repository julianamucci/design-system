import type { Meta, StoryObj } from "@storybook/react-vite";
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
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="with-label" />
      <label
        htmlFor="with-label"
        className="nds-text-body nds-font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70" style={{ lineHeight: 1 }}
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
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="with-desc" className="nds-mt-0-5" />
      <div className="nds-stack" data-spacing="xs">
        <label
          htmlFor="with-desc"
          className="nds-text-body nds-font-medium nds-cursor-pointer" style={{ lineHeight: 1 }}
        >
          Receber novidades por email
        </label>
        <p className="nds-text-body nds-text-muted-foreground">
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
    <fieldset className="border-none nds-p-0 m-0" data-spacing="sm">
      <legend className="nds-text-body nds-font-semibold mb-3">Preferências de contato</legend>
      {[
        { id: "contact-email", label: "Email" },
        { id: "contact-sms", label: "SMS" },
        { id: "contact-push", label: "Notificações push" },
      ].map(({ id, label }) => (
        <div key={id} className="nds-cluster" data-spacing="sm">
          <Checkbox id={id} />
          <label htmlFor={id} className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>
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
      <div className="nds-stack" data-spacing="sm">
        <div className="nds-cluster nds-border-b" style={{ paddingBottom: "0.5rem" }} data-align="center" data-spacing="sm">
          <Checkbox id="select-all" />
          <label
            htmlFor="select-all"
            className="nds-text-body nds-font-semibold nds-cursor-pointer" style={{ lineHeight: 1 }}
          >
            Selecionar todos os itens
          </label>
        </div>
        {[
          { id: "item-1", label: "Relatório mensal" },
          { id: "item-2", label: "Relatório trimestral" },
          { id: "item-3", label: "Relatório anual" },
        ].map(({ id, label }) => (
          <div key={id} className="nds-cluster" style={{ paddingLeft: "1rem" }} data-align="center" data-spacing="sm">
            <Checkbox id={id} />
            <label htmlFor={id} className="nds-text-body nds-font-medium" style={{ lineHeight: 1 }}>
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
    <div className="nds-rounded-lg nds-border-default nds-p-4 shadow-sm nds-max-w-sm">
      <div className="nds-cluster" data-align="start" data-spacing="sm">
        <Checkbox id="card-checkbox" className="nds-mt-0-5" />
        <div className="nds-stack" data-spacing="xs">
          <label
            htmlFor="card-checkbox"
            className="nds-text-body nds-font-medium nds-cursor-pointer" style={{ lineHeight: 1 }}
          >
            Plano Pro
          </label>
          <p className="nds-text-body nds-text-muted-foreground">
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
