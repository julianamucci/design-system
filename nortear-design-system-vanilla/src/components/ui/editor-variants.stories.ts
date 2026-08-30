import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createEditor } from './editor';
import { ADVANCED_CONTENT, BASIC_CONTENT, LABELS, fluidBox } from './editor.fixtures';
import { editorSource, editorSourceWith } from './editor.source';

const meta: Meta = {
  title: 'Primitives/Form/Editor/Variants',
  tags: ['form'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // O piso do arquivo: story sem transform própria cairia no

      // `outerHTML` — o componente inteiro já desenhado, em vez da chamada.

      source: { transform: editorSource },
      description: {
        component:
          'O conjunto muda o que a barra expõe, não o que o documento aceita: '
          + 'texto colado com título continua com título no conjunto básico.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Os nomes dos blocos que cada conjunto expõe, na ordem em que a barra os monta.
 *
 * A contiguidade por assunto é contrato: com "linha divisória", "desfazer" e o
 * botão de tabela caindo entre o de inserir imagem e os de editá-la, a leitura
 * da barra sugeria que aqueles quatro pertenciam à tabela.
 */
function toolbarActions(root: HTMLElement): string[] {
  const toolbar = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
  return Array.from(toolbar.querySelectorAll<HTMLElement>('[data-action]')).map(
    (button) => button.dataset.action ?? '',
  );
}

export const Basic: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: editorSourceWith({ preset: 'basic', content: BASIC_CONTENT }) } },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: BASIC_CONTENT,
        preset: 'basic',
        labels: LABELS,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as HTMLElement;

    await step('O conjunto básico expõe ênfase, listas, link e desfazer', async () => {
      for (const name of [
        LABELS.actions.bold,
        LABELS.actions.italic,
        LABELS.actions.strike,
        LABELS.actions.bulletList,
        LABELS.actions.orderedList,
        LABELS.actions.link,
        LABELS.actions.undo,
        LABELS.actions.formula,
      ]) {
        await expect(canvas.getByRole('button', { name })).toBeInTheDocument();
      }
    });

    await step('E não expõe o que é do conjunto avançado', async () => {
      // Não é economia de espaço: trinta botões num campo de comentário são
      // ruído, e a maioria nunca é usada.
      for (const name of [
        LABELS.actions.h1,
        LABELS.actions.table,
        LABELS.actions.image,
        LABELS.actions.blockquote,
        LABELS.actions.alignCenter,
      ]) {
        await expect(canvas.queryByRole('button', { name })).toBeNull();
      }
    });

    await step('O documento continua aceitando o que a barra não mostra', async () => {
      // A lista veio no conteúdo inicial e sobrevive: os dois conjuntos usam a
      // MESMA lista de extensões.
      await expect(root.querySelectorAll('.ProseMirror ul li')).toHaveLength(2);
    });
  },
};

export const Advanced: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      source: { transform: editorSourceWith({ preset: 'advanced', content: ADVANCED_CONTENT }) },
    },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: ADVANCED_CONTENT,
        preset: 'advanced',
        labels: LABELS,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as HTMLElement;

    await step('Os blocos vêm na ordem, e cada um se anuncia', async () => {
      for (const name of [
        LABELS.groups.marks,
        LABELS.groups.headings,
        LABELS.groups.align,
        LABELS.groups.lists,
        LABELS.groups.blocks,
      ]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
      const toolbar = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
      await expect(
        toolbar.querySelectorAll('.nds-editor-toolbar-separator').length,
      ).toBeGreaterThan(0);
    });

    await step('Tudo que é de imagem fica JUNTO, sem outro assunto no meio', async () => {
      const actions = toolbarActions(root);
      const imageIndex = actions.indexOf('image');
      await expect(actions.slice(imageIndex, imageIndex + 5)).toEqual([
        'image',
        'imageAlt',
        'imageSmaller',
        'imageLarger',
        'imageNatural',
      ]);
      // O mesmo para a tabela: inserir e editar são o mesmo assunto.
      const tableIndex = actions.indexOf('table');
      await expect(actions.slice(tableIndex, tableIndex + 3)).toEqual([
        'table',
        'rowAfter',
        'columnAfter',
      ]);
    });

    await step('A barra QUEBRA em linhas, e nada fica fora da vista', async () => {
      const toolbar = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
      await expect(getComputedStyle(toolbar).flexWrap).toBe('wrap');
      // Sem rolagem horizontal: com ela, o botão contextual que acabou de
      // aparecer nascia além da borda, e a única pista de que existia era
      // arrastar a barra para o lado.
      await expect(toolbar.scrollWidth).toBe(toolbar.clientWidth);
    });

    await step('O conteúdo inicial chega desenhado', async () => {
      await expect(root.querySelector('.ProseMirror h2')).toBeInTheDocument();
      await expect(root.querySelector('.ProseMirror mark')).toBeInTheDocument();
      await expect(root.querySelector('.ProseMirror a')).toHaveAttribute(
        'href',
        'https://exemplo.com',
      );
    });
  },
};
