import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import { reprovasDoDesabilitado } from "@shared/testing/checkbox-probe";
import { Checkbox } from "./checkbox";

// Ferramentas de teclado/ponteiro entregues ao contrato compartilhado. Iguais
// nas cinco stacks — o que muda entre elas é o componente, não a medição.
const FERRAMENTAS = {
  tab: () => userEvent.tab(),
  teclar: (sequencia: string) => userEvent.keyboard(sequencia),
  // `pointerEventsCheck: 0`: a caixa desabilitada mantém `cursor: not-allowed`,
  // e a checagem do userEvent reprovaria antes de o clique chegar ao componente
  // — que é justamente o que se quer testar.
  clicar: (el: HTMLElement) => userEvent.click(el, { pointerEventsCheck: 0 }),
};

const meta = {
  title: "UI/Checkbox/States",
  tags: ["form"],
  component: Checkbox,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  argTypes: {
    onCheckedChange: { control: false },
  },
  args: {
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="unchecked" />
      <label htmlFor="unchecked" className="nds-label">
        Receber novidades por email
      </label>
    </div>
  ),
  parameters: {
    covers: ["visual.item1", "accessibility.item2"],
    docs: {
      description: {
        story:
          "Estado padrão desmarcado. Borda --input, fundo transparente, aria-checked=\"false\".",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox está desmarcado por padrão", async () => {
      await expect(checkbox).not.toBeChecked();
    });

    await step("aria-checked reflete o estado desmarcado", async () => {
      await expect(checkbox).toHaveAttribute("aria-checked", "false");
    });

    await step("Não possui atributo data-checked", async () => {
      await expect(checkbox).not.toHaveAttribute("data-checked");
    });
  },
};

export const Checked: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="checked" defaultChecked />
      <label htmlFor="checked" className="nds-label">
        Manter sessão ativa
      </label>
    </div>
  ),
  parameters: {
    covers: ["visual.item2", "functional.item6"],
    docs: {
      description: {
        story:
          "Estado marcado. Fundo --primary, CheckIcon visível, aria-checked=\"true\".",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox renderiza marcado via defaultChecked, sem controle externo", async () => {
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toHaveAttribute("aria-checked", "true");
    });

    await step("Possui atributo data-checked", async () => {
      await expect(checkbox).toHaveAttribute("data-checked");
    });
  },
};

export const Indeterminate: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="indeterminate" indeterminate />
      <label htmlFor="indeterminate" className="nds-label">
        Selecionar todos os itens
      </label>
    </div>
  ),
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Estado misto (seleção parcial). Fundo --primary, traço (MinusIcon) visível no indicador, aria-checked=\"mixed\". Não é atributo HTML nativo — é propriedade dedicada do base-ui.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("aria-checked é mixed", async () => {
      await expect(checkbox).toHaveAttribute("aria-checked", "mixed");
    });

    await step("Carrega o atributo de presença emitido pela lib para o estado misto", async () => {
      await expect(checkbox).toHaveAttribute("data-indeterminate");
    });
  },
};

// Espião de escopo de módulo, como nas outras quatro stacks. O de `args` chega
// opcional pelo tipo do primitivo, e `mockClear()` nele não compila; além disso,
// o espião próprio não depende de quando o Storybook reseta os args entre
// reexecuções do painel Interactions.
const espiaoDesabilitado = fn();

export const Disabled: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm" data-disabled="true">
      <Checkbox id="disabled" disabled onCheckedChange={espiaoDesabilitado} />
      <label htmlFor="disabled" className="nds-label">
        Receber notificações push
      </label>
    </div>
  ),
  parameters: {
    covers: ["functional.item4", "accessibility.item6"],
    docs: {
      description: {
        story:
          "Estado desabilitado. Opacidade reduzida, cursor bloqueado. Continua alcançável pelo Tab e é anunciado como indisponível, mas não alterna.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step(
      "Alcançável pelo Tab, anunciada como desabilitada, e nem clique nem Espaço alternam",
      async () => {
        // Contrato compartilhado — a mesma lista nas cinco stacks. `toBeDisabled()`
        // saiu daqui: ele lê o atributo nativo e ignora `aria-disabled`, então
        // afirmaria o contrário da decisão (peça fora da tabulação) e a forma
        // negada nem poderia falhar.
        espiaoDesabilitado.mockClear();
        await expect(await reprovasDoDesabilitado(checkbox, FERRAMENTAS)).toEqual([]);
      },
    );

    await step("O callback de mudança não disparou em nenhuma das tentativas", async () => {
      await expect(espiaoDesabilitado).not.toHaveBeenCalled();
    });
  },
};

export const DisabledChecked: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm" data-disabled="true">
      <Checkbox id="disabled-checked" disabled defaultChecked />
      <label htmlFor="disabled-checked" className="nds-label">
        Selecionar todos os itens
      </label>
    </div>
  ),
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Estado desabilitado e marcado simultaneamente. Mostra o estado de seleção sem permitir alteração.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step(
      "Alcançável pelo Tab, anunciada como desabilitada, e nem clique nem Espaço alternam",
      async () => {
        await expect(await reprovasDoDesabilitado(checkbox, FERRAMENTAS)).toEqual([]);
      },
    );

    await step("Checkbox continua marcado — desabilitado não é o mesmo que vazio", async () => {
      await expect(checkbox).toBeChecked();
    });
  },
};

export const Error: Story = {
  render: () => (
    <div className="nds-stack" data-spacing="xs">
      <div className="nds-cluster" data-spacing="sm">
        <Checkbox id="error" aria-invalid="true" />
        <label htmlFor="error" className="nds-label">
          Aceito os termos e condições
        </label>
      </div>
      <p className="nds-text-body nds-text-destructive nds-pl-6">
        Você precisa aceitar os termos para continuar.
      </p>
    </div>
  ),
  parameters: {
    covers: ["visual.item5"],
    docs: {
      description: {
        story:
          "Estado de erro via aria-invalid=\"true\". Borda e ring --destructive. Use FormMessage para exibir a mensagem.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox tem aria-invalid=true", async () => {
      await expect(checkbox).toHaveAttribute("aria-invalid", "true");
    });

    await step("Mensagem de erro está visível", async () => {
      const errorMsg = canvas.getByText(
        "Você precisa aceitar os termos para continuar."
      );
      await expect(errorMsg).toBeVisible();
    });
  },
};

export const FocusVisible: Story = {
  render: () => (
    <div className="nds-cluster" data-spacing="sm">
      <Checkbox id="focus" />
      <label htmlFor="focus" className="nds-label">
        Foco visível via teclado
      </label>
    </div>
  ),
  parameters: {
    covers: ["accessibility.item4"],
    docs: {
      description: {
        story:
          "Estado de foco via teclado. Use Tab para navegar e verificar o ring de foco --ring.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await step("Checkbox recebe foco visível ao navegar por teclado", async () => {
      await userEvent.tab();
      await expect(checkbox).toHaveFocus();

      const style = getComputedStyle(checkbox);
      const temAnelVisivel = style.outlineStyle !== "none" || style.boxShadow !== "none";
      await expect(temAnelVisivel).toBe(true);
    });
  },
};
