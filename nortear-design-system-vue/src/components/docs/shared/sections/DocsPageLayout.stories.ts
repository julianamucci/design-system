import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import DocsPageLayout from './DocsPageLayout.vue';
import DocsHeader from './DocsHeader.vue';
import DocsStates from './DocsStates.vue';

/**
 * Declarado aqui, e não importado: nesta stack o tipo do grupo de navegação é
 * uma `interface Group` LOCAL do `DocsPageLayout.vue`, sem export. As outras
 * quatro o expõem — React e Vanilla de `DocsNav.ts(x)`, Svelte de um
 * `<script module>` do `DocsNav.svelte`, Angular de `DocsNav.ts`. É deriva, não
 * diferença de framework, e a story usa a forma estrutural até alguém unificar.
 */
type DocsNavGroup = {
  label: string;
  sections: { id: string; label: string }[];
};

/**
 * A moldura de toda docs page: barra lateral de navegação à esquerda, cabeçalho
 * e coluna de conteúdo à direita. Não é API da biblioteca — é o andaime.
 *
 * É o mais divergente dos dezesseis containers, e a divergência é de API de
 * framework: são cinco formas de expor DOIS slots, cabeçalho e conteúdo.
 *
 * - Vue:     `<slot name="header" />` e o slot padrão
 * - Vanilla: devolve um HANDLE — `{ root, headerSlot, main }`
 * - React:   `header: ReactNode` e `children: ReactNode`
 * - Svelte:  `header: Snippet` e `children: Snippet`
 * - Angular: `<ng-content select="[docsHeader]" />` e `[docsMain]`
 *
 * Repare que aqui os slots são NOMEADOS, e não indexados como no DocsVariants:
 * são dois papéis fixos, não uma lista. É a diferença entre um slot que erra por
 * digitação e um que erra por contagem.
 *
 * O `<main>` aponta para o `<h1>` do cabeçalho por `aria-labelledby`, usando o
 * `DOCS_PAGE_TITLE_ID` compartilhado — é por isso que o header não é opcional.
 */

const GRUPOS: DocsNavGroup[] = [
  {
    label: 'Visão geral',
    sections: [
      { id: 'demonstracao', label: 'Demonstração' },
      { id: 'anatomia', label: 'Anatomia' },
    ],
  },
  {
    label: 'Referência',
    sections: [
      { id: 'estados', label: 'Estados' },
      { id: 'propriedades', label: 'Propriedades' },
      { id: 'tokens', label: 'Tokens' },
    ],
  },
];

const ESTADOS = {
  title: 'Estados',
  cols: { state: 'Estado', trigger: 'Gatilho', behavior: 'Comportamento' },
  items: [
    { label: 'Padrão', trigger: 'Nenhum', behavior: 'Fundo --primary.' },
    { label: 'Foco', trigger: ':focus-visible', behavior: 'Anel de 2px em --ring.' },
  ],
};

/**
 * Anotado, e não inferido por `satisfies`: os tipos de item vivem dentro do
 * SFC, e um `meta` exportado com tipo inferido tenta nomeá-los de fora —
 * `TS4023: cannot be named`. A anotação corta a inferência antes disso.
 */
const meta: Meta<typeof DocsPageLayout> = {
  title: 'Doc Components/DocsPageLayout',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Moldura da docs page: navegação lateral, cabeçalho e coluna de conteúdo. ' +
          'Recebe os grupos do menu e os dois slots que formam a página.',
      },
    },
  },
  argTypes: {
    navGroups: { control: 'object', description: 'Grupos do menu lateral, cada um com suas seções.' },
    activeSection: { control: 'text', description: 'Id da seção destacada no menu.' },
    componentSlug: { control: 'text', description: 'Liga o rastreio automático por `data-track*`.' },
  },
  args: {
    navGroups: GRUPOS,
    activeSection: 'estados',
    componentSlug: 'button',
  },
  render: (args) => ({
    components: { DocsPageLayout, DocsHeader, DocsStates },
    setup: () => ({ args, estados: ESTADOS }),
    template: `<DocsPageLayout v-bind="args">
      <template #header>
        <DocsHeader
          title="Button"
          description="Aciona uma ação. É o controle mais usado do design system."
          category="Formulário"
          type="Primitivo"
        />
      </template>
      <DocsStates :title="estados.title" :cols="estados.cols" :items="estados.items" />
    </DocsPageLayout>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Um grupo só: a barra lateral não ganha separador por ter uma seção apenas. */
export const SingleNavGroup: Story = {
  args: { navGroups: [GRUPOS[0]], activeSection: 'demonstracao' },
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
    const main = canvasElement.querySelector('main');
    await expect(main).not.toBeNull();
    const alvo = main?.getAttribute('aria-labelledby');
    await expect(alvo).toBeTruthy();
    await expect(canvasElement.querySelector('#' + alvo)?.tagName.toLowerCase()).toBe('h1');
  },
};
