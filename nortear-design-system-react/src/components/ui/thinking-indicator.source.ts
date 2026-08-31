/**
 * Snippet do painel Code do indicador de geração — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground escreve a frase que os controls estão mostrando; as demais
 * escrevem a frase de exemplo. O que o painel ensina é sempre a peça, nunca o
 * andaime da story.
 */
import { attrs, jsxSnippet, propText, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { ThinkingIndicator } from "@/components/ui/thinking-indicator";';
const MARKDOWN_IMPORT = 'import { Markdown } from "@/components/ui/markdown";';
const COMPOSER_IMPORT = 'import { Composer } from "@/components/ui/composer";';

export type IndicatorSnippetOptions = {
  /** A frase que o Playground está anunciando. */
  label?: string;
};

const DEFAULT_LABEL = 'Gerando resposta';

/** A peça sozinha, com a frase que lhe mandaram dizer. */
function element(label: string): string {
  return `<ThinkingIndicator${attrs(propText('label', label))} />`;
}

function build(label: string): string {
  return jsxSnippet(IMPORT, element(label));
}

/** Transform do `meta` — o Playground, com a frase dos controls. */
export const thinkingIndicatorSource: SourceTransform<IndicatorSnippetOptions> = (
  _generated,
  ctx,
) => build(text(ctx?.args?.label) ?? DEFAULT_LABEL);

/** A espera: o indicador no lugar em que a resposta vai aparecer. */
export function indicatorWaitingSource(): string {
  return jsxSnippet(
    `${IMPORT}\n${MARKDOWN_IMPORT}`,
    `<div className="nds-stack" data-spacing="sm">
  <Markdown content={pergunta} />
  {/* O indicador é o ÚLTIMO da conversa: ele ocupa o lugar do que ainda não veio. */}
  ${element(DEFAULT_LABEL)}
</div>`,
  );
}

/**
 * O texto chegou.
 *
 * O snippet mostra as duas metades juntas de propósito: sumir é a única regra
 * da peça que ela não pode cumprir sozinha, porque só quem monta a conversa
 * sabe que o primeiro trecho chegou.
 */
export function indicatorArrivedSource(): string {
  return jsxSnippet(
    `${IMPORT}\n${MARKDOWN_IMPORT}`,
    `{/* Chegou o texto: o indicador sai, e o lugar passa a ser da resposta. */}
{texto ? <Markdown content={texto} /> : ${element(DEFAULT_LABEL)}}`,
  );
}

/** A troca inteira, do jeito que quem consome a escreve. */
export function indicatorReplacingSource(): string {
  return jsxSnippet(
    `${IMPORT}\n${MARKDOWN_IMPORT}`,
    `<div className="nds-stack" data-spacing="sm">
  <Markdown content={pergunta} />
  {/* Quando o primeiro trecho chega, quem monta a conversa faz a troca: o
      indicador não sabe que a resposta começou a vir. */}
  {texto ? <Markdown content={texto} /> : ${element(DEFAULT_LABEL)}}
</div>`,
  );
}

/**
 * O indicador junto do campo que já oferece interromper.
 *
 * As duas peças falam da mesma espera e não se repetem: uma diz que a resposta
 * vem, a outra oferece o que fazer a respeito.
 */
export function indicatorWithComposerSource(): string {
  return jsxSnippet(
    `${IMPORT}\n${COMPOSER_IMPORT}`,
    `<>
  ${element(DEFAULT_LABEL)}
  {/* Só o campo oferece o que acionar; o indicador não tem controle nenhum. */}
  <Composer labels={labels} running />
</>`,
  );
}
