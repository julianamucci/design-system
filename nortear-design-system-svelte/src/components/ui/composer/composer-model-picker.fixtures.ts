/**
 * Andaime das demonstrações do seletor de modelo — um construtor por caso.
 *
 * Existe pelo mesmo motivo do `composer.fixtures.ts`: num `*.stories.ts` todo
 * export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NOMES dos modelos, as descrições e o motivo de indisponibilidade são DADO de
 * exemplo e ficam iguais nos três idiomas — mesma decisão do `chat-examples.ts`:
 * o que se traduz são os rótulos da interface, não a fala. Traduzi-los faria as
 * stories fotografarem listas diferentes conforme o idioma da foto.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import pickerTranslations from '@shared/content/composer-model-picker/translations.json';
import type { ModelOption } from '@shared/primitives/chat-protocol';
import type { ComposerModelPickerLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ComposerModelPickerLabels` em CADA idioma, então rótulo que sumir do JSON —
 * ou idioma que ficar para trás — reprova no type-check, e não na tela. Um
 * gatilho sem nome acessível vira "Rápido, botão", que não informa nada.
 */
const CONTENT: Record<Locale, { labels: ComposerModelPickerLabels }> = pickerTranslations;

/** Os rótulos do seletor num idioma — a forma para quem já tem o locale em mãos. */
export function modelLabelsFor(target: Locale): ComposerModelPickerLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos do seletor fora de um componente — `props` de story e `play` não
 * são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que o seletor desenha.
 */
export function modelLabels(): ComposerModelPickerLabels {
  return modelLabelsFor(get(locale));
}

/** O modelo mais rápido, sem etiqueta e sem impedimento. */
function fast(): ModelOption {
  return {
    id: 'fast',
    label: 'Rápido',
    description: 'Responde em segundos. Serve para rascunho e pergunta curta.',
  };
}

/** O do meio, e o único que carrega etiqueta. */
function balanced(): ModelOption {
  return {
    id: 'balanced',
    label: 'Equilibrado',
    description: 'O meio-termo entre esperar e acertar.',
    badge: 'Novo',
  };
}

/** O mais lento — e o que não pode responder agora. */
function deep(): ModelOption {
  return {
    id: 'deep',
    label: 'Profundo',
    description: 'Lê a obra inteira antes de responder, e leva minutos.',
    unavailable: true,
    unavailableReason: 'Fora do seu plano.',
  };
}

/**
 * Dois modelos que podem responder, os dois com descrição e nenhum com
 * etiqueta.
 *
 * É a lista mínima em que a descrição é o único assunto — sem etiqueta e sem
 * impedimento, o que sobra na tela é o que sustenta a troca.
 */
export function availableModels(): ModelOption[] {
  return [
    fast(),
    {
      id: 'balanced',
      label: 'Equilibrado',
      description: 'O meio-termo entre esperar e acertar.',
    },
  ];
}

/** Dois modelos, um deles com a etiqueta curta ao lado do nome. */
export function badgedModels(): ModelOption[] {
  return [fast(), balanced()];
}

/**
 * Os três: o rápido, o etiquetado e o que não pode responder agora.
 *
 * É a lista que a peça existe para desenhar — os três casos de opção convivem
 * numa lista só, que é como ela chega a quem escolhe.
 */
export function everyModel(): ModelOption[] {
  return [fast(), balanced(), deep()];
}
