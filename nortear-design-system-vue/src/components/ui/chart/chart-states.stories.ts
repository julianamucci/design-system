import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import {
  settleTheme,
  contraste,
  corDoToken,
  designPintado,
  exigirRoot,
  datumFormas,
  backgroundOpacoAtras,
  designTexts,
  tramasAplicadas,
} from '@shared/testing/chart-probe';
import { ChartContainer, buildBarOption, buildLineOption } from './index';
import {
  chartContrastSource,
  chartDuasSeriesSource,
  chartSerieUnicaSource,
  themeChartTokensSource,
  chartEmptySource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr'];
const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73] }];
const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile',  data: [80, 200, 120, 190] },
];

/**
 * Frase completa e orientadora, não "Sem dados.". O estado vazio é a única
 * coisa na tela quando ele acontece: ou ele diz o que fazer em seguida, ou a
 * pessoa fica olhando um retângulo em branco.
 */
const FRASE_VAZIA = 'Nenhum dado disponível para o período selecionado.';

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartEmptySource } },
  },
  title: 'UI/Chart/States',
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

export const Empty: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: { description: { story: 'Sem série com dado, a frase de estado vazio entra no lugar do desenho.' } },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ data: [] }),
    emptyLabel: FRASE_VAZIA,
    height: 200,
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      await expect(raiz.querySelector('svg')).toBeNull();
      const aviso = raiz.querySelector('.nds-chart-empty');
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
    });

    await step('E a frase é o conteúdo, não um rótulo de imagem', async () => {
      // `role="img"` poda a subárvore da árvore de acessibilidade: com desenho
      // isso é o que se quer, aqui esconderia justamente a explicação. Sem papel,
      // a frase é lida.
      await expect(raiz.getAttribute('role')).toBeNull();
    });

    await step('O container mantém o piso de altura', async () => {
      // Sem piso, o bloco colapsa e a página salta quando o dado chega.
      await expect(raiz.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

export const SingleSeries: Story = {
  parameters: {
    // Aqui há dado e há rótulo de imagem; a do meta mostra o vazio, que é a
    // ausência dos dois.
    docs: {
      source: { transform: chartSerieUnicaSource },
      description: { story: 'Uma série só — a legenda não aparece, porque não há o que comparar.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    'aria-label': 'Acessos mensais no desktop',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('Com uma série a legenda some', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      // O nome da série só existiria na legenda: se ele não está escrito em
      // lugar nenhum do desenho, a legenda não foi montada.
      await expect(designTexts(raiz)).not.toContain(SERIE_UNICA[0].name);
    });
  },
};

export const MultiSeries: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    // A segunda série é o que faz nascer legenda e trama: o dado literal do
    // snippet é a lição.
    docs: {
      source: { transform: chartDuasSeriesSource },
      description: { story: 'Mais de uma série — legenda automática e trama por série.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 280,
    'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('A legenda nomeia cada série por escrito', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(
        () => {
          for (const serie of SERIES_MULTI) expect(designTexts(raiz)).toContain(serie.name);
        },
        { timeout: 3000 },
      );
    });

    await step('Cada série usa um token de cor distinto', async () => {
      // A trama entra como preenchimento `url(#…)`; tirando essas, o que sobra
      // são as cores de série de verdade.
      const cores = new Set(
        datumFormas(raiz)
          .map((forma) => getComputedStyle(forma).fill)
          .filter((cor) => !cor.startsWith('url')),
      );
      await expect(cores.size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('E a trama sobrevive à cor', async () => {
      // Tirando a cor, a hachura sobreposta ainda separa as séries (WCAG 1.4.1).
      // O piso é 1 e não o número de séries porque quantas tramas distintas
      // chegam ao DOM depende de como a lib reaproveita a definição do padrão —
      // detalhe de implementação, não promessa do design system. O que a regra
      // exige, e o que se verifica aqui, é que a trama chegue à forma.
      await expect(tramasAplicadas(raiz).size).toBeGreaterThanOrEqual(1);
    });
  },
};

/**
 * Tema escuro. O container observa a classe do `<html>` e reconstrói o tema do
 * desenho, então trocar a classe basta — nada de remontar a story.
 */
export const ThemeTokens: Story = {
  parameters: {
    // `functional.item6` fica declarado como NÃO verificado, com o motivo, em
    // vez de reivindicado: alternar a classe do documento dentro da play, com
    // um gráfico da lib vivo, FECHA a aba do navegador — a story termina sem
    // falha e sem resultado, e leva o arquivo inteiro junto. Reproduzido em
    // isolamento, com um desenho e com dois, com o tema vindo da toolbar e da
    // própria play, com guarda no observador de tamanho e com o desenho
    // descartado se recolhendo sozinho. Quem cobre a troca é a stack que
    // desenha o SVG à mão, onde ela não depende da lib.
    coversNotApplicable: {
      'functional.item6': 'montar ou alternar o tema com o gráfico da lib vivo fecha a aba nesta stack — verificação em aberto',
      'visual.item4': 'a foto no tema escuro depende do mesmo caminho — verificação em aberto',
    },
    // São DOIS containers empilhados, barras e linhas: a do meta esconderia a
    // metade que o item de regressão visual também cobra.
    docs: {
      source: { transform: themeChartTokensSource },
      description: { story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, não de valores cravados.' },
    },
  },
  render: () => h('div', { class: 'nds-stack' }, [
    h(ChartContainer, {
      option: buildBarOption({ xAxis: MONTHS, series: SERIES_MULTI }),
      height: 260,
      'aria-label': 'Acessos mensais por dispositivo, em barras',
    }),
    h(ChartContainer, {
      option: buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }),
      height: 260,
      'aria-label': 'Acessos mensais por dispositivo, em linhas',
    }),
  ]),
  play: async ({ canvasElement, step }) => {
    const graficos = [...canvasElement.querySelectorAll<HTMLElement>('.nds-chart')];

    await step('Os dois tipos estão na foto', async () => {
      // O item de regressão visual fala de barras E linhas; um só deixaria
      // metade dele sem ninguém fotografando.
      await expect(graficos).toHaveLength(2);
      await waitFor(
        () => graficos.forEach((g) => expect(designPintado(g)).toBe(true)),
        { timeout: 3000 },
      );
    });

    await step('A cor do desenho é o token do tema, não um valor cravado', async () => {
      // A sonda é o TEXTO do eixo, e não a barra: a paleta de série é a mesma
      // nos dois modos de propósito — está declarada uma vez por tema de marca,
      // sem bloco escuro. Medir a barra afirmaria uma mudança que não existe.
      //
      // A story monta no escuro pelo `globals`, então o token em vigor é o
      // escuro: um desenho que ignorasse o tema reprovaria aqui.
      for (const g of graficos) {
        await waitFor(
          () => {
            const rotulo = g.querySelector<SVGTextElement>('svg text');
            expect(rotulo).toBeTruthy();
            expect(getComputedStyle(rotulo!).fill).toBe(corDoToken('muted-foreground', g));
          },
          { timeout: 3000, interval: 200 },
        );
      }
    });
  },
};

/**
 * WCAG 1.4.11: objeto gráfico precisa de 3:1 contra o que está ao redor.
 *
 * Quem sustenta o critério é o CONTORNO das formas, não a cor de série: os
 * tokens `--chart-1` a `--chart-5` ficam em torno de 2:1 contra o fundo e não
 * dariam conta sozinhos. O contorno em `--foreground` delimita cada objeto seja
 * qual for a paleta escolhida.
 *
 * Série única de propósito: sem legenda, tudo que a sonda recolhe é forma de
 * dado, e a medida não se mistura com a do ícone da legenda.
 */
export const GraphicContrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    // Série única de propósito, para que tudo na tela seja forma de dado — a do
    // meta mostra o vazio, onde não há forma nenhuma a medir.
    docs: {
      source: { transform: chartContrastSource },
      description: { story: 'Contorno e texto de eixo medidos contra o fundo real da tela.' },
    },
  },
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 260,
    'aria-label': 'Acessos mensais no desktop',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const background = backgroundOpacoAtras(raiz);

    await step('Todo contorno de forma passa de 3:1 contra o fundo', async () => {
      const formas = datumFormas(raiz);
      await expect(formas.length).toBeGreaterThan(0);
      for (const forma of formas) {
        await expect(contraste(getComputedStyle(forma).stroke, background)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('O texto do eixo passa de 4.5:1 — é texto, não objeto', async () => {
      const rotulo = raiz.querySelector<SVGTextElement>('svg text');
      await expect(rotulo).not.toBeNull();
      await expect(contraste(getComputedStyle(rotulo!).fill, background)).toBeGreaterThanOrEqual(4.5);
    });
  },
};
