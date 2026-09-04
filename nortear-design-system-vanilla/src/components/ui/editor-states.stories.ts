import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createEditor, type EditorRoot } from './editor';
import {
  ADVANCED_CONTENT,
  IMAGE_CONTENT,
  LABELS,
  TABLE_CONTENT,
  fluidBox,
} from './editor.fixtures';
import { selectImage, selectTableCell, tokenColor } from './editor.play-helpers';
import { editorSource, editorSourceWith } from './editor.source';

const meta: Meta = {
  title: 'Components/Form/Editor/States',
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
          'As situações em que o editor cai durante o uso: leitura, cursor numa '
          + 'tabela e imagem selecionada. Cada uma revela um bloco diferente da barra.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** A caixa de botões contextuais de um assunto está desenhada? */
function contextIsPainted(root: HTMLElement, node: 'image' | 'table'): boolean {
  const box = root.querySelector(
    `[data-slot="editor-toolbar-context"][data-node="${node}"]`,
  ) as HTMLElement;
  return getComputedStyle(box).display !== 'none';
}

export const ReadOnly: Story = {
  parameters: {
    docs: {
      source: {
        transform: editorSourceWith({ editable: false, content: ADVANCED_CONTENT }),
      },
      description: {
        story:
          'O conteúdo continua visível e navegável, e a edição fica desligada. '
          + 'É o mesmo componente, não uma segunda forma de exibir HTML.',
      },
    },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: ADVANCED_CONTENT,
        editable: false,
        preset: 'advanced',
        labels: LABELS,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;

    await step('A edição fica desligada, e o conteúdo permanece', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      // `contenteditable` é o que a lib escreve, e é o que o navegador lê para
      // decidir se a tecla chega ao documento.
      await expect(field.getAttribute('contenteditable')).toBe('false');
      await expect(root.editor.isEditable).toBe(false);
      await expect(root.querySelector('.ProseMirror h2')).toBeInTheDocument();
    });

    await step('O texto segue selecionável — leitura não é imagem', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      await expect(getComputedStyle(field).userSelect).not.toBe('none');
    });

    await step('A barra NÃO aplica comando, e o botão não mente sobre isso', async () => {
      // O caso que o `contenteditable` acima não cobre: `editor.commands`
      // continua funcionando num editor em leitura — `editable` vale para o
      // teclado e o ponteiro dentro do campo, não para comando disparado por
      // código. Sem a guarda, clicar em Negrito marcava o documento, o botão
      // acendia, e o estado contradizia o que a página promete em
      // `states.readOnly`.
      const bold = canvas.getByRole('button', { name: LABELS.actions.bold });
      const before = root.editor.getHTML();

      root.editor.commands.selectAll();
      await userEvent.click(bold);

      await expect(root.querySelector('.ProseMirror strong')).toBeNull();
      await expect(root.editor.getHTML()).toBe(before);
      // O grupo pinta o próprio estado no clique, ANTES de o editor ser
      // consultado: sem a correção que vem logo depois, o botão ficaria aceso
      // sobre um documento que não mudou.
      await expect(bold).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const WithTable: Story = {
  parameters: {
    covers: ['functional.item10'],
    docs: {
      source: { transform: editorSourceWith({ content: TABLE_CONTENT }) },
      description: {
        story:
          'Com o cursor dentro da tabela, o bloco de tabela revela linha, coluna, '
          + 'cabeçalho e exclusão. Fora dela, esses botões não existem.',
      },
    },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: TABLE_CONTENT,
        preset: 'advanced',
        labels: LABELS,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;

    // Precondição própria: o painel Interactions reexecuta no mesmo DOM, e a
    // rodada anterior deixou a tabela com uma linha a mais.
    root.editor.commands.setContent(TABLE_CONTENT);

    await step('Fora da tabela, o bloco de tabela não está na tela', async () => {
      // Pelo NÓ, não pela posição: há mais de um bloco contextual, e o primeiro
      // do documento deixaria de ser o da tabela sem que nada na asserção mude.
      root.editor.commands.setTextSelection(1);
      await expect(contextIsPainted(root, 'table')).toBe(false);
    });

    await step('Com o cursor numa célula, os botões do assunto aparecem', async () => {
      selectTableCell(root);
      await expect(contextIsPainted(root, 'table')).toBe(true);
      await expect(root.querySelectorAll('table tr')).toHaveLength(2);

      const addRow = canvas.getByRole('button', { name: LABELS.actions.rowAfter });
      await userEvent.click(addRow);
      await expect(root.querySelectorAll('table tr')).toHaveLength(3);
    });

    await step('O cabeçalho da tabela se distingue do corpo', async () => {
      const headerCell = root.querySelector('table th') as HTMLElement;
      await expect(getComputedStyle(headerCell).backgroundColor).toBe(tokenColor(root, '--muted'));
    });

    await step('Excluir a tabela leva o bloco embora junto', async () => {
      selectTableCell(root);
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.deleteTable }));
      await expect(root.querySelector('table')).toBeNull();
      await expect(contextIsPainted(root, 'table')).toBe(false);
    });
  },
};

export const WithImage: Story = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item4', 'accessibility.item5', 'visual.item3'],
    docs: {
      source: { transform: editorSourceWith({ content: IMAGE_CONTENT }) },
      description: {
        story:
          'Com a imagem selecionada, o bloco de imagem revela texto alternativo e '
          + 'tamanho, e a alça de redimensionar aparece no canto.',
      },
    },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: IMAGE_CONTENT,
        preset: 'advanced',
        labels: LABELS,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;

    // Precondição própria: as rodadas anteriores mexeram na largura da imagem.
    root.editor.commands.setContent(IMAGE_CONTENT);

    await step('A imagem chega com texto alternativo preenchido', async () => {
      const image = root.querySelector('img') as HTMLImageElement;
      // Imagem sem `alt` é violação de `image-alt` no axe, e é o caso que o
      // serviço de descrição existe para cobrir quando ninguém escreveu nada.
      await expect(image.getAttribute('alt')).toBe('Ponto de exemplo');
    });

    await step('Sem seleção, o bloco de imagem não está na tela', async () => {
      root.editor.commands.setTextSelection(1);
      await expect(contextIsPainted(root, 'image')).toBe(false);
    });

    await step('Selecionada, ela ganha anel de foco e alça', async () => {
      selectImage(root);
      await expect(contextIsPainted(root, 'image')).toBe(true);

      const wrapper = root.querySelector('.nds-editor-image') as HTMLElement;
      const wrapperStyle = getComputedStyle(wrapper);
      // O anel é o MESMO do resto do sistema, e não uma borda própria: é a
      // mesma pergunta ("o que está selecionado?") e merece o mesmo sinal.
      await expect(wrapperStyle.outlineColor).toBe(tokenColor(root, '--ring'));
      await expect(wrapperStyle.outlineWidth).not.toBe('0px');

      const handle = root.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(getComputedStyle(handle).opacity).toBe('1');
      // O ícone é DECORAÇÃO, e quem carrega o `aria-hidden` é a alça inteira —
      // um segundo, aninhado, só repetiria o que o pai já diz. E ele não pode
      // receber ponteiro: o gesto tem de nascer na alça, senão o
      // `setPointerCapture` captura num alvo que o `pointermove` não escuta.
      await expect(handle).toHaveAttribute('aria-hidden', 'true');
      const handleIcon = handle.querySelector('svg') as SVGElement;
      await expect(handleIcon).not.toBeNull();
      await expect(getComputedStyle(handleIcon).pointerEvents).toBe('none');
    });

    await step('O teclado redimensiona sem depender da alça', async () => {
      // O caminho que existe porque arrastar não pode ser o único
      // (WCAG 2.5.7, Movimentos de arrasto).
      //
      // A largura de partida é escrita pela play: o exemplo é um ponto de 1×1,
      // e sem ela "diminuir" já nasce no piso — o botão fica desabilitado e o
      // caminho por teclado não teria o que exercitar.
      selectImage(root);
      root.editor.chain().updateAttributes('image', { width: 200 }).run();
      selectImage(root);
      const startingWidth = 200;

      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageSmaller }));
      selectImage(root);
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(
        startingWidth - 40,
      );

      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageLarger }));
      selectImage(root);
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(startingWidth);
    });

    await step('O piso de 48px segura, e "natural" APAGA o atributo', async () => {
      for (let i = 0; i < 40; i++) {
        const button = canvas.queryByRole('button', { name: LABELS.actions.imageSmaller });
        if (!button || (button as HTMLButtonElement).disabled) break;
        await userEvent.click(button);
        selectImage(root);
      }
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(48);

      // Volta ao natural APAGA a medida, e não grava a de hoje: com a medida
      // gravada, a folha perderia o direito de encolher a imagem numa moldura
      // estreita.
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageNatural }));
      selectImage(root);
      await expect(root.querySelector('img')?.hasAttribute('width')).toBe(false);
    });

    await step('A alça arrasta, e só ao SOLTAR a largura vira transação', async () => {
      // Mesma razão do passo do teclado: com a largura natural de 1px, o piso
      // engoliria o deslocamento e a asserção mediria o clamp, não o arrasto.
      selectImage(root);
      root.editor.chain().updateAttributes('image', { width: 200 }).run();
      selectImage(root);
      const handle = root.querySelector('.nds-editor-image-handle') as HTMLElement;
      const before = Math.round(
        (root.querySelector('img') as HTMLElement).getBoundingClientRect().width,
      );
      const handleBox = handle.getBoundingClientRect();
      const pointerInit = { pointerId: 1, bubbles: true, cancelable: true } as const;
      handle.setPointerCapture = () => {};
      handle.releasePointerCapture = () => {};
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          ...pointerInit,
          clientX: handleBox.left,
          clientY: handleBox.top,
        }),
      );
      handle.dispatchEvent(
        new PointerEvent('pointermove', {
          ...pointerInit,
          clientX: handleBox.left - 30,
          clientY: handleBox.top,
        }),
      );
      handle.dispatchEvent(new PointerEvent('pointerup', pointerInit));

      // A leitura é do DOCUMENTO, não do `<img>`.
      //
      // Durante o arrasto a largura é escrita direto no DOM de propósito —
      // gravar a cada quadro encheria o histórico, e desfazer exigiria dezenas
      // de toques para voltar um tamanho. Só ao SOLTAR ela vira transação. Uma
      // asserção sobre o atributo do `<img>` passaria com a gravação removida,
      // porque o arrasto já a escreveu ali: medido, ficou verde com o defeito
      // plantado.
      let stored: unknown = null;
      root.editor.state.doc.descendants((node) => {
        if (node.type.name === 'image') stored = node.attrs.width;
      });
      await expect(stored).toBe(before - 30);
    });
  },
};
