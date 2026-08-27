import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { onMounted, ref } from 'vue';
import { Editor } from './index';
import EditorDocs from '@/components/docs/EditorDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { editorSource } from './editor.source';
import {
  LABELS,
  closeRow,
  openRow,
  rowIsPainted,
  settle,
  tokenColor,
  tokenSize,
} from './editor.fixtures';

/**
 * A instância montada, alcançada pela story.
 *
 * O estado que importa (marca ativa, documento, transação) vive na instância, e
 * não no DOM: sem esta ponte a play só conseguiria clicar botão, e a pergunta
 * "a barra reflete o EDITOR?" ficaria sem como ser feita.
 */
type EditorInstance = InstanceType<typeof Editor>;

let editorApi: EditorInstance | null = null;

const meta = {
  title: 'UI/Editor',
  component: Editor,
  tags: ['autodocs', 'form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%` e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    docs: { page: withAutoDocsTab(EditorDocs), source: { transform: editorSource } },
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Conteúdo inicial em HTML. É sanitizado antes de chegar à biblioteca.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    editable: {
      control: 'boolean',
      description: 'Quando falso, o conteúdo vira leitura e a barra deixa de agir.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    preset: {
      control: 'inline-radio',
      options: ['basic', 'advanced'],
      description: 'Conjunto de botões exposto na barra.',
      table: {
        type: { summary: '"basic" | "advanced"' },
        defaultValue: { summary: '"advanced"' },
      },
    },
    labels: {
      // Fixado pela story: é um objeto de trinta e sete nomes acessíveis, e um
      // control de objeto no painel não ensina nada sobre ele.
      control: false,
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão e dos campos de entrada.',
      table: { type: { summary: 'EditorLabels' }, defaultValue: { summary: '—' } },
    },
    resolveImage: {
      control: false,
      description:
        'Decide de onde vem o endereço da imagem escolhida. Devolver nulo recusa a inserção, sem erro.',
      table: {
        type: { summary: '(file: File) => Promise<string | null>' },
        defaultValue: { summary: 'arquivo embutido em base64' },
      },
    },
    describeImage: {
      control: false,
      description:
        'Escreve o texto alternativo a partir da imagem. Recebe o arquivo quando existe.',
      table: {
        type: { summary: '(file: File | null, src: string) => Promise<string | null>' },
        defaultValue: { summary: '—' },
      },
    },
    onChange: {
      control: false,
      description: 'Disparado a cada mudança do conteúdo, com o HTML atual.',
      table: { type: { summary: '(html: string) => void' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    content: '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>',
    editable: true,
    preset: 'advanced',
    labels: LABELS,
    onChange: fn(),
  },
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item5',
      'functional.item6',
      'functional.item11',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item5',
      'visual.item2',
    ],
  },
  render: (args) => ({
    components: { Editor },
    setup() {
      const editorRef = ref<EditorInstance | null>(null);
      onMounted(() => {
        editorApi = editorRef.value;
      });
      return { args, editorRef };
    },
    // `content` só é lido na montagem: o `key` é o que faz o control valer.
    template: `
      <div class="nds-w-full">
        <Editor
          ref="editorRef"
          :key="String(args.content)"
          v-bind="args"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as HTMLElement;
    const instance = editorApi?.editor;
    if (!instance) throw new Error('a instância do editor não chegou à story');

    // A play parte de um documento CONHECIDO, escrito por ela: o painel
    // Interactions reexecuta no mesmo DOM, sem remontar, e sem este reinício a
    // segunda rodada acharia a fórmula que a primeira inseriu.
    instance.commands.setContent('<p>massa e energia</p>');
    await settle();

    await step('accessibility.item1 — a barra se anuncia, e cada bloco tem nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      for (const name of [LABELS.groups.marks, LABELS.groups.headings, LABELS.groups.lists]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
    });

    await step('accessibility.item2 — a área editável carrega nome acessível', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      await expect(field).toHaveAttribute('aria-label', LABELS.editorField);
    });

    await step('accessibility.item5 — nenhuma imagem entra sem texto alternativo', async () => {
      const withoutAlt = Array.from(root.querySelectorAll('img')).filter(
        (img) => !img.getAttribute('alt'),
      );
      await expect(withoutAlt).toHaveLength(0);
    });

    await step('accessibility.item3 e functional.item2 — uma parada só, setas atravessando os blocos', async () => {
      const toolbar = canvas.getByRole('toolbar', { name: LABELS.toolbar });
      const stops = Array.from(toolbar.querySelectorAll('button')).filter((b) => b.tabIndex === 0);
      await expect(stops).toHaveLength(1);

      const boldButton = canvas.getByRole('button', { name: LABELS.actions.bold });
      const italicButton = canvas.getByRole('button', { name: LABELS.actions.italic });
      boldButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await settle();
      await expect(italicButton).toHaveFocus();
      await expect(italicButton.tabIndex).toBe(0);
      await expect(boldButton.tabIndex).toBe(-1);

      // O salto que importa: do último botão do bloco de marcas para o primeiro
      // do bloco de títulos. É por isso que os grupos abrem mão do teclado.
      const lastMarkButton = canvas.getByRole('button', { name: LABELS.actions.highlight });
      const headingOne = canvas.getByRole('button', { name: LABELS.actions.h1 });
      lastMarkButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(headingOne).toHaveFocus();

      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(boldButton).toHaveFocus();
    });

    await step('functional.item1 — o botão reflete o EDITOR, não o próprio clique', async () => {
      const boldButton = canvas.getByRole('button', { name: LABELS.actions.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão acende.
      instance.chain().selectAll().setBold().run();
      await settle();
      await expect(boldButton).toHaveAttribute('aria-pressed', 'true');
      instance.chain().selectAll().unsetBold().run();
      await settle();
      await expect(boldButton).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Título é escolha única: ligar o H2 desliga o H1', async () => {
      const h1 = canvas.getByRole('button', { name: LABELS.actions.h1 });
      const h2 = canvas.getByRole('button', { name: LABELS.actions.h2 });
      // CURSOR, e não `selectAll`: a seleção total abrange o parágrafo vazio do
      // fim, e com dois blocos de tipos diferentes na seleção o estado ativo
      // responde falso — medido, com o HTML já em título.
      instance.chain().setTextSelection(2).setHeading({ level: 1 }).run();
      await settle();
      await expect(h1).toHaveAttribute('aria-pressed', 'true');
      await expect(h2).toHaveAttribute('aria-pressed', 'false');

      instance.chain().setTextSelection(2).setHeading({ level: 2 }).run();
      await settle();
      await expect(h1).toHaveAttribute('aria-pressed', 'false');
      await expect(h2).toHaveAttribute('aria-pressed', 'true');

      instance.chain().setTextSelection(2).setParagraph().run();
      await settle();
      await expect(h2).toHaveAttribute('aria-pressed', 'false');
    });

    await step('visual.item2 — citação, bloco de código e tabela saem no desenho do tema', async () => {
      instance.commands.setContent(
        '<blockquote><p>citação</p></blockquote>'
          + '<pre><code>codigo()</code></pre>'
          + '<table><tbody><tr><th>Nome</th></tr><tr><td>a</td></tr></tbody></table>'
          + '<ul data-type="taskList"><li data-checked="false"><label>'
          + '<input type="checkbox"></label><div><p>tarefa</p></div></li></ul>',
      );
      await settle();

      const primaryColor = tokenColor(root, '--primary');
      const mutedColor = tokenColor(root, '--muted');

      // A cor vai na BARRA lateral, e o texto fica em `--foreground`: cor
      // semântica em texto corrido raramente alcança os 4.5:1 que ele exige.
      const quote = root.querySelector('blockquote') as HTMLElement;
      const quoteStyle = getComputedStyle(quote);
      await expect(quoteStyle.borderInlineStartWidth).not.toBe('0px');
      await expect(quoteStyle.borderInlineStartColor).toBe(primaryColor);

      const block = root.querySelector('pre') as HTMLElement;
      await expect(getComputedStyle(block).backgroundColor).toBe(mutedColor);
      // O `<code>` de dentro não repete o fundo: a biblioteca sempre escreve
      // `<pre><code>`, e dois realces encaixados apareceriam um dentro do outro.
      const innerCode = block.querySelector('code') as HTMLElement;
      await expect(getComputedStyle(innerCode).backgroundColor).toBe('rgba(0, 0, 0, 0)');

      const headerCell = root.querySelector('table th') as HTMLElement;
      await expect(getComputedStyle(headerCell).backgroundColor).toBe(mutedColor);

      // A caixa é quem marca a tarefa, então o marcador de lista sai de cena —
      // dois sinais para a mesma coisa.
      const taskList = root.querySelector('ul[data-type="taskList"]') as HTMLElement;
      await expect(getComputedStyle(taskList).listStyleType).toBe('none');
    });

    await step('O título e o link do conteúdo saem na escala e na cor do sistema', async () => {
      instance.commands.setContent(
        '<h1>título</h1><p>texto com <a href="https://exemplo.com">link</a>.</p>',
      );
      await settle();

      // A comparação é com o TOKEN, não com um número escrito à mão: número à
      // mão passa a mentir no dia em que a escada muda de base.
      const heading = root.querySelector('h1') as HTMLElement;
      await expect(getComputedStyle(heading).fontSize).toBe(tokenSize(root, '--text-h1'));

      const anchor = root.querySelector('a') as HTMLElement;
      const anchorStyle = getComputedStyle(anchor);
      await expect(anchorStyle.color).toBe(tokenColor(root, '--primary'));
      // Sublinhado não é enfeite: sem ele a única pista de que há link é a cor.
      await expect(anchorStyle.textDecorationLine).toContain('underline');
    });

    await step('functional.item3, item4 e item5 — a linha do link abre, valida e desfaz', async () => {
      instance.commands.setContent('<p>massa e energia</p>');
      await settle();

      const open = canvas.getByRole('button', { name: LABELS.actions.link });
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.link });
      await expect(field).toHaveFocus();

      // `javascript:` é o caso que a lista de esquemas existe para barrar: o
      // campo fica marcado como inválido e a linha NÃO fecha.
      await userEvent.type(field, 'javascript:alert(1){Enter}');
      await settle();
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);
      await expect(root.querySelector('a')).toBeNull();

      await userEvent.clear(field);
      instance.chain().selectAll().run();
      await userEvent.type(field, 'exemplo.com{Enter}');
      await settle();
      const anchor = root.querySelector('a');
      await expect(anchor).toBeInTheDocument();
      // Endereço sem esquema é o que a pessoa digita; quem completa é a barra.
      await expect(anchor).toHaveAttribute('href', 'https://exemplo.com');
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await expect(open).toHaveFocus();

      // Com o cursor no link, abrir mostra o endereço ATUAL — é o que torna a
      // linha editável em vez de só um formulário de inserção.
      await openRow(open);
      await expect(field).toHaveValue('https://exemplo.com');

      const unlink = canvas.getByRole('button', { name: LABELS.fields.linkRemove });
      await expect(getComputedStyle(unlink).display).not.toBe('none');
      await userEvent.click(unlink);
      await settle();
      await expect(root.querySelector('a')).toBeNull();

      // Sem link no trecho, o botão some. A asserção lê o `display` COMPUTADO:
      // `.nds-button` declara `inline-flex`, e declaração de autor vence o
      // `[hidden]` do navegador.
      await openRow(open);
      await expect(getComputedStyle(unlink).display).toBe('none');

      // Apagar o campo e confirmar continua tirando o link — o caminho que a
      // pessoa deduz, e que segue valendo.
      await userEvent.type(field, 'exemplo.com{Enter}');
      await settle();
      await expect(root.querySelector('a')).toBeInTheDocument();
      await openRow(open);
      await userEvent.clear(field);
      await userEvent.keyboard('{Enter}');
      await settle();
      await expect(root.querySelector('a')).toBeNull();
    });

    await step('functional.item6 — a fórmula entra, é renderizada e se ATUALIZA', async () => {
      const open = canvas.getByRole('button', { name: LABELS.actions.formula });
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      await expect(field).toHaveFocus();
      await userEvent.type(field, 'E = mc^2');
      await userEvent.click(canvas.getByRole('button', { name: LABELS.fields.formulaConfirm }));
      await settle();

      const formulas = root.querySelectorAll('[data-type="inline-math"]');
      await expect(formulas).toHaveLength(1);
      await expect(formulas[0]).toHaveAttribute('data-latex', 'E = mc^2');
      // A notação matemática acessível viaja junto do desenho visual. A
      // asserção NÃO é `toBeInTheDocument`: `<math>` não é `HTMLElement`, e o
      // jest-dom reprova por tipo, o que parece ausência.
      const mathml = formulas[0].querySelector('math');
      await expect(mathml).not.toBeNull();

      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);
      await expect(open).toHaveFocus();

      // O mesmo botão abre e FECHA, sem inserir nada.
      await openRow(open);
      await closeRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);

      // Fórmula sob o cursor se EDITA, não duplica: o que se vê na tela é o
      // resultado renderizado, então abrir com o LaTeX de volta é o único
      // caminho para corrigir uma.
      let position = -1;
      instance.state.doc.descendants((node, pos) => {
        if (node.type.name === 'inlineMath') position = pos;
      });
      instance.commands.setNodeSelection(position);
      await settle();

      await openRow(open);
      await expect(field).toHaveValue('E = mc^2');
      await userEvent.clear(field);
      await userEvent.type(field, 'a^2 + b^2{Enter}');
      await settle();

      const after = root.querySelectorAll('[data-type="inline-math"]');
      await expect(after).toHaveLength(1);
      await expect(after[0]).toHaveAttribute('data-latex', 'a^2 + b^2');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const open = canvas.getByRole('button', { name: LABELS.actions.formula });
      instance.commands.setContent('<p>massa e energia</p>');
      await settle();
      await openRow(open);
      const field = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      // Sem chaves de propósito: no teclado sintético `{` abre descritor de
      // tecla, e um LaTeX cheio de chaves testaria a escapagem, não o editor.
      await userEvent.type(field, '\\comandoquenaoexiste{Enter}');
      await settle();

      const errorNode = root.querySelector('.inline-math-error');
      await expect(errorNode).toBeInTheDocument();
      await expect(errorNode?.textContent).toContain('\\comandoquenaoexiste');
    });

    await step('functional.item11 — o callback de mudança recebe o HTML atual', async () => {
      instance.commands.setContent('<p>massa e energia</p>');
      await settle();
      await expect(args.onChange).toHaveBeenCalled();
      const spy = args.onChange as unknown as { mock: { calls: unknown[][] } };
      await expect(String(spy.mock.calls.at(-1)?.[0])).toContain('massa e energia');

      // O que a play deixa é o que a pessoa VÊ ao abrir a story, e é o que a
      // comparação de imagem fotografa.
      instance.commands.setContent(
        '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>'
          + '<blockquote><p>A citação leva barra lateral na cor da marca.</p></blockquote>'
          + '<pre><code>const c = 299792458;</code></pre>',
      );
      await settle();
    });
  },
};
