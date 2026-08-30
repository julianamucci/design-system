/**
 * Andaime das demonstrações do Composer — um construtor, cinco arquivos.
 *
 * Existe pelo mesmo motivo do `chat-thread.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, e não de literais: são texto de
 * interface, e texto de interface tem três idiomas. Puxá-los daqui também torna
 * cada asserção imune à troca de idioma — a `play` procura pelo mesmo texto que
 * o componente desenhou, seja ele qual for.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import composerTranslations from '@shared/content/composer/translations.json';
import type { ComposerLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como `ComposerLabels`
 * em CADA idioma, então rótulo que sumir do JSON — ou idioma que ficar para
 * trás — reprova no type-check, e não na tela.
 */
const CONTENT: Record<Locale, { labels: ComposerLabels & { attach: string } }> =
  composerTranslations;

/** Os rótulos de um idioma — a forma para quem já tem o locale em mãos. */
export function composerLabelsFor(target: Locale): ComposerLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da interface, no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria o composer no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useComposerLabels(): ComputedRef<ComposerLabels> {
  const { locale } = useTranslation(composerTranslations);
  return computed(() => composerLabelsFor(locale.value as Locale));
}

/**
 * Os rótulos fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable acima, então o rótulo que a play
 * procura é sempre o que o composer desenha. A store existe fora do `setup`
 * porque o `preview` instala o Pinia na aplicação, e instalar é o que o torna
 * ativo para quem o pede de fora.
 */
export function composerLabels(): ComposerLabels {
  return composerLabelsFor(useI18nStore().locale);
}

/** O rótulo do controle de exemplo do trilho, no idioma corrente. */
export function useAttachLabel(): ComputedRef<string> {
  const { locale } = useTranslation(composerTranslations);
  return computed(() => CONTENT[locale.value as Locale].labels.attach);
}

/** O mesmo rótulo fora de um componente, para a `play` procurar pelo que a tela mostra. */
export function attachLabel(): string {
  return CONTENT[useI18nStore().locale].labels.attach;
}

/**
 * Um texto de exemplo com tamanho previsível.
 *
 * As stories que medem o contador precisam de um comprimento que elas próprias
 * controlem — usar uma frase escrita à mão faria a asserção depender de contar
 * caracteres a olho, e de recontar a cada tradução.
 */
export function textOfLength(n: number): string {
  return 'a'.repeat(n);
}
