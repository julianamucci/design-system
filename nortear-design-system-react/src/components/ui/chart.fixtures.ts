import { expect, waitFor } from 'storybook/test';
import { getInstanceByDom } from 'echarts/core';
import { designPintado, exigirRoot, tramasAplicadas } from '@shared/testing/chart-probe';

/**
 * Andaime de espera do Chart — um helper, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.tsx` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As quatro cópias eram idênticas, inclusive no `timeout` de 3000 — o que
 * variava era só o comentário: três traziam uma linha e `chart-variantes`
 * carregava a explicação inteira. Ela veio junto.
 */

/**
 * Espera o desenho existir e devolve a raiz do gráfico.
 *
 * É a precondição de qualquer medida, e cada story a repõe por conta própria —
 * o painel Interactions reexecuta a play no MESMO DOM.
 *
 * A raiz sai de `exigirRoot`, que procura pela classe do CSS compartilhado e
 * não pelo `data-slot`: é o que o design system define, e o mesmo seletor serve
 * nas cinco stacks.
 */
export async function designPronto(canvasElement: HTMLElement): Promise<HTMLElement> {
  const root = exigirRoot(canvasElement);
  await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
  return root;
}

/**
 * O elemento em que a lib desenha — o que leva o papel de imagem e o rótulo.
 *
 * O bloco `.nds-chart` NÃO os leva: `role="img"` poda a subárvore da árvore de
 * acessibilidade, e no bloco a tabela de dados ficaria escondida junto.
 */
export function drawingOf(chart: HTMLElement): HTMLElement {
  const drawing = chart.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!drawing) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  return drawing;
}

/** A alternativa textual: a tabela que o container emite sempre. */
export function dataOf(chart: HTMLElement): HTMLElement {
  const data = chart.querySelector<HTMLElement>('[data-slot="chart-data"]');
  if (!data) throw new Error('nenhum [data-slot="chart-data"] dentro do .nds-chart');
  return data;
}

/** Os textos do cabeçalho da tabela, na ordem das colunas. */
export function headerOf(chart: HTMLElement): string[] {
  return [...dataOf(chart).querySelectorAll('thead th')].map((th) => (th.textContent ?? '').trim());
}

/**
 * As linhas da tabela, célula a célula — o `th` de categoria incluído.
 *
 * A célula de categoria é `th scope="row"` e não `td`: é ela que nomeia a
 * linha para quem navega a tabela por leitor de tela. Lê `th, td` na ordem do
 * documento justamente para que uma troca por `td` apareça na comparação.
 */
export function rowsOf(chart: HTMLElement): string[][] {
  return [...dataOf(chart).querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('th, td')].map((cell) => (cell.textContent ?? '').trim()),
  );
}

/**
 * Espera a ANIMAÇÃO DE ENTRADA terminar.
 *
 * `designPronto` marca a primeira forma de dado pintada, que é cedo demais para
 * quem vai medir a forma: enquanto a entrada corre, cada forma sai com
 * `fill-opacity="0"` e vai subindo até 1. Medido no funil, aos 57ms: as quatro
 * faixas e as quatro tramas ainda em zero.
 *
 * Isso não é só uma medida borrada — é uma medida ERRADA de outra coisa. O
 * único elemento que TERMINA em `fill-opacity="0"` é o fundo da legenda, e é
 * justamente por essa marca que `legendBox` o encontra; no meio da animação
 * havia nove candidatos, o primeiro deles uma faixa, e a caixa da legenda saía
 * sendo a primeira faixa do funil. O resultado foi um coletor devolvendo oito
 * formas onde há quatro.
 *
 * Por isso a condição de parada é essa mesma invariante: no máximo UM
 * `fill-opacity="0"` no desenho. Sem legenda o número é zero e a espera passa
 * direto; com `prefers-reduced-motion` não há animação e também não há espera.
 */
export async function drawingSettled(chart: HTMLElement): Promise<void> {
  await waitFor(
    () => expect(chart.querySelectorAll('svg path[fill-opacity="0"]').length)
      .toBeLessThanOrEqual(1),
    { timeout: 3000 },
  );
}

/**
 * A caixa da legenda, lida do retângulo transparente que a própria lib desenha
 * como fundo dela. `null` quando o desenho não tem legenda.
 *
 * A legenda NÃO é subárvore: o `<svg>` do zrender é plano, e eixo, série e
 * legenda são todos irmãos. O que a delimita é esse fundo — o único
 * `<path fill-opacity="0">` do desenho —, e é ele que define, operacionalmente,
 * "o que está dentro da legenda".
 */
function legendBox(chart: HTMLElement): DOMRect | null {
  const background = chart.querySelector<SVGGraphicsElement>('svg path[fill-opacity="0"]');
  return background ? background.getBoundingClientRect() : null;
}

/** Cabe inteiro na caixa da legenda — a folga de 1px cobre arredondamento. */
function insideLegend(shape: SVGGraphicsElement, box: DOMRect | null): boolean {
  if (!box) return false;
  const r = shape.getBoundingClientRect();
  return r.left >= box.left - 1 && r.right <= box.right + 1
    && r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
}

/**
 * As formas de dado preenchidas com COR DE SÉRIE — barra, fatia, faixa de
 * funil. A camada de baixo; a trama por cima fica de fora, e a legenda também.
 *
 * Duas populações são excluídas de propósito, e nenhuma das duas por acidente
 * de layout:
 *
 * 1. O INTERIOR DE `<defs>`. A trama exige um `<pattern>`, e o interior dele é
 *    feito de `<path>` de cor chapada; o recorte de série põe outro dentro de
 *    um `<clipPath>`. Nada disso é desenhado — é vocabulário referenciado por
 *    `url(#…)`. Eles atravessam qualquer filtro de tamanho porque `getBBox()`
 *    devolve a geometria própria do caminho mesmo sem renderização, enquanto
 *    `getBoundingClientRect()` devolve 0x0. A exclusão é ESTRUTURAL: depender
 *    do 0x0 seria excluir por efeito colateral, e o dia em que o navegador
 *    mudasse esse detalhe o defeito voltaria calado.
 * 2. A LEGENDA — o fundo dela mais os ícones que cabem nele. Sem isso, contar
 *    "as formas do gráfico" contaria também a decoração da lib, e um desenho de
 *    quatro faixas devolveria nove nós.
 *
 * A tentação óbvia era filtrar por `stroke-width` (dado sai em 1px, ícone de
 * legenda em 2px). Não serve: o símbolo de ponto de `line` sai em 0.44px, e o
 * filtro passaria a excluir forma de dado de verdade — portão verde medindo
 * menos.
 *
 * PRECONDIÇÃO: `drawingSettled`. Antes de a animação de entrada fechar, a marca
 * que identifica a legenda está em toda forma do desenho — ver lá.
 */
export function filledShapes(chart: HTMLElement): SVGGraphicsElement[] {
  const box = legendBox(chart);
  return [...chart.querySelectorAll<SVGGraphicsElement>('svg path[fill], svg rect[fill]')].filter(
    (shape) => {
      const fill = shape.getAttribute('fill') ?? 'none';
      if (fill === 'none' || fill.startsWith('url(')) return false;
      return isDatumShape(shape, box);
    },
  );
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
 * A camada de CIMA de cada forma de dado: o segundo caminho, preenchido com
 * `url(#…)`, que traz a trama do decal.
 *
 * É esta que cumpre a WCAG 1.4.1 — sem ela o gráfico volta a distinguir série
 * só por cor. Contá-la ao lado de `filledShapes`, com o mesmo número esperado,
 * é o que impede um coletor que exclui demais de ficar verde medindo menos: se
 * a exclusão passasse a comer forma de dado, os dois números caem juntos.
 */
export function hatchedShapes(chart: HTMLElement): SVGGraphicsElement[] {
  const box = legendBox(chart);
  return [
    ...chart.querySelectorAll<SVGGraphicsElement>('svg path[fill^="url("], svg rect[fill^="url("]'),
  ].filter((shape) => isDatumShape(shape, box));
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
export function radarPolygons(chart: HTMLElement): SVGGraphicsElement[] {
  return filledShapes(chart).filter(isTranslucent);
}

/**
 * A trama de CADA área do radar — a camada de cima.
 *
 * O gêmeo hachurado herda o estilo do original, translucidez inclusive, então o
 * mesmo critério separa a trama da área da trama dos símbolos. Contá-la ao lado
 * de `radarPolygons`, com o mesmo número esperado, é o que impede um coletor
 * que exclui demais de ficar verde medindo menos.
 */
export function radarHatches(chart: HTMLElement): SVGGraphicsElement[] {
  return hatchedShapes(chart).filter(isTranslucent);
}

/** Option resolvida: as séries e a PALETA que o tema entregou ao desenho. */
export interface ChartOption {
  series: Record<string, unknown>[];
  color?: string[];
}

/**
 * Option já resolvida pela lib, lida da instância montada no desenho.
 *
 * Serve para o que é decisão de configuração e não vira nó do DOM — símbolo de
 * ponto e desenho de traço por série. O que vira pixel continua sendo medido no
 * DOM: option verde com desenho errado é exatamente o portão sem dentes.
 */
export function optionOf(chart: HTMLElement): ChartOption {
  // A busca desce do elemento do desenho em vez de apontar direto para ele: o
  // wrapper desta stack cria a própria caixa antes de chamar a lib, e a
  // instância fica na caixa de dentro. Perguntar só pelo elemento de fora
  // devolveria `undefined` — e um `optionOf` que explode por procurar no lugar
  // errado desperdiça a story inteira.
  const drawing = drawingOf(chart);
  for (const candidate of [drawing, ...drawing.querySelectorAll<HTMLElement>('div')]) {
    const instance = getInstanceByDom(candidate);
    if (instance) return instance.getOption() as unknown as ChartOption;
  }
  throw new Error('a lib não montou instância dentro do [data-slot="chart-canvas"]');
}

/**
 * Normaliza uma cor CSS ao formato que `getComputedStyle` devolveria.
 *
 * `hsl(24 100% 99.5%)` e `rgb(255, 252, 250)` são a MESMA cor e não se comparam
 * como texto. A sonda fica fora do fluxo e no `<body>`: pendurada ao lado do
 * gráfico, cada leitura refluiria o bloco e o observador de tamanho repintaria
 * o desenho de novo.
 */
function normalizedColor(value: string, doc: Document): string {
  const probe = doc.createElement('span');
  probe.style.color = value;
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

/**
 * As cores com que a trama do decal foi TRAÇADA, lidas de dentro do
 * `<pattern>`.
 *
 * Existe porque "há trama" e "a trama é visível" são afirmações diferentes, e
 * até aqui só a primeira era medida. Com o renderizador SVG, a trama vira um
 * segundo caminho preenchido com `url(#id)`; o `<pattern>` de mesmo id guarda
 * os desenhos, e é o `fill` deles que diz em que cor a hachura saiu. Com a
 * lista padrão da lib esse `fill` é preto translúcido; com a do design system,
 * é o fundo da página.
 *
 * `url(...)` e `none` ficam de fora: o primeiro é aninhamento de padrão, o
 * segundo é caminho sem preenchimento — nenhum dos dois é a cor da hachura.
 *
 * A normalização vem DEPOIS de reduzir a distintos, e a ordem não é estilo: um
 * ladrilho de hachura tem dezenas de formas, e cada normalização insere um nó e
 * força o navegador a resolver estilo. Normalizando forma a forma, uma única
 * leitura custava centenas de reflows — o bastante para a aba parar de
 * responder quando a asserção falhava e a medida era repetida. Ler atributo não
 * custa layout; só o que sobra depois da redução chega a custar.
 */
export function hatchColors(chart: HTMLElement): string[] {
  const doc = chart.ownerDocument;
  const raws = new Set<string>();
  for (const id of tramasAplicadas(chart)) {
    const pattern = chart.querySelector(`svg pattern[id="${CSS.escape(id)}"]`);
    if (!pattern) continue;
    for (const shape of pattern.querySelectorAll('[fill]')) {
      const raw = (shape.getAttribute('fill') ?? '').trim();
      if (!raw || raw === 'none' || raw.startsWith('url(')) continue;
      raws.add(raw);
    }
  }
  return [...raws].map((raw) => normalizedColor(raw, doc));
}

/**
 * A paleta de série que o desenho recebeu, normalizada para comparar com token.
 *
 * Sai da option RESOLVIDA porque a paleta é decisão de tema, e no `<svg>` só
 * aparecem as posições que o dado da story chegou a usar: um desenho de três
 * séries não mostra a 4ª cor nem a 8ª, e medir o DOM contaria três de oito sem
 * reprovar. Aqui a lista inteira é observável — inclusive o seu TAMANHO, que é
 * o que separa ler cinco tokens de ler oito.
 */
export function drawingPalette(chart: HTMLElement): string[] {
  const doc = chart.ownerDocument;
  return (optionOf(chart).color ?? []).map((paint) => normalizedColor(paint, doc));
}
