import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { Editor } from './editor';
import { editorSource, editorBasicSource, editorAdvancedSource } from './editor.source';
import {
  ADVANCED_CONTENT,
  BASIC_CONTENT,
  EditorCanvas,
  editorLabels,
  editorHandle,
} from './editor.fixtures';

const meta = {
  title: 'UI/Editor/Variants',
  component: Editor,
  tags: ['form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: editorSource },
      description: {
        component:
          'Os dois conjuntos da barra. O conjunto muda o que a barra expõe, não o que o documento aceita: texto colado com título continua com título no conjunto básico.',
      },
    },
  },
  // Os rótulos vêm do conteúdo compartilhado, no idioma corrente: `labels` é
  // prop OBRIGATÓRIA e por isso está nos args, mas quem a resolve na tela é o
  // canvas — args são avaliados na carga do módulo e não veem troca de idioma.
  args: { labels: editorLabels() },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Os nomes dos blocos, na ordem em que a barra os apresenta. */
function groupNames(toolbar: HTMLElement): Array<string | null> {
  return Array.from(toolbar.querySelectorAll('[role="group"]')).map((g) =>
    g.getAttribute('aria-label'),
  );
}

/** As ações que não alternam, na ordem do DOM — inclusive as contextuais. */
function actionOrder(toolbar: HTMLElement): Array<string | undefined> {
  return Array.from(toolbar.querySelectorAll<HTMLElement>('[data-action]')).map(
    (b) => b.dataset.action,
  );
}

/** As divisórias: filhas diretas da barra, e decorativas. */
function dividerCount(toolbar: HTMLElement): number {
  return toolbar.querySelectorAll(':scope > span[aria-hidden="true"]').length;
}

export const Basic: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: {
      source: { transform: editorBasicSource },
      description: {
        story:
          'Ênfase, listas, link e desfazer. Cobre texto de formulário, comentário e descrição.',
      },
    },
  },
  render: () => <EditorCanvas preset="basic" content={BASIC_CONTENT} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const L = editorLabels();
    const toolbar = canvas.getByRole('toolbar', { name: L.toolbar });

    await step('Só os blocos do conjunto básico, na ordem, com divisória entre eles', async () => {
      await expect(groupNames(toolbar)).toEqual([L.groups.marks, L.groups.lists]);
      await expect(actionOrder(toolbar)).toEqual(['link', 'undo', 'redo', 'formula']);
      // Quatro blocos, três divisórias: marcas · listas · ações · fórmula.
      await expect(dividerCount(toolbar)).toBe(3);
    });

    await step('O que o conjunto avançado acrescenta não está aqui', async () => {
      for (const name of [
        L.actions.h1,
        L.actions.table,
        L.actions.image,
        L.actions.highlight,
      ]) {
        await expect(canvas.queryByRole('button', { name })).toBeNull();
      }
    });

    await step('O conjunto muda a barra, não o que o documento aceita', async () => {
      const editor = editorHandle(canvasElement).editor!;
      // Sem botão de título na barra, e ainda assim o documento guarda um: é o
      // que acontece com texto colado de outra página.
      editor.chain().setTextSelection(2).setHeading({ level: 2 }).run();
      await expect(editor.getHTML()).toContain('<h2');
      editor.chain().setTextSelection(2).setParagraph().run();
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
  render: () => <EditorCanvas preset="advanced" content={ADVANCED_CONTENT} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const L = editorLabels();
    const toolbar = canvas.getByRole('toolbar', { name: L.toolbar });

    await step('Os blocos saem na ordem contratada, um por assunto', async () => {
      await expect(groupNames(toolbar)).toEqual([
        L.groups.marks,
        L.groups.headings,
        L.groups.align,
        L.groups.lists,
        L.groups.blocks,
      ]);
      // Tudo que é de imagem fica JUNTO, e tudo que é de tabela também. Antes,
      // "linha divisória", "desfazer" e o botão de tabela caíam ENTRE o de
      // inserir imagem e os de editá-la — e a leitura da barra sugeria que
      // aqueles quatro pertenciam à tabela.
      await expect(actionOrder(toolbar)).toEqual([
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
      // Nove blocos, oito divisórias.
      await expect(dividerCount(toolbar)).toBe(8);
    });

    await step('A barra QUEBRA em linhas, e nada fica fora da vista', async () => {
      await expect(getComputedStyle(toolbar).flexWrap).toBe('wrap');
      // Sem rolagem horizontal: com ela, o botão contextual que acabou de
      // aparecer nascia além da borda, e a única pista de que existia era
      // arrastar a barra para o lado.
      await expect(toolbar.scrollWidth).toBe(toolbar.clientWidth);
    });
  },
};
