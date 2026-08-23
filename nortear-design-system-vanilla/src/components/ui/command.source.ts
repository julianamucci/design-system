// Snippet do painel Code do Command — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Um comando da lista, na forma que a fábrica aceita. */
export type CommandItemSnippet = {
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

/** Lista canônica: dois blocos nomeados, que é o arranjo mais comum da paleta. */
function itemsDefault(withGroups: boolean): CommandEntrySnippet[] {
  const componentes = withGroups ? 'Componentes' : undefined;
  const utilitarios = withGroups ? 'Utilitários' : undefined;
  return [
    { value: 'button', label: 'Button', group: componentes },
    { value: 'input', label: 'Input', group: componentes },
    { value: 'cn', label: 'cn()', group: utilitarios },
  ];
}

function literalDoItem(entry: CommandEntrySnippet): string {
  if ('type' in entry) return "{ type: 'separator' }";
  const partes = [`value: ${text(entry.value)}`, `label: ${text(entry.label)}`];
  if (entry.group) partes.push(`group: ${text(entry.group)}`);
  if (entry.shortcut) partes.push(`shortcut: ${text(entry.shortcut)}`);
  if (entry.checked !== undefined) partes.push(`checked: ${String(entry.checked)}`);
  if (entry.disabled) partes.push('disabled: true');
  return `{ ${partes.join(', ')} }`;
}

/**
 * O array de itens já indentado para caber dentro da chamada: `chamada()`
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
    `const paleta = ${chamada('createCommand', paletteOptions(o))};`,
    montar('paleta'),
  );
}

/**
 * A paleta dentro de um Popover — o padrão combobox.
 *
 * Forma própria porque a sub-fábrica É o assunto: a paleta não flutua sozinha,
 * e o papel de combobox é escrito por quem compõe. Para o Popover o gatilho é
 * um botão comum, e sem o papel o leitor de tela anuncia só "botão".
 */
export function commandEmPopoverSnippet(o: CommandSnippetOptions = {}): string {
  const lines = paletteOptions({
    ...o,
    onSelect: o.onSelect ??
      "(value) => {\n    valor.textContent = value;\n    // Escolher fecha o painel: senão ele fica por cima do que a pessoa\n    // acabou de escolher.\n    if (gatilho.getAttribute('aria-expanded') === 'true') gatilho.click();\n  }",
  });

  return snippet(
    [
      importing('button', 'createButton'),
      importing('command', 'createCommand'),
      importing('popover', 'createPopover'),
    ].join('\n'),
    [
      "const valor = document.createElement('span');",
      "valor.textContent = 'Selecione um item...';",
    ].join('\n'),
    [
      "const gatilho = createButton({ variant: 'outline', children: valor });",
      '// O papel de combobox é de quem compõe: para o Popover este é um botão',
      '// comum, e sem ele ninguém descobre que há uma lista para escolher.',
      "gatilho.setAttribute('role', 'combobox');",
    ].join('\n'),
    `const paleta = ${chamada('createCommand', lines)};`,
    `const popover = ${chamada('createPopover', options([
      ['trigger', 'gatilho'],
      ['content', 'paleta'],
      ['side', text('bottom')],
      ['align', text('start')],
    ]))};`,
    montar('popover'),
  );
}

/**
 * A paleta dentro de um Dialog — o padrão command palette.
 *
 * Forma própria pelo mesmo motivo do arranjo acima, mais o atalho global: o
 * Cmd+K não é nativo de componente nenhum, é um ouvinte de janela que quem
 * consome registra.
 */
export function commandEmDialogSnippet(o: CommandSnippetOptions = {}): string {
  return snippet(
    [
      importing('button', 'createButton'),
      importing('command', 'createCommand'),
      importing('dialog', 'createDialog'),
    ].join('\n'),
    "const gatilho = createButton({ variant: 'outline', label: 'Buscar' });",
    `const paleta = ${chamada('createCommand', paletteOptions(o))};`,
    `const dialogo = ${chamada('createDialog', options([
      ['trigger', 'gatilho'],
      ['title', text('Command Palette')],
      ['description', text('Busque por um comando ou ação...')],
      ['headerHidden', 'true'],
      ['showCloseButton', 'false'],
      ['content', 'paleta'],
    ]))};`,
    [
      '// O diálogo precisa de nome, e desenhá-lo em cima da busca seria',
      '// redundante para quem enxerga: `headerHidden` tira o cabeçalho da tela',
      '// e o mantém na árvore de acessibilidade.',
      '',
      '// O atalho global é de quem consome — componente nenhum o registra.',
      "window.addEventListener('keydown', (e) => {",
      "  if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;",
      '  e.preventDefault();',
      '  gatilho.click();',
      '});',
    ].join('\n'),
    montar('dialogo'),
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

/** Transform de story para a paleta dentro de um Popover. */
export function commandEmPopoverSource(
  fixas: CommandSnippetOptions = {},
): SourceTransform<CommandSnippetOptions> {
  return (_gerado, ctx) => commandEmPopoverSnippet({ ...ctx.args, ...fixas });
}

/** Transform de story para a paleta dentro de um Dialog. */
export function commandEmDialogSource(
  fixas: CommandSnippetOptions = {},
): SourceTransform<CommandSnippetOptions> {
  return (_gerado, ctx) => commandEmDialogSnippet({ ...ctx.args, ...fixas });
}
