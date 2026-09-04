import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { NdsDocsVariantsStory } from './DocsVariantsStory';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsVariants; é o andaime com que a documentação é escrita.
 *
 * Cada item traz nome, descrição, código opcional e o PREVIEW, e é no preview
 * que as cinco stacks divergem de verdade — divergência de API de framework,
 * não deriva a corrigir. São cinco respostas à mesma pergunta, "conteúdo por
 * item numa lista dirigida a dados":
 *
 * - Angular: `preview: TemplateRef`, declarado com `<ng-template #ref>`
 * - Vanilla: `previewFactory: () => HTMLElement` dentro do item
 * - React:   `preview: React.ReactNode` dentro do item
 * - Vue:     slot nomeado e indexado — `variant-preview-0`, `variant-preview-1`
 * - Svelte:  `preview: Snippet` dentro do item
 *
 * A consequência prática está no arquivo ao lado: TemplateRef só nasce de um
 * `<ng-template>` recolhido por `viewChild`, então não cabe em `props` de story.
 * Daí a hospedeira `DocsVariantsStory` — o mesmo arranjo que toda docs page do
 * Angular já usa. Montar DOM à mão no lugar dela perderia change detection e os
 * inputs dos componentes demonstrados.
 */

type DocsVariantsArgs = {
  title: string;
  note: string;
  id: string;
  componentSlug: string;
  apenasUm: boolean;
};

const meta: Meta<DocsVariantsArgs> = {
  title: 'Doc Components/DocsVariants',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NdsDocsVariantsStory] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Lista de variantes: cada uma com nome, quando usar, o preview vivo e o código copiável. ' +
          'É a seção mais longa de uma docs page, e a que mais é lida.',
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Título da seção.' },
    note: { control: 'text', description: 'Opcional. Nota acima da lista.' },
    id: { control: 'text', description: 'Âncora da seção. Padrão `variantes`.' },
    componentSlug: { control: 'text', description: 'Opcional. Slug para o `data-track-id` do toggle de código.' },
    apenasUm: {
      control: 'boolean',
      description: 'Só da story: reduz a lista a um item sem código, para mostrar o caso mínimo.',
    },
  },
  args: {
    title: 'Variantes',
    note: '',
    id: 'variantes',
    componentSlug: 'button',
    apenasUm: false,
  },
  render: (args) => ({
    props: args,
    template: `<nds-docs-variants-story
      [title]="title"
      [note]="note"
      [id]="id"
      [componentSlug]="componentSlug"
      [apenasUm]="apenasUm"
    />`,
  }),
};

export default meta;
type Story = StoryObj<DocsVariantsArgs>;

export const Playground: Story = {};

/** Com nota: ela abre a seção quando há uma regra que vale para todas as variantes. */
export const WithNote: Story = {
  args: { note: 'Toda variante herda o mesmo calço de altura — o que muda é peso visual, não tamanho.' },
  parameters: { controls: { disable: true } },
};

/** Sem código: o item aceita só preview, e a seção não abre bloco vazio por isso. */
export const WithoutCode: Story = {
  args: { apenasUm: true },
  parameters: { controls: { disable: true } },
};

/**
 * A âncora, verificada — e aqui ela é PROP, não constante: trocar `id` é como o
 * DocsCompositions reusa este container sem duplicar a âncora na página.
 */
export const CarriesTheSectionAnchor: Story = {
  parameters: { controls: { disable: true } },
  play: async ({ canvasElement }) => {
    const secao = canvasElement.querySelector('#variantes');
    await expect(secao).not.toBeNull();
    await expect(secao?.tagName.toLowerCase()).toBe('section');
  },
};
