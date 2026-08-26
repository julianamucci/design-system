// Snippet do painel Code do Chart — ver `@/lib/story-source`.
//
// Nasceu como uma `playgroundSource` local dentro de `chart.stories.ts`: uma
// função não exportada, alcançável só por aquele arquivo e por nenhum teste. O
// conteúdo bom dela — a chamada real da fábrica em vez do `outerHTML`, e o
// acompanhamento dos controls — está preservado aqui, agora exportado, testável
// e disponível para os outros quatro arquivos de story do componente.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { ChartType } from './chart';

/**
 * Forma do dado que o snippet declara antes da chamada.
 *
 * A fábrica aceita duas: `data` (uma série de rótulo + valor) e o par
 * `xAxis` + `series` (várias séries alinhadas ao eixo). Cada story exercita uma
 * delas, e o snippet precisa mostrar a que ela usa.
 */
export type ChartSnippetData =
  | 'simples' | 'umPonto' | 'serieUnica' | 'multi' | 'rosca' | 'funnel' | 'radar' | 'vazio';

/** O que as stories usam da `ChartOptions` e que o snippet precisa mostrar. */
export type ChartSnippetOptions = {
  type?: ChartType;
  /** Descrição do desenho: vira o nome acessível do bloco, anunciado como imagem. */
  'aria-label'?: string;
  /** Título desenhado acima dos eixos. */
  title?: string;
  showLegend?: boolean;
  /** Torna visível a tabela de dados que a fábrica emite sempre. */
  showData?: boolean;
  height?: number;
  renderer?: 'svg' | 'canvas';
  /** O arg do Playground se chama `className`; a opção da fábrica é `class`. */
  className?: string;
  data?: ChartSnippetData;
  /** Cor autoral de série, fora da paleta de tokens. */
  color?: string;
  /** Frase mostrada no lugar do desenho quando não há dado. */
  emptyLabel?: string;
};

const MONTHS = "const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];";

/** Uso canônico: uma série simples, descrita, num bloco de altura definida. */
const DEFAULT: ChartSnippetOptions = {
  data: 'simples',
  'aria-label': 'Acessos mensais no desktop, de janeiro a junho',
  height: 240,
  className: 'nds-max-w-md',
};

/** O bloco de dado e as opções que o entregam à fábrica. */
function snippetData(o: ChartSnippetOptions): {
  block?: string;
  pairs: Array<[string, string | undefined]>;
} {
  const serie = (name: string, values: string, cor?: string) =>
    `  { name: ${text(name)}, data: ${values}${cor ? `, color: ${text(cor)}` : ''} },`;

  switch (o.data ?? 'simples') {
    case 'umPonto':
      return {
        block: "const acessos = [{ label: 'Jan', value: 186 }];",
        pairs: [['data', 'acessos']],
      };

    case 'serieUnica':
      return {
        block: `${MONTHS}

const acessos = [
${serie('Desktop', '[186, 305, 237, 73, 209, 214]', o.color)}
];`,
        pairs: [
          ['xAxis', 'meses'],
          ['series', 'acessos'],
        ],
      };

    case 'multi':
      return {
        block: `${MONTHS}

const acessosPorDispositivo = [
${serie('Desktop', '[186, 305, 237, 73, 209, 214]', o.color)}
${serie('Mobile', '[120, 190, 165, 98, 174, 158]')}
];`,
        pairs: [
          ['xAxis', 'meses'],
          ['series', 'acessosPorDispositivo'],
        ],
      };

    case 'rosca':
      return {
        block: `const acessosPorDispositivo = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];`,
        pairs: [['data', 'acessosPorDispositivo']],
      };

    case 'funnel':
      // A ordem das etapas é o processo, e é ela que o snippet ensina: a lista
      // sai da entrada para a saída, e a coluna de participação da tabela se
      // refere à primeira linha.
      return {
        block: `const etapas = [
  { label: 'Visitas', value: 1000 },
  { label: 'Cadastros', value: 620 },
  { label: 'Carrinho', value: 260 },
  { label: 'Compra', value: 90 },
];`,
        pairs: [['data', 'etapas']],
      };

    case 'radar':
      // O radar tem duas listas, e o snippet mostra as duas porque nenhuma
      // delas se deduz da outra: os EIXOS trazem nome e teto (é o teto que a
      // coluna de máximo da tabela escreve), e as séries trazem os valores na
      // ordem dos eixos.
      return {
        block: `const eixos = [
  { label: 'Desempenho', max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas', max: 10 },
  { label: 'SEO', max: 100 },
  { label: 'Conteúdo', max: 5 },
];

const medicoes = [
  { name: 'Antes', data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
];`,
        pairs: [['radarAxes', 'eixos'], ['series', 'medicoes']],
      };

    case 'vazio':
      // Sem série com dado o bloco troca o desenho pela frase — e não se
      // anuncia como imagem, porque não há imagem para narrar.
      return { block: MONTHS, pairs: [['xAxis', 'meses'], ['series', '[]']] };

    default:
      return {
        block: `const acessosMensais = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
];`,
        pairs: [['data', 'acessosMensais']],
      };
  }
}

/** A chamada real de `createChart` com as opções da story. */
export function chartSnippet(o: ChartSnippetOptions = {}): string {
  const { block, pairs } = snippetData(o);

  const lines = options([
    ...pairs,
    ['type', o.type && o.type !== 'bar' ? text(o.type) : undefined],
    ['aria-label', o['aria-label'] ? text(o['aria-label']) : undefined],
    ['title', o.title ? text(o.title) : undefined],
    ['showLegend', o.showLegend === undefined ? undefined : String(o.showLegend)],
    // Só aparece quando ligado: a tabela é emitida de qualquer jeito, e um
    // `showData: false` no snippet ensinaria que ela depende da opção.
    ['showData', o.showData ? 'true' : undefined],
    ['height', o.height ? String(o.height) : undefined],
    ['renderer', o.renderer && o.renderer !== 'svg' ? text(o.renderer) : undefined],
    ['class', o.className ? text(o.className) : undefined],
    ['emptyLabel', o.emptyLabel ? text(o.emptyLabel) : undefined],
  ]);

  return snippet(
    importing('chart', 'createChart'),
    block,
    `const grafico = ${chamada('createChart', lines)};`,
    montar('grafico'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no gráfico canônico.
 */
export const chartSource: SourceTransform<ChartSnippetOptions> = (_gerado, ctx) =>
  chartSnippet({ ...DEFAULT, ...ctx.args });

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function chartSourceWith(fixas: ChartSnippetOptions): SourceTransform<ChartSnippetOptions> {
  return (_gerado, ctx) => chartSnippet({ ...DEFAULT, ...ctx.args, ...fixas });
}

// ─── Gráfico dentro de um Card ────────────────────────────────────────────────

/** O que a composição com Card precisa mostrar. */
export type ChartEmCardSnippetOptions = ChartSnippetOptions & {
  /** Título do cartão — em texto de verdade, não desenhado dentro do gráfico. */
  cardTitle?: string;
  /** Recorte temporal, na descrição do cabeçalho. */
  cardDescription?: string;
};

/**
 * Gráfico dentro de um Card.
 *
 * O título e o recorte temporal ficam no cabeçalho, em TEXTO de verdade —
 * desenhados dentro do gráfico eles seriam pixel, e nem a busca da página nem o
 * leitor de tela os alcançariam. O desenho fica no conteúdo, e a descrição dele
 * continua sendo o `aria-label`.
 */
export function chartEmCardSnippet(o: ChartEmCardSnippetOptions = {}): string {
  const { block, pairs } = snippetData(o);

  const lines = options([
    ...pairs,
    ['type', o.type && o.type !== 'bar' ? text(o.type) : undefined],
    ['height', o.height ? String(o.height) : undefined],
    ['aria-label', o['aria-label'] ? text(o['aria-label']) : undefined],
  ]);

  return snippet(
    [
      `import {\n  createCard,\n  createCardContent,\n  createCardDescription,\n  createCardHeader,\n  createCardTitle,\n} from '@/components/ui/card';`,
      importing('chart', 'createChart'),
    ].join('\n'),
    block,
    `const card = createCard({ class: 'nds-w-sm' });

const cabecalho = createCardHeader();
cabecalho.append(
  createCardTitle({ text: ${text(o.cardTitle ?? 'Acessos mensais')} }),
  createCardDescription({ text: ${text(o.cardDescription ?? 'Janeiro — Junho de 2024')} }),
);`,
    `const conteudo = createCardContent();
conteudo.appendChild(${chamada('createChart', lines)});

card.append(cabecalho, conteudo);`,
    montar('card'),
  );
}

/** Transform de story para o gráfico dentro de um Card. */
export function cardSourceWithChart(
  fixas: ChartEmCardSnippetOptions = {},
): SourceTransform<ChartEmCardSnippetOptions> {
  return (_gerado, ctx) => chartEmCardSnippet({ ...ctx.args, ...fixas });
}
