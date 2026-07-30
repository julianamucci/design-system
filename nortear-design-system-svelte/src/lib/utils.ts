import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/*
 * ─── Helpers de tipo dos wrappers de UI ──────────────────────────────────────
 * 136 componentes em src/components/ui/ importam estes tipos de
 * `@/lib/utils.js` — é a convenção do stack para declarar props de wrapper sobre
 * o bits-ui — mas eles nunca chegaram a ser definidos aqui. Eram 109 erros de
 * svelte-check ("has no exported member") e, com isso, props sem tipagem real.
 */

/**
 * Adiciona `ref` bindável às props do elemento. Passe o elemento concreto no
 * segundo parâmetro quando não for `HTMLElement` genérico.
 */
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

/**
 * Remove o snippet `child` das props da lib. Wrapper que renderiza markup
 * próprio (com a classe `.nds-*`) não pode aceitar `child`: o consumidor
 * substituiria justamente o elemento que carrega o estilo do design system.
 */
export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;

/** Remove o snippet `children` das props da lib. */
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;

/** Remove `child` e `children` — para wrappers que compõem os dois por conta própria. */
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
