/**
 * Andaime das demonstrações do seletor do gatilho — um construtor, cinco
 * arquivos.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES das pessoas e dos comandos são dado de exemplo e ficam iguais nos três
 * idiomas: um nome próprio não se traduz, e traduzir o rótulo de um comando
 * faria as cinco stories fotografarem listas diferentes conforme o idioma em
 * que a foto foi tirada.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import { COMMAND_TRIGGER, MENTION_TRIGGER } from '@shared/primitives/composer-trigger';
import triggerTranslations from '@shared/content/composer-trigger-popover/translations.json';
import type { TriggerOption, TriggerPopoverLabels, TriggerSource } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `TriggerPopoverLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela.
 */
const CONTENT: Record<Locale, { labels: TriggerPopoverLabels & { team: string } }> =
  triggerTranslations;

/** Os rótulos do painel num idioma — a forma para quem já tem o locale em mãos. */
export function triggerLabelsFor(target: Locale): TriggerPopoverLabels {
  const { empty, list } = CONTENT[target].labels;
  return { empty, list };
}

/**
 * Os rótulos do painel fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que o painel desenha.
 */
export function triggerLabels(): TriggerPopoverLabels {
  return triggerLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos do painel no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria o painel no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useTriggerLabels(): ComputedRef<TriggerPopoverLabels> {
  const { locale } = useTranslation(triggerTranslations);
  return computed(() => triggerLabelsFor(locale.value as Locale));
}

/**
 * As pessoas do exemplo.
 *
 * `Ana` e `Joana` existem para provar a ordenação: quem digita `an` quer Ana, e
 * Joana casa por conter. `Ângela` existe para provar o acento — quem digita
 * `an` sem acento tem de achá-la.
 */
export function peopleFor(target: Locale): TriggerOption[] {
  const team = CONTENT[target].labels.team;
  return [
    { id: 'joana', label: 'Joana Lima', hint: team },
    { id: 'ana', label: 'Ana Souza', hint: team },
    { id: 'angela', label: 'Ângela Reis', hint: team },
    { id: 'bruno', label: 'Bruno Dias', hint: team },
  ];
}

/**
 * Os comandos do exemplo.
 *
 * O primeiro tem `value` diferente do `label`, que é o caso que o campo `value`
 * existe para cobrir: mostra "Resumir a conversa" e escreve `/resumir`.
 */
export function commands(): TriggerOption[] {
  return [
    { id: 'resumir', label: 'Resumir a conversa', value: '/resumir', hint: '/resumir' },
    { id: 'traduzir', label: 'Traduzir', value: '/traduzir', hint: '/traduzir' },
  ];
}

/** Menção em começo de palavra. */
export function mentionSourceFor(target: Locale): TriggerSource {
  return { spec: MENTION_TRIGGER, options: peopleFor(target) };
}

/** Comando só no começo do campo. As opções não dependem do idioma. */
export function commandSource(): TriggerSource {
  return { spec: COMMAND_TRIGGER, options: commands() };
}

/** A menção no idioma corrente, para quem monta a árvore num `setup`. */
export function useMentionSource(): ComputedRef<TriggerSource> {
  const { locale } = useTranslation(triggerTranslations);
  return computed(() => mentionSourceFor(locale.value as Locale));
}

/** O comando no idioma corrente, pela mesma porta que a menção. */
export function useCommandSource(): ComputedRef<TriggerSource> {
  return computed(() => commandSource());
}
