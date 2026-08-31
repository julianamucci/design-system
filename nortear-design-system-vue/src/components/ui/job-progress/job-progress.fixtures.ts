/**
 * Andaime das demonstrações do andamento de trabalho longo.
 *
 * Existe pelo mesmo motivo do andaime do estado da execução: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — e os
 * moldes da conta junto com eles, porque a palavra que liga os dois números é
 * do idioma. Os NÚMEROS são dado de exemplo e ficam iguais nos três idiomas: o
 * que muda por idioma é o separador de milhar, que a própria peça aplica, e não
 * a quantidade — números diferentes por foto fariam as stories fotografarem
 * barras de comprimentos diferentes.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import type { JobCount } from '@shared/primitives/chat-protocol';
import jobTranslations from '@shared/content/job-progress/translations.json';
import type { JobProgressLabels } from './JobProgress.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `JobProgressLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela.
 *
 * É também o que faz o mapa de estados acompanhar o vocabulário compartilhado
 * sem que ninguém precise lembrar: `status` é `Record<RunStatus, string>`, e um
 * estado novo em `RUN_STATUSES` reprova a compilação aqui em vez de desenhar
 * uma linha em branco que ninguém repara.
 *
 * O `job` entra na anotação porque ele mora na MESMA seção do conteúdo
 * compartilhado, e não porque a peça o receba junto: ele é uma prop separada —
 * o que está sendo feito —, e os rótulos são o resto.
 */
const CONTENT: Record<Locale, { labels: JobProgressLabels & { job: string } }> =
  jobTranslations;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function jobProgressLabelsFor(target: Locale): JobProgressLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a peça desenha.
 */
export function jobProgressLabels(): JobProgressLabels {
  return jobProgressLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da peça no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useJobProgressLabels(): ComputedRef<JobProgressLabels> {
  const { locale } = useTranslation(jobTranslations);
  return computed(() => jobProgressLabelsFor(locale.value as Locale));
}

/** O que está sendo feito nas demonstrações, num idioma. */
export function jobLabelFor(target: Locale): string {
  return CONTENT[target].labels.job;
}

/** O que está sendo feito, fora de um componente — a forma que a `play` usa. */
export function jobLabel(): string {
  return jobLabelFor(useI18nStore().locale);
}

/** O que está sendo feito, no idioma corrente. */
export function useJobLabel(): ComputedRef<string> {
  const { locale } = useTranslation(jobTranslations);
  return computed(() => jobLabelFor(locale.value as Locale));
}

/**
 * A conta de exemplo, a mesma em toda foto.
 *
 * Uma só, com total conhecido, e é ela que as stories dos cinco estados
 * recebem de propósito: assim a diferença entre as fotos é o estado, e não o
 * número. O que a peça faz com a MESMA conta em cada estado é justamente o
 * assunto — concluído desenha cheio, parado congela, em andamento mostra a
 * fração.
 */
export const JOB_COUNT: JobCount = { done: 1240, total: 5000 };

/**
 * A conta sem total conhecido — o caso que a peça existe para não errar.
 *
 * Quem varre um repositório sabe quantos arquivos abriu, e não quantos vai
 * abrir. Mesmo número já feito da conta acima, para que a única diferença entre
 * as duas fotos seja a ausência do denominador.
 */
export const JOB_COUNT_WITHOUT_TOTAL: JobCount = { done: 1240 };
