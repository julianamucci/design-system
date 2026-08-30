/**
 * Andaime das demonstrações do rascunho recuperado — os rótulos e os exemplos.
 *
 * Existe pelo mesmo motivo do `composer-voice.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface.
 *
 * O RASCUNHO e o CARIMBO, não: eles são a FALA de quem escreveu, e a guideline
 * 17 §3.3 já decidiu que exemplo de conversa não se traduz — o que é traduzido
 * são os rótulos da interface. Também é o que a foto do Chromatic compara: um
 * texto diferente por idioma faria as cinco stacks fotografarem faixas de
 * alturas diferentes, e a divergência apareceria como diferença de layout que
 * ninguém consegue atribuir a nada.
 *
 * Os rótulos do CAMPO saem de `composer.fixtures` — quem monta a story os
 * importa de lá. Reexportá-los aqui criaria dois caminhos para a mesma coisa, e
 * é assim que duas cópias começam a divergir sem sinal nenhum. As peças irmãs
 * desta pasta fazem o mesmo.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import draftTranslations from '@shared/content/draft-restore/translations.json';
import type { DraftRestoreLabels } from './DraftRestore.vue';

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `DraftRestoreLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela. Um
 * controle sem nome seria um verbo sozinho para quem chega nele por tabulação.
 */
const CONTENT: Record<Locale, { labels: DraftRestoreLabels }> = draftTranslations;

/** Os rótulos da faixa num idioma — a forma para quem já tem o locale em mãos. */
export function draftLabelsFor(target: Locale): DraftRestoreLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos da faixa fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que a faixa desenha.
 */
export function draftLabels(): DraftRestoreLabels {
  return draftLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos da faixa no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria a faixa no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useDraftLabels(): ComputedRef<DraftRestoreLabels> {
  const { locale } = useTranslation(draftTranslations);
  return computed(() => draftLabelsFor(locale.value as Locale));
}

/**
 * O rascunho de exemplo — curto o bastante para caber nas duas linhas.
 *
 * Ele existe para provar o caso comum: a prévia inteira aparece, e não há
 * corte nenhum para confundir com o do desenho.
 */
export const SAMPLE_DRAFT =
  'Sobre o orçamento de agosto: separei os três itens que estouraram.';

/**
 * O rascunho longo — o que a folha corta.
 *
 * É o único que prova a decisão 2 da folha: o texto inteiro continua no
 * documento, e quem corta é `line-clamp`. Um exemplo curto passaria verde numa
 * implementação que cortasse o texto em código, porque não haveria o que
 * cortar.
 */
export const SAMPLE_DRAFT_LONG =
  'Sobre o orçamento de agosto: separei os três itens que estouraram e queria ' +
  'entender se o desvio veio do câmbio ou do contrato novo de infraestrutura. ' +
  'Também vale olhar a linha de viagens, que dobrou sem nenhuma aprovação nova, ' +
  'e a de licenças, que subiu junto com o número de pessoas na equipe. Se der, ' +
  'traga a comparação com julho lado a lado, porque a diferença mês a mês diz ' +
  'mais do que o total do trimestre.';

/**
 * O carimbo de exemplo, JÁ ESCRITO — quem formata é quem consome.
 *
 * Ele é dado de exemplo, como o rascunho, e pela mesma razão: o componente não
 * formata data, então o que aparece aqui é a escrita de quem chamou.
 */
export const SAMPLE_TIMESTAMP = 'ontem, 14:32';
