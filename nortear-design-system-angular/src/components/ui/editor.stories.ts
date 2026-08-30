import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, fn } from 'storybook/test';
import {
  EditorComponent,
  type EditorHostElement,
  type EditorLabels,
  type EditorPreset,
} from './editor';
import {
  EDITOR_CONTENT,
  EDITOR_LABELS,
  closeRow,
  waitUntil,
  openRow,
  rowIsPainted,
  selectFormula,
} from './editor.fixtures';
import { editorSource } from './editor.source';
import { NdsEditorDocs } from '@/components/docs/EditorDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type EditorArgs = {
  content: string;
  editable: boolean;
  preset: EditorPreset;
  labels: EditorLabels;
  changed?: (html: string) => void;
  // As duas costuras de imagem entram no tipo para que a API Reference as liste:
  // `argTypes` só aceita chave que exista nos args, e sem elas a tabela ficava
  // com quatro linhas de sete. O Playground não as liga — quem as demonstra são
  // as stories de Compositions.
  resolveImage?: (file: File) => Promise<string | null>;
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
};

const meta: Meta<EditorArgs> = {
  title: 'Primitives/Form/Editor',
  tags: ['autodocs', 'form'],
  decorators: [moduleMetadata({ imports: [EditorComponent] })],
  parameters: {
    // `padded` e não `centered`: o editor é `width: 100%`, e sob `centered` a
    // caixa encolhe até o texto.
    layout: 'padded',
    // O `transform` do meta cobre a story do Playground; as outras sete
    // declaram o seu, no arquivo de story de cada uma.
    docs: { page: withAutoDocsTab(NdsEditorDocs), source: { transform: editorSource } },
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
      description:
        'Conjunto de botões da barra. Muda o que a barra expõe, não o que o documento aceita.',
      table: {
        type: { summary: '"basic" | "advanced"' },
        defaultValue: { summary: '"advanced"' },
      },
    },
    // `labels` é a única prop OBRIGATÓRIA: todos os botões são só de ícone, e
    // sem ela a barra não tem nome acessível nenhum. `control: false` porque um
    // objeto de 50 chaves no painel Controls é ilegível — o que importa é que a
    // API Reference a liste como obrigatória.
    labels: {
      control: false,
      description:
        'Nome acessível da barra, da área editável, de cada bloco, de cada botão e dos '
        + 'campos de entrada. Não há texto visível de onde deduzi-los.',
      table: { type: { summary: 'EditorLabels' }, defaultValue: { summary: '—' } },
    },
    // Sem entrada em argTypes o renderer Angular não repassa a função em
    // `props`, e o `(changed)` do template fica ligado a nada — sem erro.
    changed: {
      control: false,
      description: 'Emitido a cada mudança do conteúdo, com o HTML atual.',
      table: { type: { summary: '(html: string) => void' }, defaultValue: { summary: '—' } },
    },
    resolveImage: {
      control: false,
      description:
        'Decide de onde vem o endereço da imagem escolhida. Devolver nulo recusa a '
        + 'inserção, sem erro.',
      table: {
        type: { summary: '(file: File) => Promise<string | null>' },
        defaultValue: { summary: 'arquivo embutido em base64' },
      },
    },
    describeImage: {
      control: false,
      description:
        'Escreve o texto alternativo a partir da imagem. Recebe o arquivo quando existe: '
        + 'imagem colada de outra página chega só como endereço.',
      table: {
        type: { summary: '(file: File | null, src: string) => Promise<string | null>' },
        defaultValue: { summary: '—' },
      },
    },
  },
  args: {
    content: EDITOR_CONTENT.playground,
    editable: true,
    preset: 'advanced',
    labels: EDITOR_LABELS,
    changed: fn(),
  },
};

export default meta;
type Story = StoryObj<EditorArgs>;

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
  // `labels` já vem dos args — declará-la em `argTypes` é o que a faz aparecer
  // na API Reference, e reescrevê-la aqui esconderia um arg do que a story usa.
  render: (args) => ({
    props: { ...args },
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

    await step('A caixa da lista de tarefas é alvo de toque, e senta na primeira linha', async () => {
      root.editor.commands.setContent('<p>massa e energia</p>');

      const taskButton = canvas.getByRole('button', { name: EDITOR_LABELS.actions.taskList });
      root.editor.chain().setTextSelection(2).toggleTaskList().run();
      await waitUntil(() => taskButton.getAttribute('aria-pressed') === 'true');
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

      root.editor.chain().setTextSelection(2).toggleTaskList().run();
      await waitUntil(() => taskButton.getAttribute('aria-pressed') === 'false');
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
