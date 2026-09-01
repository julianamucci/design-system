/**
 * Andaime das demonstrações da grade de atividade.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase do total, os nomes dos meses e dos dias, e
 * a palavra de cada nível. A ATIVIDADE, a JANELA e a ESCALA saem de
 * `@shared/primitives/activity-graph-examples`, porque não são idioma: a
 * força de cada casa é a mesma nas cinco stacks, e escrever contagens
 * diferentes por idioma faria as fotos mostrarem mapas diferentes.
 *
 * OS DEMAIS CASOS (escala inteira, semana larga) não moram no primitivo
 * compartilhado — só a demonstração os usa, e cada stack os declara pelo
 * mesmo motivo das duas irmãs: são dado de fotografia, não vocabulário.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e
 * arrastar o runner para dentro dela levaria o pacote junto.
 */
import { useTranslation } from '@/lib/i18n';
import activityGraphTranslations from '@shared/content/activity-graph/translations.json';
import type { ActivityDay, RunStatus } from '@shared/primitives/chat-protocol';
import type { ActivityGraphLabels } from './activity-graph';

const { t } = useTranslation(activityGraphTranslations as Record<string, unknown>);

/** Quantos níveis a escala do exemplo tem, contando o vazio. */
const LEVEL_WORDS = 5;

/** O nome da camada, os moldes, os nomes de mês e de dia, e as palavras de nível. */
export function activityGraphLabels(): ActivityGraphLabels {
  return {
    region: t('labels.region'),
    total: t('labels.total'),
    dateFormat: t('labels.dateFormat'),
    monthsShort: Array.from({ length: 12 }, (_, i) => t(`labels.months.short.m${i + 1}`)),
    monthsLong: Array.from({ length: 12 }, (_, i) => t(`labels.months.long.m${i + 1}`)),
    weekdaysShort: Array.from({ length: 7 }, (_, i) => t(`labels.weekdays.d${i}`)),
    none: t('labels.none'),
    one: t('labels.one'),
    many: t('labels.many'),
    // Uma palavra a mais que os degraus: a do nível vazio.
    levels: Array.from({ length: LEVEL_WORDS }, (_, i) => t(`labels.levels.l${i}`)),
    legendLess: t('labels.legendLess'),
    legendMore: t('labels.legendMore'),
  };
}

/** A janela larga: um ano inteiro, que é o que faz a camada rolar. */
export const WIDE_START = '2025-04-01';
export const WIDE_END = '2026-03-31';

/**
 * Um dia de cada nível da escala, para a fotografia dos estados.
 *
 * A janela é de uma semana, e as contagens são escolhidas para cair uma em
 * cada degrau: é a única forma de fotografar a escala inteira lado a lado sem
 * depender de onde os picos do trimestre caíram.
 */
export const SCALE_START = '2026-03-01';
export const SCALE_END = '2026-03-07';

/**
 * As contagens que cobrem a escala inteira, uma por nível.
 *
 * Escritas contra os degraus do exemplo — nenhum número aqui é solto: cada um
 * é o menor que alcança o seu degrau, e é isso que faz esta grade mostrar os
 * cinco níveis e não quatro.
 */
export const SCALE_DAYS: readonly ActivityDay[] = [
  { date: '2026-03-01', count: 0 },
  { date: '2026-03-02', count: 1 },
  { date: '2026-03-03', count: 4 },
  { date: '2026-03-04', count: 8 },
  { date: '2026-03-05', count: 13 },
  { date: '2026-03-06', count: 0 },
  { date: '2026-03-07', count: 0 },
];

/**
 * O dia da grade da escala que alcança o degrau mais alto.
 *
 * Existe como constante, e não como cadeia escrita na story, porque a
 * asserção e o dado que a produz não podem divergir: escrito à mão, o
 * seletor já apontou para um valor inexistente depois de uma varredura de
 * renomeação, e a story passou a LANÇAR em vez de reprovar — defeito que
 * nenhum build alcança, porque mora dentro de uma string.
 */
export const SCALE_TOP_DATE = '2026-03-05';

/** O dia da mesma grade em que nada aconteceu, e serve de contraprova. */
export const SCALE_EMPTY_DATE = '2026-03-01';

/**
 * Um dia declarado FORA da janela.
 *
 * Ele não é erro: é quem passou o ano inteiro e pediu um trimestre. A story
 * afirma que ele não é desenhado e não entra no total.
 */
export const OUTSIDE_DAY: ActivityDay = { date: '2025-12-31', count: 99 };

/** O que uma story desta stack devolve: os membros e o template que os liga. */
export interface ActivityGraphStory {
  props: {
    days: readonly ActivityDay[];
    start: string;
    end: string;
    thresholds: readonly number[];
    weekStart: number;
    status: RunStatus;
    labels: ActivityGraphLabels;
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
 * não há grade nenhuma — a peça, ali, não desenha nada por dentro.
 */
export function mountActivityGraph(options: {
  days: readonly ActivityDay[];
  start: string;
  end: string;
  thresholds: readonly number[];
  weekStart?: number;
  status?: RunStatus;
  /** Teto de largura, quando o assunto da story é a rolagem. */
  hostClass?: string;
  testid?: string;
}): ActivityGraphStory {
  return {
    props: {
      days: options.days,
      start: options.start,
      end: options.end,
      thresholds: options.thresholds,
      weekStart: options.weekStart ?? 0,
      status: options.status ?? 'complete',
      labels: activityGraphLabels(),
      hostClass: options.hostClass ?? '',
      testid: options.testid ?? null,
    },
    template: `
      <div [class]="hostClass" [attr.data-testid]="testid">
        <div
          ndsActivityGraph
          [days]="days"
          [start]="start"
          [end]="end"
          [thresholds]="thresholds"
          [weekStart]="weekStart"
          [status]="status"
          [labels]="labels"
        ></div>
      </div>
    `,
  };
}
