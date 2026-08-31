/**
 * O que o resumo de um grupo de chamadas de ferramenta diz.
 *
 * POR QUE ISTO É COMPARTILHADO, e não um `if` dentro do componente.
 *
 * A decisão 1 da folha `agent-run.css` obriga o resumo a carregar EM PALAVRA o
 * que há dentro do grupo — inclusive que algo falhou —, porque um grupo nasce
 * recolhido e uma falha escondida numa caixa fechada é uma falha que ninguém
 * vê. Quem responde "o que há aqui dentro?" é esta função.
 *
 * A alternativa era cada stack olhar a lista e escolher a palavra. São quatro
 * linhas de código e cinco cópias — e as cinco discordariam justamente onde a
 * resposta é menos óbvia: um grupo com uma falha E uma chamada que ainda corre
 * diz "falhou" ou "em curso"? Uma cópia escolheria diferente da outra, e a
 * divergência não apareceria em teste nenhum: as duas telas estariam
 * "funcionando".
 *
 * É a mesma divisão de `chat-scroll.ts`: o que é MÁQUINA mora aqui, é puro e
 * tem teste de nó; o que é DOM é de cada stack.
 *
 * O QUE ESTE MÓDULO NÃO FAZ: escrever palavra nenhuma. Ele devolve um estado do
 * vocabulário compartilhado, e o texto de cada estado é de quem consome — texto
 * é decisão de idioma, e um módulo sem i18n que escrevesse a palavra decidiria
 * idioma em cinco lugares.
 */

import {
  isTerminal,
  waitsForPerson,
  type ChatToolCall,
  type ToolCallState,
} from './chat-protocol';

/**
 * A variante de `.nds-badge` de cada estado.
 *
 * A cor é REFORÇO, e nunca a informação: quem carrega o estado é a palavra
 * dentro da etiqueta (decisão 4 da folha, WCAG 1.4.1). O mapa mora aqui pelo
 * mesmo motivo de `badge-priority.ts` — cinco cópias inline de uma tabela de
 * sete linhas é como se produzem cinco telas que discordam sobre a cor de um
 * estado.
 *
 * `pending` fica em `warning` porque é o único que espera por uma PESSOA: ele
 * se parece com `running` na tela e é o oposto, e a moldura de aviso é a mesma
 * escolha que `.nds-chat-tool-call[data-state="pending"]` já fez.
 */
export const TOOL_CALL_BADGE_VARIANT: Record<ToolCallState, string> = {
  pending: 'warning',
  running: 'primary',
  done: 'success',
  failed: 'destructive',
};

/** A classe completa da etiqueta daquele estado. */
export function toolCallBadgeClass(state: ToolCallState): string {
  return `nds-badge nds-badge-${TOOL_CALL_BADGE_VARIANT[state]}`;
}

/** O que há dentro de um grupo, contado. */
export interface ToolGroupSummary {
  /** Quantas chamadas o grupo recebeu. */
  total: number;
  /** Quantas falharam. */
  failed: number;
  /** Quantas esperam por uma pessoa. */
  waiting: number;
  /** Quantas ainda correm — a máquina é que deve resposta. */
  running: number;
  /** Quantas terminaram bem. */
  done: number;
  /**
   * O estado que o RESUMO mostra, e a palavra que quem consome escolhe por ele.
   *
   * É um `ToolCallState` de propósito, e não um tipo próprio: o resumo fala do
   * conjunto na mesma língua em que cada linha fala de si, então o mapa de
   * rótulos do resumo tem exatamente as mesmas quatro chaves do mapa de
   * rótulos da lista. Um tipo novo dobraria o vocabulário para dizer o mesmo.
   */
  state: ToolCallState;
}

/**
 * A ORDEM DE PRECEDÊNCIA, e por que ela é esta.
 *
 * `failed` primeiro porque a decisão da folha é sobre ele: o grupo nasce
 * recolhido, e é a falha que não pode ficar escondida. `pending` em seguida
 * porque é o único estado que pede algo de quem lê — e a peça que recebe um
 * `pending` está desenhando uma chamada que deveria ter ficado FORA do grupo
 * (ver `waitsForPerson`), então o resumo tem de gritar isso, não engolir.
 * `running` antes de `done` porque um grupo em que algo ainda corre não
 * terminou, por mais que quase tudo já tenha terminado.
 *
 * Grupo VAZIO devolve `done` com `total: 0`. Não é um caso bonito, e é
 * deliberado: a peça desenha o que recebe, e um grupo sem chamadas é um grupo
 * que quem consome não deveria ter montado. Devolver um quinto estado só para
 * ele obrigaria os cinco mapas de rótulo a ganhar uma palavra que nenhuma tela
 * mostra.
 */
export function summarizeToolCalls(calls: readonly ChatToolCall[]): ToolGroupSummary {
  let failed = 0;
  let waiting = 0;
  let running = 0;
  let done = 0;

  for (const call of calls) {
    if (call.state === 'failed') failed += 1;
    else if (waitsForPerson(call.state)) waiting += 1;
    else if (call.state === 'done') done += 1;
    // `running` é o que sobra, e a pergunta sai do vocabulário em vez de
    // repetir o literal: chamada que não terminou e não espera por gente é
    // chamada que a máquina ainda está fazendo.
    else if (!isTerminal(call.state)) running += 1;
  }

  const state: ToolCallState =
    failed > 0 ? 'failed' : waiting > 0 ? 'pending' : running > 0 ? 'running' : 'done';

  return { total: calls.length, failed, waiting, running, done, state };
}

/**
 * As chamadas que o grupo deve mostrar, e a que espera por uma pessoa.
 *
 * A decisão 3 da folha manda tirar do grupo a chamada que espera por alguém:
 * pedir autorização dentro de uma caixa fechada é pedir sem mostrar. Quem faz
 * essa separação é quem CONSOME — e é por isso que ela mora aqui e não dentro
 * do componente. Um componente que filtrasse sozinho apagaria da tela um dado
 * que recebeu, e a peça desenha o que recebe.
 *
 * O que este módulo oferece é a separação PRONTA, para que as cinco stacks não
 * escrevam cinco filtros com o mesmo literal solto.
 */
export function splitWaitingCalls<T extends ChatToolCall>(
  calls: readonly T[],
): { grouped: T[]; waiting: T[] } {
  const grouped: T[] = [];
  const waiting: T[] = [];
  for (const call of calls) {
    if (waitsForPerson(call.state)) waiting.push(call);
    else grouped.push(call);
  }
  return { grouped, waiting };
}
