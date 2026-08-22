// Snippet do painel Code do ContextMenu — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** Uma entrada do menu, na forma que a fábrica aceita. */
export type ContextMenuEntrySnippet = {
  /** `item` é o padrão e por isso não entra no snippet. */
  type?: 'item' | 'separator' | 'label' | 'checkbox' | 'radio' | 'submenu';
  value?: string;
  label?: string;
  shortcut?: string;
  variant?: 'destructive';
  inset?: boolean;
  disabled?: boolean;
  checked?: boolean;
  indeterminate?: boolean;
  /** Itens do submenu, quando `type: 'submenu'`. */
  items?: ContextMenuEntrySnippet[];
};

export type ContextMenuSnippetOptions = {
  /** Texto da área que responde ao gesto. */
  triggerLabel?: string;
  showShortcuts?: boolean;
  showSeparator?: boolean;
  showDestructive?: boolean;
  /** Lista explícita, quando a story mostra uma peça que a padrão não tem. */
  items?: ContextMenuEntrySnippet[];
  /** Valor corrente do grupo de escolha única. */
  radioValue?: string;
  /** Corpo do callback de abertura, quando a story o exercita. */
  onOpenChange?: string;
};

const AREA_DEFAULT = 'Clique com o botão direito aqui';

/**
 * Menu canônico: ação, ação, traço e a ação destrutiva. É o mesmo conjunto que
 * os controls do Playground ligam e desligam.
 */
function itemsDefault(o: ContextMenuSnippetOptions): ContextMenuEntrySnippet[] {
  const withShortcut = o.showShortcuts !== false;
  const itens: ContextMenuEntrySnippet[] = [
    { label: 'Editar', value: 'edit', shortcut: withShortcut ? '⌘E' : undefined },
    { label: 'Duplicar', value: 'duplicate' },
  ];
  if (o.showSeparator !== false) itens.push({ type: 'separator' });
  if (o.showDestructive !== false) {
    itens.push({
      label: 'Excluir',
      value: 'delete',
      variant: 'destructive',
      shortcut: withShortcut ? '⌫' : undefined,
    });
  }
  return itens;
}

/** Uma entrada por linha, com o submenu recuado dentro da entrada que o abre. */
function entriesLines(
  entradas: ContextMenuEntrySnippet[],
  recuo: string,
): string[] {
  return entradas.flatMap((entrada) => {
    const partes: string[] = [];
    if (entrada.type && entrada.type !== 'item') partes.push(`type: ${texto(entrada.type)}`);
    if (entrada.label !== undefined) partes.push(`label: ${texto(entrada.label)}`);
    if (entrada.value !== undefined) partes.push(`value: ${texto(entrada.value)}`);
    if (entrada.shortcut) partes.push(`shortcut: ${texto(entrada.shortcut)}`);
    if (entrada.variant) partes.push(`variant: ${texto(entrada.variant)}`);
    if (entrada.inset) partes.push('inset: true');
    if (entrada.disabled) partes.push('disabled: true');
    if (entrada.checked !== undefined) partes.push(`checked: ${String(entrada.checked)}`);
    if (entrada.indeterminate) partes.push('indeterminate: true');

    if (!entrada.items) return [`${recuo}{ ${partes.join(', ')} },`];

    return [
      `${recuo}{`,
      ...partes.map((p) => `${recuo}  ${p},`),
      `${recuo}  items: [`,
      ...entriesLines(entrada.items, `${recuo}    `),
      `${recuo}  ],`,
      `${recuo}},`,
    ];
  });
}

/** O array já indentado para caber dentro da chamada. */
function entriesLiteral(entradas: ContextMenuEntrySnippet[]): string {
  return `[\n${entriesLines(entradas, '    ').join('\n')}\n  ]`;
}

/** O texto do callback só entra quando é texto: nos args ele chega como função. */
function callbackBody(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

/**
 * A chamada real de `createContextMenu` com as entradas da story.
 *
 * A área que responde ao gesto é de quem consome, e é DOM cru curto — nada de
 * `criarAreaDeClique()`, que é sonda de teste e não faz parte do sistema.
 */
export function contextMenuSnippet(o: ContextMenuSnippetOptions = {}): string {
  const linhas = opcoes([
    ['trigger', 'area'],
    ['items', entriesLiteral(o.items ?? itemsDefault(o))],
    ['radioValue', o.radioValue ? texto(o.radioValue) : undefined],
    ['onOpenChange', callbackBody(o.onOpenChange)],
  ]);

  return snippet(
    importar('context-menu', 'createContextMenu'),
    [
      '// A área é de quem consome. A fábrica só garante a parada de tabulação',
      '// nela, para que a tecla Menu abra o menu de quem não usa mouse.',
      "const area = document.createElement('div');",
      `area.textContent = ${texto(o.triggerLabel ?? AREA_DEFAULT)};`,
    ].join('\n'),
    `const menu = ${chamada('createContextMenu', linhas)};`,
    montar('menu'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no menu canônico.
 */
export const contextMenuSource: SourceTransform<ContextMenuSnippetOptions> = (_gerado, ctx) =>
  contextMenuSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, entradas fixas que os controls não cobrem. */
export function contextMenuSourceWith(
  fixas: ContextMenuSnippetOptions,
): SourceTransform<ContextMenuSnippetOptions> {
  return (_gerado, ctx) => contextMenuSnippet({ ...ctx.args, ...fixas });
}
