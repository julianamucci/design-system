import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Editor } from './index';
import {
  editorReadOnlySource,
  editorWithImageSource,
  editorWithTableSource,
} from './editor.source';
import {
  CONTENTS,
  editorLabels,
  contextBox,
  cursorInTable,
  editorRoot,
  selectImage,
  settle,
  waitUntil,
} from './editor.fixtures';

const meta: Meta<typeof Editor> = {
  title: 'Components/Form/Editor/States',
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
          'Situações em que o editor cai: leitura sem edição, cursor dentro de uma tabela e imagem selecionada. Nas duas últimas, o bloco daquele assunto revela os botões que só fazem sentido ali.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Editor>;

export const ReadOnly: Story = {
  parameters: {
    docs: {
      source: { transform: editorReadOnlySource },
      description: {
        story:
          'O conteúdo continua visível e navegável, e a edição fica desligada. A barra permanece na tela: ela é o mapa do que o conteúdo tem.',
      },
    },
  },
  render: () => ({
    Component: Editor,
    props: {
      content: CONTENTS.advanced,
      editable: false,
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

    await step('O campo deixa de aceitar edição, e continua legível', async () => {
      const field = canvas.getByRole('textbox', { name: L.editorField });
      await expect(field).toHaveAttribute('contenteditable', 'false');
      await expect(root.querySelector('h2')?.textContent).toBe('Relatório');
    });

    await step('Clicar numa marca não acende o botão nem muda o documento', async () => {
      const boldButton = canvas.getByRole('button', { name: L.actions.bold });
      const before = root.editor.getHTML();
      // Clique idempotente por construção: com a edição desligada o comando é
      // no-op, então repetir a play não parte de um estado diferente.
      //
      // A asserção lê o atributo em vez de `toHaveAttribute` de propósito — é a
      // leitura, não o par de abrir/fechar, que este passo precisa: o botão não
      // pode acender por conta própria quando o documento não mudou.
      boldButton.click();
      await new Promise((r) => setTimeout(r, 50));
      await expect(boldButton.getAttribute('aria-pressed')).toBe('false');
      await expect(root.editor.getHTML()).toBe(before);
    });
  },
};

export const WithTable: Story = {
  parameters: {
    covers: ['functional.item10'],
    docs: {
      source: { transform: editorWithTableSource },
      description: {
        story:
          'Com o cursor dentro da tabela, o bloco de tabela revela linha, coluna, cabeçalho e exclusão. Fora dela, seis botões inertes seriam ruído permanente.',
      },
    },
  },
  render: () => ({
    Component: Editor,
    props: {
      content: CONTENTS.withTable,
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
    const box = contextBox(root, 'table');

    await step('Fora da tabela, o bloco de tabela não está desenhado', async () => {
      // Precondição própria: o cursor nasce no início do documento, antes da
      // tabela. A leitura é do `display` COMPUTADO — `display: contents` é
      // declaração de autor e vence o `[hidden]` do navegador.
      root.editor.commands.setTextSelection(1);
      await settle();
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('functional.item10 — com o cursor na tabela, o bloco daquele assunto aparece', async () => {
      cursorInTable(root);
      await waitUntil(
        () => getComputedStyle(box).display !== 'none',
        'o bloco de tabela continuou escondido com o cursor dentro dela',
      );
      for (const name of [
        L.actions.rowAfter,
        L.actions.columnAfter,
        L.actions.deleteRow,
        L.actions.deleteColumn,
        L.actions.headerRow,
        L.actions.deleteTable,
      ]) {
        await expect(canvas.getByRole('button', { name })).toBeVisible();
      }
    });

    await step('O cabeçalho da tabela se distingue das células comuns', async () => {
      const header = root.querySelector('table th') as HTMLElement;
      const cell = root.querySelector('table td') as HTMLElement;
      await expect(getComputedStyle(header).backgroundColor).not.toBe(
        getComputedStyle(cell).backgroundColor,
      );
    });
  },
};

export const WithImage: Story = {
  parameters: {
    covers: ['functional.item10', 'accessibility.item5', 'visual.item3'],
    docs: {
      source: { transform: editorWithImageSource },
      description: {
        story:
          'Com a imagem selecionada, o bloco de imagem revela texto alternativo e tamanho, e a alça de redimensionar aparece no canto de saída.',
      },
    },
  },
  render: () => ({
    Component: Editor,
    props: {
      content: CONTENTS.withImage,
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
    const box = contextBox(root, 'image');

    await step('accessibility.item5 — a imagem entra com texto alternativo preenchido', async () => {
      const img = root.querySelector('img') as HTMLImageElement;
      await expect(img).toBeInTheDocument();
      await expect(img.getAttribute('alt')).toBe('Ponto de exemplo');
    });

    await step('Sem a imagem selecionada, o bloco de imagem não está desenhado', async () => {
      root.editor.commands.setTextSelection(1);
      await settle();
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('functional.item10 — selecionar a imagem revela o bloco daquele assunto', async () => {
      selectImage(root);
      await waitUntil(
        () => getComputedStyle(box).display !== 'none',
        'o bloco de imagem continuou escondido com a imagem selecionada',
      );
      for (const name of [
        L.actions.imageAlt,
        L.actions.imageSmaller,
        L.actions.imageLarger,
        L.actions.imageNatural,
      ]) {
        await expect(canvas.getByRole('button', { name })).toBeVisible();
      }
    });

    await step('visual.item3 — anel de foco na imagem e alça visível no canto', async () => {
      // A largura é escrita AQUI, e é o último passo: a story fecha no quadro que
      // o Chromatic fotografa. O exemplo é um ponto de 1×1, e num ponto de 1×1
      // não se enxerga nem anel nem alça — a foto não mostraria o que
      // `visual.item3` promete. O valor é fixo, e não uma sequência de cliques em
      // "aumentar": o painel Interactions reexecuta a play no mesmo DOM, e um
      // passo relativo fecharia num tamanho diferente a cada rodada.
      selectImage(root);
      root.editor.chain().updateAttributes('image', { width: 200 }).run();
      selectImage(root);
      await expect(root.querySelector('img')?.getAttribute('width')).toBe('200');

      const selected = root.querySelector('.nds-editor-image.ProseMirror-selectednode');
      await expect(selected).toBeInTheDocument();
      const handle = root.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(getComputedStyle(handle).opacity).toBe('1');
      // A alça é decoração de ponteiro: quem navega por teclado usa os botões do
      // bloco de imagem, que é o caminho exigido pelo critério de arrasto.
      await expect(handle).toHaveAttribute('aria-hidden', 'true');
    });
  },
};
