// Snippet do painel Code do indicador de geração — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// O Playground escreve a frase que os controls estão mostrando; as demais
// escrevem a frase de exemplo. O que o painel ensina é sempre a peça, nunca o
// andaime da story.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type IndicatorSnippetOptions = {
  /** A frase que o Playground está anunciando. */
  label?: string;
};

const DEFAULT_LABEL = 'Gerando resposta';

function build(label: string): string {
  return snippet(
    importing('thinking-indicator', 'createThinkingIndicator'),
    `const indicator = ${callLine('createThinkingIndicator', options([['label', text(label)]]))};`,
    appendLine('indicator'),
  );
}

/** Transform do `meta` — o Playground, com a frase dos controls. */
export const thinkingIndicatorSource: SourceTransform<IndicatorSnippetOptions> = (_c, ctx) => {
  return build(ctx?.args?.label || DEFAULT_LABEL);
};

/** A espera: o indicador no lugar em que a resposta vai aparecer. */
export function indicatorWaitingSource(): string {
  return snippet(
    importing('thinking-indicator', 'createThinkingIndicator'),
    `const indicator = ${callLine('createThinkingIndicator', options([['label', text(DEFAULT_LABEL)]]))};`,
    `// O indicador é o ÚLTIMO da conversa: ele ocupa o lugar do que ainda não veio.\nlugar.append(indicator);`,
  );
}

/**
 * O texto chegou.
 *
 * O snippet mostra as duas linhas juntas de propósito: sumir é a única regra da
 * peça que ela não pode cumprir sozinha, porque só quem monta a conversa sabe
 * que o primeiro trecho chegou.
 */
export function indicatorArrivedSource(): string {
  return snippet(
    importing('markdown', 'createMarkdown'),
    `// Chegou o texto: o indicador sai, e o lugar passa a ser da resposta.\nindicator.remove();\nlugar.append(${callLine('createMarkdown', options([['content', 'trecho']]))});`,
  );
}

/** A troca inteira, do jeito que quem consome a escreve. */
export function indicatorReplacingSource(): string {
  return snippet(
    importing('thinking-indicator', 'createThinkingIndicator'),
    importing('markdown', 'createMarkdown'),
    `const indicator = ${callLine('createThinkingIndicator', options([['label', text(DEFAULT_LABEL)]]))};\nlugar.append(indicator);`,
    `// Quando o primeiro trecho chega, quem monta a conversa faz a troca.\nindicator.remove();\nlugar.append(${callLine('createMarkdown', options([['content', 'trecho']]))});`,
  );
}

/**
 * O indicador junto do campo que já oferece interromper.
 *
 * As duas peças falam da mesma espera e não se repetem: uma diz que a resposta
 * vem, a outra oferece o que fazer a respeito.
 */
export function indicatorWithComposerSource(): string {
  return snippet(
    importing('thinking-indicator', 'createThinkingIndicator'),
    importing('composer', 'createComposer'),
    `const indicator = ${callLine('createThinkingIndicator', options([['label', text(DEFAULT_LABEL)]]))};`,
    `const composer = ${callLine('createComposer', options([['labels', 'rotulos']]))};\n// Só o campo oferece o que acionar; o indicador não tem controle nenhum.\ncomposer.setRunning(true);`,
    appendLine('indicator'),
  );
}
