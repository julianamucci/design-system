import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import DocsVariants from './DocsVariants.vue';
import { Button } from '@/components/ui/button';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsVariants; é o andaime com que a documentação é escrita.
 *
 * Cada item traz nome, descrição, código opcional e o PREVIEW, e é no preview
 * que as cinco stacks divergem de verdade — divergência de API de framework,
 * não deriva a corrigir. São cinco respostas à mesma pergunta, "conteúdo por
 * item numa lista dirigida a dados":
 *
 * - Vue:     slot nomeado e INDEXADO — `variant-preview-0`, `variant-preview-1`
 * - Vanilla: `previewFactory: () => HTMLElement` dentro do item
 * - React:   `preview: React.ReactNode` dentro do item
 * - Svelte:  `preview: Snippet` dentro do item
 * - Angular: `preview: TemplateRef`, declarado com `<ng-template #ref>`
 *
 * O índice do slot é o que amarra preview a item nesta stack, e é a parte que
 * mais erra na cópia: acrescentar uma variante no meio da lista sem renumerar
 * os slots põe o preview errado sob o nome certo, sem erro nenhum.
 *
 * O `id` é prop com padrão `'variantes'`, e é ele que o DocsCompositions troca
 * por `'composicoes'` ao reusar este mesmo container.
 */

const ITENS = [
  {
    name: 'default',
    description: 'A ação primária do bloco. Uma por tela — duas competem, e a pessoa para para escolher.',
    code: '<Button>Salvar</Button>',
  },
  {
    name: 'outline',
    description: 'Ação secundária que ainda precisa de contorno. Convive com a primária sem disputá-la.',
    code: '<Button variant="outline">Cancelar</Button>',
  },
  {
    name: 'destructive',
    description: 'Só para o que não tem volta. Dentro de um AlertDialog, nunca solta na tela.',
    code: '<Button variant="destructive">Excluir</Button>',
  },
];

/**
 * Anotado, e não inferido por `satisfies`: os tipos de item vivem dentro do
 * SFC, e um `meta` exportado com tipo inferido tenta nomeá-los de fora —
 * `TS4023: cannot be named`. A anotação corta a inferência antes disso.
 */
const meta: Meta<typeof DocsVariants> = {
  title: 'Doc Components/DocsVariants',
  tags: ['autodocs'],
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
  },
  args: {
    title: 'Variantes',
    note: '',
    id: 'variantes',
    componentSlug: 'button',
    items: ITENS,
  },
  render: (args) => ({
    components: { DocsVariants, Button },
    setup: () => ({ args }),
    template: `<DocsVariants v-bind="args">
      <template #variant-preview-0><Button>Salvar</Button></template>
      <template #variant-preview-1><Button variant="outline">Cancelar</Button></template>
      <template #variant-preview-2><Button variant="destructive">Excluir</Button></template>
    </DocsVariants>`,
  }),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Com nota: ela abre a seção quando há uma regra que vale para todas as variantes. */
export const WithNote: Story = {
  args: { note: 'Toda variante herda o mesmo calço de altura — o que muda é peso visual, não tamanho.' },
  parameters: { controls: { disable: true } },
};

/**
 * Sem código, e com um item só: repare que o slot volta a ser
 * `variant-preview-0`. O índice acompanha a lista, não o nome da variante.
 */
export const WithoutCode: Story = {
  parameters: { controls: { disable: true } },
  args: {
    items: [
      {
        name: 'ghost',
        description: 'Sem fundo e sem contorno até o hover. Para ação terciária dentro de barra densa.',
      },
    ],
  },
  render: (args) => ({
    components: { DocsVariants, Button },
    setup: () => ({ args }),
    template: `<DocsVariants v-bind="args">
      <template #variant-preview-0><Button variant="ghost">Editar</Button></template>
    </DocsVariants>`,
  }),
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
