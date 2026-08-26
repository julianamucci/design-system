import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { NdsChart } from './chart';
import {
  MONTHS,
  SERIE_UNICA,
  SERIES_MULTI,
  contrastRatio,
  desenhoDe,
  formasComTrama,
  formasPreenchidas,
  instanciaDe,
  rgbColor,
  rgbToken,
  textosDoDesenho,
  tracadosDeSerie,
} from './chart.fixtures';

const meta: Meta = {
  title: 'UI/Chart/States',
  decorators: [moduleMetadata({ imports: [NdsChart] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const Empty: Story = {
  parameters: { covers: ['functional.item1', 'visual.item3'] },
  render: () => ({
    props: { vazio: [] },
    template: `
      <div ndsChart
        [series]="vazio"
        label="Acessos mensais"
        emptyLabel="Nenhum dado disponível para o período selecionado."
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;

    await step('Sem dado não há desenho — há uma frase', async () => {
      // Frase completa com orientação, não "Sem dados.": é a regra de UX
      // writing do estado vazio.
      await expect(chart.querySelector('[data-slot="chart-canvas"]')).toBeNull();
      await expect(chart.querySelector('svg')).toBeNull();
      const aviso = chart.querySelector('.nds-chart-empty')!;
      await expect(aviso.textContent?.trim())
        .toBe('Nenhum dado disponível para o período selecionado.');
    });

    await step('E a frase não fica escondida atrás de um papel de imagem', async () => {
      // `role="img"` PODA a subárvore: no estado vazio ele esconderia justamente
      // o conteúdo que explica a ausência de dado.
      await expect(chart.getAttribute('role')).toBeNull();
    });

    await step('O container mantém a altura mínima', async () => {
      // Sem piso, o bloco colapsa e a página salta quando o dado chega.
      await expect(chart.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

export const SingleSeries: Story = {
  render: () => ({
    props: { meses: MONTHS, series: SERIE_UNICA },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais no desktop"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(formasPreenchidas(desenho).length).toBe(SERIE_UNICA[0].data.length),
    );

    await step('Com uma série a legenda some — não há o que comparar', async () => {
      const texts = textosDoDesenho(desenho);
      await expect(texts).not.toContain(SERIE_UNICA[0].name);
    });

    await step('Sem legenda ocupando espaço, o valor cabe junto do dado', async () => {
      // A contrapartida de esconder a legenda: com uma série só não há números
      // se sobrepondo, então o valor exato é escrito no desenho.
      await waitFor(async () => {
        const texts = textosDoDesenho(desenho);
        for (const value of SERIE_UNICA[0].data) {
          await expect(texts).toContain(String(value));
        }
      });
    });

    await step('A tabela tem duas colunas: categoria e a única série', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Categoria', SERIE_UNICA[0].name]);
    });
  },
};

// `visual.item2` é o gráfico de LINHAS multi-série; esta story desenha barras.
// A declaração estava aqui e era falsa — o Chromatic olhava para o desenho
// errado e passava. Quem cobre o item é a story Line, que é de linhas mesmo.
export const MultiSeries: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo: desktop e mobile"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(formasPreenchidas(desenho).length)
        .toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length),
    );

    await step('Legenda automática com o nome de cada série', async () => {
      const texts = textosDoDesenho(desenho);
      for (const serie of SERIES_MULTI) {
        await expect(texts).toContain(serie.name);
      }
    });

    await step('Cada série usa um token de cor distinto', async () => {
      // Barra e ícone de legenda dividem a cor da série, então o que a contagem
      // mede é quantas cores DIFERENTES o desenho usa — que é o item.
      const colors = new Set(formasPreenchidas(desenho).map((b) => getComputedStyle(b).fill));
      await expect(colors.size).toBe(SERIES_MULTI.length);
    });

    await step('E também uma trama distinta — a cor não é o único sinal', async () => {
      // Tirando a cor, a hachura ainda separa as séries (WCAG 1.4.1). Cada
      // série gera um padrão próprio, e todas as suas formas o referenciam.
      const tramas = new Set(formasComTrama(desenho).map((r) => r.getAttribute('fill')));
      await expect(tramas.size).toBe(SERIES_MULTI.length);
    });

    await step('A tabela ganha uma coluna por série', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toHaveLength(SERIES_MULTI.length + 1);
      await expect(header.slice(1)).toEqual(SERIES_MULTI.map((s) => s.name));
    });
  },
};

/**
 * Tema escuro. A cor de série sai dos tokens `--chart-n` resolvidos no `<html>`
 * e entregues à lib como tema registrado; trocar a classe do documento dispara
 * a releitura, e a instância recolore NO LUGAR, sem remontar.
 *
 * Desenha barras E linhas: o item de regressão visual que esta story declara
 * fala dos dois, e um só deles deixaria metade do item fotografada por ninguém.
 */
export const DarkTheme: Story = {
  parameters: { covers: ['functional.item6', 'visual.item4'], controls: { disable: true } },
  globals: { theme: 'dark' },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo, em barras"
      ></div>
      <div ndsChart
        type="line"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo, em linhas"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const graficos = [...canvasElement.querySelectorAll<HTMLElement>('.nds-chart')];
    const chart = graficos[0];
    const desenho = desenhoDe(chart);
    const html = document.documentElement;
    const darkEra = html.classList.contains('dark');

    await waitFor(() =>
      expect(formasPreenchidas(desenho).length)
        .toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length),
    );

    await step('Os dois tipos estão na foto', async () => {
      // O item de regressão visual fala de barras E linhas.
      await expect(graficos).toHaveLength(2);
      const linhas = desenhoDe(graficos[1]);
      await waitFor(() =>
        expect(tracadosDeSerie(linhas).length).toBeGreaterThanOrEqual(SERIES_MULTI.length),
      );
    });

    await step('Trocar o tema recolore sem remontar', async () => {
      // A sonda da recolorização é o TEXTO do eixo, não a barra. Serve às duas
      // eras da paleta: hoje --chart-1 a --chart-8 têm variante por modo, então
      // a barra também mudaria — mas o texto do eixo é a sonda estável, porque
      // não depende de qual série a lib pintou primeiro nem de a forma já ter
      // sido desenhada.
      const idAntes = instanciaDe(desenho).id;
      const corDoEixo = () => getComputedStyle(desenho.querySelector('text')!).fill;
      try {
        await waitFor(async () => {
          await expect(textosDoDesenho(desenho).length).toBeGreaterThan(0);
        });
        // A cor em que a story ABRIU. Medir daqui, e não depois de já ter
        // trocado a classe, é o que impede a armadilha: a releitura do tema
        // passa por um observador do `<html>` e por uma repintura, então ler no
        // mesmo tique da troca devolve a cor ANTIGA — e a comparação seguinte
        // vira "escuro contra escuro", que nunca difere e só expira.
        const inicial = corDoEixo();

        // Ida: troca o modo e ESPERA a cor assentar antes de guardá-la.
        html.classList.toggle('dark');
        await waitFor(async () => {
          await expect(corDoEixo()).not.toBe(inicial);
        });
        const trocada = corDoEixo();

        // Volta: o mesmo, no sentido contrário. Os dois sentidos porque a
        // promessa é recolorir a cada troca, não uma vez só.
        html.classList.toggle('dark');
        await waitFor(async () => {
          await expect(corDoEixo()).not.toBe(trocada);
        });

        // Mesma instância: a lib recoloriu no lugar, não foi descartada e
        // recriada — é o "não pisca nem requer reload" que a doc promete.
        await expect(instanciaDe(desenho).id).toBe(idAntes);
      } finally {
        // Repõe o estado que ENCONTROU. No Storybook o `globals` desta story
        // deixa o escuro posto, e é ele que o Chromatic fotografa; na suíte, em
        // que as stories dividem o mesmo documento, repor evita envenenar a
        // próxima.
        html.classList.toggle('dark', darkEra);
      }
    });
  },
};

/**
 * WCAG 1.4.11: objeto gráfico precisa de 3:1 contra o que está ao redor.
 *
 * Quem sustenta o critério aqui é o CONTORNO das formas. Ele nasceu quando a
 * paleta ia de 2.07 a 13.23 no claro e de 1.00 a 6.41 no escuro — uma das cores
 * ERA o fundo, com contraste 1.00. Com as oito cores por modo o pior caso passou
 * a 7.32 no claro e 6.83 no escuro, e o contorno em `--foreground` continua
 * delimitando cada objeto independentemente da paleta escolhida.
 */
export const GraphicContrast: Story = {
  parameters: { covers: ['accessibility.item3'], controls: { disable: true } },
  render: () => ({
    props: { meses: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="meses"
        [series]="series"
        label="Acessos mensais por dispositivo"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    const background = rgbToken('--background')!;
    await waitFor(() =>
      expect(formasComTrama(desenho).length)
        .toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length),
    );

    await step('Toda forma de dado tem contorno', async () => {
      // A camada de trama herda o contorno da forma que cobre — uma por barra
      // desenhada, mais a da legenda.
      const contornos = formasComTrama(desenho);
      await expect(contornos.length).toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length);
      for (const contorno of contornos) {
        // A largura é lida do estilo calculado, e não do atributo: a lib só
        // escreve `stroke-width` quando ele difere de 1, então o atributo
        // ausente é justamente o caso correto.
        await expect(getComputedStyle(contorno).strokeWidth).toBe('1px');
      }
    });

    await step('O contorno passa de 3:1 contra o fundo', async () => {
      const contorno = formasComTrama(desenho)[0];
      const cor = rgbColor(getComputedStyle(contorno).stroke)!;
      await expect(contrastRatio(cor, background)).toBeGreaterThanOrEqual(3);
    });

    await step('O texto dos eixos passa de 4.5:1', async () => {
      const axisTexts = [...desenho.querySelectorAll<SVGTextElement>('svg text')];
      await expect(axisTexts.length).toBeGreaterThan(0);
      for (const axisText of axisTexts) {
        const cor = rgbColor(getComputedStyle(axisText).fill)!;
        await expect(contrastRatio(cor, background)).toBeGreaterThanOrEqual(4.5);
      }
    });
  },
};
