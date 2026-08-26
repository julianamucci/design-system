import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { defineComponent, h, ref } from 'vue';
import {
  settleTheme,
  contraste,
  tokenColor,
  designPintado,
  exigirRoot,
  datumFormas,
  backgroundOpacoAtras,
  designTexts,
  tramasAplicadas,
} from '@shared/testing/chart-probe';
import { ChartContainer, buildBarOption, buildLineOption } from './index';
import { Button } from '../button';
import { decalColors, drawingSettled, filledShapes, headerOf } from './chart.fixtures';
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
    const root = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      await expect(root.querySelector('svg')).toBeNull();
      const aviso = root.querySelector('.nds-chart-empty');
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
    });

    await step('E a frase é o conteúdo, não um rótulo de imagem', async () => {
      // `role="img"` poda a subárvore da árvore de acessibilidade: com desenho
      // isso é o que se quer, aqui esconderia justamente a explicação. Sem papel,
      // a frase é lida.
      await expect(root.getAttribute('role')).toBeNull();
    });

    await step('O container mantém o piso de altura', async () => {
      // Sem piso, o bloco colapsa e a página salta quando o dado chega.
      await expect(root.getBoundingClientRect().height).toBeGreaterThan(100);
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
    const root = exigirRoot(canvasElement);

    await step('Com uma série a legenda some', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      // O nome da série só existiria na legenda: se ele não está escrito em
      // lugar nenhum do desenho, a legenda não foi montada.
      await expect(designTexts(root)).not.toContain(SERIE_UNICA[0].name);
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
    const root = exigirRoot(canvasElement);

    await step('A legenda nomeia cada série por escrito', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(
        () => {
          for (const serie of SERIES_MULTI) expect(designTexts(root)).toContain(serie.name);
        },
        { timeout: 3000 },
      );
    });

    await step('Cada série usa um token de cor distinto', async () => {
      // A trama entra como preenchimento `url(#…)`; tirando essas, o que sobra
      // são as cores de série de verdade.
      const colors = new Set(
        datumFormas(root)
          .map((forma) => getComputedStyle(forma).fill)
          .filter((cor) => !cor.startsWith('url')),
      );
      await expect(colors.size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
    });

    await step('E a trama sobrevive à cor', async () => {
      // Tirando a cor, a hachura sobreposta ainda separa as séries (WCAG 1.4.1).
      // O piso é 1 e não o número de séries porque quantas tramas distintas
      // chegam ao DOM depende de como a lib reaproveita a definição do padrão —
      // detalhe de implementação, não promessa do design system. O que a regra
      // exige, e o que se verifica aqui, é que a trama chegue à forma.
      await expect(tramasAplicadas(root).size).toBeGreaterThanOrEqual(1);
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
      const pageBackground = tokenColor('background', root);
      const painted = decalColors(root);
      await expect(painted.length).toBeGreaterThan(0);
      for (const one of painted) await expect(one).toBe(pageBackground);
    });
  },
};

/**
 * Tema escuro. O container observa a classe do `<html>` e reconstrói o tema do
 * desenho, então trocar a classe basta — nada de remontar a story.
 *
 * O modo em que a story ABRE, porém, vem de `globals`, e não de uma classe
 * trocada no meio da montagem: o desenho nasce com a paleta escura, e é esse
 * estado que o teste visual fotografa. A ida e volta da classe acontece depois,
 * com o desenho já pintado — é ela que verifica a recolorização.
 */
export const ThemeTokens: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item4'],
    // São DOIS containers empilhados, barras e linhas: a do meta esconderia a
    // metade que o item de regressão visual também cobra.
    docs: {
      source: { transform: themeChartTokensSource },
      description: { story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, não de valores cravados.' },
    },
  },
  // O modo escuro é declarado ANTES da montagem. É a diferença que fez esta
  // verificação sair do papel: o desenho nasce com a paleta que se quer medir,
  // em vez de a story ter de alcançá-la trocando a classe enquanto a lib monta.
  globals: { theme: 'dark' },
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
      // A sonda é o TEXTO do eixo, e não a barra. A paleta de série passou a
      // ter variante por modo, e a barra também muda — mas o texto continua
      // sendo a sonda porque o alvo dele é um token EXATO
      // (`--muted-foreground`), enquanto a cor de uma barra depende de que
      // posição da paleta a lib deu àquela série: sonda que precisa adivinhar a
      // posição mede a lib, não o tema.
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
    const root = exigirRoot(canvasElement);
    await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const background = backgroundOpacoAtras(root);

    await step('Todo contorno de forma passa de 3:1 contra o fundo', async () => {
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThan(0);
      for (const forma of formas) {
        await expect(contraste(getComputedStyle(forma).stroke, background)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('O texto do eixo passa de 4.5:1 — é texto, não objeto', async () => {
      const label = root.querySelector<SVGTextElement>('svg text');
      await expect(label).not.toBeNull();
      await expect(contraste(getComputedStyle(label!).fill, background)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

/** Três séries na primeira leitura — a local `SERIES_MULTI` tem só duas. */
const SERIES_THREE = [
  ...SERIES_MULTI,
  { name: 'Tablet', data: [40, 90, 60, 100] },
];
/** A série que sai do conjunto entre a primeira leitura e a segunda. */
const REMOVED_SERIES = 'Tablet';
const REDUCED_SERIES = SERIES_THREE.filter((s) => s.name !== REMOVED_SERIES);
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
 * de ser equivalente.
 *
 * A asserção que pega isso é a do NÚMERO DE FORMAS, e não a do texto da
 * legenda: medido, a legenda e a tabela já concordam em duas séries enquanto as
 * barras ainda mostram três. Portão que só lesse texto passaria com o defeito.
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
  render: () =>
    defineComponent({
      setup() {
        // DEFINE o conjunto reduzido — não alterna entre dois. O painel
        // Interactions reexecuta a play no MESMO DOM, sem remontar: um botão
        // que alternasse levaria a segunda rodada de volta ao conjunto cheio.
        const series = ref(SERIES_THREE);
        return () =>
          h('div', { class: 'nds-stack nds-max-w-lg', 'data-spacing': 'sm' }, [
            h(
              Button,
              {
                variant: 'outline',
                size: 'sm',
                onClick: () => {
                  series.value = REDUCED_SERIES;
                },
              },
              () => RELOAD_LABEL,
            ),
            h(ChartContainer, {
              option: buildBarOption({ xAxis: MONTHS, series: series.value }),
              height: 280,
              showData: true,
              'aria-label': 'Acessos mensais por dispositivo',
            }),
          ]);
      },
    }),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);
    await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });

    await step('A leitura seguinte traz uma série a menos', async () => {
      await userEvent.click(
        await within(canvasElement).findByRole('button', { name: RELOAD_LABEL }),
      );
    });

    await step('A série removida sai do DESENHO — nada do conjunto anterior fica pintado', async () => {
      // Só leitura pura aqui dentro. `waitFor` reagenda por observador de
      // mutação: condição que MEXE no DOM se realimenta e pendura sem reportar.
      await waitFor(() => expect(designTexts(root)).not.toContain(REMOVED_SERIES));
    });

    await step('E a tabela equivalente conta a mesma história', async () => {
      await expect(headerOf(root).some((c) => c.includes(REMOVED_SERIES))).toBe(false);
      await expect(headerOf(root)).toHaveLength(1 + REDUCED_SERIES.length);
    });

    await step('E sobrou no desenho exatamente a forma das séries que restaram', async () => {
      await drawingSettled(root);
      await expect(filledShapes(root)).toHaveLength(REDUCED_SERIES.length * MONTHS.length);
    });
  },
};
