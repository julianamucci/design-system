/**
 * Andaime das demonstrações do estado da ligação.
 *
 * Existe pelo mesmo motivo do andaime do estado da execução: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. A
 * CONTAGEM é dado de exemplo e fica igual nos três idiomas: ela já chega escrita
 * ao componente, e traduzi-la aqui faria as cinco stories fotografarem linhas de
 * larguras diferentes conforme o idioma da foto.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import connectionTranslations from '@shared/content/connection-state/translations.json';
import type { ConnectionStateLabels } from './ConnectionState.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ConnectionStateLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela.
 *
 * É também o que faz o mapa de estados acompanhar o vocabulário compartilhado
 * sem que ninguém precise lembrar: `state` é `Record<ConnectionState, string>`,
 * e um estado novo em `CONNECTION_STATES` reprova a compilação aqui em vez de
 * desenhar uma linha em branco que ninguém repara.
 */
const CONTENT: Record<Locale, { labels: ConnectionStateLabels }> = connectionTranslations;

/** Os rótulos da linha num idioma — a forma para quem já tem o locale em mãos. */
export function connectionStateLabelsFor(target: Locale): ConnectionStateLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da linha fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a linha desenha.
 */
export function connectionStateLabels(): ConnectionStateLabels {
  return connectionStateLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da linha no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a linha no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useConnectionStateLabels(): ComputedRef<ConnectionStateLabels> {
  const { locale } = useTranslation(connectionTranslations);
  return computed(() => connectionStateLabelsFor(locale.value as Locale));
}

/**
 * A contagem de exemplo, a mesma em toda foto.
 *
 * Uma só, e não um mapa por estado: só `reconnecting` tem tentativa marcada, e
 * um mapa com uma entrada seria uma tabela fingindo escolha. As stories que
 * mostram os outros dois passam esta mesma string de propósito — é assim que
 * elas provam que a peça não a desenha quando nada está agendado.
 */
export const CONNECTION_COUNTDOWN = 'em 5 s';
