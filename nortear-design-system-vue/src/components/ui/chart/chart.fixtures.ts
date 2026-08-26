// Utilitários de medição do Chart, compartilhados pelos arquivos de story.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: uma
// função auxiliar exportada apareceria na barra lateral do Storybook como se
// fosse um exemplo do componente.

import { expect, waitFor } from 'storybook/test';
import { tramasAplicadas } from '@shared/testing/chart-probe';

/**
 * Espera a ANIMAÇÃO DE ENTRADA terminar.
 *
 * "A primeira forma de dado pintada" é cedo demais para quem vai medir a forma:
 * enquanto a entrada corre, cada forma sai com `fill-opacity="0"` e vai subindo
 * até 1. Medido no funil, aos 57ms: as quatro faixas e as quatro tramas ainda
 * em zero.
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

/** Os textos do cabeçalho da tabela, na ordem das colunas. */
export function headerOf(root: HTMLElement): string[] {
  return [...dataOf(root).querySelectorAll('thead th')].map((th) => (th.textContent ?? '').trim());
}

/**
 * As linhas da tabela, célula a célula — o `th` de categoria incluído.
 *
 * A célula de categoria é `th scope="row"` e não `td`: é ela que nomeia a linha
 * para quem navega a tabela por leitor de tela. Lê `th, td` na ordem do
 * documento justamente para que uma troca por `td` apareça na comparação.
 */
export function rowsOf(root: HTMLElement): string[][] {
  return [...dataOf(root).querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('th, td')].map((cell) => (cell.textContent ?? '').trim()),
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
function legendBox(root: HTMLElement): DOMRect | null {
  const background = root.querySelector<SVGGraphicsElement>('svg path[fill-opacity="0"]');
  return background ? background.getBoundingClientRect() : null;
}

/** Cabe inteiro na caixa da legenda — a folga de 1px cobre arredondamento. */
function insideLegend(shape: SVGGraphicsElement, box: DOMRect | null): boolean {
  if (!box) return false;
  const rect = shape.getBoundingClientRect();
  return rect.left >= box.left - 1 && rect.right <= box.right + 1
    && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1;
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
export function filledShapes(root: HTMLElement): SVGGraphicsElement[] {
  const box = legendBox(root);
  return [...root.querySelectorAll<SVGGraphicsElement>('svg path[fill], svg rect[fill]')].filter(
    (shape) => {
      const fill = shape.getAttribute('fill') ?? 'none';
      if (fill === 'none' || fill.startsWith('url(')) return false;
      if (shape.closest('defs') !== null) return false;
      if (insideLegend(shape, box)) return false;
      const bbox = shape.getBBox();
      return bbox.width > 0 && bbox.height > 0;
    },
  );
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
