// ─── Editor — story do protótipo ─────────────────────────────────────────────
//
// Não é uma story de componente entregue: não tem docs page, não tem
// `translations.json` e não vive sob `UI/`. Ela existe para que o protótipo
// ENTRE no pacote — sem story, o `build-storybook` não compila o módulo e a
// medição de peso mediria zero.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createEditor, type EditorLabels, type EditorPreset, type EditorRoot } from './editor';

type EditorArgs = {
  content: string;
  editable: boolean;
  preset: EditorPreset;
};

const LABELS: EditorLabels = {
  toolbar: 'Formatação',
  editorField: 'Corpo do texto',
  groups: {
    marks: 'Marcas de texto',
    headings: 'Títulos',
    align: 'Alinhamento',
    lists: 'Listas',
    blocks: 'Blocos',
    actions: 'Ações',
    table: 'Tabela',
  },
  actions: {
    bold: 'Negrito',
    italic: 'Itálico',
    underline: 'Sublinhado',
    strike: 'Tachado',
    code: 'Código',
    highlight: 'Destaque',
    h1: 'Título 1',
    h2: 'Título 2',
    h3: 'Título 3',
    alignLeft: 'Alinhar à esquerda',
    alignCenter: 'Centralizar',
    alignRight: 'Alinhar à direita',
    alignJustify: 'Justificar',
    bulletList: 'Lista com marcadores',
    orderedList: 'Lista numerada',
    taskList: 'Lista de tarefas',
    blockquote: 'Citação',
    codeBlock: 'Bloco de código',
    link: 'Link',
    image: 'Inserir imagem',
    imageAlt: 'Texto alternativo',
    imageSmaller: 'Diminuir a imagem',
    imageLarger: 'Aumentar a imagem',
    imageNatural: 'Tamanho natural',
    table: 'Inserir tabela',
    horizontalRule: 'Linha divisória',
    undo: 'Desfazer',
    redo: 'Refazer',
    formula: 'Inserir fórmula',
    rowAfter: 'Inserir linha abaixo',
    columnAfter: 'Inserir coluna à direita',
    deleteRow: 'Excluir linha',
    deleteColumn: 'Excluir coluna',
    headerRow: 'Alternar linha de cabeçalho',
    deleteTable: 'Excluir tabela',
  },
  fields: {
    formula: 'Fórmula em LaTeX',
    formulaConfirm: 'Inserir',
    link: 'Endereço do link',
    linkConfirm: 'Aplicar',
    linkRemove: 'Tirar o link',
    alt: 'Descrição da imagem',
    altConfirm: 'Salvar descrição',
  },
};

const meta: Meta<EditorArgs> = {
  title: 'Prototypes/Editor',
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
  },
  args: {
    content: '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>',
    editable: true,
    preset: 'advanced',
  },
};

/**
 * A linha de entrada está desenhada?
 *
 * Lê o `display` COMPUTADO, e não o atributo `hidden`. O `toBeVisible` do
 * jest-dom trata `hidden` como prova de invisibilidade — e era justamente o
 * atributo que estava certo enquanto a linha ficava na tela: `display: flex` de
 * autor vence o `[hidden] { display: none }` do navegador. A asserção que confia
 * no atributo concorda com o bug.
 */
function rowIsPainted(root: HTMLElement, slot: string): boolean {
  const row = root.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
  return getComputedStyle(row).display !== 'none';
}

/**
 * A cor que um token vale nesta página, resolvida pelo navegador.
 *
 * A sonda é montada, lida e removida ANTES de qualquer asserção — nunca dentro
 * de um `waitFor`. Condição que mexe no DOM reagenda o próprio `waitFor` por
 * observador de mutação, e o prazo nunca chega: a aba trava sem reprovar.
 */
function tokenColor(root: HTMLElement, token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `hsl(var(${token}))`;
  root.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** O mesmo, para medida: quanto vale `--text-h1` em pixels nesta página. */
function tokenSize(root: HTMLElement, token: string): string {
  const probe = document.createElement('span');
  probe.style.fontSize = `var(${token})`;
  root.appendChild(probe);
  const size = getComputedStyle(probe).fontSize;
  probe.remove();
  return size;
}

/**
 * Espera o `alt` da imagem chegar ao valor pedido.
 *
 * Laço de RELÓGIO, não `waitFor`: com prazo, "demorou" e "não veio" são
 * resultados diferentes, e o segundo REPROVA. `waitFor` cuja condição nunca
 * satisfaz pendura a aba sem reportar nada.
 */
async function waitForAlt(root: HTMLElement, expected: string): Promise<void> {
  const deadline = Date.now() + 3000;
  let current = '';
  while (Date.now() < deadline) {
    current = root.querySelector('img')?.getAttribute('alt') ?? '';
    if (current === expected) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  await expect(current).toBe(expected);
}

/**
 * Põe a seleção na imagem do documento.
 *
 * A posição vem de uma VARREDURA, e não de aritmética sobre o tamanho do
 * documento: um parágrafo a mais ou a menos desloca a conta em silêncio. E é
 * repetido a cada passo porque escrever atributo refaz a seleção.
 */
function selectImage(root: EditorRoot): void {
  let position = -1;
  root.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') position = pos;
  });
  if (position >= 0) root.editor.commands.setNodeSelection(position);
}

/**
 * Abre uma linha de entrada, clicando SÓ se ela ainda não estiver aberta.
 *
 * O painel Interactions reexecuta a play no mesmo DOM: um clique cego parte do
 * estado que a rodada anterior deixou e fecha o que deveria abrir. Cada passo
 * estabelece a própria precondição — é a mesma disciplina do `setContent` no
 * início da play.
 */
async function openRow(button: HTMLElement): Promise<void> {
  if (button.getAttribute('aria-expanded') !== 'true') await userEvent.click(button);
  await expect(button).toHaveAttribute('aria-expanded', 'true');
}

/**
 * O par da anterior, escrito na MESMA forma: clique só se ainda não estiver no
 * estado desejado.
 *
 * `!== 'false'` e não `=== 'true'` — é a mesma condição, e é a forma que diz o
 * que a regra é ("se ainda não é o alvo, aja"), em vez de descrever o estado de
 * partida. As duas metades do par ficam simétricas.
 */
async function closeRow(button: HTMLElement): Promise<void> {
  if (button.getAttribute('aria-expanded') !== 'false') await userEvent.click(button);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
}

export default meta;
type Story = StoryObj<EditorArgs>;

export const Playground: Story = {
  render: (args) =>
    createEditor({
      content: args.content,
      editable: args.editable,
      preset: args.preset,
      labels: LABELS,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;

    // A play parte de um documento CONHECIDO, escrito por ela.
    //
    // O painel Interactions reexecuta no mesmo DOM, sem remontar: sem este
    // reinício, a segunda rodada acharia a fórmula que a primeira inseriu e a
    // contagem de "uma fórmula" passaria a mentir. O reinício também dá às
    // asserções de marca e de título uma seleção previsível.
    root.editor.commands.setContent('<p>massa e energia</p>');

    await step('A barra se anuncia, e cada bloco tem name próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      for (const name of [LABELS.groups.marks, LABELS.groups.headings, LABELS.groups.lists]) {
        await expect(canvas.getByRole('group', { name: name })).toBeInTheDocument();
      }
      await expect(root.querySelector('.ProseMirror')).toBeInTheDocument();
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
      const estiloLink = getComputedStyle(link);
      await expect(estiloLink.color).toBe(tokenColor(root, '--primary'));
      // Sublinhado não é enfeite: sem ele a única pista de que há link é a cor,
      // e quem não distingue as duas cores fica sem pista (WCAG 1.4.1).
      await expect(estiloLink.textDecorationLine).toContain('underline');

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
      const marca = root.querySelector('mark') as HTMLElement;
      // O `<mark>` do navegador é amarelo fixo, que ignora o tema e ainda crava
      // o texto em preto. Aqui ele usa o realce do sistema.
      await expect(getComputedStyle(marca).backgroundColor).toBe(tokenColor(root, '--accent'));
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
      await expect(listItem.querySelector('input[type="checkbox"]')).toBeInTheDocument();
      await expect(getComputedStyle(listItem.parentElement as HTMLElement).listStyleType).toBe('none');
    });

    await step('Tabela: os botões de linha e coluna só existem dentro dela', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');

      const insertButton = canvas.getByRole('button', { name: LABELS.actions.table });
      // Pelo NÓ, não pela posição: há mais de um bloco contextual agora (o da
      // imagem vem antes), e o primeiro do documento deixaria de ser o da tabela
      // sem que nada na asserção mudasse.
      const box = root.querySelector(
        '[data-slot="editor-toolbar-context"][data-node="table"]',
      ) as HTMLElement;
      await expect(getComputedStyle(box).display).toBe('none');

      await userEvent.click(insertButton);
      await expect(root.querySelector('table')).toBeInTheDocument();
      // 3×3 com cabeçalho: três linhas no total, a primeira delas de <th>.
      await expect(root.querySelectorAll('table tr')).toHaveLength(3);
      await expect(root.querySelectorAll('table th')).toHaveLength(3);
      await expect(getComputedStyle(box).display).not.toBe('none');

      const addRowButton = canvas.getByRole('button', { name: LABELS.actions.rowAfter });
      await userEvent.click(addRowButton);
      await expect(root.querySelectorAll('table tr')).toHaveLength(4);

      const headerCell = root.querySelector('table th') as HTMLElement;
      await expect(getComputedStyle(headerCell).backgroundColor).toBe(tokenColor(root, '--muted'));

      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.deleteTable }));
      await expect(root.querySelector('table')).toBeNull();
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('Imagem: o armazenamento é de quem consome, e base64 é só o padrão', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');

      // Um PNG de 1×1 transparente, montado byte a byte — nada baixado.
      const bytes = Uint8Array.from(
        atob(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk'
            + 'YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        ),
        (c) => c.charCodeAt(0),
      );
      const file = new File([bytes], 'ponto.png', { type: 'image/png' });

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
      const desfazer = canvas.getByRole('button', { name: LABELS.actions.undo });
      // `setContent` da própria play já criou histórico, então o estado ligado é
      // o esperado aqui — o que se verifica é que o botão SEGUE o editor.
      await expect(desfazer.hasAttribute('disabled')).toBe(root.editor.can().undo() === false);
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
      await expect(open).toHaveAttribute('aria-expanded', 'true');
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
      let position = -1;
      root.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'inlineMath') position = pos;
      });
      root.editor.commands.setNodeSelection(position);

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

/**
 * A costura de armazenamento: quem consome decide de onde sai o `src`.
 *
 * O padrão embute o arquivo em base64, que é o que faz o Playground funcionar
 * sem servidor nenhum. Aqui o resolvedor é outro — um envio fingido que devolve
 * a URL de um CDN, e que RECUSA arquivo acima de um limite. Os dois caminhos
 * são o que uma aplicação de verdade precisa.
 */
export const CustomImageStorage: Story = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  render: (args) =>
    createEditor({
      content: '<p>O armazenamento da imagem é decisão de quem consome.</p>',
      editable: args.editable,
      preset: 'advanced',
      labels: LABELS,
      resolveImage: async (file) => {
        // Recusa é `null`, e não exceção: arquivo grande demais, formato fora
        // da política, envio negado. A barra não insere nada e segue.
        if (file.size > 1024) return null;
        return `https://cdn.exemplo.com/${file.name}`;
      },
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;
    root.editor.commands.setContent('<p>armazenamento próprio</p>');

    await step('O `src` vem do resolvedor, não do arquivo', async () => {
      const smallFile = new File([new Uint8Array(10)], 'logo.png', { type: 'image/png' });
      await expect(await root.insertImage(smallFile)).toBe(true);
      const imageEl = root.querySelector('img') as HTMLImageElement;
      await expect(imageEl.getAttribute('src')).toBe('https://cdn.exemplo.com/logo.png');
      // Nada de base64: o arquivo não entrou no documento.
      await expect(imageEl.getAttribute('src')).not.toContain('data:');
    });

    await step('Recusar não insere nada — e não é erro', async () => {
      const bigFile = new File([new Uint8Array(2048)], 'foto.png', { type: 'image/png' });
      await expect(await root.insertImage(bigFile)).toBe(false);
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
  parameters: { controls: { disable: true }, actions: { disable: true } },
  render: (args) =>
    createEditor({
      content: '<p>A IA propõe a descrição; quem publica confere.</p>',
      editable: args.editable,
      preset: 'advanced',
      labels: LABELS,
      describeImage: async (file, src) => {
        // O dublê recebe as duas coisas que um serviço real pede: os bytes,
        // QUANDO existem, e uma URL. Imagem colada de outra página chega sem
        // arquivo — e um serviço que trabalha por URL descreve os dois casos.
        await new Promise((r) => setTimeout(r, 50));
        if (file) return `Descrição automática de ${file.name}`;
        return `Descrição automática de ${src.slice(src.lastIndexOf('/') + 1)}`;
      },
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;
    root.editor.commands.setContent('<p>descrição automática</p>');

    const file = new File([new Uint8Array([1, 2, 3])], 'grafico.png', { type: 'image/png' });

    await step('A imagem entra NA HORA, com o alt provisório', async () => {
      await expect(await root.insertImage(file)).toBe(true);
      const imageEl = root.querySelector('img') as HTMLImageElement;
      // Sem esperar nada: o name do arquivo segura a vaga. Prender a imagem até
      // a descrição chegar trocaria uma lacuna de acessibilidade por uma de
      // responsividade — e um serviço fora do ar travaria a edição.
      await expect(imageEl.getAttribute('alt')).toBe('grafico.png');
    });

    await step('A descrição chega depois e substitui o provisório', async () => {
      // Espera de RELÓGIO, não `waitFor`: a condição aqui é leitura pura, mas o
      // laço com prazo é o que distingue "demorou" de "não veio" — `waitFor`
      // que nunca satisfaz pendura a aba sem reprovar.
      await waitForAlt(root, 'Descrição automática de grafico.png');
    });

    await step('COLAR e ARRASTAR arquivo passam pelo mesmo caminho', async () => {
      const pm = root.querySelector('.ProseMirror') as HTMLElement;

      // Medido antes de existir: colar arquivo não fazia NADA, e arrastar
      // também não. Quem usa não descobre que há um botão para o que o resto da
      // web resolve arrastando.
      root.editor.commands.setContent('<p>colar</p>');
      const pasteData = new DataTransfer();
      pasteData.items.add(new File([new Uint8Array([4, 5, 6])], 'colada.png', { type: 'image/png' }));
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de colada.png');

      root.editor.commands.setContent('<p>arrastar</p>');
      const dragData = new DataTransfer();
      dragData.items.add(new File([new Uint8Array([7, 8, 9])], 'solta.png', { type: 'image/png' }));
      // COM coordenadas dentro do editor: o ProseMirror abandona o `drop` antes
      // de chamar o gancho quando `posAtCoords` não resolve, e um evento
      // sintético em (0, 0) cai fora da caixa. Medido — sem isto o teste
      // acusaria "arrastar não funciona" com o código certo.
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
      // abaixo da última linha é moldura, e soltar ali escapava para o
      // navegador. Aqui a solta é no RODAPÉ da moldura, longe do texto.
      root.editor.commands.setContent('<p>moldura</p>');
      const box = root.getBoundingClientRect();
      const dragData = new DataTransfer();
      dragData.items.add(new File([new Uint8Array([10, 11])], 'moldura.png', { type: 'image/png' }));

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

    await step('A barra QUEBRA em linhas, e nada fica fora da vista', async () => {
      const toolbarEl = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
      await expect(getComputedStyle(toolbarEl).flexWrap).toBe('wrap');
      // Sem rolagem horizontal: com ela, o botão contextual que acabou de
      // aparecer nascia além da borda, e a única pista de que existia era
      // arrastar a barra para o lado.
      await expect(toolbarEl.scrollWidth).toBe(toolbarEl.clientWidth);
    });

    await step('Imagem COLADA de outra página também é descrita', async () => {
      // Este era o caminho do relato: colar de um site insere `<img src>` sem
      // `alt` nenhum, montado pelo ProseMirror a partir do HTML da área de
      // transferência — sem passar pela fábrica. A varredura por `update` é o
      // que o alcança, e ali não há arquivo: só o endereço.
      root.editor.commands.setContent('<p>colada de fora</p>');
      const pm = root.querySelector('.ProseMirror') as HTMLElement;
      const clipboard = new DataTransfer();
      clipboard.setData('text/html', '<img src="https://exemplo.com/diagrama.png">');
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de diagrama.png');
    });

    await step('A imagem se redimensiona por teclado E por arraste', async () => {
      root.editor.commands.setContent('<p>tamanho</p>');
      await expect(await root.insertImage(file)).toBe(true);
      selectImage(root);

      // Tudo que é de imagem fica JUNTO, sem nada de outro assunto no meio.
      // Antes, "linha divisória", "desfazer" e o botão de tabela caíam entre o
      // de inserir e os de editar — e a leitura da barra sugeria que aqueles
      // quatro pertenciam à tabela.
      const toolbarEl = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
      const actions = Array.from(toolbarEl.querySelectorAll<HTMLElement>('[data-action]')).map(
        (b) => b.dataset.action,
      );
      const imageIndex = actions.indexOf('image');
      await expect(actions.slice(imageIndex, imageIndex + 5)).toEqual([
        'image',
        'imageAlt',
        'imageSmaller',
        'imageLarger',
        'imageNatural',
      ]);

      const img = root.querySelector('img') as HTMLImageElement;
      const startingWidth = Math.round(img.getBoundingClientRect().width);

      // ─ Teclado: o caminho que existe porque arrastar não pode ser o único
      // (WCAG 2.5.7, Movimentos de arrasto).
      const smallerButton = canvas.getByRole('button', { name: LABELS.actions.imageSmaller });
      await userEvent.click(smallerButton);
      selectImage(root);
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(startingWidth - 40);

      const largerButton = canvas.getByRole('button', { name: LABELS.actions.imageLarger });
      await userEvent.click(largerButton);
      selectImage(root);
      await expect(Number(root.querySelector('img')?.getAttribute('width'))).toBe(startingWidth);

      // ─ Piso: cliques demais não podem reduzir a imagem a um ponto.
      for (let i = 0; i < 40; i++) {
        const button = canvas.queryByRole('button', { name: LABELS.actions.imageSmaller });
        if (!button || (button as HTMLButtonElement).disabled) break;
        await userEvent.click(button);
        selectImage(root);
      }
      const atFloor = Number(root.querySelector('img')?.getAttribute('width'));
      await expect(atFloor).toBe(48);

      // ─ Volta ao natural: APAGA o atributo, não grava a medida de hoje. Com a
      // medida gravada, a folha perderia o direito de encolher a imagem numa
      // moldura estreita.
      await userEvent.click(canvas.getByRole('button', { name: LABELS.actions.imageNatural }));
      selectImage(root);
      await expect(root.querySelector('img')?.hasAttribute('width')).toBe(false);

      // ─ Arraste: a alça existe só com a imagem selecionada, e move a largura.
      const handle = root.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(getComputedStyle(handle).opacity).toBe('1');
      // O ícone é DECORAÇÃO, e quem carrega o `aria-hidden` é a alça inteira —
      // um segundo, aninhado, só repetiria o que o pai já diz. E ele não pode
      // receber ponteiro: o gesto tem de nascer na alça, senão o
      // `setPointerCapture` captura num alvo que o `pointermove` não escuta.
      const handleIcon = handle.querySelector('svg') as SVGElement;
      await expect(handleIcon).not.toBeNull();
      await expect(handle).toHaveAttribute('aria-hidden', 'true');
      await expect(getComputedStyle(handleIcon).pointerEvents).toBe('none');
      const before = Math.round(
        (root.querySelector('img') as HTMLElement).getBoundingClientRect().width,
      );
      const handleBox = handle.getBoundingClientRect();
      const pointerInit = { pointerId: 1, bubbles: true, cancelable: true } as const;
      handle.setPointerCapture = () => {};
      handle.releasePointerCapture = () => {};
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { ...pointerInit, clientX: handleBox.left, clientY: handleBox.top }),
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

    await step('E a pessoa corrige o que a IA escreveu', async () => {
      root.editor.commands.setContent('<p>correção</p>');
      await expect(await root.insertImage(file)).toBe(true);
      await waitForAlt(root, 'Descrição automática de grafico.png');

      // O botão só existe com a imagem selecionada — é o mesmo desenho dos
      // botões de tabela.
      // A posição do nó vem de uma varredura, não de aritmética sobre o tamanho
      // do documento: um parágrafo a mais ou a menos desloca a conta em silêncio.
      let position = -1;
      root.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'image') position = pos;
      });
      root.editor.commands.setNodeSelection(position);

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
