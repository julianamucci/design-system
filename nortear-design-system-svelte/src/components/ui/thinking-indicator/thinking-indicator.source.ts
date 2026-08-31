/**
 * Transforms do painel Code do indicador de geração.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica algo que
 * não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground escreve a frase que os controls estão mostrando; as demais
 * escrevem a frase de exemplo. O que o painel ensina é sempre a peça, nunca o
 * andaime da story.
 */
import { svelteSnippet } from '@/lib/story-source';

/** O que a story muda e que o snippet precisa mostrar. */
export type IndicatorSnippetArgs = {
  /** A frase que o Playground está anunciando. */
  label?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: IndicatorSnippetArgs };

const DEFAULT_LABEL = 'Gerando resposta';

const IMPORT_INDICATOR =
  "import { ThinkingIndicator } from '@/components/ui/thinking-indicator';";
const IMPORT_MARKDOWN = "import { Markdown } from '@/components/ui/markdown';";
const IMPORT_COMPOSER = "import { Composer } from '@/components/ui/composer';";

/** Texto em aspas duplas de atributo, com a aspa do próprio texto escapada. */
function quoted(value: string): string {
  return `"${value.replace(/"/g, '&quot;')}"`;
}

/** A tag da peça, com a única prop que ela tem. */
function tag(label: string): string {
  return `<ThinkingIndicator label=${quoted(label)} />`;
}

/** Transform do `meta` — o Playground, com a frase dos controls. */
export function thinkingIndicatorSource(_generated?: unknown, ctx?: StoryContext): string {
  return svelteSnippet(IMPORT_INDICATOR, tag(ctx?.args?.label || DEFAULT_LABEL));
}

/** A espera: o indicador no lugar em que a resposta vai aparecer. */
export function indicatorWaitingSource(): string {
  return svelteSnippet(
    `${IMPORT_INDICATOR}\n${IMPORT_MARKDOWN}`,
    `<div class="nds-stack" data-spacing="sm">
  <Markdown content={pergunta} />
  <!-- O indicador é o ÚLTIMO da conversa: ele ocupa o lugar do que ainda não veio. -->
  ${tag(DEFAULT_LABEL)}
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
  return svelteSnippet(
    `${IMPORT_INDICATOR}\n${IMPORT_MARKDOWN}`,
    `<!-- Chegou o texto: o indicador sai, e o lugar passa a ser da resposta. -->
{#if trecho}
  <Markdown content={trecho} />
{:else}
  ${tag(DEFAULT_LABEL)}
{/if}`,
  );
}

/** A troca inteira, do jeito que quem consome a escreve. */
export function indicatorReplacingSource(): string {
  return svelteSnippet(
    `${IMPORT_INDICATOR}
${IMPORT_MARKDOWN}

// O primeiro trecho que chega pelo protocolo é o que faz a troca. O indicador
// não sabe que ele chegou, e por isso a decisão é de quem monta a conversa.
let trecho = $state('');`,
    `<div class="nds-stack" data-spacing="sm">
  <Markdown content={pergunta} />
  {#if trecho}
    <Markdown content={trecho} />
  {:else}
    ${tag(DEFAULT_LABEL)}
  {/if}
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
  return svelteSnippet(
    `${IMPORT_INDICATOR}\n${IMPORT_COMPOSER}`,
    `${tag(DEFAULT_LABEL)}
<!-- Só o campo oferece o que acionar; o indicador não tem controle nenhum. -->
<Composer {labels} running />`,
  );
}
