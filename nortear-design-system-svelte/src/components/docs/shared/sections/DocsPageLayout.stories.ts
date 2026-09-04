import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import DocsPageLayoutStory from './DocsPageLayoutStory.svelte';
import type { DocsNavGroup } from '../DocsNav.svelte';

/**
 * A moldura de toda docs page: barra lateral de navegação à esquerda, cabeçalho
 * e coluna de conteúdo à direita. Não é API da biblioteca — é o andaime.
 *
 * É o mais divergente dos dezesseis containers, e a divergência é de API de
 * framework: são cinco formas de expor DOIS slots, cabeçalho e conteúdo.
 *
 * - Svelte:  `header: Snippet` e `children: Snippet`
 * - Vanilla: devolve um HANDLE — `{ root, headerSlot, main }`
 * - React:   `header: ReactNode` e `children: ReactNode`
 * - Vue:     `<slot name="header" />` e o slot padrão
 * - Angular: `<ng-content select="[docsHeader]" />` e `[docsMain]`
 *
 * Aqui os dois papéis são props tipadas, então trocar um pelo outro reprova no
 * `svelte-check` — o que não acontece nas stacks em que os slots se distinguem
 * por string.
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

type DocsPageLayoutArgs = {
  navGroups: DocsNavGroup[];
  activeSection: string;
  componentSlug: string;
};

const meta: Meta<DocsPageLayoutArgs> = {
  title: 'Doc Components/DocsPageLayout',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Moldura da docs page: navegação lateral, cabeçalho e coluna de conteúdo. ' +
          'Recebe os grupos do menu e os dois snippets que formam a página.',
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
  render: (args) => ({ Component: DocsPageLayoutStory, props: args }),
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
