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
    lists: 'Listas',
    blocks: 'Blocos',
    actions: 'Ações',
  },
  actions: {
    bold: 'Negrito',
    italic: 'Itálico',
    underline: 'Sublinhado',
    strike: 'Tachado',
    code: 'Código',
    h1: 'Título 1',
    h2: 'Título 2',
    h3: 'Título 3',
    bulletList: 'Lista com marcadores',
    orderedList: 'Lista numerada',
    blockquote: 'Citação',
    codeBlock: 'Bloco de código',
    link: 'Link',
    horizontalRule: 'Linha divisória',
    undo: 'Desfazer',
    redo: 'Refazer',
    formula: 'Inserir fórmula',
  },
  fields: {
    formula: 'Fórmula em LaTeX',
    formulaConfirm: 'Inserir',
    link: 'Endereço do link',
    linkConfirm: 'Aplicar',
    linkRemove: 'Tirar o link',
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
function linhaDesenhada(root: HTMLElement, slot: string): boolean {
  const linha = root.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
  return getComputedStyle(linha).display !== 'none';
}

/**
 * A cor que um token vale nesta página, resolvida pelo navegador.
 *
 * A sonda é montada, lida e removida ANTES de qualquer asserção — nunca dentro
 * de um `waitFor`. Condição que mexe no DOM reagenda o próprio `waitFor` por
 * observador de mutação, e o prazo nunca chega: a aba trava sem reprovar.
 */
function corDoToken(root: HTMLElement, token: string): string {
  const sonda = document.createElement('span');
  sonda.style.color = `hsl(var(${token}))`;
  root.appendChild(sonda);
  const cor = getComputedStyle(sonda).color;
  sonda.remove();
  return cor;
}

/** O mesmo, para medida: quanto vale `--text-h1` em pixels nesta página. */
function medidaDoToken(root: HTMLElement, token: string): string {
  const sonda = document.createElement('span');
  sonda.style.fontSize = `var(${token})`;
  root.appendChild(sonda);
  const medida = getComputedStyle(sonda).fontSize;
  sonda.remove();
  return medida;
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

    await step('A barra se anuncia, e cada bloco tem nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: LABELS.toolbar })).toBeInTheDocument();
      for (const nome of [LABELS.groups.marks, LABELS.groups.headings, LABELS.groups.lists]) {
        await expect(canvas.getByRole('group', { name: nome })).toBeInTheDocument();
      }
      await expect(root.querySelector('.ProseMirror')).toBeInTheDocument();
    });

    await step('Uma parada de tabulação só, e as setas ATRAVESSAM os grupos', async () => {
      const negrito = canvas.getByRole('button', { name: LABELS.actions.bold });
      const italico = canvas.getByRole('button', { name: LABELS.actions.italic });
      negrito.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(italico).toHaveFocus();
      await expect(italico.tabIndex).toBe(0);
      await expect(negrito.tabIndex).toBe(-1);

      // O salto que importa: do último botão do grupo de marcas para o primeiro
      // do grupo de títulos. É por isso que os grupos abrem mão do teclado — com
      // `role="toolbar"` neles, a navegação morreria na borda do primeiro grupo.
      const codigo = canvas.getByRole('button', { name: LABELS.actions.code });
      const titulo1 = canvas.getByRole('button', { name: LABELS.actions.h1 });
      codigo.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(titulo1).toHaveFocus();

      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(negrito).toHaveFocus();
    });

    await step('Os botões refletem o estado do EDITOR, não o próprio clique', async () => {
      const negrito = canvas.getByRole('button', { name: LABELS.actions.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão tem de
      // acender. É o que distingue uma barra presa ao editor de uma com estado
      // próprio, e o motivo de o grupo precisar de `setValue`.
      root.editor.chain().selectAll().setBold().run();
      await expect(negrito).toHaveAttribute('aria-pressed', 'true');
      root.editor.chain().selectAll().unsetBold().run();
      await expect(negrito).toHaveAttribute('aria-pressed', 'false');
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

      const primaria = corDoToken(root, '--primary');
      const apoio = corDoToken(root, '--muted');

      const citacao = root.querySelector('blockquote') as HTMLElement;
      const estiloCitacao = getComputedStyle(citacao);
      // A barra lateral é o sinal, e é ELA que carrega a cor da marca — o texto
      // fica em --foreground, porque cor semântica em texto corrido não alcança
      // os 4.5:1 que texto corrido exige.
      await expect(estiloCitacao.borderInlineStartWidth).not.toBe('0px');
      await expect(estiloCitacao.borderInlineStartColor).toBe(primaria);

      const bloco = root.querySelector('pre') as HTMLElement;
      await expect(getComputedStyle(bloco).backgroundColor).toBe(apoio);
      // O <code> de dentro não repete o fundo: a lib sempre escreve
      // <pre><code>, e dois realces encaixados apareceriam um dentro do outro.
      const dentro = bloco.querySelector('code') as HTMLElement;
      await expect(getComputedStyle(dentro).backgroundColor).toBe('rgba(0, 0, 0, 0)');
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
      const titulo = root.querySelector('h1') as HTMLElement;
      await expect(getComputedStyle(titulo).fontSize).toBe(medidaDoToken(root, '--text-h1'));

      const link = root.querySelector('a') as HTMLElement;
      const estiloLink = getComputedStyle(link);
      await expect(estiloLink.color).toBe(corDoToken(root, '--primary'));
      // Sublinhado não é enfeite: sem ele a única pista de que há link é a cor,
      // e quem não distingue as duas cores fica sem pista (WCAG 1.4.1).
      await expect(estiloLink.textDecorationLine).toContain('underline');

      const trecho = root.querySelector('p code') as HTMLElement;
      await expect(getComputedStyle(trecho).backgroundColor).toBe(corDoToken(root, '--muted'));

      const divisoria = root.querySelector('hr') as HTMLElement;
      await expect(getComputedStyle(divisoria).borderBlockStartColor).toBe(
        corDoToken(root, '--border'),
      );

      // A lista recua pelo token, e o marcador fica DENTRO do recuo — com o
      // marcador fora da caixa, ele desalinha do texto em volta.
      const lista = root.querySelector('ul') as HTMLElement;
      await expect(getComputedStyle(lista).paddingInlineStart).not.toBe('0px');
      await expect(getComputedStyle(lista).marginInlineStart).toBe('0px');
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

      const abrir = canvas.getByRole('button', { name: LABELS.actions.link });
      await expect(linhaDesenhada(root, 'editor-link')).toBe(false);
      await userEvent.click(abrir);
      await expect(linhaDesenhada(root, 'editor-link')).toBe(true);

      const campo = canvas.getByRole('textbox', { name: LABELS.fields.link });
      await expect(campo).toHaveFocus();

      // `javascript:` é o caso que a lista de esquemas existe para barrar. O
      // campo fica marcado como inválido e a linha NÃO fecha.
      await userEvent.type(campo, 'javascript:alert(1){Enter}');
      await expect(campo).toHaveAttribute('aria-invalid', 'true');
      await expect(linhaDesenhada(root, 'editor-link')).toBe(true);
      await expect(root.querySelector('a')).toBeNull();

      await userEvent.clear(campo);
      root.editor.chain().selectAll().run();
      await userEvent.type(campo, 'exemplo.com{Enter}');
      const ancora = root.querySelector('a');
      await expect(ancora).toBeInTheDocument();
      // Endereço sem esquema é o que a pessoa digita; quem completa é a barra.
      await expect(ancora).toHaveAttribute('href', 'https://exemplo.com');
      await expect(linhaDesenhada(root, 'editor-link')).toBe(false);
      await expect(abrir).toHaveFocus();

      // Com o cursor no link, abrir mostra o endereço ATUAL — é o que torna a
      // linha editável em vez de só um formulário de inserção. Abrindo em
      // branco, nada na tela dizia o que já existia.
      await userEvent.click(abrir);
      await expect(campo).toHaveValue('https://exemplo.com');

      // O botão de tirar só existe quando há link — botão que não faz nada é
      // ruído, e desabilitado seria pior: anuncia a ação e nega em seguida.
      const tirar = canvas.getByRole('button', { name: LABELS.fields.linkRemove });
      await expect(getComputedStyle(tirar).display).not.toBe('none');
      await userEvent.click(tirar);
      await expect(root.querySelector('a')).toBeNull();

      // Sem link no trecho, ele some. A asserção lê o `display` COMPUTADO: o
      // `.nds-button` declara `display: inline-flex`, e declaração de autor
      // vence o `[hidden]` do navegador — o atributo sozinho não esconde nada,
      // e a asserção que confia nele concorda com o bug.
      await userEvent.click(abrir);
      await expect(getComputedStyle(tirar).display).toBe('none');

      // Apagar o campo e confirmar continua tirando o link — o caminho antigo,
      // que agora é atalho e não a única porta.
      await userEvent.type(campo, 'exemplo.com{Enter}');
      await expect(root.querySelector('a')).toBeInTheDocument();
      await userEvent.click(abrir);
      await userEvent.clear(campo);
      await userEvent.keyboard('{Enter}');
      await expect(root.querySelector('a')).toBeNull();
    });

    await step('A fórmula entra pelo botão e é renderizada pelo KaTeX', async () => {
      const abrir = canvas.getByRole('button', { name: LABELS.actions.formula });
      await expect(abrir).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(abrir);
      await expect(abrir).toHaveAttribute('aria-expanded', 'true');
      await expect(linhaDesenhada(root, 'editor-formula')).toBe(true);

      const campo = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      await expect(campo).toHaveFocus();
      await userEvent.type(campo, 'E = mc^2');
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
      await expect(abrir).toHaveAttribute('aria-expanded', 'false');
      await expect(linhaDesenhada(root, 'editor-formula')).toBe(false);
      await expect(abrir).toHaveFocus();

      // E o mesmo botão abre e FECHA, sem inserir nada.
      await userEvent.click(abrir);
      await expect(linhaDesenhada(root, 'editor-formula')).toBe(true);
      await userEvent.click(abrir);
      await expect(linhaDesenhada(root, 'editor-formula')).toBe(false);

      // Fórmula sob o cursor se EDITA, não duplica. O que se vê na tela é o
      // resultado renderizado, então abrir com o LaTeX de volta é o único
      // caminho para corrigir uma.
      let posicao = -1;
      root.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'inlineMath') posicao = pos;
      });
      root.editor.commands.setNodeSelection(posicao);

      await userEvent.click(abrir);
      await expect(campo).toHaveValue('E = mc^2');
      await userEvent.clear(campo);
      await userEvent.type(campo, 'a^2 + b^2{Enter}');

      const depois = root.querySelectorAll('[data-type="inline-math"]');
      await expect(depois).toHaveLength(1);
      await expect(depois[0]).toHaveAttribute('data-latex', 'a^2 + b^2');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const abrir = canvas.getByRole('button', { name: LABELS.actions.formula });
      await userEvent.click(abrir);
      const campo = canvas.getByRole('textbox', { name: LABELS.fields.formula });
      // Sem chaves de propósito: no `userEvent.type`, `{` abre descritor de
      // tecla, e um LaTeX cheio de chaves testaria mais a escapagem do teclado
      // sintético que o editor. Comando inexistente erra igual.
      // O `{Enter}` no fim também cobre o caminho de confirmar pelo teclado.
      await userEvent.type(campo, '\\comandoquenaoexiste{Enter}');

      const erro = root.querySelector('.inline-math-error');
      await expect(erro).toBeInTheDocument();
      await expect(erro?.textContent).toContain('\\comandoquenaoexiste');

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
