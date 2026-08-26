import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { NdsChart } from './chart';
import {
  MONTHS,
  SERIE_UNICA,
  SERIES_MULTI,
  DATA_DISPOSITIVO,
  FUNNEL_STAGES,
  RADAR_AXES,
  RADAR_SERIES,
  contrastRatio,
  desenhoDe,
  drawingSettled,
  formasComTrama,
  formasPreenchidas,
  mesmaCor,
  optionOf,
  radarHatches,
  radarPolygons,
  rgbColor,
  rgbToken,
  textosDoDesenho,
  tracadosDeSerie,
} from './chart.fixtures';

const meta: Meta = {
  title: 'UI/Chart/Types',
  decorators: [moduleMetadata({ imports: [NdsChart] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

// `functional.item4` é o PONTEIRO sobre o ponto de dado, e esta story nunca
// aproxima o ponteiro de coisa nenhuma: o que ela mede é que o mesmo par está
// na tabela, sem depender dele. A declaração foi para a story que abre a dica
// de verdade (Settings/WithTooltip) — portão sem dentes vale menos que portão
// nenhum, e é o mesmo defeito que `visual.item2` já teve aqui ao lado.
export const Bar: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item1'],
  },
  render: () => ({
    props: { meses: MONTHS, series: SERIE_UNICA },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Gráfico de barras: acessos mensais no desktop"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    // Uma série só: não há legenda, então toda forma preenchida no desenho é
    // barra — a contagem vale sem filtro extra.
    await waitFor(() =>
      expect(formasPreenchidas(desenho).length).toBe(SERIE_UNICA[0].data.length),
    );

    await step('Uma barra por mês, com altura proporcional ao valor', async () => {
      const barras = formasPreenchidas(desenho);
      const alturas = barras.map((b) => b.getBoundingClientRect().height);
      const values = SERIE_UNICA[0].data;
      // Maior valor → maior barra. Compara ordem, não pixel: o desenho é
      // responsivo e o número absoluto muda com a largura do container.
      const maiorHeight = alturas.indexOf(Math.max(...alturas));
      const maiorValue = values.indexOf(Math.max(...values));
      await expect(maiorHeight).toBe(maiorValue);
    });

    await step('O par categoria/valor está na tabela, sem depender do ponteiro', async () => {
      // A dica sob o ponteiro existe, e nada existe só nela: o mesmo par
      // categoria/valor está na tabela, alcançável sem mouse e sem foco.
      const linhas = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(linhas.map((l) => l.querySelector('th')?.textContent?.trim())).toEqual(MONTHS);
      const celulas = [...chart.querySelectorAll<HTMLTableCellElement>('tbody td')];
      await expect(celulas.map((c) => c.textContent?.trim()))
        .toEqual(SERIE_UNICA[0].data.map(String));
    });

    await step('Cada barra recebe uma trama por cima do preenchimento', async () => {
      // A camada de trama (WCAG 1.4.1) é um segundo caminho sobre a forma, com
      // preenchimento por padrão em vez de cor.
      await expect(formasComTrama(desenho).length).toBe(SERIE_UNICA[0].data.length);
    });

    await step('Com uma série só, o valor também fica escrito no desenho', async () => {
      const texts = textosDoDesenho(desenho);
      for (const value of SERIE_UNICA[0].data) {
        await expect(texts).toContain(String(value));
      }
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item2'],
  },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="line"
        [xAxis]="meses"
        [series]="series"
        label="Gráfico de linhas: acessos mensais por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(tracadosDeSerie(desenho).length).toBeGreaterThanOrEqual(SERIES_MULTI.length),
    );

    await step('Uma linha traçada por série', async () => {
      const tracos = tracadosDeSerie(desenho);
      await expect(tracos.length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
      for (const traco of tracos) {
        await expect(traco.getTotalLength()).toBeGreaterThan(0);
      }
    });

    await step('A paleta do tema chega ao traçado', async () => {
      // A segunda metade do item de contrato: não basta existir traçado, ele
      // tem de sair nos tokens da paleta. Comparar o token RESOLVIDO, e não o
      // texto "hsl(var(--chart-1))", é o que prova que a cascata chegou ao
      // desenho. Compara por conjunto, não por posição: a legenda também
      // desenha um traço, e a ordem no DOM não é contrato.
      const desenhadas = tracadosDeSerie(desenho)
        .map((t) => rgbColor(getComputedStyle(t).stroke))
        .filter((cor): cor is [number, number, number] => cor !== null);
      for (const token of ['--chart-1', '--chart-2']) {
        const esperada = rgbToken(token)!;
        await expect(desenhadas.some((cor) => mesmaCor(cor, esperada))).toBe(true);
      }
    });

    await step('As séries se distinguem por forma, não só por cor', async () => {
      // Retirando toda a cor o gráfico continua legível: símbolo de ponto
      // próprio e desenho de traço próprio por série (WCAG 1.4.1).
      const series = optionOf(desenho).series;
      await expect(series).toHaveLength(SERIES_MULTI.length);
      const simbolos = series.map((s) => String(s['symbol']));
      await expect(new Set(simbolos).size).toBe(SERIES_MULTI.length);
      const tracos = series.map((s) =>
        JSON.stringify((s['lineStyle'] as { type?: unknown } | undefined)?.type),
      );
      await expect(new Set(tracos).size).toBe(SERIES_MULTI.length);
    });

    await step('E o traço distinto chega ao desenho, não fica só na configuração', async () => {
      // Option verde com desenho errado é portão sem dentes: a série tracejada
      // tem de sair com `stroke-dasharray` no nó.
      const desenhos = tracadosDeSerie(desenho).map((t) => t.getAttribute('stroke-dasharray'));
      await expect(new Set(desenhos).size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      const texts = textosDoDesenho(desenho);
      for (const serie of SERIES_MULTI) {
        await expect(texts).toContain(serie.name);
      }
    });
  },
};

export const Area: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="area"
        [xAxis]="meses"
        [series]="series"
        label="Gráfico de área: volume mensal de acessos por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() => expect(desenho.querySelector('svg')).not.toBeNull());

    await step('Cada série ganha uma área preenchida sob a linha', async () => {
      const series = optionOf(desenho).series;
      await expect(series).toHaveLength(SERIES_MULTI.length);
      for (const serie of series) {
        await expect(serie['areaStyle']).toBeTruthy();
      }
      await waitFor(async () => {
        await expect(formasPreenchidas(desenho).length)
          .toBeGreaterThanOrEqual(SERIES_MULTI.length);
      });
    });

    await step('A trama acompanha o preenchimento — a cor não é o único sinal', async () => {
      await expect(formasComTrama(desenho).length).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });
  },
};

export const Pie: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { data: DATA_DISPOSITIVO },
    template: `
      <div ndsChart
        type="pie"
        [data]="data"
        label="Distribuição de acessos por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(formasPreenchidas(desenho).length).toBeGreaterThanOrEqual(DATA_DISPOSITIVO.length),
    );

    await step('Uma fatia por item, cada uma com sua cor', async () => {
      const fatias = formasPreenchidas(desenho);
      // Fatia e ícone de legenda dividem a cor: o que o item promete é uma cor
      // POR ITEM, e é isso que o conjunto mede.
      const colors = new Set(fatias.map((f) => getComputedStyle(f).fill));
      await expect(colors.size).toBe(DATA_DISPOSITIVO.length);
    });

    await step('A legenda traz nome, valor e participação — não só a cor', async () => {
      const texts = textosDoDesenho(desenho);
      for (const ponto of DATA_DISPOSITIVO) {
        await expect(texts.some((text) => text.includes(ponto.label)
          && text.includes(String(ponto.value))
          && text.includes('%'))).toBe(true);
      }
    });

    await step('A tabela repete a participação em número', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toHaveLength(3);
      const first = [...chart.querySelectorAll('tbody tr')][0];
      await expect(first.textContent).toContain('%');
    });
  },
};

export const Funnel: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item5'],
  },
  render: () => ({
    props: { stages: FUNNEL_STAGES },
    template: `
      <div ndsChart
        type="funnel"
        [data]="stages"
        label="Funil de conversão: da visita à compra"
        categoryLabel="Etapa"
        valueLabel="Pessoas"
        shareLabel="Participação"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    // Duas esperas, e cada uma responde por uma coisa.
    //
    // A primeira só pergunta se JÁ HÁ desenho: o coletor devolve zero antes do
    // primeiro quadro, e zero não contradiz nenhuma invariante — quem esperasse
    // só pela invariante passaria por cima de um gráfico que ainda não existe.
    //
    // A segunda espera a ANIMAÇÃO DE ENTRADA fechar, e é ela que faz a contagem
    // abaixo valer: enquanto a entrada corre, TODA forma carrega a marca pela
    // qual o coletor reconhece o fundo da legenda, a primeira faixa passa por
    // legenda, e a legenda inteira deixa de ser excluída — quatro etapas
    // devolvem oito formas. Ver `drawingSettled`.
    //
    // A contagem em si fica FORA de `waitFor` de propósito: dentro de um laço
    // de repetição ela esperaria a animação por acidente e o guarda perderia os
    // dentes — passaria a dar certo mesmo removido.
    await waitFor(() => expect(formasPreenchidas(desenho).length).toBeGreaterThan(0));
    await drawingSettled(desenho);
    await expect(formasPreenchidas(desenho).length).toBe(FUNNEL_STAGES.length);

    await step('Uma faixa por etapa, e a largura cai com o valor', async () => {
      // A largura da faixa É a participação em relação à primeira etapa, e a
      // conferência é de PROPORÇÃO, não de pixel: o desenho é responsivo.
      // Medir dentro do `waitFor` é o que espera a animação de entrada
      // assentar — no primeiro quadro toda faixa mede zero, e ali qualquer
      // razão passaria.
      await waitFor(async () => {
        const widths = formasPreenchidas(desenho).map((f) => f.getBoundingClientRect().width);
        await expect(widths).toHaveLength(FUNNEL_STAGES.length);
        for (let i = 1; i < widths.length; i += 1) {
          await expect(widths[i]).toBeLessThan(widths[i - 1]);
        }
        const esperado = FUNNEL_STAGES[3].value / FUNNEL_STAGES[0].value;
        await expect(Math.abs(widths[3] / widths[0] - esperado)).toBeLessThan(0.03);
      });
    });

    await step('Cada faixa recebe uma trama por cima do preenchimento', async () => {
      // Retirando a cor, a faixa continua distinguível da vizinha (WCAG 1.4.1).
      await expect(formasComTrama(desenho).length).toBe(FUNNEL_STAGES.length);
    });

    await step('Toda faixa tem contorno, e ele passa de 3:1 contra o fundo', async () => {
      // O contorno em --foreground é o que delimita o objeto gráfico e separa
      // uma faixa da vizinha — a cor de série não cobre essa fronteira.
      const background = rgbToken('--background')!;
      const contornos = formasComTrama(desenho);
      for (const contorno of contornos) {
        await expect(getComputedStyle(contorno).strokeWidth).toBe('1px');
      }
      const cor = rgbColor(getComputedStyle(contornos[0]).stroke)!;
      await expect(contrastRatio(cor, background)).toBeGreaterThanOrEqual(3);
    });

    await step('A legenda nomeia cada etapa com valor e participação', async () => {
      // A faixa não escreve o nome dentro de si: sobre a cor de série o texto
      // não alcança os 4.5:1 que precisa. Quem rotula é a legenda.
      const texts = textosDoDesenho(desenho);
      for (const stage of FUNNEL_STAGES) {
        await expect(texts.some((text) => text.includes(stage.label)
          && text.includes(String(stage.value))
          && text.includes('%'))).toBe(true);
      }
    });

    await step('A tabela traz etapa, valor e participação em relação à primeira', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Etapa', 'Pessoas', 'Participação']);

      const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(FUNNEL_STAGES.length);
      const cells = rows.map((row) =>
        [row.querySelector('th'), ...row.querySelectorAll('td')]
          .map((c) => c?.textContent?.trim()),
      );
      // A primeira etapa é a base da conta, então vale 100% por definição; a
      // última é a queda que o funil existe para mostrar.
      await expect(cells[0]).toEqual(['Visitas', '4000', '100%']);
      await expect(cells[3]).toEqual(['Compra', '480', '12%']);
    });
  },
};

export const Radar: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
  },
  render: () => ({
    props: { axes: RADAR_AXES, measurements: RADAR_SERIES },
    template: `
      <div ndsChart
        type="radar"
        [radarAxes]="axes"
        [series]="measurements"
        label="Radar de qualidade do site: cinco grandezas, antes e depois da revisão"
        categoryLabel="Eixo"
        maxLabel="Máximo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    // Duas esperas, e cada uma responde por uma coisa. A primeira só pergunta
    // se JÁ HÁ desenho — antes do primeiro quadro o coletor devolve zero, e
    // zero não contradiz invariante nenhuma. A segunda espera a animação de
    // entrada fechar, e é ela que faz a contagem valer.
    await waitFor(() => expect(radarPolygons(desenho).length).toBeGreaterThan(0));
    await drawingSettled(desenho);

    await step('Um polígono por série — nem um a mais', async () => {
      // Igualdade. Com "no mínimo", passariam tanto a contagem dobrada pela
      // trama quanto a inchada pelos dez símbolos de vértice; o portão só
      // reprovaria com o desenho vazio.
      //
      // E a faixa alternada do padrão da lib é pega um passo acima, na espera:
      // uma das duas sai com `fill-opacity="0"`, que é a marca pela qual o
      // coletor reconhece o fundo da legenda. Com ela ligada há DOIS retângulos
      // transparentes na tela e `drawingSettled` não fecha — medido, plantando
      // o defeito. `splitArea` desligado no tema não é preferência de gosto.
      //
      // Dentro de `waitFor` porque o polígono entra CRESCENDO a partir do
      // centro: a marca de opacidade que `drawingSettled` observa fecha antes
      // de a geometria assentar, e `radarPolygons` exige caixa não-zero. Só
      // leitura aqui dentro — nada que mexa no DOM.
      await waitFor(async () => {
        await expect(radarPolygons(desenho).length).toBe(RADAR_SERIES.length);
      });
    });

    await step('Cada eixo aparece escrito em volta do polígono', async () => {
      // O nome do eixo é a única pista de QUE grandeza cada vértice mede.
      const texts = textosDoDesenho(desenho);
      for (const axis of RADAR_AXES) {
        await expect(texts.some((text) => text.includes(axis.label))).toBe(true);
      }
    });

    await step('A legenda nomeia cada série por escrito', async () => {
      // Os eixos nomeiam as grandezas, não as séries: sem a legenda, a única
      // pista de qual polígono é qual seria a cor.
      const texts = textosDoDesenho(desenho);
      for (const serie of RADAR_SERIES) {
        await expect(texts.some((text) => text.includes(serie.name))).toBe(true);
      }
    });

    await step('Os eixos do radar saem do TEMA, e não do padrão da lib', async () => {
      // O radar é o único tipo com eixos PRÓPRIOS, e sem bloco de tema eles
      // nascem nos cinzas cravados da lib: um gráfico do design system com
      // eixos que não são do design system. Este passo é o que impede isso de
      // voltar calado.
      //
      // O token é lido do valor bruto e convertido — sem pendurar sonda no DOM,
      // que dentro de uma espera provocaria a própria retentativa.
      const muted = rgbToken('--muted-foreground')!;
      const axisName = [...desenho.querySelectorAll<SVGTextElement>('svg text')]
        .find((no) => (no.textContent ?? '').trim() === 'SEO');
      await expect(axisName).toBeDefined();
      // O nome do eixo é TEXTO, então segue a cor de texto secundário do tema.
      const painted = rgbColor(getComputedStyle(axisName!).fill)!;
      await expect(mesmaCor(painted, muted)).toBe(true);
      // E o tamanho é MEDIDO, não cravado: o degrau de 0.75 sobre a fonte raiz
      // — o mesmo do rótulo do eixo cartesiano. Com pixel escolhido, o nome
      // pararia de crescer quando a pessoa aumenta a fonte do navegador
      // (WCAG 1.4.4), enquanto o resto da página cresce ao lado.
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(getComputedStyle(axisName!).fontSize)
        .toBe(`${Math.round(rootSize * 0.75)}px`);
    });

    await step('Cada polígono recebe uma trama por cima do preenchimento', async () => {
      // WCAG 1.4.1 — retirando a cor, um polígono continua distinguível do
      // outro. Uma trama POR polígono, e não "pelo menos uma": com o limite
      // inferior, um desenho em que a hachura alcançasse só a primeira série
      // passava igual.
      await waitFor(async () => {
        await expect(radarHatches(desenho).length).toBe(RADAR_SERIES.length);
      });
    });

    await step('A tabela traz eixo, máximo do eixo e o valor de cada série', async () => {
      // A coluna do meio é o que separa esta tabela da do gráfico de barras, e
      // ela existe porque o desenho comunica uma RAZÃO: o vértice é o valor
      // sobre o teto DAQUELE eixo. Sem o teto escrito, "9" e "96" seriam dois
      // números soltos e o polígono na tela não teria explicação.
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Eixo', 'Máximo', ...RADAR_SERIES.map((s) => s.name)]);

      const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(RADAR_AXES.length);
      const cells = rows.map((row) =>
        [row.querySelector('th'), ...row.querySelectorAll('td')]
          .map((c) => c?.textContent?.trim()),
      );
      // Duas linhas com tetos diferentes: é o par que mostra por que a coluna
      // existe — 9 sobre 10 e 96 sobre 100 desenham vértices vizinhos.
      await expect(cells[2]).toEqual(['Boas práticas', '10', '6', '9']);
      await expect(cells[3]).toEqual(['SEO', '100', '88', '96']);
    });
  },
};
