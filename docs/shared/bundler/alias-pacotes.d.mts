/**
 * Tipos do helper de alias. Existe porque `vite.config.ts` é type-checado nas
 * cinco stacks — sem esta declaração o import do `.mjs` vira `TS7016`.
 */

/** Pacotes npm importados pelo conteúdo compartilhado. */
export declare const PACOTES_DO_COMPARTILHADO: readonly string[];

/**
 * Entradas de `resolve.alias` para uma stack, apontando cada pacote para o
 * arquivo de entrada dentro do `node_modules` DELA.
 *
 * @param dirDaStack diretório raiz da stack (onde vive o package.json)
 */
export declare function aliasDoCompartilhado(dirDaStack: string): Record<string, string>;
