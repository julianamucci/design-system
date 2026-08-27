import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { Editor } from './editor';
import {
  editorSource,
  editorCustomImageStorageSource,
  editorAiImageDescriptionSource,
} from './editor.source';
import {
  AI_DESCRIPTION_CONTENT,
  CUSTOM_STORAGE_CONTENT,
  EditorCanvas,
  LABELS,
  createPngFile,
  describeWithFakeAi,
  editorHandle,
  openRow,
  resolveToCdn,
  waitForAlt,
  waitUntil,
} from './editor.fixtures';

const meta = {
  title: 'UI/Editor/Compositions',
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
          'As duas decisões que o editor deixa abertas para quem consome: de onde vem o endereço da imagem e quem escreve o texto alternativo. Nenhuma das duas tem resposta dentro de um design system.',
      },
    },
  },
  // `labels` é a única prop obrigatória, e é a mesma nas três stories: sem ela
  // a barra não tem nome acessível nenhum. Declarada no meta, cada story herda.
  args: { labels: LABELS },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomImageStorage: Story = {
  parameters: {
    docs: {
      source: { transform: editorCustomImageStorageSource },
      description: {
        story:
          'O padrão embute o arquivo no próprio conteúdo, o que faz o exemplo funcionar sem servidor e não é o que se leva para produção. Aqui o endereço vem de um envio fingido a um CDN, que recusa arquivo acima do limite.',
      },
    },
  },
  render: () => (
    <EditorCanvas
      content={CUSTOM_STORAGE_CONTENT}
      labels={LABELS}
      resolveImage={resolveToCdn}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const handle = editorHandle(canvasElement);
    const editor = handle.editor!;
    const root = handle.root!;
    editor.commands.setContent('<p>armazenamento próprio</p>');

    await step('O endereço vem do resolvedor, não do arquivo', async () => {
      await expect(await handle.insertImage(createPngFile('logo.png', 10))).toBe(true);
      const image = root.querySelector('img') as HTMLImageElement;
      await expect(image.getAttribute('src')).toBe('https://cdn.exemplo.com/logo.png');
      // Nada embutido: o arquivo não entrou no documento.
      await expect(image.getAttribute('src')).not.toContain('data:');
    });

    await step('Recusar não insere nada — e não é erro', async () => {
      await expect(await handle.insertImage(createPngFile('foto.png', 2048))).toBe(false);
      await expect(root.querySelectorAll('img')).toHaveLength(1);
    });
  },
};

export const AiImageDescription: Story = {
  parameters: {
    covers: ['functional.item7', 'functional.item8'],
    docs: {
      source: { transform: editorAiImageDescriptionSource },
      description: {
        story:
          'A imagem entra na hora, com o nome do arquivo segurando a vaga; a descrição substitui o provisório quando chega. Descrição automática não dispensa revisão, e é por isso que o botão de texto alternativo aparece com a imagem selecionada.',
      },
    },
  },
  render: () => (
    <EditorCanvas
      content={AI_DESCRIPTION_CONTENT}
      labels={LABELS}
      describeImage={describeWithFakeAi}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const handle = editorHandle(canvasElement);
    const editor = handle.editor!;
    const root = handle.root!;
    editor.commands.setContent('<p>descrição automática</p>');

    const file = createPngFile('grafico.png');

    await step('A imagem entra NA HORA, com o texto alternativo provisório', async () => {
      await expect(await handle.insertImage(file)).toBe(true);
      // Sem esperar nada: o nome do arquivo segura a vaga. Prender a imagem até
      // a descrição chegar trocaria uma lacuna de acessibilidade por uma de
      // responsividade — e um serviço fora do ar travaria a edição.
      await expect(root.querySelector('img')).toHaveAttribute('alt', 'grafico.png');
    });

    await step('A descrição chega depois e substitui o provisório', async () => {
      // Espera de RELÓGIO: o laço com prazo é o que distingue "demorou" de "não
      // veio" — condição que nunca satisfaz pendura a aba sem reprovar.
      await waitForAlt(root, 'Descrição automática de grafico.png');
    });

    await step('COLAR arquivo passa pelo mesmo caminho do botão', async () => {
      editor.commands.setContent('<p>colar</p>');
      const pasteData = new DataTransfer();
      pasteData.items.add(createPngFile('colada.png'));
      (root.querySelector('.ProseMirror') as HTMLElement).dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de colada.png');
    });

    await step('ARRASTAR arquivo para o texto também', async () => {
      editor.commands.setContent('<p>arrastar</p>');
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      const dragData = new DataTransfer();
      dragData.items.add(createPngFile('solta.png'));
      // COM coordenadas dentro do editor: o ProseMirror abandona o `drop` antes
      // de chamar o gancho quando o ponto não resolve, e um evento sintético em
      // (0, 0) cai fora da caixa.
      const contentBox = field.getBoundingClientRect();
      field.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer: dragData,
          bubbles: true,
          cancelable: true,
          clientX: contentBox.left + contentBox.width / 2,
          clientY: contentBox.top + 10,
        }),
      );
      await waitForAlt(root, 'Descrição automática de solta.png');
    });

    await step('Soltar na MOLDURA, fora do texto, também insere', async () => {
      // O relato: arrastar abria uma aba nova. O `dragover` que a lib previne
      // cobre só o elemento editável, que tem a altura do texto — o respiro
      // abaixo da última linha é moldura, e soltar ali escapava para o
      // navegador.
      editor.commands.setContent('<p>moldura</p>');
      const box = root.getBoundingClientRect();
      const dragData = new DataTransfer();
      dragData.items.add(createPngFile('moldura.png', 2));

      // O `dragover` vem PRIMEIRO, e é ele que decide o caso: só se o padrão
      // for cancelado ali o navegador entrega o `drop` à página. Esta asserção
      // existe porque a de baixo NÃO cobre isso — um `drop` sintético é
      // entregue de qualquer jeito.
      const dragOver = new DragEvent('dragover', {
        dataTransfer: dragData,
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(dragOver);
      await expect(dragOver.defaultPrevented).toBe(true);

      const dropEvent = new DragEvent('drop', {
        dataTransfer: dragData,
        bubbles: true,
        cancelable: true,
        clientX: box.left + box.width / 2,
        clientY: box.bottom - 4,
      });
      root.dispatchEvent(dropEvent);
      // O padrão PRECISA ser cancelado: é ele que faz o navegador abrir o
      // arquivo. Asserção separada porque a imagem entrar não prova isso.
      await expect(dropEvent.defaultPrevented).toBe(true);
      await waitForAlt(root, 'Descrição automática de moldura.png');
    });

    await step('Imagem COLADA de outra página também é descrita', async () => {
      // Colar de um site insere a imagem sem texto alternativo nenhum, montada
      // pelo ProseMirror a partir do HTML da área de transferência — sem passar
      // pelo componente. A varredura por atualização é o que a alcança, e ali
      // não há arquivo: só o endereço.
      editor.commands.setContent('<p>colada de fora</p>');
      const clipboard = new DataTransfer();
      clipboard.setData('text/html', '<img src="https://exemplo.com/diagrama.png">');
      (root.querySelector('.ProseMirror') as HTMLElement).dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de diagrama.png');
    });

    await step('E a pessoa corrige o que a IA escreveu', async () => {
      editor.commands.setContent('<p>correção</p>');
      await expect(await handle.insertImage(file)).toBe(true);
      await waitForAlt(root, 'Descrição automática de grafico.png');

      // A posição do nó vem de uma varredura, não de aritmética sobre o tamanho
      // do documento: um parágrafo a mais ou a menos desloca a conta em
      // silêncio.
      let position = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image') position = pos;
      });
      editor.commands.setNodeSelection(position);
      // O botão só existe com a imagem selecionada, e quem o revela é o desenho
      // seguinte: procurá-lo antes dele não acharia nada.
      await waitUntil(
        () => canvas.queryByRole('button', { name: LABELS.actions.imageAlt }) !== null,
        'o botão de texto alternativo aparecer',
      );

      const open = canvas.getByRole('button', { name: LABELS.actions.imageAlt });
      await openRow(open);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.alt });
      // Abre com o que está lá: ver o texto é o que permite julgá-lo.
      await expect(field).toHaveValue('Descrição automática de grafico.png');

      await userEvent.clear(field);
      await userEvent.type(field, 'Gráfico de barras da receita por trimestre{Enter}');
      await expect(root.querySelector('img')).toHaveAttribute(
        'alt',
        'Gráfico de barras da receita por trimestre',
      );
    });
  },
};
