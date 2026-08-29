// A decisão de rolagem da conversa, presa sem DOM.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado e não importa framework nenhum.

import { describe, expect, it } from 'vitest';
import {
  BOTTOM_THRESHOLD,
  initialThreadScroll,
  isAtBottom,
  onJumpToEnd,
  onThreadMessage,
  onThreadScroll,
  shouldFollow,
  type ThreadMetrics,
} from '@shared/primitives/chat-scroll';

/** Um container de 400px de janela com 1000px de conteúdo. */
const metrics = (scrollTop: number): ThreadMetrics => ({
  scrollTop,
  scrollHeight: 1000,
  clientHeight: 400,
});

const FIM = 600; // scrollHeight - clientHeight

describe('isAtBottom — onde termina "o fim"', () => {
  it('no fim exato, sim', () => {
    expect(isAtBottom(metrics(FIM))).toBe(true);
  });

  it('dentro da folga, ainda sim', () => {
    // A rolagem por roda para em número fracionário e o zoom produz altura com
    // fração: exigir o valor exato faria "no fim" nunca ser verdadeiro.
    expect(isAtBottom(metrics(FIM - BOTTOM_THRESHOLD))).toBe(true);
    expect(isAtBottom(metrics(FIM - 0.5))).toBe(true);
  });

  it('um pixel além da folga, não', () => {
    expect(isAtBottom(metrics(FIM - BOTTOM_THRESHOLD - 1))).toBe(false);
  });

  it('a folga é menor que uma linha de texto', () => {
    // Se coubesse uma mensagem inteira dentro dela, "no fim" passaria a valer
    // com conteúdo novo escondido embaixo.
    expect(BOTTOM_THRESHOLD).toBeLessThan(40);
  });

  it('conteúdo que não transborda está sempre no fim', () => {
    // Conversa de duas mensagens: `scrollHeight` menor que a janela, e a conta
    // dá negativo. Sem este caso, o botão de "ir para o fim" apareceria numa
    // thread que já está inteira na tela.
    expect(isAtBottom({ scrollTop: 0, scrollHeight: 200, clientHeight: 400 })).toBe(true);
  });

  it('a folga é configurável, para quem tem margem maior no último item', () => {
    expect(isAtBottom(metrics(FIM - 100), 120)).toBe(true);
    expect(isAtBottom(metrics(FIM - 100), 80)).toBe(false);
  });
});

describe('mensagem nova', () => {
  it('no fim: a rolagem segue e nada se acumula', () => {
    const depois = onThreadMessage(initialThreadScroll);
    expect(shouldFollow(depois)).toBe(true);
    expect(depois.unread).toBe(0);
  });

  it('lendo para trás: a rolagem NÃO se mexe e a mensagem entra na contagem', () => {
    // É a regra que protege quem está lendo uma resposta antiga.
    let estado = onThreadScroll(initialThreadScroll, metrics(0));
    expect(estado.atBottom).toBe(false);

    estado = onThreadMessage(estado);
    estado = onThreadMessage(estado);
    expect(shouldFollow(estado)).toBe(false);
    expect(estado.unread).toBe(2);
  });
});

describe('a contagem descreve o que ainda não foi visto', () => {
  it('rolar até o fim com a mão zera', () => {
    let estado = onThreadScroll(initialThreadScroll, metrics(0));
    estado = onThreadMessage(estado);
    expect(estado.unread).toBe(1);

    estado = onThreadScroll(estado, metrics(FIM));
    expect(estado.atBottom).toBe(true);
    expect(estado.unread).toBe(0);
  });

  it('o botão de ir ao fim zera, venha de onde vier', () => {
    // O estado acumulado é montado E conferido: sem a conferência do meio, o
    // teste afirmaria só o retorno de `onJumpToEnd()`, que é constante — e
    // constante passa mesmo com a contagem quebrada.
    let estado = onThreadScroll(initialThreadScroll, metrics(0));
    estado = onThreadMessage(estado);
    expect(estado).toEqual({ atBottom: false, unread: 1 });

    expect(onJumpToEnd()).toEqual(initialThreadScroll);
    expect(shouldFollow(onJumpToEnd())).toBe(true);
  });

  it('rolar SEM chegar ao fim preserva a contagem', () => {
    // Subir e descer um pouco não é "eu vi": o que foi visto é o que está no
    // fim, e é só lá que a contagem cai.
    let estado = onThreadScroll(initialThreadScroll, metrics(0));
    estado = onThreadMessage(estado);
    estado = onThreadScroll(estado, metrics(200));
    expect(estado.unread).toBe(1);
    expect(estado.atBottom).toBe(false);
  });
});

describe('identidade do estado', () => {
  it('rolagem que não muda nada devolve o MESMO objeto', () => {
    // Três das cinco stacks reagem por identidade: devolver um objeto novo a
    // cada evento de rolagem repintaria a thread a cada pixel.
    const estado = initialThreadScroll;
    expect(onThreadScroll(estado, metrics(FIM))).toBe(estado);
  });

  it('mas muda quando o lado do limiar muda', () => {
    const estado = initialThreadScroll;
    expect(onThreadScroll(estado, metrics(0))).not.toBe(estado);
  });
});
