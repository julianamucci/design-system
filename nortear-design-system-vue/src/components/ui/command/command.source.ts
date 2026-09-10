/**
 * Transforms do painel Code do Command.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A paleta é composição de call site: raiz, campo de busca, lista com grupos e
 * a região de "nenhum resultado" FORA da lista. A tag da raiz sozinha não
 * ensinaria nenhuma dessas posições.
 *
 * Os comandos saem de `command.fixtures.ts`, os MESMOS dados que as stories
 * desenham: o painel não tem como mostrar uma lista e a story outra.
 */
import { asCode, indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';
import {
  CHECKED_BLOCKS,
  DISABLED_ITEM_BLOCKS,
  DISABLED_ITEMS_BLOCKS,
  EMPTY_STATE_BLOCKS,
  FRAME,
  GROUPED_BLOCKS,
  LONG_LIST_NAMES,
  NO_RESULT,
  PALETTE_BLOCKS,
  PALETTE_DESCRIPTION,
  PALETTE_TITLE,
  PLAYGROUND_BLOCKS,
  SEPARATOR_BLOCKS,
  SHORTCUT_BLOCKS,
  type CommandBlock,
  type CommandEntry,
} from './command.fixtures';

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
};

/** Nome da função que quem consome escreve para rodar o comando escolhido. */
const RUN = 'runCommand';

const RUN_FUNCTION = `function ${RUN}(value: string) {
  // roda o comando escolhido
}`;

/** Import do design system, só com as peças que o arranjo usa. */
function importing(names: string[]): string {
  return `import {
${names.map((name) => `  ${name},`).join('\n')}
} from '@/components/ui/command'`;
}

/** As peças que uma lista de blocos usa, na ordem alfabética do import. */
function partsFor(blocks: CommandBlock[], root: 'Command' | 'CommandDialog'): string[] {
  const parts = new Set([root, 'CommandEmpty', 'CommandGroup', 'CommandInput', 'CommandItem', 'CommandList']);
  if (blocks.length > 1) parts.add('CommandSeparator');
  if (blocks.some((block) => block.items.some((item) => item.shortcut))) parts.add('CommandShortcut');
  return [...parts].sort();
}

/**
 * Um comando. `checked` só é escrito quando o comando É marcável: ausente e
 * `false` são coisas diferentes, e o `false` ensina o segundo caso.
 */
function itemMarkup(item: CommandEntry, withHandler: boolean): string {
  const attributes = [
    `value="${item.value}"`,
    item.disabled ? 'disabled' : '',
    item.checked === undefined ? '' : `:checked="${item.checked}"`,
    withHandler ? `@select="${RUN}('${item.value}')"` : '',
  ].filter(Boolean).join(' ');

  if (!item.shortcut) return `<CommandItem ${attributes}>${item.label}</CommandItem>`;
  return `<CommandItem ${attributes}>
  ${item.label}
  <CommandShortcut>${item.shortcut}</CommandShortcut>
</CommandItem>`;
}

/** Os blocos da lista: um grupo por bloco, um traço entre dois blocos. */
function listMarkup(blocks: CommandBlock[], withHandler: boolean): string {
  return blocks
    .map((block) => {
      const opening = block.heading ? `<CommandGroup heading="${block.heading}">` : '<CommandGroup>';
      const items = block.items.map((item) => itemMarkup(item, withHandler)).join('\n');
      return `${opening}
${indentar(items, 2)}
</CommandGroup>`;
    })
    .join('\n\n<CommandSeparator />\n\n');
}

/**
 * A paleta: campo, lista e região viva.
 *
 * `CommandEmpty` fica FORA de `CommandList` de propósito — `role="status"` não
 * é filho permitido de `role="listbox"`, e dentro dela o axe reprova por
 * `aria-required-children`.
 */
function palette(options: { root?: 'Command' | 'CommandDialog'; rootAttributes?: string; placeholder: string; list: string; empty?: string }): string {
  const { root = 'Command', rootAttributes = '', placeholder, list, empty = NO_RESULT } = options;
  const opening = rootAttributes ? `<${root}\n${indentar(rootAttributes, 2)}\n>` : `<${root}>`;
  return `${opening}
  <CommandInput placeholder="${placeholder}" />

  <CommandList>
${indentar(list, 4)}
  </CommandList>

  <CommandEmpty>${empty}</CommandEmpty>
</${root}>`;
}

/** A moldura da paleta inline: largura, borda e sombra são do call site. */
function frame(interior: string): string {
  return `<div class="${FRAME}">
${indentar(interior, 2)}
</div>`;
}

/** Paleta inline a partir dos blocos — o arranjo de quase toda story. */
function inlineSnippet(blocks: CommandBlock[], placeholder: string, withHandler = false): string {
  const script = withHandler ? `${importing(partsFor(blocks, 'Command'))}\n\n${RUN_FUNCTION}` : importing(partsFor(blocks, 'Command'));
  return vueSnippet(script, frame(palette({ placeholder, list: listMarkup(blocks, withHandler) })));
}

/**
 * Playground: o campo, dois grupos separados por um traço e cinco comandos.
 *
 * Os controls de texto passam por `asCode`/`text`, que descartam o que não
 * for string — o Storybook troca arg de ação por um espião, e o corpo do mock
 * interpolado apareceria no painel como se fosse o exemplo.
 *
 * `heading` some junto com o control de grupos: cabeçalho vazio não é o mesmo
 * que cabeçalho ausente, e o componente remove o `aria-labelledby` quando não há
 * rótulo, em vez de deixar a referência apontando para um id inexistente.
 */
export const commandSource: SourceTransform<CommandArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const placeholder = text(asCode(args.placeholder), 'Buscar componente...');
  const empty = asCode(args.emptyMessage) ?? NO_RESULT;
  const blocks = args.showGroups === false
    ? PLAYGROUND_BLOCKS.map((block) => ({ ...block, heading: undefined }))
    : PLAYGROUND_BLOCKS;

  return vueSnippet(
    `${importing(partsFor(blocks, 'Command'))}\n\n${RUN_FUNCTION}`,
    frame(palette({ placeholder, empty, list: listMarkup(blocks, true) })),
  );
};

/** Grupos nomeados com um traço entre eles — a variante `withGroups`. */
export function commandWithGroupsSource(): string {
  return inlineSnippet(GROUPED_BLOCKS, 'Buscar componente...');
}

/**
 * Sem resultados: nada de especial a escrever no call site — o componente
 * decide sozinho quando a região viva ganha conteúdo. O que o exemplo mostra é
 * a POSIÇÃO dela, fora da lista.
 */
export function commandEmptySource(): string {
  return inlineSnippet(EMPTY_STATE_BLOCKS, 'Buscar componente...');
}

/**
 * Comando desabilitado. `disabled` é do item, e o componente segura o `select`
 * antes que ele chegue a quem consome — as setas também pulam o comando, sem
 * nada escrito aqui.
 */
export function commandItemDisabledSource(): string {
  return inlineSnippet(DISABLED_ITEM_BLOCKS, 'Buscar comando...', true);
}

/**
 * Comando marcado. Sem a prop o comando não é marcável e não reserva espaço
 * para a marca; com `false` ele é marcável e está desmarcado.
 *
 * O item com atalho não leva marca: os dois disputariam a borda direita, e a
 * regra é escolher um dos dois por comando.
 */
export function commandItemCheckedSource(): string {
  return inlineSnippet(CHECKED_BLOCKS, 'Buscar tema...');
}

/**
 * Lista longa. Trinta comandos se escrevem com `v-for`, e a lista rola sozinha
 * — o teto de altura é da folha, não do call site.
 */
export function commandLongListSource(): string {
  const names = LONG_LIST_NAMES.map((name) => `'${name}'`);
  const rows: string[] = [];
  for (let i = 0; i < names.length; i += 5) rows.push(`  ${names.slice(i, i + 5).join(', ')},`);
  return vueSnippet(
    `${importing(['Command', 'CommandEmpty', 'CommandGroup', 'CommandInput', 'CommandItem', 'CommandList'])}

const componentNames = [
${rows.join('\n')}
]`,
    frame(
      palette({
        placeholder: 'Buscar componente...',
        list: `<CommandGroup heading="Componentes">
  <CommandItem
    v-for="name in componentNames"
    :key="name"
    :value="name.toLowerCase()"
  >
    {{ name }}
  </CommandItem>
</CommandGroup>`,
      }),
    ),
  );
}

/**
 * Atalho por comando. Ele fica DENTRO do item de propósito: assim entra no nome
 * acessível, e quem ouve a lista descobre a tecla junto com o comando.
 */
export function commandWithShortcutsSource(): string {
  return inlineSnippet(SHORTCUT_BLOCKS, 'Buscar comando...');
}

/**
 * Traço entre dois blocos SEM cabeçalho. Ele some junto com os comandos quando
 * o filtro esvazia um dos lados — o componente decide, nada a escrever aqui.
 */
export function commandWithSeparatorSource(): string {
  return inlineSnippet(SEPARATOR_BLOCKS, 'Buscar comando...');
}

/** Vários comandos desabilitados: as setas percorrem só os habilitados. */
export function commandWithDisabledItemsSource(): string {
  return inlineSnippet(DISABLED_ITEMS_BLOCKS, 'Buscar...', true);
}

/**
 * Command palette: a paleta dentro do Dialog, com título e descrição que só o
 * leitor de tela vê — o diálogo precisa de nome, e a paleta não tem cabeçalho
 * visível.
 *
 * O Ctrl+K não é de componente nenhum: é ouvinte de janela, e quem o registra é
 * quem consome. `onUnmounted` remove — sem isso o atalho sobrevive à tela que o
 * criou. A dica fica DENTRO do gatilho: é o texto visível que nomeia o botão, e
 * a dica é o que faz o atalho ser descoberto.
 */
export function commandPaletteSource(): string {
  return vueSnippet(
    `import { onMounted, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
${importing(partsFor(PALETTE_BLOCKS, 'CommandDialog'))}

const open = ref(false)

function onKeydown(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
  // Sem isto o navegador leva o atalho para a barra de endereço.
  event.preventDefault()
  open.value = true
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function ${RUN}(value: string) {
  // roda o comando escolhido, e a paleta fecha
  open.value = false
}`,
    `<Button
  variant="outline"
  aria-haspopup="dialog"
  :aria-expanded="open"
  @click="open = true"
>
  Buscar
  <kbd class="nds-kbd">Ctrl+K</kbd>
</Button>

${palette({
  root: 'CommandDialog',
  rootAttributes: `v-model:open="open"\ntitle="${PALETTE_TITLE}"\ndescription="${PALETTE_DESCRIPTION}"`,
  placeholder: 'Buscar componente...',
  list: listMarkup(PALETTE_BLOCKS, true),
})}`,
  );
}
