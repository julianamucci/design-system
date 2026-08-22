import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption, buildLineOption } from './index';
import ChartDualStory from './ChartDualStory.svelte';
import {
  settleTheme,
  contraste,
  corDoToken, designEscreve, designPintado, exigirRoot, datumFormas,
  backgroundOpacoAtras, designTexts, tramasAplicadas,
} from '@shared/testing/chart-probe';
import { waitForDesign } from './chart.fixtures';
import {
  chartBarrasSource,
  chartDoisTypesSource,
  chartMultiSerieSource,
  chartSource,
  chartEmptySource,
} from './chart.source';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr'];
const SERIE_UNICA = [{ name: 'Vendas', data: [186, 305, 237, 73] }];
const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile', data: [80, 200, 120, 190] },
  { name: 'Tablet', data: [40, 90, 60, 100] },
];

const FRASE_VAZIA = 'Nenhum dado disponível para o período selecionado.';

const meta: Meta = {
  // Sem argTypes: sem isto o painel Controls abre vazio.
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada estado sobrescreve com
      // a própria composição logo abaixo.
      source: { transform: chartSource },
    },
  },
  title: 'UI/Chart/States',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

export const Empty: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
      source: { transform: chartEmptySource },
      description: { story: 'Sem série com dado, o desenho dá lugar a uma frase que orienta a próxima ação.' },
    },
  },
  args: {
    option: buildBarOption({ data: [] }),
    height: 240,
    class: 'nds-w-full',
    emptyLabel: FRASE_VAZIA,
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      await expect(raiz.querySelector('svg')).toBeNull();
      const aviso = raiz.querySelector('.nds-chart-empty');
      // Frase completa e orientadora, não "Sem dados.": é a regra de UX writing
      // do estado vazio, e é ela que a story passa em `emptyLabel`.
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
    });

    await step('Sem desenho, sem papel de imagem: a frase é o conteúdo', async () => {
      // `role="img"` poda a subárvore da árvore de acessibilidade — com ele, a
      // frase que explica a ausência de dado ficaria escondida atrás de um
      // rótulo genérico. E aria-label em div sem papel é atributo proibido.
      await expect(raiz.getAttribute('role')).toBeNull();
      await expect(raiz.getAttribute('aria-label')).toBeNull();
    });

    await step('O bloco mantém a altura pedida — a página não salta quando o dado chega', async () => {
      await expect(raiz.getBoundingClientRect().height).toBeCloseTo(240, -1);
    });
  },
};

export const SingleSeries: Story = {
  parameters: {
    docs: {
      source: { transform: chartBarrasSource },
      description: { story: 'Uma série só: a legenda não aparece, porque não há o que comparar.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIE_UNICA }),
    height: 240,
    class: 'nds-w-full',
    'aria-label': 'Gráfico de barras: acessos mensais no desktop',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitForDesign(raiz);

    await step('O desenho saiu de verdade — controle da medição negativa abaixo', async () => {
      await waitFor(() => {
        for (const month of MONTHS) expect(designEscreve(raiz, month)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('Com uma série a legenda some — o nome da série não é escrito', async () => {
      await expect(designTexts(raiz)).not.toContain(SERIE_UNICA[0].name);
      // E some só a legenda: as formas de dado continuam todas lá.
      await expect(datumFormas(raiz).length).toBeGreaterThanOrEqual(MONTHS.length);
    });
  },
};

export const MultiSeries: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      source: { transform: chartMultiSerieSource },
      description: { story: 'Mais de uma série: legenda automática e trama própria por série.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 280,
    class: 'nds-w-full',
    'aria-label': 'Acessos mensais por dispositivo: desktop, mobile e tablet',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitForDesign(raiz);

    await step('A legenda escreve o nome de cada série', async () => {
      await waitFor(() => {
        for (const serie of SERIES_MULTI) expect(designEscreve(raiz, serie.name)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('E cada série ganha uma trama própria — a cor não é o único sinal', async () => {
      // Tirando a cor, a hachura ainda separa as séries (WCAG 1.4.1). Medido:
      // uma trama distinta por série, reaproveitada pelo ícone da legenda — daí
      // a igualdade com o número de séries, e não a soma das formas.
      await waitFor(
        () => expect(tramasAplicadas(raiz).size).toBe(SERIES_MULTI.length),
        { timeout: 3000 },
      );
    });
  },
};

/**
 * Tema escuro.
 *
 * A cor do texto do eixo é a sonda da recolorização, não a cor das barras: a
 * paleta de série (`--chart-1` a `--chart-5`) é a mesma nos dois modos de
 * propósito — está declarada só em `:root` e nos temas de marca, sem bloco
 * `.dark`. Medir a barra afirmaria que a cor muda, e ela não muda em tema
 * nenhum.
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
    docs: {
      source: { transform: chartDoisTypesSource },
      description: { story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, não de valores cravados.' },
    },
  },
  render: () => ({
    Component: ChartDualStory,
    props: {
      optionBar: buildBarOption({ xAxis: MONTHS, series: SERIES_MULTI }),
      optionLine: buildLineOption({ xAxis: MONTHS, series: SERIES_MULTI }),
      labelBar: 'Acessos mensais por dispositivo, em barras',
      labelLine: 'Acessos mensais por dispositivo, em linhas',
    },
  }),
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
 * tokens `--chart-1` a `--chart-5` ficam em torno de 2:1 contra o fundo e mais
 * perto ainda entre vizinhos. O contorno em `--foreground` delimita cada objeto
 * qualquer que seja a paleta escolhida.
 */
export const GraphicContrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      source: { transform: chartMultiSerieSource },
      description: { story: 'Contorno das formas e texto dos eixos medidos contra o fundo da página.' },
    },
  },
  args: {
    option: buildBarOption({ xAxis: MONTHS, series: SERIES_MULTI }),
    height: 280,
    class: 'nds-w-full',
    'aria-label': 'Acessos mensais por dispositivo',
  },
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitForDesign(raiz);
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const background = backgroundOpacoAtras(raiz);

    await step('Todo objeto gráfico passa de 3:1 pelo contorno', async () => {
      const formas = datumFormas(raiz);
      // Uma forma de cor e uma de trama por barra desenhada, mais as da legenda.
      await expect(formas.length).toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length);
      for (const forma of formas) {
        await expect(contraste(getComputedStyle(forma).stroke, background)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('O texto dos eixos passa de 4.5:1 — é texto, não objeto', async () => {
      const rotulos = [...raiz.querySelectorAll<SVGTextElement>('svg text')];
      await expect(rotulos.length).toBeGreaterThan(0);
      for (const rotulo of rotulos) {
        await expect(contraste(getComputedStyle(rotulo).fill, background)).toBeGreaterThanOrEqual(4.5);
      }
    });
  },
};
