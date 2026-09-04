import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { DocsPageLayout } from "./DocsPageLayout";
import { DocsHeader } from "./DocsHeader";
import { DocsStates } from "./DocsStates";
import type { DocsNavGroup } from "../DocsNav";

/**
 * A moldura de toda docs page: barra lateral de navegação à esquerda, cabeçalho
 * e coluna de conteúdo à direita. Não é API da biblioteca — é o andaime.
 *
 * É o mais divergente dos dezesseis containers, e a divergência é de API de
 * framework: são cinco formas de expor DOIS slots, cabeçalho e conteúdo.
 *
 * - React:   `header: ReactNode` e `children: ReactNode`
 * - Vanilla: devolve um HANDLE — `{ root, headerSlot, main }` — e quem monta a
 *   página escreve dentro dele
 * - Vue:     `<slot name="header" />` e `<slot />`
 * - Svelte:  `header: Snippet` e `children: Snippet`
 * - Angular: `<ng-content select="[docsHeader]" />` e `[docsMain]`
 *
 * O Vanilla é o único imperativo do grupo: as outras quatro recebem o conteúdo
 * na chamada, e lá a função devolve nós para preencher depois.
 *
 * O `<main>` aponta para o `<h1>` do cabeçalho por `aria-labelledby`, usando o
 * `DOCS_PAGE_TITLE_ID` compartilhado — é por isso que o header não é opcional.
 */

const GRUPOS: DocsNavGroup[] = [
  {
    label: "Visão geral",
    sections: [
      { id: "demonstracao", label: "Demonstração" },
      { id: "anatomia", label: "Anatomia" },
    ],
  },
  {
    label: "Referência",
    sections: [
      { id: "estados", label: "Estados" },
      { id: "propriedades", label: "Propriedades" },
      { id: "tokens", label: "Tokens" },
    ],
  },
];

const meta = {
  title: "Doc Components/DocsPageLayout",
  component: DocsPageLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Moldura da docs page: navegação lateral, cabeçalho e coluna de conteúdo. " +
          "Recebe os grupos do menu e os dois slots que formam a página.",
      },
    },
  },
  argTypes: {
    navGroups: { control: "object", description: "Grupos do menu lateral, cada um com suas seções." },
    activeSection: { control: "text", description: "Id da seção destacada no menu." },
    componentSlug: { control: "text", description: "Liga o rastreio automático por `data-track*`." },
    header: { control: false, description: "Slot do cabeçalho. Traz o `<h1>` que o `<main>` referencia." },
    children: { control: false, description: "Slot da coluna de conteúdo." },
  },
  args: {
    navGroups: GRUPOS,
    activeSection: "estados",
    componentSlug: "button",
    header: (
      <DocsHeader
        title="Button"
        description="Aciona uma ação. É o controle mais usado do design system."
        category="Formulário"
        type="Primitivo"
      />
    ),
    children: (
      <DocsStates
        title="Estados"
        cols={{ state: "Estado", trigger: "Gatilho", behavior: "Comportamento" }}
        items={[
          { label: "Padrão", trigger: "Nenhum", behavior: "Fundo --primary." },
          { label: "Foco", trigger: ":focus-visible", behavior: "Anel de 2px em --ring." },
        ]}
      />
    ),
  },
} satisfies Meta<typeof DocsPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Um grupo só: a barra lateral não ganha separador por ter uma seção apenas. */
export const SingleNavGroup: Story = {
  args: { navGroups: [GRUPOS[0]], activeSection: "demonstracao" },
  parameters: { controls: { disable: true } },
};

/**
 * O contrato que amarra as duas metades: o `<main>` referencia o `<h1>` do
 * cabeçalho por `aria-labelledby`. Se as pontas divergirem nada quebra na tela —
 * o leitor de tela é que passa a anunciar "principal" sem dizer de que página.
 */
export const MainIsLabelledByTheHeading: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const main = canvasElement.querySelector("main");
    await expect(main).not.toBeNull();
    const alvo = main?.getAttribute("aria-labelledby");
    await expect(alvo).toBeTruthy();
    await expect(canvasElement.querySelector("#" + alvo)?.tagName.toLowerCase()).toBe("h1");
  },
};
