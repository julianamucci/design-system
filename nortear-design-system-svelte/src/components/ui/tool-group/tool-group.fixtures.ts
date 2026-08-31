/**
 * Andaime das demonstrações do grupo de ferramentas.
 *
 * Existe pelo mesmo motivo do andaime do estado da execução: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar o mapa para cada arquivo — produz cópias que divergem sem
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
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import groupTranslations from '@shared/content/tool-group/translations.json';
import { TOOL_CALL_STATES, type ToolCallState } from '@shared/primitives/chat-protocol';
import type { ToolGroupLabels } from './index';

/**
 * O que a `translations.json` traz, que NÃO é a mesma forma do componente.
 *
 * O título é FUNÇÃO na peça e é um par de frases no conteúdo — "1 ferramenta" e
 * "{n} ferramentas" são duas frases diferentes em cada idioma, e escolher entre
 * elas é o que impede o componente de escolher por cinco idiomas de uma vez.
 */
type ToolGroupContent = {
  title: { one: string; other: string };
  summary: Record<ToolCallState, string>;
  call: Record<ToolCallState, string>;
};

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida em CADA idioma, então
 * rótulo que sumir do JSON — ou idioma que ficar para trás — reprova no
 * type-check, e não na tela. Um estado sem palavra deixaria a etiqueta em
 * branco, e o grupo distinguindo a chamada só pela cor.
 */
const CONTENT: Record<Locale, { labels: ToolGroupContent }> = groupTranslations;

/** Os rótulos do grupo num idioma — a forma para quem já tem o locale em mãos. */
export function toolGroupLabelsFor(target: Locale): ToolGroupLabels {
  const content = CONTENT[target].labels;

  // Os dois mapas saem de `TOOL_CALL_STATES`, e não de quatro linhas escritas à
  // mão: estado novo no vocabulário compartilhado entra aqui sozinho, e a story
  // que percorre os estados passa a cobri-lo sem que ninguém lembre do andaime.
  const summary = {} as Record<ToolCallState, string>;
  const call = {} as Record<ToolCallState, string>;
  for (const state of TOOL_CALL_STATES) {
    summary[state] = content.summary[state];
    call[state] = content.call[state];
  }

  return {
    title: (count: number) =>
      count === 1 ? content.title.one : content.title.other.replace('{n}', String(count)),
    summary,
    call,
  };
}

/**
 * Os rótulos do grupo fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que o grupo desenha.
 */
export function toolGroupLabels(): ToolGroupLabels {
  return toolGroupLabelsFor(get(locale));
}
