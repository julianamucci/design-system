import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect } from "storybook/test";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { ToggleGroupDocs } from "@/components/docs/ToggleGroupDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs", "form"],
  parameters: {
    docs: { page: withAutoDocsTab(ToggleGroupDocs) },
  },
  argTypes: {
    type: {
      control: "inline-radio",
      options: ["single", "multiple"],
      description: "Modo de seleção. Exclusivo devolve string; combinado devolve lista.",
      table: { type: { summary: '"single" | "multiple"' }, defaultValue: { summary: '"single"' } },
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Direção da navegação por setas",
    },
    variant: {
      control: "inline-radio",
      options: ["default", "outline"],
      description: "Estilo visual herdado pelos items",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "default", "lg"],
      description: "Altura herdada pelos items",
    },
    spacing: {
      control: { type: "number", min: 0, max: 4, step: 1 },
      description: "Distância entre items (0 = segmented)",
    },
    disabled: {
      control: "boolean",
      description: "Desabilita todos os items",
    },
    // Sem entrada aqui as duas ficavam fora da aba API Reference: `fn()` em
    // args e nada na tabela foi como o callback sumiu da documentação.
    onValueChange: {
      control: false,
      description: "Disparado ao trocar a seleção, com o novo valor",
      table: { type: { summary: "(value: string | string[]) => void" } },
    },
    "aria-label": {
      control: "text",
      description: "Nome acessível do grupo — obrigatório, descreve a categoria",
      table: { type: { summary: "string" } },
    },
  },
  args: {
    type: "single",
    orientation: "horizontal",
    variant: "default",
    size: "default",
    spacing: 0,
    disabled: false,
    onValueChange: fn(),
    "aria-label": "Alinhamento do texto",
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item3",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item4",
      "accessibility.item5",
    ],
  },
  render: (args) => (
    <ToggleGroup
      // `type` decide a forma do valor inicial e é prop de montagem no
      // primitivo: sem a chave, trocar o control não remonta o grupo.
      key={String(args.type)}
      {...args}
      defaultValue={args.type === "multiple" ? ["left"] : "left"}
    >
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Centralizar">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const left = canvas.getByRole("button", { name: "Alinhar à esquerda" });
    const center = canvas.getByRole("button", { name: "Centralizar" });
    const right = canvas.getByRole("button", { name: "Alinhar à direita" });
    const group = canvas.getByRole("toolbar");

    await step("accessibility.item5 — o grupo e cada item icon-only têm nome", async () => {
      await expect(group).toHaveAttribute("data-slot", "toggle-group");
      await expect(group).toHaveAttribute("aria-label", args["aria-label"] as string);
      await expect(left).toHaveAttribute("aria-label", "Alinhar à esquerda");
      await expect(center).toHaveAttribute("aria-label", "Centralizar");
      await expect(right).toHaveAttribute("aria-label", "Alinhar à direita");
    });

    await step("Orientação e espaçamento chegam ao markup", async () => {
      await expect(group).toHaveAttribute("data-orientation", args.orientation as string);
      await expect(group).toHaveAttribute("data-spacing", String(args.spacing));
    });

    await step("accessibility.item4 — aria-pressed acompanha a seleção do grupo", async () => {
      // O valor inicial do grupo chega ao item: exatamente um pressionado.
      const pressionados = [left, center, right].filter(
        (b) => b.getAttribute("aria-pressed") === "true",
      );
      await expect(pressionados).toHaveLength(1);
      await expect(left).toHaveAttribute("aria-pressed", "true");
    });

    if (args.disabled) {
      await step("Grupo desabilitado propaga o estado a cada item", async () => {
        for (const b of [left, center, right]) await expect(b).toBeDisabled();
      });
      return;
    }

    await step("Roving tabindex — apenas 1 item com tabIndex=0", async () => {
      const focusable = canvas.getAllByRole("button").filter((el) => el.tabIndex === 0);
      await expect(focusable).toHaveLength(1);
    });

    await step("functional.item3 — a seta move o foco sem ativar nada", async () => {
      const antes = [left, center, right].map((b) => b.getAttribute("aria-pressed"));
      left.focus();
      await userEvent.keyboard(args.orientation === "vertical" ? "{ArrowDown}" : "{ArrowRight}");
      await expect(center).toHaveFocus();
      const depois = [left, center, right].map((b) => b.getAttribute("aria-pressed"));
      await expect(depois).toEqual(antes);
    });

    await step("functional.item4 — Space alterna o item focado", async () => {
      // Lido antes e comparado depois: reexecutar a play no painel Interactions
      // parte do estado que a rodada anterior deixou, e uma asserção absoluta
      // inverteria de rodada em rodada.
      center.focus();
      const antes = center.getAttribute("aria-pressed");
      await userEvent.keyboard(" ");
      await expect(center.getAttribute("aria-pressed")).not.toBe(antes);
      await expect(args.onValueChange).toHaveBeenCalled();
    });

    await step("Enter alterna, idêntico a Space", async () => {
      const antes = center.getAttribute("aria-pressed");
      await userEvent.keyboard("{Enter}");
      await expect(center.getAttribute("aria-pressed")).not.toBe(antes);
    });

    await step("Seleção devolvida ao estado inicial", async () => {
      // O painel Interactions reexecuta a play no MESMO DOM. No modo exclusivo
      // o par Space+Enter termina sem nenhum item ativo, e a asserção de
      // "exatamente um pressionado" mediria a sobra da rodada anterior.
      if (left.getAttribute("aria-pressed") !== "true") await userEvent.click(left);
      await expect(left).toHaveAttribute("aria-pressed", "true");
    });
  },
};
