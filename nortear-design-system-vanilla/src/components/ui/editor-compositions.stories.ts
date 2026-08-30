import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createEditor, type EditorRoot } from './editor';
import {
  AI_DESCRIPTION_CONTENT,
  CUSTOM_STORAGE_CONTENT,
  LABELS,
  createPngFile,
  describeWithFakeAi,
  fluidBox,
  resolveToCdn,
} from './editor.fixtures';
import { openRow, selectImage, waitForAlt } from './editor.play-helpers';
import { editorSource, editorSourceWith } from './editor.source';

const meta: Meta = {
  title: 'UI/Editor/Compositions',
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
          'As duas decisões que o editor deixa abertas para quem consome: de onde '
          + 'vem a URL da imagem, e quem escreve o texto alternativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * A costura de armazenamento: quem consome decide de onde sai o `src`.
 *
 * O padrão embute o arquivo em base64, que é o que faz o Playground funcionar
 * sem servidor nenhum. Aqui o resolvedor é outro — um envio fingido que devolve
 * a URL de um CDN, e que RECUSA arquivo acima de um limite. Os dois caminhos
 * são o que uma aplicação de verdade precisa.
 */
export const CustomImageStorage: Story = {
  parameters: {
    docs: {
      source: {
        transform: editorSourceWith({
          content: CUSTOM_STORAGE_CONTENT,
          resolveImage: '(file) => enviarAoCdn(file)',
        }),
      },
      description: {
        story:
          'Devolver `null` cancela a inserção: envio recusado, arquivo grande '
          + 'demais, formato fora da política. A barra não insere nada e segue.',
      },
    },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: CUSTOM_STORAGE_CONTENT,
        preset: 'advanced',
        labels: LABELS,
        resolveImage: resolveToCdn,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;
    root.editor.commands.setContent('<p>armazenamento próprio</p>');

    await step('O `src` vem do resolvedor, não do arquivo', async () => {
      await expect(await root.insertImage(createPngFile('logo.png', 10))).toBe(true);
      const image = root.querySelector('img') as HTMLImageElement;
      await expect(image.getAttribute('src')).toBe('https://cdn.exemplo.com/logo.png');
      // Nada de base64: o arquivo não entrou no documento.
      await expect(image.getAttribute('src')).not.toContain('data:');
    });

    await step('Recusar não insere nada — e não é erro', async () => {
      await expect(await root.insertImage(createPngFile('foto.png', 2048))).toBe(false);
      await expect(root.querySelectorAll('img')).toHaveLength(1);
    });
  },
};

/**
 * A costura de DESCRIÇÃO: quem consome liga um modelo de visão.
 *
 * Aqui o "modelo" é um dublê que demora e devolve uma frase fixa. O que a story
 * verifica não é a qualidade da descrição — é o contrato em volta dela: a imagem
 * entra na hora, a descrição chega depois, e a pessoa pode corrigir o que a IA
 * escreveu.
 */
export const AiImageDescription: Story = {
  parameters: {
    covers: ['functional.item7', 'functional.item8'],
    docs: {
      source: {
        transform: editorSourceWith({
          content: AI_DESCRIPTION_CONTENT,
          describeImage: '(file, src) => descrever(file, src)',
        }),
      },
      description: {
        story:
          'A descrição automática NÃO dispensa revisão: ela erra de formas que '
          + 'quem enxerga a imagem percebe na hora, e por isso o texto alternativo '
          + 'continua editável pelo bloco de imagem.',
      },
    },
  },
  render: () =>
    fluidBox(
      createEditor({
        content: AI_DESCRIPTION_CONTENT,
        preset: 'advanced',
        labels: LABELS,
        describeImage: describeWithFakeAi,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;
    root.editor.commands.setContent('<p>descrição automática</p>');

    const file = createPngFile('grafico.png');

    await step('A imagem entra NA HORA, com o alt provisório', async () => {
      await expect(await root.insertImage(file)).toBe(true);
      const image = root.querySelector('img') as HTMLImageElement;
      // Sem esperar nada: o nome do arquivo segura a vaga. Prender a imagem até
      // a descrição chegar trocaria uma lacuna de acessibilidade por uma de
      // responsividade — e um serviço fora do ar travaria a edição.
      await expect(image.getAttribute('alt')).toBe('grafico.png');
    });

    await step('A descrição chega depois e substitui o provisório', async () => {
      // Espera de RELÓGIO, não `waitFor`: a condição aqui é leitura pura, mas o
      // laço com prazo é o que distingue "demorou" de "não veio" — `waitFor`
      // que nunca satisfaz pendura a aba sem reprovar.
      await waitForAlt(root, 'Descrição automática de grafico.png');
    });

    await step('COLAR e ARRASTAR arquivo passam pelo mesmo caminho', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;

      // Medido antes de existir: colar arquivo não fazia NADA, e arrastar
      // também não. Quem usa não descobre que há um botão para o que o resto da
      // web resolve arrastando.
      root.editor.commands.setContent('<p>colar</p>');
      const pasteData = new DataTransfer();
      pasteData.items.add(createPngFile('colada.png'));
      field.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de colada.png');

      root.editor.commands.setContent('<p>arrastar</p>');
      const dragData = new DataTransfer();
      dragData.items.add(createPngFile('solta.png'));
      // COM coordenadas dentro do editor: o ProseMirror abandona o `drop` antes
      // de chamar o gancho quando `posAtCoords` não resolve, e um evento
      // sintético em (0, 0) cai fora da caixa. Medido — sem isto o teste
      // acusaria "arrastar não funciona" com o código certo.
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
      // navegador. Aqui a solta é no RODAPÉ da moldura, longe do texto.
      root.editor.commands.setContent('<p>moldura</p>');
      const box = root.getBoundingClientRect();
      const dragData = new DataTransfer();
      dragData.items.add(createPngFile('moldura.png', 2));

      // O `dragover` vem PRIMEIRO, e é ele que decide o caso: só se o padrão
      // for cancelado ali o navegador entrega o `drop` à página — senão ele
      // trata o arquivo como navegação e abre numa aba.
      //
      // Esta asserção existe porque a de baixo NÃO cobre isso: um `drop`
      // sintético é entregue de qualquer jeito, então plantar o defeito no
      // `dragover` deixava o teste verde com o bug de volta. Medido.
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
      // Este era o caminho do relato: colar de um site insere `<img src>` sem
      // `alt` nenhum, montado pelo ProseMirror a partir do HTML da área de
      // transferência — sem passar pela fábrica. A varredura por `update` é o
      // que o alcança, e ali não há arquivo: só o endereço.
      root.editor.commands.setContent('<p>colada de fora</p>');
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      const clipboard = new DataTransfer();
      clipboard.setData('text/html', '<img src="https://exemplo.com/diagrama.png">');
      field.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de diagrama.png');
    });

    await step('E a pessoa corrige o que a IA escreveu', async () => {
      root.editor.commands.setContent('<p>correção</p>');
      await expect(await root.insertImage(file)).toBe(true);
      await waitForAlt(root, 'Descrição automática de grafico.png');

      // O botão só existe com a imagem selecionada — é o mesmo desenho dos
      // botões de tabela.
      selectImage(root);

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

      // O que a play DEIXA é o que a pessoa vê ao abrir a story pela sidebar, e
      // é o que o Chromatic fotografa. O documento aqui era `<p>correção</p>` —
      // precondição de um passo de teste, que não explica nada a quem chega.
      root.editor.commands.setContent(AI_DESCRIPTION_CONTENT);
    });
  },
};
