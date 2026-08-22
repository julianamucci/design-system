import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import {
  checkboxWithDescriptionSource,
  checkboxEmCardSource,
  formCheckboxSource,
  checkboxGroupSource,
  checkboxSelectAllSource,
  checkboxSource,
} from "./checkbox.source";

const meta = {
  title: "UI/Checkbox/Compositions",
  tags: ["form"],
  component: Checkbox,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: checkboxSource } },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// O painel Interactions reexecuta a play no mesmo DOM. Cada helper estabelece
// a própria precondição (o `!==` é intencional) antes de clicar, e só então
// alterna — assim o clique desta rodada fica provado mesmo quando o replay
// começa a partir do estado final da rodada anterior. `clickEl` é opcional
// porque WithLabel/InsideCard clicam no <label>, não no checkbox.
const desmarcar = async (assertEl: HTMLElement, clickEl: HTMLElement = assertEl) => {
  if (assertEl.getAttribute("aria-checked") !== "false") await userEvent.click(clickEl);
  await waitFor(() => expect(assertEl).toHaveAttribute("aria-checked", "false"));
};
const marcar = async (assertEl: HTMLElement, clickEl: HTMLElement = assertEl) => {
  if (assertEl.getAttribute("aria-checked") !== "true") await userEvent.click(clickEl);
  await waitFor(() => expect(assertEl).toHaveAttribute("aria-checked", "true"));
};

export const WithLabel: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="with-label" />
      <label htmlFor="with-label" className="nds-label">
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
    const checkbox = canvas.getByRole("checkbox");
    const label = canvas.getByText("Aceito os termos e condições");

    await step("Checkbox está presente", async () => {
      await expect(checkbox).toBeInTheDocument();
    });

    await step("Nome acessível vem do label associado via htmlFor/id", async () => {
      await expect(canvas.getByRole("checkbox", { name: "Aceito os termos e condições" })).toBe(checkbox);
    });

    await step("Estado inicial é desmarcado", async () => {
      await expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    await step("Clique no label alterna o checkbox — desmarca e marca de novo", async () => {
      await desmarcar(checkbox, label);
      await marcar(checkbox, label);
    });
  },
};

export const WithDescription: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm" data-align="start">
      <Checkbox id="with-desc" className="nds-mt-0-5" />
      <div className="nds-stack" data-spacing="xs">
        <label htmlFor="with-desc" className="nds-label nds-cursor-pointer">
          Receber novidades por email
        </label>
        <p className="nds-text-body">
          Enviaremos no máximo 2 emails por semana.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      // O texto auxiliar muda o alinhamento do par — não é o snippet do meta.
      source: { transform: checkboxWithDescriptionSource },
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

export const GroupWithFieldset: Story = {
  render: () => (
    <fieldset className="nds-stack nds-border-default nds-rounded-lg nds-p-4" data-spacing="sm">
      <legend className="nds-text-body nds-font-semibold nds-px-1">Preferências de contato</legend>
      {[
        { id: "contact-email", label: "Email" },
        { id: "contact-sms", label: "SMS" },
        { id: "contact-push", label: "Notificações push" },
      ].map(({ id, label }) => (
        <div key={id} className="nds-cluster" data-spacing="sm">
          <Checkbox id={id} />
          <label htmlFor={id} className="nds-label">
            {label}
          </label>
        </div>
      ))}
    </fieldset>
  ),
  parameters: {
    docs: {
      // O fieldset + legend é o assunto: uma caixa sozinha não tem grupo.
      source: { transform: checkboxGroupSource },
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

export const SelectAll: Story = {
  render: function SelectAllRender() {
    return (
      <div className="nds-stack" data-spacing="sm">
        <div className="nds-cluster nds-border-b nds-pb-2" data-align="center" data-spacing="sm">
          <Checkbox id="select-all" />
          <label htmlFor="select-all" className="nds-label nds-font-semibold nds-cursor-pointer">
            Selecionar todos os itens
          </label>
        </div>
        {[
          { id: "item-1", label: "Relatório mensal" },
          { id: "item-2", label: "Relatório trimestral" },
          { id: "item-3", label: "Relatório anual" },
        ].map(({ id, label }) => (
          <div key={id} className="nds-cluster nds-pl-4" data-align="center" data-spacing="sm">
            <Checkbox id={id} />
            <label htmlFor={id} className="nds-label">
              {label}
            </label>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      // A caixa do topo é controlada: o estado misto é uma conta sobre os filhos,
      // e marcação estática esconderia justamente isso.
      source: { transform: checkboxSelectAllSource },
      description: {
        story:
          "Padrão de seleção em massa: checkbox pai + checkboxes filhos. O pai usa o estado indeterminate (propriedade dedicada) quando alguns itens estão selecionados — ver a story Indeterminate em States.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Há 4 checkboxes no total", async () => {
      const checkboxes = canvas.getAllByRole("checkbox");
      await expect(checkboxes).toHaveLength(4);
    });

    await step("Todos iniciam desmarcados", async () => {
      const checkboxes = canvas.getAllByRole("checkbox");
      for (const cb of checkboxes) {
        await expect(cb).toHaveAttribute("aria-checked", "false");
      }
    });

    await step("Cada checkbox tem rótulo associado via htmlFor/id", async () => {
      await expect(canvas.getByRole("checkbox", { name: "Selecionar todos os itens" })).toBeInTheDocument();
      await expect(canvas.getByRole("checkbox", { name: "Relatório mensal" })).toBeInTheDocument();
      await expect(canvas.getByRole("checkbox", { name: "Relatório trimestral" })).toBeInTheDocument();
      await expect(canvas.getByRole("checkbox", { name: "Relatório anual" })).toBeInTheDocument();
    });
  },
};

export const InsideCard: Story = {
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-p-4 nds-shadow-sm nds-max-w-sm">
      <div className="nds-cluster" data-align="start" data-spacing="sm">
        <Checkbox id="card-checkbox" className="nds-mt-0-5" />
        <div className="nds-stack" data-spacing="xs">
          <label htmlFor="card-checkbox" className="nds-label nds-cursor-pointer">
            Plano Pro
          </label>
          <p className="nds-text-body">
            Acesso ilimitado a todos os recursos premium.
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      // A moldura do card é parte da composição e não cabe nos args.
      source: { transform: checkboxEmCardSource },
      description: {
        story:
          "Checkbox integrado em card de seleção. Útil em interfaces de comparação de planos ou seleção de itens em listas.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    const label = canvas.getByText("Plano Pro");

    await step("Checkbox e label estão visíveis dentro do card", async () => {
      await expect(checkbox).toBeVisible();
      await expect(label).toBeVisible();
    });

    await step("Clique no label alterna o checkbox — desmarca e marca de novo", async () => {
      await desmarcar(checkbox, label);
      await marcar(checkbox, label);
    });
  },
};

export const InForm: Story = {
  parameters: {
    covers: ["functional.item5"],
    docs: {
      // O <form> e a leitura por FormData são o assunto; o render da story monta
      // um componente local que não existe fora dela.
      source: { transform: formCheckboxSource },
      description: {
        story:
          "Integração com <form>. O base-ui mantém um <input> oculto ao lado do Root, que carrega name/value no submit — leia o estado real via FormData, não via state de React.",
      },
    },
  },
  render: () => {
    function FormCheckbox() {
      const onSubmit = fn();
      return (
        <form
          className="nds-stack"
          data-spacing="md"
          style={{ minWidth: "280px" }}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          <div className="nds-cluster" data-spacing="sm">
            <Checkbox id="form-terms" name="terms" value="accepted" />
            <label htmlFor="form-terms" className="nds-label">
              Aceito os termos e condições
            </label>
          </div>
          <Button type="submit">Enviar</Button>
        </form>
      );
    }
    return <FormCheckbox />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    const submitBtn = canvas.getByRole("button", { name: /Enviar/ });
    const form = canvasElement.querySelector("form") as HTMLFormElement;

    await step("Marcar o checkbox antes de enviar", async () => {
      await marcar(checkbox);
    });

    await step("FormData inclui name/value do checkbox marcado", async () => {
      const data = new FormData(form);
      await expect(data.get("terms")).toBe("accepted");
    });

    await step("Submit dispara sem reload (preventDefault) com o input oculto presente", async () => {
      const hiddenInput = form.querySelector('input[name="terms"]');
      await expect(hiddenInput).not.toBeNull();
      await userEvent.click(submitBtn);
    });
  },
};
