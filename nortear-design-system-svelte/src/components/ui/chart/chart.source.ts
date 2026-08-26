/**
 * Transforms do painel Code do Chart.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Por isso a frase padrão do estado vazio é
 * repetida aqui — o barrel do componente exporta o próprio container, e
 * importar de lá arrastaria o `.svelte` para dentro do teste.
 */
import { svelteSnippet } from '@/lib/story-source';

export type ChartArgs = {
  renderer: 'svg' | 'canvas';
  height: number;
  class: string;
  emptyLabel: string;
  'aria-label': string;
};

/** Mesmo valor de `CHART_EMPTY_LABEL`; só difere do padrão entra no snippet. */
const FRASE_VAZIA_DEFAULT = 'Sem dados para exibir';

const LABEL_DEFAULT = 'Acessos mensais no desktop, de janeiro a junho';

const DATA_SEMESTER = `const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const series = [{ name: 'Vendas', data: [186, 305, 237, 73, 209, 214] }];`;

const DATA_SERIE_UNICA = `const meses = ['Jan', 'Fev', 'Mar', 'Abr'];
const series = [{ name: 'Vendas', data: [186, 305, 237, 73] }];`;

const DATA_DOIS_APARELHOS = `const meses = ['Jan', 'Fev', 'Mar', 'Abr'];
const series = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile', data: [80, 200, 120, 190] },
];`;

const DATA_TRES_APARELHOS = `const meses = ['Jan', 'Fev', 'Mar', 'Abr'];
const series = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile', data: [80, 200, 120, 190] },
  { name: 'Tablet', data: [40, 90, 60, 100] },
];`;

/** Bloco `<script>` com o import do container e o(s) montador(es) usados. */
function script(montadores: string[], data = ''): string {
  const imports = `import { ChartContainer, ${montadores.join(', ')} } from "@/components/ui/chart";`;
  return data ? `${imports}\n\n${data}` : imports;
}

/** Uma linha por atributo: a lista cresce com a configuração do desenho. */
function grafico(props: Array<string | false | ''>, recuo = ''): string {
  const list = props.filter((prop): prop is string => Boolean(prop));
  return `<ChartContainer\n${list.map((prop) => `${recuo}  ${prop}`).join('\n')}\n${recuo}/>`;
}

/**
 * Forma canônica: um desenho de barras configurado pelos args da story.
 *
 * Serve o Playground e cascateia para as stories que não declaram override.
 */
export function chartSource(_gerado?: string, ctx?: { args?: Partial<ChartArgs> }): string {
  const a = ctx?.args ?? {};

  return svelteSnippet(
    script(['buildBarOption'], DATA_SEMESTER),
    grafico([
      'option={buildBarOption({ xAxis: meses, series })}',
      a.height !== undefined ? `height={${a.height}}` : '',
      a.class ? `class="${a.class}"` : '',
      a.renderer && a.renderer !== 'svg' ? `renderer="${a.renderer}"` : '',
      a.emptyLabel && a.emptyLabel !== FRASE_VAZIA_DEFAULT ? `emptyLabel="${a.emptyLabel}"` : '',
      // O rótulo é o contrato de acessibilidade do componente: o snippet mostra
      // sempre, porque é ele que substitui o desenho para quem não o enxerga.
      `aria-label="${a['aria-label'] ?? LABEL_DEFAULT}"`,
    ]),
  );
}

/**
 * Variação `Bar`, e também `SingleSeries` e `WithTooltip`: o mesmo desenho de
 * barras com uma série só.
 */
export function chartBarrasSource(): string {
  return svelteSnippet(
    script(['buildBarOption'], DATA_SERIE_UNICA),
    grafico([
      'option={buildBarOption({ xAxis: meses, series })}',
      'height={240}',
      'class="nds-w-full"',
      'aria-label="Gráfico de barras: acessos mensais no desktop"',
    ]),
  );
}

/** Variação `Line`: tendência ao longo de uma sequência, uma linha por série. */
export function chartLinesSource(): string {
  return svelteSnippet(
    script(['buildLineOption'], DATA_DOIS_APARELHOS),
    grafico([
      'option={buildLineOption({ xAxis: meses, series })}',
      'height={240}',
      'class="nds-w-full"',
      'aria-label="Gráfico de linhas: acessos mensais por dispositivo"',
    ]),
  );
}

/** Variação `Area`: a linha com a região sob ela preenchida. */
export function chartAreaSource(): string {
  return svelteSnippet(
    script(['buildAreaOption'], DATA_DOIS_APARELHOS),
    grafico([
      'option={buildAreaOption({ xAxis: meses, series })}',
      'height={240}',
      'class="nds-w-full"',
      'aria-label="Gráfico de área: volume mensal de acessos por dispositivo"',
    ]),
  );
}

/** Variação `Pie`: composição de um total entre poucas partes. */
export function chartPizzaSource(): string {
  return svelteSnippet(
    script(
      ['buildPieOption'],
      `const dispositivos = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];`,
    ),
    grafico([
      'option={buildPieOption({ data: dispositivos })}',
      'height={280}',
      'class="nds-w-full"',
      'aria-label="Distribuição de acessos por dispositivo"',
    ]),
  );
}

/**
 * Variação `Funnel`: etapas de um processo que afunila.
 *
 * A lista sai da entrada para a saída — a ordem é o percurso, e é ela que dá
 * sentido à coluna de participação da tabela, que se refere à primeira linha.
 */
export function chartFunnelSource(): string {
  return svelteSnippet(
    script(
      ['buildFunnelOption'],
      `const etapas = [
  { label: 'Visitas', value: 1000 },
  { label: 'Cadastros', value: 620 },
  { label: 'Carrinho', value: 260 },
  { label: 'Compra', value: 90 },
];`,
    ),
    grafico([
      'option={buildFunnelOption({ data: etapas })}',
      'height={280}',
      'class="nds-w-full"',
      // Cabeçalho da terceira coluna da tabela de dados: a participação de cada
      // etapa em relação à primeira, que é o que a largura da faixa desenha.
      'shareLabel="Participação"',
      'aria-label="Funil de conversão: visitas, cadastros, carrinho e compra"',
    ]),
  );
}

/**
 * Estado `Empty`: sem série com dado entra a frase no lugar do desenho.
 *
 * Sem `aria-label` de propósito — sem desenho não há papel de imagem, e a frase
 * é o conteúdo que o leitor de tela precisa alcançar.
 */
export function chartEmptySource(): string {
  return svelteSnippet(
    script(['buildBarOption']),
    grafico([
      'option={buildBarOption({ data: [] })}',
      'height={240}',
      'class="nds-w-full"',
      'emptyLabel="Nenhum dado disponível para o período selecionado."',
    ]),
  );
}

/**
 * Estados `MultiSeries` e `GraphicContrast`: mais de uma série no mesmo
 * desenho, com legenda automática e trama própria por série.
 */
export function chartMultiSerieSource(): string {
  return svelteSnippet(
    script(['buildBarOption'], DATA_TRES_APARELHOS),
    grafico([
      'option={buildBarOption({ xAxis: meses, series })}',
      'height={280}',
      'class="nds-w-full"',
      'aria-label="Acessos mensais por dispositivo: desktop, mobile e tablet"',
    ]),
  );
}

/** Configuração `WithCaption`: a legenda forçada mesmo com uma série só. */
export function chartWithCaptionSource(): string {
  return svelteSnippet(
    script(['buildBarOption'], DATA_SERIE_UNICA),
    grafico([
      'option={buildBarOption({ xAxis: meses, series, showLegend: true })}',
      'height={260}',
      'class="nds-w-full"',
      'aria-label="Gráfico de barras com legenda: acessos mensais no desktop"',
    ]),
  );
}

/** Configuração `MultipleSeries`: várias séries com título no próprio desenho. */
export function chartWithTitleSource(): string {
  return svelteSnippet(
    script(['buildBarOption'], DATA_TRES_APARELHOS),
    grafico([
      "option={buildBarOption({ xAxis: meses, series, title: 'Acessos por dispositivo' })}",
      'height={300}',
      'class="nds-w-full"',
      'aria-label="Acessos por dispositivo: desktop, mobile e tablet, de janeiro a abril"',
    ]),
  );
}

/**
 * Composição `InlineTitle`: o título dentro do desenho, para quando o gráfico é
 * servido sozinho. Sem rótulo autoral, o container cai no padrão genérico.
 */
export function designChartTitleSource(): string {
  return svelteSnippet(
    script(['buildBarOption'], DATA_SERIE_UNICA),
    grafico([
      "option={buildBarOption({ xAxis: meses, series, title: 'Vendas mensais' })}",
      'height={260}',
      'class="nds-w-full"',
    ]),
  );
}

/** Composição `WithCard`: título e apoio no cabeçalho do card, desenho no corpo. */
export function chartEmCardSource(): string {
  return svelteSnippet(
    `import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
${script(['buildBarOption'], DATA_SERIE_UNICA)}`,
    `<Card class="nds-w-sm">
  <CardHeader>
    <CardTitle>Acessos mensais</CardTitle>
    <CardDescription>Janeiro a abril, acessos no desktop.</CardDescription>
  </CardHeader>
  <CardContent>
    ${grafico(
      [
        'option={buildBarOption({ xAxis: meses, series })}',
        'height={200}',
        'class="nds-w-full"',
        'aria-label="Gráfico de barras: acessos mensais no desktop, de janeiro a abril"',
      ],
      '    ',
    )}
  </CardContent>
</Card>`,
  );
}

/**
 * Estado `ThemeTokens`: dois tipos empilhados sobre a mesma série, que é o que
 * a foto de tema precisa cobrir.
 */
export function chartDoisTypesSource(): string {
  return svelteSnippet(
    script(['buildBarOption', 'buildLineOption'], DATA_TRES_APARELHOS),
    `<div class="nds-stack nds-w-full">
  ${grafico(
    [
      'option={buildBarOption({ xAxis: meses, series })}',
      'height={260}',
      'class="nds-w-full"',
      'aria-label="Acessos mensais por dispositivo, em barras"',
    ],
    '  ',
  )}
  ${grafico(
    [
      'option={buildLineOption({ xAxis: meses, series })}',
      'height={260}',
      'class="nds-w-full"',
      'aria-label="Acessos mensais por dispositivo, em linhas"',
    ],
    '  ',
  )}
</div>`,
  );
}
