/**
 * De onde cada arquivo do `registry/v1/*.json` vem.
 *
 * Este módulo existe para haver UM mapa, e não dois. Os manifestos do registry
 * inlinam o conteúdo dos fontes — `tokens.css`, os temas, `utils.ts` e o par
 * `.ts`/`.css` de cada componente empacotado — mas guardam só o `name` do
 * arquivo, sem o caminho de origem. Um portão que quisesse conferir se o
 * manifesto está em dia precisaria reconstruir esse caminho, e mapa reconstruído
 * à mão é a lista que apodrece em silêncio: quando alguém mover um fonte, o
 * gerador acompanha e o portão passa a comparar contra um arquivo que não é mais
 * a origem — verde medindo a coisa errada.
 *
 * Com o mapa aqui, `build-registry.mjs` GERA e `audit.mjs` CONFERE lendo a mesma
 * declaração. Mover um fonte é uma edição só, e as duas pontas acompanham.
 *
 * Os caminhos são relativos à raiz do repositório, para o módulo não depender de
 * quem o importa.
 */

/** Componentes empacotados: cada um vira `registry/v1/<name>.json`. */
export const COMPONENTS = [
  { name: 'button', ts: 'nortear-design-system-vanilla/src/components/ui/button.ts', css: 'docs/shared/styles/nds/button.css' },
  { name: 'alert', ts: 'nortear-design-system-vanilla/src/components/ui/alert.ts', css: 'docs/shared/styles/nds/alert.css' },
];

/** Camada base: vira `registry/v1/init.json`. */
export const INIT_FILES = [
  // `sanitize-html.ts` foi removido do projeto (sanitização via DOMPurify direto
  // no call site — ver guideline 09); o init distribui apenas `utils.ts`.
  { type: 'lib', name: 'utils.ts', src: 'nortear-design-system-vanilla/src/lib/utils.ts' },
  { type: 'tokens', name: 'tokens.css', src: 'docs/shared/tokens/tokens.css' },
  { type: 'theme', name: 'index.css', src: 'docs/shared/themes/index.css' },
  { type: 'theme', name: 'default.css', src: 'docs/shared/themes/default.css' },
  { type: 'theme', name: 'warm.css', src: 'docs/shared/themes/warm.css' },
  { type: 'theme', name: 'cold.css', src: 'docs/shared/themes/cold.css' },
  { type: 'theme', name: 'densities.css', src: 'docs/shared/themes/densities.css' },
  { type: 'theme', name: 'fonts.css', src: 'docs/shared/themes/fonts.css' },
];

/**
 * Todo par (manifesto, arquivo) → origem, na forma que o portão consome.
 *
 * O `name` é a chave dentro do manifesto, e é por ele que a conferência casa as
 * duas pontas — o mesmo campo que o gerador escreve.
 */
export function fontesDoRegistry() {
  const pares = INIT_FILES.map((f) => ({ manifesto: 'init', name: f.name, src: f.src }));
  for (const c of COMPONENTS) {
    pares.push({ manifesto: c.name, name: `${c.name}.ts`, src: c.ts });
    if (c.css) pares.push({ manifesto: c.name, name: `${c.name}.css`, src: c.css });
  }
  return pares;
}
