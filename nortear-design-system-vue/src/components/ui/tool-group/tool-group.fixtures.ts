/**
 * Andaime das demonstrações do grupo de ferramentas.
 *
 * Existe pelo mesmo motivo do andaime do estado da execução: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. As
 * CHAMADAS saem de `@shared/primitives/tool-group-examples`, porque são fala —
 * e fala é a mesma nos três idiomas e nas cinco stacks. Se cada stack
 * escrevesse as próprias chamadas, as cinco stories deixariam de fotografar a
 * mesma tela e a divergência só apareceria no Chromatic, como diferença de
 * largura que ninguém consegue atribuir a nada.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import type { ToolCallState } from '@shared/primitives/chat-protocol';
import groupTranslations from '@shared/content/tool-group/translations.json';
import type { ToolGroupLabels } from './ToolGroup.vue';

/**
 * A forma dos rótulos COMO ELES CHEGAM DO CONTEÚDO — o título ainda em duas
 * frases, e não já resolvido em função.
 *
 * A anotação é o PORTÃO, e ela é a mesma do estado da execução: a seção
 * `labels` é lida em CADA idioma, então rótulo que sumir do JSON — ou idioma
 * que ficar para trás — reprova no type-check, e não na tela. Os dois mapas de
 * estado são `Record<ToolCallState, string>` de propósito: estado novo em
 * `TOOL_CALL_STATES` reprova a compilação aqui em vez de desenhar uma etiqueta
 * em branco que ninguém repara.
 *
 * O plural fica no JSON porque é decisão de idioma: "1 ferramenta" e
 * "{n} ferramentas" são duas frases diferentes em cada um, e escolher entre
 * elas aqui é o que impede o componente de escolher por três idiomas de uma vez.
 */
interface ToolGroupContent {
  labels: {
    title: { one: string; other: string };
    summary: Record<ToolCallState, string>;
    call: Record<ToolCallState, string>;
  };
}

const CONTENT: Record<Locale, ToolGroupContent> = groupTranslations;

/** Os rótulos do grupo num idioma — a forma para quem já tem o locale em mãos. */
export function toolGroupLabelsFor(target: Locale): ToolGroupLabels {
  const { title, summary, call } = CONTENT[target].labels;
  return {
    title: (count: number) =>
      count === 1 ? title.one : title.other.replace('{n}', String(count)),
    summary,
    call,
  };
}

/**
 * Os rótulos do grupo fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a caixa desenha.
 */
export function toolGroupLabels(): ToolGroupLabels {
  return toolGroupLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos do grupo no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a caixa no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useToolGroupLabels(): ComputedRef<ToolGroupLabels> {
  const { locale } = useTranslation(groupTranslations);
  return computed(() => toolGroupLabelsFor(locale.value as Locale));
}
