// ─── Andaime compartilhado das stories do Command ─────────────────────────────
//
// As stories de variants, states e compositions procuram os mesmos nós. Uma
// cópia por arquivo é dívida mecânica enquanto os corpos coincidem — e vira
// defeito silencioso no dia em que alguém corrige um e não os outros, que é o
// que `fixture_duplicada_entre_stories` mede. Mesma forma do `command.fixtures`
// do Vanilla, com nomes em inglês.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story.
//
// ─── Uma lista, dois leitores (2026-09-10) ──────────────────────────────────
//
// As LISTAS das stories moram aqui também, junto de `commandBlocks`, que decide
// onde começa um grupo e onde cai um traço: `CommandInlineStory.svelte` e
// `CommandPaletteStory.svelte` as desenham, e `command.source.ts` as escreve no
// painel Code. Até esta data cada story tinha a lista escrita à mão no invólucro
// e outra vez na transform, e as duas cópias derivavam em silêncio.
//
// Por que AQUI, e não no `command.source.ts` onde nasceram: aquele módulo só
// exporta construtor de snippet chamável sem argumento, e é isso que deixa a
// varredura transversal (`source-snippets.test.ts`) chamar cada export e
// conferir o que ele ensina. Dado e auxiliar exportados de lá reprovavam a
// convenção de nome e quebravam a chamada sem argumento — dezesseis falhas que
// ninguém viu porque a varredura não rodou depois da mudança.

// ─── Forma da lista ──────────────────────────────────────────────────────────

/**
 * Um comando da lista. `group` o põe sob um cabeçalho; sem ele, o comando cai
 * num grupo SEM cabeçalho, junto dos vizinhos também sem grupo.
 */
export type CommandEntryItem = {
  type?: 'item';
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  /** `undefined` = o comando não é marcável; definido, vira `checked={…}`. */
  checked?: boolean;
  /** Só visual — registrar a tecla é da aplicação (C5). */
  shortcut?: string;
};

/** Traço declarado entre dois blocos de uma lista. */
export type CommandEntrySeparator = { type: 'separator' };

/** A lista aceita comandos e traços, em união discriminada por `type` — a forma do Vanilla. */
export type CommandEntry = CommandEntryItem | CommandEntrySeparator;

export type CommandBlock =
  | { kind: 'group'; heading: string; items: CommandEntryItem[] }
  | { kind: 'loose'; items: CommandEntryItem[] }
  | { kind: 'separator' };

function isSeparator(entry: CommandEntry): entry is CommandEntrySeparator {
  return entry.type === 'separator';
}

/**
 * A lista, em blocos de marcação.
 *
 * Comandos consecutivos do mesmo `group` formam um `CommandGroup` com
 * cabeçalho; comandos consecutivos sem grupo formam um `CommandGroup` SEM
 * cabeçalho (`kind: 'loose'`) — a caixa que dá o respiro de 4px aos comandos
 * e não se anuncia como grupo, a forma da fábrica do Vanilla (2026-09-10).
 * Entre um grupo nomeado e o SEGUINTE entra um traço sozinho — é o que a
 * fábrica do Vanilla desenha, e é por isso que as listas das stories só
 * declaram `{ type: 'separator' }` onde não há grupo nomeado a separar.
 */
export function commandBlocks(entries: readonly CommandEntry[]): CommandBlock[] {
  const blocks: CommandBlock[] = [];
  for (const entry of entries) {
    if (isSeparator(entry)) {
      blocks.push({ kind: 'separator' });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (entry.group === undefined) {
      if (last?.kind === 'loose') last.items.push(entry);
      else blocks.push({ kind: 'loose', items: [entry] });
      continue;
    }
    if (last?.kind === 'group' && last.heading === entry.group) {
      last.items.push(entry);
      continue;
    }
    if (last?.kind === 'group') blocks.push({ kind: 'separator' });
    blocks.push({ kind: 'group', heading: entry.group, items: [entry] });
  }
  return blocks;
}

// ─── Listas das stories ──────────────────────────────────────────────────────
//
// Conteúdo copiado das stories do Vanilla, que é a referência: itens, grupos,
// placeholders e buscas são os de lá.

export const NO_RESULT = 'Nenhum resultado encontrado.';

/** Playground: Componentes (Button, Input, Separator) e Utilitários (cn(), clsx()). */
export const PLAYGROUND_ITEMS: readonly CommandEntry[] = [
  { value: 'button', label: 'Button', group: 'Componentes' },
  { value: 'input', label: 'Input', group: 'Componentes' },
  { value: 'separator', label: 'Separator', group: 'Componentes' },
  { value: 'cn', label: 'cn()', group: 'Utilitários' },
  { value: 'clsx', label: 'clsx()', group: 'Utilitários' },
];

/** Variante WithGroups: 4 componentes e 3 utilitários. */
export const GROUPED_ITEMS: readonly CommandEntry[] = [
  { value: 'button', label: 'Button', group: 'Componentes' },
  { value: 'input', label: 'Input', group: 'Componentes' },
  { value: 'badge', label: 'Badge', group: 'Componentes' },
  { value: 'separator', label: 'Separator', group: 'Componentes' },
  { value: 'cn', label: 'cn()', group: 'Utilitários' },
  { value: 'clsx', label: 'clsx()', group: 'Utilitários' },
  { value: 'twmerge', label: 'twMerge()', group: 'Utilitários' },
];

/** Estado EmptyState: três comandos sem grupo, e a busca que não casa com nenhum. */
export const EMPTY_STATE_ITEMS: readonly CommandEntry[] = [
  { value: 'button', label: 'Button' },
  { value: 'input', label: 'Input' },
  { value: 'separator', label: 'Separator' },
];
export const EMPTY_STATE_SEARCH = 'xyznotfound';

/** Estado ItemDisabled: o do meio não executa nem recebe a seta. */
export const DISABLED_ITEM_ITEMS: readonly CommandEntry[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'arquivar', label: 'Arquivar', disabled: true },
  { value: 'renomear', label: 'Renomear' },
];

/**
 * Estado CheckedItem: `checked` é o que torna o comando marcável — `true` e
 * `false` são os dois estados de um mesmo comando, e o terceiro junta marca e
 * atalho para mostrar que a folha esconde a marca (D7).
 */
export const CHECKED_ITEM_ITEMS: readonly CommandEntry[] = [
  { value: 'claro', label: 'Claro', group: 'Aparência', checked: true },
  { value: 'escuro', label: 'Escuro', group: 'Aparência', checked: false },
  { value: 'sistema', label: 'Sistema', group: 'Aparência', checked: true, shortcut: 'Ctrl+S' },
];

/** Estado LongList: 30 componentes num grupo só — a lista passa do teto e rola. */
export const LONG_LIST_NAMES = [
  'Accordion', 'Alert', 'AlertDialog', 'AspectRatio', 'Avatar',
  'Badge', 'Breadcrumb', 'Button', 'Calendar', 'Card',
  'Carousel', 'Chart', 'Checkbox', 'Collapsible', 'Command',
  'ContextMenu', 'DataTable', 'DatePicker', 'Dialog', 'Drawer',
  'DropdownMenu', 'Form', 'HoverCard', 'Input', 'InputOTP',
  'Label', 'Menubar', 'NavigationMenu', 'Pagination', 'Popover',
] as const;
export const LONG_LIST_ITEMS: readonly CommandEntry[] = LONG_LIST_NAMES.map((label) => ({
  value: label.toLowerCase(),
  label,
  group: 'Componentes',
}));

/** Composição WithSeparator: dois grupos sem cabeçalho, divididos por um traço declarado. */
export const SEPARATOR_ITEMS: readonly CommandEntry[] = [
  { value: 'novo', label: 'Novo arquivo' },
  { value: 'abrir', label: 'Abrir recente' },
  { type: 'separator' },
  { value: 'sair', label: 'Sair' },
];

/** Composição WithShortcuts: o atalho mora dentro do comando. */
export const SHORTCUT_ITEMS: readonly CommandEntry[] = [
  { value: 'novo', label: 'Novo arquivo', group: 'Arquivo', shortcut: 'Ctrl+N' },
  { value: 'abrir', label: 'Abrir', group: 'Arquivo', shortcut: 'Ctrl+O' },
  { value: 'salvar', label: 'Salvar', group: 'Arquivo', shortcut: 'Ctrl+S' },
  { value: 'preferencias', label: 'Preferências', group: 'Aplicativo' },
];

/** Composição WithDisabledItems: seis comandos, três desabilitados. */
export const DISABLED_ITEMS: readonly CommandEntry[] = [
  { value: 'button', label: 'Button', group: 'Componentes' },
  { value: 'input', label: 'Input', group: 'Componentes', disabled: true },
  { value: 'badge', label: 'Badge', group: 'Componentes' },
  { value: 'select', label: 'Select', group: 'Componentes', disabled: true },
  { value: 'cn', label: 'cn()', group: 'Utilitários' },
  { value: 'clsx', label: 'clsx()', group: 'Utilitários', disabled: true },
];

/** Composição CommandPalette: os comandos da paleta aberta pelo gatilho ou pelo atalho. */
export const PALETTE_ITEMS: readonly CommandEntry[] = [
  { value: 'button', label: 'Button', group: 'Componentes', shortcut: 'Ctrl+B' },
  { value: 'input', label: 'Input', group: 'Componentes', shortcut: 'Ctrl+I' },
  { value: 'cn', label: 'cn()', group: 'Utilitários' },
];
export const PALETTE_TRIGGER = 'Buscar';
export const PALETTE_SHORTCUT = 'Ctrl+K';
export const PALETTE_TITLE = 'Command Palette';
export const PALETTE_DESCRIPTION = 'Busque por um comando ou ação...';

// ─── Consultas das stories ───────────────────────────────────────────────────

/** O comando pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
export const commandItem = (root: ParentNode, value: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

/** Os traços montados. Nesta lib o traço sai do DOM em qualquer busca (padrão cmdk). */
export const separatorsOf = (root: ParentNode): NodeListOf<HTMLElement> =>
  root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

export const searchOf = (root: ParentNode): HTMLInputElement =>
  root.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;

/** A região viva de "sem resultados" — irmã da lista, nunca filha dela. */
export const emptyRegionOf = (root: ParentNode): HTMLElement =>
  root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

/**
 * O comando em destaque, pelo caminho que o leitor de tela percorre: o campo
 * aponta com `aria-activedescendant`, e o id tem de existir. Leitura pura —
 * serve dentro de `waitFor` sem mexer no DOM.
 */
export function highlightedOf(field: HTMLElement): HTMLElement | null {
  const id = field.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}
