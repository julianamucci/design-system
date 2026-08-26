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
