/**
 * Snippets do painel Code do Command — um construtor por story, mais os dois
 * cartões de Variantes da docs page que desenham a lista da DEMONSTRAÇÃO
 * (inline e command palette); o terceiro cartão reaproveita o da `WithGroups`.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * O que estes snippets ensinam é a ordem das peças da paleta: campo de busca,
 * lista com os grupos, e a frase de vazio POR ÚLTIMO e FORA da lista — ela é o
 * que sobra quando o filtro não encontra nada, precisa existir no template desde
 * o começo para ser anunciada, e `role="status"` não é filho permitido de
 * `role="listbox"`. O `placeholder` faz dobradinha: é o texto do campo e o nome
 * acessível dele e da lista.
 *
 * Cada construtor espelha a story ao lado item por item — mesmo placeholder,
 * mesmos comandos, mesmos grupos. É o que o `command.source.test.ts` cobra: o
 * painel Code é a única parte da página feita para ser copiada, e ele não pode
 * ensinar uma lista diferente da que está desenhada no canvas.
 */

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  onItemSelect: (details: { value: string; label: string }) => void;
};

/** Um comando, na forma em que o template o escreve. */
type CommandEntry = {
  value: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
};

/** Um bloco da lista: um `ndsCommandGroup`, com ou sem cabeçalho. */
type Block = { heading?: string; items: CommandEntry[] };

type PaletteOptions = {
  placeholder?: string;
  emptyMessage?: string;
  blocks: Block[];
  /** Liga `(itemSelect)` — só quando a story exercita a escolha. */
  selectable?: boolean;
};

const PLACEHOLDER = 'Buscar componente...';
const NO_RESULT = 'Nenhum resultado encontrado.';

const COMMAND_IMPORT = "import { NDS_COMMAND } from '@/components/ui/command';";
const COMMAND_IMPORT_WITH_TYPE =
  "import { NDS_COMMAND, type CommandSelectDetails } from '@/components/ui/command';";

/** O corpo que recebe o comando escolhido — o mesmo em todo snippet que escolhe. */
const RUN_METHOD = `  run(command: CommandSelectDetails): void {
    // roda o comando pelo command.value
  }`;

/** Os blocos da Playground. */
const COMPONENTS_AND_UTILS: Block[] = [
  {
    heading: 'Componentes',
    items: [
      { value: 'button', label: 'Button' },
      { value: 'input', label: 'Input' },
      { value: 'separator', label: 'Separator' },
    ],
  },
  {
    heading: 'Utilitários',
    items: [
      { value: 'cn', label: 'cn()' },
      { value: 'clsx', label: 'clsx()' },
    ],
  },
];

/**
 * Os blocos da demonstração da docs page — Button e Input em Componentes,
 * Separator em Utilitários. É a lista que os cartões Inline e Command palette
 * desenham, e o código embaixo deles não pode ensinar outra.
 */
const DEMO_BLOCKS: Block[] = [
  {
    heading: 'Componentes',
    items: [
      { value: 'button', label: 'Button' },
      { value: 'input', label: 'Input' },
    ],
  },
  { heading: 'Utilitários', items: [{ value: 'separator', label: 'Separator' }] },
];

/** A mesma lista na paleta: os dois componentes ganham o atalho desenhado. */
const DEMO_PALETTE_BLOCKS: Block[] = [
  {
    heading: 'Componentes',
    items: [
      { value: 'button', label: 'Button', shortcut: 'Ctrl+B' },
      { value: 'input', label: 'Input', shortcut: 'Ctrl+I' },
    ],
  },
  { heading: 'Utilitários', items: [{ value: 'separator', label: 'Separator' }] },
];

/** Os 30 nomes da lista longa — os mesmos da story `LongList`. */
const LONG_COMPONENT_NAMES = [
  'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
  'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
  'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
  'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
  'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
  'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
];

/**
 * Uma linha de comando.
 *
 * O atalho vai DENTRO do item e sem `textValue`: o filtro já deixa o atalho de
 * fora sozinho, então escrever `textValue` aqui ensinaria um passo que não
 * existe. `[disabled]` e `[checked]` só aparecem quando a story os usa — quem
 * copia não aprende a declarar o padrão.
 */
function commandLine(c: CommandEntry, pad: string): string {
  const attrs = [
    `value="${c.value}"`,
    c.disabled ? '[disabled]="true"' : '',
    c.checked !== undefined ? `[checked]="${c.checked}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const shortcut = c.shortcut ? ` <span ndsCommandShortcut>${c.shortcut}</span>` : '';
  return `${pad}<div ndsCommandItem ${attrs}>${c.label}${shortcut}</div>`;
}

function groupBlock(b: Block, pad: string): string {
  const heading = b.heading ? ` heading="${b.heading}"` : '';
  const lines = b.items.map((c) => commandLine(c, `${pad}  `)).join('\n');
  return `${pad}<div ndsCommandGroup${heading}>\n${lines}\n${pad}</div>`;
}

/** O `<nds-command>` inteiro, recuado em `pad`. */
function paletteMarkup(p: PaletteOptions, pad: string): string {
  const onSelect = p.selectable ? ' (itemSelect)="run($event)"' : '';
  const blocks = p.blocks
    .map((b) => groupBlock(b, `${pad}    `))
    .join(`\n\n${pad}    <div ndsCommandSeparator></div>\n\n`);

  return `${pad}<nds-command${onSelect}>
${pad}  <input ndsCommandInput placeholder="${p.placeholder ?? PLACEHOLDER}" />

${pad}  <div ndsCommandList>
${blocks}
${pad}  </div>

${pad}  <div ndsCommandEmpty>${p.emptyMessage ?? NO_RESULT}</div>
${pad}</nds-command>`;
}

/** O componente que se escreve: import, template e — quando há — corpo. */
function example(p: PaletteOptions): string {
  return `${p.selectable ? COMMAND_IMPORT_WITH_TYPE : COMMAND_IMPORT}

@Component({
  imports: [...NDS_COMMAND],
  template: \`
${paletteMarkup(p, '    ')}
  \`,
})
export class Exemplo {${p.selectable ? `\n${RUN_METHOD}\n` : ''}}`;
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprime o `template` da story literalmente — com o `@if` que
 * alterna os grupos e com `(itemSelect)` ligado ao espião. O `transform`
 * devolve o uso real, montado a partir dos controls (armadilha 3).
 *
 * Sem grupos, a lista vira UM bloco sem cabeçalho e sem traço: traço separa
 * blocos, e com um bloco só não há o que separar.
 */
export function commandPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<CommandArgs> } = {},
): string {
  const {
    placeholder = PLACEHOLDER,
    emptyMessage = NO_RESULT,
    showGroups = true,
  } = ctx.args ?? {};

  const blocks: Block[] = showGroups
    ? COMPONENTS_AND_UTILS
    : [{ items: COMPONENTS_AND_UTILS.flatMap((b) => b.items) }];

  return example({ placeholder, emptyMessage, blocks, selectable: true });
}

// ─── Variants ─────────────────────────────────────────────────────────────────

/** Vários grupos nomeados, com traço entre eles — story `WithGroups`. */
export function commandWithGroupsSource(): string {
  return example({
    blocks: [
      {
        heading: 'Componentes',
        items: [
          { value: 'button', label: 'Button' },
          { value: 'input', label: 'Input' },
          { value: 'badge', label: 'Badge' },
          { value: 'separator', label: 'Separator' },
        ],
      },
      {
        heading: 'Utilitários',
        items: [
          { value: 'cn', label: 'cn()' },
          { value: 'clsx', label: 'clsx()' },
          { value: 'twmerge', label: 'twMerge()' },
        ],
      },
    ],
  });
}

// ─── States ───────────────────────────────────────────────────────────────────

/**
 * Sem resultados — story `EmptyState`.
 *
 * A busca que a story já traz digitada NÃO entra: ela é o estado que se está
 * olhando, não código de quem monta a paleta. O que o snippet ensina é a frase
 * de vazio no lugar certo.
 */
export function commandEmptyStateSource(): string {
  return example({
    blocks: [
      {
        items: [
          { value: 'button', label: 'Button' },
          { value: 'input', label: 'Input' },
          { value: 'separator', label: 'Separator' },
        ],
      },
    ],
  });
}

/** Um comando desabilitado no meio da lista — story `ItemDisabled`. */
export function commandItemDisabledSource(): string {
  return example({
    placeholder: 'Buscar comando...',
    selectable: true,
    blocks: [
      {
        items: [
          { value: 'novo', label: 'Novo' },
          { value: 'arquivar', label: 'Arquivar', disabled: true },
          { value: 'renomear', label: 'Renomear' },
        ],
      },
    ],
  });
}

/** Comandos marcáveis, um deles com atalho — story `CheckedItem`. */
export function commandCheckedItemSource(): string {
  return example({
    placeholder: 'Buscar tema...',
    blocks: [
      {
        heading: 'Aparência',
        items: [
          { value: 'claro', label: 'Claro', checked: true },
          { value: 'escuro', label: 'Escuro', checked: false },
          { value: 'sistema', label: 'Sistema', checked: true, shortcut: 'Ctrl+S' },
        ],
      },
    ],
  });
}

/**
 * Lista longa — story `LongList`.
 *
 * Aqui a lista vem de um array, e o snippet mostra essa forma: com trinta
 * comandos, escrever um `<div>` por linha é o que ninguém faz.
 */
export function commandLongListSource(): string {
  const names = LONG_COMPONENT_NAMES.map((n) => `'${n}'`);
  const lines: string[] = [];
  for (let i = 0; i < names.length; i += 5) lines.push(`    ${names.slice(i, i + 5).join(', ')},`);

  return `${COMMAND_IMPORT}

@Component({
  imports: [...NDS_COMMAND],
  template: \`
    <nds-command>
      <input ndsCommandInput placeholder="${PLACEHOLDER}" />

      <div ndsCommandList>
        <div ndsCommandGroup heading="Componentes">
          @for (name of components; track name) {
            <div ndsCommandItem [value]="name.toLowerCase()">{{ name }}</div>
          }
        </div>
      </div>

      <div ndsCommandEmpty>${NO_RESULT}</div>
    </nds-command>
  \`,
})
export class Exemplo {
  readonly components = [
${lines.join('\n')}
  ];
}`;
}

// ─── Compositions ─────────────────────────────────────────────────────────────

/** Atalho à direita de cada comando — story `WithShortcuts`. */
export function commandWithShortcutsSource(): string {
  return example({
    placeholder: 'Buscar comando...',
    blocks: [
      {
        heading: 'Arquivo',
        items: [
          { value: 'novo', label: 'Novo arquivo', shortcut: 'Ctrl+N' },
          { value: 'abrir', label: 'Abrir', shortcut: 'Ctrl+O' },
          { value: 'salvar', label: 'Salvar', shortcut: 'Ctrl+S' },
        ],
      },
      {
        heading: 'Aplicativo',
        items: [{ value: 'preferencias', label: 'Preferências' }],
      },
    ],
  });
}

/**
 * Traço entre dois blocos SEM cabeçalho — story `WithSeparator`.
 *
 * O traço é uma quebra na sequência, não um título: os dois blocos são grupos
 * sem `heading`, e o traço some junto quando o filtro esvazia um dos lados.
 */
export function commandWithSeparatorSource(): string {
  return example({
    placeholder: 'Buscar comando...',
    blocks: [
      {
        items: [
          { value: 'novo', label: 'Novo arquivo' },
          { value: 'abrir', label: 'Abrir recente' },
        ],
      },
      { items: [{ value: 'sair', label: 'Sair' }] },
    ],
  });
}

/** Três comandos desabilitados entre seis — story `WithDisabledItems`. */
export function commandWithDisabledItemsSource(): string {
  return example({
    placeholder: 'Buscar...',
    selectable: true,
    blocks: [
      {
        heading: 'Componentes',
        items: [
          { value: 'button', label: 'Button' },
          { value: 'input', label: 'Input', disabled: true },
          { value: 'badge', label: 'Badge' },
          { value: 'select', label: 'Select', disabled: true },
        ],
      },
      {
        heading: 'Utilitários',
        items: [
          { value: 'cn', label: 'cn()' },
          { value: 'clsx', label: 'clsx()', disabled: true },
        ],
      },
    ],
  });
}

/**
 * A paleta dentro de um Dialog, aberta por botão ou por Ctrl+K — story
 * `CommandPalette`.
 *
 * Forma própria: o Dialog e o atalho global são o assunto, e nenhum dos dois
 * aparece na paleta sozinha. O atalho é um ouvinte de janela que QUEM CONSOME
 * registra — componente nenhum o faz —, e a dica dele fica DENTRO do gatilho,
 * num `<kbd>`: é o texto visível que dá nome ao botão, então nada de
 * `aria-label` por cima dele.
 */
export function commandPaletteSource(): string {
  return paletteInDialog([
    {
      heading: 'Componentes',
      items: [
        { value: 'button', label: 'Button', shortcut: 'Ctrl+B' },
        { value: 'input', label: 'Input', shortcut: 'Ctrl+I' },
      ],
    },
    { heading: 'Utilitários', items: [{ value: 'cn', label: 'cn()' }] },
  ]);
}

// ─── Cartões de Variantes da docs page ────────────────────────────────────────

/** Cartão "Inline" — a lista da demonstração, desenhada direto na página. */
export function commandDemoInlineSource(): string {
  return example({ blocks: DEMO_BLOCKS, selectable: true });
}

/**
 * Cartão "Command palette" — a composição com o Dialog, com a lista da
 * demonstração. O cartão desenha o gatilho e, embaixo, a paleta como ela fica
 * dentro do diálogo; o que se copia é a composição inteira que abre de verdade.
 */
export function commandDemoPaletteSource(): string {
  return paletteInDialog(DEMO_PALETTE_BLOCKS);
}

/** O componente com o Dialog, o gatilho, o Ctrl+K e a paleta de `blocks`. */
function paletteInDialog(blocks: Block[]): string {
  const body = paletteMarkup({ selectable: true, blocks }, '          ');

  return `${COMMAND_IMPORT_WITH_TYPE}
import { NDS_DIALOG } from '@/components/ui/dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_COMMAND, ...NDS_DIALOG, NdsButton],
  // O atalho global é de quem consome — componente nenhum o registra.
  host: { '(window:keydown)': 'openFromShortcut($event)' },
  template: \`
    <div ndsDialog [open]="open()" (openChange)="open.set($event)">
      <button ndsDialogTrigger ndsButton variant="outline">
        Buscar <kbd class="nds-kbd">Ctrl+K</kbd>
      </button>

      <ng-template ndsDialogPortal>
        <div ndsDialogOverlay></div>

        <div ndsDialogContent class="nds-command-dialog-content" [showCloseButton]="false">
          <!-- O diálogo precisa de nome; desenhado sobre a busca, seria redundante. -->
          <h2 ndsDialogTitle class="nds-sr-only">Command Palette</h2>
          <p ndsDialogDescription class="nds-sr-only">Busque por um comando ou ação...</p>

${body}
        </div>
      </ng-template>
    </div>
  \`,
})
export class Exemplo {
  readonly open = signal(false);

  openFromShortcut(event: KeyboardEvent): void {
    if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
    // Sem isto o navegador leva o Ctrl+K para a barra de endereço.
    event.preventDefault();
    this.open.set(true);
  }

  run(command: CommandSelectDetails): void {
    // roda o comando pelo command.value, e a paleta fecha
    this.open.set(false);
  }
}`;
}
