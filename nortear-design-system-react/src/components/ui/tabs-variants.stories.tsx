import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, waitFor } from "storybook/test";
import {
  boxDoTrackDesvios,
  trackMeasureCrescimento,
} from "@shared/testing/tabs-probe";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { tabsLineSource, tabsSource, tabsVerticalSource } from "./tabs.source";

const meta: Meta = {
  title: "UI/Tabs/Variants",
  tags: ["navigation"],
  component: Tabs,
  parameters: {
    layout: "padded",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tabsSource },
      description: {
        component:
          "Estilo da lista e direção da navegação. A variante decide se há um trilho com fundo " +
          "sob a fileira ou apenas uma linha marcando a aba ativa; a orientação decide o layout " +
          "e quais setas percorrem as abas.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const lista = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs-list"]')!;

const raiz = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs"]')!;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ["visual.item1", "accessibility.item2"],
    docs: {
      description: {
        story:
          "Variante padrão — trilho com fundo sob a fileira e a aba ativa em relevo por cima.",
      },
    },
  },
  render: () => (
    <Tabs defaultValue="overview" className="nds-w-lg">
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = lista(canvasElement);

    await step("Três abas, a primeira ativa na montagem", async () => {
      // Esta story não interage: é ela que fixa o quadro de referência visual
      // do componente, com o estado inicial intacto.
      await expect(canvas.getAllByRole("tab")).toHaveLength(3);
      await expect(canvas.getByRole("tab", { name: "Visão geral" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
      await expect(l).toHaveAttribute("aria-label", "Seções do componente");
    });

    await step("A variante padrão chega ao markup", async () => {
      await expect(l).toHaveAttribute("data-variant", "default");
    });

    await step("O trilho tem fundo próprio", async () => {
      // É o que distingue esta variante da `line`: um fundo sob a fileira
      // inteira, com a aba ativa em relevo por cima.
      const fundo = getComputedStyle(l).backgroundColor;
      await expect(fundo).not.toBe("rgba(0, 0, 0, 0)");
      await expect(fundo).not.toBe("transparent");
    });

    await step("A aba ativa se destaca por fundo, não só por cor de texto", async () => {
      // Critério 1.4.1 na prática: o estado ativo não pode depender de matiz,
      // senão quem não distingue cores perde a informação.
      const ativa = canvas.getByRole("tab", { name: "Visão geral" });
      const inativa = canvas.getByRole("tab", { name: "Exemplos" });
      await expect(getComputedStyle(ativa).backgroundColor).not.toBe(
        getComputedStyle(inativa).backgroundColor
      );
    });

    await step("A caixa do trilho é resultado do respiro, não medida cravada", async () => {
      // Ler a altura UMA vez não distingue as duas coisas: respiro e `height`
      // cravada devolvem os mesmos 36px. Dobrar a fonte da raiz também não
      // bastava — `--size-lg` é declarado em `rem` e dobrava junto. O que
      // separa gaiola de resultado é EMPURRAR o conteúdo para além da caixa:
      // com altura cravada o trilho fica parado e o gatilho vaza para fora do
      // fundo arredondado. O colhedor devolve a fonte e o gatilho ao original.
      const m = trackMeasureCrescimento(canvasElement);
      await expect(boxDoTrackDesvios(m), JSON.stringify(m)).toEqual([]);
    });
  },
};

// ─── Line ─────────────────────────────────────────────────────────────────────

export const Line: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A variante mora na LISTA, e nenhum control deste arquivo a descreve.
      source: { transform: tabsLineSource },
      description: {
        story:
          "Variante de linha — sem trilho, apenas um traço sob a aba ativa. Útil para " +
          "sub-navegação dentro de uma página, onde o trilho competiria com o conteúdo.",
      },
    },
  },
  render: () => (
    <Tabs defaultValue="overview" className="nds-w-lg">
      <TabsList aria-label="Seções do componente" variant="line">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = lista(canvasElement);

    await step("A variante de linha chega ao markup", async () => {
      await expect(l).toHaveAttribute("data-variant", "line");
    });

    await step("O trilho desaparece", async () => {
      // O seletor do CSS é `[data-variant="line"]`: se o atributo não chegasse,
      // esta asserção pegaria o fundo da variante padrão.
      await expect(getComputedStyle(l).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    });

    await step("A linha marca a aba ativa e some das inativas", async () => {
      // A linha é um pseudo-elemento com opacidade — procurar um nó no DOM não
      // acharia nada. A opacidade tem transição, daí o `waitFor`.
      const ativa = canvas.getByRole("tab", { name: "Visão geral" });
      const inativa = canvas.getByRole("tab", { name: "Exemplos" });
      await waitFor(() =>
        expect(getComputedStyle(ativa, "::after").opacity).toBe("1")
      );
      await expect(getComputedStyle(inativa, "::after").opacity).toBe("0");
    });
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // A orientação é afirmada no `render`, sem control que a descreva.
      source: { transform: tabsVerticalSource },
      description: {
        story:
          "Orientação vertical — a fileira de abas vira uma coluna à esquerda e o painel ocupa " +
          "o espaço ao lado. As setas de cima e de baixo passam a ser as que percorrem as abas.",
      },
    },
  },
  render: () => (
    <Tabs
      orientation="vertical"
      defaultValue="overview"
      className="nds-w-lg"
    >
      <TabsList aria-label="Seções do componente">
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="properties">Propriedades</TabsTrigger>
        <TabsTrigger value="examples">Exemplos</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
      <TabsContent value="properties">Lista de propriedades.</TabsContent>
      <TabsContent value="examples">Exemplos de uso.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("A orientação chega à raiz e ao tablist", async () => {
      await expect(raiz(canvasElement)).toHaveAttribute(
        "data-orientation",
        "vertical"
      );
      // `aria-orientation` só é escrito no caso vertical: no horizontal ele é o
      // padrão implícito do papel, e repeti-lo é ruído para o leitor de tela.
      await expect(lista(canvasElement)).toHaveAttribute(
        "aria-orientation",
        "vertical"
      );
    });

    await step("As abas ficam empilhadas", async () => {
      const esquerdas = new Set(
        canvas
          .getAllByRole("tab")
          .map((a) => Math.round(a.getBoundingClientRect().left))
      );
      await expect(esquerdas.size).toBe(1);
    });

    await step("O painel fica ao lado da lista, não abaixo", async () => {
      const boxList = lista(canvasElement).getBoundingClientRect();
      const boxPanel = canvas.getByRole("tabpanel").getBoundingClientRect();
      await expect(boxPanel.left).toBeGreaterThanOrEqual(boxList.right);
    });
  },
};
