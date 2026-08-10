import {
  isCodeVariantNode,
  resolveCodeVariant,
  type Stack,
} from '@shared/primitives/code-variants';
import { negociarLocale } from '@shared/primitives/locale-negotiation';

/** Stack deste pacote — escolhe a variante das chaves `*Code`. */
const STACK: Stack = 'vanilla';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

const STORAGE_KEY = 'ds-locale';

type LocaleListener = (locale: Locale) => void;

// ─── Estado global de locale ──────────────────────────────────────────────────

function getInitialLocale(): Locale {
  // Escada compartilhada: ?lang= (link explicito) > localStorage (escolha
  // anterior) > idioma do navegador > pt-BR. O navegador e palpite, e por
  // isso vem depois das duas escolhas explicitas.
  return negociarLocale(undefined, undefined, STORAGE_KEY);
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
    // Chave `*Code` em forma de objeto carrega um snippet por stack. A chave
    // base recebe a variante deste stack; as variantes seguem acessíveis por
    // caminho explícito (`anatomy.structureCode.flutter`).
    if (isCodeVariantNode(key, value)) {
      const resolved = resolveCodeVariant(value, STACK);
      if (resolved !== undefined) result[path] = resolved;
      for (const [variant, snippet] of Object.entries(value)) {
        result[`${path}.${variant}`] = snippet;
      }
      continue;
    }
    // Arrays também recursam (índices viram chaves: rows.0.1) — necessário
    // para tabelas com linhas em array e listas indexadas.
    if (value !== null && typeof value === 'object') {
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
