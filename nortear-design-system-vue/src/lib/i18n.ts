import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';
import {
  isCodeVariantNode,
  resolveCodeVariant,
  type Stack,
} from '@shared/primitives/code-variants';
import { negociarLocale } from '@shared/primitives/locale-negotiation';

/** Stack deste pacote — escolhe a variante das chaves `*Code`. */
const STACK: Stack = 'vue';

export type Locale = 'pt-BR' | 'en' | 'es';
const STORAGE_KEY = 'ds-locale';

function getInitialLocale(): Locale {
  // Escada compartilhada: ?lang= (link explicito) > localStorage (escolha
  // anterior) > idioma do navegador > pt-BR. O navegador e palpite, e por
  // isso vem depois das duas escolhas explicitas.
  return negociarLocale(undefined, undefined, STORAGE_KEY);
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
      result[path] = value;
    }
  }
  return result;
}

export type TranslationOverrides = Partial<Record<'pt-BR' | 'en' | 'es' | '*', Record<string, string>>>;

export function useTranslation(
  translations: Record<string, unknown>,
  overrides?: TranslationOverrides,
) {
  const store = useI18nStore();

  const flatDict: ComputedRef<Record<string, unknown>> = computed(() => {
    const rawDict = (translations[store.locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    const dict = flattenDict(rawDict);
    if (overrides) {
      if (overrides['*']) Object.assign(dict, overrides['*']);
      if (overrides[store.locale as 'pt-BR' | 'en' | 'es']) {
        Object.assign(dict, overrides[store.locale as 'pt-BR' | 'en' | 'es']);
      }
    }
    return dict;
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
