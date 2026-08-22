// Snippet do painel Code do Chart — ver `@/lib/story-source`.
//
// Nasceu como uma `playgroundSource` local dentro de `chart.stories.ts`: uma
// função não exportada, alcançável só por aquele arquivo e por nenhum teste. O
// conteúdo bom dela — a chamada real da fábrica em vez do `outerHTML`, e o
// acompanhamento dos controls — está preservado aqui, agora exportado, testável
// e disponível para os outros quatro arquivos de story do componente.

import {
  chamada,
  importar,
  montar,
  opcoes,
  snippet,
  texto,
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
export type ChartSnippetData = 'simples' | 'umPonto' | 'serieUnica' | 'multi' | 'rosca' | 'vazio';

/** O que as stories usam da `ChartOptions` e que o snippet precisa mostrar. */
export type ChartSnippetOptions = {
  type?: ChartType;
  /** Descrição do desenho: vira o nome acessível do bloco, anunciado como imagem. */
  'aria-label'?: string;
  /** Título desenhado acima dos eixos. */
  title?: string;
  showLegend?: boolean;
  height?: number;
  renderer?: 'svg' | 'canvas';
  /** O arg do Playground se chama `className`; a opção da fábrica é `class`. */
  className?: string;
  dados?: ChartSnippetData;
  /** Cor autoral de série, fora da paleta de tokens. */
  color?: string;
  /** Frase mostrada no lugar do desenho quando não há dado. */
  emptyLabel?: string;
};

const MESES = "const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];";

/** Uso canônico: uma série simples, descrita, num bloco de altura definida. */
const PADRAO: ChartSnippetOptions = {
  dados: 'simples',
  'aria-label': 'Acessos mensais no desktop, de janeiro a junho',
  height: 240,
  className: 'nds-max-w-md',
};

/** O bloco de dado e as opções que o entregam à fábrica. */
function snippetData(o: ChartSnippetOptions): {
  bloco?: string;
  pares: Array<[string, string | undefined]>;
} {
  const serie = (nome: string, valores: string, cor?: string) =>
    `  { name: ${texto(nome)}, data: ${valores}${cor ? `, color: ${texto(cor)}` : ''} },`;

  switch (o.dados ?? 'simples') {
    case 'umPonto':
      return {
        bloco: "const acessos = [{ label: 'Jan', value: 186 }];",
        pares: [['data', 'acessos']],
      };

    case 'serieUnica':
      return {
        bloco: `${MESES}

const acessos = [
${serie('Desktop', '[186, 305, 237, 73, 209, 214]', o.color)}
];`,
        pares: [
          ['xAxis', 'meses'],
          ['series', 'acessos'],
        ],
      };

    case 'multi':
      return {
        bloco: `${MESES}

const acessosPorDispositivo = [
${serie('Desktop', '[186, 305, 237, 73, 209, 214]', o.color)}
${serie('Mobile', '[120, 190, 165, 98, 174, 158]')}
];`,
        pares: [
          ['xAxis', 'meses'],
          ['series', 'acessosPorDispositivo'],
        ],
      };

    case 'rosca':
      return {
        bloco: `const acessosPorDispositivo = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];`,
        pares: [['data', 'acessosPorDispositivo']],
      };

    case 'vazio':
      // Sem série com dado o bloco troca o desenho pela frase — e não se
      // anuncia como imagem, porque não há imagem para narrar.
      return { bloco: MESES, pares: [['xAxis', 'meses'], ['series', '[]']] };

    default:
      return {
        bloco: `const acessosMensais = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
];`,
        pares: [['data', 'acessosMensais']],
      };
  }
}

/** A chamada real de `createChart` com as opções da story. */
export function chartSnippet(o: ChartSnippetOptions = {}): string {
  const { bloco, pares } = snippetData(o);

  const linhas = opcoes([
    ...pares,
    ['type', o.type && o.type !== 'bar' ? texto(o.type) : undefined],
    ['aria-label', o['aria-label'] ? texto(o['aria-label']) : undefined],
    ['title', o.title ? texto(o.title) : undefined],
    ['showLegend', o.showLegend === undefined ? undefined : String(o.showLegend)],
    ['height', o.height ? String(o.height) : undefined],
    ['renderer', o.renderer && o.renderer !== 'svg' ? texto(o.renderer) : undefined],
    ['class', o.className ? texto(o.className) : undefined],
    ['emptyLabel', o.emptyLabel ? texto(o.emptyLabel) : undefined],
  ]);

  return snippet(
    importar('chart', 'createChart'),
    bloco,
    `const grafico = ${chamada('createChart', linhas)};`,
    montar('grafico'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai no gráfico canônico.
 */
export const chartSource: SourceTransform<ChartSnippetOptions> = (_gerado, ctx) =>
  chartSnippet({ ...PADRAO, ...ctx.args });

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function chartSourceWith(fixas: ChartSnippetOptions): SourceTransform<ChartSnippetOptions> {
  return (_gerado, ctx) => chartSnippet({ ...PADRAO, ...ctx.args, ...fixas });
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
  const { bloco, pares } = snippetData(o);

  const linhas = opcoes([
    ...pares,
    ['type', o.type && o.type !== 'bar' ? texto(o.type) : undefined],
    ['height', o.height ? String(o.height) : undefined],
    ['aria-label', o['aria-label'] ? texto(o['aria-label']) : undefined],
  ]);

  return snippet(
    [
      `import {\n  createCard,\n  createCardContent,\n  createCardDescription,\n  createCardHeader,\n  createCardTitle,\n} from '@/components/ui/card';`,
      importar('chart', 'createChart'),
    ].join('\n'),
    bloco,
    `const card = createCard({ class: 'nds-w-sm' });

const cabecalho = createCardHeader();
cabecalho.append(
  createCardTitle({ text: ${texto(o.cardTitle ?? 'Acessos mensais')} }),
  createCardDescription({ text: ${texto(o.cardDescription ?? 'Janeiro — Junho de 2024')} }),
);`,
    `const conteudo = createCardContent();
conteudo.appendChild(${chamada('createChart', linhas)});

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
