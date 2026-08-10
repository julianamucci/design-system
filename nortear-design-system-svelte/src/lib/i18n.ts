import { writable, derived, get } from 'svelte/store';
import {
  isCodeVariantNode,
  resolveCodeVariant,
  type Stack,
} from '@shared/primitives/code-variants';
import { negociarLocale } from '@shared/primitives/locale-negotiation';

/** Stack deste pacote — escolhe a variante das chaves `*Code`. */
const STACK: Stack = 'svelte';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

const STORAGE_KEY = 'ds-locale';

// ─── Leitura inicial do locale ────────────────────────────────────────────────

function getInitialLocale(): Locale {
  // Escada compartilhada: ?lang= (link explicito) > localStorage (escolha
  // anterior) > idioma do navegador > pt-BR. O navegador e palpite, e por
  // isso vem depois das duas escolhas explicitas.
  return negociarLocale(undefined, undefined, STORAGE_KEY);
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
    // Chave `*Code` em forma de objeto carrega um snippet por stack. A chave
    // base recebe a variante deste stack; as variantes seguem acessíveis por
    // caminho explícito (`anatomy.structureCode.flutter`).
    if (isCodeVariantNode(key, value)) {
      const resolved = resolveCodeVariant(value, STACK);
      if (resolved !== undefined) result[path] = resolved;
      for (const [variant, snippet] of Object.entries(value)) {
        result[`${path}.${variant}`] = snippet;
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
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
