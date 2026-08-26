import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
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

// ─── Sondas locais ────────────────────────────────────────────────────────────

/**
 * Cor com que a trama de `id` foi TRAÇADA, no formato do navegador.
 *
 * O colhedor compartilhado responde quais tramas chegaram a alguma forma; o que
 * se mede aqui é a cor de dentro do `<pattern>`, que é o que separa a hachura do
 * preenchimento. A lista padrão da lib desenha em preto translúcido, e contra a
 * paleta de série isso fica entre 1.26 e 1.57 — trama declarada e não entregue.
 */
function decalColor(root: HTMLElement, id: string): string {
  const pattern = root.querySelector(`pattern[id="${CSS.escape(id)}"]`);
  if (!pattern) throw new Error(`nenhum <pattern id="${id}"> no desenho`);
  // Só o ATRIBUTO `fill` serve de sonda. Conteúdo de `<pattern>` não é
  // renderizado, e `getComputedStyle` de um nó não renderizado devolve o
  // inicial do SVG — preto — para quem não declarou nada: o `<g>` que embrulha
  // a trama passaria por "trama preta" e a asserção acusaria defeito onde não
  // há.
  for (const painted of pattern.querySelectorAll('[fill]')) {
    const color = painted.getAttribute('fill') ?? '';
    if (color && color !== 'none') return normalizedColor(color, root);
  }
  throw new Error(`o <pattern id="${id}"> não desenha nada com cor`);
}

/** Qualquer notação de cor CSS reduzida ao formato que `getComputedStyle` devolve. */
function normalizedColor(value: string, near: HTMLElement): string {
  const doc = near.ownerDocument;
  const probe = doc.createElement('span');
  probe.style.color = value;
  // Fora do fluxo e no <body>, pelo mesmo motivo do colhedor compartilhado:
  // pendurar a sonda ao lado do gráfico reflui o bloco e repinta o desenho.
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  doc.body.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}

/** Tamanho do texto do desenho, em pixels inteiros. */
function labelFontSize(root: HTMLElement): number {
  const label = root.querySelector<SVGTextElement>('svg text');
  if (!label) throw new Error('o desenho ainda não escreveu texto nenhum');
  return Math.round(Number.parseFloat(getComputedStyle(label).fontSize));
}

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
          data: 'vazio',
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
    const root = exigirRoot(canvasElement);

    await step('Sem dado não há desenho — há uma frase', async () => {
      const aviso = root.querySelector('.nds-chart-empty');
      await expect(aviso).not.toBeNull();
      // Frase completa e orientadora, não "Sem dados.": é a regra de UX writing
      // do próprio conteúdo do componente.
      await expect(aviso?.textContent?.trim()).toBe(FRASE_VAZIA);
      await expect(root.querySelector('svg')).toBeNull();
    });

    await step('No vazio o bloco não se anuncia como imagem', async () => {
      // `role="img"` PODA a subárvore da árvore de acessibilidade: com o papel
      // posto, a frase que explica a ausência sumiria atrás de um rótulo
      // genérico. Sem desenho não há imagem para narrar.
      await expect(root.getAttribute('role')).toBeNull();
      await expect(root.getAttribute('aria-label')).toBeNull();
    });

    await step('O bloco mantém o piso de altura', async () => {
      // Sem piso o container colapsa, e a página salta quando o dado chega.
      await expect(root.getBoundingClientRect().height).toBeGreaterThan(100);
    });
  },
};

// ─── Série única ──────────────────────────────────────────────────────────────

export const SingleSeries: Story = {
  parameters: {
    docs: {
      // Override de story: uma série SÓ, na forma `xAxis` + `series` — é o que
      // faz a legenda desaparecer sozinha.
      source: { transform: chartSourceWith({ data: 'serieUnica' }) },
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
    const root = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A legenda some — o nome da série não é escrito em lugar nenhum', async () => {
      await expect(designTexts(root)).not.toContain(SERIE_UNICA[0].name);
    });

    await step('As categorias continuam escritas no eixo', async () => {
      for (const month of MONTHS) {
        await expect(designEscreve(root, month)).toBe(true);
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
          data: 'multi',
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
    const root = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A legenda escreve o nome de cada série', async () => {
      for (const serie of SERIES_MULTI) {
        await expect(designEscreve(root, serie.name)).toBe(true);
      }
    });

    await step('Cada série usa um token de cor distinto', async () => {
      const colors = new Set(
        datumFormas(root)
          .map((f) => getComputedStyle(f).fill)
          .filter((cor) => !cor.startsWith('url')),
      );
      await expect(colors.size).toBeGreaterThanOrEqual(SERIES_MULTI.length);
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
        () => expect(tramasAplicadas(root).size).toBeGreaterThanOrEqual(1),
        { timeout: 3000 },
      );
    });

    await step('E a trama é traçada na cor do fundo, não em preto translúcido', async () => {
      // Trama existir não é trama enxergar. A lista padrão da lib desenha em
      // `rgba(0, 0, 0, 0.2)`, que sobre a paleta de série mede entre 1.26 e
      // 1.57 contra o PRÓPRIO preenchimento — no pior caso, imperceptível: o
      // sinal que substitui a cor (WCAG 1.4.1) ficava declarado e não entregue.
      // Na cor do fundo a mesma hachura mede de 6.83 a 11.02, e é por isso que
      // a asserção é de IGUALDADE com `--background`, e não "existe alguma cor".
      const background = tokenColor('background', root);
      for (const id of tramasAplicadas(root)) {
        await expect(decalColor(root, id)).toBe(background);
      }
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
        transform: chartSourceWith({ data: 'umPonto', 'aria-label': 'Acessos de janeiro' }),
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
    const root = exigirRoot(canvasElement);

    await step('O desenho sai com uma forma de dado', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A única categoria aparece escrita no eixo', async () => {
      await expect(designEscreve(root, 'Jan')).toBe(true);
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
          data: 'multi',
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
    const root = exigirRoot(canvasElement);

    await step('O desenho sai', async () => {
      await waitFor(() => expect(designPintado(root)).toBe(true), { timeout: 3000 });
      await waitFor(() => expect(designTexts(root).length).toBeGreaterThan(0), { timeout: 3000 });
    });

    await step('A cor do texto do eixo é o token do tema, não um valor cravado', async () => {
      // A sonda é o TEXTO do eixo, e não a barra, porque é a mais estável: não
      // depende de qual série a lib pintou primeiro nem de a forma já ter sido
      // desenhada. A paleta de série também sai do token — `--chart-1` a
      // `--chart-8`, com variante por modo —, e quem a mede contra o fundo é a
      // story de contraste, logo abaixo.
      const label = root.querySelector<SVGTextElement>('svg text')!;
      await expect(getComputedStyle(label).fill)
        .toBe(tokenColor('muted-foreground', root));
    });

    await step('O tamanho do texto sai da fonte raiz, e cresce junto com ela', async () => {
      // WCAG 1.4.4. A lib só aceita número em pixel para tamanho de texto, e
      // número escolhido à mão fica surdo ao navegador: o desenho ficava em 12
      // (o padrão da lib) com o título cravado em 14, enquanto a frase do
      // estado vazio, que é CSS, crescia ao lado no mesmo componente.
      //
      // Medir com a fonte parada não provaria nada — na base 16 o valor certo
      // dá os mesmos 12 de antes. Por isso a fonte raiz MUDA aqui: 20px pede
      // 15 (0.75 × 20), que o número cravado nunca alcança.
      //
      // A mudança entra por FOLHA, e não por `style` inline: é assim que a
      // preferência de fonte do navegador chega ao documento, e é o caminho
      // que se quer medir. Inline também venceria a folha do tema, que é
      // justamente o que o design system proíbe.
      const doc = root.ownerDocument;
      const base = () => Number.parseFloat(getComputedStyle(doc.documentElement).fontSize);
      const fontPreference = doc.createElement('style');
      fontPreference.textContent = ':root { font-size: 20px }';

      await expect(labelFontSize(root)).toBe(Math.round(base() * 0.75));
      try {
        doc.head.appendChild(fontPreference);
        await waitFor(() => expect(labelFontSize(root)).toBe(15), { timeout: 3000 });
      } finally {
        // Repõe o que ENCONTROU: as stories dividem o mesmo documento, e uma
        // fonte raiz esquecida em 20px envenena a próxima.
        fontPreference.remove();
      }
      await waitFor(
        () => expect(labelFontSize(root)).toBe(Math.round(base() * 0.75)),
        { timeout: 3000 },
      );
    });

    await step('E o desenho está inteiro', async () => {
      await expect(datumFormas(root).length).toBeGreaterThan(0);
      await expect(root.querySelector('.nds-chart-empty')).toBeNull();
    });
  },
};

// ─── Contraste dos objetos gráficos ───────────────────────────────────────────

/**
 * WCAG 1.4.11: objeto gráfico precisa de 3:1 contra o que está em volta.
 *
 * Quem sustenta o critério é o CONTORNO das formas. Ele nasceu quando a paleta
 * ficava em torno de 2:1 contra o fundo e sozinha não passaria; com
 * `--chart-1` a `--chart-8` por modo, o pior caso medido é 7.32 no claro e 6.83
 * no escuro. O contorno em `--foreground` fica porque delimita cada objeto
 * contra o VIZINHO, que a medida contra o fundo não cobre — e qualquer que seja
 * a paleta escolhida.
 */
export const GraphicContrast: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      // Override de story: duas séries, na forma `xAxis` + `series`.
      source: {
        transform: chartSourceWith({
          data: 'multi',
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
    const root = exigirRoot(canvasElement);
    await waitFor(() => expect(datumFormas(root).length).toBeGreaterThan(0), { timeout: 3000 });
    // Precondição da medida: ver o comentário de `settleTheme`.
    await settleTheme(document);
    const background = backgroundOpacoAtras(root);

    await step('Todo contorno de forma passa de 3:1 contra o fundo', async () => {
      for (const forma of datumFormas(root)) {
        await expect(contraste(getComputedStyle(forma).stroke, background)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('O texto dos eixos passa de 4.5:1 contra o mesmo fundo', async () => {
      // Marca de eixo é texto corrido pequeno: o piso é 4.5, não 3.
      const label = root.querySelector<SVGTextElement>('svg text')!;
      await expect(contraste(getComputedStyle(label).fill, background)).toBeGreaterThanOrEqual(4.5);
    });
  },
};
