/**
 * Andaime das demonstrações do andamento de trabalho longo — um construtor por
 * caso.
 *
 * Existe pelo mesmo motivo do andaime do estado da ligação: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — e os
 * moldes da conta junto com eles, porque a palavra que liga os dois números é do
 * idioma. Os NÚMEROS são dado de exemplo e ficam iguais nos três idiomas: o que
 * muda por idioma é o separador de milhar, que a própria peça aplica, e não a
 * quantidade — números diferentes por foto fariam as stories fotografarem barras
 * de comprimentos diferentes.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import jobTranslations from '@shared/content/job-progress/translations.json';
import type { JobCount } from '@shared/primitives/chat-protocol';
import type { JobProgressLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `JobProgressLabels` em CADA idioma, então rótulo que sumir do JSON — ou idioma
 * que ficar para trás — reprova no type-check, e não na tela. Um estado sem
 * palavra deixaria a peça distinguindo o trabalho só pela barra, que é
 * exatamente o que a decisão 2 da folha proíbe.
 *
 * O `job` entra no tipo porque ele mora na mesma seção do conteúdo: ele não é
 * rótulo de estado, é o que está sendo feito — e é também o nome pelo qual a
 * barra é anunciada.
 */
const CONTENT: Record<Locale, { labels: JobProgressLabels & { job: string } }> = jobTranslations;

/** O que está sendo feito, num idioma — a forma para quem já tem o locale em mãos. */
export function jobLabelFor(target: Locale): string {
  return CONTENT[target].labels.job;
}

/** O que está sendo feito nas demonstrações. */
export function jobLabel(): string {
  return jobLabelFor(get(locale));
}

/**
 * A palavra de cada estado, os dois moldes da conta e o rótulo da ação onde ela
 * existe — num idioma.
 */
export function jobProgressLabelsFor(target: Locale): JobProgressLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não são
 * render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function jobProgressLabels(): JobProgressLabels {
  return jobProgressLabelsFor(get(locale));
}

/**
 * A conta de exemplo, a mesma em toda foto.
 *
 * Uma só, com total conhecido, e é ela que as stories dos cinco estados recebem
 * de propósito: assim a diferença entre as fotos é o estado, e não o número. O
 * que a peça faz com a MESMA conta em cada estado é justamente o assunto —
 * concluído desenha cheio, parado congela, em andamento mostra a fração.
 */
export const JOB_COUNT: JobCount = { done: 1240, total: 5000 };

/**
 * A conta sem total conhecido — o que a peça existe para não errar.
 *
 * Quem varre um repositório sabe quantos arquivos abriu, e não quantos vai
 * abrir. Mesmo número já feito da conta acima, para que a única diferença entre
 * as duas fotos seja a ausência do denominador.
 */
export const JOB_COUNT_WITHOUT_TOTAL: JobCount = { done: 1240 };
