import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { MailIcon, PhoneIcon, MessageCircleIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  selectComGruposSource,
  selectComIconeSource,
  selectSource,
} from "./select.source";

/** Rótulos das regiões — a asserção deriva daqui em vez de contar à mão. */
const REGIOES = {
  Sudeste: [
    { value: "sp", label: "São Paulo" },
    { value: "rj", label: "Rio de Janeiro" },
    { value: "mg", label: "Minas Gerais" },
  ],
  Sul: [
    { value: "rs", label: "Rio Grande do Sul" },
    { value: "sc", label: "Santa Catarina" },
    { value: "pr", label: "Paraná" },
  ],
} as const;

const VALUE_REGIOES = Object.fromEntries(
  Object.values(REGIOES).flatMap((itens) => itens.map((i) => [i.value, i.label])),
);

const meta = {
  title: "UI/Select/Variants",
  tags: ["form"],
  component: Select,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: selectSource },
      description: {
        component:
          "Variantes do Select: Default (lista plana), WithGroups (SelectGroup + SelectLabel) e WithIcon (SelectItem com ícone inline).",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Lista simples — apenas SelectItem dentro do SelectContent. Placeholder \"Selecione...\" visível até o usuário escolher.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
          <SelectItem value="es">Espírito Santo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Campo exibe o placeholder e o nome acessível", async () => {
      await expect(trigger).toHaveTextContent(/Selecione/);
      await expect(trigger).toHaveAttribute("aria-label", "Selecionar estado");
    });
    await step("Abrir mostra uma lista plana, sem cabeçalho de grupo", async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toBeVisible();
      const options = within(listbox).getAllByRole("option");
      await expect(options).toHaveLength(4);
      await expect(options[0]).toHaveAccessibleName("São Paulo");
      // Nada escolhido ainda: nenhuma opção se anuncia selecionada. A conta é
      // por PAPEL, não por atributo — em lista de escolha única a marca só é
      // exigida na opção escolhida, e cada lib decide se escreve a negativa.
      await expect(
        within(listbox).queryAllByRole("option", { selected: true }),
      ).toHaveLength(0);
      await expect(within(listbox).queryAllByRole("group")).toHaveLength(0);
    });
  },
};

export const WithGroups: Story = {
  parameters: {
    docs: {
      // Sub-composição que o snippet do meta esconderia: SelectGroup,
      // SelectLabel e o separador decorativo entre os grupos.
      source: { transform: selectComGruposSource },
      description: {
        story:
          "SelectGroup + SelectLabel agrupam opções por categoria. Use quando há ≥2 categorias claras com ≥2 itens cada.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select items={VALUE_REGIOES}>
        <SelectTrigger aria-label="Selecionar região">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sudeste</SelectLabel>
            {REGIOES.Sudeste.map((estado) => (
              <SelectItem key={estado.value} value={estado.value}>
                {estado.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Sul</SelectLabel>
            {REGIOES.Sul.map((estado) => (
              <SelectItem key={estado.value} value={estado.value}>
                {estado.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");

    const abrir = async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      return await waitForPortal("listbox");
    };

    await step("Escolher item de um grupo atualiza o campo", async () => {
      await abrir();
      const option = await waitForPortal("option", { name: "Santa Catarina" });
      await userEvent.click(option);
      await waitFor(async () => {
        // Sem o mapa `items` o campo mostraria "sc": o valor cru.
        await expect(trigger).toHaveTextContent(/Santa Catarina/);
      });
    });

    // Os passos abaixo reabrem a lista e a story TERMINA aberta: é a lista que
    // muda entre as variantes, não o campo fechado, e é ela que a regressão
    // visual precisa fotografar.
    await step("Cada categoria vira um grupo nomeado pelo cabeçalho", async () => {
      const listbox = await abrir();
      const grupos = within(listbox).getAllByRole("group");
      await expect(grupos).toHaveLength(Object.keys(REGIOES).length);
      for (const [i, nome] of Object.keys(REGIOES).entries()) {
        await expect(grupos[i]).toHaveAccessibleName(nome);
      }
    });

    await step("As opções continuam todas na mesma lista", async () => {
      const listbox = await abrir();
      const total = Object.values(REGIOES).reduce((soma, g) => soma + g.length, 0);
      await expect(within(listbox).getAllByRole("option")).toHaveLength(total);
      // Linha para o olho, silêncio para o leitor de tela — quem separa
      // semanticamente é o grupo.
      await expect(listbox.querySelectorAll(".nds-select-separator")).toHaveLength(
        Object.keys(REGIOES).length - 1,
      );
    });
  },
};

export const WithIcon: Story = {
  parameters: {
    docs: {
      // O ícone dentro da opção é o assunto, e nenhum control o descreve.
      source: { transform: selectComIconeSource },
      description: {
        story:
          "SelectItem com ícone inline antes do texto. Ícone deve ter size-4 (padrão via SVG não-classed) e ficar à esquerda do label.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar canal de contato">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="email">
            <MailIcon /> E-mail
          </SelectItem>
          <SelectItem value="phone">
            <PhoneIcon /> Telefone
          </SelectItem>
          <SelectItem value="chat">
            <MessageCircleIcon /> Chat
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("O ícone entra na opção e fica fora do nome acessível", async () => {
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const listbox = await waitForPortal("listbox");
      const options = within(listbox).getAllByRole("option");
      await expect(options).toHaveLength(3);
      await expect(options[0].querySelector("svg")).toBeTruthy();
      // Ícone decorativo: o nome acessível continua sendo só o rótulo, sem eco.
      await expect(options[0]).toHaveAccessibleName("E-mail");
    });

    await step("O ícone é dimensionado pela folha do componente", async () => {
      // `.nds-select-item svg:not([class*="size-"])` é a regra que dá 1rem; sem
      // ela o SVG viria no tamanho intrínseco e estouraria a linha.
      const listbox = await waitForPortal("listbox");
      const icone = within(listbox).getAllByRole("option")[0].querySelector("svg") as SVGElement;
      await expect(getComputedStyle(icone).width).toBe("16px");
    });
  },
};
