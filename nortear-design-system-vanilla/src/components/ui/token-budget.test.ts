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
  contextSlices,
  contextTotal,
  fractionLevel,
  fractionPercent,
  hasLimit,
  isOverLimit,
  remainingTokens,
  remainingUnits,
  spentFraction,
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

describe('contextTotal — a soma das origens nomeadas', () => {
  it('soma o que cada origem trouxe', () => {
    expect(contextTotal([{ id: 'system', tokens: 400 }, { id: 'history', tokens: 1600 }])).toBe(2000);
  });

  it('lista vazia soma zero, e não NaN', () => {
    expect(contextTotal([])).toBe(0);
  });

  it('parcela inválida conta como zero em vez de contaminar a soma', () => {
    // `countable` recusa negativo, não-finito e ausente. Sem isso um único
    // número ruim vindo de quem mediu viraria `NaN` em toda a repartição, e o
    // desenho inteiro sumiria por causa de uma linha.
    const soma = contextTotal([
      { id: 'ok', tokens: 100 },
      { id: 'negativa', tokens: -50 },
      { id: 'infinita', tokens: Number.POSITIVE_INFINITY },
    ]);
    expect(soma).toBe(100);
  });
});

describe('contextSlices — a repartição que a legenda lê por posição', () => {
  const partes = [
    { id: 'system', tokens: 250 },
    { id: 'history', tokens: 500 },
    { id: 'tools', tokens: 250 },
  ];

  it('divide pelo TOTAL REPARTIDO, nunca por um teto', () => {
    // É a decisão 3 do cabeçalho, e o que separa esta peça da irmã: "de onde
    // veio" se responde sem saber quanto cabe.
    const fatias = contextSlices(partes);
    expect(fatias.map((f) => f.percent)).toEqual([25, 50, 25]);
  });

  it('mantém a ORDEM de quem mediu, e não a do tamanho', () => {
    // Decisão 4. Ordenar por peso faria a legenda trocar de linha entre um
    // turno e o seguinte, e quem lê a legenda a lê por posição — a mesma
    // repartição pareceria outra só porque uma parcela cresceu.
    expect(contextSlices(partes).map((f) => f.id)).toEqual(['system', 'history', 'tools']);
  });

  it('a parcela zerada CONTINUA na lista', () => {
    // Fatia e linha da legenda se emparelham por posição para dividirem a
    // mesma cor. Sumir com a zerada desalinharia as duas listas, e a cor
    // passaria a apontar para a fatia da vizinha — que continua parecendo certa.
    const fatias = contextSlices([
      { id: 'system', tokens: 100 },
      { id: 'attachments', tokens: 0 },
      { id: 'history', tokens: 100 },
    ]);
    expect(fatias.map((f) => f.id)).toEqual(['system', 'attachments', 'history']);
    expect(fatias[1]!.percent).toBe(0);
  });

  it('total zero devolve zeros, e nunca NaN', () => {
    // Dividir por zero na tela aconteceria SEMPRE na primeira vez que alguém
    // abre a peça, que é o pior momento possível.
    const fatias = contextSlices([{ id: 'system', tokens: 0 }, { id: 'history', tokens: 0 }]);
    expect(fatias.every((f) => f.percent === 0 && f.fraction === 0)).toBe(true);
    expect(fatias.some((f) => Number.isNaN(f.percent))).toBe(false);
  });

  it('as duas travas do número lido valem aqui também', () => {
    // Uma parcela com tokens de verdade não sai como 0%, e uma que não é tudo
    // não sai como 100% — é o número que se lê em voz.
    const quaseTudo = contextSlices([{ id: 'history', tokens: 9999 }, { id: 'system', tokens: 1 }]);
    expect(quaseTudo[0]!.percent).toBe(99);
    expect(quaseTudo[1]!.percent).toBe(1);
  });

  it('origem única leva tudo', () => {
    expect(contextSlices([{ id: 'history', tokens: 700 }])[0]!.percent).toBe(100);
  });
});

// ─── A fração que vem de fora ─────────────────────────────────────────────────
//
// As três funções que a peça do custo trouxe. Elas existem porque a razão entre
// dois valores é número puro: dinheiro tem moeda e vira TEXTO antes de chegar
// perto de qualquer conta, mas "quanto do teto já foi" é a mesma pergunta da
// janela, com a mesma resposta.

describe('a fração de um teto gasto, quando o teto não é de tokens', () => {
  it('divide o gasto pelo teto', () => {
    expect(spentFraction(0.42, 1)).toBeCloseTo(0.42, 10);
    expect(spentFraction(1.5, 2)).toBe(0.75);
  });

  it('sem teto declarado não há fração, e a resposta é null', () => {
    // Custo sem orçamento é o caso COMUM, e é o que não pode parecer zero: um
    // trilho vazio lê como "não gastou nada".
    expect(spentFraction(0.42)).toBeNull();
    expect(spentFraction(0.42, 0)).toBeNull();
    expect(spentFraction(0.42, -1)).toBeNull();
    expect(spentFraction(0.42, Number.NaN)).toBeNull();
  });

  it('gasto inválido lê como zero em vez de contaminar a razão', () => {
    expect(spentFraction(Number.NaN, 1)).toBe(0);
    expect(spentFraction(-3, 1)).toBe(0);
  });

  it('passar do teto não passa de uma volta', () => {
    // Mesmo recorte de `usedFraction`, e pelo mesmo motivo: uma barra não passa
    // do trilho, então desenhar 1,24 desenharia 1 sem ninguém ter escolhido.
    expect(1.24 / 1).toBeGreaterThan(1);
    expect(spentFraction(1.24, 1)).toBe(1);
  });
});

// ─── O resto, quando o teto não é de tokens ───────────────────────────────────
//
// A função que a peça da cota trouxe (decisão 8 do cabeçalho). Ela é o PAR de
// `spentFraction` — os mesmos dois números entram nas duas —, e o que este
// bloco segura é o piso em zero: subtração parece dispensar função, e é por
// isso que ela precisa de uma.

describe('o resto de um teto, quando o teto não é de tokens', () => {
  it('subtrai o gasto do teto', () => {
    expect(remainingUnits(32, 50)).toBe(18);
    expect(remainingUnits(0, 50)).toBe(50);
  });

  it('encostar no teto deixa zero, e não um resto de um fio', () => {
    expect(remainingUnits(50, 50)).toBe(0);
  });

  it('passar do teto NÃO deixa resto negativo', () => {
    // Decisão 8: quem passou do teto não tem "menos que nada" de cota, tem cota
    // nenhuma. Sem o piso, esta linha sai `-12` — que é um número que não
    // descreve nada, e é o que uma subtração escrita à mão produz.
    expect(50 - 62).toBeLessThan(0);
    expect(remainingUnits(62, 50)).toBe(0);
  });

  it('teto que não é teto não deixa nada restando', () => {
    // O infinito é quem dá dentes aqui, e o `NaN` sozinho não daria: `NaN` não é
    // maior nem menor que nada, então uma implementação sem `countable` já cairia
    // em zero por acidente. Com o teto infinito, uma implementação sem
    // normalização devolve `Infinity` — e é por isso que os quatro entram juntos.
    for (const notACap of [undefined, 0, -50, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(remainingUnits(32, notACap)).toBe(0);
    }
  });

  it('gasto impossível lê como zero, e o resto continua sendo o teto inteiro', () => {
    // O outro lado de `countable`, e o mesmo do gasto em `spentFraction`: um
    // `NaN` na tela é pior que um zero, porque zero pelo menos se lê.
    for (const notASpend of [Number.NaN, Number.POSITIVE_INFINITY, -3]) {
      expect(remainingUnits(notASpend, 50)).toBe(50);
    }
  });

  it('e o resto concorda com a fração, porque os dois leem os mesmos números', () => {
    // O que este teste segura não é o valor: é que resto zero e fração cheia
    // são a MESMA notícia. Se um deles fosse escrito à parte, uma cota chegaria
    // à tela com barra cheia e "2 restantes", ou com barra pela metade e
    // "0 restantes" — e as duas metades da peça discordariam.
    for (const [spent, cap] of [[0, 50], [32, 50], [50, 50], [62, 50]] as const) {
      expect(remainingUnits(spent, cap) === 0).toBe(spentFraction(spent, cap) === 1);
    }
  });
});

describe('o nível sai de uma fração, e é a MESMA comparação das duas peças', () => {
  it('os limiares valem igual para uma fração que veio de fora', () => {
    // Decisão 6 do cabeçalho: dois limiares fariam "perto do teto" querer dizer
    // uma coisa acima e outra abaixo na mesma tela.
    expect(fractionLevel(0.74)).toBe('normal');
    expect(fractionLevel(BUDGET_WARNING_AT)).toBe('warning');
    expect(fractionLevel(0.89)).toBe('warning');
    expect(fractionLevel(BUDGET_CRITICAL_AT)).toBe('critical');
  });

  it('e a janela lê exatamente essa comparação', () => {
    // O que este teste segura não é o valor: é que as duas leituras vêm da
    // MESMA função. Uma cópia divergiria em silêncio no dia em que um limiar
    // mudasse.
    for (const fracao of [0, 0.5, 0.74, 0.75, 0.89, 0.9, 1]) {
      expect(budgetLevel(usageAt(fracao))).toBe(fractionLevel(fracao));
    }
  });

  it('sem fração não há nível', () => {
    expect(fractionLevel(null)).toBeNull();
  });

  it('fração acima do teto continua sendo aperto, e não some no recorte', () => {
    expect(fractionLevel(1.24)).toBe('critical');
  });

  it('fração impossível lê como zero, e não como aperto', () => {
    // O infinito é quem dá dentes a esta asserção, e o `NaN` sozinho não daria:
    // `NaN` não é maior nem menor que nada, então sem o recorte ele já cairia em
    // `normal` por acidente. O infinito, sem recorte, sai como `critical` — e é
    // por isso que os três valores entram juntos.
    for (const impossible of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(fractionLevel(impossible)).toBe(fractionLevel(0));
      expect(fractionPercent(impossible)).toBe(fractionPercent(0));
    }
  });
});

describe('o por cento de uma fração que veio de fora leva as mesmas travas', () => {
  it('100% só quando está cheio de verdade', () => {
    expect(fractionPercent(0.999)).toBe(99);
    expect(fractionPercent(1)).toBe(100);
    expect(fractionPercent(1.24)).toBe(100);
  });

  it('0% só quando nada foi gasto', () => {
    expect(fractionPercent(0)).toBe(0);
    expect(fractionPercent(0.0001)).toBe(1);
  });

  it('sem fração não há por cento', () => {
    expect(fractionPercent(null)).toBeNull();
  });

  it('e o por cento da janela lê exatamente esta função', () => {
    for (const fracao of [0, 0.36, 0.75, 0.999, 1]) {
      expect(usedPercent(usageAt(fracao))).toBe(fractionPercent(fracao));
    }
  });

  it('fração indefinida sai como zero, e nunca como NaN na tela', () => {
    // Um `NaN` na tela é pior que um zero, porque zero pelo menos se lê — mesma
    // decisão de `countable`, agora do outro lado da conta.
    expect(fractionPercent(Number.NaN)).toBe(0);
    expect(Number.isNaN(fractionPercent(Number.NaN) as number)).toBe(false);
  });
});
