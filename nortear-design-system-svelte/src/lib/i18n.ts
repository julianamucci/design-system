import { writable, derived, get } from 'svelte/store';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

const VALID_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const STORAGE_KEY = 'ds-locale';

// ─── Leitura inicial do locale ────────────────────────────────────────────────

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';

  const urlLang = new URLSearchParams(window.location.search).get('lang') as Locale | null;
  if (urlLang && VALID_LOCALES.includes(urlLang)) return urlLang;

  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && VALID_LOCALES.includes(stored)) return stored;

  return 'pt-BR';
}

// ─── Store de locale ──────────────────────────────────────────────────────────

export const locale = writable<Locale>(getInitialLocale());

export function setLocale(newLocale: Locale) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, newLocale);
  }
  locale.set(newLocale);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenDict(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenDict(value as Record<string, unknown>, path));
    } else {
      result[path] = String(value);
    }
  }
  return result;
}

// ─── Composable de tradução ───────────────────────────────────────────────────

/**
 * Composable para tradução baseado em chave-valor.
 * Retorna uma função `t()` reativa ao store de locale e o próprio store.
 *
 * Uso em componente Svelte:
 *   const { t, locale: localeStore } = useTranslation({ ...uiTranslations, ...buttonTranslations });
 *   $: title = t('title');
 */
export type TranslationOverrides = Partial<Record<'pt-BR' | 'en' | 'es' | '*', Record<string, string>>>;

export function useTranslation(
  translations: Record<string, unknown>,
  overrides?: TranslationOverrides,
) {
  const flatDict = derived(locale, ($locale) => {
    const rawDict = (translations[$locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    const dict = flattenDict(rawDict);
    if (overrides) {
      if (overrides['*']) Object.assign(dict, overrides['*']);
      const lo = overrides[$locale as 'pt-BR' | 'en' | 'es'];
      if (lo) Object.assign(dict, lo);
    }
    return dict;
  });

  function t(key: string, defaultValue?: string): string {
    const dict = get(flatDict);
    const value = dict[key];
    if (value !== undefined && value !== null) return value;
    return defaultValue ?? key;
  }

  // Store derivado que expõe t() de forma reativa (útil para uso em templates)
  const tStore = derived(flatDict, ($dict) => (key: string, defaultValue?: string): string => {
    const value = $dict[key];
    if (value !== undefined && value !== null) return value;
    return defaultValue ?? key;
  });

  return { t, tStore, locale, flatDict };
}
