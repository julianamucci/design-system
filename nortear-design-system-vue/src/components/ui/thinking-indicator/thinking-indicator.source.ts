/**
 * Transforms do painel Code do indicador de geração.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * O Playground escreve a frase que os controls estão mostrando; as demais
 * escrevem a frase de exemplo. O que o painel ensina é sempre a peça, nunca o
 * andaime da story.
 */
import { attrs, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type IndicatorSnippetOptions = {
  /** A frase que o Playground está anunciando. */
  label?: string;
};

const DEFAULT_LABEL = 'Gerando resposta';

const IMPORT_INDICATOR =
  "import { ThinkingIndicator } from '@/components/ui/thinking-indicator';";
const IMPORT_MARKDOWN = "import { Markdown } from '@/components/ui/markdown';";

/** A tag sozinha, com a frase que o consumidor manda anunciar. */
function tag(label: string): string {
  return `<ThinkingIndicator${attrs(`label="${text(label)}"`)} />`;
}

/** Transform do `meta` — o Playground, com a frase dos controls. */
export const thinkingIndicatorSource: SourceTransform<IndicatorSnippetOptions> = (_gerado, ctx) =>
  vueSnippet(IMPORT_INDICATOR, tag(ctx?.args?.label || DEFAULT_LABEL));

/** A espera: o indicador no lugar em que a resposta vai aparecer. */
export function indicatorWaitingSource(): string {
  return vueSnippet(
    `${IMPORT_MARKDOWN}\n${IMPORT_INDICATOR}`,
    `<div class="nds-stack" data-spacing="sm">
  <Markdown :content="question" />
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
  return vueSnippet(
    `${IMPORT_MARKDOWN}\n${IMPORT_INDICATOR}`,
    `<div class="nds-stack" data-spacing="sm">
  <Markdown :content="question" />
  <!-- Chegou o texto: o indicador sai, e o lugar passa a ser da resposta. -->
  <Markdown v-if="answer" :content="answer" />
  <ThinkingIndicator v-else label="${text(DEFAULT_LABEL)}" />
</div>`,
  );
}

/** A troca inteira, do jeito que quem consome a escreve. */
export function indicatorReplacingSource(): string {
  return vueSnippet(
    `import { ref } from 'vue';\n${IMPORT_MARKDOWN}\n${IMPORT_INDICATOR}\n\n// Quem monta a conversa é quem vira a chave, ao chegar o primeiro trecho.\nconst answer = ref('');`,
    `<div class="nds-stack" data-spacing="sm">
  <Markdown :content="question" />
  <Markdown v-if="answer" :content="answer" />
  <ThinkingIndicator v-else label="${text(DEFAULT_LABEL)}" />
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
  return vueSnippet(
    `${IMPORT_INDICATOR}\nimport { Composer } from '@/components/ui/composer';`,
    `<div class="nds-stack" data-spacing="sm">
  ${tag(DEFAULT_LABEL)}
  <!-- Só o campo oferece o que acionar; o indicador não tem controle nenhum. -->
  <Composer :labels="labels" running />
</div>`,
  );
}
