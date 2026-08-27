import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { onMounted, ref } from 'vue';
import { Editor } from './index';
import { LABELS, openRow, pixelPngFile, settle, waitForAlt } from './editor.fixtures';
import { editorAiImageDescriptionSource, editorCustomImageStorageSource } from './editor.source';

type EditorInstance = InstanceType<typeof Editor>;

let editorApi: EditorInstance | null = null;

const meta = {
  title: 'UI/Editor/Compositions',
  component: Editor,
  tags: ['form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%` e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: editorCustomImageStorageSource },
      description: {
        component:
          'As duas costuras que o editor deixa abertas: de onde vem o endereço da imagem, e quem escreve o texto alternativo dela.',
      },
    },
  },
  args: { labels: LABELS },
  argTypes: {
    labels: {
      // Fixado pela story: é um objeto de trinta e sete nomes acessíveis, e um
      // control de objeto no painel não ensina nada sobre ele.
      control: false,
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão e dos campos de entrada.',
      table: { type: { summary: 'EditorLabels' }, defaultValue: { summary: '—' } },
    },
  },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O armazenamento é decisão de quem consome, não do design system.
 *
 * O padrão embute o arquivo em base64, que é o que faz o exemplo funcionar sem
 * servidor nenhum. Aqui o resolvedor é outro — um envio fingido que devolve a
 * URL de um CDN, e que RECUSA arquivo acima de um limite.
 */
export const CustomImageStorage: Story = {
  render: (args) => ({
    components: { Editor },
    setup() {
      const editorRef = ref<EditorInstance | null>(null);
      onMounted(() => {
        editorApi = editorRef.value;
      });
      // Recusa é `null`, e não exceção: arquivo grande demais, formato fora da
      // política, envio negado. A barra não insere nada e segue.
      const resolveImage = async (file: File): Promise<string | null> => {
        if (file.size > 1024) return null;
        return `https://cdn.exemplo.com/${file.name}`;
      };
      return {
        args,
        editorRef,
        resolveImage,
        content: '<p>O armazenamento da imagem é decisão de quem consome.</p>',
      };
    },
    template: `
      <div class="nds-w-full">
        <Editor
          ref="editorRef"
          v-bind="args"
          :content="content"
          :resolve-image="resolveImage"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const api = editorApi;
    const instance = api?.editor;
    if (!api || !instance) throw new Error('a instância do editor não chegou à story');
    instance.commands.setContent('<p>armazenamento próprio</p>');
    await settle();

    await step('O endereço vem do resolvedor, não do arquivo', async () => {
      const small = new File([new Uint8Array(10)], 'logo.png', { type: 'image/png' });
      await expect(await api.insertImage(small)).toBe(true);
      await settle();
      const image = canvasElement.querySelector('img') as HTMLImageElement;
      await expect(image.getAttribute('src')).toBe('https://cdn.exemplo.com/logo.png');
      // Nada embutido: o arquivo não entrou no documento.
      await expect(image.getAttribute('src')).not.toContain('data:');
    });

    await step('Recusar não insere nada — e não é erro', async () => {
      const large = new File([new Uint8Array(2048)], 'foto.png', { type: 'image/png' });
      await expect(await api.insertImage(large)).toBe(false);
      await settle();
      await expect(canvasElement.querySelectorAll('img')).toHaveLength(1);
    });
  },
};

/**
 * A costura de DESCRIÇÃO: quem consome liga um serviço de visão.
 *
 * O que a story verifica não é a qualidade da descrição — é o contrato em volta
 * dela: a imagem entra na hora, a descrição chega depois, e quem publica pode
 * corrigir o que foi proposto.
 */
export const AiImageDescription: Story = {
  parameters: {
    covers: ['functional.item7', 'functional.item8'],
    docs: { source: { transform: editorAiImageDescriptionSource } },
  },
  render: (args) => ({
    components: { Editor },
    setup() {
      const editorRef = ref<EditorInstance | null>(null);
      onMounted(() => {
        editorApi = editorRef.value;
      });
      // O dublê recebe as duas coisas que um serviço real pede: os bytes,
      // QUANDO existem, e um endereço. Imagem colada de outra página chega sem
      // arquivo — e um serviço que trabalha por endereço descreve os dois casos.
      const describeImage = async (file: File | null, src: string): Promise<string | null> => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const name = file ? file.name : src.slice(src.lastIndexOf('/') + 1);
        return `Descrição automática de ${name}`;
      };
      return {
        args,
        editorRef,
        describeImage,
        content: '<p>A IA propõe a descrição; quem publica confere.</p>',
      };
    },
    template: `
      <div class="nds-w-full">
        <Editor
          ref="editorRef"
          v-bind="args"
          :content="content"
          :describe-image="describeImage"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as HTMLElement;
    const api = editorApi;
    const instance = api?.editor;
    if (!api || !instance) throw new Error('a instância do editor não chegou à story');

    const file = pixelPngFile('grafico.png');

    await step('functional.item8 — a imagem entra NA HORA, com o texto provisório', async () => {
      instance.commands.setContent('<p>descrição automática</p>');
      await settle();
      await expect(await api.insertImage(file)).toBe(true);
      await settle();
      const image = canvasElement.querySelector('img') as HTMLImageElement;
      // Sem esperar nada: o nome do arquivo segura a vaga. Prender a imagem até
      // a descrição chegar trocaria uma lacuna de acessibilidade por uma de
      // responsividade — e um serviço fora do ar travaria a edição.
      await expect(image.getAttribute('alt')).toBe('grafico.png');
    });

    await step('E a descrição chega depois, substituindo o provisório', async () => {
      // Espera de RELÓGIO: o laço com prazo distingue "demorou" de "não veio", e
      // o segundo REPROVA.
      await waitForAlt(root, 'Descrição automática de grafico.png');
    });

    await step('functional.item7 — colar arquivo passa pelo mesmo caminho do botão', async () => {
      instance.commands.setContent('<p>colar</p>');
      await settle();
      const editable = root.querySelector('.ProseMirror') as HTMLElement;
      const pasted = new DataTransfer();
      pasted.items.add(pixelPngFile('colada.png'));
      editable.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasted, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de colada.png');
    });

    await step('E arrastar também, inclusive soltando na MOLDURA, fora do texto', async () => {
      instance.commands.setContent('<p>arrastar</p>');
      await settle();
      const dragged = new DataTransfer();
      dragged.items.add(pixelPngFile('moldura.png'));

      // O `dragover` vem PRIMEIRO, e é ele que decide o caso: só se o padrão for
      // cancelado ali o navegador entrega o `drop` à página — senão ele trata o
      // arquivo como navegação e o abre numa aba.
      const dragOver = new DragEvent('dragover', {
        dataTransfer: dragged,
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(dragOver);
      await expect(dragOver.defaultPrevented).toBe(true);

      const frame = root.getBoundingClientRect();
      const dropped = new DragEvent('drop', {
        dataTransfer: dragged,
        bubbles: true,
        cancelable: true,
        clientX: frame.left + frame.width / 2,
        clientY: frame.bottom - 4,
      });
      root.dispatchEvent(dropped);
      // O padrão PRECISA ser cancelado: é ele que faz o navegador abrir o
      // arquivo. Asserção separada porque a imagem entrar não prova isso.
      await expect(dropped.defaultPrevented).toBe(true);
      await waitForAlt(root, 'Descrição automática de moldura.png');
    });

    await step('Imagem COLADA de outra página também é descrita, e sem arquivo nenhum', async () => {
      instance.commands.setContent('<p>colada de fora</p>');
      await settle();
      const editable = root.querySelector('.ProseMirror') as HTMLElement;
      const pasted = new DataTransfer();
      pasted.setData('text/html', '<img src="https://exemplo.com/diagrama.png">');
      editable.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasted, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de diagrama.png');
    });

    await step('E quem publica corrige o que foi proposto', async () => {
      instance.commands.setContent('<p>correção</p>');
      await settle();
      await expect(await api.insertImage(file)).toBe(true);
      await waitForAlt(root, 'Descrição automática de grafico.png');

      let position = -1;
      instance.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image') position = pos;
      });
      instance.commands.setNodeSelection(position);
      await settle();

      const open = canvas.getByRole('button', { name: LABELS.actions.imageAlt });
      await openRow(open);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.alt });
      // Abre com o que está lá: ver o texto é o que permite julgá-lo.
      await expect(field).toHaveValue('Descrição automática de grafico.png');

      await userEvent.clear(field);
      await userEvent.type(field, 'Gráfico de barras da receita por trimestre{Enter}');
      await settle();
      await expect(canvasElement.querySelector('img')).toHaveAttribute(
        'alt',
        'Gráfico de barras da receita por trimestre',
      );
    });
  },
};
