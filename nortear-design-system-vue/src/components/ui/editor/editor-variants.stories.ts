import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Editor } from './index';
import { LABELS } from './editor.fixtures';
import { editorAdvancedSource, editorBasicSource } from './editor.source';

const meta = {
  title: 'Components/Form/Editor/Variants',
  component: Editor,
  tags: ['form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%` e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: editorBasicSource },
      description: {
        component:
          'Os dois conjuntos da barra. O conjunto muda o que a barra expõe, não o que o documento aceita: texto colado com título continua com título no conjunto básico.',
      },
    },
  },
  args: { labels: LABELS },
  argTypes: {
    labels: {
      // Fixado pela story: é um objeto de trinta e sete nomes acessíveis, e um
      // control de objeto no painel não ensina nada sobre ele.
      control: false,
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão e dos campos de entrada.',
      table: { type: { summary: 'EditorLabels' }, defaultValue: { summary: '—' } },
    },
  },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A ordem dos blocos do conjunto avançado — contiguidade por assunto. */
const ADVANCED_ORDER = [
  'bold', 'italic', 'underline', 'strike', 'code', 'highlight',
  'h1', 'h2', 'h3',
  'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
  'bulletList', 'orderedList', 'taskList',
  'blockquote', 'codeBlock',
  'link', 'horizontalRule', 'undo', 'redo',
  'image', 'imageAlt', 'imageSmaller', 'imageLarger', 'imageNatural',
  'table', 'rowAfter', 'columnAfter', 'deleteRow', 'deleteColumn', 'headerRow', 'deleteTable',
  'formula',
];

const BASIC_ORDER = [
  'bold', 'italic', 'strike',
  'bulletList', 'orderedList',
  'link', 'undo', 'redo',
  'formula',
];

/** Os nomes de ação da barra, na ordem em que ela os desenha. */
function toolbarOrder(canvasElement: HTMLElement): string[] {
  const toolbar = canvasElement.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
  return Array.from(
    toolbar.querySelectorAll<HTMLElement>('[data-action], [data-value]'),
  ).map((button) => button.dataset.action ?? button.dataset.value ?? '');
}

/** Quantas divisórias a barra desenha entre um assunto e o seguinte. */
function separatorCount(canvasElement: HTMLElement): number {
  return canvasElement.querySelectorAll('.nds-editor-toolbar-separator').length;
}

export const Basic: Story = {
  parameters: { covers: ['visual.item1'] },
  render: (args) => ({
    components: { Editor },
    setup() {
      return {
        args,
        content:
          '<p>Comentário curto, com ênfase e uma lista.</p><ul><li>primeiro</li><li>segundo</li></ul>',
      };
    },
    template: `
      <div class="nds-w-full">
        <Editor v-bind="args" :content="content" preset="basic" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('visual.item1 — três blocos e a fórmula, na ordem, com divisória entre eles', async () => {
      await expect(toolbarOrder(canvasElement)).toEqual(BASIC_ORDER);
      // Um separador a menos que o número de blocos: ele fica ENTRE assuntos.
      await expect(separatorCount(canvasElement)).toBe(3);
    });

    await step('O conjunto básico não expõe título, alinhamento nem tabela', async () => {
      await expect(canvas.queryByRole('group', { name: LABELS.groups.headings })).toBeNull();
      await expect(canvas.queryByRole('group', { name: LABELS.groups.align })).toBeNull();
      await expect(canvas.queryByRole('button', { name: LABELS.actions.table })).toBeNull();
    });

    await step('E o que ele expõe carrega nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: LABELS.groups.marks })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: LABELS.groups.lists })).toBeInTheDocument();
    });
  },
};

export const Advanced: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: editorAdvancedSource } },
  },
  render: (args) => ({
    components: { Editor },
    setup() {
      return {
        args,
        content:
          '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>',
      };
    },
    template: `
      <div class="nds-w-full">
        <Editor v-bind="args" :content="content" preset="advanced" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('visual.item1 — os blocos na ordem, com o assunto contíguo', async () => {
      // Tudo que é de imagem fica JUNTO, e o mesmo vale para a tabela: antes,
      // "linha divisória" e "desfazer" caíam ENTRE inserir imagem e editá-la.
      await expect(toolbarOrder(canvasElement)).toEqual(ADVANCED_ORDER);
      await expect(separatorCount(canvasElement)).toBe(8);
    });

    await step('Cada bloco de alternadores tem nome próprio', async () => {
      for (const name of [
        LABELS.groups.marks,
        LABELS.groups.headings,
        LABELS.groups.align,
        LABELS.groups.lists,
        LABELS.groups.blocks,
      ]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
    });

    await step('O destaque do texto usa o realce do sistema, não o amarelo do navegador', async () => {
      const highlight = canvasElement.querySelector('mark') as HTMLElement;
      await expect(highlight).toBeInTheDocument();
      await expect(getComputedStyle(highlight).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });
  },
};
