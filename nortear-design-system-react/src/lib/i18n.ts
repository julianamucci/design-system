import { create } from 'zustand';
import { useCallback, useMemo } from 'react';
import {
  isCodeVariantNode,
  resolveCodeVariant,
  type Stack,
} from '@shared/primitives/code-variants';

/** Stack deste pacote — escolhe a variante das chaves `*Code`. */
const STACK: Stack = 'react';

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
 * Overrides opcionais por chave dot-notation — aplicados sobre o dicionário
 * achatado. Use para sobrescrever textos específicos da stack atual sem
 * mexer no translations.json compartilhado.
 *
 * Estrutura: `{ "<locale>": { "<dot.key>": "texto novo" } }`.
 * Locale `*` aplica a todos.
 *
 * Ex:
 *   useTranslation(componentTranslations, {
 *     'pt-BR': { 'usage.guidelines.item1': 'Texto React-specific...' },
 *     en:      { 'usage.guidelines.item1': 'React-specific text...' },
 *   })
 */
export type TranslationOverrides = Partial<Record<Locale | '*', Record<string, string>>>;

/**
 * Hook para tradução baseado em chave-valor.
 * Suporta dot notation (ex: "nav.overview") com lookup O(1) via dicionário
 * pré-achatado em `useMemo`, evitando split+reduce em cada chamada.
 *
 * Aceita `overrides` opcional para customizar chaves específicas por stack
 * sem editar o JSON compartilhado.
 */
export function useTranslation(
  translations: Record<string, unknown>,
  overrides?: TranslationOverrides,
) {
  const locale = useI18nStore((state) => state.locale);

  /**
   * Achata recursivamente um objeto aninhado em um mapa plano com chaves de ponto.
   * Ex: { nav: { overview: "Visão Geral" } } → { "nav.overview": "Visão Geral" }
   */
  const flatDict = useMemo(() => {
    const rawDict = (translations[locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    function flatten(obj: Record<string, unknown>, prefix: string) {
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        // Chave `*Code` em forma de objeto carrega um snippet por stack. A chave
        // base recebe a variante deste stack; as variantes seguem acessíveis
        // por caminho explícito (`anatomy.structureCode.flutter`).
        if (isCodeVariantNode(key, value)) {
          const resolved = resolveCodeVariant(value, STACK);
          if (resolved !== undefined) result[path] = resolved;
          for (const [variant, snippet] of Object.entries(value)) {
            result[`${path}.${variant}`] = snippet;
          }
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, path);
        } else {
          result[path] = value;
        }
      }
    }

    flatten(rawDict, '');

    // Aplica overrides após o flatten — locale específico sobrepõe `*`.
    if (overrides) {
      const wildcard = overrides['*'];
      if (wildcard) Object.assign(result, wildcard);
      const localeOverrides = overrides[locale];
      if (localeOverrides) Object.assign(result, localeOverrides);
    }

    return result;
  }, [translations, overrides, locale]);

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
