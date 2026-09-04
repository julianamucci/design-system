import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsDocsPageLayout } from './DocsPageLayout';
import { NdsDocsHeader } from './DocsHeader';
import { NdsDocsStates } from './DocsStates';
import type { DocsNavGroup } from '../DocsNav';

/**
 * A moldura de toda docs page: barra lateral de navegação à esquerda, cabeçalho
 * e coluna de conteúdo à direita. Não é API da biblioteca — é o andaime.
 *
 * É o mais divergente dos dezesseis containers, e a divergência é de API de
 * framework: são cinco formas de expor DOIS slots, cabeçalho e conteúdo.
 *
 * - Angular: `<ng-content select="[docsHeader]" />` e `select="[docsMain]"`
 * - Vanilla: devolve um HANDLE — `{ root, headerSlot, main }`
 * - React:   `header: ReactNode` e `children: ReactNode`
 * - Vue:     `<slot name="header" />` e o slot padrão
 * - Svelte:  `header: Snippet` e `children: Snippet`
 *
 * Esta stack distingue os dois por ATRIBUTO no conteúdo projetado — o filho traz
 * `docsHeader` ou `docsMain` no próprio elemento. Esquecer o atributo não dá
 * erro: o conteúdo simplesmente não aparece, porque nenhum `ng-content` o
 * seleciona.
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
  cols: { state: 'Estado', trigger: 'Gatilho', behavior: 'Comportamento' },
  items: [
    { label: 'Padrão', trigger: 'Nenhum', behavior: 'Fundo --primary.' },
    { label: 'Foco', trigger: ':focus-visible', behavior: 'Anel de 2px em --ring.' },
  ],
};

type DocsPageLayoutArgs = {
  navGroups: DocsNavGroup[];
  activeSection: string;
  componentSlug: string;
};

const meta: Meta<DocsPageLayoutArgs> = {
  title: 'Doc Components/DocsPageLayout',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NdsDocsPageLayout, NdsDocsHeader, NdsDocsStates] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Moldura da docs page: navegação lateral, cabeçalho e coluna de conteúdo. ' +
          'Recebe os grupos do menu e o conteúdo por projeção, separado por atributo.',
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
    props: { ...args, estados: ESTADOS },
    template: `<nds-docs-page-layout
      [navGroups]="navGroups"
      [activeSection]="activeSection"
      [componentSlug]="componentSlug"
    >
      <nds-docs-header
        docsHeader
        title="Button"
        description="Aciona uma ação. É o controle mais usado do design system."
        category="Formulário"
        type="Primitivo"
      />
      <nds-docs-states
        docsMain
        title="Estados"
        [cols]="estados.cols"
        [items]="estados.items"
      />
    </nds-docs-page-layout>`,
  }),
};

export default meta;
type Story = StoryObj<DocsPageLayoutArgs>;

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
