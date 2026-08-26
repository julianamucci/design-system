import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption, buildFunnelOption,
  buildRadarOption,
  buildScatterOption,
} from './index';
import {
  designEscreve, distinctShapes, exigirRoot, settleTheme, tokenColor,
} from '@shared/testing/chart-probe';
import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';
import {
  drawingSettled, filledShapes, hatchedShapes, headerOf, radarHatches, radarPolygons,
  waitForDesign,
} from './chart.fixtures';
import {
  chartAreaSource,
  chartBarrasSource,
  chartFunnelSource,
  chartLinesSource,
  chartPizzaSource,
  chartRadarSource,
  chartScatterSource,
  chartSource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr'];
const VALUES = [186, 305, 237, 73];
const SERIE_UNICA = [{ name: 'Vendas', data: VALUES }];
const SERIES_MULTI = [
  { name: 'Desktop', data: VALUES },
  { name: 'Mobile', data: [80, 200, 120, 190] },
];
const DATA_DISPOSITIVO = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile', value: 420 },
  { label: 'Tablet', value: 180 },
];

/**
 * Etapas de um processo, da entrada à saída.
 *
 * A ordem é a do percurso, não a do valor, e é ela que dá sentido à coluna de
 * participação: 100%, 62%, 26% e 9% da PRIMEIRA etapa.
 */
const FUNNEL_STAGES = [
  { label: 'Visitas', value: 1000 },
  { label: 'Cadastros', value: 620 },
  { label: 'Carrinho', value: 260 },
  { label: 'Compra', value: 90 },
];

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada tipo de desenho
      // sobrescreve com o próprio montador logo abaixo.
      source: { transform: chartSource },
    },
  },
  title: 'UI/Chart/Variants',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

/**
 * Alturas das colunas de barra, na ordem do eixo.
 *
 * Uma entrada por coluna: `filledShapes` devolve só a camada de cor, e a trama
 * — que sai com a mesma geometria por cima — fica de fora. A ordenação sai da
 * POSIÇÃO em x, e não da ordem do documento: o que a story promete é o que a
 * pessoa vê, não em que ordem a lib emitiu os nós.
 */
function categoriaAlturas(root: HTMLElement): number[] {
  return filledShapes(root)
    .map((forma) => forma.getBoundingClientRect())
    .sort((a, b) => a.x - b.x)
    .map((r) => r.height);
}

/**
 * Os traçados de série — a curva de cada linha.
 *
 * O traçado é o caminho SEM preenchimento; o `C` no comando separa a curva da
 * série das linhas de grade, que também são `fill: none` mas vão de um ponto a
 * outro em reta.
 */
function seriesStrokes(root: HTMLElement): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter(
    (p) => getComputedStyle(p).fill === 'none' && (p.getAttribute('d') ?? '').includes('C'),
  );
}

/**
 * Largura de cada faixa do funil, de cima para baixo.
 *
 * Uma entrada por etapa, pelo mesmo motivo de `categoriaAlturas`: a camada de
 * cor sozinha. Nada de recortar as `count` primeiras — a fileira de ícones que
 * obrigava a esse corte já não entra, porque o coletor exclui a legenda.
 */
function bandWidths(root: HTMLElement): number[] {
  return filledShapes(root)
    .map((forma) => forma.getBoundingClientRect())
    .sort((a, b) => a.y - b.y)
    .map((r) => r.width);
}

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: {
      source: { transform: chartBarrasSource },
      description: { story: 'Barras — comparação entre categorias discretas.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('Toda categoria aparece escrita no eixo', async () => {
      await waitFor(() => {
        for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('Uma coluna por mês, com altura proporcional ao valor', async () => {
      // Igualdade, e não "pelo menos": o desenho tem uma coluna POR CATEGORIA, e
      // um limite inferior deixaria passar a contagem dobrada pela trama ou
      // inchada pela decoração da lib. Dentro do `waitFor` porque as barras
      // CRESCEM: a lib anima a altura a partir da linha de base, e enquanto a
      // animação corre a ordem medida ainda não é a final. Compara ORDEM, não
      // pixel — o desenho é responsivo e o número absoluto muda com a largura.
      const maiorValue = VALUES.indexOf(Math.max(...VALUES));
      const menorValue = VALUES.indexOf(Math.min(...VALUES));
      await waitFor(() => {
        const alturas = categoriaAlturas(root);
        expect(alturas).toHaveLength(MONTHS.length);
        expect(alturas.indexOf(Math.max(...alturas))).toBe(maiorValue);
        expect(alturas.indexOf(Math.min(...alturas))).toBe(menorValue);
      }, { timeout: 3000 });
    });

    await step('E a cor não é o único sinal: a trama alcança CADA coluna', async () => {
      // WCAG 1.4.1. Medir a trama com o mesmo número esperado da camada de cor é
      // o que impede um coletor que exclui demais de ficar verde medindo menos:
      // se a exclusão comesse forma de dado, os dois números cairiam juntos.
      await waitFor(
        () => expect(hatchedShapes(root)).toHaveLength(MONTHS.length),
        { timeout: 3000 },
      );
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      source: { transform: chartLinesSource },
      description: { story: 'Linhas — tendência ao longo de uma sequência contínua.' },
    },
  },
  args: {
    option: buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('Uma linha traçada por série', async () => {
      await expect(seriesStrokes(root)).toHaveLength(SERIES_MULTI.length);
      for (const traco of seriesStrokes(root)) {
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('As séries se distinguem por FORMA, não só por cor', async () => {
      // A trama do decal cumpre a WCAG 1.4.1 onde há área para tramar — barra e
      // fatia. A linha não tem área, e é aqui que a outra metade do critério se
      // cumpre: símbolo de ponto próprio e desenho de traço próprio por série.
      // Retirada toda a cor, o gráfico continua legível.
      const option = buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }) as {
        series: { symbol?: unknown; lineStyle?: { type?: unknown } }[];
      };
      const symbols = option.series.map((one) => String(one.symbol));
      await expect(new Set(symbols).size).toBe(SERIES_MULTI.length);
      const dashes = option.series.map((one) => JSON.stringify(one.lineStyle?.type));
      await expect(new Set(dashes).size).toBe(SERIES_MULTI.length);
    });

    await step('E o traço distinto chega ao desenho, não fica só na configuração', async () => {
      // Configuração verde com desenho errado é portão sem dentes: a série
      // tracejada tem de sair com stroke-dasharray no nó. getComputedStyle, e
      // não o atributo: o desenho do traço pode chegar por atributo ou por
      // estilo, e ler só um dos dois é medir meio caminho.
      //
      // A varredura é a das CURVAS de série, não a de todo caminho sem
      // preenchimento: contando grade e eixo junto, um desenho de duas séries
      // com o mesmo traço ainda somaria dois valores distintos e passaria por um
      // limite inferior. Aqui são tantos traços distintos quantas séries.
      const drawn = seriesStrokes(root).map((p) => getComputedStyle(p).strokeDasharray);
      await expect(new Set(drawn).size).toBe(SERIES_MULTI.length);
    });

    await step('A legenda nomeia cada série, e o eixo traz as categorias', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
      for (const month of MONTHS) await expect(designEscreve(root, month)).toBe(true);
    });
  },
};

export const Area: Story = {
  parameters: {
    docs: {
      source: { transform: chartAreaSource },
      description: { story: 'Área — linha com a região sob ela preenchida, para volume acumulado.' },
    },
  },
  args: {
    option: buildAreaOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('Cada série tem traçado E região preenchida', async () => {
      await expect(seriesStrokes(root)).toHaveLength(SERIES_MULTI.length);

      // A região é o que distingue a área da linha: preenchida, e translúcida
      // para não esconder a série de baixo. Uma por série, em igualdade: o
      // coletor já deixou de fora o vocabulário do `<defs>` e a legenda, então
      // não sobra nada a que um limite inferior servisse de folga.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(() => {
        const regioes = filledShapes(root).filter((forma) => {
          const opacity = Number(getComputedStyle(forma).fillOpacity);
          return opacity > 0 && opacity < 1;
        });
        expect(regioes).toHaveLength(SERIES_MULTI.length);
      }, { timeout: 3000 });
    });

    await step('As categorias continuam escritas no eixo', async () => {
      for (const month of MONTHS) await expect(designEscreve(root, month)).toBe(true);
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      source: { transform: chartPizzaSource },
      description: { story: 'Pizza (rosca) — composição de um total entre poucas partes.' },
    },
  },
  args: {
    option: buildPieOption({ data: DATA_DISPOSITIVO }),
    height: 280,
    class: 'nds-w-full',
    'aria-label': 'Distribuição de acessos por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('A legenda escreve o nome de cada fatia — a cor não é o único sinal', async () => {
      await waitFor(() => {
        for (const ponto of DATA_DISPOSITIVO) {
          expect(designEscreve(root, ponto.label)).toBe(true);
        }
      }, { timeout: 3000 });
    });

    await step('Uma fatia desenhada por dado — nem uma a mais', async () => {
      // Igualdade. Com "no mínimo", a contagem dobrada pela trama e a inchada
      // pelos ícones da legenda passavam as duas: o portão só reprovava se o
      // desenho saísse VAZIO.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(DATA_DISPOSITIVO.length),
        { timeout: 3000 },
      );
    });

    await step('E a cor não é o único sinal: a trama alcança CADA fatia', async () => {
      // WCAG 1.4.1. O mesmo número esperado da camada de cor: se a exclusão do
      // coletor passasse a comer forma de dado, os dois números cairiam juntos.
      await waitFor(
        () => expect(hatchedShapes(root)).toHaveLength(DATA_DISPOSITIVO.length),
        { timeout: 3000 },
      );
    });
  },
};

export const Funnel: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      source: { transform: chartFunnelSource },
      description: {
        story: 'Funil — etapas de um processo que afunila. A largura de cada faixa é a participação dela em relação à primeira etapa.',
      },
    },
  },
  args: {
    option: buildFunnelOption({ data: FUNNEL_STAGES }),
    height: 280,
    class: 'nds-w-full',
    shareLabel: 'Participação',
    'aria-label': 'Funil de conversão: visitas, cadastros, carrinho e compra',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('A legenda escreve o nome de CADA etapa', async () => {
      // A faixa não tem eixo que a nomeie e não leva rótulo por dentro: sem a
      // legenda escrita, a única pista da etapa seria a cor.
      await waitFor(() => {
        for (const stage of FUNNEL_STAGES) {
          expect(designEscreve(root, stage.label)).toBe(true);
        }
      }, { timeout: 3000 });
    });

    await step('Uma faixa desenhada por etapa — nem uma a mais', async () => {
      // Igualdade. Com "no mínimo", quatro etapas passavam com o dobro de formas
      // na conta — a trama de cada faixa mais os ícones da legenda —, e o portão
      // só reprovava se o desenho saísse vazio.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(FUNNEL_STAGES.length),
        { timeout: 3000 },
      );
    });

    await step('As faixas afunilam, e a largura de cada uma é a participação', async () => {
      // A largura é o que o desenho comunica, e a coluna de participação é o
      // que a escreve — as duas medidas têm de ser a MESMA. Dentro de um
      // `waitFor` porque as faixas crescem: a lib as anima, e enquanto a
      // animação corre a largura medida ainda não é a final.
      const entry = FUNNEL_STAGES[0].value;
      await waitFor(() => {
        const widths = bandWidths(root);
        expect(widths).toHaveLength(FUNNEL_STAGES.length);
        for (const [i, stage] of FUNNEL_STAGES.entries()) {
          if (i > 0) expect(widths[i]).toBeLessThan(widths[i - 1]);
          // Tolerância de uma casa: o contorno de 1px engorda a caixa medida
          // nas duas pontas, e a comparação é de proporção, não de pixel.
          expect(widths[i] / widths[0]).toBeCloseTo(stage.value / entry, 1);
        }
      }, { timeout: 3000 });
    });

    await step('A tabela traz etapa, valor e participação em relação à primeira', async () => {
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', 'Valor', 'Participação']);

      const entry = FUNNEL_STAGES[0].value;
      const rows = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(FUNNEL_STAGES.length);
      for (const [i, row] of rows.entries()) {
        await expect(row.querySelector('th')?.textContent?.trim()).toBe(FUNNEL_STAGES[i].label);
        const cells = [...row.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells[0]).toBe(String(FUNNEL_STAGES[i].value));
        await expect(cells[1]).toBe(`${Math.round((FUNNEL_STAGES[i].value / entry) * 1000) / 10}%`);
      }
    });

    await step('E a cor não é o único sinal: a trama alcança CADA faixa', async () => {
      // WCAG 1.4.1 — a faixa é forma PREENCHIDA, então a hachura chega nela
      // como chega à barra e à fatia. Uma trama por faixa, e não "pelo menos
      // uma": com o limite inferior, um desenho em que a hachura alcançasse só a
      // primeira etapa passava igual. Que ela é traçada na cor do fundo, e não
      // na lista padrão da lib, é propriedade do tema compartilhado pelos tipos
      // e está medida na story de contraste gráfico.
      await waitFor(
        () => expect(hatchedShapes(root)).toHaveLength(FUNNEL_STAGES.length),
        { timeout: 3000 },
      );
    });
  },
};

/**
 * Cinco grandezas de um mesmo item, uma por eixo.
 *
 * Os tetos são DIFERENTES de propósito — 100, 100, 10, 100 e 5. É essa
 * diferença que a coluna de máximo existe para escrever: o 9 de "Boas práticas"
 * é um vértice quase no anel de fora, e o 96 de "SEO" também; só a tabela pode
 * dizer que um vale 9 e o outro 96 sem que o polígono tenha mentido.
 */
const RADAR_AXES = [
  { label: 'Desempenho', max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas', max: 10 },
  { label: 'SEO', max: 100 },
  { label: 'Conteúdo', max: 5 },
];

/** Duas medições do mesmo site, para o desenho ser uma comparação. */
const RADAR_SERIES = [
  { name: 'Antes', data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
];

/**
 * Séries da dispersão: um grupo do agrupamento compartilhado por série.
 *
 * O agrupamento vem PRONTO de `docs/shared/primitives`, gerado uma vez por
 * `scripts/gerar-agrupamento-scatter.mjs`. Rodar o k-means aqui faria o desenho
 * mudar sozinho entre rodadas — medido, a partição se repete de 92 a 98 vezes em
 * 100 — e a tabela equivalente descreveria outro agrupamento.
 */
const SCATTER_SERIES = CHART_SCATTER_CLUSTERS.map((c) => ({ name: c.name, points: c.points }));
const SCATTER_POINTS = SCATTER_SERIES.reduce((n, s) => n + s.points.length, 0);
const SCATTER_X = 'Minutos na página';
const SCATTER_Y = 'Páginas vistas';

export const Scatter: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item7'],
    docs: {
      source: { transform: chartScatterSource },
      description: {
        story: 'Dispersão — duas grandezas, uma em cada eixo, sem categoria no meio. Cada grupo é uma série, com forma própria: sem a cor, os grupos continuam separados.',
      },
    },
  },
  args: {
    option: buildScatterOption({ series: SCATTER_SERIES, xLabel: SCATTER_X, yLabel: SCATTER_Y }),
    height: 320,
    class: 'nds-w-full',
    showData: true,
    seriesLabel: 'Grupo',
    'aria-label': 'Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('O desenho sai com um ponto por par — nem um a mais', async () => {
      // Igualdade, não piso: com "no mínimo", uma contagem inchada pelo ícone da
      // legenda passaria igual, e o portão só reprovaria com a tela vazia.
      await waitFor(() => expect(filledShapes(root)).toHaveLength(SCATTER_POINTS), { timeout: 3000 });
    });

    await step('Cada grupo tem uma FORMA própria — é ela que separa sem a cor', async () => {
      // O passo que a dispersão exige e os outros tipos não.
      //
      // Nos tipos de área a WCAG 1.4.1 é cumprida pela trama, e há portão para
      // ela. Aqui a trama não serve — num símbolo de 14px cabe uma repetição do
      // ladrilho, e duas tramas diferentes saem iguais —, então quem separa é a
      // forma, e é a forma que precisa ser medida.
      //
      // Medida no DOM, não no option: o option provaria que a forma foi PEDIDA.
      // A assinatura é a sequência de letras de comando do `d`, invariante à
      // posição — circle sai `MAA`, rect `MlllZ`, triangle `MLLZ`.
      await expect(distinctShapes(filledShapes(root)).size).toBe(SCATTER_SERIES.length);
    });

    await step('A legenda amarra cada forma ao nome do grupo', async () => {
      for (const serie of SCATTER_SERIES) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('Os dois eixos aparecem nomeados — posição sem grandeza não informa', async () => {
      await expect(designEscreve(root, SCATTER_X)).toBe(true);
      await expect(designEscreve(root, SCATTER_Y)).toBe(true);
    });

    await step('A tabela equivalente traz uma linha por ponto, com o grupo', async () => {
      // O cabeçalho das duas colunas de número sai do NOME DO EIXO do option — o
      // mesmo texto que a lib desenha ao lado do eixo, num lugar só.
      await expect(headerOf(root)).toEqual(['Grupo', SCATTER_X, SCATTER_Y]);
      const data = root.querySelector('[data-slot="chart-data"]');
      await expect(data?.querySelectorAll('tbody tr')).toHaveLength(SCATTER_POINTS);
    });
  },
};

export const Radar: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: {
      // O radar não tem eixo de categorias nem lista simples: o dado dele são
      // os EIXOS (nome mais teto) de um lado e as séries do outro — e é essa
      // forma que o snippet precisa ensinar.
      source: { transform: chartRadarSource },
      description: {
        story: 'Radar — várias grandezas de um mesmo item, uma por eixo, num polígono fechado. Cada eixo tem escala própria, e a tabela traz o máximo de cada um.',
      },
    },
  },
  args: {
    option: buildRadarOption({ axes: RADAR_AXES, series: RADAR_SERIES }),
    height: 320,
    class: 'nds-w-full',
    categoryLabel: 'Eixo',
    maxLabel: 'Máximo',
    'aria-label': 'Radar de qualidade do site: cinco grandezas, antes e depois da revisão',
  },
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
    // Ela também é o que garante que os anéis do radar não deixaram um retângulo
    // transparente extra na tela — a faixa alternada do padrão da lib fica
    // DESLIGADA no tema exatamente por isso.
    await drawingSettled(root);

    await step('O desenho sai com um polígono por série — nem um a mais', async () => {
      // Igualdade. Com "no mínimo", passariam tanto a contagem dobrada pela
      // trama quanto a inchada pelos dez símbolos de vértice — o portão só
      // reprovaria com o desenho vazio.
      //
      // `waitFor`: a geometria assenta DEPOIS da marca de opacidade que
      // `drawingSettled` observa, e o polígono do radar entra crescendo a partir
      // do centro. Só leitura aqui dentro; nada que mexa no DOM.
      await waitFor(
        () => expect(radarPolygons(root)).toHaveLength(RADAR_SERIES.length),
        { timeout: 3000 },
      );
    });

    await step('Cada eixo aparece escrito em volta do polígono', async () => {
      // O nome do eixo é a única pista de QUE grandeza cada vértice mede.
      for (const axis of RADAR_AXES) {
        await expect(designEscreve(root, axis.label)).toBe(true);
      }
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      // Os eixos nomeiam as grandezas, não as séries: sem a legenda, a única
      // pista de qual polígono é qual seria a cor.
      for (const serie of RADAR_SERIES) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('E a cor não é o único sinal: a trama alcança CADA polígono', async () => {
      // WCAG 1.4.1 — o polígono é forma PREENCHIDA, então a hachura chega nele
      // como chega à barra e à fatia. Uma trama por polígono, e não "pelo menos
      // uma": com o limite inferior, um desenho em que a hachura alcançasse só
      // a primeira série passava igual.
      await waitFor(
        () => expect(radarHatches(root)).toHaveLength(RADAR_SERIES.length),
        { timeout: 3000 },
      );
    });

    await step('A tabela traz eixo, máximo do eixo e o valor de cada série', async () => {
      // A coluna do meio é o que separa esta tabela da do gráfico de barras, e
      // ela existe porque o desenho comunica uma RAZÃO: o vértice é o valor
      // sobre o teto DAQUELE eixo. Sem o teto escrito, "9" e "96" seriam dois
      // números soltos e o polígono na tela não teria explicação.
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Eixo', 'Máximo', ...RADAR_SERIES.map((s) => s.name)]);

      const rows = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(RADAR_AXES.length);
      for (const [i, row] of rows.entries()) {
        await expect(row.querySelector('th')?.textContent?.trim()).toBe(RADAR_AXES[i].label);
        const cells = [...row.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells).toEqual([
          String(RADAR_AXES[i].max),
          ...RADAR_SERIES.map((s) => String(s.data[i])),
        ]);
      }
    });

    // Precondição da medida de cor: ver o comentário de `settleTheme`.
    await settleTheme(document);

    await step('Os eixos do radar saem do TEMA, e não do padrão da lib', async () => {
      // O radar é o único tipo com eixos PRÓPRIOS, e sem bloco de tema eles
      // nascem nos cinzas cravados da lib: um gráfico do design system com
      // eixos que não são do design system. Este passo é o que impede isso de
      // voltar calado.
      //
      // A sonda de token é resolvida AQUI, fora de qualquer espera:
      // `tokenColor` pendura um elemento no `<body>`, e leitura que mexe no DOM
      // dentro de `waitFor` provoca a própria retentativa — o prazo nunca chega
      // e a aba morre sem reprovar.
      const mutedForeground = tokenColor('muted-foreground', root);

      const axisName = [...root.querySelectorAll<SVGTextElement>('svg text')]
        .find((node) => (node.textContent ?? '').trim() === 'SEO');
      await expect(axisName).toBeDefined();
      // O nome do eixo é TEXTO, então segue a cor de texto secundário do tema.
      await expect(getComputedStyle(axisName!).fill).toBe(mutedForeground);
      // E o tamanho é MEDIDO, não cravado: o degrau de 0.75 sobre a fonte raiz
      // — o mesmo do rótulo do eixo cartesiano. Com pixel escolhido, o nome
      // pararia de crescer quando a pessoa aumenta a fonte do navegador
      // (WCAG 1.4.4), enquanto o resto da página cresce ao lado.
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(getComputedStyle(axisName!).fontSize)
        .toBe(`${Math.round(rootSize * 0.75)}px`);
    });
  },
};
