import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, waitFor, within, expect } from "storybook/test";
import { Switch } from "./switch";
import { Label } from "./label";
import { SwitchDocs } from "@/components/docs/SwitchDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

/**
 * Leva o switch ao estado desejado, clicando SÓ quando ele ainda não está lá.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar. Um clique
 * cego alterna a partir do que a rodada anterior deixou e inverte o resultado —
 * a suíte fica verde (o vitest remonta a cada teste) e o painel falha.
 */
async function definir(
  sw: HTMLElement,
  ligado: boolean,
  alvo: HTMLElement = sw,
): Promise<void> {
  if ((sw.getAttribute("aria-checked") === "true") !== ligado) await userEvent.click(alvo);
  await waitFor(() => expect(sw).toHaveAttribute("aria-checked", String(ligado)));
}

const meta = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(SwitchDocs) },
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
      <Label htmlFor="playground-switch">Receber notificações por email</Label>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    const espiao = args.onCheckedChange as ReturnType<typeof fn>;

    await step("O controle é anunciado como switch e nomeado pelo rótulo", async () => {
      await expect(switchEl).toHaveAttribute("data-slot", "switch");
      await expect(switchEl).toHaveAttribute("role", "switch");
      await expect(canvas.getByRole("switch", { name: /Receber notificações por email/i }))
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
      const chamadasAntes = espiao.mock.calls.length;
      await definir(switchEl, true);
      await definir(switchEl, false);
      await expect(espiao.mock.calls.length).toBe(chamadasAntes + 2);
      await expect(espiao).toHaveBeenLastCalledWith(false);
    });

    await step("Space com o controle focado alterna o estado", async () => {
      await definir(switchEl, false);
      switchEl.focus();
      await expect(switchEl).toHaveFocus();
      await userEvent.keyboard(" ");
      await waitFor(() => expect(switchEl).toHaveAttribute("aria-checked", "true"));
    });

    await step("Clicar no rótulo alterna o controle associado", async () => {
      const rotulo = canvas.getByText("Receber notificações por email");
      await definir(switchEl, false, rotulo);
      await definir(switchEl, true, rotulo);
    });
  },
};
