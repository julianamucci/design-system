// Snippet do painel Code do AlertDialog — ver `@/lib/story-source`.

import {
  callLine,
  importing,
  appendLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Variante do Button usada no gatilho e na ação. */
export type AlertDialogTom = 'destructive' | 'default';

export type AlertDialogSnippetOptions = {
  /**
   * Severidade da confirmação. Não é opção da fábrica: é o que decide a
   * variante do Button do gatilho e da ação, exatamente como os controls da
   * story fazem.
   */
  tone?: AlertDialogTom;
  /** Variante do gatilho, quando ela não acompanha o tom (confirmação neutra). */
  triggerVariant?: 'destructive' | 'default' | 'outline';
  triggerLabel?: string;
  title?: string;
  /** Descrição — string vazia mostra a composição sem descrição. */
  description?: string;
  cancelLabel?: string;
  actionLabel?: string;
  /** Bloco de ícone no topo do header (`createAlertDialogMedia`). */
  showMedia?: boolean;
  defaultOpen?: boolean;
  class?: string;
  /**
   * Corpo do callback de abertura. É `string` porque o que entra no snippet é
   * CÓDIGO — a story passa uma função de verdade nos args.
   */
  onOpenChange?: string;
};

const DEFAULTS = {
  triggerLabel: 'Excluir conta',
  title: 'Excluir conta',
  description:
    'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
  cancelLabel: 'Cancelar',
  actionLabel: 'Excluir',
} as const;

/** A composição real: três botões, o bloco opcional de mídia e a fábrica. */
export function alertDialogSnippet(o: AlertDialogSnippetOptions = {}): string {
  const tone: AlertDialogTom = o.tone ?? 'destructive';
  const actionVariant = tone === 'destructive' ? 'destructive' : 'default';
  const triggerVariant = o.triggerVariant ?? actionVariant;
  const description = o.description ?? DEFAULTS.description;

  const imports = [
    o.showMedia
      ? importing('alert-dialog', 'createAlertDialog', 'createAlertDialogMedia')
      : importing('alert-dialog', 'createAlertDialog'),
    ...(o.showMedia ? [importing('alert', 'createAlertIcon')] : []),
    importing('button', 'createButton'),
  ];

  const buttons = [
    `const trigger = createButton({ variant: ${text(triggerVariant)}, label: ${text(o.triggerLabel ?? DEFAULTS.triggerLabel)} });`,
    `const cancelButton = createButton({ variant: 'outline', label: ${text(o.cancelLabel ?? DEFAULTS.cancelLabel)} });`,
    `const actionButton = createButton({ variant: ${text(actionVariant)}, label: ${text(o.actionLabel ?? DEFAULTS.actionLabel)} });`,
  ].join('\n');

  const media = o.showMedia
    ? `const media = createAlertDialogMedia();
media.appendChild(createAlertIcon('warning'));`
    : '';

  // Propriedade abreviada onde a fábrica recebe o elemento pronto: é assim que
  // se escreve, e `trigger: trigger` seria ruído. `chamada` só junta as linhas,
  // então a abreviação convive com o que `options` monta.
  const lines = [
    'trigger,',
    ...options([
      ['title', text(o.title ?? DEFAULTS.title)],
      ['description', description ? text(description) : undefined],
    ]),
    ...(o.showMedia ? ['media,'] : []),
    'cancelButton,',
    'actionButton,',
    ...options([
      ['defaultOpen', o.defaultOpen ? 'true' : undefined],
      ['class', o.class ? text(o.class) : undefined],
      // A story passa uma FUNÇÃO nos args; só um corpo escrito como texto vira
      // snippet. Sem esta guarda o painel imprimiria o espião da story.
      ['onOpenChange', typeof o.onOpenChange === 'string' ? o.onOpenChange : undefined],
    ]),
  ];

  return snippet(
    imports.join('\n'),
    buttons,
    media,
    `const dialog = ${callLine('createAlertDialog', lines)};`,
    appendLine('dialog'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na confirmação destrutiva, que é o
 * uso canônico do componente.
 */
export const alertDialogSource: SourceTransform<AlertDialogSnippetOptions> = (_gerado, ctx) =>
  alertDialogSnippet(ctx.args ?? {});

/** Transform de story: mesma composição, opções fixas que os controls não cobrem. */
export function alertDialogSourceWith(
  fixas: AlertDialogSnippetOptions,
): SourceTransform<AlertDialogSnippetOptions> {
  return (_gerado, ctx) => alertDialogSnippet({ ...ctx.args, ...fixas });
}
