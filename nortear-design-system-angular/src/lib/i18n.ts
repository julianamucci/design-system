import { computed, signal, type Signal } from '@angular/core';
import {
  isCodeVariantNode,
  resolveCodeVariant,
  type Stack,
} from '@shared/primitives/code-variants';
import { negociarLocale } from '@shared/primitives/locale-negotiation';

/** Stack deste pacote — escolhe a variante das chaves `*Code`. */
const STACK: Stack = 'angular';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

const STORAGE_KEY = 'ds-locale';

// ─── Estado global de locale ──────────────────────────────────────────────────
//
// Signal em escopo de módulo, não serviço com DI. O locale é global ao
// Storybook inteiro (toolbar + ?lang=), e cada story do Angular monta uma
// aplicação própria — um serviço `providedIn: 'root'` teria uma instância por
// story e perderia a troca de idioma na navegação.

function getInitialLocale(): Locale {
  // Escada compartilhada: ?lang= (link explicito) > localStorage (escolha
  // anterior) > idioma do navegador > pt-BR. O navegador e palpite, e por
  // isso vem depois das duas escolhas explicitas.
  return negociarLocale(undefined, undefined, STORAGE_KEY);
}

const localeSignal = signal<Locale>(getInitialLocale());

/** Signal de leitura — use em `computed`/template para reagir à troca. */
export const locale: Signal<Locale> = localeSignal.asReadonly();

export function getLocale(): Locale {
  return localeSignal();
}

export function setLocale(next: Locale): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  localeSignal.set(next);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenDict(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    // Chave `*Code` em forma de objeto carrega um snippet por stack. A chave
    // base recebe a variante deste stack; as variantes seguem acessíveis por
    // caminho explícito (`anatomy.structureCode.react`).
    if (isCodeVariantNode(key, value)) {
      const resolved = resolveCodeVariant(value, STACK);
      if (resolved !== undefined) result[path] = resolved;
      for (const [variant, snippet] of Object.entries(value)) {
        result[`${path}.${variant}`] = snippet;
      }
      continue;
    }
    if (value !== null && typeof value === 'object') {
      Object.assign(result, flattenDict(value as Record<string, unknown>, path));
    } else {
      result[path] = String(value);
    }
  }
  return result;
}

// ─── Função de tradução ───────────────────────────────────────────────────────

export type TranslationOverrides = Partial<
  Record<'pt-BR' | 'en' | 'es' | '*', Record<string, string>>
>;

/**
 * Cria um helper de tradução reativo para um conjunto de translations.
 *
 * `t(key)` lê o signal de locale por dentro — chamado num template ou
 * `computed`, re-executa sozinho na troca de idioma. Não existe `subscribe`
 * como no Vanilla: quem reage é o grafo de signals.
 *
 * Uso:
 *   const { t } = useTranslation(buttonTranslations);
 *   readonly titulo = computed(() => t('seo.title'));
 */
export function useTranslation(
  translations: Record<string, unknown>,
  overrides?: TranslationOverrides,
) {
  // O dicionário achatado é memoizado por locale: `flattenDict` percorre a
  // árvore inteira e seria refeito a cada leitura de `t()` numa docs page com
  // ~200 chaves.
  const dict = computed(() => {
    const current = localeSignal();
    const raw = (translations[current] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    const flat = flattenDict(raw);
    if (overrides) {
      if (overrides['*']) Object.assign(flat, overrides['*']);
      const lo = overrides[current];
      if (lo) Object.assign(flat, lo);
    }
    return flat;
  });

  function t(key: string, defaultValue?: string): string {
    const value = dict()[key];
    if (value !== undefined && value !== null) return value;
    return defaultValue ?? key;
  }

  return { t, locale, getLocale, dict };
}
