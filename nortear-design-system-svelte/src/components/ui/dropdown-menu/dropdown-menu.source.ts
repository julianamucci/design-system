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
      'DropdownMenuGroupHeading',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
    ],
    markup: `<DropdownMenuGroup>
  <DropdownMenuGroupHeading>Conta</DropdownMenuGroupHeading>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
</DropdownMenuGroup>
<DropdownMenuSeparator />
<DropdownMenuGroup>
  <DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>
  <DropdownMenuItem>Documentação</DropdownMenuItem>
  <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
</DropdownMenuGroup>`,
  },

  withCheckbox: {
    names: ['DropdownMenuCheckboxItem', 'DropdownMenuLabel', 'DropdownMenuSeparator'],
    state: [
      'let mostrarBarraDeStatus = $state(true);',
      'let mostrarBarraDeAtividade = $state(false);',
    ],
    markup: `<DropdownMenuLabel>Visualização</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuCheckboxItem bind:checked={mostrarBarraDeStatus}>
  Status bar
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem bind:checked={mostrarBarraDeAtividade}>
  Activity bar
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
    state: ['let posicao = $state("bottom");'],
    markup: `<DropdownMenuLabel>Posição</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuRadioGroup bind:value={posicao}>
  <DropdownMenuRadioItem value="top">Topo</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="bottom">Inferior</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="right">Direita</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>`,
  },

  withSubmenu: {
    names: [
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
    ],
    markup: `<DropdownMenuItem>Novo arquivo</DropdownMenuItem>
<DropdownMenuSub>
  <DropdownMenuSubTrigger>Exportar como</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>PDF</DropdownMenuItem>
    <DropdownMenuItem>CSV</DropdownMenuItem>
    <DropdownMenuItem>JSON</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>
<DropdownMenuSeparator />
<DropdownMenuItem variant="destructive">Excluir</DropdownMenuItem>`,
  },

  withShortcuts: {
    names: ['DropdownMenuItem', 'DropdownMenuSeparator', 'DropdownMenuShortcut'],
    markup: `<DropdownMenuItem>
  Desfazer
  <DropdownMenuShortcut>Ctrl Z</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuItem>
  Copiar
  <DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem>
  Colar
  <DropdownMenuShortcut>Ctrl V</DropdownMenuShortcut>
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
export function dropdownMenuIndeterminadoSource(): string {
  return dropdownMenuSource('', { args: { variant: 'indeterminate', triggerLabel: 'Colunas' } });
}

/** Compositions/WithLabel — grupos nomeados pelo próprio cabeçalho. */
export function dropdownMenuWithLabelSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withLabel', triggerLabel: 'Conta' } });
}

/** Compositions/WithCheckboxItems — alternadores independentes entre si. */
export function dropdownMenuWithCheckboxSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withCheckbox', triggerLabel: 'Visualização' } });
}

/** Compositions/WithRadioGroup — escolha única dentro do menu. */
export function dropdownMenuWithRadioSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withRadio', triggerLabel: 'Posição' } });
}

/** Compositions/WithSubmenu — um segundo nível que abre ao lado. */
export function dropdownMenuWithSubmenuSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withSubmenu', triggerLabel: 'Arquivo' } });
}

/** Compositions/WithShortcuts — o atalho encostado na borda direita do item. */
export function dropdownMenuWithShortcutsSource(): string {
  return dropdownMenuSource('', { args: { variant: 'withShortcuts', triggerLabel: 'Editar' } });
}
