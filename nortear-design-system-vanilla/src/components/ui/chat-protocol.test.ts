// O vocabulário da família conversacional, preso sem DOM.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.
//
// Tipo não roda, então o que este arquivo segura são as três coisas do módulo
// que TÊM comportamento: as listas ordenadas de estado, as decisões que
// separam um estado do vizinho, e a soma derivada. É pouco de propósito — se
// um dia isto crescer, é sinal de que a conta migrou para cá e devia estar em
// `token-budget.ts`.

import { describe, expect, it } from 'vitest';
import {
  ATTACHMENT_STATES,
  canWithdraw,
  CONTEXT_KINDS,
  isContextRemovable,
  isModelSelectable,
  isVoiceBusy,
  isAttachmentReady,
  isRunFinished,
  isTerminal,
  RUN_STATUSES,
  TOOL_CALL_STATES,
  totalTokens,
  waitsForPerson,
  type Attachment,
  type AttachmentState,
  type ContextItem,
  type ContextKind,
  type ModelOption,
  type QueuedMessage,
  QUEUED_MESSAGE_STATES,
  type RunStatus,
  type ToolCallState,
  type VoiceState,
  VOICE_STATES,
} from '@shared/primitives/chat-protocol';

describe('as listas cobrem a união inteira', () => {
  // O que estas asserções guardam não é a ordem: é a OMISSÃO. Acrescentar um
  // estado ao tipo e esquecer a lista deixa a tabela de estados da docs page e
  // o mapa de rótulos sem ele, e nada quebra — a peça só some da tela. O
  // compilador não pega, porque `readonly T[]` não sabe se está completo.
  //
  // O par de asserções é o que dá dentes: uma exige que todo item da lista seja
  // do tipo, a outra exige que a contagem bata com a união escrita à mão aqui.
  it('estado de ferramenta: quatro, e nenhum a mais', () => {
    const uniao: ToolCallState[] = ['pending', 'running', 'done', 'failed'];
    expect([...TOOL_CALL_STATES].sort()).toEqual([...uniao].sort());
  });

  it('estado de execução: cinco, e nenhum a mais', () => {
    const uniao: RunStatus[] = ['idle', 'running', 'stopped', 'complete', 'failed'];
    expect([...RUN_STATUSES].sort()).toEqual([...uniao].sort());
  });

  it('estado de anexo: quatro, e nenhum a mais', () => {
    const uniao: AttachmentState[] = ['pending', 'uploading', 'ready', 'failed'];
    expect([...ATTACHMENT_STATES].sort()).toEqual([...uniao].sort());
  });

  it('as listas não repetem estado', () => {
    for (const lista of [TOOL_CALL_STATES, RUN_STATUSES, ATTACHMENT_STATES]) {
      expect(new Set(lista).size).toBe(lista.length);
    }
  });
});

describe('isTerminal — a chamada acabou?', () => {
  it('done e failed acabaram', () => {
    expect(isTerminal('done')).toBe(true);
    expect(isTerminal('failed')).toBe(true);
  });

  it('pending e running não acabaram', () => {
    expect(isTerminal('pending')).toBe(false);
    expect(isTerminal('running')).toBe(false);
  });
});

describe('waitsForPerson — o que separa pending de running', () => {
  // É a razão de os dois estados existirem em vez de um só "ainda não
  // terminou". Se esta asserção cair, o par colapsou e a família 2 inteira
  // perde a distinção entre pedir ação e pedir paciência.
  it('só pending espera por gente', () => {
    const esperam = TOOL_CALL_STATES.filter(waitsForPerson);
    expect(esperam).toEqual(['pending']);
  });

  it('esperar por gente e ter acabado são coisas exclusivas', () => {
    for (const estado of TOOL_CALL_STATES) {
      expect(waitsForPerson(estado) && isTerminal(estado)).toBe(false);
    }
  });
});

describe('isRunFinished — parada por gente também é fim', () => {
  it('stopped conta como fim', () => {
    // A tentação é tratar `stopped` como "ainda pode voltar". Não pode: a
    // execução terminou sem resposta, e o que muda é a oferta na tela —
    // continuar, num caso, tentar de novo no outro.
    expect(isRunFinished('stopped')).toBe(true);
  });

  it('complete e failed também', () => {
    expect(isRunFinished('complete')).toBe(true);
    expect(isRunFinished('failed')).toBe(true);
  });

  it('idle e running, não', () => {
    expect(isRunFinished('idle')).toBe(false);
    expect(isRunFinished('running')).toBe(false);
  });
});

describe('totalTokens — a soma é derivada, nunca guardada', () => {
  it('soma entrada e saída', () => {
    expect(totalTokens({ input: 1200, output: 340 })).toBe(1540);
  });

  it('o limite não entra na soma', () => {
    // O teto da janela é referência, não consumo. Somá-lo é o erro que um
    // campo `total` guardado convidaria a cometer.
    expect(totalTokens({ input: 1200, output: 340, limit: 200000 })).toBe(1540);
  });

  it('execução que ainda não gerou nada soma a entrada', () => {
    expect(totalTokens({ input: 900, output: 0 })).toBe(900);
  });
});

describe('isAttachmentReady — o que pode ser enviado junto', () => {
  const anexo = (state: AttachmentState): Attachment => ({ name: 'planta.pdf', state });

  it('só ready', () => {
    const prontos = ATTACHMENT_STATES.filter((s) => isAttachmentReady(anexo(s)));
    expect(prontos).toEqual(['ready']);
  });

  it('anexo em envio não está pronto, mesmo com progresso alto', () => {
    // 99% ainda não é arquivo no servidor, e mandar a mensagem aqui perde o
    // anexo sem avisar.
    expect(isAttachmentReady({ name: 'planta.pdf', state: 'uploading', progress: 0.99 })).toBe(
      false,
    );
  });
});

describe('isContextRemovable — o que se pode tirar à mão', () => {
  const item = (automatic?: boolean): ContextItem => ({
    label: 'relatorio.ts',
    kind: 'file',
    automatic,
  });

  it('o que a pessoa escolheu sai', () => {
    expect(isContextRemovable(item())).toBe(true);
    expect(isContextRemovable(item(false))).toBe(true);
  });

  it('o automático não ganha botão — ele voltaria na próxima pergunta', () => {
    // É a regra que separa esta peça da fila de anexos: contexto automático é
    // o arquivo aberto, e desfazer o que se refaz sozinho é armadilha.
    expect(isContextRemovable(item(true))).toBe(false);
  });

  it('a espécie não decide nada aqui', () => {
    // Só `automatic` governa. Se a espécie passar a governar, esta asserção
    // reprova antes de a tela divergir da folha.
    const porEspecie = CONTEXT_KINDS.map((kind: ContextKind) =>
      isContextRemovable({ label: 'x', kind }),
    );
    expect(new Set(porEspecie)).toEqual(new Set([true]));
  });
});

describe('isModelSelectable — a opção pode ser escolhida agora?', () => {
  const modelo = (unavailable?: boolean): ModelOption => ({
    id: 'rapido',
    label: 'Rápido',
    unavailable,
    unavailableReason: unavailable ? 'Fora do seu plano' : undefined,
  });

  it('sem marca de indisponível, escolhe', () => {
    expect(isModelSelectable(modelo())).toBe(true);
  });

  it('indisponível não escolhe, e o motivo viaja junto', () => {
    // O motivo é obrigatório porque opção apagada sem explicação é a pergunta
    // "por que não posso?" sem resposta na tela.
    const fora = modelo(true);
    expect(isModelSelectable(fora)).toBe(false);
    expect(fora.unavailableReason).toBeTruthy();
  });
});

describe('isVoiceBusy — o ditado está ocupado?', () => {
  it('só o repouso está livre', () => {
    const livres = VOICE_STATES.filter((s: VoiceState) => !isVoiceBusy(s));
    expect(livres).toEqual(['idle']);
  });

  it('transcrevendo continua ocupado, ainda que já não capte', () => {
    // A distinção que faz os dois estados existirem: `recording` se
    // interrompe, `transcribing` não devolve o áudio se alguém apertar.
    expect(isVoiceBusy('transcribing')).toBe(true);
  });
});

describe('canWithdraw — ainda dá para tirar da fila?', () => {
  const na = (state: QueuedMessage['state']): QueuedMessage => ({ text: 'E o prazo?', state });

  it('só a que espera', () => {
    const podem = QUEUED_MESSAGE_STATES.filter((s) => canWithdraw(na(s)));
    expect(podem).toEqual(['waiting']);
  });

  it('a que já está indo não oferece desfazer', () => {
    // Botão que promete desfazer o que não desfaz é pior que botão nenhum: a
    // mensagem já saiu, e o que acontece depois é do produto.
    expect(canWithdraw(na('sending'))).toBe(false);
  });
});
