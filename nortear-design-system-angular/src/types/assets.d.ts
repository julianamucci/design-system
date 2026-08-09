// Módulos que o Vite resolve mas o TypeScript não conhece.
//
// Sem estas declarações o `tsc` erra em `import '../src/styles/globals.css'` e
// em `import logo from './brand-logo.svg'` — e o erro não fica só no editor: o
// @analogjs/vite-plugin-angular aborta a criação do programa TypeScript, para
// de compilar os @Component de `src/` e o Angular cai no fallback JIT. O JIT
// compila o decorator (host bindings funcionam) mas NÃO enxerga inputs
// declarados com `input()`, então todo binding vira NG0303 em silêncio.

declare module '*.css';

declare module '*.svg' {
  const src: string;
  export default src;
}
