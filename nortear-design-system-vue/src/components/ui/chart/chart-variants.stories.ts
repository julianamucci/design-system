import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  designEscreve,
  designPintado,
  exigirRoot,
  datumFormas,
  designTexts,
  settleTheme,
  tokenColor,
} from '@shared/testing/chart-probe';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption, buildFunnelOption,
  buildRadarOption,
} from './index';
import {
  decalColors, drawingOf, drawingSettled, filledShapes, headerOf,
  radarHatches, radarPolygons, rowsOf,
} from './chart.fixtures';
import {
  chartAreaSource,
  chartBarSource,
  chartFunnelSource,
  chartLineSource,
  chartPieSource,
  chartRadarSource,
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
  title: 'UI/Chart/Variants',
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
      await expect(hatches).toEqual([tokenColor('background', root)]);
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
