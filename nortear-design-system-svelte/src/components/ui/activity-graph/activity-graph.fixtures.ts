/**
 * Andaime das demonstrações da grade de atividade.
 *
 * Existe pelo mesmo motivo do andaime da cascata de trechos: num
 * `*.stories.ts` todo export nomeado vira story, então o andaime não pode
 * morar lá, e a saída fácil — copiar a constante para cada arquivo — produz
 * cópias que divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase do total, os nomes dos meses e dos dias, e
 * a palavra de cada nível. A ATIVIDADE, a JANELA e a ESCALA de referência saem
 * de `@shared/primitives/activity-graph-examples`, porque não são idioma: a
 * força de cada casa é a mesma nos três, e escrever contagens diferentes por
 * idioma faria as fotos mostrarem mapas diferentes.
 *
 * O que fica AQUI são as janelas e os dias que existem só para as fotos de
 * borda — a escala inteira, o ano largo, o dia declarado fora da janela. Eles
 * não estão no compartilhado porque não são o exemplo da peça: são o caso que
 * cada foto precisa exercitar, e cada stack fotografa os seus.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar
 * o runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import activityGraphTranslations from '@shared/content/activity-graph/translations.json';
import type { ActivityDay } from '@shared/primitives/chat-protocol';
import type { ActivityGraphLabels } from './index';

/** As chaves dos doze meses, como o JSON as declara. */
type MonthKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12';
/** As chaves dos sete dias da semana, com zero no domingo. */
type WeekdayKey = 'd0' | 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6';
/** As chaves dos cinco níveis do exemplo — uma a mais que os degraus. */
type LevelKey = 'l0' | 'l1' | 'l2' | 'l3' | 'l4';

/**
 * A forma do JSON, que não é a forma de `ActivityGraphLabels`: meses, dias e
 * níveis chegam por CHAVE nomeada — assim o rótulo do escritor bate com o
 * índice do calendário sem ninguém contar posição —, e a peça quer ARRAY. A
 * conversão mora em `activityGraphLabelsFor`.
 */
type RawActivityGraphLabels = {
  region: string;
  total: string;
  dateFormat: string;
  none: string;
  one: string;
  many: string;
  legendLess: string;
  legendMore: string;
  months: {
    short: Record<MonthKey, string>;
    long: Record<MonthKey, string>;
  };
  weekdays: Record<WeekdayKey, string>;
  levels: Record<LevelKey, string>;
};

/**
 * A anotação de tipo é o PORTÃO: a seção é lida em CADA idioma, então rótulo
 * que sumir do JSON — ou idioma que ficar para trás — reprova no type-check, e
 * não na tela. Uma camada que rola sem nome deixaria quem chega ali por
 * teclado numa parada anônima, que é exatamente o que a obrigatoriedade de
 * `region` existe para não acontecer.
 */
const CONTENT: Record<Locale, { labels: RawActivityGraphLabels }> = activityGraphTranslations;

/** Quantos níveis a escala do exemplo tem, contando o vazio. */
const LEVEL_WORDS = 5;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function activityGraphLabelsFor(target: Locale): ActivityGraphLabels {
  const raw = CONTENT[target].labels;
  return {
    region: raw.region,
    total: raw.total,
    dateFormat: raw.dateFormat,
    monthsShort: Array.from({ length: 12 }, (_, i) => raw.months.short[`m${i + 1}` as MonthKey]),
    monthsLong: Array.from({ length: 12 }, (_, i) => raw.months.long[`m${i + 1}` as MonthKey]),
    weekdaysShort: Array.from({ length: 7 }, (_, i) => raw.weekdays[`d${i}` as WeekdayKey]),
    none: raw.none,
    one: raw.one,
    many: raw.many,
    // Uma palavra a mais que os degraus: a do nível vazio.
    levels: Array.from({ length: LEVEL_WORDS }, (_, i) => raw.levels[`l${i}` as LevelKey]),
    legendLess: raw.legendLess,
    legendMore: raw.legendMore,
  };
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não
 * são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function activityGraphLabels(): ActivityGraphLabels {
  return activityGraphLabelsFor(get(locale));
}

/**
 * A janela larga: um ano inteiro, que é o que faz a camada rolar.
 *
 * É o que a fonte absorvida não sabia fazer: lá a janela é fixa nos 365 dias
 * que terminam hoje, e não há como pedir o ano anterior.
 */
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
