/**
 * Andaime das demonstrações da cascata de trechos.
 *
 * Existe pelo mesmo motivo do andaime do grafo de fluxo: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a
 * saída fácil — copiar a constante para cada arquivo — produz cópias que
 * divergem sem nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface — o
 * nome da camada que rola, a frase da régua, o molde da leitura e a palavra
 * de cada estado. O RASTRO DE REFERÊNCIA e o EIXO saem de
 * `@shared/primitives/trace-waterfall-examples`, porque não são idioma: a
 * posição das barras é a mesma nos três, e escrever milissegundos diferentes
 * por idioma faria as fotos mostrarem cascatas diferentes.
 *
 * O que fica AQUI são os rastros que existem só para as fotos de borda — o
 * largo, o de rótulos longos, o de rótulos curtos e o da janela que recorta.
 * Eles não estão no compartilhado porque não são o exemplo da peça: são o
 * caso que cada foto precisa exercitar, e cada stack fotografa os seus.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar
 * o runner para dentro dela levaria o pacote junto.
 */
import { get } from 'svelte/store';
import { locale, type Locale } from '@/lib/i18n';
import traceWaterfallTranslations from '@shared/content/trace-waterfall/translations.json';
import type { TraceSpan } from '@shared/primitives/chat-protocol';
import type { TraceWaterfallLabels } from './index';

/**
 * A anotação de tipo é o PORTÃO: a seção é lida em CADA idioma, então rótulo
 * que sumir do JSON — ou idioma que ficar para trás — reprova no type-check, e
 * não na tela. Uma camada que rola sem nome deixaria quem chega ali por
 * teclado numa parada anônima, que é exatamente o que a obrigatoriedade de
 * `region` existe para não acontecer.
 */
const CONTENT: Record<Locale, { labels: TraceWaterfallLabels }> = traceWaterfallTranslations;

/** Os rótulos da peça num idioma — a forma para quem já tem o locale em mãos. */
export function traceWaterfallLabelsFor(target: Locale): TraceWaterfallLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da peça fora de um componente — `props` de story e `play` não
 * são render.
 *
 * Lê a MESMA store de locale que o `useTranslation` da página, então o rótulo
 * que a play procura é sempre o que a peça desenha.
 */
export function traceWaterfallLabels(): TraceWaterfallLabels {
  return traceWaterfallLabelsFor(get(locale));
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
 * casa de grade cuja largura é a do rótulo; aqui quebrar faria a linha
 * crescer em altura e desalinhar a régua da vizinha.
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
