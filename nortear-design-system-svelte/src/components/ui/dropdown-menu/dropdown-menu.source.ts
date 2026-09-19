/**
 * Transforms do painel Code do DropdownMenu.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O menu é montado por PEÇAS, e a peça que muda entre as stories é o miolo do
 * `Content`. Por isso a transform do meta ramifica por `variant`: cada story de
 * variação, estado e composição já declara a sua composição em `args`, e a
 * cascata entrega o snippet certo sem adivinhar nada por nome de story.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';
import {
  menuEntriesDeclarations,
  menuEntriesMarkup,
  menuEntriesParts,
  type MenuDocsEntry,
} from './dropdown-menu.fixtures';

export type DropdownMenuVariant =
  | 'default'
  | 'destructive'
  | 'withLabel'
  | 'withCheckbox'
  | 'indeterminate'
  | 'withRadio'
  | 'withSubmenu'
  | 'withShortcuts'
  | 'itemDisabled';

export type DropdownMenuArgs = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  /** Abre na montagem. Vira o valor inicial do estado ligado por `bind:open`. */
  defaultOpen: boolean;
  /** Abertura vinda de fora — a prop de verdade da raiz. */
  open: boolean;
  triggerLabel: string;
  variant: DropdownMenuVariant;
};

/** Miolo do `Content` de uma composição, com o que ele exige de import e de estado. */
type Composition = {
  /** Peças além da tríade raiz + gatilho + conteúdo. */
  names: string[];
  /** Linhas de `$state` que a composição precisa no bloco `<script>`. */
  state?: string[];
  markup: string;
};

const PACOTE = '@/components/ui/dropdown-menu';

/** Bloco de import com as peças usadas, em ordem alfabética. */
function importing(names: string[]): string {
  const list = [
    ...new Set(['DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', ...names]),
  ].sort();
  return [
    `import {`,
    ...list.map((name) => `  ${name},`),
    `} from "${PACOTE}";`,
    `import { Button } from "@/components/ui/button";`,
  ].join('\n');
}

/** Empurra o miolo para dentro do `Content`. */
function indentar(markup: string, level: number): string {
  const espacos = ' '.repeat(level);
  return markup
    .split('\n')
    .map((line) => (line.trim() ? `${espacos}${line}` : line))
    .join('\n');
}

const COMPOSITIONS: Record<DropdownMenuVariant, Composition> = {
  default: {
    names: ['DropdownMenuGroup', 'DropdownMenuItem'],
    markup: `<DropdownMenuGroup>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
  <DropdownMenuItem>Equipe</DropdownMenuItem>
</DropdownMenuGroup>`,
  },

  destructive: {
    names: ['DropdownMenuItem', 'DropdownMenuSeparator'],
    markup: `<DropdownMenuItem>Editar</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>`,
  },

  withLabel: {
    names: [
      'DropdownMenuGroup',
      'DropdownMenuLabel',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
    ],
    markup: `<DropdownMenuGroup>
  <DropdownMenuLabel>Conta</DropdownMenuLabel>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
</DropdownMenuGroup>
<DropdownMenuSeparator />
<DropdownMenuGroup>
  <DropdownMenuLabel>Suporte</DropdownMenuLabel>
  <DropdownMenuItem>Documentação</DropdownMenuItem>
  <DropdownMenuItem>Sair</DropdownMenuItem>
</DropdownMenuGroup>`,
  },

  withCheckbox: {
    names: ['DropdownMenuCheckboxItem', 'DropdownMenuLabel', 'DropdownMenuSeparator'],
    state: [
      'let mostrarNome = $state(true);',
      'let mostrarEmail = $state(false);',
      'let mostrarFuncao = $state(false);',
    ],
    markup: `<DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuCheckboxItem bind:checked={mostrarNome}>
  Nome
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem bind:checked={mostrarEmail}>
  E-mail
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem bind:checked={mostrarFuncao}>
  Função
</DropdownMenuCheckboxItem>`,
  },

  indeterminate: {
    names: ['DropdownMenuCheckboxItem', 'DropdownMenuLabel', 'DropdownMenuSeparator'],
    markup: `<DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuCheckboxItem indeterminate>Nome</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem checked>E-mail</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem>Telefone</DropdownMenuCheckboxItem>`,
  },

  withRadio: {
    names: [
      'DropdownMenuLabel',
      'DropdownMenuRadioGroup',
      'DropdownMenuRadioItem',
      'DropdownMenuSeparator',
    ],
    state: ['let tema = $state("light");'],
    markup: `<DropdownMenuLabel>Aparência</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuRadioGroup bind:value={tema}>
  <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>`,
  },

  withSubmenu: {
    names: [
      'DropdownMenuItem',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
    ],
    markup: `<DropdownMenuItem>Renomear</DropdownMenuItem>
<DropdownMenuSub>
  <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>PDF</DropdownMenuItem>
    <DropdownMenuItem>CSV</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>`,
  },

  withShortcuts: {
    names: ['DropdownMenuItem', 'DropdownMenuSeparator', 'DropdownMenuShortcut'],
    markup: `<DropdownMenuItem>
  Desfazer
  <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuItem>
  Copiar
  <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem>
  Colar
  <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
</DropdownMenuItem>`,
  },

  itemDisabled: {
    names: ['DropdownMenuItem'],
    markup: `<DropdownMenuItem>Editar</DropdownMenuItem>
<DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>
<DropdownMenuItem>Duplicar</DropdownMenuItem>`,
  },
};

/**
 * Forma canônica do menu, e a transform do meta de todos os arquivos de story.
 *
 * `defaultOpen` não é prop deste primitivo — a raiz expõe `open` ligável, e é
 * assim que o snippet abre o menu. Escrever `defaultOpen` ensinaria uma API que
 * não existe.
 */
export function dropdownMenuSource(
  _gerado?: string,
  ctx?: { args?: Partial<DropdownMenuArgs> },
): string {
  const {
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    defaultOpen = false,
    open,
    triggerLabel = 'Mais ações',
    variant = 'default',
  } = ctx?.args ?? {};

  const composition = COMPOSITIONS[variant] ?? COMPOSITIONS.default;
  const isOpen = open ?? defaultOpen;

  const contentProps = attrs(
    side === 'bottom' ? '' : `side="${side}"`,
    align === 'start' ? '' : `align="${align}"`,
    sideOffset === 4 ? '' : `sideOffset={${sideOffset}}`,
  );

  const state = [
    ...(isOpen ? ['let aberto = $state(true);'] : []),
    ...(composition.state ?? []),
  ];

  return svelteSnippet(
    [importing(composition.names), state.join('\n')].filter(Boolean).join('\n\n'),
    `<DropdownMenu${isOpen ? ' bind:open={aberto}' : ''}>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent${contentProps}>
${indentar(composition.markup, 4)}
  </DropdownMenuContent>
</DropdownMenu>`,
  );
}

// ─── Overrides por story ──────────────────────────────────────────────────────
//
// As stories de variação, estado e composição nascem abertas para a captura do
// Chromatic. Isso é andaime da foto, não lição: um menu que se abre sozinho ao
// carregar a página é justamente o que não se deve copiar. Os overrides abaixo
// reaproveitam a mesma transform sem o estado de abertura.

/** Variants/Default — o item neutro, sem cor semântica. */
export function dropdownMenuDefaultSource(): string {
  return dropdownMenuSource('', { args: { variant: 'default' } });
}

/** Variants/Destructive — a ação irreversível marcada pela cor de perigo. */
export function dropdownMenuDestructiveSource(): string {
  return dropdownMenuSource('', { args: { variant: 'destructive', triggerLabel: 'Ações da conta' } });
}

/** States/Controlled — a abertura mandada de fora, por `bind:open`. */
export function dropdownMenuControlledSource(): string {
  return svelteSnippet(
    `${importing(['DropdownMenuGroup', 'DropdownMenuItem'])}

let aberto = $state(false);`,
    `<DropdownMenu bind:open={aberto}>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Abrir via estado externo</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
      <DropdownMenuItem>Equipe</DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>`,
  );
}

/** States/ItemDisabled — o item indisponível continua no menu, e é pulado. */
export function dropdownMenuItemDisabledSource(): string {
  return dropdownMenuSource('', { args: { variant: 'itemDisabled', triggerLabel: 'Ações' } });
}

/** States/CheckboxIndeterminate — os três estados do alternador lado a lado. */
export function dropdownMenuCheckboxIndeterminateSource(): string {
  return dropdownMenuSource('', { args: { variant: 'indeterminate', triggerLabel: 'Colunas' } });
}

/** Compositions/WithLabel — grupos nomeados pelo próprio cabeçalho. */
export function dropdownMenuWithLabelSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withLabel', triggerLabel: 'Conta' } });
}

/** Compositions/WithCheckboxItems — alternadores independentes entre si. */
export function dropdownMenuWithCheckboxSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withCheckbox', triggerLabel: 'Colunas' } });
}

/** Compositions/WithRadioGroup — escolha única dentro do menu. */
export function dropdownMenuWithRadioSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withRadio', triggerLabel: 'Tema' } });
}

/** Compositions/WithSubmenu — um segundo nível que abre ao lado. */
export function dropdownMenuWithSubmenuSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withSubmenu', triggerLabel: 'Arquivo' } });
}

/** Compositions/WithShortcuts — o atalho encostado na borda direita do item. */
export function dropdownMenuWithShortcutsSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withShortcuts', triggerLabel: 'Editar' } });
}

// ─── Cards de Variantes da docs page ──────────────────────────────────────────
//
// A forma da lista (`MenuDocsEntry`), o leitor do estado e o escritor das
// linhas moram em `dropdown-menu.fixtures.ts`: a docs page monta a prévia com a
// lista, e este módulo só exporta construtor de snippet.

/**
 * A lista que `dropdownMenuEntriesSource` escreve quando ninguém passa outra.
 *
 * Passa por todo tipo de entrada — grupo nomeado, item com atalho e
 * destrutivo, divisória, marcação, grupo de rádio e submenu —, e é por isso que
 * ela é o padrão: a varredura transversal chama o construtor sem argumento e
 * confere que cada `bind:` que a marcação escreve tem a variável declarada no
 * script. É ali que este construtor erraria — o nome da variável sai do `value`
 * (`column-name` → `columnName`) nas duas pontas.
 */
const COMPLETE_ENTRIES: MenuDocsEntry[] = [
  {
    type: 'group',
    label: 'Conta',
    items: [
      { type: 'item', label: 'Perfil', value: 'profile' },
      { type: 'item', label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
    ],
  },
  { type: 'separator' },
  {
    type: 'group',
    label: 'Colunas visíveis',
    items: [{ type: 'checkbox', label: 'Nome', value: 'column-name', checked: true }],
  },
  {
    type: 'radio-group',
    label: 'Aparência',
    name: 'theme',
    value: 'light',
    items: [
      { label: 'Claro', value: 'light' },
      { label: 'Escuro', value: 'dark' },
    ],
  },
  {
    type: 'submenu',
    label: 'Exportar',
    items: [
      { type: 'item', label: 'PDF', value: 'pdf' },
      { type: 'item', label: 'CSV', value: 'csv' },
    ],
  },
  { type: 'separator' },
  { type: 'item', label: 'Excluir conta', value: 'delete-account', variant: 'destructive' },
];

/**
 * O código de um card de Variantes, a partir da MESMA lista que monta a prévia
 * — ver `MenuDocsEntry`. O gatilho e os rótulos chegam traduzidos, então o
 * código fala o idioma da prévia nos três idiomas. Serve também ao exemplo de
 * uso da seção Importação, que até 2026-09-11 era um literal em português.
 *
 * Sem argumento, escreve `COMPLETE_ENTRIES`: todo `*.source.ts` desta stack se
 * chama sem argumento, e é assim que a varredura transversal alcança o
 * construtor que a docs page usa.
 */
export function dropdownMenuEntriesSource(
  options: { triggerLabel?: string; entries?: MenuDocsEntry[] } = {},
): string {
  const { triggerLabel = 'Conta', entries = COMPLETE_ENTRIES } = options;
  const names = [...menuEntriesParts('DropdownMenu', entries)];
  const declarations = menuEntriesDeclarations(entries);

  return svelteSnippet(
    [importing(names), declarations.join('\n')].filter(Boolean).join('\n\n'),
    `<DropdownMenu>
  <DropdownMenuTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </DropdownMenuTrigger>
  <DropdownMenuContent>
${menuEntriesMarkup('DropdownMenu', entries, '    ').join('\n')}
  </DropdownMenuContent>
</DropdownMenu>`,
  );
}
