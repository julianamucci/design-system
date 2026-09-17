/**
 * Fixtures das stories do Sheet.
 *
 * Existe uma só: o rótulo lido FORA do React. `useTranslation` é hook e vale
 * dentro do `render`, que é componente; a `play` e o `args` não são. Os dois
 * caminhos leem a MESMA store de locale, então o texto que a play exige é
 * sempre o que o painel mostra — e é isso que permite afirmar o nome ESPERADO
 * em vez de só afirmar que existe um nome.
 *
 * Mora aqui porque duas stories precisam dele (o Playground e as quatro
 * direções), e cópia de fixture entre arquivos de story é o que o portão
 * `fixture_duplicada_entre_stories` cobra: duas cópias divergem, e a que
 * divergir em silêncio faz a asserção medir outro idioma.
 */
import { useI18nStore } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

export function label(path: string): string {
  const dictionaries = sheetTranslations as unknown as Record<string, unknown>;
  const dict = (dictionaries[useI18nStore.getState().locale] ??
    dictionaries["pt-BR"]) as Record<string, unknown>;
  return path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dict) as string;
}
