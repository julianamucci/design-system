/**
 * code-variants.ts — Resolução de snippets de código por stack.
 *
 * Chaves de código em `translations.json` (`*Code`) aceitam duas formas:
 *
 *   "structureCode": "<Accordion>…"                    // string  → vale para todo stack
 *   "structureCode": { "react": "…", "flutter": "…" }  // objeto  → um snippet por stack
 *
 * A forma de objeto existe porque a mesma ideia se escreve diferente em cada
 * stack — JSX, template, markup `.nds-*`, Dart. Texto descritivo continua
 * neutro de API (ver `audit-translation-literals.mjs`); só o código varia.
 *
 * `web` é um grupo, não um stack: cobre os quatro stacks de navegador de uma
 * vez. Serve para snippet de CSS, que é idêntico entre eles e não existe fora
 * do navegador.
 *
 * Cada stack chama `resolveCodeVariant(node, 'react' | 'vue' | …)` a partir do
 * seu próprio `i18n.ts`.
 */

export const STACKS = ['react', 'vue', 'svelte', 'vanilla', 'flutter'] as const;
export type Stack = (typeof STACKS)[number];

/** Stacks que rodam em navegador — o que o grupo `web` cobre. */
export const WEB_STACKS: readonly Stack[] = ['react', 'vue', 'svelte', 'vanilla'];

/** Chave de agrupamento aceita além dos nomes de stack. */
export const VARIANT_GROUPS = ['web'] as const;
export type VariantGroup = (typeof VARIANT_GROUPS)[number];

export type VariantKey = Stack | VariantGroup;

const VARIANT_KEYS: readonly string[] = [...STACKS, ...VARIANT_GROUPS];

/**
 * Reconhece uma chave cujo valor é snippet de código.
 *
 * Mesma família de sufixos que `audit-translation-literals.mjs` isenta da
 * auditoria de literais: o que é código não precisa ser neutro de API.
 */
export function isCodeKey(key: string): boolean {
  return /(?:^|[a-z])Code$/.test(key) || /^code[A-Z]/.test(key);
}

/**
 * Um nó de variantes é um objeto `{ <stack|web>: "snippet" }`.
 *
 * O teste é deliberadamente estrito — exige que a chave-pai seja de código E
 * que todas as sub-chaves sejam nomes de stack conhecidos. Sem as duas
 * condições, um objeto de conteúdo comum que por acaso tivesse uma chave
 * `web` seria achatado errado.
 */
export function isCodeVariantNode(key: string, value: unknown): value is Record<VariantKey, string> {
  if (!isCodeKey(key)) return false;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return false;
  return entries.every(([k, v]) => VARIANT_KEYS.includes(k) && typeof v === 'string');
}

/**
 * Escolhe o snippet do stack pedido.
 *
 * Ordem: variante do próprio stack → grupo `web` (só para stack de navegador)
 * → `react` → primeira variante definida.
 *
 * O fallback existe para que a ausência de variante nunca renderize um bloco
 * de código vazio na docs page. Ele esconde a lacuna do leitor, não da
 * ferramenta: `audit-translation-literals.mjs --code-coverage` lista toda
 * chave que caiu em fallback.
 */
export function resolveCodeVariant(
  node: Record<string, string>,
  stack: Stack,
): string | undefined {
  const own = node[stack];
  if (own !== undefined) return own;

  if (WEB_STACKS.includes(stack) && node.web !== undefined) return node.web;
  if (node.react !== undefined) return node.react;

  const first = Object.values(node)[0];
  return first;
}

/**
 * Variante que um stack teria de fato, sem fallback — `undefined` marca lacuna.
 * Usado pelo auditor de cobertura.
 */
export function ownCodeVariant(
  node: Record<string, string>,
  stack: Stack,
): string | undefined {
  if (node[stack] !== undefined) return node[stack];
  if (WEB_STACKS.includes(stack) && node.web !== undefined) return node.web;
  return undefined;
}
