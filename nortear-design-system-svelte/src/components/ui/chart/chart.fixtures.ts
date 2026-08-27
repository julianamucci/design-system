import { expect, waitFor } from 'storybook/test';
import { designPintado, tramasAplicadas } from '@shared/testing/chart-probe';

/**
 * Andaime de espera do Chart — um helper, três arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As três cópias eram idênticas, inclusive no `timeout` de 3000; só
 * `chart-variantes` trazia a linha de explicação, e ela veio junto.
 */

/**
 * Espera o desenho sair antes de qualquer medição.
 *
 * É a precondição de qualquer medida, e cada story a repõe por conta própria —
 * o painel Interactions reexecuta a play no MESMO DOM.
 */
export async function waitForDesign(root: HTMLElement): Promise<void> {
  await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
}

/**
 * Espera a ANIMAÇÃO DE ENTRADA fechar — precondição de toda CONTAGEM de formas.
 *
 * `waitForDesign` marca a primeira forma de dado pintada, que é cedo demais
 * para quem vai contar: enquanto a entrada corre, cada forma sai com
 * `fill-opacity="0"` e sobe até 1. E isso não borra a medida — mede outra
 * coisa. O único elemento que TERMINA em `fill-opacity="0"` é o fundo da
 * legenda, e é por essa marca que um coletor a reconhece para excluí-la; no
 * meio da animação há um candidato por forma desenhada, o primeiro deles uma
 * faixa do funil, e a caixa da legenda sai sendo a primeira faixa. Nada mais é
 * excluído como legenda, e um funil de quatro etapas devolve oito formas.
 *
 * Por isso a condição de parada é a própria invariante: no máximo UM
 * `fill-opacity="0"` no desenho. Sem legenda o número é zero e a espera passa
 * direto; com `prefers-reduced-motion` não há animação e também não há o que
 * esperar.
 *
 * E ela fecha a marca de OPACIDADE, não a de geometria: medido, logo depois
 * daqui as 4 colunas e as 3 fatias ainda saem com `getBBox()` zerado, porque a entrada
 * delas é animada no tamanho. Por isso quem CONTA forma espera de novo, dentro
 * de `waitFor` — ver o bloco dos coletores.
 */
export async function drawingSettled(root: HTMLElement): Promise<void> {
  await waitFor(
    () => expect(root.querySelectorAll('svg path[fill-opacity="0"]').length)
      .toBeLessThanOrEqual(1),
    { timeout: 3000 },
  );
}

/**
 * O elemento em que a lib desenha.
 *
 * É ele — e não o bloco `.nds-chart` em volta — que leva `role="img"` e o
 * rótulo. O papel PODA a subárvore da árvore de acessibilidade: no bloco, ele
 * podaria também a tabela de dados, e a alternativa textual sumiria. Medir o
 * papel no bloco, portanto, seria medir o contrato errado.
 *
 * Serve também de recorte para qualquer sonda de TEXTO do desenho: a tabela
 * escreve os mesmos números, e uma busca no bloco inteiro passaria mesmo com o
 * desenho mudo — portão sem dentes.
 */
export function drawingOf(root: HTMLElement): HTMLElement {
  const drawing = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!drawing) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  return drawing;
}

/** O bloco da alternativa textual — `.nds-sr-only` ou `.nds-table-wrapper`. */
export function dataOf(root: HTMLElement): HTMLElement {
  const data = root.querySelector<HTMLElement>('[data-slot="chart-data"]');
  if (!data) throw new Error('nenhum [data-slot="chart-data"] dentro do .nds-chart');
  return data;
}

/** O cabeçalho da tabela equivalente: a coluna de categoria e uma por série. */
export function headerOf(root: HTMLElement): string[] {
  return [...dataOf(root).querySelectorAll('thead th')].map((th) => (th.textContent ?? '').trim());
}

/**
 * Com que COR a trama do decal foi traçada, lida de dentro do `<pattern>`.
 *
 * O decal chega à forma como um SEGUNDO caminho preenchido com `url(#…)`; o
 * `<pattern>` desse id guarda os desenhos da hachura, e é o `fill` deles que
 * diz com que cor ela foi feita. A leitura passa por um elemento de sonda para
 * normalizar o valor — o atributo pode vir como `hsl(…)` ou `rgba(…)`, e
 * comparar texto de cor com texto de cor compara formato, não cor.
 *
 * A sonda de leitura vai no `<body>`, fora do fluxo, e nunca ao lado do gráfico:
 * pendurada no irmão, ela reflui o bloco a cada leitura, o observador de tamanho
 * repinta o desenho junto e o par vira laço.
 *
 * Existe para o portão ter dentes. Com a lista PADRÃO da lib esta função
 * devolve `rgba(0, 0, 0, 0.2)` — preto a 20%, que se destaca do próprio
 * preenchimento entre 1.14 e 1.54 —, e a asserção que exige o fundo reprova.
 *
 * NÃO chame isto dentro de um `waitFor`. A sonda mexe no `<body>`, e mexer no
 * DOM acorda o observador de mutação que o `waitFor` usa para reagendar: a
 * tentativa que falha provoca a próxima, o prazo nunca chega, e o portão deixa
 * de reprovar — ele PENDURA, com o navegador a 100% e a suíte sem terminar
 * (medido: dez minutos até o corte da ferramenta). A trama já está na forma
 * quando este passo roda; não há o que esperar.
 */
export function decalColors(root: HTMLElement): string[] {
  const doc = root.ownerDocument;
  const found = new Set<string>();
  for (const id of tramasAplicadas(root)) {
    const pattern = doc.getElementById(id);
    if (!pattern) continue;
    for (const mark of pattern.querySelectorAll<SVGElement>('path, rect, circle, polygon, line')) {
      const paint = mark.getAttribute('fill') ?? getComputedStyle(mark).fill;
      if (paint && paint !== 'none') found.add(normalizeColor(paint, doc));
    }
  }
  return [...found];
}

/** Uma cor CSS qualquer no formato em que `getComputedStyle` a devolveria. */
function normalizeColor(input: string, doc: Document): string {
  const probe = doc.createElement('span');
  probe.style.color = input;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  doc.body.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
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
//   Barras (4 categorias, sem legenda) → 8 formas chapadas: 4 colunas + 4 no
//     interior do `<defs>`. Oito para quatro dados — é exatamente isto que um
//     `>= 4` deixava passar, e por isso as contagens abaixo são de igualdade.
//   Rosca (3 fatias) → 23 chapadas: 3 fatias + 16 no `<defs>` + 4 na legenda
//     (3 ícones mais o próprio fundo). Com trama: 6, metade delas ícone.
//   Funil (4 etapas) → 29 chapadas: 4 faixas + 20 no `<defs>` + 5 na legenda.
//     Com trama: 8, metade delas na legenda — o ícone também recebe hachura.
//
// E uma armadilha de TEMPO, medida no mesmo lugar: logo depois de
// `drawingSettled` as 4 colunas e as 3 fatias ainda saem com `getBBox()` zerado.
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
  if (shape.getAttribute('paint-order') === 'stroke') return false;
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

// ─── Coletores do radar ───────────────────────────────────────────────────────
//
// O radar desenha MAIS de uma forma preenchida por série, e é por isso que ele
// precisa dos seus: além da área fechada, cada vértice é um símbolo, também
// preenchido com a cor da série. Medido no DOM real, cinco eixos e duas séries:
// 51 `<path>` no total, dos quais 2 são a área, 10 são símbolo, 2 são o traçado
// do contorno (sem preenchimento) e o resto é grade, eixo, legenda e o interior
// dos dois `<pattern>`. `filledShapes` devolveria doze formas para duas séries —
// todas legítimas, nenhuma delas o que a story do radar promete contar.
//
// O que separa a área do resto é a TRANSLUCIDEZ, e ela não é acidente de
// desenho: a área do radar é translúcida DE PROPÓSITO, para que um polígono não
// apague o que está embaixo dele — que é justamente a comparação que o radar
// existe para mostrar. Símbolo, ícone de legenda e molde de trama saem opacos. É
// o mesmo critério que o tipo `area` já usa na story dele, e ele reprova por
// onde tem de reprovar: sem `areaStyle` a lib não desenha a área nenhuma, e a
// contagem cai a zero em vez de escorregar para outra forma.
//
// Uma advertência para quem for procurar por elemento: o motor de tela emite
// `<polygon>` e `<polyline>` para a área e para o contorno, mas o painter que
// roda no navegador reduz TUDO a `<path>` — medido, zero `<polygon>` no DOM
// real. Seletor de elemento aqui devolve lista vazia, e lista vazia num coletor
// é o portão que passa a medir nada.

/** Preenchimento translúcido — nem apagado, nem opaco. */
function isTranslucent(shape: SVGGraphicsElement): boolean {
  const opacity = Number.parseFloat(getComputedStyle(shape).fillOpacity || '1');
  return opacity > 0 && opacity < 1;
}

/** A área fechada de cada série do radar — a camada de cor. */
export function radarPolygons(root: HTMLElement): SVGGraphicsElement[] {
  return filledShapes(root).filter(isTranslucent);
}

/**
 * A trama de CADA área do radar — a camada de cima.
 *
 * O gêmeo hachurado herda o estilo do original, translucidez inclusive, então o
 * mesmo critério separa a trama da área da trama dos símbolos. Contá-la ao lado
 * de `radarPolygons`, com o mesmo número esperado, é o que impede um coletor
 * que exclui demais de ficar verde medindo menos.
 */
export function radarHatches(root: HTMLElement): SVGGraphicsElement[] {
  return hatchedShapes(root).filter(isTranslucent);
}
