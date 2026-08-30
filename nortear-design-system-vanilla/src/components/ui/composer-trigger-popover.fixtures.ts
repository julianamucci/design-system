/**
 * Andaime das demonstrações do seletor do gatilho — um construtor, cinco
 * arquivos.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES das pessoas e dos comandos são dado de exemplo e ficam iguais nos três
 * idiomas: um nome próprio não se traduz, e traduzir o rótulo de um comando
 * faria as cinco stories fotografarem listas diferentes conforme o idioma em
 * que a foto foi tirada.
 */

import { createTranslation } from '@/lib/i18n';
import composerTranslations from '@shared/content/composer/translations.json';
import triggerTranslations from '@shared/content/composer-trigger-popover/translations.json';
import { COMMAND_TRIGGER, MENTION_TRIGGER } from '@shared/primitives/composer-trigger';
import type { ComposerLabels } from './composer';
import type {
  TriggerOption,
  TriggerPopoverLabels,
  TriggerSource,
} from './composer-trigger-popover';

const { t } = createTranslation(triggerTranslations as Record<string, unknown>);
const { t: tComposer } = createTranslation(composerTranslations as Record<string, unknown>);

/** Os rótulos do campo, para o seletor ter onde morar. */
export function composerLabels(): ComposerLabels {
  return {
    input: tComposer('labels.input'),
    placeholder: tComposer('labels.placeholder'),
    submit: tComposer('labels.submit'),
    stop: tComposer('labels.stop'),
    hint: tComposer('labels.hint'),
    limit: tComposer('labels.limit'),
  };
}

/** Os rótulos do painel. */
export function triggerLabels(): TriggerPopoverLabels {
  return { empty: t('labels.empty'), list: t('labels.list') };
}

/**
 * As pessoas do exemplo.
 *
 * `Ana` e `Joana` existem para provar a ordenação: quem digita `an` quer Ana, e
 * Joana casa por conter. `Ângela` existe para provar o acento — quem digita
 * `an` sem acento tem de achá-la.
 */
export function people(): TriggerOption[] {
  const team = t('labels.team');
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
 * O primeiro tem `value` diferente do `label`, que é o caso que o campo
 * `value` existe para cobrir: mostra "Resumir a conversa" e escreve
 * `/resumir`.
 */
export function commands(): TriggerOption[] {
  return [
    { id: 'resumir', label: 'Resumir a conversa', value: '/resumir', hint: '/resumir' },
    { id: 'traduzir', label: 'Traduzir', value: '/traduzir', hint: '/traduzir' },
  ];
}

/** Menção em começo de palavra. */
export function mentionSource(): TriggerSource {
  return { spec: MENTION_TRIGGER, options: people() };
}

/** Comando só no começo do campo. */
export function commandSource(): TriggerSource {
  return { spec: COMMAND_TRIGGER, options: commands() };
}
