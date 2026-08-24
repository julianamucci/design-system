import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { FOCUS_RULE_GUARDA, waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  GroupedIngredientCombobox,
  INGREDIENTS,
  MultiTechCombobox,
  SingleCountryCombobox,
} from "./combobox.fixtures";
import { Combobox } from "./combobox";
import {
  comboboxGroupedSource,
  comboboxMultipleSource,
  comboboxSource,
} from "./combobox.source";

const meta: Meta = {
  title: "UI/Combobox/Variants",
  component: Combobox,
  tags: ["form"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: comboboxSource },
      description: {
        component:
          "Variantes do Combobox: escolha única, múltipla com chips e lista agrupada por cabeçalho.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SingleChoice: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          "Um valor por vez — o rótulo do escolhido ocupa o campo, e não existe chip nenhum.",
      },
    },
  },
  render: () => <SingleCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;

    await step("Escolher pelo teclado põe o RÓTULO no campo", async () => {
      // O campo mostra "Brasil", nunca "brasil": o valor cru é o que viaja no
      // formulário, e exibi-lo seria vazar o identificador para a tela.
      await userEvent.clear(field);
      await userEvent.type(field, "bra");
      await waitForPortal("listbox");
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("listbox");
      await expect(field).toHaveValue("Brasil");
    });

    await step("A escolha única não desenha chips", async () => {
      await expect(
        canvasElement.querySelectorAll('[data-slot="combobox-chip"]'),
      ).toHaveLength(0);
    });
  },
};

export const MultipleWithChips: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      source: { transform: comboboxMultipleSource },
      description: {
        story:
          "Vários valores ao mesmo tempo — cada escolhido vira um chip dentro do campo, com botão de remover próprio.",
      },
    },
  },
  render: () => <MultiTechCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;

    await step("Os escolhidos ocupam a caixa como chips", async () => {
      const chips = canvasElement.querySelectorAll('[data-slot="combobox-chip"]');
      await expect(chips).toHaveLength(2);
      // Os chips moram DENTRO da caixa do campo, e não ao lado dela: é isso
      // que faz o anel de foco envolver o conjunto.
      const box = canvasElement.querySelector('[data-slot="combobox-input-wrapper"]');
      await expect(box?.contains(chips[0])).toBe(true);
    });

    await step("A lista se declara de escolha múltipla", async () => {
      if (field.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: "Abrir lista" }));
      }
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toHaveAttribute("aria-multiselectable", "true");
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("listbox");
    });
  },
};

export const Grouped: Story = {
  parameters: {
    covers: ["visual.item4"],
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      source: { transform: comboboxGroupedSource },
      description: {
        story:
          "Opções organizadas por categoria, com cabeçalho de grupo amarrado às opções que ele encabeça.",
      },
    },
  },
  render: () => <GroupedIngredientCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const body = within(document.body);

    await step("A lista abre com um grupo por categoria", async () => {
      if (field.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: "Abrir lista" }));
      }
      await waitForPortal("listbox");
      await waitFor(async () => {
        await expect(body.queryAllByRole("group")).toHaveLength(INGREDIENTS.length);
      });
    });

    await step("Cada grupo é nomeado pelo próprio cabeçalho", async () => {
      // Sem o vínculo, o cabeçalho é só um texto solto: quem usa leitor de tela
      // ouve as opções sem saber a qual categoria elas pertencem.
      for (const group of INGREDIENTS) {
        await expect(body.getByRole("group", { name: group.value })).toBeVisible();
      }
    });

    await step("Filtrar deixa só o grupo que ainda tem opções", async () => {
      await userEvent.clear(field);
      await userEvent.type(field, "cenoura");
      await waitFor(async () => {
        await expect(body.queryAllByRole("option")).toHaveLength(1);
      });
      await expect(body.queryAllByRole("group")).toHaveLength(1);
      await expect(body.getByRole("group", { name: "Legumes" })).toBeVisible();
      // Devolve a story ao estado que o Chromatic fotografa: lista inteira,
      // dois grupos, nenhum filtro.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(body.queryAllByRole("group")).toHaveLength(INGREDIENTS.length);
      });
    });
  },
};
