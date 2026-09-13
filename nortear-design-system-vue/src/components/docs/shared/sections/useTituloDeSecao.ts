import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';
import uiTranslations from '@/i18n/ui.json';
import { useTranslation } from '@/lib/i18n';
import { chaveDeRotuloDaSecao } from '@shared/primitives/docs-page-landmarks';

/**
 * O `h2` de uma seção, derivado do id que a própria seção já declara.
 *
 * O título e o item de menu que salta para ele são a mesma frase, e por isso
 * têm de sair da mesma chave. Enquanto a página passava o título por prop, o
 * leitor clicava em "Estados" e chegava num cabeçalho escrito "Configurações" —
 * 900 dos 3375 títulos divergiam do menu em 2026-09-12, sem nada reprovar.
 *
 * Devolve `ComputedRef` e não `string`: o `t` desta stack lê o dicionário do
 * store de locale, então um valor calculado uma vez no `setup` congelaria o
 * título no idioma de montagem. O `<script setup>` desembrulha o ref sozinho no
 * template, então o call site continua sendo `{{ title }}`.
 *
 * Id desconhecido devolve o próprio id: ele aparece na tela e cobra o mapa, o
 * que é preferível a um rótulo genérico escondendo a seção nova.
 */
export function useTituloDeSecao(id: MaybeRefOrGetter<string>): ComputedRef<string> {
  const { t } = useTranslation(uiTranslations);
  return computed(() => {
    const idAtual = toValue(id);
    const chave = chaveDeRotuloDaSecao(idAtual);
    return chave ? t(chave) : idAtual;
  });
}
