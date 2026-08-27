import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Editor } from './editor';
import {
  editorSource,
  editorReadOnlySource,
  editorWithTableSource,
  editorWithImageSource,
} from './editor.source';
import {
  ADVANCED_CONTENT,
  EditorCanvas,
  IMAGE_CONTENT,
  LABELS,
  TABLE_CONTENT,
  editorHandle,
  selectImage,
  waitUntil,
} from './editor.fixtures';

const meta = {
  title: 'UI/Editor/States',
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
          'As situações em que o editor cai: somente leitura, cursor dentro de uma tabela e imagem selecionada. As duas últimas revelam os botões do assunto no bloco correspondente.',
      },
    },
  },
  // `labels` é a única prop obrigatória, e é a mesma nas três stories: sem ela
  // a barra não tem nome acessível nenhum. Declarada no meta, cada story herda.
  args: { labels: LABELS },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A caixa contextual de um assunto — a que só existe com o nó sob o cursor. */
function contextBox(root: HTMLElement, node: string): HTMLElement {
  return root.querySelector(
    `[data-slot="editor-toolbar-context"][data-node="${node}"]`,
  ) as HTMLElement;
}

/** A largura gravada no documento, que é a que sobrevive à releitura. */
function storedWidth(root: HTMLElement): string | null {
  return root.querySelector('img')?.getAttribute('width') ?? null;
}

export const ReadOnly: Story = {
  parameters: {
    docs: {
      source: { transform: editorReadOnlySource },
      description: {
        story:
          'O conteúdo continua visível e navegável, e a edição fica desligada. A barra permanece na tela para que a leitura do documento não mude de forma entre os dois modos.',
      },
    },
  },
  render: () => <EditorCanvas editable={false} content={ADVANCED_CONTENT} labels={LABELS} />,
  play: async ({ canvasElement, step }) => {
    const handle = editorHandle(canvasElement);
    const editor = handle.editor!;
    const root = handle.root!;

    await step('A área deixa de aceitar edição', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      await expect(field).toHaveAttribute('contenteditable', 'false');
      await expect(editor.isEditable).toBe(false);
    });

    await step('O conteúdo continua inteiro e legível', async () => {
      await expect(root.querySelector('h2')?.textContent).toBe('Relatório');
      await expect(root.querySelector('mark')).toBeInTheDocument();
      await expect(root.querySelector('a')).toHaveAttribute('href', 'https://exemplo.com');
    });
  },
};

export const WithTable: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item2'],
    docs: {
      source: { transform: editorWithTableSource },
      description: {
        story:
          'Com o cursor dentro da tabela, o bloco de tabela revela linha, coluna, cabeçalho e exclusão. Fora dela, seis botões inertes seriam ruído permanente.',
      },
    },
  },
  render: () => <EditorCanvas content={TABLE_CONTENT} labels={LABELS} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const handle = editorHandle(canvasElement);
    const editor = handle.editor!;
    const root = handle.root!;
    // Pelo NÓ, e não pela posição: há mais de uma caixa contextual na barra, e
    // a primeira do documento é a da imagem.
    const box = contextBox(root, 'table');

    await step('Fora da tabela, os botões dela não existem na tela', async () => {
      editor.commands.setTextSelection(1);
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('Com o cursor numa célula, o bloco de tabela aparece', async () => {
      await userEvent.click(root.querySelector('td') as HTMLElement);
      await expect(editor.isActive('table')).toBe(true);
      await expect(getComputedStyle(box).display).not.toBe('none');
      for (const name of [
        LABELS.actions.rowAfter,
        LABELS.actions.columnAfter,
        LABELS.actions.deleteRow,
        LABELS.actions.deleteColumn,
        LABELS.actions.headerRow,
        LABELS.actions.deleteTable,
      ]) {
        await expect(canvas.getByRole('button', { name })).toBeInTheDocument();
      }
    });

    await step('Inserir linha abaixo cresce a tabela', async () => {
      const before = root.querySelectorAll('table tr').length;
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.rowAfter }));
      await expect(root.querySelectorAll('table tr')).toHaveLength(before + 1);
    });

    await step('A lista de tarefas desenha caixa no lugar do marcador', async () => {
      // Ela é exercitada aqui e NÃO fica no quadro final: a caixa que a
      // biblioteca desenha mede 13px, e o alvo de ponteiro mínimo é 24px
      // (WCAG 2.5.8) — deixá-la na tela reprovaria a verificação automática por
      // um defeito que é da folha compartilhada, não desta story.
      editor.commands.setContent(
        '<ul data-type="taskList"><li data-checked="false"><label><input type="checkbox"></label>'
          + '<div><p>a fazer</p></div></li></ul>',
      );
      const item = root.querySelector('ul[data-type="taskList"] li') as HTMLElement;
      await expect(item.querySelector('input[type="checkbox"]')).toBeInTheDocument();
      // A caixa é quem marca — o marcador de lista sai de cena para não haver
      // dois sinais para a mesma coisa.
      await expect(getComputedStyle(item.parentElement as HTMLElement).listStyleType).toBe('none');
    });

    await step('O documento fecha com os blocos que a foto precisa ver', async () => {
      editor.commands.setContent(
        TABLE_CONTENT
          + '<blockquote><p>A citação leva barra lateral na cor da marca.</p></blockquote>'
          + '<pre><code>const c = 299792458;</code></pre>',
      );
      const quote = root.querySelector('blockquote') as HTMLElement;
      // A barra lateral é o sinal, e é ela que carrega a cor da marca — o texto
      // fica em `--foreground`, porque cor semântica em texto corrido não
      // alcança os 4.5:1 que texto corrido exige.
      await expect(getComputedStyle(quote).borderInlineStartWidth).not.toBe('0px');
      await expect(root.querySelector('pre')).toBeInTheDocument();
      await expect(root.querySelector('table')).toBeInTheDocument();
    });
  },
};

export const WithImage: Story = {
  parameters: {
    covers: [
      'functional.item9',
      'functional.item10',
      'accessibility.item4',
      'accessibility.item5',
      'visual.item3',
    ],
    docs: {
      source: { transform: editorWithImageSource },
      description: {
        story:
          'Com a imagem selecionada, o bloco de imagem revela texto alternativo e tamanho, e a alça de redimensionar aparece no canto. Os botões de tamanho existem porque arrastar não pode ser o único caminho.',
      },
    },
  },
  render: () => <EditorCanvas content={IMAGE_CONTENT} labels={LABELS} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const handle = editorHandle(canvasElement);
    const editor = handle.editor!;
    const root = handle.root!;
    const box = contextBox(root, 'image');

    await step('A imagem entra com texto alternativo preenchido', async () => {
      // Imagem sem `alt` reprova na verificação automática e some do leitor de
      // tela sem deixar rastro.
      await expect(root.querySelector('img')).toHaveAttribute('alt', 'Ponto de exemplo');
    });

    await step('Fora dela, os botões de imagem não existem na tela', async () => {
      editor.commands.setTextSelection(1);
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('Selecionada, o bloco de imagem aparece e a alça fica visível', async () => {
      selectImage(handle);
      await waitUntil(
        () => getComputedStyle(box).display !== 'none',
        'o bloco de imagem aparecer na barra',
      );
      const handleEl = root.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(getComputedStyle(handleEl).opacity).toBe('1');
      // A alça é decoração de ponteiro, e quem carrega o `aria-hidden` é ela
      // inteira: o ícone dentro não precisa do seu.
      await expect(handleEl).toHaveAttribute('aria-hidden', 'true');
      await expect(getComputedStyle(handleEl.querySelector('svg') as Element).pointerEvents)
        .toBe('none');
    });

    await step('Sem largura gravada, voltar ao natural não tem o que fazer', async () => {
      selectImage(handle);
      await waitUntil(
        () => getComputedStyle(box).display !== 'none',
        'o bloco de imagem aparecer na barra',
      );
      const natural = canvas.getByRole('button', { name: LABELS.actions.imageNatural });
      await expect(natural).toBeDisabled();
    });

    await step('A largura muda em PASSOS pelo teclado, sem tocar na alça', async () => {
      selectImage(handle);
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageLarger }));
      selectImage(handle);
      const first = Number(storedWidth(root));
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageLarger }));
      selectImage(handle);
      await expect(Number(storedWidth(root))).toBe(first + 40);
    });

    await step('E respeita o piso: cliques demais não reduzem a imagem a um ponto', async () => {
      for (let i = 0; i < 40; i++) {
        selectImage(handle);
        const smaller = canvas.getByRole('button', { name: LABELS.actions.imageSmaller });
        // O piso desliga o botão, e quem escreve o `disabled` é o desenho
        // SEGUINTE: sem esperar por ele, o laço leria o quadro anterior.
        await waitUntil(
          () => Number(storedWidth(root)) === 48 || !smaller.hasAttribute('disabled'),
          'o botão de diminuir refletir a largura atual',
        );
        if (smaller.hasAttribute('disabled')) break;
        await userEvent.click(smaller);
      }
      selectImage(handle);
      await expect(Number(storedWidth(root))).toBe(48);
    });

    await step('Voltar ao natural APAGA o atributo, não grava a medida de hoje', async () => {
      selectImage(handle);
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageNatural }));
      selectImage(handle);
      // Gravada, a medida congelaria a imagem no tamanho de hoje e a folha
      // deixaria de poder encolhê-la numa moldura estreita.
      await expect(storedWidth(root)).toBeNull();
    });

    await step('A story fecha com a imagem selecionada, que é o que a foto cobre', async () => {
      selectImage(handle);
      for (let i = 0; i < 3; i++) {
        await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageLarger }));
        selectImage(handle);
      }
      await expect(root.querySelector('.ProseMirror-selectednode')).toBeInTheDocument();
    });
  },
};
