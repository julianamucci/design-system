import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { onMounted, ref } from 'vue';
import { Editor } from './index';
import {
  LABELS,
  PIXEL_PNG_BASE64,
  selectNode,
  settle,
  tokenColor,
} from './editor.fixtures';
import {
  editorReadOnlySource,
  editorWithImageSource,
  editorWithTableSource,
} from './editor.source';

type EditorInstance = InstanceType<typeof Editor>;

let editorApi: EditorInstance | null = null;

const REPORT_CONTENT =
  '<h2>Relatório</h2><p>Texto com <mark>destaque</mark> e <a href="https://exemplo.com">link</a>.</p>';

const TABLE_CONTENT =
  '<p>Antes.</p><table><tbody><tr><th>Nome</th><th>Valor</th></tr>'
  + '<tr><td>a</td><td>1</td></tr></tbody></table>';

const IMAGE_CONTENT =
  `<p>Antes.</p><img src="data:image/png;base64,${PIXEL_PNG_BASE64}" alt="Ponto de exemplo">`;

const meta = {
  title: 'Components/Form/Editor/States',
  component: Editor,
  tags: ['form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%` e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: editorReadOnlySource },
      description: {
        component:
          'Situações em que o editor cai: somente leitura, cursor dentro de uma tabela e imagem selecionada. Nas duas últimas, o bloco daquele assunto revela os botões que só existem ali.',
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

/** A caixa contextual de um assunto, que a barra revela pelo nó sob o cursor. */
function contextBox(canvasElement: HTMLElement, node: string): HTMLElement {
  return canvasElement.querySelector(
    `[data-slot="editor-toolbar-context"][data-node="${node}"]`,
  ) as HTMLElement;
}

export const ReadOnly: Story = {
  render: (args) => ({
    components: { Editor },
    setup() {
      const editorRef = ref<EditorInstance | null>(null);
      onMounted(() => {
        editorApi = editorRef.value;
      });
      return { args, editorRef, content: REPORT_CONTENT };
    },
    template: `
      <div class="nds-w-full">
        <Editor ref="editorRef" v-bind="args" :content="content" :editable="false" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const instance = editorApi?.editor;
    if (!instance) throw new Error('a instância do editor não chegou à story');
    const field = canvasElement.querySelector('.ProseMirror') as HTMLElement;

    await step('A edição fica desligada, e o conteúdo segue visível', async () => {
      await expect(field).toHaveAttribute('contenteditable', 'false');
      await expect(instance.isEditable).toBe(false);
      await expect(field.textContent).toContain('Relatório');
      await expect(canvasElement.querySelector('h2')).toBeInTheDocument();
    });

    await step('A barra continua anunciada, com nome próprio em cada bloco', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: LABELS.groups.marks })).toBeInTheDocument();
    });

    await step('E a barra NÃO aplica comando', async () => {
      // `editor.commands` funciona num editor em leitura: `editable` vale para o
      // CAMPO, não para comando disparado por código. Sem a guarda da barra,
      // clicar em Negrito ligava a marca guardada e acendia o botão sem mudar
      // uma vírgula do HTML — a barra afirmando uma edição que o documento não
      // tem, e contradizendo o que `states.readOnly` promete nesta mesma página.
      const bold = canvas.getByRole('button', { name: LABELS.actions.bold });
      const before = instance.getHTML();
      instance.commands.setTextSelection({ from: 1, to: 6 });
      await userEvent.click(bold);
      await settle();

      // A asserção com DENTES é esta: sem a guarda a marca fica ativa na mesma
      // volta do laço, antes de qualquer redesenho — não há corrida a esperar, e
      // a ausência de efeito se lê no estado da instância.
      await expect(instance.isActive('bold')).toBe(false);
      await expect(instance.getHTML()).toBe(before);
      await expect(bold).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Os alternadores da barra usam o mesmo data-slot das cinco stacks', async () => {
      // Vanilla é a régua cross-stack, e lá cada alternador do grupo é
      // `[data-slot="toggle"]` — o mesmo nome que React, Svelte e Angular
      // escrevem. O `ToggleGroupItem` desta stack assina `toggle-group-item` no
      // próprio template, e quem alinha é o atributo de repasse da barra.
      const group = canvasElement.querySelector('[data-slot="toggle-group"]') as HTMLElement;
      await expect(group.querySelectorAll('[data-slot="toggle"]').length).toBeGreaterThan(0);
      await expect(canvasElement.querySelector('[data-slot="toggle-group-item"]')).toBeNull();
    });
  },
};

export const WithTable: Story = {
  parameters: {
    covers: ['functional.item10'],
    docs: { source: { transform: editorWithTableSource } },
  },
  render: (args) => ({
    components: { Editor },
    setup() {
      const editorRef = ref<EditorInstance | null>(null);
      onMounted(() => {
        editorApi = editorRef.value;
      });
      return { args, editorRef, content: TABLE_CONTENT };
    },
    template: `
      <div class="nds-w-full">
        <Editor ref="editorRef" v-bind="args" :content="content" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const instance = editorApi?.editor;
    if (!instance) throw new Error('a instância do editor não chegou à story');
    const box = contextBox(canvasElement, 'table');

    await step('Fora da tabela, o bloco dela não ocupa espaço na barra', async () => {
      // Precondição própria: o painel Interactions reexecuta no mesmo DOM, e
      // herdar o cursor da rodada anterior mediria o estado errado.
      instance.commands.setTextSelection(2);
      await settle();
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('functional.item10 — com o cursor na tabela, os botões dela aparecem', async () => {
      // A posição vem de uma VARREDURA: aritmética sobre o tamanho do documento
      // se desloca em silêncio quando um parágrafo entra ou sai.
      let cell = -1;
      instance.state.doc.descendants((node, pos) => {
        if (cell < 0 && node.type.name === 'tableHeader') cell = pos;
      });
      // Duas posições adiante do nó da célula: dentro do parágrafo que ela
      // guarda, que é onde o cursor de texto cabe.
      instance.commands.setTextSelection(cell + 2);
      await settle();

      await expect(instance.isActive('table')).toBe(true);
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

    await step('E os botões agem sobre a tabela sob o cursor', async () => {
      await expect(canvasElement.querySelectorAll('table tr')).toHaveLength(2);
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.rowAfter }));
      await settle();
      await expect(canvasElement.querySelectorAll('table tr')).toHaveLength(3);

      const headerCell = canvasElement.querySelector('table th') as HTMLElement;
      await expect(getComputedStyle(headerCell).backgroundColor).toBe(
        tokenColor(canvasElement, '--muted'),
      );
    });
  },
};

export const WithImage: Story = {
  parameters: {
    covers: ['functional.item9', 'accessibility.item4', 'visual.item3'],
    docs: { source: { transform: editorWithImageSource } },
  },
  render: (args) => ({
    components: { Editor },
    setup() {
      const editorRef = ref<EditorInstance | null>(null);
      onMounted(() => {
        editorApi = editorRef.value;
      });
      return { args, editorRef, content: IMAGE_CONTENT };
    },
    template: `
      <div class="nds-w-full">
        <Editor ref="editorRef" v-bind="args" :content="content" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const instance = editorApi?.editor;
    if (!instance) throw new Error('a instância do editor não chegou à story');

    /** Lê a largura GRAVADA no documento, que é o que sobrevive à releitura. */
    const storedWidth = (): unknown => {
      let width: unknown = null;
      instance.state.doc.descendants((node) => {
        if (node.type.name === 'image') width = node.attrs.width;
      });
      return width;
    };

    await step('A imagem entra com texto alternativo escrito', async () => {
      const image = canvasElement.querySelector('img') as HTMLImageElement;
      await expect(image).toHaveAttribute('alt', 'Ponto de exemplo');
    });

    await step('Selecionada, ela revela o bloco de imagem', async () => {
      selectNode(instance, 'image');
      await settle();
      await expect(getComputedStyle(contextBox(canvasElement, 'image')).display).not.toBe('none');
    });

    await step('visual.item3 — anel de foco na imagem e alça visível no canto', async () => {
      const envelope = canvasElement.querySelector(
        '.nds-editor-image.ProseMirror-selectednode',
      ) as HTMLElement;
      await expect(envelope).toBeInTheDocument();
      const envelopeStyle = getComputedStyle(envelope);
      await expect(envelopeStyle.outlineWidth).not.toBe('0px');
      await expect(envelopeStyle.outlineColor).toBe(tokenColor(canvasElement, '--ring'));

      const handle = canvasElement.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(getComputedStyle(handle).opacity).toBe('1');
      // A alça é decoração de ponteiro, e o `aria-hidden` vale para ela inteira.
      await expect(handle).toHaveAttribute('aria-hidden', 'true');
      // O gesto tem de nascer na ALÇA: com o ponteiro caindo no ícone, a captura
      // acontece num alvo que o movimento não escuta.
      const handleIcon = handle.querySelector('svg') as SVGElement;
      await expect(getComputedStyle(handleIcon).pointerEvents).toBe('none');
    });

    await step('functional.item9 e accessibility.item4 — os botões redimensionam sem ponteiro', async () => {
      // A largura de partida é ESCRITA pela play, e não herdada do exemplo: o
      // conteúdo é um ponto de 1×1, e a partir dele o primeiro passo cai no piso
      // de 48px — `48 >= 48` é asserção que não pode reprovar, e portão sem
      // dentes é pior que portão nenhum. Com um valor de partida acima do piso,
      // cada clique tem de mover exatamente um passo, para os dois lados.
      const START = 200;
      selectNode(instance, 'image');
      instance.chain().updateAttributes('image', { width: START }).run();
      selectNode(instance, 'image');
      await settle();
      await expect(Number(storedWidth())).toBe(START);

      // Cada passo reencontra a seleção: escrever atributo a refaz.
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageSmaller }));
      selectNode(instance, 'image');
      await settle();
      await expect(Number(storedWidth())).toBe(START - 40);

      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageLarger }));
      selectNode(instance, 'image');
      await settle();
      await expect(Number(storedWidth())).toBe(START);
    });

    await step('O piso de 48px é anunciado pelo próprio botão, que se desliga', async () => {
      // Com a largura no piso, diminuir deixa de ser possível — e o botão diz
      // isso antes do clique, em vez de aceitar e não fazer nada.
      const smaller = () =>
        canvas.getByRole('button', { name: LABELS.actions.imageSmaller }) as HTMLButtonElement;
      for (let i = 0; i < 40; i += 1) {
        if (smaller().disabled) break;
        await userEvent.click(smaller());
        selectNode(instance, 'image');
        await settle();
      }
      await expect(Number(storedWidth())).toBe(48);
      await expect(smaller().disabled).toBe(true);
    });

    await step('Voltar ao natural APAGA o atributo, e não grava a medida de hoje', async () => {
      // Gravada, ela congelaria a imagem no tamanho atual, e a folha deixaria de
      // poder encolhê-la numa moldura estreita.
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageNatural }));
      selectNode(instance, 'image');
      await settle();
      await expect(storedWidth()).toBeNull();
      await expect(canvasElement.querySelector('img')?.hasAttribute('width')).toBe(false);
    });

    await step('visual.item3 — a story FECHA com a imagem selecionada e visível', async () => {
      // O passo anterior deixa a imagem na largura natural, que aqui é 1×1: a
      // foto da comparação visual mostraria um ponto, e o anel de foco e a alça
      // que `visual.item3` promete não teriam onde caber. Fecha num tamanho em
      // que os dois se veem.
      selectNode(instance, 'image');
      instance.chain().updateAttributes('image', { width: 200 }).run();
      selectNode(instance, 'image');
      await settle();

      const image = canvasElement.querySelector('img') as HTMLImageElement;
      await expect(Math.round(image.getBoundingClientRect().width)).toBe(200);
      await expect(
        canvasElement.querySelector('.nds-editor-image.ProseMirror-selectednode'),
      ).toBeInTheDocument();
      const handle = canvasElement.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(getComputedStyle(handle).opacity).toBe('1');
    });
  },
};
