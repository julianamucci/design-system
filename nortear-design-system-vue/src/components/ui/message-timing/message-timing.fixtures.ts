/**
 * Andaime das demonstrações do tempo da resposta.
 *
 * Existe pelo mesmo motivo do andaime das quatro medições irmãs: num
 * `*.stories.ts` todo export nomeado vira story, então o andaime não pode morar
 * lá, e a saída fácil — copiar a constante para cada arquivo — produz cópias
 * que divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * NÚMEROS são dado de exemplo e ficam iguais nos três idiomas: traduzi-los faria
 * as stories fotografarem medições diferentes conforme o idioma da foto.
 *
 * O QUE ESTE ARQUIVO FAZ E O COMPONENTE NÃO: ESCREVER OS NÚMEROS. É de
 * propósito, e é a demonstração do contrato — aqui o andaime está no papel de
 * quem mede, e é quem mede que conhece o idioma. Um formatador de duração mora
 * nesta camada em qualquer produto de verdade; o que não pode é morar dentro do
 * componente, onde decidiria idioma em cinco stacks de uma vez.
 *
 * A prova disso se vê trocando o idioma da página: a mesma medição sai
 * `1,24 s` ou `1.24 sec`, e o separador decimal troca com quem lê. Nenhuma
 * heurística de componente acerta os três.
 *
 * E POR QUE NÃO HÁ CONTA NENHUMA AQUI, nem em `token-budget.ts`: velocidade é
 * token dividido por segundo, e a divisão já foi feita por quem cronometrou. O
 * andaime recebe as quatro medidas prontas e só as ESCREVE — não há limiar para
 * comparar, não há fração para tirar e não há arredondamento a decidir, porque
 * quantas casas cada número mostra é do formatador do idioma.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import messageTimingTranslations from '@shared/content/message-timing/translations.json';
import type { MessageTimingLabels, MessageTimingStat } from './MessageTiming.vue';

/**
 * O texto da peça, por idioma.
 *
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida em CADA idioma, então
 * rótulo que sumir do JSON — ou idioma que ficar para trás — reprova no
 * type-check, e não na tela.
 *
 * `MessageTimingLabels` cobre só o que a peça recebe; o resto desta seção é do
 * ANDAIME, e por isso está declarado aqui e não no componente: a abreviatura da
 * unidade de velocidade e o nome de cada medida são de quem mede, e a peça
 * fixaria QUAIS medições existem se os conhecesse.
 */
interface MessageTimingContent {
  labels: MessageTimingLabels & {
    speedUnit: string;
    stats: {
      firstToken: string;
      total: string;
      speed: string;
      chunks: string;
    };
  };
}

const CONTENT: Record<Locale, MessageTimingContent> = messageTimingTranslations;

/** As duas unidades de tempo que estas medições usam. */
type DurationUnit = 'millisecond' | 'second';

/**
 * Uma duração escrita, num idioma.
 *
 * Monta o formatador A CADA CHAMADA, e não uma vez no topo do módulo: a docs
 * page se redesenha quando o idioma muda, e um formatador guardado no topo
 * continuaria escrevendo no idioma em que a página abriu. Mesma mecânica do
 * horizonte escrito da faixa de cota.
 *
 * A UNIDADE VEM DE QUEM MEDIU, e não de um limiar daqui. Seria fácil escrever
 * "abaixo de um segundo mostre milissegundos", e seria uma regra a mais para
 * cinco stacks discordarem sobre — quem cronometrou já sabe em que unidade a
 * medida faz sentido, e é ela que passa. Quantas casas cada número mostra é do
 * formatador do idioma, e não de um arredondamento escrito à mão.
 */
export function durationTextFor(target: Locale, value: number, unit: DurationUnit): string {
  return new Intl.NumberFormat(target, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Uma taxa escrita, num idioma.
 *
 * O NÚMERO é do formatador; a UNIDADE vem dos rótulos, porque token por segundo
 * não é uma das unidades que o navegador conhece e a abreviatura é interface.
 * É a mesma divisão que a peça do custo faz entre a quantia e a palavra que a
 * liga ao teto.
 */
export function speedTextFor(target: Locale, value: number): string {
  const number = new Intl.NumberFormat(target, { maximumFractionDigits: 1 }).format(value);
  return `${number} ${CONTENT[target].labels.speedUnit}`;
}

/** Uma contagem escrita, num idioma — separador de milhar incluído. */
export function countTextFor(target: Locale, value: number): string {
  return new Intl.NumberFormat(target).format(value);
}

/**
 * O nome da medição, e a palavra que diz que ela ainda não acabou — num idioma.
 *
 * Sai estreitado nos dois campos que a peça recebe, e não a seção inteira: o
 * resto de `labels` é do andaime, e passá-lo adiante ensinaria que a peça
 * conhece o nome das medidas.
 */
export function messageTimingLabelsFor(target: Locale): MessageTimingLabels {
  const { title, measuring } = CONTENT[target].labels;
  return { title, measuring };
}

/**
 * Os rótulos da linha fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a peça desenha.
 */
export function messageTimingLabels(): MessageTimingLabels {
  return messageTimingLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da linha no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a peça no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useMessageTimingLabels(): ComputedRef<MessageTimingLabels> {
  const { locale } = useTranslation(messageTimingTranslations);
  return computed(() => messageTimingLabelsFor(locale.value as Locale));
}

/** Os exemplos que a peça desenha diferente. */
export type MessageTimingCase = 'settled' | 'measuring' | 'partial' | 'none';

/**
 * As quatro medidas do exemplo, em número puro.
 *
 * Guardadas SEM formato para que a foto troque de idioma junto com a página: se
 * as cadeias estivessem aqui prontas, a demonstração escreveria em português
 * dentro de uma página em espanhol e ninguém repararia.
 */
const MEASURE = {
  firstToken: 420,
  total: 1.24,
  speed: 38.4,
  chunks: 42,
  /** O total enquanto a resposta ainda corre — menor que o final, de propósito. */
  totalSoFar: 0.86,
  /** Os pedaços já recebidos enquanto a resposta ainda corre. */
  chunksSoFar: 28,
} as const;

/**
 * As medições de cada exemplo, na ordem em que quem mediu as produziu.
 *
 * A ORDEM É A MESMA NOS QUATRO, e isso é o assunto de uma das stories: a peça
 * não reordena nada, e é essa estabilidade que permite comparar a linha de uma
 * resposta com a da seguinte sem reler os termos.
 *
 * Os exemplos são escolhidos para cair EXATAMENTE onde a peça decide algo: um
 * conhece as quatro medidas, um ainda está medindo e não conhece a velocidade,
 * um conhece só duas, e um não conhece nenhuma. Exemplo que evita a borda é
 * exemplo que nunca mostra a regra.
 */
export function statsFor(target: Locale, name: MessageTimingCase): MessageTimingStat[] {
  const words = CONTENT[target].labels.stats;
  const firstToken = {
    label: words.firstToken,
    value: durationTextFor(target, MEASURE.firstToken, 'millisecond'),
  };

  if (name === 'none') return [];

  if (name === 'partial') {
    return [
      firstToken,
      { label: words.total, value: durationTextFor(target, MEASURE.total, 'second') },
    ];
  }

  if (name === 'measuring') {
    return [
      firstToken,
      { label: words.total, value: durationTextFor(target, MEASURE.totalSoFar, 'second') },
      { label: words.chunks, value: countTextFor(target, MEASURE.chunksSoFar) },
    ];
  }

  return [
    firstToken,
    { label: words.total, value: durationTextFor(target, MEASURE.total, 'second') },
    { label: words.speed, value: speedTextFor(target, MEASURE.speed) },
    { label: words.chunks, value: countTextFor(target, MEASURE.chunks) },
  ];
}

/** As medições daquele exemplo, fora de um componente — `play` não é render. */
export function statsOf(name: MessageTimingCase): MessageTimingStat[] {
  return statsFor(useI18nStore().locale, name);
}

/** As medições dos quatro exemplos no idioma corrente, prontas para a peça. */
export function useMessageTimingStats(): ComputedRef<Record<MessageTimingCase, MessageTimingStat[]>> {
  const { locale } = useTranslation(messageTimingTranslations);
  return computed(() => {
    const target = locale.value as Locale;
    return {
      settled: statsFor(target, 'settled'),
      measuring: statsFor(target, 'measuring'),
      partial: statsFor(target, 'partial'),
      none: statsFor(target, 'none'),
    };
  });
}

/**
 * As medidas da medição encerrada, cortadas em quantas o exemplo conhece.
 *
 * Recebe um GETTER, e não um número: os args do Playground trocam com o painel
 * aberto, e um número lido uma vez congelaria a foto na contagem com que a
 * story abriu. O corte sai da MESMA lista, e não de quatro listas diferentes: é
 * assim que a story prova que a ordem é preservada em qualquer contagem.
 */
export function useSettledStatsSlice(count: () => number): ComputedRef<MessageTimingStat[]> {
  const { locale } = useTranslation(messageTimingTranslations);
  return computed(() => statsFor(locale.value as Locale, 'settled').slice(0, count()));
}

/** A medição daquele exemplo ainda está andando? */
export function isMeasuring(name: MessageTimingCase): boolean {
  return name === 'measuring';
}

/**
 * O rótulo do gatilho da forma compacta, montado por QUEM CONSOME.
 *
 * Ele nasce aqui e não dentro da peça porque a forma compacta da fonte é uma
 * COMPOSIÇÃO — um controle de verdade com uma dica de ferramenta —, e a peça
 * não ganha camada flutuante nem a política de foco que vem com ela (decisão 8
 * da folha). O rótulo é o número que resume a medição, e ele chega escrito como
 * todos os outros.
 */
export function messageTimingTriggerLabelFor(target: Locale): string {
  return durationTextFor(target, MEASURE.total, 'second');
}

/** O mesmo rótulo, fora de um componente — `play` não é render. */
export function messageTimingTriggerLabel(): string {
  return messageTimingTriggerLabelFor(useI18nStore().locale);
}

/** E o mesmo rótulo no idioma corrente, para o render. */
export function useMessageTimingTriggerLabel(): ComputedRef<string> {
  const { locale } = useTranslation(messageTimingTranslations);
  return computed(() => messageTimingTriggerLabelFor(locale.value as Locale));
}
