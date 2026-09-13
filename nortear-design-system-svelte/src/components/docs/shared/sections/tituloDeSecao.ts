import type { Readable } from 'svelte/store';
import uiTranslations from '@/i18n/ui.json';
import { useTranslation } from '@/lib/i18n';
import { chaveDeRotuloDaSecao } from '@shared/primitives/docs-page-landmarks';

/**
 * O `h2` de uma seção, derivado do id que a própria seção já declara.
 *
 * O título e o item de menu que salta para ele são a mesma frase, e por isso
 * têm de sair da mesma chave. Enquanto a página passava o título por prop, o
 * leitor clicava em "Estados" e chegava num cabeçalho escrito outra coisa —
 * 900 dos 3375 títulos divergiam do menu em 2026-09-12, sem nada reprovar.
 *
 * Id desconhecido devolve o próprio id: ele aparece na tela e cobra o mapa, o
 * que é preferível a um rótulo genérico escondendo a seção nova.
 *
 * Contraparte do `useTituloDeSecao.ts` do React. Aqui são DOIS símbolos, e o
 * motivo é o `id` do `DocsVariants` ser prop: um store criado uma vez no corpo
 * do componente ficaria preso no primeiro id. Assinando o dicionário e
 * resolvendo dentro de um `$derived`, o título acompanha idioma E id:
 *
 *   const title = $derived(tituloDeSecao('acessibilidade', $rotulosDeSecao));
 */

const { tStore } = useTranslation(uiTranslations);

/** Dicionário de rótulos do menu lateral, reativo ao idioma. */
export const rotulosDeSecao: Readable<(chave: string, padrao?: string) => string> = tStore;

/** Resolve o texto do `h2` a partir do id da seção. */
export function tituloDeSecao(id: string, t: (chave: string, padrao?: string) => string): string {
  const chave = chaveDeRotuloDaSecao(id);
  return chave ? t(chave) : id;
}
