// Snippet do painel Code do Command — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Um comando da lista, na forma que a fábrica aceita. */
export type CommandItemSnippet = {
  /** Ausente vale por `'item'`, como na fábrica. */
  type?: 'item';
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  checked?: boolean;
  shortcut?: string;
};

/** Traço entre dois blocos — união discriminada, como na fábrica. */
export type CommandEntrySnippet = CommandItemSnippet | { type: 'separator' };

export type CommandSnippetOptions = {
  placeholder?: string;
  emptyMessage?: string;
  /** Só afeta a lista padrão: com grupos, cada comando declara o seu. */
  showGroups?: boolean;
  /** Lista explícita, quando a story mostra uma opção que a padrão não tem. */
  items?: CommandEntrySnippet[];
  /** Corpo do callback de escolha, quando a story o exercita. */
  onSelect?: string;
};

/**
 * Lista canônica: a MESMA que o Playground desenha (`buildItems` em
 * `command.stories.ts`), dois blocos nomeados.
 *
 * Até 2026-09-10 esta lista tinha três comandos e o Playground cinco: o painel
 * Code da story mais aberta do componente publicava uma paleta diferente da que
 * estava na tela. Mudou um lado, mude o outro.
 */
function itemsDefault(withGroups: boolean): CommandEntrySnippet[] {
  const componentes = withGroups ? 'Componentes' : undefined;
  const utilitarios = withGroups ? 'Utilitários' : undefined;
  return [
    { value: 'button', label: 'Button', group: componentes },
    { value: 'input', label: 'Input', group: componentes },
    { value: 'separator', label: 'Separator', group: componentes },
    { value: 'cn', label: 'cn()', group: utilitarios },
    { value: 'clsx', label: 'clsx()', group: utilitarios },
  ];
}

function literalDoItem(entry: CommandEntrySnippet): string {
  // Pelo VALOR do discriminante, e não pela presença da chave: um comando pode
  // declarar `type: 'item'` e continua sendo comando.
  if (entry.type === 'separator') return "{ type: 'separator' }";
  const partes = [`value: ${text(entry.value)}`, `label: ${text(entry.label)}`];
  if (entry.group) partes.push(`group: ${text(entry.group)}`);
  if (entry.shortcut) partes.push(`shortcut: ${text(entry.shortcut)}`);
  if (entry.checked !== undefined) partes.push(`checked: ${String(entry.checked)}`);
  if (entry.disabled) partes.push('disabled: true');
  return `{ ${partes.join(', ')} }`;
}

/**
 * O array de itens já indentado para caber dentro da chamada: `callLine()`
 * prefixa só a PRIMEIRA linha de cada opção, então as de dentro do array já
 * saem daqui no recuo final.
 */
function itemsLiteral(items: CommandEntrySnippet[]): string {
  return `[\n${items.map((i) => `    ${literalDoItem(i)},`).join('\n')}\n  ]`;
}

/** O texto do callback só entra quando é texto: nos args ele chega como função. */
function callbackBody(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function paletteOptions(o: CommandSnippetOptions): string[] {
  return options([
    ['placeholder', o.placeholder ? text(o.placeholder) : undefined],
    ['emptyMessage', o.emptyMessage ? text(o.emptyMessage) : undefined],
    ['items', itemsLiteral(o.items ?? itemsDefault(o.showGroups !== false))],
    ['onSelect', callbackBody(o.onSelect)],
  ]);
}

/** A chamada real de `createCommand` com os itens da story. */
export function commandSnippet(o: CommandSnippetOptions = {}): string {
  return snippet(
    importing('command', 'createCommand'),
    `const paleta = ${callLine('createCommand', paletteOptions(o))};`,
    appendLine('paleta'),
  );
}

/**
 * A paleta dentro de um Dialog — o padrão command palette.
 *
 * Forma própria pelo mesmo motivo do arranjo acima, mais o atalho global: o
 * Cmd+K não é nativo de componente nenhum, é um ouvinte de janela que quem
 * consome registra.
 *
 * A dica do atalho vai DENTRO do gatilho e a classe do painel entra na chamada,
 * como na story: sem a `.nds-command-dialog-content` o painel usa o
 * centramento do Dialog comum, com padding, e não o de paleta (PRD D9).
 */
export function commandEmDialogSnippet(o: CommandSnippetOptions = {}): string {
  return snippet(
    [
      importing('button', 'createButton'),
      importing('command', 'createCommand'),
      importing('dialog', 'createDialog'),
    ].join('\n'),
    [
      "const gatilho = createButton({ variant: 'outline', label: 'Buscar' });",
      "const dica = document.createElement('kbd');",
      "dica.className = 'nds-kbd';",
      "dica.textContent = 'Ctrl+K';",
      'gatilho.append(dica);',
    ].join('\n'),
    `const paleta = ${callLine('createCommand', paletteOptions(o))};`,
    `const dialogo = ${callLine('createDialog', options([
      ['trigger', 'gatilho'],
      ['title', text('Command Palette')],
      ['description', text('Busque por um comando ou ação...')],
      ['headerHidden', 'true'],
      ['showCloseButton', 'false'],
      ['class', text('nds-command-dialog-content')],
      ['content', 'paleta'],
      ['onOpenChange', '(open) => { if (open) paleta.reset(); }'],
    ]))};`,
    [
      '// O diálogo precisa de nome, e desenhá-lo em cima da busca seria',
      '// redundante para quem enxerga: `headerHidden` tira o cabeçalho da tela',
      '// e o mantém na árvore de acessibilidade.',
      '',
      '// O Dialog reaproveita o nó da paleta: `reset()` a cada abertura começa',
      '// com a busca vazia e o primeiro comando em destaque.',
      '',
      '// O atalho global é de quem consome — componente nenhum o registra.',
      "window.addEventListener('keydown', (e) => {",
      "  if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;",
      '  e.preventDefault();',
      '  gatilho.click();',
      '});',
    ].join('\n'),
    appendLine('dialogo'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na lista canônica.
 */
export const commandSource: SourceTransform<CommandSnippetOptions> = (_gerado, ctx) =>
  commandSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function commandSourceWith(
  fixas: CommandSnippetOptions,
): SourceTransform<CommandSnippetOptions> {
  return (_gerado, ctx) => commandSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a paleta dentro de um Dialog. */
export function commandEmDialogSource(
  fixas: CommandSnippetOptions = {},
): SourceTransform<CommandSnippetOptions> {
  return (_gerado, ctx) => commandEmDialogSnippet({ ...ctx.args, ...fixas });
}
