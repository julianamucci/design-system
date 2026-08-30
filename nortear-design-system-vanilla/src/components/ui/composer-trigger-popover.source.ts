// Snippet do painel Code do seletor do gatilho — ver `@/lib/story-source`.
//
// O que se escreve é uma chamada de `createComposer` com gatilhos; o painel
// mostra isso, e não o `outerHTML` do formulário com a lista já desenhada.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

export type TriggerSnippetOptions = {
  /** Quais gatilhos a story declara. */
  mention?: boolean;
  command?: boolean;
  /** Texto inicial do campo, quando a story precisa de um. */
  value?: string;
};

/**
 * A lista de opções NÃO entra no snippet.
 *
 * Ela é dado do exemplo — quatro pessoas e dois comandos —, e despejá-la faria
 * o painel ensinar o andaime em vez do componente. O snippet declara a
 * constante e mostra o que se faz com ela, que é onde estão as duas decisões
 * que importam: onde o gatilho vale e o que a lista oferece.
 */
export function triggerSnippet(opts: TriggerSnippetOptions = {}): string {
  const fontes: string[] = [];
  if (opts.mention !== false) fontes.push('{ spec: MENTION_TRIGGER, options: pessoas }');
  if (opts.command) fontes.push('{ spec: COMMAND_TRIGGER, options: comandos }');

  const especificos = fontes.length === 1 ? fontes[0]! : `\n    ${fontes.join(',\n    ')},\n  `;

  const linhas = options([
    ['labels', 'rotulos'],
    ['triggerLabels', 'rotulosDoSeletor'],
    ['triggers', `[${especificos}]`],
    ['value', opts.value ? `'${opts.value}'` : undefined],
    ['onSubmit', '(texto) => enviar(texto)'],
  ]);

  const importes = [
    importing('composer', 'createComposer'),
    `import { ${opts.command ? 'COMMAND_TRIGGER, ' : ''}MENTION_TRIGGER } from '@shared/primitives/composer-trigger';`,
  ].join('\n');

  return snippet(
    importes,
    `const composer = ${chamada('createComposer', linhas)};`,
    montar('composer'),
  );
}

/** Transform do painel Code: lê os args da story e devolve a chamada. */
export const triggerPopoverSource: SourceTransform<TriggerSnippetOptions> = (_code, ctx) =>
  triggerSnippet(ctx?.args ?? {});

/** Transform de story que fixa opções por cima dos args do arquivo. */
export function triggerPopoverSourceWith(
  fixed: TriggerSnippetOptions,
): SourceTransform<TriggerSnippetOptions> {
  return (_gerado, ctx) => triggerSnippet({ ...ctx.args, ...fixed });
}
