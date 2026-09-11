/**
 * Transforms do painel Code do Command.
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
 * a desenha e `commandInlineSource` a escreve, os dois passando por
 * `commandBlocks`, que decide onde começa um grupo e onde cai um traço. Painel
 * e tela passam a ter uma fonte só.
 *
 * A lista e `commandBlocks` moram em `command.fixtures.ts`, e não aqui: este
 * módulo só exporta construtor de snippet chamável SEM argumento, que é a
 * convenção que deixa `source-snippets.test.ts` chamar cada export e conferir o
 * que ele ensina.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';
import {
  CHECKED_ITEM_ITEMS,
  commandBlocks,
  DISABLED_ITEM_ITEMS,
  DISABLED_ITEMS,
  EMPTY_STATE_ITEMS,
  GROUPED_ITEMS,
  LONG_LIST_ITEMS,
  NO_RESULT,
  PALETTE_DESCRIPTION,
  PALETTE_ITEMS,
  PALETTE_SHORTCUT,
  PALETTE_TITLE,
  PALETTE_TRIGGER,
  PLAYGROUND_ITEMS,
  SEPARATOR_ITEMS,
  SHORTCUT_ITEMS,
  type CommandEntry,
  type CommandEntryItem,
} from './command.fixtures';

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  loop: boolean;
  shouldFilter: boolean;
};

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
  const items = entries.filter((entry): entry is CommandEntryItem => entry.type !== 'separator');
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
 *
 * SEM ARGUMENTO, a lista do Playground com os textos padrão — sem `loop` e sem
 * `onSelect`, que são do Playground (`commandSource`). Todo `*.source.ts` desta
 * stack exporta só o que se chama sem argumento, e é isso que deixa a varredura
 * transversal conferir o MOTOR, e não só as listas que as stories lhe passam.
 */
export function commandInlineSource(options: Partial<CommandSourceOptions> = {}): string {
  const {
    placeholder = 'Buscar componente...',
    emptyMessage = NO_RESULT,
    items = PLAYGROUND_ITEMS,
    rootAttrs = '',
    withSelect,
  } = options;
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

/**
 * A transform de uma story inline: `commandInlineSource` com a lista dela.
 *
 * Fica no módulo, sem export: ela devolve uma FUNÇÃO, e não um snippet — o que
 * sai daqui são as transforms que ela monta, logo abaixo.
 */
function commandSourceWith(options: CommandSourceOptions): () => string {
  return () => commandInlineSource(options);
}

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
