import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ChartContainer, buildBarOption, buildLineOption } from './index';
import ChartDualStory from './ChartDualStory.svelte';
import ChartSeriesRemovedStory from './ChartSeriesRemovedStory.svelte';
import {
  settleTheme,
  contraste,
  tokenColor, designEscreve, designPintado, exigirRoot, datumFormas,
  backgroundOpacoAtras, designTexts, tramasAplicadas,
} from '@shared/testing/chart-probe';
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';
import {
  decalColors,
  drawingSettled,
  filledShapes,
  headerOf,
  waitForDesign,
} from './chart.fixtures';
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
  title: 'Components/Display/Chart/States',
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
    const root = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      await expect(root.querySelector('svg')).toBeNull();
      const aviso = root.querySelector('.nds-chart-empty');
      // Frase completa e orientadora, não "Sem dados.": é a regra de UX writing
      // do estado vazio, e é ela que a story passa em `emptyLabel`.
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
    });

    await step('Sem desenho, sem papel de imagem: a frase é o conteúdo', async () => {
      // `role="img"` poda a subárvore da árvore de acessibilidade — com ele, a
      // frase que explica a ausência de dado ficaria escondida atrás de um
      // rótulo genérico. E aria-label em div sem papel é atributo proibido.
      await expect(root.getAttribute('role')).toBeNull();
      await expect(root.getAttribute('aria-label')).toBeNull();
    });

    await step('O bloco mantém a altura pedida — a página não salta quando o dado chega', async () => {
      await expect(root.getBoundingClientRect().height).toBeCloseTo(240, -1);
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
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('O desenho saiu de verdade — controle da medição negativa abaixo', async () => {
      await waitFor(() => {
        for (const month of MONTHS) expect(designEscreve(root, month)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('Com uma série a legenda some — o nome da série não é escrito', async () => {
      await expect(designTexts(root)).not.toContain(SERIE_UNICA[0].name);
      // E some só a legenda: as formas de dado continuam todas lá.
      await expect(datumFormas(root).length).toBeGreaterThanOrEqual(MONTHS.length);
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
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('A legenda escreve o nome de cada série', async () => {
      await waitFor(() => {
        for (const serie of SERIES_MULTI) expect(designEscreve(root, serie.name)).toBe(true);
      }, { timeout: 3000 });
    });

    await step('E cada série ganha uma trama própria — a cor não é o único sinal', async () => {
      // Tirando a cor, a hachura ainda separa as séries (WCAG 1.4.1). Medido:
      // uma trama distinta por série, reaproveitada pelo ícone da legenda — daí
      // a igualdade com o número de séries, e não a soma das formas.
      await waitFor(
        () => expect(tramasAplicadas(root).size).toBe(SERIES_MULTI.length),
        { timeout: 3000 },
      );
    });

    await step('E a trama é traçada no fundo — não em preto translúcido', async () => {
      // Trama que não se enxerga é WCAG 1.4.1 declarada e não entregue: a lista
      // padrão da lib desenha em `rgba(0, 0, 0, 0.2)`, que contra a paleta se
      // destaca do próprio preenchimento entre 1.14 e 1.54. Traçada no fundo,
      // ela se destaca tanto quanto a série se destaca do fundo — 7.32 no pior
      // caso claro, 6.83 no escuro.
      //
      // A medida sai de DENTRO do `<pattern>`, que é onde a cor da hachura
      // existe: contar tramas, como o passo acima, não distingue uma hachura
      // visível de uma invisível.
      // Sem `waitFor` aqui, e o motivo custou dez minutos de relógio: a leitura
      // normaliza cor com um elemento de sonda, e criar esse elemento MEXE no
      // `<body>`. Dentro de um `waitFor`, mexer no DOM acorda o observador de
      // mutação que ele usa para reagendar — a tentativa que falha provoca a
      // próxima, e o laço nunca chega ao prazo: o navegador gira a 100% e a
      // suíte não termina nem acusa. Aqui não é preciso esperar: o passo acima
      // já esperou a trama CHEGAR à forma, e a cor dela nasce junto com o
      // padrão.
      const pageBackground = tokenColor('background', root, HATCH_OPACITY);
      const painted = decalColors(root);
      await expect(painted.length).toBeGreaterThan(0);
      for (const one of painted) await expect(one).toBe(pageBackground);
    });
  },
};

/**
 * Tema escuro.
 *
 * A cor do texto do eixo é a sonda da recolorização, não a cor das barras. A
 * paleta de série (`--chart-1` a `--chart-8`) passou a ter variante por modo, e
 * a barra também muda — mas o texto continua sendo a sonda porque o alvo dele é
 * um token EXATO (`--muted-foreground`), enquanto a cor de uma barra depende de
 * que posição da paleta a lib deu àquela série: sonda que precisa adivinhar a
 * posição mede a lib, não o tema.
 *
 * O modo em que a story ABRE vem de `globals`, e não de uma classe trocada no
 * meio da montagem: o desenho nasce com a paleta escura, e é esse estado que o
 * teste visual fotografa. A ida e volta da classe acontece depois, com o
 * desenho já pintado — é ela que verifica a recolorização.
 */
export const ThemeTokens: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item4'],
    docs: {
      source: { transform: chartDoisTypesSource },
      description: { story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, não de valores cravados.' },
    },
  },
  // O modo escuro é declarado ANTES da montagem. É a diferença que fez esta
  // verificação sair do papel: o desenho nasce com a paleta que se quer medir,
  // em vez de a story ter de alcançá-la trocando a classe enquanto a lib monta.
  globals: { theme: 'dark' },
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
        // `tokenColor` monta um elemento de sonda no `<body>` para normalizar a
        // cor. Chamado DENTRO de um `waitFor`, ele mexe no DOM a cada tentativa
        // e acorda o observador de mutação que a espera usa para reagendar: a
        // tentativa que falha provoca a próxima, o prazo nunca chega, e o
        // navegador gira a 100% até a aba morrer sem resultado. Abrindo no
        // escuro a primeira tentativa PODE falhar — a classe do documento chega
        // antes de o desenho repintar —, e o que era latente virava certo. Por
        // isso o token é lido UMA vez, fora da espera, e a espera é de relógio.
        const expectedColor = tokenColor('muted-foreground', g);
        const labelColor = () => {
          const label = g.querySelector<SVGTextElement>('svg text');
          return label ? getComputedStyle(label).fill : '';
        };
        const deadline = Date.now() + 3000;
        while (labelColor() !== expectedColor && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        await expect(labelColor()).toBe(expectedColor);
      }
    });

    await step('E trocar o tema recolore no lugar, sem remontar o desenho', async () => {
      // O item de contrato fala da TROCA, não do modo escuro parado: o passo
      // acima prova que o desenho LÊ o token; este prova que ele o relê quando
      // o documento muda de modo.
      //
      // A cor de partida é lida ANTES de mexer na classe. Lida depois, no mesmo
      // tique, a releitura ainda não aconteceu e a sonda devolve a cor ANTIGA:
      // a comparação seguinte viraria "escuro contra escuro", que nunca difere
      // e só sabe expirar.
      //
      // A espera é de RELÓGIO, e não `waitFor`. Medido: com a recolorização
      // desligada de propósito, o `waitFor` não reprovava — reobservava o
      // documento a cada mutação, o desenho se repintava a cada volta, e o
      // navegador girava em 100% de CPU até a aba morrer sem resultado, que é o
      // motivo pelo qual esta verificação ficou anos declarada como não feita.
      // O laço abaixo termina sozinho e a cor que sobrou é comparada UMA vez:
      // sem recolorização ele REPROVA, em dois segundos.
      const html = document.documentElement;
      const wasDark = html.classList.contains('dark');
      const target = graficos[0];
      const canvasBox = target.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
      const axisColor = () => {
        const label = target.querySelector<SVGTextElement>('svg text');
        return label ? getComputedStyle(label).fill : '';
      };
      const axisColorAfterLeaving = async (from: string) => {
        const deadline = Date.now() + 2000;
        let current = axisColor();
        while (current === from && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          current = axisColor();
        }
        return current;
      };

      try {
        const initial = axisColor();
        // Sem esta linha o resto seria vácuo: desenho sem texto compara '' com
        // '' e passa.
        await expect(initial).not.toBe('');

        // Ida.
        html.classList.toggle('dark');
        const swapped = await axisColorAfterLeaving(initial);
        await expect(swapped).not.toBe(initial);

        // Volta: a promessa é recolorir a CADA troca, não uma vez só.
        html.classList.toggle('dark');
        await expect(await axisColorAfterLeaving(swapped)).not.toBe(swapped);

        // Mesmo nó de desenho antes e depois: recoloriu no lugar, não foi
        // descartado e recriado — é o "não pisca nem requer reload".
        await expect(target.querySelector('[data-slot="chart-canvas"]')).toBe(canvasBox);
      } finally {
        // Repõe o que a story ENCONTROU: o escuro do `globals` é o que o teste
        // visual fotografa, e na suíte as stories dividem o mesmo documento.
        html.classList.toggle('dark', wasDark);
      }
    });
  },
};

/**
 * WCAG 1.4.11: objeto gráfico precisa de 3:1 contra o que está ao redor.
 *
 * Quem sustenta o critério é o CONTORNO das formas, e não a cor de série. Os
 * oito tokens `--chart-*` ganharam variante por modo e hoje passam de 3:1 contra
 * o fundo por conta própria — 7.32 no pior caso claro, 6.83 no escuro —, mas
 * isso mede cada série contra o FUNDO, não contra a série vizinha, e nada disso
 * vale para um tema derivado que escolha a própria paleta. O contorno em
 * `--foreground` delimita cada objeto em qualquer dos dois casos.
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
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const background = backgroundOpacoAtras(root);

    await step('Todo objeto gráfico passa de 3:1 pelo contorno', async () => {
      const formas = datumFormas(root);
      // Uma forma de cor e uma de trama por barra desenhada, mais as da legenda.
      await expect(formas.length).toBeGreaterThanOrEqual(MONTHS.length * SERIES_MULTI.length);
      for (const forma of formas) {
        await expect(contraste(getComputedStyle(forma).stroke, background)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('O texto dos eixos passa de 4.5:1 — é texto, não objeto', async () => {
      const rotulos = [...root.querySelectorAll<SVGTextElement>('svg text')];
      await expect(rotulos.length).toBeGreaterThan(0);
      for (const label of rotulos) {
        await expect(contraste(getComputedStyle(label).fill, background)).toBeGreaterThanOrEqual(4.5);
      }
    });
  },
};

/** A série que sai do conjunto entre a primeira leitura e a segunda. */
const REMOVED_SERIES = 'Tablet';
/** O conjunto da segunda leitura: o mesmo de cima, sem a última série. */
const REDUCED_SERIES = SERIES_MULTI.filter((s) => s.name !== REMOVED_SERIES);
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
 * velho enquanto a tabela, que nasce das props novas, já não a lista. As duas
 * metades do componente passariam a discordar, e a alternativa textual deixaria
 * de ser equivalente — que é a única coisa que este componente existe para não
 * fazer.
 */
export const SeriesRemoved: Story = {
  parameters: {
    covers: ['functional.item9'],
    docs: {
      description: {
        story:
          'Quando a leitura seguinte traz uma série a menos, ela sai do desenho e da tabela ao mesmo tempo — nenhum resto do conjunto anterior fica pintado.',
      },
    },
  },
  render: () => ({
    Component: ChartSeriesRemovedStory,
    props: {
      months: MONTHS,
      series: SERIES_MULTI,
      reduced: REDUCED_SERIES,
      buttonLabel: RELOAD_LABEL,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitForDesign(root);

    await step('A leitura seguinte traz uma série a menos', async () => {
      await userEvent.click(
        await within(canvasElement).findByRole('button', { name: RELOAD_LABEL }),
      );
    });

    await step('A série removida sai do DESENHO — nada do conjunto anterior fica pintado', async () => {
      // Só leitura pura aqui dentro. `waitFor` reagenda por observador de
      // mutação: uma condição que MEXE no DOM se realimenta, o prazo nunca
      // chega e a aba morre sem reportar — parece portão que passa.
      await waitFor(() => expect(designEscreve(root, REMOVED_SERIES)).toBe(false));
    });

    await step('E a tabela equivalente conta a mesma história', async () => {
      await expect(headerOf(root).some((c) => c.includes(REMOVED_SERIES))).toBe(false);
      // Uma coluna de categoria mais uma por série que restou.
      await expect(headerOf(root)).toHaveLength(1 + REDUCED_SERIES.length);
    });

    await step('E sobrou no desenho exatamente a forma das séries que restaram', async () => {
      // `filledShapes` exige o desenho assentado — antes de a animação fechar,
      // a marca que identifica a legenda está em toda forma.
      await drawingSettled(root);

      // E A CONTAGEM ESPERA DE NOVO. `drawingSettled` fecha a marca de
      // OPACIDADE, não a de GEOMETRIA: o próprio docblock dele diz que quem
      // CONTA forma espera outra vez, e todo outro ponto de contagem desta
      // família já fazia isso. Este era o único que afirmava direto, e por isso
      // era o único que dependia de o redesenho ter começado antes da leitura —
      // entre limpar e repintar o desenho fica VAZIO, e `filledShapes` devolveu
      // zero contra oito na primeira rodada de navegador desta stack, só sob
      // carga. A igualdade continua com dentes: contagem errada não converge,
      // porque nenhuma forma some depois.
      //
      // Só leitura pura aqui dentro — consulta e `getBBox()`, que lê layout e
      // não mexe no DOM. É a condição que ESCREVE que reagenda a si mesma e
      // pendura a aba.
      await waitFor(
        () => expect(filledShapes(root)).toHaveLength(REDUCED_SERIES.length * MONTHS.length),
        { timeout: 3000 },
      );
    });
  },
};
