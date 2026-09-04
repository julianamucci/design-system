import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createDocsVariants, type DocsVariantsProps } from './DocsVariants';
import { createButton } from '@/components/ui/button';

/**
 * Container de seção das docs pages. Não é API da biblioteca — ninguém instala
 * um DocsVariants; é o andaime com que a documentação é escrita.
 *
 * Cada item traz nome, descrição, código opcional e o PREVIEW, e é no preview
 * que as cinco stacks divergem de verdade — divergência de API de framework,
 * não deriva a corrigir. São cinco respostas à mesma pergunta, "conteúdo por
 * item numa lista dirigida a dados":
 *
 * - Vanilla: `previewFactory: () => HTMLElement` dentro do item
 * - React:   `preview: React.ReactNode` dentro do item
 * - Vue:     slot nomeado e indexado — `variant-preview-0`, `variant-preview-1`
 * - Svelte:  `preview: Snippet` dentro do item
 * - Angular: `preview: TemplateRef`, declarado com `<ng-template #ref>`
 *
 * O `id` é prop com padrão `'variantes'`, e é ele que o DocsCompositions troca
 * por `'composicoes'` ao reusar este mesmo container.
 */

const meta: Meta<DocsVariantsProps> = {
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
    items: { control: false, description: 'Uma entrada por variante. O preview é a fábrica desta stack.' },
    id: { control: 'text', description: 'Âncora da seção. Padrão `variantes`.' },
    componentSlug: { control: 'text', description: 'Opcional. Slug para o `data-track-id` do toggle de código.' },
  },
  args: {
    title: 'Variantes',
    note: '',
    id: 'variantes',
    componentSlug: 'button',
    items: [
      {
        name: 'default',
        description: 'A ação primária do bloco. Uma por tela — duas competem, e a pessoa para para escolher.',
        code: '<Button>Salvar</Button>',
        previewFactory: () => createButton({ children: 'Salvar' }),
      },
      {
        name: 'outline',
        description: 'Ação secundária que ainda precisa de contorno. Convive com a primária sem disputá-la.',
        code: '<Button variant="outline">Cancelar</Button>',
        previewFactory: () => createButton({ variant: 'outline', children: 'Cancelar' }),
      },
      {
        name: 'destructive',
        description: 'Só para o que não tem volta. Dentro de um AlertDialog, nunca solta na tela.',
        code: '<Button variant="destructive">Excluir</Button>',
        previewFactory: () => createButton({ variant: 'destructive', children: 'Excluir' }),
      },
    ],
  },
  render: (args) => createDocsVariants(args),
};

export default meta;
type Story = StoryObj<DocsVariantsProps>;

export const Playground: Story = {};

/** Com nota: ela abre a seção quando há uma regra que vale para todas as variantes. */
export const WithNote: Story = {
  args: { note: 'Toda variante herda o mesmo calço de altura — o que muda é peso visual, não tamanho.' },
  parameters: { controls: { disable: true } },
};

/** Sem código: o item aceita só preview, e a seção não abre bloco vazio por isso. */
export const WithoutCode: Story = {
  args: {
    items: [
      {
        name: 'ghost',
        description: 'Sem fundo e sem contorno até o hover. Para ação terciária dentro de barra densa.',
        previewFactory: () => createButton({ variant: 'ghost', children: 'Editar' }),
      },
    ],
  },
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
