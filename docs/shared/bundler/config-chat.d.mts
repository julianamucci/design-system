/**
 * Tipos da receita do bundle do chat. Existe pela mesma razão que
 * `alias-pacotes.d.mts`: `vite.chat-docs.config.ts` é type-checado nas cinco
 * stacks, e sem declaração o import do `.mjs` vira `TS7016`.
 *
 * O retorno é descrito ESTRUTURALMENTE, e não como `import('vite').UserConfig`:
 * um `import('vite')` aqui faria o `tsc` resolver `vite` a partir de
 * `docs/shared/bundler/`, que não alcança o `node_modules` de stack nenhuma —
 * o mesmo mecanismo que o `.mjs` ao lado documenta. Quem confere o tipo de
 * verdade é o `defineConfig` no config de cada stack, que resolve `vite` de
 * onde ele está.
 */

export declare function configDoChat(dirDaStack: string): {
  resolve: { alias: Record<string, string> };
  build: {
    outDir: string;
    emptyOutDir: boolean;
    target: string;
    lib: {
      entry: string;
      formats: ['es'];
      fileName: () => string;
      cssFileName: string;
    };
  };
};
