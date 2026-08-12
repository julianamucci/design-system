import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption, buildLineOption } from './chart';
import {
  assentarTema,
  contraste,
  corDoToken,
  desenhoEscreve,
  desenhoPintado,
  exigirRaiz,
  formasDeDado,
  fundoOpacoAtras,
  textosDoDesenho,
  tramasAplicadas,
} from '@shared/testing/chart-probe';

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
  parameters: { layout: 'padded', controls: { disable: true }, actions: { disable: true } },
};
export default meta;
type Story = StoryObj;

/** Espera o desenho existir e devolve a raiz — precondição de qualquer medida. */
async function desenhoPronto(canvasElement: HTMLElement): Promise<HTMLElement> {
  const raiz = exigirRaiz(canvasElement);
  await waitFor(() => expect(desenhoPintado(raiz)).toBe(true), { timeout: 3000 });
  return raiz;
}

export const Empty: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
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
    const raiz = exigirRaiz(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      await expect(raiz.querySelector('svg')).toBeNull();
      const aviso = raiz.querySelector('.nds-chart-empty');
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
    });

    await step('Sem desenho, o container não se anuncia como imagem', async () => {
      // `role="img"` poda a subárvore da árvore de acessibilidade: com a frase
      // no lugar do gráfico, ela é justamente o conteúdo a ser lido, e ficaria
      // escondida atrás de um rótulo genérico.
      await expect(raiz.getAttribute('role')).toBeNull();
      await expect(raiz.getAttribute('aria-label')).toBeNull();
    });

    await step('O container mantém o piso de altura', async () => {
      // Sem piso o bloco colapsa e a página salta quando o dado chega. A story
      // não passa `height` de propósito: o que se mede aqui é o piso.
      await expect(raiz.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

export const SingleSeries: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: { description: { story: 'Uma única série — a legenda não aparece: não há o que comparar.' } },
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
    const raiz = await desenhoPronto(canvasElement);

    await step('A linha da série é traçada', async () => {
      const tracados = [...raiz.querySelectorAll<SVGPathElement>('svg path')].filter((p) => {
        const s = getComputedStyle(p);
        return s.fill === 'none' && s.stroke !== 'none' && parseFloat(s.strokeWidth || '0') >= 2;
      });
      await expect(tracados.length).toBeGreaterThanOrEqual(1);
      await expect(tracados[0].getTotalLength()).toBeGreaterThan(0);
    });

    await step('Com uma série a legenda some — o nome não é escrito em lugar nenhum', async () => {
      await expect(textosDoDesenho(raiz)).not.toContain(serieUnica[0].name);
    });
  },
};

export const MultiSeries: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item2'],
    docs: { description: { story: 'Mais de uma série — a legenda aparece sozinha e cada série ganha trama própria.' } },
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
    const raiz = await desenhoPronto(canvasElement);

    await step('A legenda escreve o nome de cada série', async () => {
      for (const serie of seriesMulti) await expect(desenhoEscreve(raiz, serie.name)).toBe(true);
    });

    await step('E cada série carrega uma trama própria — a cor não é o único sinal', async () => {
      // Tirando a cor, a hachura ainda separa as séries (WCAG 1.4.1). Conta as
      // tramas que chegaram a uma FORMA, não as declaradas: trama declarada e
      // não usada não distingue nada na tela.
      //
      // O piso é o número de séries e não a igualdade: o ícone da legenda
      // repete a trama num tamanho próprio, o que pode gerar mais de um padrão
      // por série sem que nada esteja errado.
      const tramas = tramasAplicadas(raiz);
      await expect(tramas.size).toBeGreaterThanOrEqual(seriesMulti.length);
    });

    await step('E uma cor própria por série, sobre uma forma por categoria', async () => {
      const formas = formasDeDado(raiz);
      await expect(formas.length).toBeGreaterThanOrEqual(meses.length * seriesMulti.length);
      const preenchimentos = new Set(formas.map((f) => getComputedStyle(f).fill));
      await expect(preenchimentos.size).toBeGreaterThanOrEqual(seriesMulti.length);
    });
  },
};

/**
 * Tema escuro.
 *
 * O desfazer roda num `finally`: deixar a classe posta envenena a story
 * seguinte e a foto do teste visual.
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
    docs: { description: { story: 'Cor e tipografia do desenho saem dos tokens do tema em vigor, não de valores cravados.' } },
  },
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
        () => graficos.forEach((g) => expect(desenhoPintado(g)).toBe(true)),
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
 * tokens de paleta do gráfico ficam em torno de 2:1 contra o fundo e não
 * alcançariam o mínimo sozinhos. O contorno delimita cada objeto seja qual for
 * a paleta escolhida, e é por isso que o contraste não depende da variante.
 */
export const GraphicContrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: { description: { story: 'Contorno das formas e texto dos eixos medidos contra o fundo real.' } },
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
    const raiz = await desenhoPronto(canvasElement);
    // Precondição da medida: ver o comentário de `assentarTema`.
    await assentarTema(document);
    const fundo = fundoOpacoAtras(raiz);

    await step('O contorno de toda forma de dado passa de 3:1 contra o fundo', async () => {
      const formas = formasDeDado(raiz);
      // Sem esta linha o laço abaixo seria vácuo: lista vazia passa em tudo.
      await expect(formas.length).toBeGreaterThan(0);
      const fracos = formas
        .map((forma) => {
          const traco = getComputedStyle(forma).stroke;
          return { traco, razao: contraste(traco, fundo) };
        })
        .filter((m) => m.razao < 3);
      await expect(fracos).toEqual([]);
    });

    await step('O texto dos eixos passa de 4.5:1 — é texto, não objeto gráfico', async () => {
      const rotulo = raiz.querySelector<SVGTextElement>('svg text');
      await expect(rotulo).not.toBeNull();
      await expect(contraste(getComputedStyle(rotulo!).fill, fundo)).toBeGreaterThanOrEqual(4.5);
    });
  },
};
