// O que o resumo de um grupo de ferramentas diz, preso sem DOM.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum. Mesmo arranjo
// de `chat-protocol.test.ts` e `chat-scroll.test.ts`.
//
// O QUE ESTE ARQUIVO SEGURA é a ordem de precedência. Ela é a única coisa do
// grupo de ferramentas que rende cinco `if` e que as cinco stacks poderiam
// escrever de cinco maneiras — e a divergência não apareceria em teste de
// tela nenhum: as cinco pareceriam funcionando, dizendo coisas diferentes
// sobre a mesma lista.

import { describe, expect, it } from 'vitest';
import { TOOL_CALL_STATES, type ChatToolCall } from '@shared/primitives/chat-protocol';
import {
  splitWaitingCalls,
  summarizeToolCalls,
  toolCallBadgeClass,
  TOOL_CALL_BADGE_VARIANT,
} from '@shared/primitives/tool-group-summary';

/** Uma chamada qualquer naquele estado — o nome não importa para a conta. */
const call = (state: ChatToolCall['state'], name = 'ferramenta'): ChatToolCall => ({
  name,
  state,
});

describe('o resumo conta o que há dentro', () => {
  it('conta cada estado separadamente, e o total é o tamanho da lista', () => {
    const summary = summarizeToolCalls([
      call('done'),
      call('done'),
      call('running'),
      call('failed'),
      call('pending'),
    ]);
    expect(summary.total).toBe(5);
    expect(summary.done).toBe(2);
    expect(summary.running).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.waiting).toBe(1);
  });

  it('a soma das quatro contagens é o total', () => {
    // Sem esta asserção, um estado novo no vocabulário cairia fora das quatro
    // contagens e o resumo passaria a contar menos do que recebeu — em
    // silêncio, porque o total continuaria certo.
    const calls = TOOL_CALL_STATES.map((state) => call(state));
    const s = summarizeToolCalls(calls);
    expect(s.done + s.running + s.failed + s.waiting).toBe(s.total);
  });
});

describe('a ordem de precedência do que o resumo mostra', () => {
  it('a falha vem antes de tudo, e é a razão de a regra existir', () => {
    // O grupo nasce recolhido: se a falha não vencer aqui, ela fica escondida
    // atrás de uma caixa fechada que diz "concluído".
    expect(summarizeToolCalls([call('done'), call('failed')]).state).toBe('failed');
    expect(summarizeToolCalls([call('running'), call('failed')]).state).toBe('failed');
    expect(summarizeToolCalls([call('pending'), call('failed')]).state).toBe('failed');
  });

  it('a que espera por uma pessoa vem antes da que a máquina ainda faz', () => {
    // Uma pede ação de quem lê; a outra pede paciência. É a distinção que faz
    // `pending` existir como estado, e o resumo não pode enterrá-la.
    expect(summarizeToolCalls([call('running'), call('pending')]).state).toBe('pending');
    expect(summarizeToolCalls([call('done'), call('pending')]).state).toBe('pending');
  });

  it('o que ainda corre vence o que já terminou bem', () => {
    // Grupo em que algo ainda corre não terminou, por mais que quase tudo já
    // tenha terminado.
    expect(summarizeToolCalls([call('done'), call('done'), call('running')]).state).toBe('running');
  });

  it('só diz que terminou quando tudo terminou bem', () => {
    expect(summarizeToolCalls([call('done'), call('done')]).state).toBe('done');
  });

  it('grupo vazio diz que terminou, e conta zero', () => {
    // Não é um caso bonito, e é deliberado: um quinto estado só para ele
    // obrigaria os cinco mapas de rótulo a ganhar uma palavra que nenhuma tela
    // mostra. Fica registrado aqui para que a escolha não se perca.
    const summary = summarizeToolCalls([]);
    expect(summary.total).toBe(0);
    expect(summary.state).toBe('done');
  });

  it('uma chamada sozinha resume a si mesma, em qualquer estado', () => {
    for (const state of TOOL_CALL_STATES) {
      expect(summarizeToolCalls([call(state)]).state).toBe(state);
    }
  });
});

describe('a separação da chamada que espera por uma pessoa', () => {
  it('tira só a que espera, e preserva a ordem das duas listas', () => {
    const calls = [
      call('done', 'buscar'),
      call('pending', 'conceder'),
      call('failed', 'publicar'),
      call('pending', 'apagar'),
    ];
    const { grouped, waiting } = splitWaitingCalls(calls);
    expect(grouped.map((c) => c.name)).toEqual(['buscar', 'publicar']);
    expect(waiting.map((c) => c.name)).toEqual(['conceder', 'apagar']);
  });

  it('não perde nem duplica nenhuma chamada', () => {
    const calls = TOOL_CALL_STATES.map((state) => call(state, state));
    const { grouped, waiting } = splitWaitingCalls(calls);
    expect(grouped.length + waiting.length).toBe(calls.length);
  });

  it('lista sem quem espere devolve tudo no grupo', () => {
    const calls = [call('done'), call('failed'), call('running')];
    const { grouped, waiting } = splitWaitingCalls(calls);
    expect(grouped).toHaveLength(3);
    expect(waiting).toHaveLength(0);
  });
});

describe('a cor da etiqueta é reforço, e existe para os quatro', () => {
  it('todo estado tem variante, e nenhuma se repete', () => {
    // Duas variantes iguais para estados diferentes tirariam a única pista
    // visual que a cor dá — e o teste passaria a medir nada.
    const variants = TOOL_CALL_STATES.map((state) => TOOL_CALL_BADGE_VARIANT[state]);
    expect(variants.every(Boolean)).toBe(true);
    expect(new Set(variants).size).toBe(TOOL_CALL_STATES.length);
  });

  it('a classe traz a base do badge e a variante daquele estado', () => {
    expect(toolCallBadgeClass('failed')).toBe('nds-badge nds-badge-destructive');
    expect(toolCallBadgeClass('done')).toBe('nds-badge nds-badge-success');
    expect(toolCallBadgeClass('pending')).toBe('nds-badge nds-badge-warning');
    expect(toolCallBadgeClass('running')).toBe('nds-badge nds-badge-primary');
  });
});
