// Snippet do painel Code do Menubar — ver `@/lib/story-source`.
//
// A fábrica recebe os menus como PRIMEIRO ARGUMENTO POSICIONAL e as opções como
// segundo — `createMenubar(menus, options)`. O `callLine()` compartilhado monta
// `createX({ … })`, que é a forma das fábricas de argumento único; a montagem da
// chamada com lista posicional é local a este módulo.

import {
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { MenubarAlign, MenubarItemType, MenubarSide } from './menubar';

/** Um item do painel, no que o snippet precisa mostrar. */
export type MenubarItemSnippet = {
  type?: MenubarItemType;
  label?: string;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  inset?: boolean;
  checked?: boolean;
  indeterminate?: boolean;
  /** `type: 'radio-group'` — valor escolhido. */
  value?: string;
  /** `type: 'radio-group'` — opções. */
  options?: Array<{ value: string; label: string }>;
  /** `type: 'submenu'` — itens do painel aninhado. */
  items?: MenubarItemSnippet[];
  /** Expressão mostrada no callback do item comum. */
  onClick?: string;
  /** `type: 'checkbox'` — expressão mostrada no callback de marcação. */
  onCheckedChange?: string;
  /** `type: 'radio-group'` — expressão mostrada no callback de escolha. */
  onValueChange?: string;
};

export type MenubarMenuSnippet = { label: string; items: MenubarItemSnippet[] };

/** O que as stories do Menubar usam. */
export type MenubarSnippetOptions = {
  /** Estrutura da barra. Sem ela vale o conjunto canônico de aplicação. */
  menus?: MenubarMenuSnippet[];
  loop?: boolean;
  /** Índice do menu que nasce aberto; `true` abre o primeiro. */
  defaultOpen?: number | boolean;
  side?: MenubarSide;
  align?: MenubarAlign;
  class?: string;
  /** Mostra a linha que solta os ouvintes da barra. */
  destroy?: boolean;
};

/**
 * A barra canônica de aplicação.
 *
 * Cada item leva o próprio `onClick`: um item de menu sem ação não faz nada, e
 * o callback não tem padrão nenhum para herdar.
 */
const MENUS_DEFAULT: MenubarMenuSnippet[] = [
  {
    label: 'Arquivo',
    items: [
      { label: 'Novo', shortcut: 'Ctrl+N', onClick: '() => novo()' },
      { label: 'Abrir', shortcut: 'Ctrl+O', onClick: '() => abrir()' },
      { label: 'Salvar', shortcut: 'Ctrl+S', onClick: '() => salvar()' },
    ],
  },
  {
    label: 'Editar',
    items: [
      { label: 'Desfazer', shortcut: 'Ctrl+Z', onClick: '() => desfazer()' },
      { label: 'Refazer', shortcut: 'Ctrl+Shift+Z', onClick: '() => refazer()' },
    ],
  },
];

/** `{ a: 1, b: 2 }` numa linha só. */
function objeto(lines: string[]): string {
  if (lines.length === 0) return '{}';
  return `{ ${lines.map((l) => l.replace(/,$/, '')).join(', ')} }`;
}

/** Um item serializado, já recuado. Submenu e escolha única abrem em bloco. */
function serializarItem(item: MenubarItemSnippet, recuo: string): string {
  const base = options([
    ['type', item.type && item.type !== 'item' ? text(item.type) : undefined],
    ['label', item.label ? text(item.label) : undefined],
    ['shortcut', item.shortcut ? text(item.shortcut) : undefined],
    ['variant', item.variant && item.variant !== 'default' ? text(item.variant) : undefined],
    ['inset', item.inset ? 'true' : undefined],
    // Misto vale SOBRE o marcado: mostrar os dois juntos ensinaria um estado
    // que a fábrica resolve por conta própria.
    ['indeterminate', item.indeterminate ? 'true' : undefined],
    ['checked', !item.indeterminate && item.checked ? 'true' : undefined],
    ['value', item.value ? text(item.value) : undefined],
    ['disabled', item.disabled ? 'true' : undefined],
    ['onClick', item.onClick],
    ['onCheckedChange', item.onCheckedChange],
    ['onValueChange', item.onValueChange],
  ]);

  if (item.options) {
    const groupOptions = item.options
      .map((op) => `${recuo}    { value: ${text(op.value)}, label: ${text(op.label)} },`)
      .join('\n');
    return `${recuo}{
${base.map((l) => `${recuo}  ${l}`).join('\n')}
${recuo}  options: [
${groupOptions}
${recuo}  ],
${recuo}},`;
  }

  if (item.items) {
    const children = item.items.map((f) => serializarItem(f, `${recuo}    `)).join('\n');
    return `${recuo}{
${base.map((l) => `${recuo}  ${l}`).join('\n')}
${recuo}  items: [
${children}
${recuo}  ],
${recuo}},`;
  }

  return `${recuo}${objeto(base)},`;
}

/** A lista de menus, do jeito que entra no primeiro argumento da fábrica. */
function serializarMenus(menus: MenubarMenuSnippet[]): string {
  const body = menus
    .map(
      (menu) => `  {
    label: ${text(menu.label)},
    items: [
${menu.items.map((i) => serializarItem(i, '      ')).join('\n')}
    ],
  },`,
    )
    .join('\n');
  return `[\n${body}\n]`;
}

/** A chamada real de `createMenubar` com a estrutura e as opções da story. */
export function menubarSnippet(o: MenubarSnippetOptions = {}): string {
  const menus = o.menus ?? MENUS_DEFAULT;

  const lines = options([
    // `loop` é ligado por padrão: só o desligamento merece uma linha.
    ['loop', o.loop === false ? 'false' : undefined],
    [
      'defaultOpen',
      o.defaultOpen === true ? '0' : typeof o.defaultOpen === 'number' ? String(o.defaultOpen) : undefined,
    ],
    ['side', o.side && o.side !== 'bottom' ? text(o.side) : undefined],
    ['align', o.align && o.align !== 'start' ? text(o.align) : undefined],
    ['class', o.class ? text(o.class) : undefined],
  ]);

  const segundo = lines.length ? `, ${objeto(lines)}` : '';

  return snippet(
    importing('menubar', 'createMenubar'),
    `const barra = createMenubar(${serializarMenus(menus)}${segundo});`,
    appendLine('barra'),
    // A barra registra ouvinte no documento. Sair da página dispara a limpeza
    // sozinha; `destroy()` é o caminho de quem desmonta antes disso.
    o.destroy ? `barra.destroy();` : undefined,
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const menubarSource: SourceTransform<MenubarSnippetOptions> = (_gerado, ctx) =>
  menubarSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, estrutura e opções que os controls não cobrem. */
export function menubarSourceWith(
  fixas: MenubarSnippetOptions,
): SourceTransform<MenubarSnippetOptions> {
  return (_gerado, ctx) => menubarSnippet({ ...ctx.args, ...fixas });
}

/**
 * Barra CONTROLADA — o equivalente honesto, porque a fábrica não tem o par.
 *
 * As outras stacks expõem uma ligação reativa (uma prop de abertura mais o
 * retorno da mudança). Aqui não existe: `createMenubar` recebe `defaultOpen` na
 * CONSTRUÇÃO e não devolve nada que abra ou feche o menu depois. Inventar a prop
 * seria ensinar API que o design system não tem.
 *
 * O que existe, e é o que este trecho mostra: quem consome guarda o estado, e a
 * fábrica é COMANDADA — a barra é recriada com o `defaultOpen` que o estado
 * pede. O caminho de volta é o DOM: o `aria-expanded` do gatilho conta quando o
 * menu fechou sozinho (Escape, clique fora), e o estado acompanha. Sem esse
 * segundo lado, o estado de fora passaria a mentir sobre a barra na primeira vez
 * que alguém apertasse Escape.
 */
export function menubarControlledSource(): string {
  return snippet(
    importing('menubar', 'createMenubar'),
    `const MENUS = [
  { label: 'Arquivo', items: [{ label: 'Novo' }, { label: 'Abrir' }] },
  { label: 'Editar', items: [{ label: 'Desfazer' }] },
];

const area = document.createElement('div');

let menuAberto: number | null = null;
let barra = createMenubar(MENUS);
area.appendChild(barra);`,
    `/* O estado manda: a barra é refeita com o menu que ele pede. */
function aplicar(indice: number | null): void {
  menuAberto = indice;
  barra.destroy();
  barra.remove();
  barra =
    indice === null ? createMenubar(MENUS) : createMenubar(MENUS, { defaultOpen: indice });
  area.appendChild(barra);
}`,
    `/* E a barra responde: fechar por Escape ou clique fora atualiza o estado. */
const observador = new MutationObserver(() => {
  const gatilhos = area.querySelectorAll('[data-slot="menubar-trigger"]');
  menuAberto = null;
  gatilhos.forEach((gatilho, i) => {
    if (gatilho.getAttribute('aria-expanded') === 'true') menuAberto = i;
  });
});

observador.observe(area, {
  subtree: true,
  attributes: true,
  attributeFilter: ['aria-expanded'],
});`,
    appendLine('area'),
  );
}
