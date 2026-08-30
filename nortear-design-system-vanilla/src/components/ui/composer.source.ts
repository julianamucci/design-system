// Snippet do painel Code do Composer — ver `@/lib/story-source`.
//
// Sem isto o renderer html imprime o `outerHTML`: o formulário inteiro já
// desenhado, com a moldura, o trilho, o contador e a dica. O que se escreve é
// uma chamada de fábrica com rótulos e um punhado de opções — é isso que o
// painel mostra.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories usam da `ComposerOptions` e que o snippet precisa mostrar. */
export type ComposerSnippetOptions = {
  value?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  submitOn?: 'enter' | 'modifier';
  /** A story põe controles no trilho? */
  rail?: boolean;
  /** A story liga o estado de geração depois de montar? */
  running?: boolean;
  class?: string;
};

/**
 * O `onSubmit` entra SEMPRE, mesmo quando a story não passa nenhum.
 *
 * Sem ele o snippet ensinaria um composer que não faz nada com o que foi
 * escrito — que é o erro mais provável de quem copia, porque o componente não
 * limpa o campo nem envia por conta própria. A linha existe para dizer onde a
 * responsabilidade continua.
 */
export function composerSnippet(opts: ComposerSnippetOptions = {}): string {
  const linhas = options([
    ['labels', 'rotulos'],
    ['value', opts.value ? `'${opts.value}'` : undefined],
    ['rows', opts.rows === undefined ? undefined : String(opts.rows)],
    ['maxLength', opts.maxLength === undefined ? undefined : String(opts.maxLength)],
    ['submitOn', opts.submitOn ? `'${opts.submitOn}'` : undefined],
    ['disabled', opts.disabled ? 'true' : undefined],
    ['railStart', opts.rail ? "[createButton({ label: 'Anexar', variant: 'ghost', size: 'sm' })]" : undefined],
    ['onSubmit', '(texto) => enviar(texto)'],
    ['onStop', opts.running ? '() => cancelar()' : undefined],
    ['class', opts.class ? `'${opts.class}'` : undefined],
  ]);

  return snippet(
    importing('composer', 'createComposer'),
    `const composer = ${chamada('createComposer', linhas)};`,
    montar('composer'),
    // Quem sabe se a resposta está sendo gerada é quem consome — o componente
    // não acompanha a rede. A linha mostra por onde esse estado entra.
    opts.running
      ? '// O estado de geração é de quem consome.\ncomposer.setRunning(true);'
      : undefined,
  );
}

/** Transform do painel Code: lê os args da story e devolve a chamada. */
export const composerSource: SourceTransform<ComposerSnippetOptions> = (_code, ctx) =>
  composerSnippet(ctx?.args ?? {});

/** Transform de story que fixa opções por cima dos args do arquivo. */
export function composerSourceWith(
  fixed: ComposerSnippetOptions,
): SourceTransform<ComposerSnippetOptions> {
  return (_gerado, ctx) => composerSnippet({ ...ctx.args, ...fixed });
}
