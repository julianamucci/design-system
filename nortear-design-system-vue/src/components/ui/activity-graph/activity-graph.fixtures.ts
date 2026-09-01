/**
 * Andaime das demonstrações da grade de atividade.
 *
 * Existe pelo mesmo motivo do andaime das duas irmãs desta família: num
 * `*.stories.ts` todo export nomeado vira story, então o andaime não pode morar
 * lá, e a saída fácil — copiar a montagem para cada arquivo — produz cópias que
 * divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase do total, os nomes dos meses e dos dias, e a
 * palavra de cada nível. A ATIVIDADE, a JANELA e a ESCALA saem de
 * `@shared/primitives/activity-graph-examples`, porque não são idioma: a força
 * de cada casa é a mesma nos três, e escrever contagens diferentes por idioma
 * faria as fotos mostrarem mapas diferentes.
 *
 * A JANELA MORA NO COMPARTILHADO POR UM MOTIVO A MAIS, e ele é o assunto da
 * peça: presa ao relógio, a fotografia mudaria sozinha todo dia, e comparar duas
 * stacks deixaria de ser possível.
 *
 * O que mora AQUI, e não no compartilhado, são os rastros que existem só para
 * as fotos de borda desta stack — a janela larga, a semana da escala inteira e
 * o dia declarado fora do período.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import activityGraphTranslations from '@shared/content/activity-graph/translations.json';
import type { ActivityDay } from '@shared/primitives/chat-protocol';
import type { ActivityGraphLabels } from './ActivityGraph.vue';

/**
 * A forma crua da seção `labels` no JSON compartilhado.
 *
 * Ela NÃO é `ActivityGraphLabels`: meses, dias da semana e níveis chegam
 * agrupados por índice (`m1`..`m12`, `d0`..`d6`, `l0`..`l4`), porque é assim
 * que o texto de interface se organiza por idioma. A conversão para as listas
 * que a peça consome é o que `activityGraphLabelsFor` faz — e é ela, não uma
 * anotação de tipo, que é o portão: chave que sumir do JSON vira índice
 * indefinido no array, e a peça imprimiria uma casa sem palavra de nível.
 */
type ActivityGraphContent = {
  labels: {
    region: string;
    total: string;
    dateFormat: string;
    none: string;
    one: string;
    many: string;
    legendLess: string;
    legendMore: string;
    months: { short: Record<string, string>; long: Record<string, string> };
    weekdays: Record<string, string>;
    levels: Record<string, string>;
  };
};

const CONTENT: Record<Locale, ActivityGraphContent> =
  activityGraphTranslations as unknown as Record<Locale, ActivityGraphContent>;

/** Quantos níveis a escala do exemplo tem, contando o vazio. */
const LEVEL_WORDS = 5;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function activityGraphLabelsFor(target: Locale): ActivityGraphLabels {
  const labels = CONTENT[target].labels;
  return {
    region: labels.region,
    total: labels.total,
    dateFormat: labels.dateFormat,
    monthsShort: Array.from({ length: 12 }, (_, i) => labels.months.short[`m${i + 1}`]),
    monthsLong: Array.from({ length: 12 }, (_, i) => labels.months.long[`m${i + 1}`]),
    weekdaysShort: Array.from({ length: 7 }, (_, i) => labels.weekdays[`d${i}`]),
    none: labels.none,
    one: labels.one,
    many: labels.many,
    // Uma palavra a mais que os degraus: a do nível vazio.
    levels: Array.from({ length: LEVEL_WORDS }, (_, i) => labels.levels[`l${i}`]),
    legendLess: labels.legendLess,
    legendMore: labels.legendMore,
  };
}

/**
 * Os rótulos da peça fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a
 * play procura é sempre o que a peça desenha.
 */
export function activityGraphLabels(): ActivityGraphLabels {
  return activityGraphLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da peça no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useActivityGraphLabels(): ComputedRef<ActivityGraphLabels> {
  const { locale } = useTranslation(activityGraphTranslations);
  return computed(() => activityGraphLabelsFor(locale.value as Locale));
}

/** A janela larga: um ano inteiro, que é o que faz a camada rolar. */
export const WIDE_START = '2025-04-01';
export const WIDE_END = '2026-03-31';

/**
 * Um dia de cada nível da escala, para a fotografia dos estados.
 *
 * A janela é de uma semana, e as contagens são escolhidas para cair uma em cada
 * degrau: é a única forma de fotografar a escala inteira lado a lado sem
 * depender de onde os picos do trimestre caíram.
 */
export const SCALE_START = '2026-03-01';
export const SCALE_END = '2026-03-07';

/**
 * As contagens que cobrem a escala inteira, uma por nível.
 *
 * Escritas contra os degraus do exemplo — nenhum número aqui é solto: cada um é
 * o menor que alcança o seu degrau, e é isso que faz esta grade mostrar os cinco
 * níveis e não quatro.
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
 * Existe como constante, e não como cadeia escrita na story, porque a asserção e
 * o dado que a produz não podem divergir: escrito à mão, o seletor já apontou
 * para um valor inexistente depois de uma varredura de renomeação, e a story
 * passou a LANÇAR em vez de reprovar — defeito que nenhum build alcança, porque
 * mora dentro de uma string.
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
