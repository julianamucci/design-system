// Snippet do painel Code do DropdownMenu — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { DropdownMenuAlign, DropdownMenuSide } from './dropdown-menu';

/**
 * Um item da lista, sem os callbacks.
 *
 * `onClick` e os avisos de marcação existem na fábrica e são função — função
 * não tem forma escrita que sirva de exemplo curto, e o assunto do menu é a
 * COMPOSIÇÃO da lista: papel, rótulo, marcação e atalho.
 */
export type DropdownMenuSnippetItem = {
  /** `item` é o padrão da fábrica e não entra no snippet. */
  type?: 'item' | 'separator' | 'label' | 'checkbox' | 'radio';
  label?: string;
  value?: string;
  /** Ênfase. `default` é o padrão e não entra no snippet. */
  variant?: 'default' | 'destructive';
  shortcut?: string;
  checked?: boolean;
  indeterminate?: boolean;
  group?: string;
  disabled?: boolean;
};

/** O que as stories usam da `DropdownMenuOptions` e o snippet precisa mostrar. */
export type DropdownMenuSnippetOptions = {
  triggerLabel?: string;
  items?: DropdownMenuSnippetItem[];
  /** Borda de saída. `bottom` é o padrão e não entra no snippet. */
  side?: DropdownMenuSide;
  /** Encosto. `start` é o padrão e não entra no snippet. */
  align?: DropdownMenuAlign;
  /** Vão em px. `4` é o padrão e não entra no snippet. */
  sideOffset?: number;
  /** Só aparece quando é `false`: o menu é modal por padrão. */
  modal?: boolean;
  /** Abre já na montagem. */
  defaultOpen?: boolean;
  /** Corpo do callback de mudança de estado, quando a story o exercita. */
  onOpenChange?: string;
};

/** A lista canônica: um grupo rotulado, um separador e a saída. */
const ITEMS_DEFAULT: DropdownMenuSnippetItem[] = [
  { type: 'label', label: 'Conta' },
  { label: 'Perfil', value: 'profile' },
  { label: 'Configurações', value: 'settings' },
  { type: 'separator' },
  { label: 'Sair', value: 'logout' },
];

function item(i: DropdownMenuSnippetItem): string {
  const pairs = options([
    ['type', i.type && i.type !== 'item' ? text(i.type) : undefined],
    ['label', i.label !== undefined ? text(i.label) : undefined],
    ['value', i.value !== undefined ? text(i.value) : undefined],
    ['group', i.group !== undefined ? text(i.group) : undefined],
    ['variant', i.variant && i.variant !== 'default' ? text(i.variant) : undefined],
    ['shortcut', i.shortcut !== undefined ? text(i.shortcut) : undefined],
    ['checked', i.checked !== undefined ? String(i.checked) : undefined],
    ['indeterminate', i.indeterminate ? 'true' : undefined],
    ['disabled', i.disabled ? 'true' : undefined],
  ])
    .map((line) => line.replace(/,$/, ''))
    .join(', ');
  return `{ ${pairs} }`;
}

/**
 * A chamada real de `createDropdownMenu` com a lista da story.
 *
 * A lista é DADO, e é por isso que a fábrica a recebe pronta: papel ARIA,
 * classe, indicador de marcação e navegação por teclado saem daí — quem compõe
 * descreve os itens, não os monta.
 */
export function dropdownMenuSnippet(o: DropdownMenuSnippetOptions = {}): string {
  const items = o.items ?? ITEMS_DEFAULT;
  const trigger = `createButton({ variant: 'outline', label: ${text(o.triggerLabel ?? 'Abrir menu')} })`;

  const lines = options([
    ['trigger', trigger],
    ['items', `[\n${items.map((i) => `    ${item(i)},`).join('\n')}\n  ]`],
    ['side', o.side && o.side !== 'bottom' ? text(o.side) : undefined],
    ['align', o.align && o.align !== 'start' ? text(o.align) : undefined],
    ['sideOffset', o.sideOffset !== undefined && o.sideOffset !== 4 ? String(o.sideOffset) : undefined],
    ['modal', o.modal === false ? 'false' : undefined],
    ['defaultOpen', o.defaultOpen ? 'true' : undefined],
    // Guarda de tipo, e não confiança no tipo declarado: `ctx.args` chega do
    // Storybook, e um control de callback é um espião de teste — interpolá-lo
    // despejaria o CORPO da função de mock dentro do snippet.
    ['onOpenChange', typeof o.onOpenChange === 'string' ? o.onOpenChange : undefined],
  ]);

  return snippet(
    [importing('dropdown-menu', 'createDropdownMenu'), importing('button', 'createButton')].join('\n'),
    `const menu = ${chamada('createDropdownMenu', lines)};`,
    montar('menu'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai nos padrões da fábrica, que é o uso
 * canônico do componente.
 */
export const dropdownMenuSource: SourceTransform<DropdownMenuSnippetOptions> = (_gerado, ctx) =>
  dropdownMenuSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function dropdownMenuSourceWith(
  fixas: DropdownMenuSnippetOptions,
): SourceTransform<DropdownMenuSnippetOptions> {
  return (_gerado, ctx) => dropdownMenuSnippet({ ...ctx.args, ...fixas });
}
