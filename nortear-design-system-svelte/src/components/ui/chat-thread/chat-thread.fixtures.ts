/**
 * Andaime das demonstrações do ChatThread — um construtor, cinco arquivos.
 *
 * Existe porque num `*.stories.ts` todo export nomeado vira story: o andaime
 * não pode morar lá, e a saída fácil é copiar a constante para cada arquivo.
 * Cópia divergida não é variação — é o defeito, porque corrigir uma delas deixa
 * as outras erradas sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`: são texto de interface, e texto de
 * interface tem três idiomas. As MENSAGENS saem de
 * `@shared/primitives/chat-examples`, que as cinco stacks compartilham — se
 * cada uma escrevesse a própria conversa, as cinco stories deixariam de
 * fotografar a mesma tela.
 *
 * Nada de `storybook/test` aqui, de propósito: a docs page importa daqui os
 * rótulos e as mensagens da demonstração, e arrastar o runner de teste para
 * dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import chatTranslations from '@shared/content/chat-thread/translations.json';
import type { ChatExampleMessage } from '@shared/primitives/chat-examples';
import type { ChatMessage, ChatThreadLabels } from './index';

/**
 * Os rótulos da interface vêm do CONTEÚDO COMPARTILHADO, nos três idiomas.
 *
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ChatThreadLabels` em CADA idioma, então rótulo que sumir do JSON — ou idioma
 * que ficar para trás — reprova no type-check, e não na tela. Um estado de
 * ferramenta sem palavra vira uma caixa que só a cor descreve, que é o defeito
 * que este componente existe para não ter.
 */
const CONTENT: Record<Locale, { labels: ChatThreadLabels }> = chatTranslations;

/** Os rótulos de um idioma — a forma para quem já tem o locale em mãos. */
export function chatThreadLabelsFor(target: Locale): ChatThreadLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos fora de um componente — `props` de story e `play` não são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a thread desenha.
 */
export function chatThreadLabels(): ChatThreadLabels {
  return chatThreadLabelsFor(get(locale));
}

/**
 * Do exemplo compartilhado para o que o componente aceita.
 *
 * A conversão é explícita campo a campo: o exemplo é dado, e espalhá-lo com
 * `...` deixaria um campo novo dele entrar no componente sem ninguém decidir.
 *
 * O `id` é atribuído aqui porque nesta stack ele é a CHAVE do `{#each}`: sem
 * ele a mensagem que cresce seria remontada a cada trecho.
 */
export function toMessages(examples: ChatExampleMessage[]): ChatMessage[] {
  return examples.map((m, i) => ({
    id: `m-${i}`,
    role: m.role,
    content: m.content,
    author: m.author,
    time: m.time,
    reasoning: m.reasoning,
    toolCalls: m.toolCalls,
    sources: m.sources,
  }));
}

/**
 * O nome acessível do botão de ir ao fim, com a contagem que a play espera.
 *
 * Mora aqui, e não no arquivo de story, porque num `*.stories.ts` todo export
 * nomeado vira story — um helper exportado de lá apareceria na barra lateral
 * como um item que não desenha nada.
 */
export function jumpToEndName(count: number): string {
  return chatThreadLabels().jumpToEnd.replace('{count}', String(count));
}
