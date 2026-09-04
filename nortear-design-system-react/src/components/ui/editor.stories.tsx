import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Editor } from './editor';
import { editorSource } from './editor.source';
import {
  EditorCanvas,
  editorLabels,
  PLAYGROUND_CONTENT,
  closeRow,
  editorHandle,
  openRow,
  rowIsPainted,
  waitUntil,
} from './editor.fixtures';
import { EditorDocs } from '@/components/docs/EditorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'Components/Form/Editor',
  component: Editor,
  tags: ['autodocs', 'form'],
  parameters: {
    // `padded`, nunca `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até o texto — a barra quebra em cinco linhas e a story
    // deixa de mostrar o que existe para mostrar.
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(EditorDocs),
      source: { transform: editorSource },
    },
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
      control: { type: 'inline-radio' },
      options: ['basic', 'advanced'],
      description:
        'Conjunto de botões exposto na barra. Muda o que a barra expõe, não o que o documento aceita.',
      table: {
        type: { summary: '"basic" | "advanced"' },
        defaultValue: { summary: '"advanced"' },
      },
    },
    labels: {
      control: false,
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão e dos campos de entrada. Não há texto visível de onde deduzi-los.',
      table: { type: { summary: 'EditorLabels' }, defaultValue: { summary: '—' } },
    },
    onChange: {
      control: false,
      description:
        'Disparado a cada mudança do conteúdo, com o HTML atual. Movimento de cursor não dispara.',
      table: { type: { summary: '(html: string) => void' }, defaultValue: { summary: '—' } },
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
        'Escreve o texto alternativo a partir da imagem. Recebe o arquivo quando existe: imagem colada de outra página chega só como endereço.',
      table: {
        type: { summary: '(file: File | null, src: string) => Promise<string | null>' },
        defaultValue: { summary: '—' },
      },
    },
    className: {
      control: false,
      description: 'Classes extras na moldura.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    content: PLAYGROUND_CONTENT,
    editable: true,
    preset: 'advanced',
    // `labels` está aqui porque é prop OBRIGATÓRIA, e é a API Reference que a
    // documenta — não porque o render a consuma. Quem resolve os rótulos é o
    // canvas, lendo o conteúdo compartilhado no idioma CORRENTE: os args são
    // avaliados uma vez, na carga do módulo, e não veriam a troca de idioma.
    labels: editorLabels(),
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
    ],
  },
  render: (args) => (
    <EditorCanvas
      content={args.content}
      editable={args.editable}
      preset={args.preset}
      onChange={args.onChange}
    />
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const handle = editorHandle(canvasElement);
    const editor = handle.editor!;
    const root = handle.root!;
    // Do conteúdo compartilhado, no idioma corrente — a mesma leitura que o
    // canvas faz para desenhar a barra.
    const L = editorLabels();

    // A play parte de um documento CONHECIDO, escrito por ela.
    //
    // O painel Interactions reexecuta no mesmo DOM, sem remontar: sem este
    // reinício, a segunda rodada acharia a fórmula que a primeira inseriu e a
    // contagem de "uma fórmula" passaria a mentir.
    editor.commands.setContent('<p>massa e energia</p>');

    await step('A barra se anuncia, e cada bloco tem nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: L.toolbar })).toBeInTheDocument();
      for (const name of [L.groups.marks, L.groups.headings, L.groups.lists]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
    });

    await step('A área editável tem nome acessível próprio', async () => {
      // A lib dá `role="textbox"` ao elemento editável, e campo com papel de
      // campo e sem nome é violação de nome acessível de campo. Não há rótulo
      // visível a que apontar: a moldura inteira é o campo.
      const field = canvas.getByRole('textbox', { name: L.editorField });
      await expect(field).toHaveClass('ProseMirror');
    });

    await step('Uma parada de tabulação só, e as setas ATRAVESSAM os grupos', async () => {
      const toolbar = canvas.getByRole('toolbar', { name: L.toolbar });
      const stops = Array.from(toolbar.querySelectorAll('button')).filter((b) => b.tabIndex === 0);
      await expect(stops).toHaveLength(1);

      const boldButton = canvas.getByRole('button', { name: L.actions.bold });
      const italicButton = canvas.getByRole('button', { name: L.actions.italic });
      boldButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(italicButton).toHaveFocus();
      await expect(italicButton.tabIndex).toBe(0);
      await expect(boldButton.tabIndex).toBe(-1);

      // O salto que importa: do último botão do grupo de marcas para o primeiro
      // do grupo de títulos. É por isso que os grupos são `role="group"` — com
      // barra dentro de barra, a navegação morreria na borda do primeiro grupo.
      const lastMarkButton = canvas.getByRole('button', { name: L.actions.highlight });
      const headingOne = canvas.getByRole('button', { name: L.actions.h1 });
      lastMarkButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(headingOne).toHaveFocus();

      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(boldButton).toHaveFocus();
    });

    await step('Os botões refletem o estado do EDITOR, não o próprio clique', async () => {
      const boldButton = canvas.getByRole('button', { name: L.actions.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão tem de
      // acender. É o que distingue uma barra presa ao editor de uma com estado
      // próprio.
      editor.chain().selectAll().setBold().run();
      await waitUntil(
        () => boldButton.getAttribute('aria-pressed') === 'true',
        'o botão de negrito acender',
      );
      editor.chain().selectAll().unsetBold().run();
      await waitUntil(
        () => boldButton.getAttribute('aria-pressed') === 'false',
        'o botão de negrito apagar',
      );
    });

    await step('Título é escolha única: ligar o H2 desliga o H1', async () => {
      const h1 = canvas.getByRole('button', { name: L.actions.h1 });
      const h2 = canvas.getByRole('button', { name: L.actions.h2 });
      // CURSOR, não `selectAll`. A barra reflete o bloco onde o cursor está, e
      // `selectAll` abrange também o parágrafo vazio que a lib mantém no fim do
      // documento: com dois blocos de tipos diferentes na seleção, `isActive`
      // responde falso.
      editor.chain().setTextSelection(2).setHeading({ level: 1 }).run();
      await waitUntil(() => h1.getAttribute('aria-pressed') === 'true', 'o H1 acender');
      await expect(h2).toHaveAttribute('aria-pressed', 'false');

      editor.chain().setTextSelection(2).setHeading({ level: 2 }).run();
      await waitUntil(() => h2.getAttribute('aria-pressed') === 'true', 'o H2 acender');
      // O que o passo prova: um bloco tem UM tipo, e ligar o segundo desliga o
      // primeiro sem que ninguém precise desligá-lo.
      await expect(h1).toHaveAttribute('aria-pressed', 'false');

      editor.chain().setTextSelection(2).setParagraph().run();
      await waitUntil(() => h2.getAttribute('aria-pressed') === 'false', 'o H2 apagar');
    });

    await step('O callback de mudança recebe o HTML atual', async () => {
      editor.commands.setContent('<p>massa e energia</p>');
      await expect(args.onChange).toHaveBeenCalled();
      const last = (args.onChange as ReturnType<typeof fn>).mock.calls.at(-1)?.[0];
      await expect(String(last)).toContain('massa e energia');
    });

    await step('O link só aceita esquema da lista, e vazio desfaz', async () => {
      editor.commands.setContent('<p>massa e energia</p>');

      const open = canvas.getByRole('button', { name: L.actions.link });
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);

      const field = canvas.getByRole('textbox', { name: L.fields.link });
      await expect(field).toHaveFocus();

      // `javascript:` é o caso que a lista de esquemas existe para barrar. O
      // campo fica marcado como inválido e a linha NÃO fecha.
      await userEvent.type(field, 'javascript:alert(1){Enter}');
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);
      await expect(root.querySelector('a')).toBeNull();

      await userEvent.clear(field);
      editor.chain().selectAll().run();
      await userEvent.type(field, 'exemplo.com{Enter}');
      const anchor = root.querySelector('a');
      await expect(anchor).toBeInTheDocument();
      // Endereço sem esquema é o que a pessoa digita; quem completa é a barra.
      await expect(anchor).toHaveAttribute('href', 'https://exemplo.com');
      // Sublinhado além da cor: cor sozinha não é pista para quem não distingue
      // as duas (WCAG 1.4.1).
      await expect(getComputedStyle(anchor!).textDecorationLine).toContain('underline');
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await expect(open).toHaveFocus();

      // Com o cursor no link, abrir mostra o endereço ATUAL — é o que torna a
      // linha editável em vez de só um formulário de inserção.
      await openRow(open);
      await expect(field).toHaveValue('https://exemplo.com');

      // O botão de tirar só existe quando há link — botão que não faz nada é
      // ruído, e desabilitado seria pior: anuncia a ação e nega em seguida.
      const unlink = canvas.getByRole('button', { name: L.fields.linkRemove });
      await expect(getComputedStyle(unlink).display).not.toBe('none');
      await userEvent.click(unlink);
      await expect(root.querySelector('a')).toBeNull();

      // Sem link no trecho, ele some. A asserção lê o `display` COMPUTADO: o
      // `.nds-button` declara `display: inline-flex`, e declaração de autor
      // vence o `[hidden]` do navegador.
      await openRow(open);
      await expect(getComputedStyle(unlink).display).toBe('none');

      // Apagar o campo e confirmar continua tirando o link — o caminho antigo,
      // que agora é atalho e não a única porta.
      await userEvent.type(field, 'exemplo.com{Enter}');
      await expect(root.querySelector('a')).toBeInTheDocument();
      await openRow(open);
      await userEvent.clear(field);
      await userEvent.keyboard('{Enter}');
      await expect(root.querySelector('a')).toBeNull();
    });

    await step('A fórmula entra pelo botão e é renderizada pelo KaTeX', async () => {
      const open = canvas.getByRole('button', { name: L.actions.formula });
      await expect(open).toHaveAttribute('aria-expanded', 'false');
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);

      const field = canvas.getByRole('textbox', { name: L.fields.formula });
      await expect(field).toHaveFocus();
      await userEvent.type(field, 'E = mc^2');
      await userEvent.click(canvas.getByRole('button', { name: L.fields.formulaConfirm }));

      const formulas = root.querySelectorAll('[data-type="inline-math"]');
      await expect(formulas).toHaveLength(1);
      await expect(formulas[0]).toHaveAttribute('data-latex', 'E = mc^2');
      // O KaTeX escreve MathML junto do HTML visual — é assim que a fórmula
      // chega ao leitor de tela em vez de virar um amontoado de elementos.
      //
      // A asserção NÃO é `toBeInTheDocument`: `<math>` é `MathMLElement`, e o
      // jest-dom só aceita `HTMLElement` ou `SVGElement` — reprova com
      // "received value must be an HTMLElement", que parece ausência e é tipo.
      const mathml = formulas[0].querySelector('math');
      await expect(mathml).not.toBeNull();
      await expect(mathml?.textContent).toContain('E');

      // A linha fecha e devolve o foco a quem a abriu.
      await expect(open).toHaveAttribute('aria-expanded', 'false');
      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);
      await expect(open).toHaveFocus();

      // E o mesmo botão abre e FECHA, sem inserir nada.
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);
      await closeRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);

      // Fórmula sob o cursor se EDITA, não duplica. O que se vê na tela é o
      // resultado renderizado, então abrir com o LaTeX de volta é o único
      // caminho para corrigir uma.
      let position = -1;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'inlineMath') position = pos;
      });
      editor.commands.setNodeSelection(position);

      await openRow(open);
      await expect(field).toHaveValue('E = mc^2');
      await userEvent.clear(field);
      await userEvent.type(field, 'a^2 + b^2{Enter}');

      const after = root.querySelectorAll('[data-type="inline-math"]');
      await expect(after).toHaveLength(1);
      await expect(after[0]).toHaveAttribute('data-latex', 'a^2 + b^2');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const open = canvas.getByRole('button', { name: L.actions.formula });
      await openRow(open);
      const field = canvas.getByRole('textbox', { name: L.fields.formula });
      // Sem chaves de propósito: no `userEvent.type`, `{` abre descritor de
      // tecla, e um LaTeX cheio de chaves testaria mais a escapagem do teclado
      // sintético que o editor. Comando inexistente erra igual.
      await userEvent.clear(field);
      await userEvent.type(field, '\\comandoquenaoexiste{Enter}');

      const errorNode = root.querySelector('.inline-math-error');
      await expect(errorNode).toBeInTheDocument();
      await expect(errorNode?.textContent).toContain('\\comandoquenaoexiste');

      // Devolve o documento ao estado de demonstração.
      //
      // O que a play deixa é o que a pessoa VÊ ao abrir a story, e é o que o
      // Chromatic fotografa. Sem isto, a última coisa na tela era o comando
      // inválido do teste — que não explica nada a quem chega pela sidebar.
      editor.commands.setContent(
        '<p>massa e energia</p>'
          + '<blockquote><p>A citação leva barra lateral na cor da marca.</p></blockquote>'
          + '<pre><code>const c = 299792458;</code></pre>',
      );
      editor.chain().setTextSelection(2).insertInlineMath({ latex: 'E = mc^2' }).run();
      await expect(root.querySelector('.inline-math-error')).toBeNull();
      await expect(root.querySelectorAll('[data-type="inline-math"]')).toHaveLength(1);
    });
  },
};
