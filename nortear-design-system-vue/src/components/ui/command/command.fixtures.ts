// ─── Dados e consultas compartilhados das stories do Command ─────────────────
//
// Os itens, grupos e placeholders são os das stories do Vanilla, que é a
// referência cross-stack: divergir aqui é o que faz a mesma story mostrar coisas
// diferentes em cada stack.
//
// Módulo de TS puro — sem `.vue` e sem `storybook/test` — porque o
// `command.source.ts` monta o painel Code a partir destes MESMOS dados, e ele
// roda no projeto `unit` do vitest, em node. Uma fonte só para o que a story
// desenha e para o que o painel ensina: é o que impede os dois de divergirem.

/** Um comando da lista. */
export interface CommandEntry {
  value: string
  label: string
  /** Atalho exibido à direita — só visual; registrar a tecla é da aplicação. */
  shortcut?: string
  disabled?: boolean
  /** Ausente = o comando não é marcável e não ganha marca. */
  checked?: boolean
}

/**
 * Um bloco da lista: vira um `CommandGroup`, com cabeçalho só quando há
 * `heading`. Entre dois blocos entra um `CommandSeparator` — a mesma regra do
 * Vanilla, que traça a fronteira entre grupos.
 */
export interface CommandBlock {
  heading?: string
  items: CommandEntry[]
}

/** Moldura das demonstrações inline: borda e sombra são do call site. */
export const FRAME = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md'

export const NO_RESULT = 'Nenhum resultado encontrado.'

// ─── Conteúdo de cada story (copiado do Vanilla) ──────────────────────────────

export const PLAYGROUND_BLOCKS: CommandBlock[] = [
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
]

export const GROUPED_BLOCKS: CommandBlock[] = [
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
]

export const EMPTY_STATE_BLOCKS: CommandBlock[] = [
  {
    items: [
      { value: 'button', label: 'Button' },
      { value: 'input', label: 'Input' },
      { value: 'separator', label: 'Separator' },
    ],
  },
]

/** A busca com que o estado vazio já nasce — e termina. */
export const EMPTY_STATE_SEARCH = 'xyznotfound'

export const DISABLED_ITEM_BLOCKS: CommandBlock[] = [
  {
    items: [
      { value: 'novo', label: 'Novo' },
      { value: 'arquivar', label: 'Arquivar', disabled: true },
      { value: 'renomear', label: 'Renomear' },
    ],
  },
]

export const CHECKED_BLOCKS: CommandBlock[] = [
  {
    heading: 'Aparência',
    items: [
      { value: 'claro', label: 'Claro', checked: true },
      { value: 'escuro', label: 'Escuro', checked: false },
      { value: 'sistema', label: 'Sistema', checked: true, shortcut: 'Ctrl+S' },
    ],
  },
]

export const LONG_LIST_NAMES = [
  'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
  'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
  'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
  'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
  'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
  'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
]

export const SHORTCUT_BLOCKS: CommandBlock[] = [
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
]

/** Dois blocos SEM cabeçalho: o traço é a única coisa que os separa. */
export const SEPARATOR_BLOCKS: CommandBlock[] = [
  {
    items: [
      { value: 'novo', label: 'Novo arquivo' },
      { value: 'abrir', label: 'Abrir recente' },
    ],
  },
  { items: [{ value: 'sair', label: 'Sair' }] },
]

export const DISABLED_ITEMS_BLOCKS: CommandBlock[] = [
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
]

export const PALETTE_BLOCKS: CommandBlock[] = [
  {
    heading: 'Componentes',
    items: [
      { value: 'button', label: 'Button', shortcut: 'Ctrl+B' },
      { value: 'input', label: 'Input', shortcut: 'Ctrl+I' },
    ],
  },
  {
    heading: 'Utilitários',
    items: [{ value: 'cn', label: 'cn()' }],
  },
]

export const PALETTE_TITLE = 'Command Palette'
export const PALETTE_DESCRIPTION = 'Busque por um comando ou ação...'

// ─── Template da lista, para as stories ───────────────────────────────────────

/**
 * A lista desenhada a partir dos blocos. Quem usa registra `CommandList`,
 * `CommandGroup`, `CommandItem`, `CommandSeparator` e `CommandShortcut`, e
 * devolve `blocks` e `select` do `setup`.
 */
export const LIST_TEMPLATE = `
<CommandList>
  <template v-for="(block, index) in blocks" :key="index">
    <CommandSeparator v-if="index > 0" />
    <CommandGroup :heading="block.heading">
      <CommandItem
        v-for="item in block.items"
        :key="item.value"
        :value="item.value"
        :disabled="item.disabled"
        :checked="item.checked"
        @select="select(item.value)"
      >
        {{ item.label }}
        <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </template>
</CommandList>`

// ─── Consultas ────────────────────────────────────────────────────────────────

/** O item pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
export const commandItem = (root: ParentNode, value: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!

/**
 * Os traços que a pessoa VÊ. O traço de um lado esvaziado continua no DOM com
 * `hidden` (o Vanilla o remove), então a contagem é pelo que aparece.
 */
export const visibleSeparators = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]'))
    .filter(el => el.checkVisibility())

export const searchOf = (root: ParentNode): HTMLInputElement =>
  root.querySelector<HTMLInputElement>('[data-slot="command-input"]')!

/** A região viva de "sem resultados" — irmã da lista, nunca filha dela. */
export const emptyRegion = (root: ParentNode): HTMLElement =>
  root.querySelector<HTMLElement>('[data-slot="command-empty"]')!

/** O comando em destaque — o que o Enter ativaria. */
export const highlighted = (root: ParentNode): HTMLElement | null =>
  root.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
