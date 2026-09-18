import uiTranslations from '@/i18n/ui.json';
import { createTranslation } from '@/lib/i18n';
import { sectionLabelKey } from '@shared/primitives/docs-page-landmarks';

const { t } = createTranslation(uiTranslations as Record<string, unknown>);

/**
 * O `h2` de uma seção, derivado do id que a própria seção já declara.
 *
 * O título e o item de menu que salta para ele são a mesma frase, e por isso
 * têm de sair da mesma chave. Enquanto a página passava o título por opção, o
 * leitor clicava em "Estados" e chegava num cabeçalho escrito "Configurações" —
 * 900 dos 3375 títulos divergiam do menu em 2026-09-12, sem nada reprovar.
 *
 * Aqui é função pura, e não gancho: nesta stack o container é uma fábrica que
 * devolve elemento pronto, então o rótulo é resolvido no momento da construção.
 * Isso basta porque a docs page reconstrói cada seção na troca de idioma
 * (`renderAllSections()` no `subscribe`/`onLocaleChange`) — o título vem junto,
 * pelo mesmo caminho do resto do conteúdo.
 *
 * Id desconhecido devolve o próprio id: ele aparece na tela e cobra o mapa, o
 * que é preferível a um rótulo genérico escondendo a seção nova.
 */
export function sectionTitle(id: string): string {
  const key = sectionLabelKey(id);
  return key ? t(key) : id;
}
