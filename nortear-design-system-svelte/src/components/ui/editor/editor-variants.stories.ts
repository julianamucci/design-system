import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Editor } from './index';
import { editorAdvancedSource, editorBasicSource } from './editor.source';
import { CONTENTS, editorLabels, editorRoot } from './editor.fixtures';

const meta: Meta<typeof Editor> = {
  title: 'UI/Editor/Variants',
  component: Editor,
  tags: ['form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até a largura do texto.
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Conjuntos do Editor: básico para texto de formulário e comentário, avançado para conteúdo longo. O conjunto muda o que a barra expõe, não o que o documento aceita.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Editor>;

/** Quantos blocos a barra tem: um separador entre cada dois. */
function separators(root: HTMLElement): number {
  return root.querySelectorAll('.nds-editor-toolbar-separator').length;
}

/** Os botões que não alternam, na ordem em que aparecem na barra. */
function actionOrder(root: HTMLElement): (string | undefined)[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>('[data-slot="editor-toolbar"] [data-action]'),
  ).map((b) => b.dataset.action);
}

export const Basic: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      source: { transform: editorBasicSource },
      description: {
        story:
          'Ênfase, listas, link e desfazer. Cobre texto de formulário, comentário e descrição — trinta botões num campo de comentário são ruído.',
      },
    },
  },
  render: () => ({
    Component: Editor,
    props: {
      content: CONTENTS.basic,
      preset: 'basic',
      labels: editorLabels(),
      class: 'nds-w-full',
    },
  }),
  play: async ({ canvasElement, step }) => {
    // O idioma CORRENTE, e não pt-BR: o nome que a play procura tem de ser o
    // mesmo que a barra desenha.
    const L = editorLabels();
    const canvas = within(canvasElement);
    const root = editorRoot(canvasElement);

    await step('visual.item1 — três blocos e a fórmula, com divisória entre assuntos', async () => {
      await expect(canvas.getByRole('toolbar', { name: L.toolbar })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: L.groups.marks })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: L.groups.lists })).toBeInTheDocument();
      // marcas · listas · (link, desfazer, refazer) · fórmula
      await expect(separators(root)).toBe(3);
      await expect(actionOrder(root)).toEqual(['link', 'undo', 'redo', 'formula']);
    });

    await step('O conjunto básico não expõe título, imagem nem tabela', async () => {
      for (const name of [
        L.actions.h1,
        L.actions.image,
        L.actions.table,
        L.actions.alignCenter,
      ]) {
        await expect(canvas.queryByRole('button', { name })).toBeNull();
      }
    });

    await step('O documento aceita o que a barra não expõe', async () => {
      // Trocar de conjunto muda a barra, não o esquema: a lista que veio no
      // conteúdo continua sendo uma lista.
      await expect(root.querySelectorAll('li')).toHaveLength(2);
    });
  },
};

export const Advanced: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      source: { transform: editorAdvancedSource },
      description: {
        story:
          'Acrescenta sublinhado, código, destaque, títulos, alinhamento, lista de tarefas, citação, bloco de código, divisória, imagem, tabela e fórmula.',
      },
    },
  },
  render: () => ({
    Component: Editor,
    props: {
      content: CONTENTS.advanced,
      preset: 'advanced',
      labels: editorLabels(),
      class: 'nds-w-full',
    },
  }),
  play: async ({ canvasElement, step }) => {
    // O idioma CORRENTE, e não pt-BR: o nome que a play procura tem de ser o
    // mesmo que a barra desenha.
    const L = editorLabels();
    const canvas = within(canvasElement);
    const root = editorRoot(canvasElement);

    await step('visual.item1 — os cinco blocos de alternadores têm nome próprio', async () => {
      for (const name of [
        L.groups.marks,
        L.groups.headings,
        L.groups.align,
        L.groups.lists,
        L.groups.blocks,
      ]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
      // Oito blocos do conjunto mais a fórmula: oito divisórias entre nove.
      await expect(separators(root)).toBe(8);
    });

    await step('Cada assunto fica JUNTO, sem nada de outro no meio', async () => {
      // Antes, "linha divisória", "desfazer" e o botão de tabela caíam entre o
      // de inserir imagem e os de editá-la — e a leitura da barra sugeria que
      // aqueles quatro pertenciam à tabela.
      await expect(actionOrder(root)).toEqual([
        'link',
        'horizontalRule',
        'undo',
        'redo',
        'image',
        'imageAlt',
        'imageSmaller',
        'imageLarger',
        'imageNatural',
        'table',
        'rowAfter',
        'columnAfter',
        'deleteRow',
        'deleteColumn',
        'headerRow',
        'deleteTable',
        'formula',
      ]);
    });

    await step('O destaque do conteúdo usa o realce do sistema', async () => {
      // O `<mark>` do navegador é amarelo fixo, que ignora o tema e ainda crava
      // o texto em preto.
      const mark = root.querySelector('mark') as HTMLElement;
      await expect(mark).toBeInTheDocument();
      await expect(getComputedStyle(mark).backgroundColor).not.toBe('rgb(255, 255, 0)');
    });
  },
};
