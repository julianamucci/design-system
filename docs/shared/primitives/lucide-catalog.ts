/**
 * Catálogo do Lucide para a galeria de Foundations/Icons.
 *
 * ─── Por que um JSON, e não o pacote ────────────────────────────────────────
 *
 * A galeria renderiza o catálogo INTEIRO (2003 ícones), então nada aqui é
 * tree-shakeable: qualquer forma de importar o pacote traz tudo. O que muda é
 * QUANTO vem junto. Medido em 2026-08-11 com `vite build` (rolldown, sem
 * minificação, gzip calculado sobre o bundle), um micro-bundle por estratégia:
 *
 *   | stack   | estratégia                        |     bytes |    gzip |
 *   |---------|-----------------------------------|-----------|---------|
 *   | react   | `import * as` de lucide-react     | 1 263 272 | 197 649 |
 *   | react   | este JSON                         |   594 872 | 107 141 |
 *   | vue     | `import * as` de lucide-vue-next  | 1 424 393 | 205 465 |
 *   | vue     | este JSON                         |   609 097 | 112 488 |
 *   | vanilla | `import { icons } from 'lucide'`  |   964 921 | 112 686 |
 *   | vanilla | este JSON                         |   521 038 |  89 680 |
 *   | angular | `import { icons } from 'lucide'`  |   971 590 | 113 908 |
 *   | angular | este JSON                         |   521 038 |  89 680 |
 *   | svelte  | `import { icons } from 'lucide'`  |   963 163 | 112 661 |
 *   | svelte  | este JSON                         |   521 035 |  89 679 |
 *
 * O JSON ganha nas cinco. A diferença é o formato do que sobra no bundle: o
 * pacote embrulha cada ícone num componente (ou numa fábrica), e o JSON guarda
 * só a geometria — que é tudo de que uma galeria precisa.
 *
 * O TEMPO de build, medido a quente, empata (~250 ms no vue, ~580 ms no react
 * nos dois lados). O docblock antigo do Svelte atribuía ao JSON um ganho de
 * tempo — isso valia no bundler anterior e não vale mais; o ganho que sobrevive
 * é de bytes. Contagem de módulos também empata (~1770 nos dois lados): um
 * `import { Check } from 'lucide-react'` analisa o barril inteiro igual ao
 * `import * as`. O que o wildcard quebra não é a análise, é a REMOÇÃO —
 * `Object.keys(Lucide)` obriga o bundler a manter os 2003 componentes.
 *
 * ─── Regenerar ao atualizar o lucide ────────────────────────────────────────
 *
 * De dentro de uma stack que tenha o pacote `lucide` instalado:
 *
 *   node --input-type=module -e "import {icons} from 'lucide'; \
 *     import {writeFileSync} from 'node:fs'; \
 *     const o={}; for (const n of Object.keys(icons).sort()) o[n]=icons[n]; \
 *     writeFileSync('../docs/shared/content/icons/lucide-icons.json', JSON.stringify(o))"
 */

import catalogoBruto from '../content/icons/lucide-icons.json';

/** Um nó do desenho: `[tag, atributos]` — o mesmo formato do `IconNode`. */
export type IconNo = [string, Record<string, string>];

/** Nome do ícone em PascalCase → lista de nós que compõem o desenho. */
export const CATALOGO_LUCIDE = catalogoBruto as unknown as Record<string, IconNo[]>;

/** Nomes em ordem alfabética — a ordem em que o JSON foi gerado. */
export const ICON_NAMES: string[] = Object.keys(CATALOGO_LUCIDE);

/**
 * Atributos do `<svg>` raiz de todo ícone lucide. Sem `width`/`height`: o
 * tamanho vem de classe (`nds-icon`, `nds-icon-lg`), nunca de atributo.
 */
export const SVG_ATTRS: Record<string, string> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

function serializar(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

/**
 * O `<svg>` inteiro como string, para quem monta o DOM à mão.
 *
 * SEMPRE a raiz junto, nunca só o interior. Dois motivos, os dois medidos:
 * `className` é o que dá tamanho ao ícone (um `<svg>` com `viewBox` e sem largura
 * cai no tamanho intrínseco de 300×150 e estoura o tile); e o DOMPurify valida
 * namespace — `<path>` sem um `<svg>` por pai é descartado em silêncio, que era
 * o motivo de uma das stacks desenhar 2003 ícones vazios.
 *
 * A geometria é constante do pacote, resolvida em tempo de build: não há
 * entrada externa neste caminho, que é o caso que a guideline 09 chama de "SVG
 * inline hardcoded".
 */
export function iconMountSvg(nos: IconNo[], className: string): string {
  const interior = nos.map(([tag, attrs]) => `<${tag} ${serializar(attrs)}/>`).join('');
  return `<svg ${serializar(SVG_ATTRS)} class="${className}" aria-hidden="true">${interior}</svg>`;
}
