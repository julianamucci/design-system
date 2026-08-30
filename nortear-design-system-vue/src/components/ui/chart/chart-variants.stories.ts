import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  designEscreve,
  designTextsOutsideLegend,
  designPintado,
  distinctShapes,
  isPainted,
  pointerOver,
  waitForStableCount,
  exigirRoot,
  datumFormas,
  designTexts,
  settleTheme,
  tokenColor,
} from '@shared/testing/chart-probe';
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption, buildFunnelOption,
  buildRadarOption,
  buildPieNestOption,
  buildScatterOption,
} from './index';
import {
  decalColors, drawingOf, drawingSettled, filledShapes, hatchedShapes, headerOf,
  radarHatches, radarPolygons, rowsOf,
} from './chart.fixtures';
import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';
import {
  chartAreaSource,
  chartBarSource,
  chartFunnelSource,
  chartLineSource,
  chartPieSource,
  chartRadarSource,
  chartScatterSource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile',  data: [80, 200, 120, 190, 130, 140] },
];
const DISPOSITIVOS = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile',  value: 420 },
  { label: 'Tablet',  value: 180 },
];

/** Quatro etapas de um processo que afunila, da mais larga para a mais estreita. */
const FUNNEL_STAGES = [
  { label: 'Visitas',   value: 4000 },
  { label: 'Cadastros', value: 2400 },
  { label: 'Carrinho',  value: 1200 },
  { label: 'Compra',    value: 480 },
];

/** A participação que a tabela escreve: cada etapa contra a PRIMEIRA. */
function shareOfFirst(value: number): string {
  const first = FUNNEL_STAGES[0].value;
  return `${Math.round((value / first) * 1000) / 10}%`;
}

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartBarSource } },
  },
  title: 'Primitives/Display/Chart/Variants',
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    docs: { description: { story: 'Barras — comparação entre categorias discretas.' } },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com forma de dado, não só eixo', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // `datumFormas` recorta o que é preenchido E contornado: linha de grade e
      // eixo têm `fill: none` e ficam de fora sem precisar saber como a lib
      // nomeia seus grupos.
      await expect(datumFormas(root).length).toBeGreaterThan(0);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      await waitFor(
        () => {
          for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
        },
        { timeout: 3000 },
      );
    });
    await step('A forma sob o ponteiro continua pintada — realce não pode apagá-la', async () => {
      // Nenhuma suíte daqui exercitava o ponteiro, e foi ali que um defeito
      // visível ao usuário viveu sem portão: ao passar o mouse, a forma sob ele
      // desaparecia junto com a trama, e só voltava se o cursor caísse
      // exatamente sobre uma linha da hachura.
      //
      // A causa não estava no desenho e sim na COR: o helper de tema emitia a
      // sintaxe CSS separada por espaço, que o navegador entende e o analisador
      // da lib não. Sem conseguir ler a base, o realce virava `fill: none`.
      //
      // A asserção é sobre a FORMA e sobre a TRAMA dela: as duas apagavam
      // juntas, e medir só uma deixaria metade do defeito passar.
      // O passo estabelece a PRÓPRIA precondição — não pode depender de onde
      // foi enfiado na play nem do que o passo anterior deixou. A espera é por
      // relógio porque a leitura força layout.
      await waitForStableCount(() => filledShapes(root).length);
      const antes = filledShapes(root);
      await expect(antes.length).toBeGreaterThan(1);
      const alvo = antes[1];
      const trama = alvo.nextElementSibling;

      await pointerOver(alvo);

      await expect(isPainted(alvo)).toBe(true);
      await expect(trama).not.toBeNull();
      await expect(isPainted(trama!)).toBe(true);
    });
    await step('O rótulo de valor sai do TEMA, e sem halo', async () => {
      // Com uma série só, este tipo escreve o valor em cima da coluna. O que a
      // lib desenha ali por padrão é cinza `#333` fixo, halo branco de 2px e
      // corpo de 12px cravado — nenhum dos três conhece o tema.
      //
      // Medido contra o fundo da página: no claro o `#333` dá 12.46 e o halo
      // 1.01, então funcionava POR ACIDENTE; no escuro o texto cai para 1.06 e
      // o halo sobe para 13.36 — o número vira o próprio contorno, borrado.
      //
      // Por isso a asserção é de IGUALDADE com o token, e não de contraste: a
      // story roda no modo claro, onde a cor errada passaria sem dificuldade e
      // um portão de contraste ficaria verde com o defeito de pé.
      const valueLabel = [...root.querySelectorAll<SVGTextElement>('svg text')]
        .find((t) => t.textContent === '305');
      await expect(valueLabel).toBeDefined();

      const pintura = getComputedStyle(valueLabel!);
      await expect(pintura.fill).toBe(tokenColor('foreground', root));

      // A medida é a COR do traço, e não a largura: sem traço, `strokeWidth`
      // computado devolve 1, que é o valor inicial do SVG e não pinta nada.
      await expect(['none', 'rgba(0, 0, 0, 0)']).toContain(pintura.stroke);
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    // Outro builder e duas séries em vez de uma — a do meta mostraria barras
    // com série única, que é outra composição.
    docs: {
      source: { transform: chartLineSource },
      description: { story: 'Linhas — tendência contínua ao longo do tempo.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 260,
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Uma linha traçada por série', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // O traçado é o caminho SEM preenchimento e com espessura própria (2px do
      // tema). Eixo, marca e linha de grade também são `fill: none`, mas ficam
      // na espessura 1 — é a espessura que separa dado de moldura aqui.
      const tracados = [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
        const estilo = getComputedStyle(p);
        return estilo.fill === 'none' && parseFloat(estilo.strokeWidth || '0') >= 2;
      });
      await expect(tracados.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
      for (const tracado of tracados) {
        await expect(tracado.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('As séries se distinguem por FORMA, não só por cor', async () => {
      // A trama do `decal` cumpre a WCAG 1.4.1 onde há área para tramar — barra
      // e fatia. A linha não tem área, e é aqui que a outra metade do critério
      // se cumpre: símbolo de ponto próprio e desenho de traço próprio por
      // série. Retirada toda a cor, o gráfico continua legível.
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
      // tracejada tem de sair com `stroke-dasharray` no nó.
      const drawn = [...root.querySelectorAll<SVGPathElement>('svg path')]
        .filter((p) => getComputedStyle(p).fill === 'none')
        // `getComputedStyle`, e não o atributo: o desenho do traço pode chegar
        // por atributo ou por estilo, e ler só um dos dois é medir meio caminho.
        .map((p) => getComputedStyle(p).strokeDasharray);
      await expect(new Set(drawn).size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('A legenda nomeia cada série e o eixo mantém as categorias', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designTexts(root)).toContain(serie.name);
      }
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });
  },
};

export const Area: Story = {
  parameters: {
    // `buildAreaOption` é o que preenche a região sob a linha; sem ele o
    // snippet ensinaria o gráfico errado.
    docs: {
      source: { transform: chartAreaSource },
      description: { story: 'Área — a linha com a região sob ela preenchida, para dar volume.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildAreaOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 260,
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Cada série ganha uma região preenchida além do traçado', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // A região vem com preenchimento translúcido — é o que a distingue do
      // traçado, que é `fill: none`.
      const areas = [...root.querySelectorAll<SVGPathElement>('svg path[fill-opacity]')].filter(
        (p) => getComputedStyle(p).fill !== 'none',
      );
      await expect(areas.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('Toda categoria do dado aparece escrita no eixo', async () => {
      await waitFor(
        () => {
          for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
        },
        { timeout: 3000 },
      );
    });
  },
};

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    // O builder de pizza recebe pontos rotulados, não eixo mais série: a forma
    // do dado muda junto com o gráfico.
    docs: {
      source: { transform: chartPieSource },
      description: { story: 'Pizza (rosca) — participação de cada parte no todo.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildPieOption({ data: DISPOSITIVOS }),
    height: 280,
    'aria-label': 'Distribuição de acessos por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('As fatias saem desenhadas', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await expect(datumFormas(root).length).toBeGreaterThan(0);
    });

    await step('Cada fatia é nomeada por escrito — não só pela cor', async () => {
      // Sem o nome escrito, distinguir as partes depende só da cor, e o gráfico
      // some para quem não separa as cores da paleta.
      await waitFor(
        () => {
          for (const ponto of DISPOSITIVOS) expect(designEscreve(root, ponto.label)).toBe(true);
        },
        { timeout: 3000 },
      );
    });
    await step('Cada fatia é nomeada AO LADO dela, não só no rodapé', async () => {
      // O nome aparece em dois lugares — na legenda e no rótulo da fatia —, e
      // por isso a leitura é a de FORA da caixa da legenda. Procurar o nome no
      // desenho inteiro passaria com o rótulo desligado, que foi o defeito:
      // numa stack a pizza vinha sem rótulo nenhum e a única pista era a
      // legenda no rodapé, obrigando quem lê a casar cor com nome a cada
      // olhada.
      const fora = designTextsOutsideLegend(root);
      for (const ponto of DISPOSITIVOS) {
        await expect(fora).toContain(ponto.label);
      }
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
      description: { story: 'Funil — etapas de um processo, na ordem em que acontecem.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildFunnelOption({ data: FUNNEL_STAGES }),
    height: 300,
    'aria-label': 'Funil de conversão: da visita à compra',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('A legenda nomeia cada etapa por escrito', async () => {
      // O rótulo não é desenhado DENTRO da faixa de propósito: ali ele ficaria
      // por cima de uma cor de série que muda a cada posição. Quem nomeia a
      // etapa é a legenda, sobre o fundo da página.
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // A medida de forma exige a animação fechada: ver `drawingSettled`.
      await drawingSettled(root);
      for (const stage of FUNNEL_STAGES) {
        await expect(designTexts(root)).toContain(stage.label);
      }
    });

    await step('Uma faixa por etapa, na ordem em que as etapas foram declaradas', async () => {
      const bands = filledShapes(root)
        .map((band) => band.getBoundingClientRect())
        .sort((a, b) => a.top - b.top);
      await expect(bands).toHaveLength(FUNNEL_STAGES.length);
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
      await expect(rows.map((row) => row[0])).toEqual(FUNNEL_STAGES.map((s) => s.label));
      await expect(rows.map((row) => row[1])).toEqual(FUNNEL_STAGES.map((s) => String(s.value)));
      // Contra a PRIMEIRA etapa, e não contra a soma: a largura da faixa nasce
      // da razão para o topo do funil, e é essa leitura que o texto precisa
      // repor. A primeira linha, portanto, é sempre 100%.
      await expect(rows.map((row) => row[2])).toEqual(
        FUNNEL_STAGES.map((s) => shareOfFirst(s.value)),
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
      const hatches = decalColors(root);
      await expect(hatches.length).toBeGreaterThan(0);
      await expect(hatches).toEqual([tokenColor('background', root, HATCH_OPACITY)]);
    });

    await step('Cada faixa é contornada em --foreground', async () => {
      const bands = filledShapes(root);
      await expect(bands.length).toBe(FUNNEL_STAGES.length);
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

/**
 * Sessões por canal e origem — o dado da rosca aninhada.
 *
 * Cada ponto declara o GRUPO; o anel de dentro é derivado da soma. Três grupos e
 * cinco partes fazem 8 fatias na tela, e é essa contagem que a play mede: se a
 * derivação quebrar e o anel interno passar a ter um arco por PONTO, o número
 * vai a 10 e a story reprova.
 */
const NEST_DATA = [
  { label: 'Orgânica', value: 300, group: 'Busca' },
  { label: 'Paga', value: 100, group: 'Busca' },
  { label: 'Instagram', value: 200, group: 'Social' },
  { label: 'LinkedIn', value: 150, group: 'Social' },
  { label: 'App', value: 250, group: 'Direto' },
];
const NEST_GROUPS = [...new Set(NEST_DATA.map((d) => d.group))];
const NEST_SLICES = NEST_GROUPS.length + NEST_DATA.length;

export const PieNest: Story = {
  parameters: {
    covers: ['functional.item11', 'visual.item8'],
    docs: {
      description: {
        story: 'Dois anéis sobre o mesmo total. O de dentro reúne os canais, o de fora abre cada um em suas origens, e cada fatia externa cai no vão do seu canal.',
      },
    },
  },
  render: () => h(ChartContainer, {
    option: buildPieNestOption({ data: NEST_DATA }),
    height: 320,
    showData: true,
    groupLabel: 'Canal',
    categoryLabel: 'Origem',
    'aria-label': 'Sessões por canal e origem: três canais abertos em suas origens, em dois anéis',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });

    await step('Os dois anéis saem na tela — um arco por grupo, um por parte', async () => {
      // `drawingSettled` NÃO alcança a varredura da rosca: ele espera o
      // retângulo transparente da legenda ficar sozinho, o que já vale no
      // primeiro quadro, enquanto as fatias entram em ângulo zero. A espera é
      // por RELÓGIO porque a leitura força layout — ver `waitForStableCount`.
      await waitForStableCount(() => filledShapes(root).length);
      // Igualdade, e o número é o que prova a DERIVAÇÃO: três grupos mais cinco
      // partes. Se o anel de dentro passasse a ter um arco por ponto — o que
      // acontece quando alguém troca a soma por um mapa direto —, seriam dez.
      await expect(filledShapes(root)).toHaveLength(NEST_SLICES);
    });

    await step('Cada fatia carrega uma trama — a cor não é o único sinal', async () => {
      // A rosca aninhada é de PREENCHIMENTO, então a trama alcança (ao contrário
      // da dispersão). Contar a hachura ao lado das formas, com o mesmo número
      // esperado, impede um coletor que exclui demais de ficar verde medindo
      // menos: se a exclusão comesse forma de dado, os dois números caem juntos.
      await expect(hatchedShapes(root)).toHaveLength(NEST_SLICES);
    });

    await step('A legenda nomeia os dois níveis', async () => {
      for (const group of NEST_GROUPS) await expect(designEscreve(root, group)).toBe(true);
      for (const point of NEST_DATA) await expect(designEscreve(root, point.label)).toBe(true);
    });


    await step('O rótulo escreve o valor e a participação, em trechos próprios', async () => {
      // É este passo que prova o TEXTO RICO. O nome sozinho não provaria nada:
      // ele também está na legenda, e a asserção passaria com o rótulo
      // desligado. O valor e a porcentagem não aparecem em nenhum outro lugar
      // do desenho — se estão lá, o rótulo foi desenhado.
      await expect(designEscreve(root, '300')).toBe(true);
      await expect(designTexts(root).some((t) => t.includes('%'))).toBe(true);

      // E o nome do grupo é escrito DENTRO do anel de dentro, que sem isto
      // ficaria mudo: a legenda nomeia os dois níveis de uma vez, sem dizer
      // qual arco é de qual.
      for (const group of NEST_GROUPS) {
        await expect(designEscreve(root, group)).toBe(true);
      }
    });
    await step('A tabela traz as duas colunas de nome, uma linha por parte', async () => {
      await expect(headerOf(root)).toEqual(['Canal', 'Origem', 'Valor', 'Participação']);
      // Uma linha por PARTE. O grupo não ganha linha própria porque a
      // participação dele é derivável — soma das partes, na mesma coluna.
      const data = root.querySelector('[data-slot="chart-data"]');
      await expect(data?.querySelectorAll('tbody tr')).toHaveLength(NEST_DATA.length);
    });
  },
};

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
  render: () => h(ChartContainer, {
    option: buildScatterOption({ series: SCATTER_SERIES, xLabel: SCATTER_X, yLabel: SCATTER_Y }),
    height: 320,
    showData: true,
    seriesLabel: 'Grupo',
    'aria-label': 'Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });

    await step('O desenho sai com um ponto por par — nem um a mais', async () => {
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
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
      await expect(rowsOf(root)).toHaveLength(SCATTER_POINTS);
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
  render: () => h(ChartContainer, {
    option: buildRadarOption({ axes: RADAR_AXES, series: RADAR_SERIES }),
    height: 320,
    categoryLabel: 'Eixo',
    maxLabel: 'Máximo',
    'aria-label': 'Radar de qualidade do site: cinco grandezas, antes e depois da revisão',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
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
        await expect(designTexts(root)).toContain(serie.name);
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
      await expect(headerOf(root)).toEqual([
        'Eixo', 'Máximo', ...RADAR_SERIES.map((s) => s.name),
      ]);

      const rows = rowsOf(root);
      await expect(rows).toHaveLength(RADAR_AXES.length);
      for (const [iAxis, axis] of RADAR_AXES.entries()) {
        await expect(rows[iAxis]).toEqual([
          axis.label,
          String(axis.max),
          ...RADAR_SERIES.map((s) => String(s.data[iAxis])),
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

    await step('O papel de imagem e o rótulo vão no desenho, não no bloco', async () => {
      const drawing = drawingOf(root);
      await expect(drawing.getAttribute('role')).toBe('img');
      // No bloco, `role="img"` podaria a tabela junto e a alternativa textual
      // sumiria da árvore de acessibilidade.
      await expect(root.getAttribute('role')).toBeNull();
    });
  },
};
