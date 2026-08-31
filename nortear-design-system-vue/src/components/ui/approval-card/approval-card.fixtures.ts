/**
 * Andaime das demonstrações do cartão de autorização.
 *
 * Existe pelo mesmo motivo do andaime do estado da ligação: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá, e a saída
 * fácil — copiar a constante para cada arquivo — produz cópias que divergem sem
 * nenhum sinal.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * ALCANCES saem de `@shared/primitives/approval-card-examples`, porque são dado
 * — e dado é o mesmo nos três idiomas e nas cinco stacks. Se cada stack
 * escrevesse os próprios, as cinco stories deixariam de fotografar a mesma tela
 * e a divergência só apareceria no Chromatic, como diferença de largura que
 * ninguém consegue atribuir a nada.
 *
 * ESTE ARQUIVO É QUEM CONSOME, e é por isso que as escolhas nascem aqui e não
 * dentro da peça: a §7 da guideline 17 deixa o desenho dos controles, a ênfase
 * de cada escolha e o significado de cada uma do lado de fora do design system.
 * O que a peça conhece é o atributo que marca qual controle conta como
 * resposta.
 *
 * Nada de `storybook/test` aqui: a docs page importa deste módulo, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */
import { computed, type ComputedRef } from 'vue';
import { useI18nStore, useTranslation, type Locale } from '@/lib/i18n';
import approvalTranslations from '@shared/content/approval-card/translations.json';
import {
  APPROVAL_EXAMPLE_CHOICES,
  APPROVAL_SCOPE_PUBLISH,
  APPROVAL_SCOPE_SPEND,
  APPROVAL_SCOPE_WRITE_FILE,
  type ApprovalScopeExample,
} from '@shared/primitives/approval-card-examples';
import type { ChatToolCall } from '@shared/primitives/chat-protocol';
import type { ApprovalScopeItem } from './ApprovalCard.vue';

/**
 * Os três tipos de pergunta que a família encontra: usar uma ferramenta que
 * escreve fora, gastar, tocar um arquivo.
 */
export type ApprovalExampleName = 'publish' | 'spend' | 'writeFile';

/**
 * Todas as perguntas que o conteúdo nomeia — os três exemplos, a da execução
 * que espera por uma pessoa, e a genérica do contraexemplo.
 */
export type ApprovalQuestionName = ApprovalExampleName | 'grant' | 'vague';

/** Os termos que o alcance dos exemplos usa. */
export type ApprovalScopeTerm = 'tool' | 'target' | 'effect' | 'cost';

/**
 * As escolhas dos exemplos.
 *
 * São a política de UM produto, e não a do design system: o que "sempre
 * permitir" abrange e o que acontece ao recusar não estão aqui e não vão estar.
 */
export type ApprovalChoiceName = 'allow-once' | 'always' | 'deny';

/** Os rótulos da demonstração num idioma. */
export interface ApprovalCardLabels {
  /** A pergunta de cada exemplo. */
  question: Record<ApprovalQuestionName, string>;
  /** O termo de cada linha do alcance. */
  scope: Record<ApprovalScopeTerm, string>;
  /** O texto de cada controle da resposta. */
  choice: Record<ApprovalChoiceName, string>;
  /** O controle que NÃO se declara resposta. */
  learnMore: string;
}

/**
 * A anotação de tipo é o PORTÃO: a seção `labels` é lida como
 * `ApprovalCardLabels` em CADA idioma, então rótulo que sumir do JSON — ou
 * idioma que ficar para trás — reprova no type-check, e não na tela.
 */
const CONTENT: Record<Locale, { labels: ApprovalCardLabels }> = approvalTranslations;

/**
 * A lista mora aqui e não nas stories: é dela que sai a grade da demonstração e
 * a lista de opções do control, e duas listas escritas à mão discordariam no
 * dia em que um exemplo entrasse.
 */
export const APPROVAL_EXAMPLE_NAMES: readonly ApprovalExampleName[] = [
  'publish',
  'spend',
  'writeFile',
] as const;

const SCOPE_BY_NAME: Record<ApprovalExampleName, ApprovalScopeExample[]> = {
  publish: APPROVAL_SCOPE_PUBLISH,
  spend: APPROVAL_SCOPE_SPEND,
  writeFile: APPROVAL_SCOPE_WRITE_FILE,
};

/** Os rótulos num idioma — a forma para quem já tem o locale em mãos. */
export function approvalCardLabelsFor(target: Locale): ApprovalCardLabels {
  return CONTENT[target].labels;
}

/**
 * Os rótulos fora de um componente — `play` não é render.
 *
 * Lê a MESMA store de locale que o composable abaixo, então o rótulo que a play
 * procura é sempre o que o cartão desenha.
 */
export function approvalCardLabels(): ApprovalCardLabels {
  return approvalCardLabelsFor(useI18nStore().locale);
}

/**
 * Os rótulos no idioma corrente.
 *
 * Devolve um `computed`, e não um objeto pronto: o `setup` roda uma vez, então
 * um objeto congelaria o cartão no idioma em que a story abriu — e a barra de
 * idioma do Storybook troca o idioma com a story montada.
 */
export function useApprovalCardLabels(): ComputedRef<ApprovalCardLabels> {
  const { locale } = useTranslation(approvalTranslations);
  return computed(() => approvalCardLabelsFor(locale.value as Locale));
}

/**
 * Junta a CHAVE do termo ao texto do idioma da foto.
 *
 * O exemplo compartilhado guarda a chave, e não a palavra, porque o termo é
 * rótulo de interface e muda com o idioma; o valor ao lado é dado, e não muda.
 * A chave chega como cadeia solta porque o exemplo é compartilhado e não pode
 * conhecer a união desta stack — é aqui que ela reencontra o tipo, e é a união
 * que cobra do conteúdo os quatro termos.
 */
export function approvalScopeOf(
  labels: ApprovalCardLabels,
  name: ApprovalExampleName,
): ApprovalScopeItem[] {
  return SCOPE_BY_NAME[name].map((item) => ({
    term: labels.scope[item.termKey as ApprovalScopeTerm],
    detail: item.detail,
  }));
}

/**
 * O alcance montado a partir da execução que espera por uma pessoa.
 *
 * Quem monta é QUEM CONSOME, e é o ponto da composição: a execução sai da caixa
 * recolhida com `splitWaitingCalls`, e o que ela carrega — o nome da ferramenta
 * e o que ela vai fazer — vira o alcance da pergunta. A peça não faz essa
 * tradução: ela receberia um dado do vocabulário de outra peça e passaria a
 * conhecer as duas.
 */
export function approvalScopeOfWaiting(
  labels: ApprovalCardLabels,
  call: ChatToolCall,
): ApprovalScopeItem[] {
  const scope: ApprovalScopeItem[] = [{ term: labels.scope.tool, detail: call.name }];
  if (call.detail) scope.push({ term: labels.scope.effect, detail: call.detail });
  return scope;
}

/** Um controle da resposta, como quem consome o escreve. */
export interface ApprovalChoice {
  /** O que o atributo carrega, e o que o aviso relata. */
  value: string;
  /** O texto do controle, no idioma da foto. */
  label: string;
}

/**
 * Os controles da resposta, todos com a MESMA ênfase.
 *
 * Nenhum deles é destacado, e isso é decisão: qual resposta o produto recomenda
 * é política dele, e uma peça que trouxesse a recomendação embutida traria
 * política junto — que é exatamente o que a §7 da guideline 17 mantém do lado
 * de fora. Aqui as três escolhas apenas existem, para que a demonstração tenha
 * o que apertar.
 *
 * E HÁ UM SEGUNDO MOTIVO, mais forte que o primeiro, porque não depende de onde
 * a guideline traçou a fronteira: num cartão que pede autorização, dar ênfase
 * visual a "Aprovar" EMPURRA para aprovar. É padrão escuro conhecido em diálogo
 * de permissão, e um design system que o embarcasse na demonstração o
 * espalharia por todo produto que copiasse o exemplo.
 *
 * A demonstração fica visualmente lisa por causa disso, e é para ficar. Quem
 * consome passa os próprios controles pelo slot e escolhe a ênfase que quiser —
 * a fronteira já é dele. O que não se faz é ENSINAR a escolha aqui. Este
 * parágrafo existe para que "deixar bonito" não desfaça a decisão depois.
 *
 * `data-approval-choice` é escrito por QUEM MONTA os controles, e é este valor
 * que vai nele. É o único pedaço do contrato que atravessa a fronteira do que a
 * peça desenha.
 */
export function approvalChoicesOf(
  labels: ApprovalCardLabels,
  choices: readonly string[] = APPROVAL_EXAMPLE_CHOICES,
): ApprovalChoice[] {
  return choices.map((choice) => ({
    value: choice,
    label: labels.choice[choice as ApprovalChoiceName],
  }));
}
