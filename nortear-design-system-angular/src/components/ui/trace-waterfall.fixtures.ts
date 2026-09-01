/**
 * Andaime das demonstrações da cascata de trechos.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase da régua, o molde da leitura e a palavra
 * de cada estado. Os TRECHOS de ordem, falha e revelação parcial saem de
 * `@shared/primitives/trace-waterfall-examples`, porque não são idioma: a
 * posição das barras é a mesma nas cinco stacks, e escrever milissegundos
 * diferentes por idioma faria as fotos mostrarem cascatas diferentes.
 *
 * OS DEMAIS RASTROS (largo, rótulos longos, rótulos curtos, janela recortada)
 * não moram no primitivo compartilhado — só a demonstração os usa, e cada
 * stack os declara pelo mesmo motivo do grafo: são dado de fotografia, não
 * vocabulário.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar
 * o runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import traceWaterfallTranslations from '@shared/content/trace-waterfall/translations.json';
import type { RunStatus, TraceSpan } from '@shared/primitives/chat-protocol';
import type { TraceWaterfallLabels } from './trace-waterfall';

const { t } = useTranslation(traceWaterfallTranslations as Record<string, unknown>);

/** O nome da camada, os quatro moldes e as quatro palavras. */
export function traceWaterfallLabels(): TraceWaterfallLabels {
  return {
    region: t('labels.region'),
    axis: t('labels.axis'),
    duration: t('labels.duration'),
    reading: t('labels.reading'),
    clipped: t('labels.clipped'),
    state: {
      pending: t('labels.state.pending'),
      running: t('labels.state.running'),
      done: t('labels.state.done'),
      failed: t('labels.state.failed'),
    },
  };
}

/** O eixo do rastro largo. */
export const WIDE_TOTAL_MS = 4000;

/**
 * Um rastro fundo, para o caso em que ele não cabe na conversa.
 *
 * Dez trechos, cada um um degrau mais fundo que o anterior até a metade e
 * voltando depois: é o recuo, e não o número de linhas, que faz a peça passar
 * da conversa — a coluna do nome cresce com o degrau, e a do eixo tem largura
 * mínima própria. Gerado, e não escrito à mão, porque o que a story fotografa
 * é a rolagem.
 */
export function wideTraceSpans(): TraceSpan[] {
  return Array.from({ length: 10 }, (_, index): TraceSpan => ({
    id: `trecho-${index}`,
    label: `Etapa ${index + 1} do atendimento ao cliente`,
    startMs: index * 340,
    durationMs: 300,
    depth: index < 5 ? index : 9 - index,
    state: index < 4 ? 'done' : index === 4 ? 'running' : 'pending',
  }));
}

/** O eixo do rastro de rótulos longos. */
export const LONG_LABEL_TOTAL_MS = 900;

/**
 * Um rastro com rótulos longos.
 *
 * O rótulo do trecho não quebra e não é cortado: ele ALARGA a coluna, a peça
 * passa a ser mais larga que a conversa e a camada rola. É a divergência
 * deliberada em relação ao grafo, onde o rótulo quebra — lá a caixa está numa
 * casa de grade cuja largura é a do rótulo; aqui quebrar faria a linha crescer
 * em altura e desalinhar a régua da vizinha.
 */
export const LONG_LABEL_SPANS: readonly TraceSpan[] = [
  {
    id: 'coleta',
    label: 'Coletar os documentos que o cliente anexou ao pedido',
    startMs: 0,
    durationMs: 260,
    depth: 0,
    state: 'done',
  },
  {
    id: 'conferencia',
    label: 'Conferir cada documento contra a lista de exigências do contrato',
    startMs: 270,
    durationMs: 380,
    depth: 1,
    state: 'running',
  },
  {
    id: 'resumo',
    label: 'Escrever o resumo do que falta',
    startMs: 660,
    durationMs: 220,
    depth: 1,
    state: 'pending',
  },
];

/** O eixo do rastro de rótulos curtos. */
export const SHORT_LABEL_TOTAL_MS = 600;

/**
 * Um rastro de rótulos curtos.
 *
 * Existe para a story da customização, e a razão é mecânica: a coluna do nome
 * é `max-content` com um PISO, e o piso só decide a largura quando o conteúdo
 * é mais estreito que ele. Com rótulos longos, apertar o piso não muda pixel
 * nenhum — a story ficaria verde medindo uma coisa que não aconteceu.
 */
export const SHORT_LABEL_SPANS: readonly TraceSpan[] = [
  { id: 'ler', label: 'Ler', startMs: 0, durationMs: 120, depth: 0, state: 'done' },
  { id: 'ver', label: 'Ver', startMs: 140, durationMs: 200, depth: 1, state: 'running' },
  { id: 'dizer', label: 'Dizer', startMs: 360, durationMs: 220, depth: 1, state: 'pending' },
];

/** O eixo da janela que recorta — mais curto que o rastro que ela mostra. */
export const CLIPPED_TOTAL_MS = 600;

/**
 * Um rastro que não cabe no eixo declarado.
 *
 * É a JANELA: quem mostra o meio de um rastro longo declara um eixo menor que
 * ele, e os trechos das pontas são recortados. Não é erro — é o desenho de
 * quem mostra um pedaço —, e a linha recortada avisa em palavras que o trecho
 * continua fora.
 */
export const CLIPPED_SPANS: readonly TraceSpan[] = [
  { id: 'anterior', label: 'Vinha de antes da janela', startMs: -400, durationMs: 700, depth: 0, state: 'done' },
  { id: 'dentro', label: 'Cabe inteiro na janela', startMs: 200, durationMs: 150, depth: 1, state: 'done' },
  { id: 'seguinte', label: 'Segue depois da janela', startMs: 420, durationMs: 900, depth: 1, state: 'running' },
];

/**
 * O id do trecho que atravessa o fim da janela.
 *
 * Existe como constante, e não como cadeia escrita na story, porque a
 * asserção e o dado que a produz não podem divergir: escrito à mão, o
 * seletor já apontou para um id inexistente depois de uma varredura de
 * renomeação, e a story passou a LANÇAR em vez de reprovar — defeito que
 * nenhum build alcança, porque mora dentro de uma string.
 */
export const CLIPPED_SPAN_ID = 'seguinte';

/** O id do trecho que cabe inteiro, e serve de contraprova ao recorte. */
export const UNCLIPPED_SPAN_ID = 'dentro';

/** O que uma story desta stack devolve: os membros e o template que os liga. */
export interface TraceWaterfallStory {
  props: {
    spans: readonly TraceSpan[];
    totalMs: number;
    status: RunStatus;
    labels: TraceWaterfallLabels;
    hostClass: string;
    testid: string | null;
  };
  template: string;
}

/**
 * O invólucro das demonstrações: um `div` com a peça dentro.
 *
 * MORA AQUI, e não em cada arquivo de story, porque os três arquivos ligariam
 * o mesmo template. Duas cópias do mesmo nome com corpos diferentes é o
 * defeito que `fixture_duplicada_entre_stories` existe para pegar: corrigir
 * uma não corrige a outra.
 *
 * O invólucro também é o que dá à asserção um elemento a que apontar quando
 * não há trecho nenhum — a peça, ali, não desenha nada por dentro.
 */
export function mountTraceWaterfall(options: {
  spans: readonly TraceSpan[];
  totalMs: number;
  status?: RunStatus;
  /** Teto de largura, quando o assunto da story é a rolagem. */
  hostClass?: string;
  testid?: string;
}): TraceWaterfallStory {
  return {
    props: {
      spans: options.spans,
      totalMs: options.totalMs,
      status: options.status ?? 'running',
      labels: traceWaterfallLabels(),
      hostClass: options.hostClass ?? '',
      testid: options.testid ?? null,
    },
    template: `
      <div [class]="hostClass" [attr.data-testid]="testid">
        <div
          ndsTraceWaterfall
          [spans]="spans"
          [totalMs]="totalMs"
          [status]="status"
          [labels]="labels"
        ></div>
      </div>
    `,
  };
}
