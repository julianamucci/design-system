import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { EditorComponent, type EditorHostElement } from './editor';
import { EDITOR_CONTENT, EDITOR_LABELS, waitUntil } from './editor.fixtures';
import { editorBasicSource, editorAdvancedSource } from './editor.source';

const meta: Meta = {
  title: 'Primitives/Form/Editor/Variants',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [EditorComponent] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
    docs: {
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

/** Os `data-action` da barra, na ordem do DOM. */
function actionNames(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-slot="editor-toolbar"] [data-action]'))
    .map((b) => b.dataset['action'] ?? '');
}

/** Os `data-value` dos alternadores, na ordem do DOM. */
function toggleValues(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-slot="editor-toolbar"] [data-value]'))
    .map((b) => b.dataset['value'] ?? '');
}

export const Basic: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: editorBasicSource } },
  },
  render: () => ({
    props: { labels: EDITOR_LABELS, content: EDITOR_CONTENT.basic },
    template: `
      <div class="nds-w-full">
        <nds-editor [labels]="labels" [content]="content" preset="basic" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);

    await step('O conjunto básico expõe marcas, listas, link, desfazer e fórmula', async () => {
      await expect(toggleValues(root)).toEqual([
        'bold', 'italic', 'strike',
        'bulletList', 'orderedList',
      ]);
      await expect(actionNames(root)).toEqual(['link', 'undo', 'redo', 'formula']);
    });

    await step('Os blocos que o básico não tem não aparecem', async () => {
      // Não é ausência de recurso: o documento continua aceitando título e
      // tabela. É a barra que não os oferece.
      await expect(
        canvas.queryByRole('group', { name: EDITOR_LABELS.groups.headings }),
      ).toBeNull();
      await expect(canvas.queryByRole('button', { name: EDITOR_LABELS.actions.table })).toBeNull();
      await expect(canvas.queryByRole('button', { name: EDITOR_LABELS.actions.image })).toBeNull();
    });

    await step('Cada bloco tem nome próprio, e a divisória é decoração', async () => {
      await expect(canvas.getByRole('group', { name: EDITOR_LABELS.groups.marks })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: EDITOR_LABELS.groups.lists })).toBeInTheDocument();
      const separators = root.querySelectorAll('.nds-editor-toolbar-separator');
      await expect(separators.length).toBeGreaterThan(0);
      for (const d of separators) await expect(d).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const Advanced: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: editorAdvancedSource } },
  },
  render: () => ({
    props: { labels: EDITOR_LABELS, content: EDITOR_CONTENT.advanced },
    template: `
      <div class="nds-w-full">
        <nds-editor [labels]="labels" [content]="content" preset="advanced" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);

    await step('Os cinco blocos de alternadores estão na ordem contratada', async () => {
      await expect(toggleValues(root)).toEqual([
        'bold', 'italic', 'underline', 'strike', 'code', 'highlight',
        'h1', 'h2', 'h3',
        'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
        'bulletList', 'orderedList', 'taskList',
        'blockquote', 'codeBlock',
      ]);
      for (const groupName of [
        EDITOR_LABELS.groups.marks,
        EDITOR_LABELS.groups.headings,
        EDITOR_LABELS.groups.align,
        EDITOR_LABELS.groups.lists,
        EDITOR_LABELS.groups.blocks,
      ]) {
        await expect(canvas.getByRole('group', { name: groupName })).toBeInTheDocument();
      }
    });

    await step('Tudo que é de imagem fica JUNTO, e tudo que é de tabela também', async () => {
      // Antes, "linha divisória", "desfazer" e o botão de tabela caíam entre o
      // de inserir imagem e os de editá-la — e a leitura da barra sugeria que
      // aqueles quatro pertenciam à tabela.
      await expect(actionNames(root)).toEqual([
        'link', 'horizontalRule', 'undo', 'redo',
        'image', 'imageAlt', 'imageSmaller', 'imageLarger', 'imageNatural',
        'table', 'rowAfter', 'columnAfter', 'deleteRow', 'deleteColumn', 'headerRow', 'deleteTable',
        'formula',
      ]);
    });

    await step('Os contextuais nascem escondidos — sem imagem e sem tabela sob o cursor', async () => {
      for (const node of ['image', 'table']) {
        const box = root.querySelector(
          `[data-slot="editor-toolbar-context"][data-node="${node}"]`,
        ) as HTMLElement;
        // `display` COMPUTADO: `display: contents` é declaração de autor e vence
        // o `[hidden] { display: none }` do navegador, então o atributo sozinho
        // não prova que a caixa sumiu.
        await expect(getComputedStyle(box).display).toBe('none');
      }
    });

    await step('O conteúdo do exemplo é desenhado pelo sistema', async () => {
      const markEl = root.querySelector('mark');
      const anchor = root.querySelector('a');
      await expect(markEl).toBeInTheDocument();
      await expect(anchor).toHaveAttribute('href', 'https://exemplo.com');
      // Sublinhado não é enfeite: sem ele a única pista de que há link é a cor,
      // e quem não distingue as duas cores fica sem pista (WCAG 1.4.1).
      await expect(getComputedStyle(anchor as HTMLElement).textDecorationLine).toContain('underline');
    });
  },
};
