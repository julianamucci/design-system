import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { NdsChart } from './chart';
import { NdsButton } from './button';
import {
  MONTHS,
  PARTIAL_FORMATTED,
  SERIE_UNICA,
  SERIES_MULTI,
  SERIES_TRIO,
  SERIES_PARTIAL,
  SINGLE_POINT,
  ZERO_TOTAL,
  contrastRatio,
  desenhoDe,
  drawingSettled,
  formasComTrama,
  formasPreenchidas,
  instanciaDe,
  mesmaCor,
  rgbColor,
  rgbToken,
  textosDoDesenho,
  tracadosDeSerie,
} from './chart.fixtures';

/**
 * Degrau tipográfico com que a lib escreveu o texto do desenho, em pixels.
 *
 * Relê o nó a cada chamada de propósito: recolorir o tema recria os textos, e
 * uma referência guardada mediria um elemento que saiu da tela.
 */
function drawnTextSize(desenho: HTMLElement): number {
  const label = desenho.querySelector<SVGTextElement>('svg text');
  if (!label) throw new Error('o desenho ainda não escreveu texto nenhum');
  return Math.round(Number.parseFloat(getComputedStyle(label).fontSize));
}

/** As células de uma linha da tabela, do cabeçalho de linha à última coluna. */
function rowCells(row: HTMLTableRowElement): (string | undefined)[] {
  return [row.querySelector('th'), ...row.querySelectorAll('td')]
    .map((cell) => cell?.textContent?.trim());
}

const meta: Meta = {
  title: 'Primitives/Display/Chart/States',
  tags: ['display'],
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
 * O desenho lê o TEMA, e não valores cravados.
 *
 * A story vizinha prova que trocar a classe do documento recolore no lugar; o
 * que fica aqui é a outra metade, que a troca não alcança: de ONDE saem a cor e
 * o degrau tipográfico do texto que a lib escreve. Por isso ela não declara
 * item de contrato nenhum — quem responde pela troca é a `DarkTheme`, e
 * reivindicar o mesmo item duas vezes faria a contagem dizer que duas coisas
 * estão medidas onde há uma.
 *
 * O tamanho é a parte que mais quer envelhecer: a lib só aceita número em
 * pixel, e número escolhido à mão fica surdo ao navegador. Medir com a fonte
 * parada não provaria nada — na base 16 o valor certo dá os mesmos 12 do padrão
 * da lib —, então a fonte raiz MUDA no meio da story.
 *
 * A largura do bloco sai de uma classe em `rem`, e isso não é enfeite: é ela
 * que faz a caixa do desenho mudar quando a fonte raiz muda, que é por onde o
 * componente percebe a preferência do navegador (WCAG 1.4.4).
 */
export const ThemeTokens: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { months: MONTHS, series: SERIES_MULTI },
    template: `
      <div ndsChart
        class="nds-max-w-md"
        type="bar"
        [xAxis]="months"
        [series]="series"
        label="Acessos mensais por dispositivo, no tema em vigor"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    const doc = chart.ownerDocument;
    const base = () => Number.parseFloat(getComputedStyle(doc.documentElement).fontSize);
    await waitFor(() => expect(textosDoDesenho(desenho).length).toBeGreaterThan(0));

    await step('A cor do texto do desenho é o token do tema', async () => {
      // A sonda é o TEXTO, e não a barra: o texto sai de um token só, enquanto a
      // barra depende de qual posição da paleta a lib deu àquela série — o que
      // a story de multi-série já mede, e por inteiro. Comparar o token
      // RESOLVIDO, e não a string do CSS, é o que prova que a cascata chegou ao
      // desenho.
      //
      // A espera não é enfeite: a lib congela o tema resolvido no momento em
      // que monta, e relê o registro só no quadro seguinte à troca da classe do
      // documento. A story anterior deste arquivo abre no escuro, então há uma
      // janela em que o token já é o do claro e o desenho ainda está pintado
      // com o escuro. Sem `waitFor` a medida cai dentro dessa janela — e reprova
      // por ordem de execução, que é a intermitência mais cara de diagnosticar.
      await waitFor(async () => {
        const label = desenho.querySelector<SVGTextElement>('svg text')!;
        const painted = rgbColor(getComputedStyle(label).fill)!;
        await expect(mesmaCor(painted, rgbToken('--muted-foreground')!)).toBe(true);
      });
    });

    await step('E o degrau tipográfico nasce da fonte raiz', async () => {
      await expect(drawnTextSize(desenho)).toBe(Math.round(base() * 0.75));
    });

    await step('Aumentar a fonte do navegador aumenta o texto do desenho junto', async () => {
      // WCAG 1.4.4. A preferência entra por FOLHA, que é o caminho por onde ela
      // chega ao documento de verdade; inline também venceria a folha do tema,
      // que é justamente o que o design system proíbe.
      //
      // 20px de fonte raiz pedem 15 (0.75 × 20), que um número cravado nunca
      // alcança — nem o 12 do padrão da lib, nem o 12 que a base 16 produz.
      const fontPreference = doc.createElement('style');
      fontPreference.textContent = ':root { font-size: 20px }';
      try {
        doc.head.appendChild(fontPreference);
        await waitFor(() => expect(drawnTextSize(desenho)).toBe(15), { timeout: 3000 });
      } finally {
        // Repõe o que ENCONTROU: as stories dividem o mesmo documento, e uma
        // fonte raiz esquecida em 20px envenena a próxima.
        fontPreference.remove();
      }
      await waitFor(
        () => expect(drawnTextSize(desenho)).toBe(Math.round(base() * 0.75)),
        { timeout: 3000 },
      );
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

// ─── Bordas do dado ──────────────────────────────────────────────────────────
//
// As três stories abaixo existem por um motivo que vale escrito: a lógica que
// monta a alternativa textual — arredondamento, célula ausente, participação —
// vive DENTRO do componente, num `computed`, e não há aqui uma função pura
// exportada para cobrir com teste de unidade. Extrair uma só para testá-la
// seria mudar o desenho do componente por conta do portão.
//
// Então a borda é medida por onde ela é observável: pelo que a tabela escreve.
// A story tem uma vantagem sobre o teste de unidade neste caso — ela também
// fotografa, e o número errado na célula é visível na foto.

/**
 * Um ponto só.
 *
 * O menor dataset que ainda é um gráfico. Não é o estado vazio, e a diferença
 * importa: vazio é ausência de medição, um ponto é medição que ainda não tem
 * com o que ser comparada.
 */
export const OnePoint: Story = {
  render: () => ({
    props: { points: SINGLE_POINT },
    template: `
      <div ndsChart
        type="bar"
        [data]="points"
        label="Acessos de janeiro"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() => expect(formasPreenchidas(desenho).length).toBe(1));

    await step('Um ponto ainda desenha, e não cai no estado vazio', async () => {
      await expect(chart.querySelector('.nds-chart-empty')).toBeNull();
      const bar = formasPreenchidas(desenho)[0];
      await expect(bar.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('A única categoria aparece escrita no eixo', async () => {
      await expect(textosDoDesenho(desenho)).toContain(SINGLE_POINT[0].label);
    });

    await step('E a tabela tem exatamente uma linha', async () => {
      const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(1);
      await expect(rowCells(rows[0]))
        .toEqual([SINGLE_POINT[0].label, String(SINGLE_POINT[0].value)]);
    });
  },
};

/**
 * Dado imperfeito, como ele chega de uma API de verdade.
 *
 * Duas bordas ao mesmo tempo, e as duas só se veem na alternativa textual: a
 * casa decimal, que o eixo arredonda e a tabela não pode arredondar junto, e o
 * mês sem medição, que a tabela precisa declarar ausente.
 */
export const PartialData: Story = {
  render: () => ({
    props: { months: MONTHS, series: SERIES_PARTIAL },
    template: `
      <div ndsChart
        type="bar"
        [xAxis]="months"
        [series]="series"
        label="Acessos mensais por dispositivo, com medição incompleta no mobile"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() => expect(desenho.querySelector('svg')).not.toBeNull());
    const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];

    await step('A casa decimal chega inteira à tabela', async () => {
      // O eixo arredonda para caber, a tabela não: ela é o lugar onde o número
      // exato continua alcançável.
      await expect(rows).toHaveLength(MONTHS.length);
      await expect(rows.map((row) => rowCells(row)[1])).toEqual(PARTIAL_FORMATTED);
    });

    await step('O mês sem medição é declarado ausente, e não escrito como zero', async () => {
      // Zero é um valor; ausência não é. Preencher com zero faria a alternativa
      // textual afirmar uma medição que ninguém fez — e o desenho, que
      // simplesmente não traça o ponto, passaria a discordar dela.
      const mobile = rows.map((row) => rowCells(row)[2]);
      await expect(mobile.slice(0, 3)).toEqual(SERIES_PARTIAL[1].data.map(String));
      await expect(mobile.slice(3)).toEqual(['—', '—', '—']);
    });

    await step('E o desenho traça só o que existe', async () => {
      // Nove barras, e não doze: os três meses sem medição não viram forma
      // nenhuma. A contagem fica FORA do `waitFor` de propósito — dentro dele
      // ela esperaria a animação por acidente, e o guarda passaria a dar certo
      // mesmo removido.
      const desenhadas = SERIES_PARTIAL[0].data.length + SERIES_PARTIAL[1].data.length;
      await waitFor(() => expect(formasPreenchidas(desenho).length).toBeGreaterThan(0));
      await drawingSettled(desenho);
      await expect(formasPreenchidas(desenho).length).toBe(desenhadas);
    });
  },
};

/**
 * Rosca cujas fatias somam zero.
 *
 * Também não é o estado vazio: há três categorias, elas só não tiveram
 * movimento no período. A participação de cada uma é indefinida, e a coluna que
 * a carrega precisa dizer isso — a conta que a produz divide pelo total.
 */
export const ZeroTotal: Story = {
  render: () => ({
    props: { points: ZERO_TOTAL },
    template: `
      <div ndsChart
        type="pie"
        [data]="points"
        label="Distribuição de acessos por dispositivo, em um período sem movimento"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() => expect(textosDoDesenho(desenho).length).toBeGreaterThan(0));

    await step('Categoria sem movimento não é categoria ausente', async () => {
      await expect(chart.querySelector('.nds-chart-empty')).toBeNull();
      await expect(chart.querySelector('[data-slot="chart-canvas"]')).not.toBeNull();
    });

    await step('A participação indefinida é declarada, e não inventada', async () => {
      const rows = [...chart.querySelectorAll<HTMLTableRowElement>('tbody tr')];
      await expect(rows).toHaveLength(ZERO_TOTAL.length);
      await expect(rows.map((row) => rowCells(row)[1])).toEqual(ZERO_TOTAL.map(() => '0'));
      await expect(rows.map((row) => rowCells(row)[2])).toEqual(ZERO_TOTAL.map(() => '—'));
    });

    await step('E a divisão por zero não vaza para a tela', async () => {
      // A conta da participação divide pelo total das fatias. Sem a guarda, o
      // que sai é `NaN%` — escrito na tabela e repetido na legenda, que é a
      // forma mais barata de o componente mentir sobre o próprio dado.
      await expect(chart.textContent ?? '').not.toContain('NaN');
      for (const point of ZERO_TOTAL) {
        await expect(textosDoDesenho(desenho).some((text) => text.includes(point.label)))
          .toBe(true);
      }
    });
  },
};

/** A série que sai do conjunto entre a primeira leitura e a segunda. */
const REMOVED_SERIES = 'Tablet';
const REDUCED_SERIES = SERIES_TRIO.filter((s) => s.name !== REMOVED_SERIES);
const RELOAD_LABEL = 'Reler do servidor';

/**
 * Uma série SAI do conjunto — o caso que separa gráfico de valor fixo de
 * gráfico alimentado por uma API.
 *
 * A resposta seguinte de um servidor raramente tem a forma da anterior: uma
 * série é descontinuada, um filtro corta um recorte, o período muda. Aqui a
 * segunda leitura traz duas séries onde a primeira trazia três.
 *
 * O que esta story guarda não é a opção de biblioteca que resolve isso — é o
 * INVARIANTE: o desenho e a tabela contam a mesma história. Mesclando o
 * conjunto novo sobre o anterior, a série removida continua pintada com o dado
 * velho enquanto a tabela, que nasce das entradas novas, já não a lista.
 *
 * A asserção que pega isso é a do NÚMERO DE FORMAS, e não a do texto da
 * legenda: medido nas outras stacks, a legenda e a tabela já concordam em duas
 * séries enquanto as barras ainda mostram três. Portão que só lesse texto
 * passaria com o defeito de pé.
 */
export const SeriesRemoved: Story = {
  parameters: { covers: ['functional.item9'] },
  // A diretiva do botão precisa entrar no `imports` desta story: o `meta` só
  // traz a do gráfico, e diretiva ausente não é erro — o atributo simplesmente
  // não faz nada, e o botão sai sem estilo nenhum.
  decorators: [moduleMetadata({ imports: [NdsChart, NdsButton] })],
  render: () => {
    // O sinal nasce NO RENDER, e não no módulo: um sinal de módulo sobreviveria
    // entre montagens e a story abriria já reduzida.
    //
    // E ele DEFINE o conjunto reduzido, não alterna entre dois — o painel
    // Interactions reexecuta a play no mesmo DOM, e alternar inverteria a
    // asserção na segunda rodada.
    const series = signal(SERIES_TRIO);
    return {
      props: {
        meses: MONTHS,
        series,
        buttonLabel: RELOAD_LABEL,
        reload: () => series.set(REDUCED_SERIES),
      },
      template: `
        <div class="nds-stack nds-max-w-lg" data-spacing="sm">
          <button ndsButton variant="outline" size="sm" type="button" (click)="reload()">
            {{ buttonLabel }}
          </button>
          <div ndsChart
            type="bar"
            [xAxis]="meses"
            [series]="series()"
            [showData]="true"
            label="Acessos mensais por dispositivo"
          ></div>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const chart = canvasElement.querySelector<HTMLElement>('.nds-chart')!;
    const desenho = desenhoDe(chart);
    await waitFor(() =>
      expect(formasPreenchidas(desenho).length)
        .toBeGreaterThanOrEqual(MONTHS.length * SERIES_TRIO.length),
    );

    await step('A leitura seguinte traz uma série a menos', async () => {
      await userEvent.click(
        await within(canvasElement).findByRole('button', { name: RELOAD_LABEL }),
      );
    });

    await step('A série removida sai do DESENHO — nada do conjunto anterior fica pintado', async () => {
      // Só leitura pura aqui dentro. `waitFor` reagenda por observador de
      // mutação: condição que MEXE no DOM se realimenta e pendura sem reportar.
      await waitFor(() => expect(textosDoDesenho(desenho)).not.toContain(REMOVED_SERIES));
    });

    await step('E a tabela equivalente conta a mesma história', async () => {
      const header = [...chart.querySelectorAll('thead th')].map((c) => c.textContent?.trim() ?? '');
      await expect(header.some((c) => c.includes(REMOVED_SERIES))).toBe(false);
      await expect(header).toHaveLength(1 + REDUCED_SERIES.length);
    });

    await step('E sobrou no desenho exatamente a forma das séries que restaram', async () => {
      await drawingSettled(desenho);
      await expect(formasPreenchidas(desenho))
        .toHaveLength(REDUCED_SERIES.length * MONTHS.length);
    });
  },
};
