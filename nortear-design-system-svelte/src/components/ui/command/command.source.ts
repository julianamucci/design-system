/**
 * Transforms do painel Code do Command — e a forma da lista que as stories
 * RENDERIZAM.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * Os snippets usam os nomes ACHATADOS (`CommandInput`, `CommandGroup`…) e não o
 * namespace: é a API que a estrutura básica da docs page ensina e a que o
 * `index.ts` publica.
 *
 * ─── Uma lista, dois leitores (2026-09-10) ──────────────────────────────────
 *
 * Até aqui cada story tinha um invólucro `.svelte` com a lista escrita à mão e
 * uma transform com a MESMA lista escrita outra vez. As duas cópias derivavam
 * em silêncio — a stack de referência mediu o painel mostrando 3 comandos
 * enquanto a story desenhava 4, e placeholder de uma story na transform de
 * outra. Agora a lista é DADO (`CommandEntry[]`): `CommandInlineStory.svelte`
 * a desenha e `commandSourceWith` a escreve, os dois passando por
 * `commandBlocks`, que decide onde começa um grupo e onde cai um traço. Painel
 * e tela passam a ter uma fonte só.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  loop: boolean;
  shouldFilter: boolean;
};

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

/** Corpo de `runCommand`, o destino de cada comando escolhido. */
const RUN_COMMAND = `function runCommand(value: string) {
  // roda o comando e devolve o foco para onde ele age
}`;

/** Monta o bloco de imports achatados do próprio Command. */
function importing(...parts: string[]): string {
  return `import {
${parts.map((part) => `  ${part},`).join('\n')}
} from '@/components/ui/command';`;
}

/** Indenta cada linha não vazia de um bloco de marcação. */
function indent(text: string, by: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${by}${line}` : line))
    .join('\n');
}

type MarkupOptions = {
  /** Escreve o `onSelect` de cada comando — só onde a story mede a escolha. */
  withSelect?: boolean;
};

function itemMarkup(item: CommandEntryItem, { withSelect }: MarkupOptions): string {
  const open = `<CommandItem${attrs(
    `value="${item.value}"`,
    item.disabled ? 'disabled' : '',
    item.checked === undefined ? '' : `checked={${item.checked}}`,
    withSelect ? `onSelect={() => runCommand('${item.value}')}` : '',
  )}>`;
  if (!item.shortcut) return `${open}${item.label}</CommandItem>`;
  return `${open}
  ${item.label}
  <CommandShortcut>${item.shortcut}</CommandShortcut>
</CommandItem>`;
}

/** O conteúdo da `CommandList`, bloco a bloco, sem a indentação da lista. */
function listMarkup(entries: readonly CommandEntry[], options: MarkupOptions): string {
  return commandBlocks(entries)
    .map((block) => {
      if (block.kind === 'separator') return '<CommandSeparator />';
      const items = block.items.map((item) => itemMarkup(item, options)).join('\n');
      // Sem cabeçalho o grupo continua: é ele que dá o respiro aos comandos.
      const open =
        block.kind === 'loose' ? '<CommandGroup>' : `<CommandGroup heading="${block.heading}">`;
      return `${open}
${indent(items, '  ')}
</CommandGroup>`;
    })
    .join('\n');
}

/** As peças que a lista usa, na ordem do import canônico. */
function partsFor(entries: readonly CommandEntry[], wrapper: string): string[] {
  const blocks = commandBlocks(entries);
  const items = entries.filter((entry): entry is CommandEntryItem => !isSeparator(entry));
  return [
    wrapper,
    'CommandInput',
    'CommandList',
    'CommandEmpty',
    blocks.some((block) => block.kind !== 'separator') ? 'CommandGroup' : '',
    'CommandItem',
    blocks.some((block) => block.kind === 'separator') ? 'CommandSeparator' : '',
    items.some((item) => item.shortcut) ? 'CommandShortcut' : '',
  ].filter(Boolean);
}

export type CommandSourceOptions = {
  placeholder: string;
  emptyMessage: string;
  items: readonly CommandEntry[];
  /** Atributos da raiz já montados (`loop`, `shouldFilter={false}`). */
  rootAttrs?: string;
} & MarkupOptions;

/**
 * O snippet de uma paleta inline, a partir da MESMA lista que a story desenha.
 *
 * A mensagem de vazio sai IRMÃ da lista, e o lugar não é detalhe de layout:
 * ela é a região viva que anuncia a busca sem resultado, e `role="status"` não
 * é filho permitido de `role="listbox"`. Ensinar o snippet com ela dentro da
 * lista seria ensinar o defeito.
 */
export function commandInlineSource(options: CommandSourceOptions): string {
  const { placeholder, emptyMessage, items, rootAttrs = '', withSelect } = options;
  const imports = importing(...partsFor(items, 'Command'));
  return svelteSnippet(
    withSelect ? `${imports}\n\n${RUN_COMMAND}` : imports,
    `<Command${rootAttrs}>
  <CommandInput placeholder="${placeholder}" />
  <CommandList>
${indent(listMarkup(items, { withSelect }), '    ')}
  </CommandList>
  <CommandEmpty>${emptyMessage}</CommandEmpty>
</Command>`,
  );
}

/** A transform de uma story inline: `commandInlineSource` com a lista dela. */
export function commandSourceWith(options: CommandSourceOptions): () => string {
  return () => commandInlineSource(options);
}

// ─── Listas das stories ──────────────────────────────────────────────────────
//
// Conteúdo copiado das stories do Vanilla, que é a referência: itens, grupos,
// placeholders e buscas são os de lá. Moram aqui, e não num `*.stories.ts`,
// porque todo export nomeado de um arquivo de stories vira story.

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

// ─── Transforms ──────────────────────────────────────────────────────────────

/**
 * Playground: a lista canônica, com os controls de texto e de comportamento.
 * Cascateia também como padrão dos arquivos de estados e composições — cada
 * story de lá sobrescreve com a sua.
 */
export function commandSource(
  _generated?: string,
  ctx?: { args?: Partial<CommandArgs> },
): string {
  const {
    placeholder = 'Buscar componente...',
    emptyMessage = NO_RESULT,
    loop = false,
    shouldFilter = true,
  } = ctx?.args ?? {};

  return commandInlineSource({
    placeholder,
    emptyMessage,
    items: PLAYGROUND_ITEMS,
    rootAttrs: attrs(loop ? 'loop' : '', shouldFilter ? '' : 'shouldFilter={false}'),
    withSelect: true,
  });
}

export const commandWithGroupsSource = commandSourceWith({
  placeholder: 'Buscar componente...',
  emptyMessage: NO_RESULT,
  items: GROUPED_ITEMS,
});

export const commandNoResultsSource = commandSourceWith({
  placeholder: 'Buscar componente...',
  emptyMessage: NO_RESULT,
  items: EMPTY_STATE_ITEMS,
});

export const commandItemDisabledSource = commandSourceWith({
  placeholder: 'Buscar comando...',
  emptyMessage: NO_RESULT,
  items: DISABLED_ITEM_ITEMS,
  withSelect: true,
});

export const commandItemCheckedSource = commandSourceWith({
  placeholder: 'Buscar tema...',
  emptyMessage: NO_RESULT,
  items: CHECKED_ITEM_ITEMS,
});

export const commandLongListSource = commandSourceWith({
  placeholder: 'Buscar componente...',
  emptyMessage: NO_RESULT,
  items: LONG_LIST_ITEMS,
});

export const commandWithSeparatorSource = commandSourceWith({
  placeholder: 'Buscar comando...',
  emptyMessage: NO_RESULT,
  items: SEPARATOR_ITEMS,
});

export const commandWithShortcutsSource = commandSourceWith({
  placeholder: 'Buscar comando...',
  emptyMessage: NO_RESULT,
  items: SHORTCUT_ITEMS,
});

export const commandWithDisabledItemsSource = commandSourceWith({
  placeholder: 'Buscar...',
  emptyMessage: NO_RESULT,
  items: DISABLED_ITEMS,
  withSelect: true,
});

/**
 * Estado LoadingState: o indicador fica FORA da lista.
 *
 * Ele se anuncia como progresso, e progresso não é filho permitido de uma
 * lista de opções — dentro dela a estrutura de acessibilidade fica inválida.
 */
export function commandLoadingSource(): string {
  return svelteSnippet(
    `${importing('Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandLoading')}
import LoaderCircle from '@lucide/svelte/icons/loader-circle';`,
    `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandLoading>
    <div
      class="nds-cluster nds-p-4 nds-text-body nds-text-muted-foreground"
      data-align="center"
      data-justify="center"
      data-spacing="sm"
    >
      <LoaderCircle class="nds-size-4 nds-animate-spin" aria-hidden="true" />
      <span>Carregando resultados...</span>
    </div>
  </CommandLoading>
  <CommandList />
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/** Composição WithLinkItem: o comando que navega é uma âncora de verdade. */
export function commandWithLinkItemSource(): string {
  return svelteSnippet(
    `${importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandLinkItem',
      'CommandSeparator',
    )}
import BookOpen from '@lucide/svelte/icons/book-open';
import Code2 from '@lucide/svelte/icons/code-2';
import ExternalLink from '@lucide/svelte/icons/external-link';`,
    `<Command>
  <CommandInput placeholder="Buscar recurso..." />
  <CommandList>
    <CommandGroup heading="Documentação">
      <CommandLinkItem href="/docs/button" value="docs-button">
        <BookOpen aria-hidden="true" />
        Button — Docs
        <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
      </CommandLinkItem>
      <CommandLinkItem href="/docs/input" value="docs-input">
        <BookOpen aria-hidden="true" />
        Input — Docs
        <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
      </CommandLinkItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Links externos">
      <CommandLinkItem
        href="https://github.com"
        value="github"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Code2 aria-hidden="true" />
        GitHub
        <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
      </CommandLinkItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/**
 * Composição CommandPalette: a paleta dentro do CommandDialog.
 *
 * O `title` e a `description` nomeiam o diálogo para quem não vê a tela; o
 * componente já os mantém fora da tela por dentro. A dica do atalho mora
 * DENTRO do gatilho, e sem `aria-label`: o nome do botão sai do texto visível
 * (WCAG 2.5.3), e é esse texto que quem usa comando de voz vai falar. O
 * `CommandDialog` não expõe gatilho, então o botão anuncia à mão que abre um
 * diálogo e se ele está aberto (`aria-haspopup` e `aria-expanded`).
 */
export function commandPaletteSource(): string {
  const parts = partsFor(PALETTE_ITEMS, 'CommandDialog');
  return svelteSnippet(
    `import { Button } from '@/components/ui/button';
${importing(...parts)}

let open = $state(false);

function runCommand(value: string) {
  // roda o comando; fechar a paleta faz parte do gesto
  open = false;
}

$effect(() => {
  function onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      // Sem isto o navegador leva o atalho para a barra de endereço.
      event.preventDefault();
      // Atribuição, e não alternância: repetir a tecla não pode fechar o que
      // se acabou de pedir.
      open = true;
    }
  }
  window.addEventListener('keydown', onKeydown);
  return () => window.removeEventListener('keydown', onKeydown);
});`,
    `<Button
  variant="outline"
  aria-haspopup="dialog"
  aria-expanded={open}
  onclick={() => (open = true)}
>
  ${PALETTE_TRIGGER}
  <kbd class="nds-kbd">${PALETTE_SHORTCUT}</kbd>
</Button>

<CommandDialog
  bind:open
  title="${PALETTE_TITLE}"
  description="${PALETTE_DESCRIPTION}"
>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
${indent(listMarkup(PALETTE_ITEMS, { withSelect: true }), '    ')}
  </CommandList>
  <CommandEmpty>${NO_RESULT}</CommandEmpty>
</CommandDialog>`,
  );
}
