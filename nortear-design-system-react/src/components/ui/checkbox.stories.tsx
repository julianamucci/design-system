import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { Checkbox } from "./checkbox";
import { CheckboxDocs } from "@/components/docs/CheckboxDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(CheckboxDocs) },
  },
  argTypes: {
    checked: {
      // Estado CONTROLADO — sem valor em args de propósito: um valor fixo
      // congelaria o Playground (o clique pararia de alternar o estado).
      // defaultChecked cobre o control vivo do estado inicial.
      control: false,
      description: "Estado controlado do checkbox",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "—" } },
    },
    defaultChecked: {
      control: "boolean",
      description: "Estado inicial não controlado",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    onCheckedChange: {
      control: false,
      description: "Callback disparado ao alternar o estado. Recebe apenas o boolean resultante.",
      table: { type: { summary: "(checked: boolean) => void" }, defaultValue: { summary: "—" } },
    },
    indeterminate: {
      control: "boolean",
      description: 'Estado misto (seleção parcial). Propriedade dedicada — não é checked="indeterminate".',
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o checkbox",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description: "Marca o campo como obrigatório",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description: "Impede marcar/desmarcar sem desabilitar visualmente",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Nome do campo para participação em formulários HTML nativos",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    value: {
      control: "text",
      description: "Valor enviado no submit do formulário quando marcado",
      table: { type: { summary: "string" }, defaultValue: { summary: '"on"' } },
    },
  },
  args: {
    defaultChecked: false,
    disabled: false,
    required: false,
    readOnly: false,
    indeterminate: false,
    name: "termos",
    value: "on",
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "accessibility.item1",
      "accessibility.item3",
      "accessibility.item5",
    ],
  },
  render: (args) => {
    const { onCheckedChange, defaultChecked, ...rest } = args;
    return (
      <div className="nds-cluster" data-spacing="sm">
        <Checkbox
          key={String(defaultChecked)}
          id="playground-checkbox"
          defaultChecked={defaultChecked}
          {...rest}
          onCheckedChange={(checked) => onCheckedChange?.(checked)}
        />
        <label htmlFor="playground-checkbox" className="nds-label">
          Aceito os termos e condições
        </label>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    const desmarcar = async () => {
      if (checkbox.getAttribute("aria-checked") !== "false") await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).toHaveAttribute("aria-checked", "false"));
    };
    const marcar = async () => {
      if (checkbox.getAttribute("aria-checked") !== "true") await userEvent.click(checkbox);
      await waitFor(() => expect(checkbox).toHaveAttribute("aria-checked", "true"));
    };

    await step("Checkbox está presente e visível", async () => {
      await expect(checkbox).toBeInTheDocument();
      await expect(checkbox).toBeVisible();
    });

    await step("Checkbox tem data-slot correto", async () => {
      await expect(checkbox).toHaveAttribute("data-slot", "checkbox");
    });

    await step("Nome acessível vem do label associado via htmlFor/id", async () => {
      await expect(canvas.getByRole("checkbox", { name: "Aceito os termos e condições" })).toBe(checkbox);
    });

    await step("Clique desmarcado→marcado dispara o callback com true", async () => {
      await desmarcar();
      await marcar();
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });

    await step("Clique marcado→desmarcado dispara o callback com false", async () => {
      await desmarcar();
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
    });

    await step("Space com foco alterna o estado e dispara o callback", async () => {
      checkbox.focus();
      await expect(checkbox).toHaveFocus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(checkbox).toHaveAttribute("aria-checked", "true"));
      await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    });
  },
};
