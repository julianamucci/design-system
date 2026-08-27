import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import { EditorComponent, type EditorHostElement, type EditorPreset } from './editor';
import {
  EDITOR_CONTENT,
  EDITOR_LABELS,
  closeRow,
  waitUntil,
  openRow,
  rowIsPainted,
  selectFormula,
} from './editor.fixtures';
import { NdsEditorDocs } from '@/components/docs/EditorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type EditorArgs = {
  content: string;
  editable: boolean;
  preset: EditorPreset;
  changed?: (html: string) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args. Isso é andaime, não o que alguém escreve para
 * usar o componente. O `transform` devolve o uso real, montado dos args atuais.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<EditorArgs> }): string {
  const { preset = 'advanced', editable = true } = ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina
  // ruído.
  const attrs = [
    '[labels]="labels"',
    '[content]="html"',
    preset === 'advanced' ? '' : `preset="${preset}"`,
    editable ? '' : '[editable]="false"',
    '(changed)="html = $event"',
  ].filter(Boolean);

  return `import { EditorComponent } from '@/components/ui/editor';

@Component({
  imports: [EditorComponent],
  template: \`
    <nds-editor
      ${attrs.join('\n      ')}
    />
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<EditorArgs> = {
  title: 'UI/Editor',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [EditorComponent] })],
  parameters: {
    // `padded` e não `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsEditorDocs) },
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Conteúdo inicial em HTML. É sanitizado antes de chegar à biblioteca.',
      table: { type: { summary: 'string' } },
    },
    editable: {
      control: 'boolean',
      description: 'Quando falso, o conteúdo vira leitura e a barra deixa de agir.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    preset: {
      control: 'inline-radio',
      options: ['basic', 'advanced'],
      description:
        'Conjunto de botões da barra. Muda o que a barra expõe, não o que o documento aceita.',
      table: {
        type: { summary: '"basic" | "advanced"' },
        defaultValue: { summary: '"advanced"' },
      },
    },
    // Sem entrada em argTypes o renderer Angular não repassa a função em
    // `props`, e o `(changed)` do template fica ligado a nada — sem erro.
    changed: {
      control: false,
      description: 'Emitido a cada mudança do conteúdo, com o HTML atual.',
      table: { type: { summary: '(html: string) => void' } },
    },
  },
  args: {
    content: EDITOR_CONTENT.playground,
    editable: true,
    preset: 'advanced',
    changed: fn(),
  },
};

export default meta;
type Story = StoryObj<EditorArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
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
  render: (args) => ({
    props: { ...args, labels: EDITOR_LABELS },
    template: `
      <div class="nds-w-full">
        <nds-editor
          [labels]="labels"
          [content]="content"
          [editable]="editable"
          [preset]="preset"
          (changed)="changed($event)"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);

    // A play parte de um documento CONHECIDO, escrito por ela.
    //
    // O painel Interactions reexecuta no mesmo DOM, sem remontar: sem este
    // reinício, a segunda rodada acharia a fórmula que a primeira inseriu e a
    // contagem de "uma fórmula" passaria a mentir.
    root.editor.commands.setContent('<p>massa e energia</p>');

    await step('accessibility.item1 — a barra se anuncia, e cada bloco tem nome próprio', async () => {
      await expect(canvas.getByRole('toolbar', { name: EDITOR_LABELS.toolbar })).toBeInTheDocument();
      for (const name of [
        EDITOR_LABELS.groups.marks,
        EDITOR_LABELS.groups.headings,
        EDITOR_LABELS.groups.lists,
      ]) {
        await expect(canvas.getByRole('group', { name })).toBeInTheDocument();
      }
    });

    await step('accessibility.item2 — a área editável tem nome acessível próprio', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      await expect(field).toBeInTheDocument();
      // A lib dá papel de campo de texto ao elemento editável, e campo com esse
      // papel e sem nome é violação de `aria-input-field-name`. O nome entra por
      // `editorProps.attributes`: `setAttribute` de fora seria desfeito quando a
      // lib recria o nó.
      await expect(field).toHaveAttribute('aria-label', EDITOR_LABELS.editorField);
    });

    await step('functional.item2 / accessibility.item3 — uma parada de tabulação, setas atravessando os grupos', async () => {
      const bold = canvas.getByRole('button', { name: EDITOR_LABELS.actions.bold });
      const italic = canvas.getByRole('button', { name: EDITOR_LABELS.actions.italic });
      const toolbar = canvas.getByRole('toolbar', { name: EDITOR_LABELS.toolbar });

      bold.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(italic).toHaveFocus();
      await expect(italic.tabIndex).toBe(0);
      await expect(bold.tabIndex).toBe(-1);

      // A barra inteira é UMA parada: exatamente um botão na ordem de tabulação.
      const inTabOrder = Array.from(toolbar.querySelectorAll('button')).filter(
        (b) => b.tabIndex === 0,
      );
      await expect(inTabOrder).toHaveLength(1);

      // O salto que importa: do último botão do grupo de marcas para o primeiro
      // do grupo de títulos. É por isso que os grupos abrem mão do teclado — com
      // navegação própria, ela morreria na borda do primeiro grupo.
      const lastMark = canvas.getByRole('button', { name: EDITOR_LABELS.actions.highlight });
      const h1 = canvas.getByRole('button', { name: EDITOR_LABELS.actions.h1 });
      lastMark.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(h1).toHaveFocus();

      // Volta ao início para que a rodada seguinte encontre o mesmo estado.
      await userEvent.keyboard('{Home}');
      await expect(bold).toHaveFocus();
    });

    await step('functional.item1 — os botões refletem o estado do EDITOR, não o próprio clique', async () => {
      const bold = canvas.getByRole('button', { name: EDITOR_LABELS.actions.bold });
      // Sem clique nenhum: a marca é ligada pela instância, e o botão tem de
      // acender. É o que distingue uma barra presa ao editor de uma com estado
      // próprio.
      root.editor.chain().selectAll().setBold().run();
      await waitUntil(() => bold.getAttribute('aria-pressed') === 'true');
      await expect(bold).toHaveAttribute('aria-pressed', 'true');
      await expect(bold).toHaveAttribute('data-state', 'on');

      root.editor.chain().selectAll().unsetBold().run();
      await waitUntil(() => bold.getAttribute('aria-pressed') === 'false');
      await expect(bold).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Título é escolha única: ligar o H2 desliga o H1', async () => {
      const h1 = canvas.getByRole('button', { name: EDITOR_LABELS.actions.h1 });
      const h2 = canvas.getByRole('button', { name: EDITOR_LABELS.actions.h2 });

      // CURSOR, não `selectAll`. A barra reflete o bloco onde o cursor está, e
      // `selectAll` abrange também o parágrafo vazio que a lib mantém no fim do
      // documento: com dois blocos de tipos diferentes na seleção, `isActive`
      // responde falso — medido, com o HTML já em `<h1>`.
      root.editor.chain().setTextSelection(2).setHeading({ level: 1 }).run();
      await waitUntil(() => h1.getAttribute('aria-pressed') === 'true');
      await expect(h1).toHaveAttribute('aria-pressed', 'true');
      await expect(h2).toHaveAttribute('aria-pressed', 'false');

      root.editor.chain().setTextSelection(2).setHeading({ level: 2 }).run();
      await waitUntil(() => h2.getAttribute('aria-pressed') === 'true');
      await expect(h1).toHaveAttribute('aria-pressed', 'false');
      await expect(h2).toHaveAttribute('aria-pressed', 'true');

      root.editor.chain().setTextSelection(2).setParagraph().run();
      await waitUntil(() => h2.getAttribute('aria-pressed') === 'false');
      await expect(h2).toHaveAttribute('aria-pressed', 'false');
    });

    await step('functional.item11 — a saída de mudança recebe o HTML atual', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');
      await expect(args.changed).toHaveBeenCalled();
      const espiao = args.changed as ReturnType<typeof fn>;
      const last = espiao.mock.calls.at(-1)?.[0] as string;
      await expect(last).toContain('massa e energia');
    });

    await step('functional.item3 / item4 / item5 — a linha do link abre com o endereço atual', async () => {
      // Precondição própria: herdar o estado do vizinho é o mesmo erro que o
      // replay do painel Interactions provoca.
      root.editor.commands.setContent('<p>massa e energia</p>');

      const openButton = canvas.getByRole('button', { name: EDITOR_LABELS.actions.link });
      await expect(rowIsPainted(root, 'editor-link')).toBe(false);
      await openRow(openButton);
      await expect(rowIsPainted(root, 'editor-link')).toBe(true);

      const field = canvas.getByRole('textbox', { name: EDITOR_LABELS.fields.link }) as HTMLInputElement;
      await waitUntil(() => document.activeElement === field);
      await expect(field).toHaveFocus();

      // `javascript:` é o caso que a lista de esquemas existe para barrar. O
      // campo fica marcado como inválido e a linha NÃO fecha.
      await userEvent.type(field, 'javascript:alert(1){Enter}');
      await waitUntil(() => field.getAttribute('aria-invalid') === 'true');
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

      // Com o cursor no link, abrir mostra o endereço ATUAL — é o que torna a
      // linha editável em vez de só um formulário de inserção.
      await openRow(openButton);
      await waitUntil(() => field.value === 'https://exemplo.com');
      await expect(field).toHaveValue('https://exemplo.com');

      // O botão de tirar só existe quando há link — botão que não faz nada é
      // ruído, e desabilitado seria pior: anuncia a ação e nega em seguida.
      const unlinkButton = canvas.getByRole('button', { name: EDITOR_LABELS.fields.linkRemove });
      await expect(getComputedStyle(unlinkButton).display).not.toBe('none');
      await userEvent.click(unlinkButton);
      await expect(root.querySelector('a')).toBeNull();

      // Sem link no trecho, ele some. A asserção lê o `display` COMPUTADO: o
      // `.nds-button` declara `display: inline-flex`, e declaração de autor
      // vence o `[hidden]` do navegador.
      await openRow(openButton);
      await waitUntil(() => getComputedStyle(unlinkButton).display === 'none');
      await expect(getComputedStyle(unlinkButton).display).toBe('none');

      // Apagar o campo e confirmar continua tirando o link — o caminho antigo,
      // que agora é atalho e não a única porta.
      await userEvent.type(field, 'exemplo.com{Enter}');
      await expect(root.querySelector('a')).toBeInTheDocument();
      await openRow(openButton);
      await userEvent.clear(field);
      await userEvent.keyboard('{Enter}');
      await expect(root.querySelector('a')).toBeNull();
    });

    await step('functional.item6 — a fórmula entra, é renderizada e se ATUALIZA', async () => {
      const openButton = canvas.getByRole('button', { name: EDITOR_LABELS.actions.formula });
      await expect(openButton).toHaveAttribute('aria-expanded', 'false');
      await openRow(openButton);
      await expect(rowIsPainted(root, 'editor-formula')).toBe(true);

      const field = canvas.getByRole('textbox', { name: EDITOR_LABELS.fields.formula }) as HTMLInputElement;
      await waitUntil(() => document.activeElement === field);
      await userEvent.type(field, 'E = mc^2');
      await userEvent.click(canvas.getByRole('button', { name: EDITOR_LABELS.fields.formulaConfirm }));

      const formulas = root.querySelectorAll('[data-type="inline-math"]');
      await expect(formulas).toHaveLength(1);
      await expect(formulas[0]).toHaveAttribute('data-latex', 'E = mc^2');
      // O KaTeX escreve MathML junto do HTML visual — é assim que a fórmula
      // chega ao leitor de tela em vez de virar um amontoado de <span>.
      //
      // A asserção NÃO é `toBeInTheDocument`: `<math>` é `MathMLElement`, e o
      // jest-dom só aceita `HTMLElement` ou `SVGElement`.
      const mathml = formulas[0].querySelector('math');
      await expect(mathml).not.toBeNull();

      // A linha fecha e o mesmo botão abre e fecha, sem inserir nada.
      await waitUntil(() => !rowIsPainted(root, 'editor-formula'));
      await expect(rowIsPainted(root, 'editor-formula')).toBe(false);
      await openRow(openButton);
      await closeRow(openButton);

      // Fórmula sob o cursor se EDITA, não duplica. O que se vê na tela é o
      // resultado renderizado, então abrir com o LaTeX de volta é o único
      // caminho para corrigir uma.
      selectFormula(root);
      await openRow(openButton);
      await waitUntil(() => field.value === 'E = mc^2');
      await expect(field).toHaveValue('E = mc^2');
      await userEvent.clear(field);
      await userEvent.type(field, 'a^2 + b^2{Enter}');

      const depois = root.querySelectorAll('[data-type="inline-math"]');
      await expect(depois).toHaveLength(1);
      await expect(depois[0]).toHaveAttribute('data-latex', 'a^2 + b^2');
    });

    await step('LaTeX inválido não some: fica visível e marcado como erro', async () => {
      const openButton = canvas.getByRole('button', { name: EDITOR_LABELS.actions.formula });
      await openRow(openButton);
      const field = canvas.getByRole('textbox', { name: EDITOR_LABELS.fields.formula }) as HTMLInputElement;
      await userEvent.clear(field);
      // Sem chaves de propósito: no `userEvent.type`, `{` abre descritor de
      // tecla, e um LaTeX cheio de chaves testaria mais a escapagem do teclado
      // sintético que o editor. Comando inexistente erra igual.
      await userEvent.type(field, '\\comandoquenaoexiste{Enter}');
      const errorNode = root.querySelector('.inline-math-error');
      await expect(errorNode).toBeInTheDocument();

      // Devolve o documento ao estado de demonstração: o que a play deixa é o
      // que a pessoa VÊ ao abrir a story, e é o que o Chromatic fotografa.
      root.editor.commands.setContent(EDITOR_CONTENT.playground);
      await expect(root.querySelector('.inline-math-error')).toBeNull();
    });
  },
};
