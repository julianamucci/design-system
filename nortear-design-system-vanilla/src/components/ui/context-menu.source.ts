// Snippet do painel Code do ContextMenu — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
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
  const items: ContextMenuEntrySnippet[] = [
    { label: 'Editar', value: 'edit', shortcut: withShortcut ? 'Ctrl+E' : undefined },
    { label: 'Duplicar', value: 'duplicate' },
  ];
  if (o.showSeparator !== false) items.push({ type: 'separator' });
  if (o.showDestructive !== false) {
    items.push({
      label: 'Excluir',
      value: 'delete',
      variant: 'destructive',
      shortcut: withShortcut ? 'Delete' : undefined,
    });
  }
  return items;
}

/** Uma entrada por linha, com o submenu recuado dentro da entrada que o abre. */
function entriesLines(
  entries: ContextMenuEntrySnippet[],
  recuo: string,
): string[] {
  return entries.flatMap((entry) => {
    const partes: string[] = [];
    if (entry.type && entry.type !== 'item') partes.push(`type: ${text(entry.type)}`);
    if (entry.label !== undefined) partes.push(`label: ${text(entry.label)}`);
    if (entry.value !== undefined) partes.push(`value: ${text(entry.value)}`);
    if (entry.shortcut) partes.push(`shortcut: ${text(entry.shortcut)}`);
    if (entry.variant) partes.push(`variant: ${text(entry.variant)}`);
    if (entry.inset) partes.push('inset: true');
    if (entry.disabled) partes.push('disabled: true');
    if (entry.checked !== undefined) partes.push(`checked: ${String(entry.checked)}`);
    if (entry.indeterminate) partes.push('indeterminate: true');

    if (!entry.items) return [`${recuo}{ ${partes.join(', ')} },`];

    return [
      `${recuo}{`,
      ...partes.map((p) => `${recuo}  ${p},`),
      `${recuo}  items: [`,
      ...entriesLines(entry.items, `${recuo}    `),
      `${recuo}  ],`,
      `${recuo}},`,
    ];
  });
}

/** O array já indentado para caber dentro da chamada. */
function entriesLiteral(entries: ContextMenuEntrySnippet[]): string {
  return `[\n${entriesLines(entries, '    ').join('\n')}\n  ]`;
}

/** O texto do callback só entra quando é texto: nos args ele chega como função. */
function callbackBody(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * A chamada real de `createContextMenu` com as entradas da story.
 *
 * A área que responde ao gesto é de quem consome, e é DOM cru curto — nada de
 * `criarAreaDeClique()`, que é sonda de teste e não faz parte do sistema.
 */
export function contextMenuSnippet(o: ContextMenuSnippetOptions = {}): string {
  const lines = options([
    ['trigger', 'area'],
    ['items', entriesLiteral(o.items ?? itemsDefault(o))],
    ['radioValue', o.radioValue ? text(o.radioValue) : undefined],
    ['onOpenChange', callbackBody(o.onOpenChange)],
  ]);

  return snippet(
    importing('context-menu', 'createContextMenu'),
    [
      '// A área é de quem consome. A fábrica só garante a parada de tabulação',
      '// nela, para que a tecla Menu abra o menu de quem não usa mouse.',
      "const area = document.createElement('div');",
      `area.textContent = ${text(o.triggerLabel ?? AREA_DEFAULT)};`,
    ].join('\n'),
    `const menu = ${callLine('createContextMenu', lines)};`,
    appendLine('menu'),
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

// ─── Transforms por story ─────────────────────────────────────────────────────
//
// Story que mostra um menu diferente do canônico precisa da SUA transform, e a
// falta disso não aparece em lugar nenhum: sem ela a story herda a do `meta`, o
// painel Code publica o menu padrão, e o preview ao lado mostra outra coisa. Era
// o caso em quatro stories deste arquivo — o atalho "Desfazer Ctrl+Z" virava
// "Duplicar", "Excluir permanentemente" virava "Excluir", e a paleta escura e a
// sonda de limpeza publicavam o menu padrão inteiro. Quem copiava recebia um
// exemplo que não é o que estava vendo.

/** `WithShortcut`: dois atalhos de ação e o da ação destrutiva. */
export const contextMenuSourceWithShortcut: SourceTransform<ContextMenuSnippetOptions> =
  contextMenuSourceWith({
    items: [
      { label: 'Editar', value: 'editar', shortcut: 'Ctrl+E' },
      { label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
      { type: 'separator' },
      { label: 'Excluir', value: 'delete', shortcut: 'Delete', variant: 'destructive' },
    ],
  });

/** `ItemDestructive`: o rótulo por extenso, que é o que o preview mostra. */
export const contextMenuSourceItemDestructive: SourceTransform<ContextMenuSnippetOptions> =
  contextMenuSourceWith({
    items: [
      { label: 'Editar', value: 'normal', shortcut: 'Ctrl+E' },
      { label: 'Duplicar', value: 'duplicate' },
      { type: 'separator' },
      {
        label: 'Excluir permanentemente',
        value: 'perigo',
        shortcut: 'Delete',
        variant: 'destructive',
      },
    ],
  });

/**
 * `DarkPalette`: a paleta é do TEMA, e não da chamada — o que o snippet tem a
 * mostrar é o menu que está na foto, item desabilitado incluído.
 */
export const contextMenuSourceDarkPalette: SourceTransform<ContextMenuSnippetOptions> =
  contextMenuSourceWith({
    items: [
      { label: 'Editar', value: 'edit' },
      { label: 'Duplicar', value: 'off', disabled: true },
      { type: 'separator' },
      { label: 'Excluir', value: 'delete', variant: 'destructive' },
    ],
  });

/**
 * `ListenerCleanup`: aqui o assunto não é a lista de itens, é o CICLO.
 *
 * A fábrica registra ouvinte em `document`, então quem tira o nó da página
 * precisa de um caminho de saída. `destroy()` é público, idempotente e dispara
 * sozinho quando a raiz sai do documento; o snippet mostra a chamada explícita
 * porque é ela que serve a quem remove o nó por conta própria.
 */
export function contextMenuCleanupSnippet(o: ContextMenuSnippetOptions = {}): string {
  return snippet(
    contextMenuSnippet({
      ...o,
      triggerLabel: o.triggerLabel ?? 'Área com menu de contexto',
      items: [
        { label: 'Copiar', value: 'copy' },
        { label: 'Colar', value: 'paste' },
      ],
    }),
    [
      '// Ouvinte em `document` cobra um caminho de saída. `destroy()` é público',
      '// e idempotente, e também dispara sozinho quando a raiz sai da página.',
      'menu.destroy();',
    ].join('\n'),
  );
}

export const contextMenuSourceCleanup: SourceTransform<ContextMenuSnippetOptions> = (_gerado, ctx) =>
  contextMenuCleanupSnippet(ctx.args ?? {});
