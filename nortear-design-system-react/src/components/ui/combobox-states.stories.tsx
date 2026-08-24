import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { FOCUS_RULE_GUARDA, axeRules, waitForPortal } from "@/lib/wait-for-portal";
import { noTransicao } from "@shared/testing/cor";
import {
  COUNTRIES,
  EMPTY_MESSAGE,
  SingleCountryCombobox,
  focusRingChanged,
} from "./combobox.fixtures";
import { Combobox } from "./combobox";
import {
  comboboxDisabledSource,
  comboboxEmptySource,
  comboboxInvalidSource,
  comboboxSource,
} from "./combobox.source";

const meta: Meta = {
  title: "UI/Combobox/States",
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
          "Estados do Combobox: fechado, aberto com opção ativa, lista vazia, desabilitado, inválido e com foco.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Caixa do campo — é ela que carrega borda, fundo e anel, nunca o input. */
const fieldBox = (root: HTMLElement) =>
  root.querySelector('[data-slot="combobox-input-wrapper"]') as HTMLElement;

export const Default: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          'Estado inicial — a dica do campo aparece, a lista está fechada e o chevron aponta para baixo.',
      },
    },
  },
  render: () => <SingleCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;

    await step("Campo fechado, sem escolha", async () => {
      await expect(field).toHaveAttribute("aria-expanded", "false");
      await expect(field).toHaveValue("");
      await expect(field).toHaveAttribute("placeholder", "Buscar país");
    });

    await step("A lista não existe enquanto está fechada", async () => {
      // Fechado não é "escondido": o portal desmonta. Uma lista só escondida
      // continuaria no percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole("listbox")).toHaveLength(0);
      await expect(within(document.body).queryAllByRole("option")).toHaveLength(0);
    });
  },
};

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

export const EmptyResult: Story = {
  parameters: {
    covers: ["functional.item7", "visual.item5"],
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: {
      source: { transform: comboboxEmptySource },
      description: {
        story:
          "Texto que não casa com nenhuma opção: a lista continua aberta e mostra a mensagem de lista vazia.",
      },
    },
  },
  render: () => <SingleCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const body = within(document.body);

    await step("Texto sem correspondência esvazia a lista", async () => {
      await userEvent.clear(field);
      await userEvent.type(field, "zzzz");
      await waitFor(async () => {
        await expect(body.queryAllByRole("option")).toHaveLength(0);
      });
    });

    await step("A mensagem de lista vazia aparece no lugar das opções", async () => {
      // Sem ela, um filtro que não casa deixa uma caixa branca e ninguém sabe
      // se o campo travou ou se a busca não achou nada.
      await waitFor(async () => {
        const empty = document.body.querySelector('[data-slot="combobox-empty"]');
        await expect(empty).not.toBeNull();
        await expect(empty).toHaveTextContent(EMPTY_MESSAGE);
      });
      await expect(field).toHaveAttribute("aria-expanded", "true");
    });

    await step("Nenhuma opção fica apontada quando não há opção", async () => {
      // `aria-activedescendant` apontando um id que não existe mais é o defeito
      // clássico do padrão: o leitor de tela anuncia uma opção fantasma. As
      // outras stacks já mediam isto; esta não, e foi assim que o mesmo defeito
      // sobreviveu numa delas até o axe reprovar.
      await expect(field).not.toHaveAttribute("aria-activedescendant");
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["visual.item6"],
    docs: {
      source: { transform: comboboxDisabledSource },
      description: {
        story:
          "Campo indisponível: nada recebe foco, a lista não abre e a caixa inteira esmaece.",
      },
    },
  },
  render: () => <SingleCountryCombobox disabled />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;

    await step("O campo não recebe foco nem abre a lista", async () => {
      await expect(field).toBeDisabled();
      await userEvent.click(field, { pointerEventsCheck: 0 });
      await expect(field).toHaveAttribute("aria-expanded", "false");
      await expect(within(document.body).queryAllByRole("option")).toHaveLength(0);
    });

    await step("A caixa inteira mostra que está indisponível", async () => {
      // A caixa é do design system e não da lib: nenhum estado da raiz chega
      // até ela sozinho, e é este atributo que a folha lê.
      await expect(fieldBox(canvasElement)).toHaveAttribute("data-disabled");
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ["visual.item7"],
    docs: {
      source: { transform: comboboxInvalidSource },
      description: {
        story:
          "Validação reprovada: a borda da caixa passa a usar a cor de erro e o campo é anunciado como inválido.",
      },
    },
  },
  render: () => <SingleCountryCombobox invalid />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const box = fieldBox(canvasElement);

    await step("O campo é anunciado como inválido", async () => {
      await expect(field).toHaveAttribute("aria-invalid", "true");
    });

    await step("A borda da caixa muda por causa do atributo", async () => {
      // Medir a MUDANÇA, e não uma cor literal: a borda de erro vem de
      // `--destructive`, que troca com o tema, e cravar o valor faria a
      // asserção reprovar em toda marca nova em vez de acusar o defeito.
      //
      // `noTransicao` porque a caixa tem `transition: border-color 120ms`: ler
      // logo depois do `removeAttribute` pega o PRIMEIRO QUADRO da transição,
      // quando o valor interpolado ainda é a cor de origem — e as duas leituras
      // saem idênticas com o componente correto. Medido: 147,62,47 em t=0 e
      // 152,137,113 depois de assentar.
      const withInvalid = noTransicao(box, () => getComputedStyle(box).borderColor);
      field.removeAttribute("aria-invalid");
      const withoutInvalid = noTransicao(box, () => getComputedStyle(box).borderColor);
      field.setAttribute("aria-invalid", "true");
      await expect(withInvalid).not.toBe(withoutInvalid);
    });
  },
};

export const FocusVisible: Story = {
  parameters: {
    covers: ["accessibility.item7"],
    docs: {
      description: {
        story:
          "O anel de foco envolve a caixa inteira — chips e texto juntos —, porque quem tem foco de verdade é sempre o campo de texto.",
      },
    },
  },
  render: () => <SingleCountryCombobox />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("combobox") as HTMLInputElement;
    const box = fieldBox(canvasElement);

    await step("Focar o texto acende o anel na CAIXA, não no input", async () => {
      // O anel mora no contêiner por `:focus-within`. Um anel só no input
      // deixaria os chips visualmente fora do campo que eles habitam.
      await expect(focusRingChanged(field, box)).toBe(true);
    });

    await step("O input por dentro não desenha anel próprio", async () => {
      // Dois anéis concêntricos é o defeito que a folha evita ao apagar o
      // `outline` do input: se ele voltar, esta asserção acusa.
      await expect(getComputedStyle(field).outlineStyle).toBe("none");
      await expect(getComputedStyle(field).boxShadow).toBe("none");
    });
  },
};
