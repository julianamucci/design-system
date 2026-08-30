import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent, within, expect, waitFor } from "storybook/test";
import { FOCUS_RULE_GUARDA, axeRules, waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  CLEAR_LABEL,
  COUNTRIES,
  GroupedIngredientCombobox,
  INGREDIENTS,
  MultiCountryCombobox,
  OPEN_LABEL,
  OverflowingChipsCombobox,
  REMOVE_PREFIX,
  SingleCountryCombobox,
  contrastRatio,
  paintedBackground,
  toOptionValues,
} from "./combobox.fixtures";
import { Combobox } from "./combobox";
import {
  comboboxGroupedSource,
  comboboxMultipleSource,
  comboboxSource,
} from "./combobox.source";

const meta: Meta = {
  title: "Primitives/Form/Combobox/Variants",
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
          "Variantes do Combobox: escolha única — de campo fechado a lista aberta com opção ativa —, múltipla com chips e lista agrupada por cabeçalho.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const OpenWithActiveOption: Story = {
  parameters: {
    covers: ["visual.item3", "accessibility.item3"],
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: {
      description: {
        story:
          "Lista aberta, ancorada ao campo e desenhada acima do resto da página, com a opção ativa em destaque.",
      },
    },
  },
  render: () => <SingleCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const body = within(document.body);

    await step("O gatilho abre a lista inteira", async () => {
      // Idempotente: a play reexecuta no mesmo DOM, e um clique cego fecharia
      // a lista na segunda rodada.
      if (field.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: "Abrir lista" }));
      }
      await waitForPortal("listbox");
      await expect(field).toHaveAttribute("aria-expanded", "true");
      await expect(body.queryAllByRole("option")).toHaveLength(COUNTRIES.length);
    });

    await step("A seta destaca uma opção sem tirar o foco do campo", async () => {
      if (!body.queryAllByRole("option").some((o) => o.hasAttribute("data-highlighted"))) {
        await userEvent.keyboard("{ArrowDown}");
      }
      await waitFor(async () => {
        const highlighted = body
          .queryAllByRole("option")
          .filter((option) => option.hasAttribute("data-highlighted"));
        await expect(highlighted).toHaveLength(1);
      });
      await expect(field).toHaveFocus();
    });
  },
};

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

/**
 * Espião da escolha múltipla.
 *
 * A story não declara `args` — o meta deste arquivo desliga controls e actions
 * —, então o espião mora fora dela, no módulo. `mockClear()` antes de cada
 * asserção é o que o mantém honesto: o painel Interactions reexecuta a play no
 * MESMO DOM, com as chamadas da rodada anterior ainda registradas.
 */
const multipleValueChange = fn();

export const MultipleWithChips: Story = {
  parameters: {
    covers: [
      "functional.item4",
      "functional.item5",
      "accessibility.item5",
      "accessibility.item6",
      "visual.item2",
    ],
    docs: {
      source: { transform: comboboxMultipleSource },
      description: {
        story:
          "Vários valores ao mesmo tempo — cada escolhido vira um chip dentro do campo, com botão de remover próprio. Backspace com o texto vazio remove o último.",
      },
    },
  },
  render: () => (
    <MultiCountryCombobox
      onValueChange={(value) => multipleValueChange(toOptionValues(value))}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
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

    await step("Os escolhidos ocupam a caixa como chips", async () => {
      await expect(chips()).toHaveLength(2);
      await expect(chips()[0]).toHaveTextContent("Brasil");
      await expect(chips()[1]).toHaveTextContent("Argentina");
      // Os chips moram DENTRO da caixa do campo, e não ao lado dela: é isso
      // que faz o anel de foco envolver o conjunto.
      const box = canvasElement.querySelector('[data-slot="combobox-input-wrapper"]');
      await expect(box?.contains(chips()[0])).toBe(true);
    });

    await step("Cada botão de remover tem nome próprio", async () => {
      // Botões todos chamados "Remover" são indistinguíveis para quem navega
      // por lista de controles — o rótulo do chip entra no nome.
      await expect(
        canvas.getByRole("button", { name: `${REMOVE_PREFIX} Brasil` }),
      ).toBeVisible();
      await expect(
        canvas.getByRole("button", { name: `${REMOVE_PREFIX} Argentina` }),
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

    await step("A lista se declara de escolha múltipla", async () => {
      // Idempotente: a play reexecuta no mesmo DOM, e um clique cego no gatilho
      // FECHARIA a lista na segunda rodada.
      if (field.getAttribute("aria-expanded") !== "true") {
        await userEvent.click(canvas.getByRole("button", { name: OPEN_LABEL }));
      }
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toHaveAttribute("aria-multiselectable", "true");
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("listbox");
    });

    await step("O botão de remover tira só aquele chip", async () => {
      multipleValueChange.mockClear();
      await userEvent.click(
        canvas.getByRole("button", { name: `${REMOVE_PREFIX} Argentina` }),
      );
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });
      await expect(chips()[0]).toHaveTextContent("Brasil");
      await expect(multipleValueChange).toHaveBeenCalledWith(["brasil"]);
      // O foco continua no campo: quem removeu por teclado precisa seguir
      // digitando sem procurar onde o cursor foi parar.
      await expect(field).toHaveFocus();
      await reselect("Argentina");
    });

    await step("Backspace com o campo vazio remove o último chip", async () => {
      // É o gesto que define o chip: sem ele, desfazer exige o mouse.
      await userEvent.clear(field);
      await expect(field).toHaveValue("");
      multipleValueChange.mockClear();
      await userEvent.keyboard("{Backspace}");
      await waitFor(async () => {
        await expect(chips()).toHaveLength(1);
      });
      await expect(chips()[0]).toHaveTextContent("Brasil");
      await expect(multipleValueChange).toHaveBeenCalledWith(["brasil"]);
      await reselect("Argentina");
    });

    await step("A story fecha no estado que o Chromatic fotografa", async () => {
      await userEvent.click(document.body);
      await waitForPortalGone("listbox");
      await expect(chips()).toHaveLength(2);
      await expect(field).toHaveValue("");
    });
  },
};

/**
 * Linha única de chips.
 *
 * `chipsLayout="single-line"` põe todos os chips numa linha só que rola na
 * horizontal, em vez de acumular linhas. O que a play defende é o que quebrou
 * antes: limpar e abrir ficam na PRIMEIRA linha, e não caem para baixo quando
 * os chips enchem o campo.
 */
export const SingleLineChips: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Os chips ficam numa linha só que rola na horizontal, e o campo não cresce em altura. Limpar e abrir continuam na primeira linha, ao lado do texto.",
      },
    },
  },
  render: () => <OverflowingChipsCombobox chipsLayout="single-line" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const box = canvasElement.querySelector(
      '[data-slot="combobox-input-wrapper"]',
    ) as HTMLElement;
    const chipsBox = canvasElement.querySelector(
      '[data-slot="combobox-chips"]',
    ) as HTMLElement;
    const chips = () =>
      canvasElement.querySelectorAll<HTMLElement>('[data-slot="combobox-chip"]');

    await step("A caixa do campo declara a forma de linha única", async () => {
      // O atributo é o que a folha lê. Sem esta asserção, trocar o valor por
      // engano deixaria a story mostrando o desenho padrão sem ninguém notar.
      await expect(box).toHaveAttribute("data-chips", "single-line");
    });

    await step("Há chips de sobra para o campo comportar", async () => {
      // A medida que dá SENTIDO à story: com poucos chips, linha única e
      // quebra desenham a mesma coisa, e o resto da play passaria sem exercer
      // o ramo que ela existe para cobrir.
      await expect(chips().length).toBeGreaterThan(4);
      await expect(chipsBox.scrollWidth).toBeGreaterThan(chipsBox.clientWidth);
    });

    await step("Limpar e abrir continuam na primeira linha", async () => {
      // Era ESTE o defeito relatado: a caixa do campo quebrava linha junto com
      // os chips, e os dois controles caíam para baixo do bloco. Comparar o
      // topo de cada um com o do primeiro chip é o que acusa a queda — sem
      // isso, apagar a regra de layout mantém a story verde.
      const firstChipTop = chips()[0].getBoundingClientRect().top;
      const clearTop = canvas
        .getByRole("button", { name: CLEAR_LABEL })
        .getBoundingClientRect().top;
      const openTop = canvas
        .getByRole("button", { name: OPEN_LABEL })
        .getBoundingClientRect().top;

      // Tolerância de poucos px: os controles e o chip têm alturas próximas mas
      // não iguais, e o alinhamento vertical os separa por uma fração. Uma
      // linha inteira de queda passa dos 20px e reprova aqui.
      await expect(Math.abs(clearTop - firstChipTop)).toBeLessThanOrEqual(6);
      await expect(Math.abs(openTop - firstChipTop)).toBeLessThanOrEqual(6);
    });

    await step("O conjunto rola na horizontal, e o campo não cresce", async () => {
      // Rolar é a contrapartida de não quebrar: sem ela, os chips que passam da
      // largura ficariam inalcançáveis.
      await expect(getComputedStyle(chipsBox).overflowX).toBe("auto");
      // Uma linha só: a caixa não é mais alta do que o próprio chip mais a
      // folga que o padding do campo dá aos dois lados.
      const chipHeight = chips()[0].getBoundingClientRect().height;
      await expect(box.getBoundingClientRect().height).toBeLessThan(
        chipHeight * 2,
      );
    });
  },
};

export const Grouped: Story = {
  parameters: {
    covers: ["visual.item4"],
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
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
