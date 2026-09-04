import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fireEvent, waitFor } from 'storybook/test';
import { NdsChart } from './chart';
import {
  AUTHOR_COLOR_PAINTED,
  MONTHS,
  SERIE_UNICA,
  SERIES_AUTHOR_COLOR,
  SERIES_MULTI,
  SERIES_TRIO,
  TENDENCIA,
  desenhoDe,
  drawingSettled,
  formasPreenchidas,
  hasLegend,
  mesmaCor,
  rgbColor,
  rgbToken,
  textosDoDesenho,
  tracadosDeSerie,
} from './chart.fixtures';

// ─── UI/Chart/Settings ───────────────────────────────────────────────────────
//
// As ENTRADAS do componente, uma por story: o que cada uma decide, e o que
// continua valendo quando ela muda.
//
// A API aqui é declarativa — cada ajuste é uma entrada do elemento, não uma
// chave dentro de um objeto de configuração. A divergência está registrada no
// cabeçalho de `chart.ts` e continua valendo; o que estas stories trazem é o
// ASSUNTO de cada ajuste, não a forma de escrevê-lo.

const TITLE = 'Acessos por dispositivo';

const meta: Meta = {
  title: 'Components/Display/Chart/Settings',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [NdsChart] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

// ─── Tabela de dados à vista ─────────────────────────────────────────────────

/**
 * A alternativa textual à vista.
 *
 * Ela é emitida SEMPRE — em toda story deste componente a tabela está no DOM,
 * fora da tela, com os mesmos números do desenho. O que esta entrada decide é
 * se quem enxerga também a vê: conferência de número, painel impresso, e quem
 * simplesmente prefere ler o dado a estimá-lo no desenho.
 *
 * É o contrato de acessibilidade do componente inteiro, e até aqui ele não
 * tinha foto de regressão visual nesta stack.
 */
export const VisibleData: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A tabela de dados embaixo do desenho, à vista de todo mundo. Ela existe sempre — para leitor de tela, busca da página e cópia —, e esta entrada só decide se aparece na tela.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="series"
        [showData]="true"
        label="Acessos mensais por dispositivo: desktop e mobile"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    const data = chart.querySelector<HTMLElement>('[data-slot="chart-data"]')!;
    await waitFor(() => expect(desenho.querySelector('svg')).not.toBeNull());

    await step('A tabela sai da condição de leitor de tela e aparece', async () => {
      await expect(data.classList.contains('nds-sr-only')).toBe(false);
      await expect(data.classList.contains('nds-table-wrapper')).toBe(true);
      // Medida, e não classe: uma caixa de 1px continuaria escondida com a
      // classe certa. O que prova que a tabela aparece é ela ocupar espaço.
      await expect(data.getBoundingClientRect().height).toBeGreaterThan(50);
    });

    await step('À vista, a caixa que rola é alcançável por teclado', async () => {
      // `.nds-table-wrapper` rola na horizontal, e região rolável sem foco é
      // conteúdo que só existe para quem usa mouse (scrollable-region-focusable).
      // Fora da tela o `tabindex` NÃO entra: seria uma parada de tabulação sem
      // nada para rolar, num elemento que ninguém enxerga.
      await expect(data).toHaveAttribute('tabindex', '0');
    });

    await step('O bloco cresce para caber os dois — nada é recortado', async () => {
      // `.nds-chart` recorta o que transborda. Se a altura fosse do BLOCO, e não
      // do desenho, a tabela cairia atrás da borda de baixo: a entrada de
      // acessibilidade ligada e nada na tela.
      await expect(data.getBoundingClientRect().bottom)
        .toBeLessThanOrEqual(chart.getBoundingClientRect().bottom + 1);
      await expect(chart.getBoundingClientRect().height)
        .toBeGreaterThan(desenho.getBoundingClientRect().height);
    });

    await step('E ela traz exatamente os números do desenho', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Categoria', ...SERIES_MULTI.map((s) => s.name)]);

      const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')].map((row) =>
        [row.querySelector('th'), ...row.querySelectorAll('td')].map((c) => c?.textContent?.trim()),
      );
      await expect(rows.map((row) => row[0])).toEqual(MONTHS);
      for (const [i, serie] of SERIES_MULTI.entries()) {
        await expect(rows.map((row) => row[i + 1])).toEqual(serie.data.map(String));
      }
    });
  },
};

// ─── Dica sob o ponteiro ─────────────────────────────────────────────────────

/**
 * A dica que abre sob o ponteiro.
 *
 * Ela existe, e nada existe SÓ nela: o mesmo par categoria/valor está na
 * tabela, alcançável sem ponteiro e sem foco. Os dois passos abaixo são essa
 * frase medida — primeiro que a dica de fato abre, depois que ela não é a única
 * porta para o número.
 */
export const WithTooltip: Story = {
  parameters: {
    // O item fala de PONTEIRO sobre o ponto de dado. Ele estava declarado na
    // story de barras, que nunca aproxima o ponteiro de coisa nenhuma: o que
    // ela mede é a tabela. Portão sem dentes vale menos que portão nenhum, e a
    // declaração vem para onde a medida está.
    covers: ['functional.item4'],
    docs: {
      description: {
        story: 'Ponteiro sobre uma barra — a dica traz a categoria e o valor daquele ponto.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="series"
        label="Acessos mensais por dispositivo: desktop e mobile"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    const value = String(SERIES_MULTI[0].data[0]);
    await waitFor(() => expect(formasPreenchidas(desenho).length).toBeGreaterThan(0));
    await drawingSettled(desenho);

    await step('Antes do ponteiro, o valor não está escrito em lugar nenhum do desenho', async () => {
      // Precondição da medida seguinte: se o número já aparecesse numa marca de
      // eixo ou num rótulo de barra, encontrá-lo depois não provaria nada. Com
      // mais de uma série o componente não escreve valor sobre a barra, e as
      // marcas do eixo de valor são redondas — 186 não cai em nenhuma.
      await expect(textosDoDesenho(desenho)).not.toContain(value);
    });

    await step('Com o ponteiro sobre a barra, a dica escreve categoria e valor', async () => {
      // A barra mais à esquerda é a primeira categoria; a ordem no DOM não é
      // contrato, a posição na tela é.
      const bars = formasPreenchidas(desenho)
        .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      const box = bars[0].getBoundingClientRect();
      const svg = desenho.querySelector('svg')!;
      const position = {
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
        bubbles: true,
      };
      // Evento cru, com coordenada: a lib faz o acerto do alvo por posição, e
      // um `hover` sem par clientX/clientY cairia em (0, 0), fora do desenho.
      // `pointerMove` primeiro porque é o que a lib escuta em navegador com
      // PointerEvent; o de mouse fica de rede para o caso contrário.
      fireEvent.pointerMove(svg, position);
      fireEvent.mouseMove(svg, position);

      // A leitura é do DESENHO, não do bloco: a tabela mora no bloco e traz os
      // mesmos números por escrito, então procurar no bloco inteiro daria certo
      // com a dica fechada.
      await waitFor(
        () => {
          const text = desenho.textContent ?? '';
          expect(text).toContain(value);
          expect(text).toContain(MONTHS[0]);
        },
        { timeout: 3000 },
      );
    });

    await step('E o mesmo par está na tabela, sem depender do ponteiro', async () => {
      const first = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')][0];
      await expect(first.querySelector('th')?.textContent?.trim()).toBe(MONTHS[0]);
      await expect(first.querySelector('td')?.textContent?.trim()).toBe(value);
    });
  },
};

// ─── Legenda ─────────────────────────────────────────────────────────────────

/**
 * Quem decide se a legenda aparece.
 *
 * Sem valor, ela nasce da CONTAGEM de séries: com uma só não há o que comparar,
 * e o espaço vai para o valor escrito junto do dado. A entrada existe para as
 * duas exceções — a série única que precisa ser nomeada porque o gráfico
 * aparece ao lado de outro, e o painel apertado em que a legenda mora fora do
 * desenho.
 *
 * Os dois gráficos ficam na mesma tela de propósito: a regra é uma comparação,
 * e comparação com um lado só não se fotografa.
 */
export const WithCaption: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A legenda entra sozinha a partir da segunda série. À esquerda, uma série única com a legenda pedida à mão; à direita, três séries com a legenda dispensada.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, single: SERIE_UNICA, trio: SERIES_TRIO },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="single"
        [showLegend]="true"
        label="Acessos mensais no desktop, com a série nomeada"
      ></div>
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="trio"
        [showLegend]="false"
        label="Acessos mensais por dispositivo, sem legenda dentro do desenho"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const charts = [...canvasElement.querySelectorAll<HTMLElement>('.nds-chart')];
    await expect(charts).toHaveLength(2);
    const named = desenhoDe(charts[0]);
    const bare = desenhoDe(charts[1]);
    for (const drawing of [named, bare]) {
      await waitFor(() => expect(formasPreenchidas(drawing).length).toBeGreaterThan(0));
      await drawingSettled(drawing);
    }

    await step('Pedida à mão, a legenda nomeia a série única', async () => {
      // Sem a entrada, uma série só NÃO ganha legenda — é o que a story
      // SingleSeries mede. Aqui o nome escrito é o efeito da entrada.
      await expect(hasLegend(named)).toBe(true);
      await expect(textosDoDesenho(named)).toContain(SERIE_UNICA[0].name);
    });

    await step('Dispensada, a legenda some mesmo com três séries', async () => {
      await expect(hasLegend(bare)).toBe(false);
      const texts = textosDoDesenho(bare);
      for (const serie of SERIES_TRIO) {
        await expect(texts).not.toContain(serie.name);
      }
    });

    await step('E, sem legenda, o nome da série continua na tabela', async () => {
      // A legenda é decoração do desenho; a alternativa textual não é. Tirar uma
      // não pode tirar a outra, senão a entrada viraria uma forma de esconder
      // dado de quem lê por leitor de tela.
      const header = [...charts[1].querySelectorAll('thead th')].map((c) => c.textContent?.trim());
      await expect(header).toEqual(['Categoria', ...SERIES_TRIO.map((s) => s.name)]);
    });

    await step('E as categorias continuam escritas nos dois eixos', async () => {
      for (const drawing of [named, bare]) {
        const texts = textosDoDesenho(drawing);
        for (const month of MONTHS) await expect(texts).toContain(month);
      }
    });
  },
};

// ─── Título dentro do desenho, com várias séries ─────────────────────────────

/**
 * O caso típico de painel analítico: várias séries, título desenhado e legenda,
 * os três na mesma caixa.
 *
 * O assunto não é nenhum dos três sozinho — é a CONVIVÊNCIA. O desenho reserva
 * uma faixa em cima quando há título e outra embaixo quando há legenda, e é
 * essa reserva que impede o título de cair sobre as barras. Sem ela nada
 * quebra, nada avisa: o texto só passa a ser desenhado por cima do dado.
 */
export const MultipleSeries: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Três séries com título desenhado acima dos eixos e legenda embaixo — o arranjo mais cheio que o componente monta sozinho.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, series: SERIES_TRIO, chartTitle: TITLE },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="series"
        [chartTitle]="chartTitle"
        label="Acessos por dispositivo, de janeiro a junho"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() => expect(formasPreenchidas(desenho).length).toBeGreaterThan(0));
    // DOIS retângulos transparentes, e não um: o título desenha o próprio fundo
    // além do da legenda. Sem declarar o segundo, a espera pela animação nunca
    // fecha — medido aqui, e é a única story do componente com os dois textos.
    await drawingSettled(desenho, 2);

    // As BARRAS, e não o fundo de título e legenda.
    //
    // Os dois retângulos transparentes são formas preenchidas como as outras, e
    // com dois deles na tela o coletor só consegue excluir um (ver a nota em
    // `drawingSettled`). O do título encosta no topo do desenho, então sem
    // tirá-lo daqui o mínimo passaria a ser ele, e a medida deixaria de falar
    // de barra.
    const bars = () => formasPreenchidas(desenho)
      .filter((forma) => forma.getAttribute('fill-opacity') !== '0');

    // A borda de cima da barra mais alta só para de subir quando a animação de
    // entrada fecha, e `drawingSettled` não responde por isso: ela olha a
    // OPACIDADE, e a entrada da barra é de altura. Medido aqui, as barras
    // chegam a opacidade cheia ainda com altura zero — e altura zero não tem
    // área, então o coletor devolvia só o fundo do título.
    //
    // Sem esta espera a medida seguinte não é falsa, é fraca: ela fica mais
    // exigente conforme a barra cresce, então medir cedo é medir a versão mais
    // fácil dela.
    const highest = () => {
      const tops = bars().map((forma) => forma.getBoundingClientRect().top);
      return tops.length > 0 ? Math.min(...tops) : Number.NaN;
    };
    let previous = Number.NaN;
    await waitFor(() => {
      const now = highest();
      const settled = Number.isFinite(now) && now === previous;
      previous = now;
      expect(settled).toBe(true);
    }, { timeout: 5000, interval: 100 });

    await step('O título é escrito acima dos eixos', async () => {
      await waitFor(async () => {
        await expect(textosDoDesenho(desenho)).toContain(TITLE);
      });
    });

    await step('A legenda nomeia as três séries', async () => {
      const texts = textosDoDesenho(desenho);
      for (const serie of SERIES_TRIO) await expect(texts).toContain(serie.name);
    });

    await step('E o título não é desenhado por cima do dado', async () => {
      // A faixa reservada em cima é o que separa os dois. Ela não tem sintoma
      // próprio: sem a reserva, o texto simplesmente passa a ficar sobre a
      // barra mais alta, e a foto de regressão continua "cheia".
      const title = [...desenho.querySelectorAll<SVGTextElement>('svg text')]
        .find((no) => no.textContent?.trim() === TITLE);
      await expect(title).toBeDefined();
      const bottom = title!.getBoundingClientRect().bottom;
      const tops = bars().map((forma) => forma.getBoundingClientRect().top);
      await expect(tops.length).toBeGreaterThan(0);
      await expect(bottom).toBeLessThanOrEqual(Math.min(...tops));
    });

    await step('O rótulo autoral vence o título — é ele que o leitor de tela lê', async () => {
      // São dois textos com papéis diferentes: o título é decoração desenhada, o
      // rótulo é o que anuncia o gráfico. Trocar um pelo outro deixaria a
      // legenda da tabela dizendo só "Acessos por dispositivo".
      await expect(desenho.getAttribute('aria-label'))
        .toBe('Acessos por dispositivo, de janeiro a junho');
      await expect(chart.querySelector('caption')?.textContent?.trim())
        .toBe('Acessos por dispositivo, de janeiro a junho');
    });
  },
};

// ─── Cor autoral de série ────────────────────────────────────────────────────

/**
 * Cor informada no próprio item de série.
 *
 * Sobrescreve o token de paleta DAQUELA série e só dela — as demais continuam
 * saindo do tema, e continuam trocando junto com ele. É a diferença entre
 * marcar uma série (um limite, uma meta, a marca de um parceiro) e abandonar a
 * paleta do design system.
 */
export const SeriesColor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Cor autoral em uma série. Ela vence o token de paleta daquela posição; as outras séries continuam vindo do tema.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, series: SERIES_AUTHOR_COLOR },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="series"
        label="Acessos mensais por dispositivo, com o desktop em cor autoral"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(formasPreenchidas(desenho).length)
        .toBeGreaterThanOrEqual(MONTHS.length * SERIES_AUTHOR_COLOR.length),
    );
    await drawingSettled(desenho);

    await step('A cor autoral não é nenhum token da paleta', async () => {
      // Precondição da story: se a paleta um dia chegasse a este roxo, os dois
      // passos abaixo passariam sem medir nada.
      const author = rgbColor(AUTHOR_COLOR_PAINTED)!;
      for (const token of ['--chart-1', '--chart-2']) {
        await expect(mesmaCor(author, rgbToken(token)!)).toBe(false);
      }
    });

    const painted = () =>
      formasPreenchidas(desenho)
        .map((f) => rgbColor(getComputedStyle(f).fill))
        .filter((cor): cor is [number, number, number] => cor !== null);

    await step('As formas da série marcada saem na cor pedida', async () => {
      const author = rgbColor(AUTHOR_COLOR_PAINTED)!;
      await expect(painted().some((cor) => mesmaCor(cor, author))).toBe(true);
    });

    await step('E a outra série continua saindo da paleta do tema', async () => {
      // A metade que faz a entrada ser um AJUSTE, e não uma saída da paleta.
      //
      // O que se mede é PROCEDÊNCIA, não posição. Qual dos oito tokens cai na
      // série sem cor autoral é alocação da lib — ela entrega a próxima cor da
      // paleta a quem pede uma, e a série marcada não pede. Medido no DOM: a
      // segunda série sai em `--chart-1`, e não no `--chart-2` da sua posição.
      // Cravar o número aqui documentaria esse detalhe da lib como se fosse
      // promessa do design system.
      const palette = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => rgbToken(`--chart-${n}`)!);
      const author = rgbColor(AUTHOR_COLOR_PAINTED)!;
      const others = painted().filter((cor) => !mesmaCor(cor, author));
      await expect(others.length).toBeGreaterThan(0);
      for (const cor of others) {
        await expect(palette.some((token) => mesmaCor(cor, token))).toBe(true);
      }
    });
  },
};

// ─── Mini gráfico inline ─────────────────────────────────────────────────────

/**
 * O gráfico como ADJETIVO de um número.
 *
 * Sem eixo, grade, legenda ou rótulo de valor, e com a proporção achatada: ali
 * o desenho diz "subiu", e o número exato é o KPI ao lado. Por isso ele pode
 * abrir mão de tudo o que escreve — menos da tabela, que continua carregando
 * cada valor por extenso.
 *
 * É a entrada que decide a caixa do desenho nesta stack: não há altura em
 * pixel a informar, a altura nasce da proporção aplicada à largura.
 */
export const Compact: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Mini gráfico de tendência: proporção achatada e nenhum texto desenhado. O número exato continua na tabela de dados.',
      },
    },
  },
  render: () => ({
    props: { months: MONTHS, series: TENDENCIA },
    template: `
      <div ndsChart
        type="line"
        [xAxis]="months"
        [series]="series"
        [compact]="true"
        label="Tendência de acessos nos últimos seis meses"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(tracadosDeSerie(desenho).length).toBeGreaterThanOrEqual(TENDENCIA.length),
    );

    await step('A caixa do desenho é achatada, e não a proporção cheia', async () => {
      // A proporção é dado do gráfico, não decisão de tema: 640/140 contra os
      // 640/320 do desenho cheio. Comparar razão, e não pixel, é o que mantém a
      // medida válida em qualquer largura de container.
      const box = desenho.getBoundingClientRect();
      await expect(Math.abs(box.height / box.width - 140 / 640)).toBeLessThan(0.02);
    });

    await step('Nada é escrito dentro do desenho', async () => {
      // Eixo, grade, legenda e rótulo de valor saem todos: o mini gráfico mora
      // ao lado de um número, e repetir texto ali roubaria a atenção dele.
      const texts = textosDoDesenho(desenho);
      for (const month of MONTHS) await expect(texts).not.toContain(month);
      await expect(texts).not.toContain(TENDENCIA[0].name);
    });

    await step('E cada valor continua por extenso na tabela', async () => {
      // O desenho abriu mão do texto; a alternativa textual não. Se ela também
      // encolhesse, o modo compacto viraria um gráfico sem número nenhum.
      const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows.map((row) => row.querySelector('th')?.textContent?.trim()))
        .toEqual(MONTHS);
      await expect(rows.map((row) => row.querySelector('td')?.textContent?.trim()))
        .toEqual(TENDENCIA[0].data.map(String));
    });
  },
};
