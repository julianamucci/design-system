import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { definir } from "./switch.fixtures";
import { Label } from "./label";
import { SwitchDocs } from "@/components/docs/SwitchDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";
import { switchSource } from "./switch.source";

const meta = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs", "form"],
  parameters: {
    docs: {
      page: withAutoDocsTab(SwitchDocs),
      source: { transform: switchSource },
    },
  },
  argTypes: {
    checked: {
      // Prop CONTROLADA. Dar valor a ela congela o Playground: o estado passa a
      // vir do control e o clique deixa de mudar qualquer coisa. Fica como
      // documentação na aba API Reference; quem exercita o estado inicial no
      // painel é `defaultChecked`, que é prop de montagem.
      control: false,
      description: "Estado controlado. Use junto com o callback de mudança.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "—" } },
    },
    defaultChecked: {
      control: "boolean",
      description: "Estado inicial não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o Switch.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Nome do campo no formulário HTML.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    size: {
      control: "inline-radio",
      options: ["default", "sm"],
      description: "Degrau de tamanho — vira data-size, onde o CSS guarda a medida.",
      table: { type: { summary: '"default" | "sm"' }, defaultValue: { summary: '"default"' } },
    },
    onCheckedChange: {
      control: false,
      description: "Callback disparado ao alternar.",
      table: { type: { summary: "(checked: boolean) => void" } },
    },
  },
  args: {
    defaultChecked: false,
    disabled: false,
    name: "notificacoes",
    size: "default",
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3",
      "accessibility.item1", "accessibility.item4", "accessibility.item5",
    ],
  },
  // `defaultChecked` é prop de MONTAGEM: sem a `key` o control mexe no valor e
  // o componente já montado ignora. O spy recebe só o valor — o segundo
  // argumento do callback traz o evento nativo da lib, e serializá-lo na aba
  // Actions estoura SecurityError (event.view é o Window do iframe).
  render: ({ onCheckedChange, defaultChecked, ...args }) => (
    <div className="nds-cluster" data-spacing="sm">
      <Switch
        key={String(defaultChecked)}
        id="playground-switch"
        defaultChecked={defaultChecked}
        onCheckedChange={(checked) => onCheckedChange?.(checked)}
        {...args}
      />
      <Label htmlFor="playground-switch">Receber notificações</Label>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    const spy = args.onCheckedChange as ReturnType<typeof fn>;

    await step("O controle é anunciado como switch e nomeado pelo rótulo", async () => {
      await expect(switchEl).toHaveAttribute("data-slot", "switch");
      await expect(switchEl).toHaveAttribute("role", "switch");
      await expect(canvas.getByRole("switch", { name: /Receber notificações/i }))
        .toBe(switchEl);
    });

    await step("aria-checked acompanha o estado, em vez de ficar fixo", async () => {
      // Comparação com o estado imediatamente anterior, e não com um valor
      // absoluto: o replay parte de onde a rodada anterior parou.
      const antes = switchEl.getAttribute("aria-checked");
      await expect(antes).toMatch(/^(true|false)$/);
      await definir(switchEl, antes !== "true");
      await definir(switchEl, antes === "true");
    });

    await step("Clicar no controle alterna e dispara o callback de mudança", async () => {
      // A precondição fica FORA da contagem: `definir` só clica quando precisa,
      // então contar a partir de um estado desconhecido daria 1 ou 2 conforme a
      // rodada. Fixado o ponto de partida, o par abaixo são sempre dois cliques.
      await definir(switchEl, false);
      const callsBefore = spy.mock.calls.length;
      await definir(switchEl, true);
      await definir(switchEl, false);
      await expect(spy.mock.calls.length).toBe(callsBefore + 2);
      await expect(spy).toHaveBeenLastCalledWith(false);
    });

    await step("Space com o controle focado alterna o estado", async () => {
      await definir(switchEl, false);
      switchEl.focus();
      await expect(switchEl).toHaveFocus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(switchEl).toHaveAttribute("aria-checked", "true"));
    });

    await step("Clicar no rótulo alterna o controle associado", async () => {
      const label = canvas.getByText("Receber notificações");
      await definir(switchEl, false, label);
      await definir(switchEl, true, label);
    });
  },
};
