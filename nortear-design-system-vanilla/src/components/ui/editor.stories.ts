// ─── Editor — story do protótipo ─────────────────────────────────────────────
//
// Não é uma story de componente entregue: não tem docs page, não tem
// `translations.json` e não vive sob `UI/`. Ela existe para que o protótipo
// ENTRE no pacote — sem story, o `build-storybook` não compila o módulo e a
// medição de peso mediria zero.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { createEditor, type EditorRoot } from './editor';

type EditorArgs = {
  content: string;
  editable: boolean;
};

const LABELS = {
  toolbar: 'Formatação',
  bold: 'Negrito',
  italic: 'Itálico',
  strike: 'Tachado',
  editorField: 'Corpo do texto',
  formula: 'Inserir fórmula',
  formulaField: 'Fórmula em LaTeX',
  formulaConfirm: 'Inserir',
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
  },
  args: {
    content: '<p>Escreva aqui. A energia de repouso é <strong>E = mc²</strong>.</p>',
    editable: true,
  },
};

/**
 * A linha da fórmula está desenhada?
 *
 * Lê o `display` COMPUTADO, e não o atributo `hidden`. O `toBeVisible` do
 * jest-dom trata `hidden` como prova de invisibilidade — e era justamente o
 * atributo que estava certo enquanto a linha ficava na tela: `display: flex`
 * de autor vence o `[hidden] { display: none }` do navegador. A asserção que
 * confia no atributo concorda com o bug.
 */
function linhaDesenhada(root: HTMLElement): boolean {
  const linha = root.querySelector('[data-slot="editor-formula"]') as HTMLElement;
  return getComputedStyle(linha).display !== 'none';
}

export default meta;
type Story = StoryObj<EditorArgs>;

export const Playground: Story = {
  render: (args) =>
    createEditor({ content: args.content, editable: args.editable, labels: LABELS }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorRoot;

    // A play parte de um documento CONHECIDO, escrito por ela.
    //
    // O painel Interactions reexecuta no mesmo DOM, sem remontar: sem este
    // reinício, a segunda rodada acharia a fórmula que a primeira inseriu e a
    // contagem de "uma fórmula" passaria a mentir. O reinício também dá à
    // asserção de negrito uma seleção previsível.
    root.editor.commands.setContent('<p>massa e energia</p>');

    await step('A barra se anuncia como barra, e o campo mora dentro da moldura', async () => {
      const toolbar = canvas.getByRole('toolbar', { name: LABELS.toolbar });
      await expect(toolbar).toBeInTheDocument();
      await expect(root.querySelector('.ProseMirror')).toBeInTheDocument();
    });

    await step('Uma única parada de tabulação na barra, com as setas andando dentro', async () => {
      const negrito = canvas.getByRole('button', { name: LABELS.bold });
      const italico = canvas.getByRole('button', { name: LABELS.italic });
      negrito.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(italico).toHaveFocus();
      await expect(italico.tabIndex).toBe(0);
      await expect(negrito.tabIndex).toBe(-1);
      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(negrito).toHaveFocus();
    });

    await step('O botão de marca reflete o estado do EDITOR, não o próprio clique', async () => {
      const negrito = canvas.getByRole('button', { name: LABELS.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão tem de
      // acender. É o que distingue um botão preso ao editor de um alternador
      // com estado próprio — e o motivo de esta barra não usar `createToggle`.
      root.editor.chain().selectAll().setBold().run();
      await expect(negrito).toHaveAttribute('aria-pressed', 'true');

      root.editor.chain().selectAll().unsetBold().run();
      await expect(negrito).toHaveAttribute('aria-pressed', 'false');
    });

    await step('A fórmula entra pelo botão e é renderizada pelo KaTeX', async () => {
      const abrir = canvas.getByRole('button', { name: LABELS.formula });
      await expect(abrir).toHaveAttribute('aria-expanded', 'false');
      // A linha nasce FECHADA — e isto se verifica olhando a tela, não o
      // atributo. `aria-expanded` correto com a linha visível foi o defeito:
      // `display: flex` de autor vence o `[hidden]` do navegador, e o atributo
      // seguia certo enquanto o campo ficava aberto na cara de quem lê.
      await expect(linhaDesenhada(root)).toBe(false);
      await userEvent.click(abrir);
      await expect(abrir).toHaveAttribute('aria-expanded', 'true');
      await expect(linhaDesenhada(root)).toBe(true);

      const campo = canvas.getByRole('textbox', { name: LABELS.formulaField });
      await expect(campo).toHaveFocus();
      await userEvent.type(campo, 'E = mc^2');
      await userEvent.click(canvas.getByRole('button', { name: LABELS.formulaConfirm }));

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
      // O LaTeX de origem viaja dentro do MathML, e é o que a tecnologia
      // assistiva lê quando prefere a notação à árvore visual.
      await expect(mathml?.textContent).toContain('E');

      // A linha fecha e devolve o foco a quem a abriu.
      await expect(abrir).toHaveAttribute('aria-expanded', 'false');
      await expect(linhaDesenhada(root)).toBe(false);
      await expect(abrir).toHaveFocus();

      // E o mesmo botão abre e FECHA, sem inserir nada.
      await userEvent.click(abrir);
      await expect(linhaDesenhada(root)).toBe(true);
      await userEvent.click(abrir);
      await expect(linhaDesenhada(root)).toBe(false);
      await expect(abrir).toHaveAttribute('aria-expanded', 'false');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const abrir = canvas.getByRole('button', { name: LABELS.formula });
      await userEvent.click(abrir);
      const campo = canvas.getByRole('textbox', { name: LABELS.formulaField });
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
      root.editor.commands.setContent('<p>massa e energia</p>');
      root.editor.chain().insertInlineMath({ latex: 'E = mc^2' }).run();
      await expect(root.querySelector('.inline-math-error')).toBeNull();
      await expect(root.querySelectorAll('[data-type="inline-math"]')).toHaveLength(1);
    });
  },
};
