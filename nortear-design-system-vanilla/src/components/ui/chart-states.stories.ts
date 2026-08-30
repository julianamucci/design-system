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
import { HATCH_OPACITY } from '@shared/primitives/chart-hatch';
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
  title: 'Primitives/Display/Chart/States',
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
    coversNotApplicable: {
      // O item fala do conjunto que ENCOLHE entre duas leituras, e esta stack
      // não tem por onde entregar a segunda: createChart monta o elemento uma
      // vez e a instância da lib fica no closure da fábrica — nada é exposto no
      // nó devolvido para receber dado novo. As outras quatro stacks recebem o
      // conjunto por entrada reativa e cobrem o item.
      //
      // Não é diferença idiomática de framework: é uma lacuna da fábrica, e
      // está registrada como tal no FIXES-NEEDED.md. Quando ela fechar, este
      // item vira story aqui também.
      'functional.item9':
        'createChart monta o elemento uma vez e não expõe caminho de atualização — a fábrica não recebe um conjunto novo depois de montada (lacuna registrada, não diferença de framework)',
    },
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
      const background = tokenColor('background', root, HATCH_OPACITY);
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
    covers: ['functional.item6'],
    coversNotApplicable: {
      // A foto sai no escuro — o `globals` abaixo garante isso. O que falta é
      // o outro tipo de desenho: o item de regressão pede barras E linhas na
      // mesma tela, e esta story desenha só barras. Enquanto for um desenho
      // só, metade do item ficaria fotografada por ninguém, e reivindicá-lo
      // seria declarar cobertura que não existe.
      'visual.item4': 'a story desenha só barras, e o item cobra barras e linhas na mesma foto',
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
  // O modo escuro é declarado ANTES da montagem. É a diferença que fez esta
  // verificação sair do papel: o desenho nasce com a paleta que se quer medir,
  // em vez de a story ter de alcançá-la trocando a classe enquanto a lib monta.
  globals: { theme: 'dark' },
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
      //
      // A espera é de RELÓGIO, e o token é lido UMA vez, fora dela. `tokenColor`
      // monta um elemento de sonda no `<body>`: dentro de um `waitFor` ele mexe
      // no DOM a cada tentativa e acorda o observador de mutação que a espera
      // usa para reagendar — a tentativa que falha provoca a próxima, o prazo
      // nunca chega, e o navegador gira a 100% até a aba morrer sem resultado.
      // Abrindo no escuro há o que esperar: a classe do documento chega antes de
      // o desenho repintar.
      const expectedColor = tokenColor('muted-foreground', root);
      const labelColor = () => {
        const label = root.querySelector<SVGTextElement>('svg text');
        return label ? getComputedStyle(label).fill : '';
      };
      const deadline = Date.now() + 3000;
      while (labelColor() !== expectedColor && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await expect(labelColor()).toBe(expectedColor);
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

    await step('Trocar o tema recolore no lugar, sem remontar o desenho', async () => {
      // O item de contrato fala da TROCA, não do modo escuro parado: os passos
      // acima provam que o desenho LÊ o token; este prova que ele o relê quando
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
      const html = root.ownerDocument.documentElement;
      const wasDark = html.classList.contains('dark');
      const canvasBox = root.querySelector<HTMLElement>('[data-slot="chart-canvas"]');
      const axisColor = () => {
        const label = root.querySelector<SVGTextElement>('svg text');
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
        await expect(root.querySelector('[data-slot="chart-canvas"]')).toBe(canvasBox);
      } finally {
        // Repõe o que a story ENCONTROU: o escuro do `globals` é o que o teste
        // visual fotografa, e na suíte as stories dividem o mesmo documento.
        html.classList.toggle('dark', wasDark);
      }
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
