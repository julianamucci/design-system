import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ChartContainer, buildBarOption, buildLineOption } from './chart';
import {
  settleTheme,
  contraste,
  tokenColor,
  designEscreve,
  designPintado,
  exigirRoot,
  datumFormas,
  backgroundOpacoAtras,
  designTexts,
  tramasAplicadas,
} from '@shared/testing/chart-probe';
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';
import { Button } from './button';
import {
  designPronto,
  drawingPalette,
  drawingSettled,
  filledShapes,
  hatchColors,
  headerOf,
} from './chart.fixtures';
import {
  chartDoisDesenhosSource,
  chartMultiSerieSource,
  chartSerieUnicaSource,
  chartSource,
  chartEmptySource,
} from './chart.source';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const serieUnica = [{ name: 'Desktop', data: [186, 305, 237, 73, 209, 214] }];
const seriesMulti = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
  { name: 'Tablet', data: [40, 60, 55, 48, 70, 66] },
];

/** Frase completa e orientadora — é a regra de UX writing do estado vazio. */
const FRASE_VAZIA = 'Nenhum dado disponível para o período selecionado.';

const meta: Meta = {
  title: 'UI/Chart/States',
  tags: ['display'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: chartSource } },
  },
};
export default meta;
type Story = StoryObj;

export const Empty: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
      // Série vazia, frase própria e NENHUMA altura: o que segura o bloco aqui
      // é o piso de altura, e um `height` no snippet apagaria a lição.
      source: { transform: chartEmptySource },
      description: {
        story: 'Sem série com dado o container troca o desenho por uma frase que orienta a próxima ação.',
      },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: [] })}
      className="nds-max-w-lg"
      emptyLabel={FRASE_VAZIA}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      await expect(root.querySelector('svg')).toBeNull();
      const aviso = root.querySelector('.nds-chart-empty');
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
    });

    await step('Sem desenho, nada se anuncia como imagem', async () => {
      // `role="img"` poda a subárvore da árvore de acessibilidade: com a frase
      // no lugar do gráfico, ela é justamente o conteúdo a ser lido, e ficaria
      // escondida atrás de um rótulo genérico. Sem desenho não há nem elemento
      // para levar o papel.
      await expect(root.querySelector('[data-slot="chart-canvas"]')).toBeNull();
      await expect(root.querySelector('[role="img"]')).toBeNull();
      await expect(root.getAttribute('aria-label')).toBeNull();
    });

    await step('E não há tabela de dados — não há número a tabular', async () => {
      // A alternativa textual existe para o que ESTÁ desenhado. Uma tabela de
      // cabeçalho só, sem uma linha, anunciaria dado onde não há.
      await expect(root.querySelector('[data-slot="chart-data"]')).toBeNull();
      await expect(root.querySelector('table')).toBeNull();
    });

    await step('O container mantém o piso de altura', async () => {
      // Sem piso o bloco colapsa e a página salta quando o dado chega. A story
      // não passa `height` de propósito: o que se mede aqui é o piso.
      await expect(root.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

export const SingleSeries: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      // Linhas com uma série só: a ausência da legenda é resultado do DADO, e
      // o construtor aqui não é o de barras do meta.
      source: { transform: chartSerieUnicaSource },
      description: { story: 'Uma única série — a legenda não aparece: não há o que comparar.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildLineOption({ xAxis: meses, series: serieUnica })}
      className="nds-max-w-lg"
      height={260}
      aria-label="Acessos mensais no desktop"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('A linha da série é traçada', async () => {
      const tracados = [...root.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
        const s = getComputedStyle(p);
        return s.fill === 'none' && s.stroke !== 'none' && parseFloat(s.strokeWidth || '0') >= 2;
      });
      await expect(tracados.length).toBeGreaterThanOrEqual(1);
      await expect(tracados[0].getTotalLength()).toBeGreaterThan(0);
    });

    await step('Com uma série a legenda some — o nome não é escrito em lugar nenhum', async () => {
      await expect(designTexts(root)).not.toContain(serieUnica[0].name);
    });
  },
};

export const MultiSeries: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: {
      // Legenda e trama por série nascem da PLURALIDADE das séries; a série
      // única do meta não produziria nenhuma das duas.
      source: { transform: chartMultiSerieSource },
      description: { story: 'Mais de uma série — a legenda aparece sozinha e cada série ganha trama própria.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={280}
      aria-label="Acessos mensais por dispositivo: desktop, mobile e tablet"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

    await step('A legenda escreve o nome de cada série', async () => {
      for (const serie of seriesMulti) await expect(designEscreve(root, serie.name)).toBe(true);
    });

    await step('E cada série carrega uma trama própria — a cor não é o único sinal', async () => {
      // Tirando a cor, a hachura ainda separa as séries (WCAG 1.4.1). Conta as
      // tramas que chegaram a uma FORMA, não as declaradas: trama declarada e
      // não usada não distingue nada na tela.
      //
      // O piso é o número de séries e não a igualdade: o ícone da legenda
      // repete a trama num tamanho próprio, o que pode gerar mais de um padrão
      // por série sem que nada esteja errado.
      const tramas = tramasAplicadas(root);
      await expect(tramas.size).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('E a trama sai na cor do fundo — hachura que não se vê não separa nada', async () => {
      // O passo acima conta trama APLICADA; este mede se ela chega a existir
      // para os olhos. A lista padrão da lib traça em preto a 20% sobre o
      // próprio preenchimento, e contra a paleta de gráfico isso se destaca
      // entre 1.14 e 1.54 — no pior caso a trama está declarada e não
      // entregue, que é o modo mais silencioso de a WCAG 1.4.1 falhar.
      //
      // Traçada no fundo da página, a hachura herda a distância que a paleta já
      // tem dele: 7.32 no pior caso no claro, 6.83 no escuro. Por isso a
      // asserção é IGUALDADE com o token, e não um piso de contraste — o piso
      // deixaria passar qualquer cinza que por acaso medisse bem num tema e
      // sumisse no outro.
      //
      // Sem `waitFor`: o passo anterior já provou que a trama chegou às formas,
      // e a cor sai do mesmo desenho. Repetir a medida sob espera só daria à
      // falha quinze chances de custar caro antes de aparecer.
      const pageBackground = tokenColor('background', root, HATCH_OPACITY);
      const painted = hatchColors(root);
      // Sem esta linha a comparação abaixo seria vácuo: lista vazia é igual a
      // lista vazia, e um desenho sem trama nenhuma passaria.
      await expect(painted.length).toBeGreaterThan(0);
      await expect(painted).toEqual([pageBackground]);
    });

    await step('A paleta entregue ao desenho são os OITO tokens, na ordem em que são declarados', async () => {
      // A ordem não é enfeite: cada posição é a cor que mais se afasta em matiz
      // das anteriores, então reordenar aproxima séries vizinhas. Comparar a
      // lista inteira, e não um conjunto, é o que faz uma troca de posição
      // reprovar.
      const expected = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => tokenColor(`chart-${n}`, root));
      await expect(drawingPalette(root)).toEqual(expected);
    });

    await step('E uma cor própria por série, sobre uma forma por categoria', async () => {
      const formas = datumFormas(root);
      await expect(formas.length).toBeGreaterThanOrEqual(meses.length * seriesMulti.length);
      const preenchimentos = new Set(formas.map((f) => getComputedStyle(f).fill));
      await expect(preenchimentos.size).toBeGreaterThanOrEqual(seriesMulti.length);
    });
  },
};

/**
 * Tema escuro.
 *
 * O modo vem de `globals`, e não de uma classe trocada no meio da montagem: a
 * story ABRE no escuro, a lib nasce já com a paleta escura, e é esse estado que
 * o teste visual fotografa. A ida e volta da classe acontece depois, com o
 * desenho pintado — é ela que verifica a RECOLORIZAÇÃO, que é o que o item de
 * contrato cobra.
 *
 * O desfazer roda num `finally`: deixar a classe posta envenena a story
 * seguinte e a foto do teste visual.
 */
export const ThemeTokens: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item4'],
    docs: {
      // São DOIS containers independentes na mesma tela, cada um com o seu
      // rótulo — o snippet do meta mostraria um só.
      source: { transform: chartDoisDesenhosSource },
      description: { story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, não de valores cravados.' },
    },
  },
  // O modo escuro é declarado ANTES da montagem. É a diferença que fez esta
  // verificação sair do papel: o desenho nasce com a paleta que se quer medir,
  // em vez de a story ter de alcançá-la trocando a classe enquanto a lib monta.
  globals: { theme: 'dark' },
  render: () => (
    <>
      <ChartContainer
        option={buildBarOption({ xAxis: meses, series: seriesMulti })}
        className="nds-max-w-lg"
        height={260}
        aria-label="Acessos mensais por dispositivo, em barras"
      />
      <ChartContainer
        option={buildLineOption({ xAxis: meses, series: seriesMulti })}
        className="nds-max-w-lg"
        height={260}
        aria-label="Acessos mensais por dispositivo, em linhas"
      />
    </>
  ),
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
      // A sonda é o TEXTO do eixo, e não a barra: o texto sai de um token só
      // (--muted-foreground), enquanto a barra depende de qual posição da
      // paleta a lib deu àquela série — o que o passo de paleta do MultiSeries
      // já mede, e por inteiro. Aqui o que se prova é que o desenho lê o tema
      // do documento, e para isso um token basta.
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
 * Quem sustenta o critério é o CONTORNO das formas, não a cor de série: os
 * tokens de paleta do gráfico ficam em torno de 2:1 contra o fundo e não
 * alcançariam o mínimo sozinhos. O contorno delimita cada objeto seja qual for
 * a paleta escolhida, e é por isso que o contraste não depende da variante.
 */
export const GraphicContrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      // O contorno que sustenta 3:1 é do TEMA, não de prop: o que a story
      // escolhe é o multi-série, e é ele que o snippet precisa mostrar.
      source: { transform: chartMultiSerieSource },
      description: { story: 'Contorno das formas e texto dos eixos medidos contra o fundo real.' },
    },
  },
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: meses, series: seriesMulti })}
      className="nds-max-w-lg"
      height={280}
      aria-label="Acessos mensais por dispositivo"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const background = backgroundOpacoAtras(root);

    await step('O contorno de toda forma de dado passa de 3:1 contra o fundo', async () => {
      const formas = datumFormas(root);
      // Sem esta linha o laço abaixo seria vácuo: lista vazia passa em tudo.
      await expect(formas.length).toBeGreaterThan(0);
      const fracos = formas
        .map((forma) => {
          const traco = getComputedStyle(forma).stroke;
          return { traco, ratio: contraste(traco, background) };
        })
        .filter((m) => m.ratio < 3);
      await expect(fracos).toEqual([]);
    });

    await step('O texto dos eixos passa de 4.5:1 — é texto, não objeto gráfico', async () => {
      const label = root.querySelector<SVGTextElement>('svg text');
      await expect(label).not.toBeNull();
      await expect(contraste(getComputedStyle(label!).fill, background)).toBeGreaterThanOrEqual(4.5);
    });
  },
};

/** A série que sai do conjunto entre a primeira leitura e a segunda. */
const REMOVED_SERIES = 'Tablet';
/** O conjunto da segunda leitura: o mesmo de cima, sem a última série. */
const reducedSeries = seriesMulti.filter((s) => s.name !== REMOVED_SERIES);
const RELOAD_LABEL = 'Reler do servidor';

/**
 * Define o conjunto reduzido — não alterna entre dois.
 *
 * O painel Interactions reexecuta a play no MESMO DOM, sem remontar: um botão
 * que alternasse levaria a segunda rodada de volta às três séries e a asserção
 * inverteria. Definindo, clicar duas vezes vale o mesmo que clicar uma.
 */
function SerieRemovidaDemo() {
  const [series, setSeries] = useState(seriesMulti);
  return (
    <div className="nds-stack nds-max-w-lg" data-spacing="sm">
      <Button variant="outline" size="sm" onClick={() => setSeries(reducedSeries)}>
        {RELOAD_LABEL}
      </Button>
      <ChartContainer
        option={buildBarOption({ xAxis: meses, series })}
        height={280}
        showData
        aria-label="Acessos mensais por dispositivo"
      />
    </div>
  );
}

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
  render: () => <SerieRemovidaDemo />,
  play: async ({ canvasElement, step }) => {
    const root = await designPronto(canvasElement);

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
      await expect(headerOf(root)).toHaveLength(1 + reducedSeries.length);
    });

    await step('E sobrou no desenho exatamente a forma das séries que restaram', async () => {
      // `filledShapes` exige o desenho assentado — antes de a animação fechar,
      // a marca que identifica a legenda está em toda forma.
      await drawingSettled(root);
      await expect(filledShapes(root)).toHaveLength(reducedSeries.length * meses.length);
    });
  },
};
