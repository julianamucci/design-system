import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import DocsHeader from './DocsHeader.vue';
import { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';

/**
 * Primeiro membro de `Doc Components`, a seção dos containers com que as docs
 * pages são escritas. Eles não são API da biblioteca: ninguém instala um
 * `DocsHeader`. São o andaime da documentação, e ficam fora de `Components`
 * para a árvore não prometer contrato onde não há.
 *
 * O que esta story cobra, e que nenhum portão via: o `<h1>` carrega
 * `DOCS_PAGE_TITLE_ID`. O `<main>` do `DocsPageLayout` aponta para esse id em
 * `aria-labelledby`, então perder o id não quebra nada visível — só faz o leitor
 * de tela anunciar "principal" sem dizer de que página.
 */

const meta = {
  title: 'Doc Components/DocsHeader',
  component: DocsHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Cabeçalho de docs page: par de badges (categoria e tipo), seletor de idioma, título e descrição. ' +
          'Monta o `<h1>` que o `<main>` do DocsPageLayout referencia por `aria-labelledby`.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da página. Vira o `<h1>`.' },
    description: { control: 'text', description: 'Linha de apoio abaixo do título.' },
    category: { control: 'text', description: 'Badge da esquerda — a categoria da sidebar.' },
    type: { control: 'text', description: 'Badge seguinte — o tipo do componente.' },
    installNote: {
      control: 'text',
      description: 'Opcional. Sai como `<code>`, e é sanitizada com DOMPurify no call site.',
    },
  },
  args: {
    title: 'Button',
    description: 'Aciona uma ação. É o controle mais usado do design system, e o mais copiado.',
    category: 'Formulário',
    type: 'Primitivo',
    installNote: '',
  },
} satisfies Meta<typeof DocsHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithInstallNote: Story = {
  args: { installNote: 'npm i @nortear/ds-core' },
  parameters: { controls: { disable: true } },
};

/**
 * Descrição longa: o container limita a `--max-w-prose`, e é isso que impede a
 * linha de apoio de virar uma faixa de ponta a ponta em telas largas.
 */
export const LongDescription: Story = {
  args: {
    description:
      'Aciona uma ação imediata no lugar onde está — enviar um formulário, abrir um painel, ' +
      'confirmar uma escolha. Não navega: para levar a pessoa a outro endereço existe o link, ' +
      'que o leitor de tela anuncia de outro jeito e que o navegador deixa abrir em nova aba.',
  },
  parameters: { controls: { disable: true } },
};

/**
 * O contrato de acessibilidade, verificado: o `<h1>` tem o id que o `<main>`
 * referencia. Sem ele o `aria-labelledby` do layout aponta para o vazio.
 */
export const TitleCarriesTheLandmarkId: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const h1 = canvas.getByRole('heading', { level: 1 });
    await expect(h1).toHaveAttribute('id', DOCS_PAGE_TITLE_ID);
  },
};
