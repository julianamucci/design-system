import { useI18nStore } from "@/lib/i18n";
import drawerTranslations from "@shared/content/drawer/translations.json";

// Helper compartilhado pelas quatro stories de Drawer.
//
// Arquivo à parte porque num `*.stories.tsx` TODO export nomeado vira uma
// story: um helper exportado apareceria na sidebar como se fosse um exemplo.

/**
 * Rótulo fora do React.
 *
 * `useTranslation` é hook e vale dentro do `render`, que é componente; a `play`
 * não é. Os dois caminhos leem a MESMA store de locale, então o texto que a
 * play procura é sempre o que o painel mostra — uma play presa a "Editar
 * perfil" reprovaria em inglês e espanhol sem nada de errado no componente.
 */
export function label(path: string): string {
  const dicionarios = drawerTranslations as unknown as Record<string, unknown>;
  const dict = (dicionarios[useI18nStore.getState().locale] ??
    dicionarios["pt-BR"]) as Record<string, unknown>;
  return path
    .split(".")
    .reduce<unknown>((no, key) => (no as Record<string, unknown>)?.[key], dict) as string;
}
