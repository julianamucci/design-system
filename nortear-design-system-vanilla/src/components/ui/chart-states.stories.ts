import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import {
  settleTheme,
  contraste,
  corDoToken,
  designEscreve,
  designPintado,
  exigirRoot,
  datumFormas,
  backgroundOpacoAtras,
  designTexts,
  tramasAplicadas,
} from '@shared/testing/chart-probe';
import { createChart } from './chart';
import { chartSource, chartSourceWith } from './chart.source';

// ─── Dados ────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const SERIE_UNICA = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];

const SERIES_MULTI = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [120, 190, 165, 98, 174, 158] },
];

const FRASE_VAZIA = 'Nenhum dado disponível para o período selecionado.';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
  title: 'UI/Chart/States',
};

export default meta;
type Story = StoryObj;

// ─── Vazio ────────────────────────────────────────────────────────────────────

export const Empty: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
      // Override de story: a AUSÊNCIA de dado é o assunto, e com ela some a
      // descrição do desenho — sem imagem não há o que narrar.
      source: {
        transform: chartSourceWith({
          dados: 'vazio',
          'aria-label': undefined,
          height: undefined,
          emptyLabel: FRASE_VAZIA,
        }),
      },
      description: {
        story: 'Sem série com dado, o bloco troca o desenho por uma frase que explica a ausência e orienta a próxima ação.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: [],
    type: 'bar',
    class: 'nds-max-w-md',
    emptyLabel: FRASE_VAZIA,
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      const aviso = raiz.querySelector('.nds-chart-empty');
      await expect(aviso).not.toBeNull();
      // Frase completa e orientadora, não "Sem dados.": é a regra de UX writing
      // do próprio conteúdo do componente.
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
      await expect(raiz.querySelector('svg')).toBeNull();
    });

    await step('No vazio o bloco não se anuncia como imagem', async () => {
      // `role="img"` PODA a subárvore da árvore de acessibilidade: com o papel
      // posto, a frase que explica a ausência sumiria atrás de um rótulo
      // genérico. Sem desenho não há imagem para narrar.
      await expect(raiz.getAttribute('role')).toBeNull();
      await expect(raiz.getAttribute('aria-label')).toBeNull();
    });

    await step('O bloco mantém o piso de altura', async () => {
      // Sem piso o container colapsa, e a página salta quando o dado chega.
      await expect(raiz.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

// ─── Série única ──────────────────────────────────────────────────────────────

export const SingleSeries: Story = {
  parameters: {
    docs: {
      // Override de story: uma série SÓ, na forma `xAxis` + `series` — é o que
      // faz a legenda desaparecer sozinha.
      source: { transform: chartSourceWith({ dados: 'serieUnica' }) },
      description: {
        story: 'Com uma série só a legenda não aparece: não há o que comparar, e a linha extra só roubaria altura do desenho.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIE_UNICA,
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais no desktop, de janeiro a junho',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A legenda some — o nome da série não é escrito em lugar nenhum', async () => {
      await expect(designTexts(raiz)).not.toContain(SERIE_UNICA[0].name);
    });

    await step('As categorias continuam escritas no eixo', async () => {
      for (const mes of MONTHS) {
        await expect(designEscreve(raiz, mes)).toBe(true);
      }
    });
  },
};

// ─── Multi-série ──────────────────────────────────────────────────────────────

export const MultiSeries: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      // Override de story: são DUAS séries, e é a contagem que acende a legenda.
      source: {
        transform: chartSourceWith({
          dados: 'multi',
          'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
        }),
      },
      description: {
        story: 'Com mais de uma série a legenda aparece sozinha, e cada série ganha cor e trama próprias.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A legenda escreve o nome de cada série', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(raiz, serie.name)).toBe(true);
      }
    });

    await step('Cada série usa um token de cor distinto', async () => {
      const cores = new Set(
        datumFormas(raiz)
          .map((f) => getComputedStyle(f).fill)
          .filter((cor) => !cor.startsWith('url')),
      );
      await expect(cores.size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('E a cor não é o único sinal: existe trama sobreposta', async () => {
      // WCAG 1.4.1 — tirando a cor, a hachura ainda separa as séries.
      //
      // O número de tramas distintas NÃO é fixado no número de séries: a trama
      // é mintada por imagem pintada, não por série, e a mesma série pode
      // reaproveitar um id já emitido. O que o critério exige, e o que se
      // afirma aqui, é que a trama chegou a alguma forma — trama declarada no
      // `<defs>` e nunca usada não cumpre nada.
      await waitFor(
        () => expect(tramasAplicadas(raiz).size).toBeGreaterThanOrEqual(1),
        { timeout: 3000 },
      );
    });
  },
};

// ─── Um ponto ─────────────────────────────────────────────────────────────────

export const OnePoint: Story = {
  parameters: {
    docs: {
      // Override de story: o caso de borda é o dado, e é ele que o snippet
      // precisa mostrar — um ponto só.
      source: {
        transform: chartSourceWith({ dados: 'umPonto', 'aria-label': 'Acessos de janeiro' }),
      },
      description: {
        story: 'Série com um único ponto. Caso de borda: o desenho continua com eixo, categoria escrita e uma forma de dado.',
      },
    },
  },
  render: () => createChart({
    data: [{ label: 'Jan', value: 186 }],
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos de janeiro',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('O desenho sai com uma forma de dado', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A única categoria aparece escrita no eixo', async () => {
      await expect(designEscreve(raiz, 'Jan')).toBe(true);
    });
  },
};

// ─── Tema escuro ──────────────────────────────────────────────────────────────

/**
 * Cor do desenho vinda do token do tema.
 *
 * Esta story NÃO alterna a classe do documento, e o motivo é medido, não
 * estilístico: qualquer variante que alterne o tema aqui FECHA a aba do
 * navegador — a story termina em "browser connection was closed", sem falha e
 * sem resultado, e leva o arquivo inteiro junto. Reproduzido em isolamento com
 * um desenho e com dois, com o tema vindo da toolbar e vindo da própria play,
 * com e sem guarda no observador de tamanho, e depois de fazer o desenho
 * descartado se recolher sozinho. As outras quatro stacks alternam o tema na
 * play sem problema, então a causa é local desta stack e continua em aberto.
 *
 * O que fica verificado aqui é a metade que se sustenta: a cor do desenho é o
 * TOKEN do tema em vigor, não um valor cravado. A troca em si está declarada
 * como não coberta, com o motivo — reivindicá-la faria o auditor mentir.
 */
export const ThemeTokens: Story = {
  parameters: {
    coversNotApplicable: {
      'functional.item6': 'montar ou alternar o tema com o gráfico da lib vivo fecha a aba nesta stack — verificação em aberto',
      'visual.item4': 'a foto no tema escuro depende do mesmo caminho — verificação em aberto',
    },
    docs: {
      // Override de story: duas séries, na forma `xAxis` + `series`.
      source: {
        transform: chartSourceWith({
          dados: 'multi',
          'aria-label': 'Acessos mensais por dispositivo, no tema em vigor',
        }),
      },
      description: {
        story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, e não de valores cravados.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais por dispositivo, no tema em vigor',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(raiz)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(designTexts(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A cor do texto do eixo é o token do tema, não um valor cravado', async () => {
      // A sonda é o TEXTO do eixo, e não a barra: a paleta de série é a mesma
      // no claro e no escuro de propósito — está declarada uma vez por tema de
      // marca, sem bloco escuro. Medir a barra afirmaria que a cor muda, e ela
      // não muda em tema nenhum.
      const rotulo = raiz.querySelector<SVGTextElement>('svg text')!;
      await expect(getComputedStyle(rotulo).fill)
        .toBe(corDoToken('muted-foreground', raiz));
    });

    await step('E o desenho está inteiro', async () => {
      await expect(datumFormas(raiz).length).toBeGreaterThan(0);
      await expect(raiz.querySelector('.nds-chart-empty')).toBeNull();
    });
  },
};

// ─── Contraste dos objetos gráficos ───────────────────────────────────────────

/**
 * WCAG 1.4.11: objeto gráfico precisa de 3:1 contra o que está em volta.
 *
 * Quem sustenta o critério é o CONTORNO das formas, não a cor de série: os
 * tokens `--chart-1` a `--chart-5` ficam em torno de 2:1 contra o fundo, e
 * sozinhos não passariam. O contorno em `--foreground` delimita cada objeto
 * qualquer que seja a paleta escolhida.
 */
export const GraphicContrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      // Override de story: duas séries, na forma `xAxis` + `series`.
      source: {
        transform: chartSourceWith({
          dados: 'multi',
          'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
        }),
      },
      description: {
        story: 'O contorno das formas e o texto dos eixos medidos contra o fundo que se enxerga atrás do gráfico.',
      },
    },
  },
  render: () => createChart({
    xAxis: MONTHS,
    series: SERIES_MULTI,
    type: 'bar',
    height: 240,
    class: 'nds-max-w-md',
    'aria-label': 'Acessos mensais por dispositivo: desktop e mobile',
  }),
  play: async ({ canvasElement, step }) => {
    const raiz = exigirRoot(canvasElement);
    await waitFor(() => expect(datumFormas(raiz).length).toBeGreaterThan(0), { timeout: 3000 });
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const fundo = backgroundOpacoAtras(raiz);

    await step('Todo contorno de forma passa de 3:1 contra o fundo', async () => {
      for (const forma of datumFormas(raiz)) {
        await expect(contraste(getComputedStyle(forma).stroke, fundo)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('O texto dos eixos passa de 4.5:1 contra o mesmo fundo', async () => {
      // Marca de eixo é texto corrido pequeno: o piso é 4.5, não 3.
      const rotulo = raiz.querySelector<SVGTextElement>('svg text')!;
      await expect(contraste(getComputedStyle(rotulo).fill, fundo)).toBeGreaterThanOrEqual(4.5);
    });
  },
};
