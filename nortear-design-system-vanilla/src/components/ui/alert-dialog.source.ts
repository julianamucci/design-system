// Snippet do painel Code do AlertDialog — ver `@/lib/story-source`.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
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
      ? importar('alert-dialog', 'createAlertDialog', 'createAlertDialogMedia')
      : importar('alert-dialog', 'createAlertDialog'),
    ...(o.showMedia ? [importar('alert', 'createAlertIcon')] : []),
    importar('button', 'createButton'),
  ];

  const botoes = [
    `const trigger = createButton({ variant: ${texto(triggerVariant)}, label: ${texto(o.triggerLabel ?? DEFAULTS.triggerLabel)} });`,
    `const cancelButton = createButton({ variant: 'outline', label: ${texto(o.cancelLabel ?? DEFAULTS.cancelLabel)} });`,
    `const actionButton = createButton({ variant: ${texto(actionVariant)}, label: ${texto(o.actionLabel ?? DEFAULTS.actionLabel)} });`,
  ].join('\n');

  const media = o.showMedia
    ? `const media = createAlertDialogMedia();
media.appendChild(createAlertIcon('warning'));`
    : '';

  // Propriedade abreviada onde a fábrica recebe o elemento pronto: é assim que
  // se escreve, e `trigger: trigger` seria ruído. `chamada` só junta as linhas,
  // então a abreviação convive com o que `opcoes` monta.
  const linhas = [
    'trigger,',
    ...opcoes([
      ['title', texto(o.title ?? DEFAULTS.title)],
      ['description', description ? texto(description) : undefined],
    ]),
    ...(o.showMedia ? ['media,'] : []),
    'cancelButton,',
    'actionButton,',
    ...opcoes([
      ['defaultOpen', o.defaultOpen ? 'true' : undefined],
      ['class', o.class ? texto(o.class) : undefined],
      // A story passa uma FUNÇÃO nos args; só um corpo escrito como texto vira
      // snippet. Sem esta guarda o painel imprimiria o espião da story.
      ['onOpenChange', typeof o.onOpenChange === 'string' ? o.onOpenChange : undefined],
    ]),
  ];

  return snippet(
    imports.join('\n'),
    botoes,
    media,
    `const dialog = ${chamada('createAlertDialog', linhas)};`,
    montar('dialog'),
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
