// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

const VALID_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const STORAGE_KEY = 'ds-locale';

type LocaleListener = (locale: Locale) => void;

// ─── Estado global de locale ──────────────────────────────────────────────────

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';

  const urlLang = new URLSearchParams(window.location.search).get('lang') as Locale | null;
  if (urlLang && VALID_LOCALES.includes(urlLang)) return urlLang;

  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && VALID_LOCALES.includes(stored)) return stored;

  return 'pt-BR';
}

let currentLocale: Locale = getInitialLocale();
const listeners = new Set<LocaleListener>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
  currentLocale = locale;
  listeners.forEach((fn) => fn(locale));
}

export function onLocaleChange(fn: LocaleListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
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

// ─── Função de tradução ───────────────────────────────────────────────────────

/**
 * Cria um helper de tradução para um conjunto de translations.
 * Retorna `t(key)` e `subscribe(fn)` para reagir a mudanças de locale.
 *
 * Uso:
 *   const { t, subscribe } = createTranslation({ ...uiTranslations, ...buttonTranslations });
 *   const cleanup = subscribe(() => render());
 */
export type TranslationOverrides = Partial<Record<'pt-BR' | 'en' | 'es' | '*', Record<string, string>>>;

export function createTranslation(
  translations: Record<string, unknown>,
  overrides?: TranslationOverrides,
) {
  function getDict(): Record<string, string> {
    const locale = getLocale();
    const rawDict = (translations[locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    const dict = flattenDict(rawDict);
    if (overrides) {
      if (overrides['*']) Object.assign(dict, overrides['*']);
      const lo = overrides[locale as 'pt-BR' | 'en' | 'es'];
      if (lo) Object.assign(dict, lo);
    }
    return dict;
  }

  function t(key: string, defaultValue?: string): string {
    const dict = getDict();
    const value = dict[key];
    if (value !== undefined && value !== null) return value;
    return defaultValue ?? key;
  }

  function subscribe(fn: () => void): () => void {
    return onLocaleChange(fn);
  }

  return { t, subscribe, getLocale };
}
