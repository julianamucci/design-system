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
 * Id desconhecido devolve o próprio id: ele aparece na tela e cobra o mapa, o
 * que é preferível a um rótulo genérico escondendo a seção nova.
 */
export function useTituloDeSecao(id: string): string {
  const { t } = useTranslation(uiTranslations);
  const chave = chaveDeRotuloDaSecao(id);
  return chave ? t(chave) : id;
}
