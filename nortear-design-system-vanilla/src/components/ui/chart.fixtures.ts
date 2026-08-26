// Utilitários de medição do Chart, compartilhados pelos arquivos de story.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: um
// auxiliar exportado apareceria na barra lateral como um exemplo do componente
// que não renderiza nada.

import { expect, waitFor } from 'storybook/test';

/**
 * Espera a ANIMAÇÃO DE ENTRADA fechar — precondição de toda CONTAGEM de formas.
 *
 * `designPintado` marca a primeira forma de dado pintada, e isso é cedo demais
 * para quem vai contar: enquanto a entrada corre, cada forma sai com
 * `fill-opacity="0"` e sobe até 1. Não é só uma medida borrada — é uma medida
 * ERRADA de outra coisa. O único elemento que TERMINA em `fill-opacity="0"` é o
 * fundo da legenda, e é por essa marca que um coletor a reconhece para excluí-la
 * do que conta como forma de dado. No meio da animação há um candidato por forma
 * desenhada, o primeiro deles uma faixa do funil: a caixa da legenda sai sendo a
 * primeira faixa, nada mais é excluído, e um funil de quatro etapas devolve oito
 * formas.
 *
 * Por isso a condição de parada é a própria invariante que o coletor assume: no
 * máximo UM `fill-opacity="0"` no desenho. Sem legenda o número é zero e a
 * espera passa direto; com `prefers-reduced-motion` não há animação e também não
 * há o que esperar.
 *
 * E ela fecha a marca de OPACIDADE, não a de geometria: medido, logo depois
 * daqui as 6 colunas e as 3 fatias ainda saem com `getBBox()` zerado, porque a
 * entrada delas é animada no tamanho. Por isso quem CONTA forma espera de novo,
 * dentro de `waitFor` — ver o bloco dos coletores.
 */
export async function drawingSettled(root: HTMLElement): Promise<void> {
  await waitFor(
    () => expect(root.querySelectorAll('svg path[fill-opacity="0"]').length)
      .toBeLessThanOrEqual(1),
    { timeout: 3000 },
  );
}

// ─── Coletores de forma ───────────────────────────────────────────────────────
//
// Contar "as formas do gráfico" varrendo o `<svg>` inteiro NÃO devolve as formas
// de dado — devolve também a decoração que a lib desenha em volta. O `<svg>` que
// o motor emite é PLANO: não há um `<g>` por componente, e legenda, eixo, grade
// e série são todos irmãos dentro do mesmo grupo raiz. Por isso a exclusão não
// pode ser "pegue a subárvore da série": ela não existe.
//
// Duas populações são excluídas, e nenhuma das duas por acidente de layout.
//
// 1. O INTERIOR DE `<defs>`. A trama exige um `<pattern>` cujo interior são
//    `<path>` de cor chapada, e o recorte de série põe outro `<path>` dentro de
//    um `<clipPath>`. Nada disso é desenhado: é vocabulário referenciado por
//    `url(#…)`. Eles atravessam um filtro de TAMANHO porque `getBBox()` devolve
//    a geometria própria do caminho mesmo para elemento não renderizado — das 20
//    formas de `<defs>` do funil, 18 saem com geometria e só 2 com zero —,
//    enquanto `getBoundingClientRect()` devolve 0x0 para o mesmo nó. A exclusão
//    é ESTRUTURAL (`closest('defs')`) de propósito — depender do 0x0 seria
//    excluir por efeito colateral de layout, e no dia em que o navegador mudasse
//    esse detalhe o defeito voltaria calado.
//
// 2. A LEGENDA. Ela não é subárvore (ver acima: tudo é irmão), mas TEM caixa: a
//    lib desenha o fundo dela como o único `<path fill-opacity="0">` do desenho,
//    e esse retângulo é exatamente o que envolve ícones e rótulos. Ele é, então,
//    a definição operacional de "dentro da legenda": quem cabe nele é legenda.
//    Sem legenda (série única) não há fundo, e nada é excluído por aqui.
//
// Medido no DOM real, com a varredura SEM exclusão nenhuma, em 2026-08-26:
//
//   Barras (6 categorias, sem legenda) → 10 formas chapadas: 6 colunas + 4 no
//     interior do `<defs>`. Contando também a camada da trama são 12 formas
//     para 6 dados — é isto que um limite inferior deixava passar, e por isso as
//     contagens abaixo são de igualdade.
//   Rosca (3 fatias) → 23 chapadas: 3 fatias + 16 no `<defs>` + 4 na legenda
//     (3 ícones mais o próprio fundo). Com trama: 6, metade delas ícone.
//   Funil (4 etapas) → 29 chapadas: 4 faixas + 20 no `<defs>` + 5 na legenda.
//     Com trama: 8, metade delas na legenda — o ícone também recebe hachura.
//
// E uma armadilha de TEMPO, medida no mesmo lugar: logo depois de
// `drawingSettled` as 6 colunas e as 3 fatias ainda saem com `getBBox()` zerado.
// A entrada da coluna e da fatia é animada na GEOMETRIA, e a marca de opacidade
// que `drawingSettled` observa fecha antes disso; as faixas do funil, que a lib
// anima pela opacidade, já têm área nesse instante. Daí as contagens das stories
// irem dentro de `waitFor`: o que se espera ali é a geometria assentar. A
// igualdade continua com dentes porque contagem INFLADA nunca converge — só a
// geometria sobe, o número de formas não desce.
//
// A tentação óbvia era filtrar por `stroke-width` — contorno de dado sai em 1px
// e ícone de legenda em 2px. NÃO SERVE: o símbolo de ponto do traçado sai em
// 0.44px, e o filtro passaria a excluir forma de dado de verdade. A contagem
// encolheria em silêncio, que é o pior defeito que um portão pode ter.
//
// Corolário para quem for simplificar isto: as contagens esperadas nas stories
// são o NÚMERO DE DADOS. Se um coletor voltar a divergir, o número esperado não
// é o que se ajusta.
//
// PRECONDIÇÃO de todos eles: `drawingSettled`. Antes de a animação de entrada
// fechar, a marca que identifica a legenda está em TODA forma do desenho, e a
// primeira delas — uma faixa, uma barra — sai fazendo o papel de caixa da
// legenda.

/**
 * A caixa da legenda, lida do retângulo transparente que a lib desenha como
 * fundo dela. `null` quando o desenho não tem legenda.
 */
function legendBox(root: HTMLElement): DOMRect | null {
  const background = root.querySelector<SVGGraphicsElement>('svg path[fill-opacity="0"]');
  return background ? background.getBoundingClientRect() : null;
}

/** Cabe inteiro na caixa da legenda — a folga de 1px cobre arredondamento. */
function insideLegend(shape: SVGGraphicsElement, box: DOMRect | null): boolean {
  if (!box) return false;
  const r = shape.getBoundingClientRect();
  return r.left >= box.left - 1 && r.right <= box.right + 1
    && r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
}

/** É forma DESENHADA de dado: fora do vocabulário, fora da legenda, com área. */
function isDatumShape(shape: SVGGraphicsElement, box: DOMRect | null): boolean {
  if (shape.closest('defs') !== null) return false;
  if (insideLegend(shape, box)) return false;
  const bbox = shape.getBBox();
  return bbox.width > 0 && bbox.height > 0;
}

/**
 * As formas de dado preenchidas com COR DE SÉRIE — barra, fatia, faixa, região
 * de área. É a camada de BAIXO: a trama, que vem por cima, fica de fora.
 */
export function filledShapes(root: HTMLElement): SVGGraphicsElement[] {
  const box = legendBox(root);
  return [...root.querySelectorAll<SVGGraphicsElement>('svg path[fill], svg rect[fill]')]
    .filter((shape) => {
      const fill = shape.getAttribute('fill') ?? 'none';
      if (fill === 'none' || fill.startsWith('url(')) return false;
      return isDatumShape(shape, box);
    });
}

/**
 * A camada de CIMA de cada forma de dado: o segundo caminho, preenchido com
 * `url(#…)`, que traz a trama do decal.
 *
 * É esta que cumpre a WCAG 1.4.1 — sem ela o gráfico volta a distinguir série
 * só por cor. Contá-la ao lado de `filledShapes`, com o mesmo número esperado,
 * é o que impede um coletor que exclui demais de ficar verde medindo menos: se
 * a exclusão passasse a comer forma de dado, os dois números caem juntos.
 */
export function hatchedShapes(root: HTMLElement): SVGGraphicsElement[] {
  const box = legendBox(root);
  return [...root.querySelectorAll<SVGGraphicsElement>('svg path[fill^="url("], svg rect[fill^="url("]')]
    .filter((shape) => isDatumShape(shape, box));
}
