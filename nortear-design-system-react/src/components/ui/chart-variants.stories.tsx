import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
  buildFunnelOption,
  buildRadarOption,
  buildPieNestOption,
  buildScatterOption,
} from './chart';
import {
  designEscreve,
  distinctShapes,
  waitForStableCount,
  datumFormas,
  settleTheme,
  tokenColor,
} from '@shared/testing/chart-probe';
import {
  designPronto,
  drawingOf,
  drawingSettled,
  filledShapes,
  hatchColors,
  hatchedShapes,
  headerOf,
  optionOf,
  radarHatches,
  radarPolygons,
  rowsOf,
} from './chart.fixtures';
import {
  chartAreaSource,
  chartFunnelSource,
  chartLineSource,
  chartPizzaSource,
  chartRadarSource,
  chartPieNestSource,
  chartScatterSource,
  chartSource,
} from './chart.source';

import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

/**
 * Séries da dispersão: um grupo do agrupamento compartilhado por série.
 *
 * O agrupamento vem PRONTO de `docs/shared/primitives`, gerado uma vez por
 * `scripts/gerar-agrupamento-scatter.mjs`. Rodar o k-means aqui faria o desenho
 * mudar sozinho entre rodadas — medido, a partição se repete de 92 a 98 vezes em
 * 100 —, e a tabela equivalente descreveria um agrupamento diferente do que está
 * na tela.
 */
const scatterSeries = CHART_SCATTER_CLUSTERS.map((c) => ({ name: c.name, points: c.points }));
const scatterPoints = scatterSeries.reduce((n, s) => n + s.points.length, 0);
const SCATTER_X = 'Minutos na página';
const SCATTER_Y = 'Páginas vistas';
const serieUnica = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const seriesMulti = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
];

const dataDispositivo = [
  { label: 'Desktop', value: 1224 },
  { label: 'Mobile', value: 860 },
  { label: 'Tablet', value: 320 },
];

/** Quatro etapas de um processo que afunila, da mais larga para a mais estreita. */
const funnelStages = [
  { label: 'Visitas', value: 4000 },
  { label: 'Cadastros', value: 2400 },
  { label: 'Carrinho', value: 1200 },
  { label: 'Compra', value: 480 },
];

/** A participação que a tabela escreve: cada etapa contra a PRIMEIRA. */
function shareOfFirst(value: number): string {
  const first = funnelStages[0].value;
  return `${Math.round((value / first) * 1000) / 10}%`;
}

const meta: Meta = {
  title: 'UI/Chart/Types',
  tags: ['display'],
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
};
export default meta;
type Story = StoryObj;

/**
 * Os traçados de série: caminho sem preenchimento e com traço grosso.
 *
 * A largura separa o traçado da linha de grade e do eixo, que o tema desenha
 * com 1px — sem ela, "existe um caminho vazado" seria verdade em qualquer
 * gráfico, inclusive num de barras.
 */
function tracadosDeSerie(root: HTMLElement): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const s = getComputedStyle(p);
    return s.fill === 'none' && s.stroke !== 'none' && parseFloat(s.strokeWidth || '0') >= 2;
  });
}

/** Caminhos preenchidos e largos — a região sob a linha, não o símbolo do ponto. */
function areasPreenchidas(root: HTMLElement, larguraMinima: number): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const fill = getComputedStyle(p).fill;
    if (fill === 'none' || /,\s*0\)\s*$/.test(fill)) return false;
    return p.getBBox().width >= larguraMinima;
  });
}

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: { description: { story: 'Comparação entre categorias discretas.' } },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: serieUnica })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Gráfico de barras: acessos mensais no desktop"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const month of meses) await expect(designEscreve(root, month)).toBe(true);
    });

    await step('As barras existem e têm área — o desenho não é casca vazia', async () => {
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThan(0);
      for (const forma of formas) {
        await expect(forma.getBoundingClientRect().width).toBeGreaterThan(0);
      }
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      // Outro construtor e mais de uma série: o snippet do meta ensina barras
      // com série única e esconderia as duas diferenças.
      source: { transform: chartLineSource },
      description: { story: 'Tendência contínua ao longo do tempo.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildLineOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Gráfico de linhas: acessos mensais por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('Uma linha traçada por série, com comprimento real', async () => {
      const tracados = tracadosDeSerie(root);
      await expect(tracados.length).toBeGreaterThanOrEqual(seriesMulti.length);
      for (const tracado of tracados) {
        // Caminho declarado mas sem comando de desenho mede zero e continua no
        // DOM: o comprimento é o que prova que a linha foi mesmo traçada.
        await expect(tracado.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('Cada série tem símbolo de ponto e traço próprios', async () => {
      // Aqui não há área a hachurar: a trama do `decal` cobre barra e fatia, e
      // numa linha ela não tem onde pousar. O que separa as séries quando a cor
      // sai de cena (WCAG 1.4.1) é a FORMA do ponto e o desenho do traço.
      //
      // A medida sai da option resolvida pela lib, e não do DOM: símbolo e
      // traço são decisão de configuração, e no `<svg>` do zrender o símbolo de
      // ponto sai com contorno de 0.44px — indistinguível de decoração por
      // qualquer filtro que se tente escrever sobre o desenho.
      const series = optionOf(root).series;
      await expect(series).toHaveLength(seriesMulti.length);

      const symbols = series.map((s) => String(s.symbol));
      await expect(new Set(symbols).size).toBe(seriesMulti.length);

      const dashes = series.map((s) => JSON.stringify((s.lineStyle as { type?: unknown })?.type));
      await expect(new Set(dashes).size).toBe(seriesMulti.length);
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(root, serie.name)).toBe(true);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const month of meses) await expect(designEscreve(root, month)).toBe(true);
    });

    await step('A tabela traz uma coluna por série e uma linha por categoria', async () => {
      await expect(headerOf(root)).toEqual(['Categoria', ...seriesMulti.map((s) => s.name)]);
      const rows = rowsOf(root);
      await expect(rows.map((row) => row[0])).toEqual(meses);
      for (const [iSeries, serie] of seriesMulti.entries()) {
        await expect(rows.map((row) => row[iSeries + 1])).toEqual(serie.data.map(String));
      }
    });
  },
};

export const Area: Story = {
  parameters: {
    docs: {
      // A área é um construtor próprio, e não uma bandeira do de linhas.
      source: { transform: chartAreaSource },
      description: { story: 'Tendência com ênfase no volume acumulado.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildAreaOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Gráfico de área: volume mensal de acessos por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('O traçado continua lá — a área é a linha com região abaixo', async () => {
      const tracados = tracadosDeSerie(root);
      await expect(tracados.length).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('E há região preenchida sob a linha, não só o símbolo do ponto', async () => {
      const svg = root.querySelector('svg')!;
      // Metade da largura do desenho: o símbolo de ponto tem 9px, a região sob
      // a linha atravessa o gráfico. A comparação é relativa porque o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const meiaWidth = svg.getBoundingClientRect().width / 2;
      const areas = areasPreenchidas(root, meiaWidth);
      await expect(areas.length).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      for (const month of meses) await expect(designEscreve(root, month)).toBe(true);
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // A pizza recebe outra FORMA de dado — pares de rótulo e valor, sem eixo
      // —, então o snippet do meta ensinaria uma chamada que aqui nem compila.
      source: { transform: chartPizzaSource },
      description: { story: 'Proporção de partes em relação ao todo.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildPieOption({ data: dataDispositivo })}
      className="nds-max-w-sm"
      height={280}
      aria-label="Distribuição de acessos por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('A legenda escreve o nome de cada fatia', async () => {
      for (const ponto of dataDispositivo) {
        await expect(designEscreve(root, ponto.label)).toBe(true);
      }
    });

    await step('Cada fatia tem preenchimento próprio — a cor não se repete', async () => {
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThanOrEqual(dataDispositivo.length);
      const preenchimentos = new Set(formas.map((f) => getComputedStyle(f).fill));
      await expect(preenchimentos.size).toBeGreaterThanOrEqual(dataDispositivo.length);
    });

    await step('A tabela escreve valor E participação — o ângulo vira número', async () => {
      // A pizza comunica parte contra o todo pelo ÂNGULO, e ângulo não se lê
      // sem enxergar. Sem a coluna de participação a alternativa textual
      // contaria menos que o desenho.
      await expect(headerOf(root)).toEqual(['Categoria', 'Valor', 'Participação']);

      const rows = rowsOf(root);
      await expect(rows.map((row) => row[0])).toEqual(dataDispositivo.map((p) => p.label));
      await expect(rows.map((row) => row[1])).toEqual(dataDispositivo.map((p) => String(p.value)));

      const total = dataDispositivo.reduce((sum, p) => sum + p.value, 0);
      await expect(rows.map((row) => row[2])).toEqual(
        dataDispositivo.map((p) => `${Math.round((p.value / total) * 1000) / 10}%`),
      );
    });
  },
};

/**
 * Funil: as etapas de um processo que afunila.
 *
 * O que o desenho comunica é a LARGURA de cada faixa em relação à primeira, e
 * largura não se lê em texto — daí a terceira coluna da tabela, pelo mesmo
 * raciocínio da participação da rosca. A story mede as cinco promessas do
 * contrato: a tabela equivalente, o papel de imagem no desenho (e não no
 * bloco), a trama na cor do fundo, o contorno em `--foreground` e o texto
 * medido a partir da fonte raiz.
 */
export const Funnel: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      // O funil recebe a mesma FORMA de dado da rosca — pares de rótulo e
      // valor, sem eixo —, então o snippet do meta ensinaria uma chamada que
      // aqui nem compila.
      source: { transform: chartFunnelSource },
      description: { story: 'Etapas de um processo, na ordem em que acontecem.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildFunnelOption({ data: funnelStages })}
      className="nds-max-w-sm"
      height={300}
      aria-label="Funil de conversão: da visita à compra"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);
    // A medida de forma exige a animação fechada: ver `drawingSettled`.
    await drawingSettled(root);

    await step('A legenda nomeia cada etapa por escrito', async () => {
      // O rótulo não é desenhado DENTRO da faixa de propósito: ali ele ficaria
      // por cima de uma cor de série que muda a cada posição. Quem nomeia a
      // etapa é a legenda, sobre o fundo da página.
      for (const stage of funnelStages) {
        await expect(designEscreve(root, stage.label)).toBe(true);
      }
    });

    await step('Uma faixa por etapa, na ordem em que as etapas foram declaradas', async () => {
      const bands = filledShapes(root)
        .map((band) => band.getBoundingClientRect())
        .sort((a, b) => a.top - b.top);
      await expect(bands).toHaveLength(funnelStages.length);
      // A ordenação sai da POSIÇÃO na tela, e não da ordem do documento: o que
      // a story promete é o que a pessoa vê, e não em que ordem a lib emitiu os
      // nós. O desenho NÃO reordena — a queda medida aqui é a das etapas como
      // foram declaradas, e é por isso que a mesma ordem sai na tabela abaixo.
      // A comparação é estrita: duas faixas de mesma largura já não contam a
      // perda entre as etapas.
      for (let i = 1; i < bands.length; i += 1) {
        await expect(bands[i].width).toBeLessThan(bands[i - 1].width);
      }
    });

    await step('A tabela escreve etapa, valor e participação na primeira', async () => {
      await expect(headerOf(root)).toEqual(['Categoria', 'Valor', 'Participação']);

      const rows = rowsOf(root);
      await expect(rows.map((row) => row[0])).toEqual(funnelStages.map((s) => s.label));
      await expect(rows.map((row) => row[1])).toEqual(funnelStages.map((s) => String(s.value)));
      // Contra a PRIMEIRA etapa, e não contra a soma: a largura da faixa nasce
      // da razão para o topo do funil, e é essa leitura que o texto precisa
      // repor. A primeira linha, portanto, é sempre 100%.
      await expect(rows.map((row) => row[2])).toEqual(
        funnelStages.map((s) => shareOfFirst(s.value)),
      );
      await expect(rows[0][2]).toBe('100%');
    });

    await step('O papel de imagem e o rótulo vão no desenho, não no bloco', async () => {
      const drawing = drawingOf(root);
      await expect(drawing.getAttribute('role')).toBe('img');
      await expect(drawing.getAttribute('aria-label')).toBe('Funil de conversão: da visita à compra');
      // No bloco, `role="img"` podaria a tabela junto e a alternativa textual
      // sumiria da árvore de acessibilidade.
      await expect(root.getAttribute('role')).toBeNull();
    });

    // Precondição das duas medidas de cor: ver o comentário de `settleTheme`.
    await settleTheme(document);

    await step('A trama sai na cor do fundo — não na lista padrão da lib', async () => {
      // Fora de qualquer `waitFor`: a sonda de cor mexe no `<body>`, e isso
      // acorda o observador de mutação que o `waitFor` usa para reagendar. O
      // prazo nunca chega, e o portão pendura em vez de reprovar.
      const hatches = hatchColors(root);
      await expect(hatches.length).toBeGreaterThan(0);
      await expect([...new Set(hatches)]).toEqual([tokenColor('background', root)]);
    });

    await step('Cada faixa é contornada em --foreground', async () => {
      const bands = filledShapes(root);
      await expect(bands.length).toBe(funnelStages.length);
      const foreground = tokenColor('foreground', root);
      for (const band of bands) {
        await expect(getComputedStyle(band).stroke).toBe(foreground);
      }
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
const radarAxes = [
  { label: 'Desempenho', max: 100 },
  { label: 'Acessibilidade', max: 100 },
  { label: 'Boas práticas', max: 10 },
  { label: 'SEO', max: 100 },
  { label: 'Conteúdo', max: 5 },
];

/** Duas medições do mesmo site, para o desenho ser uma comparação. */
const radarSeries = [
  { name: 'Antes', data: [72, 64, 6, 88, 2] },
  { name: 'Depois', data: [94, 97, 9, 96, 4] },
];

/**
 * Sessões por canal e origem — o dado da rosca aninhada.
 *
 * Cada ponto declara o GRUPO; o anel de dentro é derivado da soma. Três grupos e
 * cinco partes fazem 8 fatias na tela, e é essa contagem que a play mede: se a
 * derivação quebrar e o anel interno passar a ter um arco por PONTO, o número vai
 * a 10 e a story reprova.
 */
const nestData = [
  { label: 'Orgânica', value: 300, group: 'Busca' },
  { label: 'Paga', value: 100, group: 'Busca' },
  { label: 'Instagram', value: 200, group: 'Social' },
  { label: 'LinkedIn', value: 150, group: 'Social' },
  { label: 'App', value: 250, group: 'Direto' },
];
const nestGroups = [...new Set(nestData.map((d) => d.group))];
const nestSlices = nestGroups.length + nestData.length;

export const PieNest: Story = {
  parameters: {
    covers: ['functional.item11', 'visual.item8'],
    docs: {
      source: { transform: chartPieNestSource },
      description: {
        story: 'Dois anéis sobre o mesmo total. O de dentro reúne os canais, o de fora abre cada um em suas origens, e cada fatia externa cai no vão do seu canal.',
      },
    },
  },
  render: () => (
    <ChartContainer
      option={buildPieNestOption({ data: nestData })}
      className="nds-max-w-md"
      height={320}
      showData
      groupLabel="Canal"
      categoryLabel="Origem"
      aria-label="Sessões por canal e origem: três canais abertos em suas origens, em dois anéis"
     />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('Os dois anéis saem na tela — um arco por grupo, um por parte', async () => {
      // `drawingSettled` NÃO alcança a varredura da rosca: ele espera o
      // retângulo transparente da legenda ficar sozinho, o que já vale no
      // primeiro quadro, enquanto as fatias entram em ângulo zero. Medido aqui:
      // no instante em que ele volta, as oito fatias medem largura ZERO, e só
      // aos 1,5s chegam ao tamanho real.
      //
      // A espera é por RELÓGIO, e não `waitFor`: a leitura chama `getBBox()`,
      // que força layout, e condição que força layout dentro de `waitFor` se
      // realimenta pelo observador de mutação. Medido: dentro de `waitFor` a
      // asserção reprovou com ZERO forma depois de três segundos.
      await waitForStableCount(() => filledShapes(root).length);
      // Igualdade, e o número é o que prova a DERIVAÇÃO: três grupos mais cinco
      // partes. Se o anel de dentro passasse a ter um arco por ponto — o que
      // acontece quando alguém troca a soma por um mapa direto —, seriam dez.
      await expect(filledShapes(root)).toHaveLength(nestSlices);
    });

    await step('Cada fatia carrega uma trama — a cor não é o único sinal', async () => {
      // A rosca aninhada é de PREENCHIMENTO, então a trama alcança (ao contrário
      // da dispersão). Contar a hachura ao lado das formas, com o mesmo número
      // esperado, impede um coletor que exclui demais de ficar verde medindo
      // menos: se a exclusão comesse forma de dado, os dois números caem juntos.
      await expect(hatchedShapes(root)).toHaveLength(nestSlices);
    });

    await step('A legenda nomeia os dois níveis', async () => {
      for (const group of nestGroups) await expect(designEscreve(root, group)).toBe(true);
      for (const point of nestData) await expect(designEscreve(root, point.label)).toBe(true);
    });

    await step('A tabela traz as duas colunas de nome, uma linha por parte', async () => {
      await expect(headerOf(root)).toEqual(['Canal', 'Origem', 'Valor', 'Participação']);
      // Uma linha por PARTE. O grupo não ganha linha própria porque a
      // participação dele é derivável — soma das partes, na mesma coluna.
      await expect(rowsOf(root)).toHaveLength(nestData.length);
    });
  },
};

export const Scatter: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item7'],
    docs: {
      source: { transform: chartScatterSource },
      description: {
        story: 'Duas grandezas, uma em cada eixo, sem categoria no meio. Cada grupo é uma série, com forma própria: sem a cor, os grupos continuam separados.',
      },
    },
  },
  render: () => (
    <ChartContainer
      option={buildScatterOption({ series: scatterSeries, xLabel: SCATTER_X, yLabel: SCATTER_Y })}
      className="nds-max-w-md"
      height={320}
      showData
      seriesLabel="Grupo"
      aria-label="Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('O desenho sai com um ponto por par — nem um a mais', async () => {
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade, não piso: com "no mínimo", uma contagem inchada pelo ícone da
      // legenda passaria igual, e o portão só reprovaria com a tela vazia.
      await waitFor(() => expect(filledShapes(root)).toHaveLength(scatterPoints), { timeout: 3000 });
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
      await expect(distinctShapes(filledShapes(root)).size).toBe(scatterSeries.length);
    });

    await step('A legenda amarra cada forma ao nome do grupo', async () => {
      for (const serie of scatterSeries) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('Os dois eixos aparecem nomeados — posição sem grandeza não informa', async () => {
      await expect(designEscreve(root, SCATTER_X)).toBe(true);
      await expect(designEscreve(root, SCATTER_Y)).toBe(true);
    });

    await step('A tabela equivalente traz uma linha por ponto, com o grupo', async () => {
      // O cabeçalho das duas colunas de número sai do NOME DO EIXO do option —
      // o mesmo texto que a lib desenha ao lado do eixo, num lugar só.
      await expect(headerOf(root)).toEqual(['Grupo', SCATTER_X, SCATTER_Y]);
      await expect(rowsOf(root)).toHaveLength(scatterPoints);
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
        story: 'Várias grandezas de um mesmo item, uma por eixo, num polígono fechado. Cada eixo tem escala própria, e a tabela traz o máximo de cada um.',
      },
    },
  },
  render: () => (
    <ChartContainer
      option={buildRadarOption({ axes: radarAxes, series: radarSeries })}
      className="nds-max-w-md"
      height={320}
      categoryLabel="Eixo"
      maxLabel="Máximo"
      aria-label="Radar de qualidade do site: cinco grandezas, antes e depois da revisão"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);
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
        () => expect(radarPolygons(root)).toHaveLength(radarSeries.length),
        { timeout: 3000 },
      );
    });

    await step('Cada eixo aparece escrito em volta do polígono', async () => {
      // O nome do eixo é a única pista de QUE grandeza cada vértice mede.
      for (const axis of radarAxes) {
        await expect(designEscreve(root, axis.label)).toBe(true);
      }
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      // Os eixos nomeiam as grandezas, não as séries: sem a legenda, a única
      // pista de qual polígono é qual seria a cor.
      for (const serie of radarSeries) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('E a cor não é o único sinal: a trama alcança CADA polígono', async () => {
      // WCAG 1.4.1 — o polígono é forma PREENCHIDA, então a hachura chega nele
      // como chega à barra e à fatia. Uma trama por polígono, e não "pelo menos
      // uma": com o limite inferior, um desenho em que a hachura alcançasse só
      // a primeira série passava igual.
      await waitFor(
        () => expect(radarHatches(root)).toHaveLength(radarSeries.length),
        { timeout: 3000 },
      );
    });

    await step('A tabela traz eixo, máximo do eixo e o valor de cada série', async () => {
      // A coluna do meio é o que separa esta tabela da do gráfico de barras, e
      // ela existe porque o desenho comunica uma RAZÃO: o vértice é o valor
      // sobre o teto DAQUELE eixo. Sem o teto escrito, "9" e "96" seriam dois
      // números soltos e o polígono na tela não teria explicação.
      await expect(headerOf(root)).toEqual([
        'Eixo', 'Máximo', ...radarSeries.map((s) => s.name),
      ]);

      const rows = rowsOf(root);
      await expect(rows).toHaveLength(radarAxes.length);
      for (const [iAxis, axis] of radarAxes.entries()) {
        await expect(rows[iAxis]).toEqual([
          axis.label,
          String(axis.max),
          ...radarSeries.map((s) => String(s.data[iAxis])),
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
