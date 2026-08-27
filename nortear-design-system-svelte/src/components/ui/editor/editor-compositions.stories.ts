import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, fn } from 'storybook/test';
import { Editor } from './index';
import {
  editorAiImageDescriptionSource,
  editorCustomImageStorageSource,
} from './editor.source';
import {
  CONTENTS,
  LABELS,
  editorRoot,
  openRow,
  imageFile,
  selectImage,
  settle,
  waitForAlt,
  waitForFocus,
} from './editor.fixtures';

const meta: Meta<typeof Editor> = {
  title: 'UI/Editor/Compositions',
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
          'As duas decisões que o editor deixa abertas para quem consome: de onde vem o endereço da imagem, e quem escreve o texto alternativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Editor>;

/**
 * A costura de armazenamento: quem consome decide de onde sai o `src`.
 *
 * O padrão embute o arquivo em base64, que é o que faz o Playground funcionar
 * sem servidor nenhum. Aqui o resolvedor é outro — um envio fingido que devolve
 * a URL de um CDN, e que RECUSA arquivo acima de um limite.
 */
export const CustomImageStorage: Story = {
  parameters: {
    covers: ['functional.item11'],
    docs: {
      source: { transform: editorCustomImageStorageSource },
      description: {
        story:
          'resolveImage decide de onde vem o endereço da imagem. Devolver nulo recusa a inserção, sem erro: arquivo grande demais, formato fora da política, envio negado.',
      },
    },
  },
  args: { onchange: fn() },
  render: (args) => ({
    Component: Editor,
    props: {
      content: CONTENTS.customImageStorage,
      preset: 'advanced',
      labels: LABELS,
      class: 'nds-w-full',
      onchange: args.onchange,
      resolveImage: async (file: File) => {
        // Recusa é `null`, e não exceção: arquivo grande demais, formato fora da
        // política, envio negado. A barra não insere nada e segue.
        if (file.size > 1024) return null;
        return `https://cdn.exemplo.com/${file.name}`;
      },
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = editorRoot(canvasElement);
    root.editor.commands.setContent('<p>armazenamento próprio</p>');

    await step('O `src` vem do resolvedor, não do arquivo', async () => {
      await expect(await root.insertImage(imageFile('logo.png'))).toBe(true);
      const img = root.querySelector('img') as HTMLImageElement;
      await expect(img.getAttribute('src')).toBe('https://cdn.exemplo.com/logo.png');
      // Nada de base64: o arquivo não entrou no documento.
      await expect(img.getAttribute('src')).not.toContain('data:');
    });

    await step('Recusar não insere nada — e não é erro', async () => {
      const bigFile = new File([new Uint8Array(2048)], 'foto.png', { type: 'image/png' });
      await expect(await root.insertImage(bigFile)).toBe(false);
      await expect(root.querySelectorAll('img')).toHaveLength(1);
    });

    await step('functional.item11 — o callback de mudança recebe o HTML atual', async () => {
      await expect(args.onchange).toHaveBeenCalled();
      const calls = (args.onchange as ReturnType<typeof fn>).mock.calls;
      const last = calls[calls.length - 1][0] as string;
      await expect(typeof last).toBe('string');
      await expect(last).toContain('https://cdn.exemplo.com/logo.png');
    });

    await step('Movimento de cursor NÃO dispara o callback', async () => {
      const before = (args.onchange as ReturnType<typeof fn>).mock.calls.length;
      root.editor.commands.setTextSelection(1);
      await expect((args.onchange as ReturnType<typeof fn>).mock.calls.length).toBe(before);
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
    covers: [
      'functional.item7',
      'functional.item8',
      'functional.item9',
      'accessibility.item4',
    ],
    docs: {
      source: { transform: editorAiImageDescriptionSource },
      description: {
        story:
          'describeImage escreve o texto alternativo a partir da imagem. É chamado depois de inserir, nunca antes: descrever leva segundos e às vezes falha.',
      },
    },
  },
  render: () => ({
    Component: Editor,
    props: {
      content: CONTENTS.aiImageDescription,
      preset: 'advanced',
      labels: LABELS,
      class: 'nds-w-full',
      describeImage: async (file: File | null, src: string) => {
        // O dublê recebe as duas coisas que um serviço real pede: os bytes,
        // QUANDO existem, e uma URL. Imagem colada de outra página chega sem
        // arquivo — e um serviço que trabalha por URL descreve os dois.
        await new Promise((r) => setTimeout(r, 50));
        if (file) return `Descrição automática de ${file.name}`;
        return `Descrição automática de ${src.slice(src.lastIndexOf('/') + 1)}`;
      },
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = editorRoot(canvasElement);
    root.editor.commands.setContent('<p>descrição automática</p>');

    await step('functional.item8 — a imagem entra NA HORA, com o alt provisório', async () => {
      await expect(await root.insertImage(imageFile('grafico.png'))).toBe(true);
      const img = root.querySelector('img') as HTMLImageElement;
      // Sem esperar nada: o nome do arquivo segura a vaga. Prender a imagem até
      // a descrição chegar trocaria uma lacuna de acessibilidade por uma de
      // responsividade — e um serviço fora do ar travaria a edição.
      await expect(img.getAttribute('alt')).toBe('grafico.png');
    });

    await step('A descrição chega depois e substitui o provisório', async () => {
      // Espera de RELÓGIO, não `waitFor`: o laço com prazo é o que distingue
      // "demorou" de "não veio" — `waitFor` que nunca satisfaz pendura a aba sem
      // reprovar.
      await waitForAlt(root, 'Descrição automática de grafico.png');
    });

    await step('functional.item7 — COLAR e ARRASTAR arquivo passam pelo mesmo caminho', async () => {
      const pm = root.querySelector('.ProseMirror') as HTMLElement;

      root.editor.commands.setContent('<p>colar</p>');
      const pasteData = new DataTransfer();
      pasteData.items.add(imageFile('colada.png'));
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de colada.png');

      root.editor.commands.setContent('<p>arrastar</p>');
      const dragData = new DataTransfer();
      dragData.items.add(imageFile('solta.png'));
      // COM coordenadas dentro do editor: a lib abandona o `drop` antes de
      // chamar o gancho quando não resolve a posição, e um evento sintético em
      // (0, 0) cai fora da caixa.
      const contentBox = pm.getBoundingClientRect();
      pm.dispatchEvent(
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
      // abaixo da última linha é moldura, e soltar ali escapava para o navegador.
      root.editor.commands.setContent('<p>moldura</p>');
      const box = root.getBoundingClientRect();
      const dragData = new DataTransfer();
      dragData.items.add(imageFile('moldura.png'));

      // O `dragover` vem PRIMEIRO, e é ele que decide: só se o padrão for
      // cancelado ali o navegador entrega o `drop` à página. Esta asserção
      // existe porque a de baixo NÃO cobre isso — um `drop` sintético é entregue
      // de qualquer jeito, então o defeito no `dragover` passaria em verde.
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
      await expect(dropEvent.defaultPrevented).toBe(true);
      await waitForAlt(root, 'Descrição automática de moldura.png');
    });

    await step('A barra QUEBRA em linhas, e nada fica fora da vista', async () => {
      const toolbar = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
      await expect(getComputedStyle(toolbar).flexWrap).toBe('wrap');
      // Sem rolagem horizontal: com ela, o botão contextual que acabou de
      // aparecer nascia além da borda, e a única pista de que existia era
      // arrastar a barra para o lado.
      await expect(toolbar.scrollWidth).toBe(toolbar.clientWidth);
    });

    await step('Imagem COLADA de outra página também é descrita', async () => {
      // Colar de um site insere `<img src>` sem `alt` nenhum, montado pela lib a
      // partir do HTML da área de transferência — sem passar pela inserção do
      // componente. A varredura por `update` é o que o alcança, e ali não há
      // arquivo: só o endereço.
      root.editor.commands.setContent('<p>colada de fora</p>');
      const pm = root.querySelector('.ProseMirror') as HTMLElement;
      const clipboard = new DataTransfer();
      clipboard.setData('text/html', '<img src="https://exemplo.com/diagrama.png">');
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de diagrama.png');
    });

    await step('functional.item9 · accessibility.item4 — redimensionar sem ponteiro respeita o piso', async () => {
      root.editor.commands.setContent('<p>tamanho</p>');
      await expect(await root.insertImage(imageFile('grafico.png'))).toBe(true);
      selectImage(root);
      // A barra repinta no ciclo seguinte: sem o giro de relógio, o clique cai
      // num botão que ainda não sabe se pode agir.
      await settle();

      const img = root.querySelector('img') as HTMLImageElement;
      const startingWidth = Math.round(img.getBoundingClientRect().width);

      // O caminho que existe porque arrastar não pode ser o único (WCAG 2.5.7).
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageSmaller }));
      selectImage(root);
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(
        startingWidth - 40,
      );

      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageLarger }));
      selectImage(root);
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(startingWidth);

      // Piso: cliques demais não podem reduzir a imagem a um ponto.
      for (let i = 0; i < 40; i++) {
        const button = canvas.queryByRole('button', { name: LABELS.actions.imageSmaller });
        if (!button || (button as HTMLButtonElement).disabled) break;
        await userEvent.click(button);
        selectImage(root);
        await settle();
      }
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(48);

      // Voltar ao natural APAGA o atributo, e não grava a medida de hoje: com a
      // medida gravada, a folha perderia o direito de encolher a imagem numa
      // moldura estreita.
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageNatural }));
      selectImage(root);
      await expect(root.querySelector('img')?.hasAttribute('width')).toBe(false);
    });

    await step('E a pessoa corrige o que a IA escreveu', async () => {
      root.editor.commands.setContent('<p>correção</p>');
      await expect(await root.insertImage(imageFile('grafico.png'))).toBe(true);
      await waitForAlt(root, 'Descrição automática de grafico.png');
      selectImage(root);
      await settle();

      const open = canvas.getByRole('button', { name: LABELS.actions.imageAlt });
      await openRow(open);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.alt });
      await waitForFocus(field);
      // Abre com o que está lá: ver o texto é o que permite julgá-lo.
      await expect(field).toHaveValue('Descrição automática de grafico.png');

      await userEvent.clear(field);
      await userEvent.type(field, 'Gráfico de barras da receita por trimestre{Enter}');
      await expect(root.querySelector('img')).toHaveAttribute(
        'alt',
        'Gráfico de barras da receita por trimestre',
      );

      // O que a play deixa é o que a pessoa VÊ ao abrir a story.
      root.editor.commands.setContent(CONTENTS.aiImageDescription);
    });
  },
};
