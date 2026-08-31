/**
 * Andaime das demonstrações do cartão de autorização.
 *
 * Os RÓTULOS saem da `translations.json`, porque são texto de interface. Os
 * ALCANCES saem de `@shared/primitives/approval-card-examples`, porque são dado
 * — e dado é o mesmo nos três idiomas e nas cinco stacks. Se cada stack
 * escrevesse os próprios, as cinco stories deixariam de fotografar a mesma tela
 * e a divergência só apareceria no Chromatic, como diferença de largura que
 * ninguém consegue atribuir a nada.
 *
 * ESTE ARQUIVO É QUEM CONSOME, e é por isso que a escolha e o rótulo de cada
 * controle nascem aqui e não dentro da peça: a §7 da guideline 17 deixa o
 * desenho dos controles, a ênfase de cada escolha e o significado de cada uma do
 * lado de fora do design system. O que a peça conhece é o atributo que marca
 * qual controle conta como resposta.
 *
 * O QUE ESTE ANDAIME NÃO DEVOLVE, e por quê: o CONTROLE pronto. Nesta stack os
 * controles chegam como `TemplateRef`, e template se declara na marcação de quem
 * consome — não há como fabricá-lo aqui. O que se compartilha é o par valor e
 * rótulo; quem monta o botão é a story ou a docs page, com a mesma diretiva de
 * botão que o resto da stack usa.
 *
 * Nada de `storybook/test` neste módulo: a docs page importa dele, e arrastar o
 * runner para dentro dela levaria o pacote junto.
 */

import { useTranslation } from '@/lib/i18n';
import approvalTranslations from '@shared/content/approval-card/translations.json';
import {
  APPROVAL_EXAMPLE_CHOICES,
  APPROVAL_SCOPE_PUBLISH,
  APPROVAL_SCOPE_SPEND,
  APPROVAL_SCOPE_WRITE_FILE,
  type ApprovalScopeExample,
} from '@shared/primitives/approval-card-examples';
import type { ChatToolCall } from '@shared/primitives/chat-protocol';
import type { ApprovalScopeItem } from './approval-card';

const { t } = useTranslation(approvalTranslations as Record<string, unknown>);

/**
 * Os três tipos de pergunta que a família encontra: usar uma ferramenta que
 * escreve fora, gastar, tocar um arquivo.
 */
export type ApprovalExampleName = 'publish' | 'spend' | 'writeFile';

/**
 * A lista mora aqui e não nas stories: é dela que sai a grade da demonstração e
 * a lista de opções do control, e duas listas escritas à mão discordariam no dia
 * em que um exemplo entrasse.
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

/**
 * Junta a CHAVE do termo ao texto do idioma da foto.
 *
 * O exemplo compartilhado guarda a chave, e não a palavra, porque o termo é
 * rótulo de interface e muda com o idioma; o valor ao lado é dado, e não muda.
 */
export function approvalScope(name: ApprovalExampleName): ApprovalScopeItem[] {
  return SCOPE_BY_NAME[name].map((item) => ({
    term: t(`labels.scope.${item.termKey}`),
    detail: item.detail,
  }));
}

/** A pergunta daquele exemplo, no idioma da foto. */
export function approvalQuestion(name: ApprovalExampleName): string {
  return t(`labels.question.${name}`);
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
export function approvalScopeOfWaiting(call: ChatToolCall): ApprovalScopeItem[] {
  const items: ApprovalScopeItem[] = [{ term: t('labels.scope.tool'), detail: call.name }];
  if (call.detail) items.push({ term: t('labels.scope.effect'), detail: call.detail });
  return items;
}

/** A pergunta daquela execução, escrita por quem consome. */
export function approvalWaitingQuestion(): string {
  return t('labels.question.grant');
}

/** Um controle da resposta: o valor que ele declara e o texto que ele mostra. */
export interface ApprovalChoiceControl {
  /** Vai para `data-approval-choice`, e é o que o evento relata. */
  value: string;
  /** O texto visível, que é também o nome acessível. */
  label: string;
}

/**
 * Os controles da resposta, todos com a MESMA ênfase.
 *
 * Nenhum deles é destacado, e isso é decisão: qual resposta o produto recomenda
 * é política dele, e uma peça que trouxesse a recomendação embutida traria
 * política junto — que é exatamente o que a §7 da guideline 17 mantém do lado de
 * fora. Aqui as três escolhas apenas existem, para que a demonstração tenha o
 * que apertar.
 *
 * E HÁ UM SEGUNDO MOTIVO, mais forte que o primeiro, porque não depende de onde
 * a guideline traçou a fronteira: num cartão que pede autorização, dar ênfase
 * visual a "Aprovar" EMPURRA para aprovar. É padrão escuro conhecido em diálogo
 * de permissão, e um design system que o embarcasse na demonstração o espalharia
 * por todo produto que copiasse o exemplo.
 *
 * A demonstração fica visualmente lisa por causa disso, e é para ficar. Quem
 * consome passa os próprios controles por `actions` e escolhe a ênfase que
 * quiser — a fronteira já é dele. O que não se faz é ENSINAR a escolha aqui.
 * Este parágrafo existe para que "deixar bonito" não desfaça a decisão depois.
 *
 * O valor daqui vai para `data-approval-choice` na marcação de quem monta o
 * controle. É o único pedaço do contrato que atravessa a fronteira do que a peça
 * desenha.
 */
export function approvalChoices(
  choices: readonly string[] = APPROVAL_EXAMPLE_CHOICES,
): ApprovalChoiceControl[] {
  return choices.map((choice) => ({ value: choice, label: t(`labels.choice.${choice}`) }));
}

/**
 * O rótulo de um controle que NÃO se declara resposta.
 *
 * Existe para provar a fronteira nos dois sentidos: a peça não relata escolha
 * nenhuma quando o controle acionado não traz o atributo, porque inventar uma
 * escolha que ninguém marcou seria decidir por quem consome.
 */
export function approvalAsideLabel(): string {
  return t('labels.learnMore');
}
