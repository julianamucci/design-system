/**
 * Andaime das demonstrações do estado da execução — um construtor por caso.
 *
 * Existe pelo mesmo motivo do andaime da fila de envio: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. O
 * RELÓGIO é dado de exemplo e fica igual nos três idiomas: ele já chega escrito
 * ao componente, e traduzi-lo faria as stories fotografarem linhas de larguras
 * diferentes conforme o idioma da foto.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import statusTranslations from '@shared/content/agent-status/translations.json';
import type { RunStatus } from '@shared/primitives/chat-protocol';
import type { AgentStatusLabels } from './index';

/**
 * Os rótulos do CAMPO não são reescritos aqui.
 *
 * Eles já moram no andaime da moldura, e são os mesmos para toda peça que
 * aparece ao lado dela. Uma segunda cópia divergiria sem sinal — que é
 * exatamente o defeito que andaime compartilhado existe para não ter. A linha
 * precisa deles só para ter um campo logo abaixo nas composições.
 */
export {
  composerLabels,
  composerLabelsFor,
} from '@/components/ui/composer/composer.fixtures';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `AgentStatusLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um estado
 * sem palavra deixaria a linha distinguindo a execução só pela cor do ponto.
 */
const CONTENT: Record<Locale, { labels: AgentStatusLabels }> = statusTranslations;

/** Os rótulos da linha num idioma — a forma para quem já tem o locale em mãos. */
export function agentStatusLabelsFor(target: Locale): AgentStatusLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da linha fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a linha desenha.
 */
export function agentStatusLabels(): AgentStatusLabels {
  return agentStatusLabelsFor(get(locale));
}

/**
 * O relógio de exemplo em cada estado.
 *
 * Em espera não tem relógio, e é a única razão de este mapa ser parcial: nada
 * começou, então não há o que contar. Nos outros quatro o número é o mesmo em
 * toda foto, para que a diferença entre elas seja o estado e não a largura.
 */
const ELAPSED: Partial<Record<RunStatus, string>> = {
  running: '1:04',
  stopped: '0:42',
  complete: '2:11',
  failed: '0:08',
};

/** Quanto tempo mostrar naquele estado, ou nada quando não há o que contar. */
export function elapsedOf(status: RunStatus): string | undefined {
  return ELAPSED[status];
}
