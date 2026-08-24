import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  COUNTRIES,
  MultiTechCombobox,
  REMOVE_PREFIX,
  SingleCountryCombobox,
  contrastRatio,
  paintedBackground,
  toOptionValues,
} from "./combobox.fixtures";
import { comboboxSource } from "./combobox.source";
import { ComboboxDocs } from "@/components/docs/ComboboxDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type ComboboxArgs = {
  label: string;
  placeholder: string;
  multiple: boolean;
  disabled: boolean;
  invalid: boolean;
  name: string;
  onValueChange: (value: string[]) => void;
};

const meta: Meta<ComboboxArgs> = {
  title: "UI/Combobox",
  tags: ["autodocs", "form"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(ComboboxDocs),
      source: { transform: comboboxSource },
    },
  },
  argTypes: {
    label: {
      control: "text",
      description: "Rótulo visível do campo",
      table: { type: { summary: "string" } },
    },
    placeholder: {
      control: "text",
      description: "Dica exibida enquanto nada foi digitado",
      table: { type: { summary: "string" } },
    },
    multiple: {
      control: "boolean",
      description: "Modo múltiplo: os escolhidos viram chips dentro do campo",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Desabilita o campo e impede a abertura da lista",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    invalid: {
      control: "boolean",
      description: "Marca o campo como inválido e pinta a borda de erro",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description: "Nome do campo no formulário HTML",
      table: { type: { summary: "string" } },
    },
    // Só o VALOR chega ao espião: o componente entrega objetos, e serializar o
    // rótulo traduzido faria o mesmo evento ter três formas por idioma.
    onValueChange: {
      control: false,
      description: "Disparado ao trocar a escolha; recebe os valores escolhidos",
      table: { type: { summary: "(value: string[]) => void" } },
    },
  },
  args: {
    label: "País",
    placeholder: "Buscar país",
    multiple: false,
    disabled: false,
    invalid: false,
    name: "pais",
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ComboboxArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "functional.item6",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "visual.item1",
    ],
  },
  render: (args) =>
    args.multiple ? (
      <MultiTechCombobox
        label={args.label}
        placeholder={args.placeholder}
        name={args.name}
        disabled={args.disabled}
        invalid={args.invalid}
        onValueChange={(value) => args.onValueChange(toOptionValues(value))}
      />
    ) : (
      <SingleCountryCombobox
        label={args.label}
        placeholder={args.placeholder}
        name={args.name}
        disabled={args.disabled}
        invalid={args.invalid}
        onValueChange={(value) => args.onValueChange(toOptionValues(value))}
      />
    ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const spy = args.onValueChange as unknown as ReturnType<typeof fn>;
    const body = within(document.body);

    // Portal: as opções vivem no `<body>`, e uma consulta presa ao canvas
    // acharia zero em toda story deste arquivo.
    const options = () => body.queryAllByRole("option");
    const highlightedIndex = () =>
      options().findIndex((option) => option.hasAttribute("data-highlighted"));

    // Idempotente: o painel Interactions reexecuta a play no MESMO DOM, e um
    // clique cego no gatilho FECHARIA a lista na segunda rodada.
    const openList = async () => {
      if (field.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: "Abrir lista" }));
      }
      return await waitForPortal("listbox");
    };

    if (args.multiple) {
      await step("Modo múltiplo — os escolhidos aparecem como chips", async () => {
        const chips = canvasElement.querySelectorAll('[data-slot="combobox-chip"]');
        await expect(chips.length).toBeGreaterThan(0);
      });
      return;
    }

    if (args.disabled) {
      await step("Desabilitado — o campo não abre", async () => {
        await expect(field).toBeDisabled();
        await userEvent.click(field, { pointerEventsCheck: 0 });
        await expect(field).toHaveAttribute("aria-expanded", "false");
        await expect(options()).toHaveLength(0);
      });
      return;
    }

    await step("O campo é anunciado como combobox fechado", async () => {
      // `role` no INPUT, não num wrapper: é o que faz o leitor de tela anunciar
      // o campo como combobox e ler a opção ativa depois.
      await expect(field.tagName).toBe("INPUT");
      await expect(field).toHaveAttribute("aria-expanded", "false");
      await expect(field).toHaveAttribute("aria-autocomplete", "list");
      // O rótulo é um `<label>` de verdade: sem o `htmlFor`, o campo chegaria
      // sem nome nenhum, e o clique no rótulo não levaria a lugar algum.
      await expect(canvas.getByRole("combobox", { name: args.label })).toBe(field);
    });

    await step("Digitar filtra a lista e a abre", async () => {
      // `clear` e não `click`: na segunda rodada o campo já traz "Brasil" do
      // último passo, e digitar por cima daria "Brasilbra" — filtro vazio,
      // asserção invertida, suíte verde (o vitest remonta) e painel vermelho.
      await userEvent.clear(field);
      await userEvent.type(field, "bra");
      await waitFor(async () => {
        await expect(field).toHaveAttribute("aria-expanded", "true");
      });
      await waitFor(async () => {
        await expect(options()).toHaveLength(1);
      });
      await expect(options()[0]).toHaveTextContent("Brasil");
    });

    await step("A lista é anunciada como listbox e amarrada ao campo", async () => {
      // O item do contrato fala dos DOIS papéis; declarar sem medir o segundo
      // deixaria o auditor mentindo com aval.
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toBeVisible();
      await expect(field).toHaveAttribute("aria-controls", listbox.id);
    });

    await step("A opção ativa é apontada, e não focada", async () => {
      // Sem esta medida, mover o foco para a opção passaria — e a digitação
      // pararia de funcionar, que é o defeito clássico do padrão.
      await waitFor(async () => {
        await expect(field).toHaveAttribute(
          "aria-activedescendant",
          options()[0].id,
        );
      });
      await expect(options()[0]).toHaveAttribute("data-highlighted");
      await expect(field).toHaveFocus();
    });

    await step("A seta anda pela lista, e da última volta à primeira", async () => {
      await userEvent.clear(field);
      await openList();
      await waitFor(async () => {
        await expect(options()).toHaveLength(COUNTRIES.length);
      });
      const total = options().length;

      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(highlightedIndex()).toBeGreaterThanOrEqual(0);
      });
      const start = highlightedIndex();

      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(highlightedIndex()).toBe((start + 1) % total);
      });

      // Laço LIMITADO: sem o teto, uma lista que parasse de andar deixaria a
      // play girando até o timeout, e o relatório diria "lento", não "quebrado".
      for (let press = 0; press < total && highlightedIndex() !== total - 1; press += 1) {
        await userEvent.keyboard("{ArrowDown}");
      }
      await expect(highlightedIndex()).toBe(total - 1);

      await userEvent.keyboard("{ArrowDown}");
      await waitFor(async () => {
        await expect(highlightedIndex()).toBe(0);
      });
    });

    await step("Enter escolhe a opção ativa", async () => {
      await userEvent.clear(field);
      await userEvent.type(field, "bra");
      await waitFor(async () => {
        await expect(options()).toHaveLength(1);
      });
      spy.mockClear();
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("listbox");
      await expect(spy).toHaveBeenCalledWith(["brasil"]);
      await expect(field).toHaveValue("Brasil");
      await expect(field).toHaveAttribute("aria-expanded", "false");
    });

    await step("Escape fecha a lista sem trocar a escolha", async () => {
      await openList();
      spy.mockClear();
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("listbox");
      await expect(spy).not.toHaveBeenCalled();
      await expect(field).toHaveValue("Brasil");
      await expect(field).toHaveAttribute("aria-expanded", "false");
    });
  },
};

// ─── Múltiplo com chips ───────────────────────────────────────────────────────

export const MultipleWithChips: Story = {
  parameters: {
    covers: [
      "functional.item4",
      "functional.item5",
      "accessibility.item5",
      "accessibility.item6",
      "visual.item2",
    ],
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Modo múltiplo: cada escolhido vira um chip dentro do campo. Backspace com o texto vazio remove o último.",
      },
    },
  },
  args: {
    label: "Tecnologias",
    placeholder: "Adicionar tecnologia",
    multiple: true,
    name: "tecnologias",
  },
  render: (args) => (
    <MultiTechCombobox
      label={args.label}
      placeholder={args.placeholder}
      name={args.name}
      onValueChange={(value) => args.onValueChange(toOptionValues(value))}
    />
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const spy = args.onValueChange as unknown as ReturnType<typeof fn>;
    const chips = () =>
      canvasElement.querySelectorAll('[data-slot="combobox-chip"]');

    /**
     * Devolve a escolha ao estado de partida.
     *
     * A play reexecuta no MESMO DOM, sem remontar: o `useState` da fixture
     * guarda o que o passo anterior deixou. Sem esta volta, a segunda rodada
     * começaria com um chip a menos e o primeiro passo reprovaria.
     */
    const reselect = async (label: string) => {
      await userEvent.clear(field);
      await userEvent.type(field, label);
      await userEvent.keyboard("{Enter}");
      await waitFor(async () => {
        await expect(chips()).toHaveLength(2);
      });
      await userEvent.clear(field);
    };

    await step("Os escolhidos iniciais aparecem como chips", async () => {
      await expect(chips()).toHaveLength(2);
      await expect(chips()[0]).toHaveTextContent("React");
      await expect(chips()[1]).toHaveTextContent("Vue");
    });

    await step("Cada botão de remover tem nome próprio", async () => {
      // Quatro botões chamados "Remover" são indistinguíveis para quem navega
      // por lista de controles — o rótulo do chip entra no nome.
      await expect(
        canvas.getByRole("button", { name: `${REMOVE_PREFIX} React` }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: `${REMOVE_PREFIX} Vue` }),
      ).toBeVisible();
    });

    await step("O texto do chip alcança 4.5:1 sobre a superfície do campo", async () => {
      // O chip pinta SOBRE a caixa do campo, não sobre a página: medir contra a
      // página superestima e deixa passar um par que na tela não alcança.
      const chip = chips()[0] as HTMLElement;
      const text = chip.querySelector('[data-slot="combobox-chip-text"]');
      await expect(text).not.toBeNull();
      const ratio = contrastRatio(
        getComputedStyle(text as Element).color,
        paintedBackground(chip),
      );
      await expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    await step("O botão de remover tira só aquele chip", async () => {
      spy.mockClear();
      await userEvent.click(
        canvas.getByRole("button", { name: `${REMOVE_PREFIX} Vue` }),
      );
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });
      await expect(chips()[0]).toHaveTextContent("React");
      await expect(spy).toHaveBeenCalledWith(["react"]);
      // O foco continua no campo: quem removeu por teclado precisa seguir
      // digitando sem procurar onde o cursor foi parar.
      await expect(field).toHaveFocus();
      await reselect("Vue");
    });

    await step("Backspace com o campo vazio remove o último chip", async () => {
      // É o gesto que define o chip: sem ele, desfazer exige o mouse.
      await userEvent.clear(field);
      await expect(field).toHaveValue("");
      spy.mockClear();
      await userEvent.keyboard("{Backspace}");
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });
      await expect(chips()[0]).toHaveTextContent("React");
      await expect(spy).toHaveBeenCalledWith(["react"]);
      await reselect("Vue");
    });

    await step("A story fecha no estado que o Chromatic fotografa", async () => {
      await userEvent.click(document.body);
      await waitForPortalGone("listbox");
      await expect(chips()).toHaveLength(2);
      await expect(field).toHaveValue("");
    });
  },
};
