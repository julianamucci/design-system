import { computed, isSignal, type Signal } from '@angular/core';
import { useTranslation } from '@/lib/i18n';
import uiTranslations from '@/i18n/ui.json';
import { chaveDeRotuloDaSecao } from '@shared/primitives/docs-page-landmarks';

const { t: tUi } = useTranslation(uiTranslations as Record<string, unknown>);

/**
 * O `h2` de uma seção, derivado do id que a própria seção já declara.
 *
 * O título e o item de menu que salta para ele são a mesma frase, e por isso
 * têm de sair da mesma chave. Enquanto a página passava o título por input, o
 * leitor clicava em "Estados" e chegava num cabeçalho escrito "Configurações" —
 * 900 dos 3375 títulos divergiam do menu em 2026-09-12, sem nada reprovar.
 *
 * Devolve um `Signal`, não uma string: o `t` do `useTranslation` lê o signal de
 * locale por dentro, então é o `computed` que faz o título acompanhar a troca
 * de idioma junto com o resto da página — exatamente como as docs pages fazem
 * com `tNav`. Uma string calculada uma vez na construção do componente ficaria
 * congelada no idioma inicial.
 *
 * Aceita id fixo (a maioria dos containers, que escrevem o id no template) ou
 * o próprio `input` de id, para os que o recebem de fora (Variantes, que também
 * atende Tamanhos e Composições).
 *
 * Id desconhecido devolve o próprio id: ele aparece na tela e cobra o mapa, o
 * que é preferível a um rótulo genérico escondendo a seção nova.
 */
export function tituloDeSecao(id: string | Signal<string>): Signal<string> {
  return computed(() => {
    const atual = isSignal(id) ? id() : id;
    const chave = chaveDeRotuloDaSecao(atual);
    return chave ? tUi(chave) : atual;
  });
}
