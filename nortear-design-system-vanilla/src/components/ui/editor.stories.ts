import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import {
  createEditor,
  type EditorOptions,
  type EditorPreset,
  type EditorRoot,
} from './editor';
import { LABELS, PLAYGROUND_CONTENT, createDotPngFile, fluidBox } from './editor.fixtures';
import {
  closeRow,
  openRow,
  rowIsPainted,
  selectInlineMath,
  tokenColor,
  tokenSize,
} from './editor.play-helpers';
import { editorSource } from './editor.source';
import { createEditorDocs } from '@/components/docs/EditorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// As sete do contrato, e não as quatro que o Playground controla: a aba API
// Reference é gerada a partir de `argTypes`, então o que não aparece aqui não
// existe para quem lê a documentação. As três últimas não são encaminhadas pelo
// `render` — vão com `control: false`, que é o que impede o painel Controls de
// prometer um botão que não muda nada.
type EditorArgs = {
  content: string;
  editable: boolean;
  preset: EditorPreset;
  onChange: (html: string) => void;
  labels?: EditorOptions['labels'];
  resolveImage?: EditorOptions['resolveImage'];
  describeImage?: EditorOptions['describeImage'];
};

const meta: Meta<EditorArgs> = {
  title: 'Primitives/Form/Editor',
  tags: ['autodocs', 'form'],
  parameters: {
    // `padded` e não `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até o texto — a moldura deixaria de ser o que se vê.
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(createEditorDocs),
      // O painel Code mostra a chamada da fábrica, e não o `outerHTML` da
      // moldura. A transform cascateia para todas as stories deste arquivo.
      source: { transform: editorSource },
    },
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Conteúdo inicial em HTML. Passa por DOMPurify antes da lib.',
      table: { type: { summary: 'string' } },
    },
    editable: {
      control: 'boolean',
      description: 'Quando falso, o conteúdo vira leitura.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    preset: {
      control: { type: 'inline-radio' },
      options: ['basic', 'advanced'],
      description:
        'Conjunto de botões. Muda o que a barra expõe, não o que o documento aceita.',
      table: { type: { summary: '"basic" | "advanced"' }, defaultValue: { summary: '"advanced"' } },
    },
    // Sem entrada aqui o callback fica fora da aba API Reference, mesmo estando
    // em args e alimentando a aba Actions.
    onChange: {
      control: false,
      description: 'Chamado a cada mudança do documento, com o HTML atual.',
      table: { type: { summary: '(html: string) => void' }, defaultValue: { summary: '—' } },
    },
    labels: {
      control: false,
      type: { name: 'object', value: {}, required: true },
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão '
        + 'e dos campos de entrada. É a única propriedade obrigatória: todo botão '
        + 'é só de ícone, e não há texto visível de onde deduzir o nome.',
      table: { type: { summary: 'EditorLabels' }, defaultValue: { summary: '—' } },
    },
    resolveImage: {
      control: false,
      description:
        'Decide de onde vem o endereço da imagem escolhida — a decisão de '
        + 'armazenamento, que é de quem consome. Devolver nulo recusa a inserção, '
        + 'sem erro.',
      table: {
        type: { summary: '(file: File) => Promise<string | null>' },
        defaultValue: { summary: 'arquivo embutido em base64' },
      },
    },
    describeImage: {
      control: false,
      description:
        'Escreve o texto alternativo a partir da imagem. Recebe o arquivo quando '
        + 'existe: imagem colada de outra página chega só como endereço.',
      table: {
        type: { summary: '(file: File | null, src: string) => Promise<string | null>' },
        defaultValue: { summary: '—' },
      },
    },
  },
  args: {
    content: PLAYGROUND_CONTENT,
    editable: true,
    preset: 'advanced',
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<EditorArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5', 'functional.item6',
      'functional.item11',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'visual.item2',
    ],
  },
  render: (args) =>
    fluidBox(
      createEditor({
        content: args.content,
        editable: args.editable,
        preset: args.preset,
        labels: LABELS,
        onChange: args.onChange,
      }),
    ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;

    // A play parte de um documento CONHECIDO, escrito por ela.
    //
    // O painel Interactions reexecuta no mesmo DOM, sem remontar: sem este
    // reinício, a segunda rodada acharia a fórmula que a primeira inseriu e a
    // contagem de "uma fórmula" passaria a mentir. O reinício também dá às
    // asserções de marca e de título uma seleção previsível.
    root.editor.commands.setContent('<p>massa e energia</p>');

    await step('A barra se anuncia, e cada bloco tem nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      for (const name of [LABELS.groups.marks, LABELS.groups.headings, LABELS.groups.lists]) {
        await expect(canvas.getByRole('group', { name: name })).toBeInTheDocument();
      }
      // A lib põe `role="textbox"` no elemento editável, e campo com papel de
      // campo e sem nome é violação de `aria-input-field-name`. Não há rótulo
      // visível a que apontar: a moldura inteira é o campo.
      const field = canvas.getByRole('textbox', { name: LABELS.editorField });
      await expect(field).toHaveClass('ProseMirror');
    });

    await step('Uma parada de tabulação só, e as setas ATRAVESSAM os grupos', async () => {
      const boldButton = canvas.getByRole('button', { name: LABELS.actions.bold });
      const italicButton = canvas.getByRole('button', { name: LABELS.actions.italic });
      boldButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(italicButton).toHaveFocus();
      await expect(italicButton.tabIndex).toBe(0);
      await expect(boldButton.tabIndex).toBe(-1);

      // O salto que importa: do último botão do grupo de marcas para o primeiro
      // do grupo de títulos. É por isso que os grupos abrem mão do teclado — com
      // `role="toolbar"` neles, a navegação morreria na borda do primeiro grupo.
      const lastMarkButton = canvas.getByRole('button', { name: LABELS.actions.highlight });
      const headingOne = canvas.getByRole('button', { name: LABELS.actions.h1 });
      lastMarkButton.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(headingOne).toHaveFocus();

      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(boldButton).toHaveFocus();
    });

    await step('Os botões refletem o estado do EDITOR, não o próprio clique', async () => {
      const boldButton = canvas.getByRole('button', { name: LABELS.actions.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão tem de
      // acender. É o que distingue uma barra presa ao editor de uma com estado
      // próprio, e o motivo de o grupo precisar de `setValue`.
      root.editor.chain().selectAll().setBold().run();
      await expect(boldButton).toHaveAttribute('aria-pressed', 'true');
      root.editor.chain().selectAll().unsetBold().run();
      await expect(boldButton).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Título é escolha única: ligar o H2 desliga o H1', async () => {
      const h1 = canvas.getByRole('button', { name: LABELS.actions.h1 });
      const h2 = canvas.getByRole('button', { name: LABELS.actions.h2 });
      // CURSOR, não `selectAll`. A barra reflete o bloco onde o cursor está, e
      // `selectAll` abrange também o parágrafo vazio que a lib mantém no fim do
      // documento: com dois blocos de tipos diferentes na seleção, `isActive`
      // responde falso — medido, com o HTML já em `<h1>`. Selecionar tudo aqui
      // testaria uma pergunta que a barra não faz.
      root.editor.chain().setTextSelection(2).setHeading({ level: 1 }).run();
      await expect(h1).toHaveAttribute('aria-pressed', 'true');
      await expect(h2).toHaveAttribute('aria-pressed', 'false');

      root.editor.chain().setTextSelection(2).setHeading({ level: 2 }).run();
      await expect(h1).toHaveAttribute('aria-pressed', 'false');
      await expect(h2).toHaveAttribute('aria-pressed', 'true');

      root.editor.chain().setTextSelection(2).setParagraph().run();
      await expect(h2).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Cada mudança do documento entrega o HTML atual', async () => {
      // O contrato de saída: quem consome grava o que sai daqui. `update` e não
      // `transaction` — mover o cursor não é mudança de conteúdo.
      const before = (args.onChange as ReturnType<typeof fn>).mock.calls.length;
      root.editor.commands.setContent('<p>saída do editor</p>');
      const calls = (args.onChange as ReturnType<typeof fn>).mock.calls;
      await expect(calls.length).toBeGreaterThan(before);
      await expect(String(calls[calls.length - 1][0])).toContain('saída do editor');
    });

    await step('Citação e bloco de código se distinguem do texto comum', async () => {
      // Conteúdo escrito pela play, e não alternado por comando: `setContent` é
      // idempotente, e o painel Interactions reexecuta no mesmo DOM.
      root.editor.commands.setContent(
        '<blockquote><p>citação</p></blockquote><pre><code>codigo()</code></pre>',
      );

      const primaryColor = tokenColor(root, '--primary');
      const mutedColor = tokenColor(root, '--muted');

      const quote = root.querySelector('blockquote') as HTMLElement;
      const quoteStyle = getComputedStyle(quote);
      // A barra lateral é o sinal, e é ELA que carrega a cor da marca — o texto
      // fica em --foreground, porque cor semântica em texto corrido não alcança
      // os 4.5:1 que texto corrido exige.
      await expect(quoteStyle.borderInlineStartWidth).not.toBe('0px');
      await expect(quoteStyle.borderInlineStartColor).toBe(primaryColor);

      const block = root.querySelector('pre') as HTMLElement;
      await expect(getComputedStyle(block).backgroundColor).toBe(mutedColor);
      // O <code> de dentro não repete o fundo: a lib sempre escreve
      // <pre><code>, e dois realces encaixados apareceriam um dentro do outro.
      const innerCode = block.querySelector('code') as HTMLElement;
      await expect(getComputedStyle(innerCode).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    await step('Título, link, código e divisória saem na escala do sistema', async () => {
      root.editor.commands.setContent(
        '<h1>título</h1>'
          + '<p>texto com <a href="https://exemplo.com">link</a> e <code>trecho</code>.</p>'
          + '<hr>'
          + '<ul><li>item</li></ul>',
      );

      // O que se compara é com o TOKEN, não com um número escrito à mão: número
      // à mão passa a mentir no dia em que a escada muda de base, e é a escada
      // que o portão existe para guardar.
      const headingEl = root.querySelector('h1') as HTMLElement;
      await expect(getComputedStyle(headingEl).fontSize).toBe(tokenSize(root, '--text-h1'));

      const link = root.querySelector('a') as HTMLElement;
      const linkStyle = getComputedStyle(link);
      await expect(linkStyle.color).toBe(tokenColor(root, '--primary'));
      // Sublinhado não é enfeite: sem ele a única pista de que há link é a cor,
      // e quem não distingue as duas cores fica sem pista (WCAG 1.4.1).
      await expect(linkStyle.textDecorationLine).toContain('underline');

      const inlineCode = root.querySelector('p code') as HTMLElement;
      await expect(getComputedStyle(inlineCode).backgroundColor).toBe(tokenColor(root, '--muted'));

      const ruleEl = root.querySelector('hr') as HTMLElement;
      await expect(getComputedStyle(ruleEl).borderBlockStartColor).toBe(
        tokenColor(root, '--border'),
      );

      // A lista recua pelo token, e o marcador fica DENTRO do recuo — com o
      // marcador fora da caixa, ele desalinha do texto em volta.
      const listEl = root.querySelector('ul') as HTMLElement;
      await expect(getComputedStyle(listEl).paddingInlineStart).not.toBe('0px');
      await expect(getComputedStyle(listEl).marginInlineStart).toBe('0px');
    });

    await step('Destaque, alinhamento e lista de tarefas', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');

      const highlightButton = canvas.getByRole('button', { name: LABELS.actions.highlight });
      root.editor.chain().selectAll().setHighlight().run();
      await expect(highlightButton).toHaveAttribute('aria-pressed', 'true');
      const highlighted = root.querySelector('mark') as HTMLElement;
      // O `<mark>` do navegador é amarelo fixo, que ignora o tema e ainda crava
      // o texto em preto. Aqui ele usa o realce do sistema.
      await expect(getComputedStyle(highlighted).backgroundColor).toBe(tokenColor(root, '--accent'));
      root.editor.chain().selectAll().unsetHighlight().run();

      // Alinhamento é ATRIBUTO do bloco, e escolha única: centralizar desliga
      // "à esquerda" sem que ninguém precise desligá-lo.
      const centerButton = canvas.getByRole('button', { name: LABELS.actions.alignCenter });
      const rightButton = canvas.getByRole('button', { name: LABELS.actions.alignRight });
      root.editor.chain().setTextSelection(2).setTextAlign('center').run();
      await expect(centerButton).toHaveAttribute('aria-pressed', 'true');
      await expect(rightButton).toHaveAttribute('aria-pressed', 'false');
      root.editor.chain().setTextSelection(2).setTextAlign('left').run();

      const taskButton = canvas.getByRole('button', { name: LABELS.actions.taskList });
      root.editor.chain().setTextSelection(2).toggleTaskList().run();
      await expect(taskButton).toHaveAttribute('aria-pressed', 'true');
      // A caixa é do navegador, e é ela que marca — o marcador de lista sai de
      // cena para não haver dois sinais para a mesma coisa.
      const listItem = root.querySelector('ul[data-type="taskList"] li') as HTMLElement;
      const taskBox = listItem.querySelector('input[type="checkbox"]') as HTMLElement;
      await expect(taskBox).toBeInTheDocument();
      await expect(
        getComputedStyle(listItem.parentElement as HTMLElement).listStyleType,
      ).toBe('none');

      // PRENDE o alvo mínimo de WCAG 2.5.8, e mede o RETÂNGULO DO PRÓPRIO
      // `<input>` porque é ele que a regra `target-size` lê — ligada no
      // `preview.ts` das cinco stacks. A caixa que o navegador desenha sozinho
      // mede 13×13, e uma tentativa de crescer o alvo por um `::after` no
      // `<label>` não entra nesta conta e passou batido no axe.
      const boxRect = taskBox.getBoundingClientRect();
      await expect(boxRect.width).toBeGreaterThanOrEqual(24);
      await expect(boxRect.height).toBeGreaterThanOrEqual(24);

      // E a caixa de 24px não pode empurrar a marca para fora da primeira linha
      // do texto: os dois centros verticais coincidem. É a folha compartilhada
      // que fecha essa conta, declarando `line-height: 1.5` no conteúdo e
      // zerando o `margin-block` do `<p>` dentro do item — com linha de 24px e
      // caixa de 24px, o recuo `(1.5em - var(--spacing-6)) / 2` vale ZERO de
      // propósito, e topo com topo já é centro com centro.
      //
      // O texto do item cabe numa linha só, e por isso o retângulo do `<p>` É a
      // primeira linha — medida direta, que não depende de ler `line-height`
      // computado (ele volta a `normal` se a declaração sair da folha, e aí a
      // conta mentiria em vez de reprovar).
      //
      // A folga é de 1px, e não de 2, porque 2 NÃO teria dentes: sem
      // `line-height: 1.5` a linha volta a 20px e o desencontro é de EXATAMENTE
      // 2px, que `toBeLessThanOrEqual(2)` deixaria passar. Sem o reset de
      // margem do `<p>`, são 16px, que qualquer folga pega.
      const lineRect = (listItem.querySelector('div p') as HTMLElement).getBoundingClientRect();
      await expect(lineRect.height).toBeLessThan(40);
      await expect(
        Math.abs(boxRect.top + boxRect.height / 2 - (lineRect.top + lineRect.height / 2)),
      ).toBeLessThanOrEqual(1);
    });

    await step('Imagem: o armazenamento é de quem consome, e base64 é só o padrão', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');

      const file = createDotPngFile();
      await expect(await root.insertImage(file)).toBe(true);
      const imageEl = root.querySelector('img') as HTMLImageElement;
      await expect(imageEl).toBeInTheDocument();
      // O resolvedor PADRÃO embute o arquivo. É o que faz o Playground
      // funcionar sem servidor nenhum — e não é o que se leva para produção.
      await expect(imageEl.getAttribute('src')).toContain('data:image/png;base64,');

      // `allowBase64` é FALSE por padrão na lib: sem ligá-lo, o esquema descarta
      // o `src` que não reconhece e a imagem SOME na releitura do documento.
      // Este é o portão desse ajuste, e ele passaria despercebido sem ele.
      root.editor.commands.setContent(root.editor.getHTML());
      await expect(root.querySelector('img')).toBeInTheDocument();
    });

    await step('Desfazer nasce indisponível e acende quando há o que desfazer', async () => {
      const undoButton = canvas.getByRole('button', { name: LABELS.actions.undo });
      // `setContent` da própria play já criou histórico, então o estado ligado é
      // o esperado aqui — o que se verifica é que o botão SEGUE o editor.
      await expect(undoButton.hasAttribute('disabled')).toBe(root.editor.can().undo() === false);
    });

    await step('O link só aceita esquema da lista, e vazio desfaz', async () => {
      // Precondição própria: o passo anterior deixa um documento com link, e
      // "nenhuma âncora ainda" é o que este verifica primeiro. Herdar o estado
      // do vizinho é o mesmo erro que o replay do painel Interactions provoca.
      root.editor.commands.setContent('<p>massa e energia</p>');

      const open = canvas.getByRole('button', { name: LABELS.actions.link });
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.link });
      await expect(field).toHaveFocus();

      // `javascript:` é o caso que a lista de esquemas existe para barrar. O
      // campo fica marcado como inválido e a linha NÃO fecha.
      await userEvent.type(field, 'javascript:alert(1){Enter}');
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);
      await expect(root.querySelector('a')).toBeNull();

      await userEvent.clear(field);
      root.editor.chain().selectAll().run();
      await userEvent.type(field, 'exemplo.com{Enter}');
      const anchor = root.querySelector('a');
      await expect(anchor).toBeInTheDocument();
      // Endereço sem esquema é o que a pessoa digita; quem completa é a barra.
      await expect(anchor).toHaveAttribute('href', 'https://exemplo.com');
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await expect(open).toHaveFocus();

      // Com o cursor no link, abrir mostra o endereço ATUAL — é o que torna a
      // linha editável em vez de só um formulário de inserção. Abrindo em
      // branco, nada na tela dizia o que já existia.
      await openRow(open);
      await expect(field).toHaveValue('https://exemplo.com');

      // O botão de tirar só existe quando há link — botão que não faz nada é
      // ruído, e desabilitado seria pior: anuncia a ação e nega em seguida.
      const unlink = canvas.getByRole('button', { name: LABELS.fields.linkRemove });
      await expect(getComputedStyle(unlink).display).not.toBe('none');
      await userEvent.click(unlink);
      await expect(root.querySelector('a')).toBeNull();

      // Sem link no trecho, ele some. A asserção lê o `display` COMPUTADO: o
      // `.nds-button` declara `display: inline-flex`, e declaração de autor
      // vence o `[hidden]` do navegador — o atributo sozinho não esconde nada,
      // e a asserção que confia nele concorda com o bug.
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
      const open = canvas.getByRole('button', { name: LABELS.actions.formula });
      await expect(open).toHaveAttribute('aria-expanded', 'false');
      await openRow(open);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);

      const field = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      await expect(field).toHaveFocus();
      await userEvent.type(field, 'E = mc^2');
      await userEvent.click(canvas.getByRole('button', { name: LABELS.fields.formulaConfirm }));

      const formulas = root.querySelectorAll('[data-type="inline-math"]');
      await expect(formulas).toHaveLength(1);
      await expect(formulas[0]).toHaveAttribute('data-latex', 'E = mc^2');
      // O KaTeX escreve MathML junto do HTML visual — é assim que a fórmula
      // chega ao leitor de tela em vez de virar um amontoado de <span>.
      //
      // A asserção NÃO é `toBeInTheDocument`: `<math>` é `MathMLElement`, e o
      // jest-dom só aceita `HTMLElement` ou `SVGElement` — reprova com "received
      // value must be an HTMLElement", que parece ausência e é tipo. Medido aqui.
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
      selectInlineMath(root);

      await openRow(open);
      await expect(field).toHaveValue('E = mc^2');
      await userEvent.clear(field);
      await userEvent.type(field, 'a^2 + b^2{Enter}');

      const after = root.querySelectorAll('[data-type="inline-math"]');
      await expect(after).toHaveLength(1);
      await expect(after[0]).toHaveAttribute('data-latex', 'a^2 + b^2');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const open = canvas.getByRole('button', { name: LABELS.actions.formula });
      await openRow(open);
      const field = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      // Sem chaves de propósito: no `userEvent.type`, `{` abre descritor de
      // tecla, e um LaTeX cheio de chaves testaria mais a escapagem do teclado
      // sintético que o editor. Comando inexistente erra igual.
      // O `{Enter}` no fim também cobre o caminho de confirmar pelo teclado.
      await userEvent.type(field, '\\comandoquenaoexiste{Enter}');

      const errorNode = root.querySelector('.inline-math-error');
      await expect(errorNode).toBeInTheDocument();
      await expect(errorNode?.textContent).toContain('\\comandoquenaoexiste');

      // Devolve o documento ao estado de demonstração.
      //
      // O que a play deixa é o que a pessoa VÊ ao abrir a story, e é o que o
      // Chromatic fotografa. Sem isto, a última coisa na tela era o comando
      // inválido do teste — que não explica nada a quem chega pela sidebar.
      root.editor.commands.setContent(
        '<p>massa e energia</p>'
          + '<blockquote><p>A citação leva barra lateral na cor da marca.</p></blockquote>'
          + '<pre><code>const c = 299792458;</code></pre>',
      );
      root.editor.chain().setTextSelection(2).insertInlineMath({ latex: 'E = mc^2' }).run();
      await expect(root.querySelector('.inline-math-error')).toBeNull();
      await expect(root.querySelectorAll('[data-type="inline-math"]')).toHaveLength(1);
    });
  },
};
