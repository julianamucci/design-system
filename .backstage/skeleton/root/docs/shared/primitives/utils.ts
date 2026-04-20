/**
 * utils.ts — Utilitários puros compartilhados entre todos os stacks.
 * Sem imports de framework e sem acesso ao DOM.
 * Importar via: import { ... } from '@shared/primitives/utils'
 */

// ─── Strings ──────────────────────────────────────────────────────────────────

/** Converte uma string para kebab-case. */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Converte kebab-case para Title Case. */
export function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Gera um slug URL-safe a partir de uma string arbitrária. */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Trunca uma string com reticências. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

// ─── Classes CSS ──────────────────────────────────────────────────────────────

/**
 * Combina classes CSS, ignorando falsy values.
 * Equivalente ao `cn()` do shadcn (sem tailwind-merge).
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Objetos ──────────────────────────────────────────────────────────────────

/**
 * Lê um valor de um objeto aninhado usando dot notation.
 * Ex: getNestedValue({ a: { b: 'c' } }, 'a.b') → 'c'
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Define um valor em um objeto aninhado usando dot notation (mutação in-place).
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  const last = keys.at(-1)!;
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[last] = value;
}

/** Achata um objeto aninhado para dot notation. */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, path));
    } else {
      result[path] = String(value ?? '');
    }
  }
  return result;
}

// ─── Arrays ───────────────────────────────────────────────────────────────────

/** Agrupa um array de objetos por uma chave. */
export function groupBy<T>(
  arr: T[],
  key: keyof T
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

// ─── Números ──────────────────────────────────────────────────────────────────

/** Limita um número entre min e max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Datas ────────────────────────────────────────────────────────────────────

/** Formata uma data para exibição localizada. */
export function formatDate(date: Date | string, locale: string = 'pt-BR'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

// ─── URLs / Parâmetros ────────────────────────────────────────────────────────

/** Lê um parâmetro da query string (browser only). */
export function getQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

// ─── Acessibilidade ───────────────────────────────────────────────────────────

/** Gera um id único para associar label ↔ input via aria-labelledby. */
let _idCounter = 0;
export function generateId(prefix = 'ds'): string {
  return `${prefix}-${++_idCounter}`;
}
