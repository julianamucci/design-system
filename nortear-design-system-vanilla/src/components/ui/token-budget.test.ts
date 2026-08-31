// A conta da janela de contexto, presa sem DOM.
//
// Vive na stack de referência porque é lá que o projeto roda `--project unit`;
// o módulo em si é compartilhado (`docs/shared/primitives/token-budget.ts`) e
// não importa framework nenhum. Mesmo arranjo de `chat-protocol.test.ts`,
// `chat-scroll.test.ts` e `file-size.test.ts`.
//
// O QUE ESTE ARQUIVO SEGURA são as decisões do cabeçalho do módulo, e cada
// bloco abaixo corresponde a uma delas:
//
//   1. sem teto não há fração — e a ausência sai como `null`, nunca como zero;
//   2. os limiares são EXATOS, e é a borda deles que se testa (0,75 e 0,90 em
//      ponto, e o vizinho de baixo). Testar só o meio do intervalo deixa a
//      comparação livre para virar `>` sem nada reprovar;
//   3. a repartição divide pelo TOTAL, e nunca pelo teto.
//
// Mais as duas travas do número que é lido em voz: 100% só quando cheio, 0% só
// quando vazio.

import { describe, expect, it } from 'vitest';
import type { TokenUsage } from '@shared/primitives/chat-protocol';
import {
  BUDGET_CRITICAL_AT,
  BUDGET_LEVELS,
  BUDGET_ORIGINS,
  BUDGET_WARNING_AT,
  budgetLevel,
  budgetShares,
  hasLimit,
  isOverLimit,
  remainingTokens,
  usedFraction,
  usedPercent,
  usedTokens,
  type BudgetLevel,
} from '@shared/primitives/token-budget';

/** Um consumo com o teto pedido, repartido meio a meio entre as origens. */
function usageAt(fraction: number, limit = 1000): TokenUsage {
  const used = Math.round(fraction * limit);
  return { input: used - Math.floor(used / 2), output: Math.floor(used / 2), limit };
}

describe('a lista de níveis cobre a união inteira', () => {
  // Mesma guarda de `TOOL_CALL_STATES` no vocabulário: o que ela pega não é a
  // ordem, é a OMISSÃO. Nível novo no tipo sem entrada na lista deixa a tabela
  // de estados da docs page e o mapa de rótulos sem ele, e nada quebra — o
  // nível só some da tela.
  it('três níveis, e nenhum a mais', () => {
    const every: BudgetLevel[] = ['normal', 'warning', 'critical'];
    expect([...BUDGET_LEVELS].sort()).toEqual([...every].sort());
  });

  it('duas origens, e nenhuma a mais', () => {
    expect([...BUDGET_ORIGINS]).toEqual(['input', 'output']);
  });

  it('nenhuma das duas listas repete valor', () => {
    for (const values of [BUDGET_LEVELS, BUDGET_ORIGINS]) {
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

describe('sem teto não há fração, só contagem', () => {
  const noLimit: TokenUsage = { input: 800, output: 400 };

  it('a ausência de teto se reconhece', () => {
    expect(hasLimit(noLimit)).toBe(false);
    expect(hasLimit({ input: 1, output: 1, limit: 1000 })).toBe(true);
  });

  it('teto zero, negativo ou não-finito é ausência de teto, não teto', () => {
    // Os três significam a mesma coisa para quem desenha, e é por isso que a
    // pergunta mora numa função só: escrita em cinco lugares, um deles fica de
    // fora — e o que fica de fora é sempre o zero.
    for (const limit of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(hasLimit({ input: 10, output: 5, limit })).toBe(false);
      expect(usedFraction({ input: 10, output: 5, limit })).toBeNull();
    }
  });

  it('a fração, o por cento, o que resta e o nível saem TODOS como null', () => {
    // `null` e não zero: um anel vazio lê como "nada foi usado", que é o oposto
    // de "não se sabe quanto cabe". Se um dos quatro devolvesse zero, a peça
    // desenharia zero por cento sobre uma conversa de mil e duzentos tokens.
    expect(usedFraction(noLimit)).toBeNull();
    expect(usedPercent(noLimit)).toBeNull();
    expect(remainingTokens(noLimit)).toBeNull();
    expect(budgetLevel(noLimit)).toBeNull();
  });

  it('mas a CONTAGEM continua existindo, que é o que sobra para desenhar', () => {
    expect(usedTokens(noLimit)).toBe(1200);
    expect(isOverLimit(noLimit)).toBe(false);
  });
});

describe('a soma é derivada, e as parcelas são normalizadas', () => {
  it('soma entrada e saída', () => {
    expect(usedTokens({ input: 700, output: 300 })).toBe(1000);
  });

  it('parcela negativa ou não-finita lê como zero', () => {
    // Um `NaN` na tela é pior que um zero, porque zero pelo menos se lê. Mesma
    // decisão de `formatFileSize`.
    expect(usedTokens({ input: Number.NaN, output: 300 })).toBe(300);
    expect(usedTokens({ input: -50, output: 300 })).toBe(300);
    expect(usedTokens({ input: Number.POSITIVE_INFINITY, output: 300 })).toBe(300);
  });
});

describe('o limiar de aviso é EXATO, e a borda é o teste', () => {
  // Aqui mora o motivo de o módulo existir: escrito como `if` em cinco stacks,
  // uma delas escreveria `>` no lugar de `>=`, outra arredondaria antes de
  // comparar, e as duas desenhariam níveis diferentes para o mesmo número.
  it('exatamente três quartos JÁ é aviso', () => {
    expect(BUDGET_WARNING_AT).toBe(0.75);
    expect(budgetLevel({ input: 750, output: 0, limit: 1000 })).toBe('warning');
  });

  it('um token abaixo do limiar ainda é folga', () => {
    expect(budgetLevel({ input: 749, output: 0, limit: 1000 })).toBe('normal');
  });

  it('exatamente nove décimos JÁ é aperto', () => {
    expect(BUDGET_CRITICAL_AT).toBe(0.9);
    expect(budgetLevel({ input: 900, output: 0, limit: 1000 })).toBe('critical');
  });

  it('um token abaixo do aperto ainda é aviso', () => {
    expect(budgetLevel({ input: 899, output: 0, limit: 1000 })).toBe('warning');
  });

  it('os dois limiares estão em ordem, e nenhum é ponta do intervalo', () => {
    // Limiar em 0 faria tudo ser aviso; limiar em 1 faria o aviso chegar junto
    // com o estouro, que é chegar depois do fato.
    expect(BUDGET_WARNING_AT).toBeLessThan(BUDGET_CRITICAL_AT);
    expect(BUDGET_WARNING_AT).toBeGreaterThan(0);
    expect(BUDGET_CRITICAL_AT).toBeLessThan(1);
  });

  it('a janela vazia é folga, e a estourada continua aperto', () => {
    expect(budgetLevel({ input: 0, output: 0, limit: 1000 })).toBe('normal');
    expect(budgetLevel({ input: 5000, output: 0, limit: 1000 })).toBe('critical');
  });
});

describe('a fração é recortada em 1, e quem sabe do estouro é outro', () => {
  it('a fração acompanha o consumo', () => {
    expect(usedFraction(usageAt(0.4))).toBeCloseTo(0.4, 5);
  });

  it('passar do teto não passa de uma volta', () => {
    // Um anel não dá mais que uma volta e uma barra não passa do trilho. O
    // recorte é escolha explícita para que ninguém desenhe 1,3 sem saber.
    expect(usedFraction({ input: 3000, output: 0, limit: 1000 })).toBe(1);
  });

  it('e é `isOverLimit` que ainda sabe a diferença depois do recorte', () => {
    const full: TokenUsage = { input: 1000, output: 0, limit: 1000 };
    const spilled: TokenUsage = { input: 1001, output: 0, limit: 1000 };
    expect(usedFraction(full)).toBe(usedFraction(spilled));
    expect(isOverLimit(full)).toBe(false);
    expect(isOverLimit(spilled)).toBe(true);
  });

  it('o que resta nunca é negativo', () => {
    expect(remainingTokens({ input: 400, output: 100, limit: 1000 })).toBe(500);
    expect(remainingTokens({ input: 3000, output: 0, limit: 1000 })).toBe(0);
  });
});

describe('o por cento é TEXTO, e por isso tem duas travas', () => {
  it('100% só quando está cheio de verdade', () => {
    // Ver "100%" com espaço sobrando faz parar de escrever quem não precisava.
    expect(usedPercent({ input: 999, output: 0, limit: 1000 })).toBe(99);
    expect(usedPercent({ input: 9999, output: 0, limit: 10_000 })).toBe(99);
    expect(usedPercent({ input: 1000, output: 0, limit: 1000 })).toBe(100);
    expect(usedPercent({ input: 1200, output: 0, limit: 1000 })).toBe(100);
  });

  it('0% só quando nada foi gasto', () => {
    // Um turno já respondido que aparece como 0% diz que a conversa não começou.
    expect(usedPercent({ input: 0, output: 0, limit: 1000 })).toBe(0);
    expect(usedPercent({ input: 1, output: 0, limit: 10_000 })).toBe(1);
  });

  it('entre as pontas o valor é truncado, e não arredondado para cima', () => {
    // Truncar nunca empurra o número para uma ponta que ele não alcançou.
    expect(usedPercent({ input: 626, output: 0, limit: 1000 })).toBe(62);
    expect(usedPercent({ input: 629, output: 0, limit: 1000 })).toBe(62);
  });
});

describe('a repartição responde "de onde veio", e divide pelo TOTAL', () => {
  it('as duas parcelas somam um', () => {
    const shares = budgetShares({ input: 750, output: 250, limit: 4000 });
    expect(shares.map((s) => s.origin)).toEqual(['input', 'output']);
    expect(shares[0]!.fraction).toBeCloseTo(0.75, 5);
    expect(shares[1]!.fraction).toBeCloseTo(0.25, 5);
    expect(shares.reduce((sum, s) => sum + s.fraction, 0)).toBeCloseTo(1, 5);
  });

  it('e o teto NÃO entra na conta', () => {
    // É a decisão 3 do cabeçalho: com denominador que trocasse conforme houvesse
    // teto, o mesmo desenho significaria duas coisas em duas telas.
    const bounded = budgetShares({ input: 750, output: 250, limit: 4000 });
    const unbounded = budgetShares({ input: 750, output: 250 });
    expect(bounded).toEqual(unbounded);
  });

  it('consumo zero reparte em zero, e nunca em NaN', () => {
    // Acontece sempre na primeira vez que alguém abre a peça: conversa sem
    // nenhum turno. Um `NaN` ali seria o estado inicial de toda tela.
    const shares = budgetShares({ input: 0, output: 0, limit: 1000 });
    for (const share of shares) {
      expect(Number.isNaN(share.fraction)).toBe(false);
      expect(share.fraction).toBe(0);
      expect(share.tokens).toBe(0);
    }
  });

  it('a parcela que zerou continua na lista', () => {
    // Sumir com ela faria a repartição mudar de forma entre um quadro e o
    // seguinte — e legenda que aparece e some é mais difícil de ler que legenda
    // parada em zero.
    const shares = budgetShares({ input: 400, output: 0 });
    expect(shares).toHaveLength(2);
    expect(shares[1]).toEqual({ origin: 'output', tokens: 0, fraction: 0 });
  });
});
