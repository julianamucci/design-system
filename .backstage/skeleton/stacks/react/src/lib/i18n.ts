import { create } from 'zustand';
import { useCallback, useMemo } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

const VALID_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const STORAGE_KEY = 'ds-locale';

// ─── Leitura inicial do locale ────────────────────────────────────────────────

/**
 * Ordem de prioridade:
 * 1. Query param `?lang=` na URL (permite links compartilháveis por idioma)
 * 2. Valor salvo em localStorage (persiste entre sessões)
 * 3. Padrão: 'pt-BR'
 */
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';

  const urlLang = new URLSearchParams(window.location.search).get('lang') as Locale | null;
  if (urlLang && VALID_LOCALES.includes(urlLang)) return urlLang;

  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && VALID_LOCALES.includes(stored)) return stored;

  return 'pt-BR';
}

// ─── Store Zustand ────────────────────────────────────────────────────────────

interface I18nStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nStore>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    set({ locale });
  },
}));

// ─── Hook de tradução ─────────────────────────────────────────────────────────

/**
 * Hook para tradução baseado em chave-valor.
 * Suporta dot notation (ex: "nav.overview") com lookup O(1) via dicionário
 * pré-achatado em `useMemo`, evitando split+reduce em cada chamada.
 */
export function useTranslation(translations: Record<string, unknown>) {
  const locale = useI18nStore((state) => state.locale);
  const rawDict = (translations[locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;

  /**
   * Achata recursivamente um objeto aninhado em um mapa plano com chaves de ponto.
   * Ex: { nav: { overview: "Visão Geral" } } → { "nav.overview": "Visão Geral" }
   */
  const flatDict = useMemo(() => {
    const result: Record<string, unknown> = {};

    function flatten(obj: Record<string, unknown>, prefix: string) {
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, path);
        } else {
          result[path] = value;
        }
      }
    }

    flatten(rawDict, '');
    return result;
  }, [rawDict]);

  const t = useCallback(
    (key: string, defaultValue?: string): string => {
      const value = flatDict[key];
      // Retorna como string; callers que esperam arrays usam `as any[]` explicitamente.
      if (value !== undefined && value !== null) return value as string;
      return defaultValue ?? key;
    },
    [flatDict],
  );

  return useMemo(() => ({ t, locale }), [t, locale]);
}
