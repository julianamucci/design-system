import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';

export type Locale = 'pt-BR' | 'en' | 'es';
const VALID_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const STORAGE_KEY = 'ds-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';
  const urlLang = new URLSearchParams(window.location.search).get('lang') as Locale;
  if (urlLang && VALID_LOCALES.includes(urlLang)) return urlLang;
  const stored = localStorage.getItem(STORAGE_KEY) as Locale;
  if (stored && VALID_LOCALES.includes(stored)) return stored;
  return 'pt-BR';
}

export const useI18nStore = defineStore('i18n', {
  state: () => ({ locale: getInitialLocale() as Locale }),
  actions: {
    setLocale(locale: Locale) {
      localStorage.setItem(STORAGE_KEY, locale);
      this.locale = locale;
    },
  },
});

// ─── Composable ───────────────────────────────────────────────────────────────

function flattenDict(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenDict(value as Record<string, unknown>, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

export function useTranslation(translations: Record<string, unknown>) {
  const store = useI18nStore();

  const flatDict: ComputedRef<Record<string, unknown>> = computed(() => {
    const rawDict = (translations[store.locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    return flattenDict(rawDict);
  });

  const t = (key: string, defaultValue?: string): string => {
    const value = flatDict.value[key];
    if (value !== undefined && value !== null) return value as string;
    return defaultValue ?? key;
  };

  return {
    t,
    locale: computed(() => store.locale),
    flatDict,
  };
}
