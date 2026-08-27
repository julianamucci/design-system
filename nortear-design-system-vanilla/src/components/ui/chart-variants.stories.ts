import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import { getInstanceByDom } from 'echarts/core';
import {
  designEscreve,
  designPintado,
  designTexts,
  distinctShapes,
  waitForStableCount,
  exigirRoot,
} from '@shared/testing/chart-probe';
import { resolveColor } from '@shared/testing/cor';
import { createChart } from './chart';
import {
  drawingSettled,
  filledShapes,
  hatchedShapes,
  radarHatches,
  radarPolygons,
} from './chart.fixtures';
import { chartSource, chartSourceWith } from './chart.source';
import { CHART_SCATTER_CLUSTERS } from '@shared/primitives/chart-scatter-clusters';

// ─── Dados ────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const ACESSOS = [186, 305, 237, 73, 209, 214];

const chartData = MONTHS.map((label, i) => ({ label, value: ACESSOS[i] }));

const SERIES_MULTI = [
  { name: 'Desktop', data: ACESSOS },
  { name: 'Mobile', data: [120, 190, 165, 98, 174, 158] },
];

const pieData = [
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
 * mudar sozinho entre rodadas — medido, a partição se repete de 92 a 98 vezes
 * em 100 —, e a tabela equivalente, que nasce de função pura, descreveria um
 * agrupamento diferente do que está na tela.
 */
const SCATTER_SERIES = CHART_SCATTER_CLUSTERS.map((c) => ({
  name: c.name,
  points: c.points,
}));

const SCATTER_POINTS = SCATTER_SERIES.reduce((n, s) => n + s.points.length, 0);

/**
 * Sessões por canal e origem — o dado da rosca aninhada.
 *
 * Cada ponto declara o GRUPO; o anel de dentro é derivado da soma. Três grupos
 * e cinco partes fazem 8 fatias na tela, e é essa contagem que a play mede: se
 * a derivação quebrar e o anel interno passar a ter um arco por PONTO, o número
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

const SCATTER_X = 'Minutos na página';
const SCATTER_Y = 'Páginas vistas';

/**
 * Séries já resolvidas pela lib, lidas da instância montada no desenho.
 *
 * Serve para o que é decisão de configuração e não vira nó do DOM: o símbolo de
 * ponto de cada série. O que vira pixel continua sendo medido no DOM logo
 * abaixo — option verde com desenho errado é exatamente o portão sem dentes.
 */
function resolvedSeries(root: HTMLElement): Record<string, unknown>[] {
  const canvas = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
  if (!canvas) throw new Error('nenhum [data-slot="chart-canvas"] dentro do .nds-chart');
  const instance = getInstanceByDom(canvas);
  if (!instance) throw new Error('a lib ainda não montou a instância no desenho');
  return (instance.getOption() as unknown as { series: Record<string, unknown>[] }).series;
}

/**
 * Largura de cada faixa do funil, de cima para baixo.
 *
 * Uma entrada por etapa: `filledShapes` devolve só a camada de cor, e a trama —
 * que sai com a mesma geometria por cima — fica de fora. Nada de recortar as
 * `count` primeiras: a fileira de ícones que obrigava a esse corte já não entra,
 * porque o coletor exclui a legenda. A ordenação sai da POSIÇÃO em y, não da
 * ordem do documento — o que a story promete é o que a pessoa vê.
 */
function bandWidths(root: HTMLElement): number[] {
  return filledShapes(root)
    .map((forma) => forma.getBoundingClientRect())
    .sort((a, b) => a.y - b.y)
    .map((box) => box.width);
}

/**
 * Traçado de série: caminho sem preenchimento e com espessura de série (o eixo
 * e a grade usam 1px).
 *
 * A legenda fica de fora pelo mesmo critério dos coletores de forma — o ícone do
 * traçado HERDA a espessura da série e passaria por qualquer limiar de largura.
 * Excluí-la é o que permite contar uma curva POR SÉRIE em igualdade.
 */
function tracados(root: HTMLElement): SVGPathElement[] {
  return [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
    const s = getComputedStyle(p);
    if (s.fill !== 'none' || parseFloat(s.strokeWidth || '0') < 2) return false;
    return !insideLegendBox(root, p);
  });
}

/**
 * `p` cabe inteiro na caixa da legenda?
 *
 * A caixa sai do fundo que a lib desenha para a legenda — o único
 * `<path fill-opacity="0">` do desenho —, exatamente como nos coletores de
 * forma. Sem legenda não há fundo, e nada é excluído.
 */
function insideLegendBox(root: HTMLElement, p: SVGGraphicsElement): boolean {
  const background = root.querySelector<SVGGraphicsElement>('svg path[fill-opacity="0"]');
  if (!background) return false;
  const box = background.getBoundingClientRect();
  const r = p.getBoundingClientRect();
  return r.left >= box.left - 1 && r.right <= box.right + 1
    && r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
  title: 'UI/Chart/Variants',
};

export default meta;
type Story = StoryObj;

// A dica sob o ponteiro (functional.item4) NÃO é declarada aqui.
//
// Medido: nesta stack o evento de ponteiro sintético não chega ao motor de
// desenho — o mesmo passo, com o mesmo alvo e as mesmas coordenadas, abre a
// dica nas outras três. Foram descartadas a forma do dado, a largura do bloco,
// o recorte do container (o desenho passou a morar num elemento interno por
// causa disto) e o par pointer/mouse. Declarar cobertura sem verificação seria
// pior que não declarar: o auditor passaria a mentir. Fica como divergência
// escrita até alguém achar a causa.

export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
    // Declarado como NÃO VERIFICADO, com o motivo, em vez de omitido: omitir
    // deixaria o item sumir do relatório, e reivindicá-lo faria o auditor
    // mentir. Medido: o evento de ponteiro sintético não chega ao motor de
    // desenho nesta stack — o mesmo passo, com o mesmo alvo e as mesmas
    // coordenadas, abre a dica nas outras três. Foram descartadas a forma do
    // dado, a largura do bloco, o par pointer/mouse e o recorte do container
    // (o desenho passou a morar num elemento interno por causa desta caça).
    // A dica funciona no produto; o que falta é o caminho de verificação.
    coversNotApplicable: {
      'functional.item4': 'dica sob o ponteiro não alcançável por evento sintético nesta stack — verificação em aberto',
    },
    docs: {
      description: {
        story: 'Tipo bar — comparação entre categorias discretas. Use para dados não contínuos.',
      },
    },
  },
  render: () => createChart({
    data: chartData,
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop, de janeiro a junho',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai, com uma coluna por categoria — nem uma a mais', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade. Com "mais de zero", este passo passava com QUALQUER número de
      // formas — inclusive o dobro, que é o que sai quando a trama de cada
      // coluna entra na conta.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(chartData.length),
        { timeout: 3000 },
      );
    });

    await step('Toda categoria aparece escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });

    await step('E a cor não é o único sinal: a trama alcança CADA coluna', async () => {
      // WCAG 1.4.1. Medir a trama com o mesmo número esperado da camada de cor é
      // o que impede um coletor que exclui demais de ficar verde medindo menos:
      // se a exclusão comesse forma de dado, os dois números cairiam juntos.
      await waitFor(
        () => expect(hatchedShapes(root)).toHaveLength(chartData.length),
        { timeout: 3000 },
      );
    });
  },
};

// ─── Line ─────────────────────────────────────────────────────────────────────

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
    docs: {
      // Override de story: muda o tipo E a FORMA do dado — aqui entram `xAxis`
      // e `series`, e não a lista simples de rótulo e valor.
      source: {
        transform: chartSourceWith({
          type: 'line',
          data: 'multi',
          'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo, de janeiro a junho',
        }),
      },
      description: {
        story: 'Tipo line — tendência contínua ao longo do tempo. Uma linha por série, com ponto por dado.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'line',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Gráfico de linhas: acessos mensais por dispositivo, de janeiro a junho',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Uma linha traçada por série', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade: uma curva POR SÉRIE. `tracados` já deixa a legenda de fora,
      // então não sobra decoração a que um limite inferior servisse de folga.
      await waitFor(
        () => expect(tracados(root)).toHaveLength(SERIES_MULTI.length),
        { timeout: 3000 },
      );
      for (const traco of tracados(root)) {
        // Comprimento zero é caminho vazio: o nó existiria e nada teria sido
        // desenhado.
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('As séries se distinguem por FORMA, não só por cor', async () => {
      // WCAG 1.4.1 — retirando toda a cor, a linha de cima ainda se separa da
      // de baixo. A trama do decal não alcança traçado (ela é de
      // preenchimento), então quem carrega a distinção aqui é o símbolo de
      // ponto próprio de cada série.
      const series = resolvedSeries(root);
      await expect(series).toHaveLength(SERIES_MULTI.length);
      const symbols = series.map((s) => String(s['symbol']));
      await expect(new Set(symbols).size).toBe(SERIES_MULTI.length);
    });

    await step('E o traço próprio chega ao desenho, não fica só na configuração', async () => {
      // Option verde com desenho errado é portão sem dentes: a série tracejada
      // tem de sair com `stroke-dasharray` no nó.
      const dashes = tracados(root).map((t) => t.getAttribute('stroke-dasharray'));
      await expect(new Set(dashes).size).toBe(SERIES_MULTI.length);
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('Toda categoria aparece escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });

    await step('E a tabela repete os mesmos números, série por série', async () => {
      // Uma coluna por série mais a das categorias: o desenho e a alternativa
      // textual saem da mesma normalização, e é isso que os mantém iguais.
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', ...SERIES_MULTI.map((s) => s.name)]);

      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(MONTHS.length);
      const values = [...lines[0].querySelectorAll('td')].map((c) => c.textContent?.trim());
      await expect(values).toEqual(SERIES_MULTI.map((s) => String(s.data[0])));
    });
  },
};

// ─── Area ─────────────────────────────────────────────────────────────────────

export const Area: Story = {
  parameters: {
    docs: {
      // Override de story: tipo e forma do dado, como no traçado.
      source: {
        transform: chartSourceWith({
          type: 'area',
          data: 'multi',
          'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
        }),
      },
      description: {
        story: 'Tipo area — linha com a região preenchida embaixo. Enfatiza volume ao longo do tempo.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'area',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Gráfico de área: volume mensal de acessos por dispositivo',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O traçado continua lá — a área é acréscimo, não troca', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      await waitFor(
        () => expect(tracados(root)).toHaveLength(SERIES_MULTI.length),
        { timeout: 3000 },
      );
    });

    await step('Cada série ganha uma região preenchida sob a linha', async () => {
      // Preenchimento translúcido: opaco esconderia a série de baixo, e é por
      // isso que a área se distingue do traçado por `fill-opacity`, não por cor.
      // Uma região POR SÉRIE, em igualdade: o coletor já deixou de fora o
      // vocabulário do `<defs>` e a legenda.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(() => {
        const areas = filledShapes(root).filter((forma) => {
          const opacity = parseFloat(getComputedStyle(forma).fillOpacity || '1');
          return opacity > 0 && opacity < 1;
        });
        expect(areas).toHaveLength(SERIES_MULTI.length);
      }, { timeout: 3000 });
    });

    await step('Toda categoria aparece escrita no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
      }
    });
  },
};

// ─── Pie ──────────────────────────────────────────────────────────────────────

export const Pie: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // Override de story: a rosca não tem eixo, então o dado volta a ser a
      // lista de rótulo e valor — e são as fatias, não os meses.
      source: {
        transform: chartSourceWith({
          type: 'pie',
          data: 'rosca',
          height: 280,
          'aria-label': 'Distribuição de acessos por dispositivo: desktop, mobile e tablet',
        }),
      },
      description: {
        story: 'Tipo pie (rosca) — composição de um total. Limite a cinco ou seis fatias para continuar legível.',
      },
    },
  },
  render: () => createChart({
    data: pieData,
    type: 'pie',
    height: 280,
    class: 'nds-max-w-md',
    'aria-label': 'Distribuição de acessos por dispositivo: desktop, mobile e tablet',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com uma fatia por dado — nem uma a mais', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade. Com "no mínimo", a contagem dobrada pela trama e a inchada
      // pelos ícones da legenda passavam as duas: o portão só reprovava se o
      // desenho saísse VAZIO.
      // `waitFor`: a geometria da forma assenta DEPOIS da marca de opacidade
      // que `drawingSettled` observa — ver o coletor. A igualdade continua com
      // dentes: contagem inflada não converge, porque nenhuma forma some.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(pieData.length),
        { timeout: 3000 },
      );
    });

    await step('E a cor não é o único sinal: a trama alcança CADA fatia', async () => {
      // WCAG 1.4.1. O mesmo número esperado da camada de cor: se a exclusão do
      // coletor passasse a comer forma de dado, os dois números cairiam juntos.
      await waitFor(
        () => expect(hatchedShapes(root)).toHaveLength(pieData.length),
        { timeout: 3000 },
      );
    });

    await step('A legenda escreve o nome de CADA fatia', async () => {
      // Numa rosca a fatia não tem eixo que a nomeie: sem a legenda escrita, a
      // única pista da categoria seria a cor.
      for (const ponto of pieData) {
        await expect(designEscreve(root, ponto.label)).toBe(true);
      }
    });

    await step('A tabela traz valor E participação de cada fatia', async () => {
      // Numa rosca a informação está na ÁREA da fatia, e área não se lê em
      // texto: sem a coluna de participação, a alternativa textual perderia
      // justamente o que o desenho comunica.
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', 'Valor', 'Participação']);

      const total = pieData.reduce((sum, p) => sum + p.value, 0);
      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(pieData.length);
      for (const [i, line] of lines.entries()) {
        await expect(line.querySelector('th')?.textContent?.trim()).toBe(pieData[i].label);
        const cells = [...line.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells[0]).toBe(String(pieData[i].value));
        await expect(cells[1]).toBe(`${Math.round((pieData[i].value / total) * 1000) / 10}%`);
      }
    });

    await step('Cada fatia usa um token de cor distinto', async () => {
      // `filledShapes` já é a camada de cor: a trama sobreposta entra como
      // `url(#…)` e nunca foi cor de série. Igualdade — tantas cores quantas
      // fatias, sem repetir e sem sobrar a cor de nenhuma decoração.
      const colors = new Set(filledShapes(root).map((f) => getComputedStyle(f).fill));
      await expect(colors.size).toBe(pieData.length);
    });
  },
};

// ─── Funnel ───────────────────────────────────────────────────────────────────

export const Funnel: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
    docs: {
      // Override de story: o funil não tem eixo, então o dado volta a ser a
      // lista de rótulo e valor — e são as etapas do processo, na ordem em que
      // acontecem.
      source: {
        transform: chartSourceWith({
          type: 'funnel',
          data: 'funnel',
          height: 280,
          'aria-label': 'Funil de conversão: visitas, cadastros, carrinho e compra',
        }),
      },
      description: {
        story: 'Tipo funnel — etapas de um processo que afunila. A largura de cada faixa é a participação dela em relação à primeira etapa.',
      },
    },
  },
  render: () => createChart({
    data: FUNNEL_STAGES,
    type: 'funnel',
    height: 280,
    class: 'nds-max-w-md',
    'aria-label': 'Funil de conversão: visitas, cadastros, carrinho e compra',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com uma faixa por etapa — nem uma a mais', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
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

    await step('A legenda escreve o nome de CADA etapa', async () => {
      // A faixa não tem eixo que a nomeie e não leva rótulo por dentro: sem a
      // legenda escrita, a única pista da etapa seria a cor.
      for (const stage of FUNNEL_STAGES) {
        await expect(designEscreve(root, stage.label)).toBe(true);
      }
    });

    await step('As faixas afunilam, e a largura de cada uma é a participação', async () => {
      // A largura é o que o desenho comunica, e a coluna de participação é o
      // que a escreve — as duas medidas têm de ser a MESMA. Dentro de um
      // `waitFor` porque as faixas crescem: a lib as anima a partir do centro,
      // e enquanto a animação corre a largura medida ainda não é a final.
      const entry = FUNNEL_STAGES[0].value;
      await waitFor(() => {
        const widths = bandWidths(root);
        expect(widths).toHaveLength(FUNNEL_STAGES.length);
        for (const [i, stage] of FUNNEL_STAGES.entries()) {
          if (i > 0) expect(widths[i]).toBeLessThan(widths[i - 1]);
          // Tolerância de 5 pontos: o contorno de 1px engorda a caixa medida
          // nas duas pontas, e a comparação é de proporção, não de pixel.
          expect(widths[i] / widths[0]).toBeCloseTo(stage.value / entry, 1);
        }
      }, { timeout: 3000 });
    });

    await step('A tabela traz etapa, valor e participação em relação à primeira', async () => {
      const columns = [...root.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(columns).toEqual(['Categoria', 'Valor', 'Participação']);

      const entry = FUNNEL_STAGES[0].value;
      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(FUNNEL_STAGES.length);
      for (const [i, line] of lines.entries()) {
        await expect(line.querySelector('th')?.textContent?.trim()).toBe(FUNNEL_STAGES[i].label);
        const cells = [...line.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells[0]).toBe(String(FUNNEL_STAGES[i].value));
        await expect(cells[1]).toBe(`${Math.round((FUNNEL_STAGES[i].value / entry) * 1000) / 10}%`);
      }
    });

    await step('E a cor não é o único sinal: a trama alcança CADA faixa', async () => {
      // WCAG 1.4.1 — a faixa é forma PREENCHIDA, então a hachura chega nela
      // como chega à barra e à fatia. Uma trama por faixa, e não "pelo menos
      // uma": com o limite inferior, um desenho em que a hachura alcançasse só a
      // primeira etapa passava igual. Que ela é traçada na cor do fundo, e não
      // na lista padrão da lib, é propriedade do bloco `aria` compartilhado
      // pelos tipos e está medida na story de contraste gráfico.
      await waitFor(
        () => expect(hatchedShapes(root)).toHaveLength(FUNNEL_STAGES.length),
        { timeout: 3000 },
      );
    });
  },
};

// ─── Rosca aninhada ───────────────────────────────────────────────────────────

export const PieNest: Story = {
  parameters: {
    covers: ['functional.item11', 'visual.item8'],
    docs: {
      source: {
        transform: chartSourceWith({
          type: 'pie-nest',
          data: 'roscaAninhada',
          height: 320,
          'aria-label': 'Sessões por canal e origem: três canais abertos em suas origens, em dois anéis',
        }),
      },
      description: {
        story: 'Rosca aninhada — dois anéis sobre o mesmo total. O de dentro reúne os canais, o de fora abre cada um em suas origens, e cada fatia externa cai no vão do seu canal.',
      },
    },
  },
  render: () => createChart({
    type: 'pie-nest',
    data: NEST_DATA,
    height: 320,
    class: 'nds-max-w-md',
    groupLabel: 'Canal',
    categoryLabel: 'Origem',
    'aria-label': 'Sessões por canal e origem: três canais abertos em suas origens, em dois anéis',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Os dois anéis saem na tela — um arco por grupo, um por parte', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // `drawingSettled` NÃO alcança a varredura da rosca: ele espera o
      // retângulo transparente da legenda ficar sozinho, o que já vale no
      // primeiro quadro, enquanto as fatias entram em ângulo zero. A espera é
      // por RELÓGIO porque a leitura força layout — ver `waitForStableCount`.
      await waitForStableCount(() => filledShapes(root).length);
      // Igualdade, e o número é o que prova a DERIVAÇÃO: três grupos mais cinco
      // partes. Se o anel de dentro passasse a ter um arco por ponto — que é o
      // que acontece quando alguém troca a soma por um mapa direto —, seriam
      // dez, e este passo reprova.
      await expect(filledShapes(root)).toHaveLength(NEST_SLICES);
    });

    await step('Cada fatia carrega uma trama — a cor não é o único sinal', async () => {
      // A rosca aninhada é de PREENCHIMENTO, então a trama alcança (ao contrário
      // da dispersão). Contar a hachura ao lado das formas, com o mesmo número
      // esperado, é o que impede um coletor que exclui demais de ficar verde
      // medindo menos: se a exclusão passasse a comer forma de dado, os dois
      // números caem juntos.
      await expect(hatchedShapes(root)).toHaveLength(NEST_SLICES);
    });

    await step('A legenda nomeia os dois níveis', async () => {
      // Sem ela o anel de dentro fica mudo: o rótulo escrito por dentro do arco
      // não cabe em fatia pequena, e a lib o esconde sem avisar.
      for (const group of NEST_GROUPS) {
        await expect(designEscreve(root, group)).toBe(true);
      }
      for (const point of NEST_DATA) {
        await expect(designEscreve(root, point.label)).toBe(true);
      }
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
      const data = root.querySelector<HTMLElement>('[data-slot="chart-data"]');
      await expect(data).not.toBeNull();
      const header = [...data!.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Canal', 'Origem', 'Valor', 'Participação']);
      // Uma linha por PARTE. O grupo não ganha linha própria porque a
      // participação dele é derivável — soma das partes, na mesma coluna.
      await expect(data!.querySelectorAll('tbody tr')).toHaveLength(NEST_DATA.length);
    });
  },
};

// ─── Dispersão ────────────────────────────────────────────────────────────────

export const Scatter: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item7'],
    docs: {
      source: {
        transform: chartSourceWith({
          type: 'scatter',
          data: 'scatter',
          height: 320,
          'aria-label': 'Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos',
        }),
      },
      description: {
        story: 'Tipo dispersão — duas grandezas, uma em cada eixo, sem categoria no meio. Cada grupo é uma série, com forma própria: sem a cor, os grupos continuam separados.',
      },
    },
  },
  render: () => createChart({
    type: 'scatter',
    series: SCATTER_SERIES,
    height: 320,
    class: 'nds-max-w-md',
    seriesLabel: 'Grupo',
    xLabel: SCATTER_X,
    yLabel: SCATTER_Y,
    'aria-label': 'Dispersão de sessões de leitura: minutos na página por páginas vistas, em três grupos',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com um ponto por par — nem um a mais', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      await drawingSettled(root);
      // Igualdade, não piso: com "no mínimo", uma contagem inchada pelo ícone
      // da legenda passaria igual, e o portão só reprovaria com a tela vazia.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(SCATTER_POINTS),
        { timeout: 3000 },
      );
    });

    await step('Cada grupo tem uma FORMA própria — é ela que separa sem a cor', async () => {
      // Este é o passo que a dispersão exige e os outros tipos não.
      //
      // Nos tipos de área a WCAG 1.4.1 é cumprida pela trama, e há portão para
      // ela. Aqui a trama não serve — num símbolo de 14px cabe uma repetição do
      // ladrilho, e duas tramas diferentes saem iguais —, então quem separa é a
      // forma, e é a forma que precisa ser medida.
      //
      // Medida no DOM e não no option: o option provaria que a forma foi
      // PEDIDA. A assinatura é só a sequência de letras de comando do `d`, que
      // não muda com a posição do ponto — circle sai `MAA`, rect `MlllZ`,
      // triangle `MLLZ`.
      const formas = distinctShapes(filledShapes(root));
      await expect(formas.size).toBe(SCATTER_SERIES.length);
    });

    await step('A legenda amarra cada forma ao nome do grupo', async () => {
      // Sem ela o desenho teria três formas e nenhuma pista do que significam,
      // e a pessoa teria de ir à tabela — que é a alternativa, não a leitura.
      for (const serie of SCATTER_SERIES) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('Os dois eixos aparecem nomeados — posição sem grandeza não informa', async () => {
      await expect(designEscreve(root, SCATTER_X)).toBe(true);
      await expect(designEscreve(root, SCATTER_Y)).toBe(true);
    });

    await step('A tabela equivalente traz uma linha por ponto, com o grupo', async () => {
      const data = root.querySelector<HTMLElement>('[data-slot="chart-data"]');
      await expect(data).not.toBeNull();
      const header = [...data!.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Grupo', SCATTER_X, SCATTER_Y]);
      // Uma linha por ponto: resumo por grupo descreveria a nuvem, e a tabela
      // precisa CARREGÁ-LA — é onde a posição de cada ponto sobrevive em texto.
      await expect(data!.querySelectorAll('tbody tr')).toHaveLength(SCATTER_POINTS);
    });
  },
};

// ─── Radar ────────────────────────────────────────────────────────────────────

export const Radar: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: {
      // Override de story: o radar não tem eixo de categorias nem lista simples.
      // O dado dele são os EIXOS (nome mais teto) de um lado e as séries do
      // outro — e é essa forma que o snippet precisa ensinar.
      source: {
        transform: chartSourceWith({
          type: 'radar',
          data: 'radar',
          height: 320,
          'aria-label': 'Radar de qualidade do site: cinco grandezas, antes e depois da revisão',
        }),
      },
      description: {
        story: 'Tipo radar — várias grandezas de um mesmo item, uma por eixo, num polígono fechado. Cada eixo tem escala própria, e a tabela traz o máximo de cada um.',
      },
    },
  },
  render: () => createChart({
    radarAxes: RADAR_AXES,
    series: RADAR_SERIES,
    type: 'radar',
    height: 320,
    class: 'nds-max-w-md',
    categoryLabel: 'Eixo',
    maxLabel: 'Máximo',
    'aria-label': 'Radar de qualidade do site: cinco grandezas, antes e depois da revisão',
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com um polígono por série — nem um a mais', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // Contar formas exige a animação de entrada fechada: ver `drawingSettled`.
      // Ela também é o que garante que os anéis do radar não deixaram um
      // retângulo transparente extra na tela — a faixa alternada do padrão da
      // lib fica DESLIGADA no tema exatamente por isso.
      await drawingSettled(root);
      // Igualdade. Com "no mínimo", passariam tanto a contagem dobrada pela
      // trama quanto a inchada pelos dez símbolos de vértice — o portão só
      // reprovaria com o desenho vazio.
      //
      // E a faixa alternada do padrão da lib é pega um passo acima, na espera:
      // uma das duas sai com `fill-opacity="0"`, que é a marca pela qual o
      // coletor reconhece o fundo da legenda. Com ela ligada há DOIS retângulos
      // transparentes na tela e `drawingSettled` não fecha — medido, plantando
      // o defeito. `splitArea` desligado no tema não é preferência de gosto.
      // `waitFor`: a geometria assenta DEPOIS da marca de opacidade que
      // `drawingSettled` observa, e o polígono do radar entra crescendo a
      // partir do centro. Só leitura aqui dentro; nada que mexa no DOM.
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

    await step('Os eixos do radar saem do TEMA, e não do padrão da lib', async () => {
      // O radar é o único tipo com eixos PRÓPRIOS, e sem bloco de tema eles
      // nascem nos cinzas cravados da lib: um gráfico do design system com
      // eixos que não são do design system. Este passo é o que impede isso de
      // voltar calado.
      //
      // As três sondas de token são resolvidas AQUI, de uma vez, e fora de
      // qualquer espera: `resolveColor` pendura um elemento no DOM, e leitura
      // que mexe no DOM dentro de `waitFor` provoca a própria retentativa — o
      // prazo nunca chega e a aba morre sem reprovar.
      const mutedForeground = resolveColor(root, 'hsl(var(--muted-foreground))');
      const grade = resolveColor(root, 'hsla(var(--border) / 0.3)');
      const eixo = resolveColor(root, 'hsla(var(--border) / 0.6)');

      const axisName = [...root.querySelectorAll<SVGTextElement>('svg text')]
        .find((no) => (no.textContent ?? '').trim() === 'SEO');
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

      // Anéis e raios: a mesma malha, nas mesmas duas intensidades, do gráfico
      // de barras ao lado.
      const strokes = new Set(
        [...root.querySelectorAll<SVGPathElement>('svg path[fill="none"]')]
          .map((no) => getComputedStyle(no).stroke),
      );
      await expect([...strokes]).toContain(grade);
      await expect([...strokes]).toContain(eixo);
    });

    await step('E a cor não é o único sinal: a trama alcança CADA polígono', async () => {
      // WCAG 1.4.1 — o polígono é forma PREENCHIDA, então a hachura chega nele
      // como chega à barra e à fatia. Uma trama por polígono, e não "pelo menos
      // uma": com o limite inferior, um desenho em que a hachura alcançasse só
      // a primeira série passava igual. Que ela é traçada na cor do fundo, e
      // não na lista padrão da lib, é propriedade do bloco `aria` compartilhado
      // pelos tipos e está medida na story de contraste gráfico.
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

      const lines = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(lines).toHaveLength(RADAR_AXES.length);
      for (const [i, line] of lines.entries()) {
        await expect(line.querySelector('th')?.textContent?.trim()).toBe(RADAR_AXES[i].label);
        const cells = [...line.querySelectorAll('td')].map((c) => c.textContent?.trim());
        await expect(cells).toEqual([
          String(RADAR_AXES[i].max),
          ...RADAR_SERIES.map((s) => String(s.data[i])),
        ]);
      }
    });
  },
};
