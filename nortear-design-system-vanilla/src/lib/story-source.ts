// ─── Snippet do painel Code ───────────────────────────────────────────────────
//
// O renderer html imprime o `outerHTML` do elemento que a story montou. É o DOM
// de verdade, mas não é o que se escreve nesta stack: aqui não existe componente
// para importar, existe FÁBRICA, e o que se copia é a chamada
// (`createCarousel({ … })`).
//
// A correção é uma transform por componente, declarada uma única vez no `meta`
// — `parameters.docs.source.transform` cascateia para todas as stories daquele
// arquivo. Cada componente guarda a sua em `<slug>.source.ts`.
//
// A transform é função NOMEADA E EXPORTADA, nunca lambda inline. Motivo medido:
// a saída do painel Code não aparece no DOM durante a `play`, então nenhuma
// suíte de browser a alcança. Exportada, ela vira função pura — entra `ctx.args`,
// sai a string — e tem teste unitário em `<slug>.source.test.ts`.
//
// `transform` e não `code`: snippet fixo deixaria de acompanhar os controls no
// primeiro ajuste do painel.

/** Contexto que o addon-docs entrega à transform. */
export type SourceCtx<A = Record<string, unknown>> = { args?: Partial<A> };

/** Assinatura de `parameters.docs.source.transform`. */
export type SourceTransform<A = Record<string, unknown>> = (
  gerado: string,
  ctx: SourceCtx<A>,
) => string;

/** Literal em aspas simples, com escape do que quebraria o snippet. */
export function text(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

/**
 * Monta as linhas `chave: valor,` de um objeto de opções, descartando o que
 * vier `undefined`. Documentação não ensina a repetir o valor que a fábrica já
 * assume por padrão — só o que difere entra no snippet.
 *
 * A chave é citada quando não é um identificador simples, que é o caso do nome
 * acessível canônico: `'aria-label'`.
 */
export function options(pairs: Array<[string, string | undefined]>): string[] {
  return pairs
    .filter((par): par is [string, string] => par[1] !== undefined)
    .map(([key, value]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : text(key)}: ${value},`);
}

/**
 * `createX({ … })`, em uma linha enquanto couber e em várias quando não couber.
 * O limite é de leitura, não de lint: o painel Code é estreito e a quebra
 * acontece de qualquer jeito — melhor onde a gente escolhe.
 */
export function callLine(fabrica: string, lines: string[]): string {
  if (lines.length === 0) return `${fabrica}({})`;
  const umaLine = `${fabrica}({ ${lines.map((l) => l.replace(/,$/, '')).join(', ')} })`;
  if (umaLine.length <= 72 && !umaLine.includes('\n')) return umaLine;
  return `${fabrica}({\n${lines.map((l) => `  ${l}`).join('\n')}\n})`;
}

/** `import { a, b } from '@/components/ui/<slug>';` */
export function importing(slug: string, ...names: string[]): string {
  return `import { ${names.join(', ')} } from '@/components/ui/${slug}';`;
}

/** Junta os blocos do snippet com uma linha em branco entre eles. */
export function snippet(...partes: Array<string | undefined | false | null>): string {
  return partes.filter((p): p is string => typeof p === 'string' && p.length > 0).join('\n\n');
}

/** Linha final canônica: o elemento devolvido pela fábrica entra na página. */
export function appendLine(variavel: string): string {
  return `document.querySelector('#app')?.append(${variavel});`;
}
