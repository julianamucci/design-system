import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect } from 'storybook/test';
import { TraceWaterfall } from './index';
import TraceWaterfallStory from './TraceWaterfallStory.svelte';
import TraceWaterfallTightColumnsStory from './TraceWaterfallTightColumnsStory.svelte';
import {
  CLIPPED_SPANS,
  CLIPPED_SPAN_ID,
  CLIPPED_TOTAL_MS,
  LONG_LABEL_SPANS,
  LONG_LABEL_TOTAL_MS,
  UNCLIPPED_SPAN_ID,
  WIDE_TOTAL_MS,
  traceWaterfallLabels,
  wideTraceSpans,
} from './trace-waterfall.fixtures';
import {
  traceWaterfallClippedSnippet,
  traceWaterfallLongLabelsSnippet,
  traceWaterfallPartialSnippet,
  traceWaterfallTightColumnsSnippet,
  traceWaterfallWideSnippet,
} from './trace-waterfall.source';
import type { TraceSpan } from '@shared/primitives/chat-protocol';
import { resolveTraceWaterfall } from '@shared/primitives/trace-waterfall-axis';
import {
  TRACE_SPANS_ORDER,
  TRACE_SPANS_PARTIAL,
  TRACE_TOTAL_MS,
} from '@shared/primitives/trace-waterfall-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que muda quando a cascata encosta nos limites: quando ela não cabe na
// conversa, quando o rótulo é longo demais para a coluna, quando o eixo é uma
// janela mais curta que o rastro e quando ele chega pela metade.

const meta: Meta<typeof TraceWaterfall> = {
  title: 'Primitives/Conversational/TraceWaterfall/Compositions',
  component: TraceWaterfall,
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: traceWaterfallWideSnippet },
      description: {
        component:
          'Os casos de borda do desenho: mais largo que a conversa, com rótulos longos, recortado por uma janela mais curta que o rastro e com menos trechos do que o rastro inteiro.',
      },
    },
  },
};

export default meta;

/**
 * O tipo acompanha O QUE É MONTADO, e não o `meta`.
 *
 * Os rótulos são texto de interface, e a barra de idioma do Storybook os
 * troca com a story montada: cada story monta um invólucro que os deriva do
 * idioma, em vez da peça nua com rótulos presos ao idioma de abertura.
 */
type Story = StoryObj<typeof TraceWaterfallStory>;
type TightColumnsStory = StoryObj<typeof TraceWaterfallTightColumnsStory>;

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="trace-waterfall"]')!;

const indents = (piece: HTMLElement) =>
  [...piece.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-row"]')].map((row) =>
    // O valor COMPUTADO, e nunca o atributo: propriedade personalizada
    // declarada dentro do próprio seletor vence a herança, e ler o `style`
    // provaria só que alguém escreveu alguma coisa ali.
    Number(getComputedStyle(row).getPropertyValue('--trace-waterfall-row-indent').trim()),
  );

/**
 * O mesmo rastro, declarado longe da origem do recuo.
 *
 * `depth` é RELATIVO entre os trechos: quem monta não precisa saber de
 * convenção nenhuma sobre onde começa a contagem, e a cascata inteira
 * encosta. O desenho é idêntico ao da story em andamento, e é esse o
 * assunto.
 */
const SHIFTED_SPANS: readonly TraceSpan[] = TRACE_SPANS_ORDER.map((span) => ({
  ...span,
  depth: span.depth + 4,
}));

export const Shifted: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: { source: { transform: traceWaterfallWideSnippet } },
  },
  render: () => ({
    Component: TraceWaterfallStory,
    props: { spans: SHIFTED_SPANS, totalMs: TRACE_TOTAL_MS, status: 'running' },
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A cascata encosta na origem, sem degraus vazios à esquerda', async () => {
      await expect(Math.min(...indents(piece))).toBe(0);
    });

    await step('A forma do aninhamento não muda com o deslocamento', async () => {
      // Os mesmos três níveis do rastro declarado na origem.
      const reference = resolveTraceWaterfall(TRACE_SPANS_ORDER, TRACE_TOTAL_MS)!;
      await expect(indents(piece)).toEqual(reference.rows.map((r) => r.indent));
    });
  },
};

/**
 * Mais largo que a conversa.
 *
 * Dez trechos com recuo crescente passam de qualquer conversa com as
 * larguras mínimas que a folha declara, e é aí que a camada rola — uma só,
 * com nome e parada de teclado.
 */
export const Wide: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item6'],
    docs: { source: { transform: traceWaterfallWideSnippet } },
  },
  // A LARGURA É PARTE DO ASSUNTO: a story precisa ser mais estreita que a
  // cascata para que a barra exista, e o canvas do Storybook é largo. Sem o
  // teto, esta fotografia mostraria uma cascata folgada e o guarda da
  // rolagem ficaria verde sem nada para medir.
  render: () => ({
    Component: TraceWaterfallStory,
    props: {
      spans: wideTraceSpans(),
      totalMs: WIDE_TOTAL_MS,
      status: 'running',
      hostClass: 'nds-max-w-md',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const viewport = piece.querySelector<HTMLElement>(
      '[data-slot="trace-waterfall-viewport"]',
    )!;

    await step('Uma só camada rola, e é a que tem nome e foco', async () => {
      // O desenho é mais largo que a camada: é essa desigualdade que faz a
      // barra existir, e é o elemento que RECORTA que precisa ser medido — a
      // raiz do documento não transborda.
      await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
      await expect(viewport.tabIndex).toBe(0);
      await expect(viewport.getAttribute('role')).toBe('group');
      await expect(viewport.getAttribute('aria-label')).toBe(traceWaterfallLabels().region);
    });

    await step('Nenhuma outra camada rola', async () => {
      const list = piece.querySelector<HTMLElement>('[data-slot="trace-waterfall-rows"]')!;
      await expect(list.scrollWidth).toBe(list.clientWidth);
    });
  },
};

/**
 * O rastro pela metade — a revelação feita como esta família a faz.
 *
 * Não existe contador de revelação: quem revela passa menos trechos, e o
 * EIXO CONTINUA O MESMO — é isso que faz as três barras que sobraram
 * guardarem a posição verdadeira em vez de reescalarem para ocupar a régua
 * inteira.
 */
export const Partial: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: traceWaterfallPartialSnippet } },
  },
  render: () => ({
    Component: TraceWaterfallStory,
    props: { spans: TRACE_SPANS_PARTIAL, totalMs: TRACE_TOTAL_MS, status: 'running' },
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('Sobram três linhas, e o eixo continua o declarado', async () => {
      await expect(
        piece.querySelectorAll('[data-slot="trace-waterfall-row"]').length,
      ).toBe(TRACE_SPANS_PARTIAL.length);
      const axis = piece.querySelector<HTMLElement>('[data-slot="trace-waterfall-axis"]')!;
      await expect(axis.textContent).toContain(String(TRACE_TOTAL_MS));
    });

    await step('As barras que sobraram guardam a posição do rastro inteiro', async () => {
      // É a razão de o eixo não ser derivado: derivado, ele encolheria aqui e
      // as três barras reescalariam para ocupar a régua inteira.
      const inteiro = resolveTraceWaterfall(TRACE_SPANS_ORDER, TRACE_TOTAL_MS)!;
      const bars = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-bar"]'),
      ];
      for (const [index, bar] of bars.entries()) {
        const start = Number(
          getComputedStyle(bar).getPropertyValue('--trace-waterfall-bar-start').trim(),
        );
        await expect(start).toBeCloseTo(inteiro.rows[index].start, 3);
      }
    });
  },
};

/** Rótulos longos: eles alargam a coluna, e nunca são cortados nem quebrados. */
export const LongLabels: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: { source: { transform: traceWaterfallLongLabelsSnippet } },
  },
  render: () => ({
    Component: TraceWaterfallStory,
    props: {
      spans: LONG_LABEL_SPANS,
      totalMs: LONG_LABEL_TOTAL_MS,
      status: 'running',
      hostClass: 'nds-max-w-md',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('O rótulo inteiro está no DOM, sem reticências', async () => {
      const labels = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-label"]'),
      ];
      await expect(labels.map((l) => l.textContent)).toEqual(
        LONG_LABEL_SPANS.map((s) => s.label),
      );
    });

    await step('Ele não quebra: a linha continua de uma linha só', async () => {
      // Quebrar faria a linha crescer em altura e desalinhar a régua da
      // vizinha, que é o contrário do que uma cascata precisa. Medido contra
      // `font-size`, que computa em pixel em qualquer motor — `line-height`
      // declarada sem unidade nem sempre computa.
      const label = piece.querySelector<HTMLElement>(
        '[data-slot="trace-waterfall-label"]',
      )!;
      const fontSize = Number.parseFloat(getComputedStyle(label).fontSize);
      await expect(label.getBoundingClientRect().height).toBeLessThan(fontSize * 1.9);
    });

    await step('E a coluna alarga até a peça passar da conversa', async () => {
      const viewport = piece.querySelector<HTMLElement>(
        '[data-slot="trace-waterfall-viewport"]',
      )!;
      await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    });
  },
};

/**
 * Uma janela do rastro: o eixo é mais curto que os trechos que ele mostra.
 *
 * Não é erro — é o desenho de quem mostra um pedaço de um rastro longo. As
 * barras das pontas são recortadas para caber, e cada linha recortada avisa
 * em palavras que o trecho continua fora.
 */
export const Clipped: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item8'],
    docs: { source: { transform: traceWaterfallClippedSnippet } },
  },
  render: () => ({
    Component: TraceWaterfallStory,
    props: { spans: CLIPPED_SPANS, totalMs: CLIPPED_TOTAL_MS, status: 'running' },
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = traceWaterfallLabels();

    const readingOf = (spanId: string) =>
      piece
        .querySelector<HTMLElement>(
          `[data-slot="trace-waterfall-row"][data-span-id="${spanId}"]`,
        )!
        .querySelector<HTMLElement>('[data-slot="trace-waterfall-row-reading"]')!;

    await step('Nenhuma barra passa do fim do eixo', async () => {
      const bars = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="trace-waterfall-bar"]'),
      ];
      await expect(bars.length).toBe(CLIPPED_SPANS.length);
      for (const bar of bars) {
        const computed = getComputedStyle(bar);
        const start = Number(
          computed.getPropertyValue('--trace-waterfall-bar-start').trim(),
        );
        const size = Number(computed.getPropertyValue('--trace-waterfall-bar-size').trim());
        await expect(start).toBeGreaterThanOrEqual(0);
        await expect(start + size).toBeLessThanOrEqual(100);
      }
    });

    await step('A linha recortada avisa que o trecho continua fora', async () => {
      // O id vem da FIXTURE, e não escrito aqui: literal dentro de string não
      // é alcançado por portão nenhum, e um seletor que deixa de casar faz a
      // story LANÇAR em vez de reprovar.
      await expect(readingOf(CLIPPED_SPAN_ID).textContent).toContain(labels.clipped);
    });

    await step('A linha que coube inteira não avisa nada', async () => {
      // A contraprova: sem ela, uma peça que sempre avisasse passaria igual.
      await expect(readingOf(UNCLIPPED_SPAN_ID).textContent).not.toContain(labels.clipped);
    });
  },
};

/**
 * As duas larguras mínimas, apertadas por quem consome.
 *
 * São a única superfície de customização da peça, e são elas que decidem
 * quando a cascata passa a rolar. Entram por propriedade personalizada na
 * folha de quem monta, e nunca por largura em `style`.
 */
export const TightColumns: TightColumnsStory = {
  parameters: {
    docs: { source: { transform: traceWaterfallTightColumnsSnippet } },
  },
  render: () => ({ Component: TraceWaterfallTightColumnsStory }),
  play: async ({ canvasElement, step }) => {
    const widthOf = (testid: string) =>
      canvasElement
        .querySelector<HTMLElement>(
          `[data-testid="${testid}"] [data-slot="trace-waterfall-name"]`,
        )!
        .getBoundingClientRect().width;

    await step('A coluna do nome aperta, e a caixa encolhe com ela', async () => {
      // A largura da caixa é COMPUTADA, e é o que prova que a propriedade
      // chegou ao elemento — ler o `style` provaria só que alguém escreveu
      // ali.
      await expect(widthOf('trace-waterfall-tight-columns')).toBeLessThan(
        widthOf('trace-waterfall-default-columns'),
      );
    });
  },
};
