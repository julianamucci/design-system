/**
 * A atividade de exemplo das demonstrações, compartilhada pelas cinco stacks.
 *
 * Por que compartilhada, e não escrita em cada stack: `chat-examples.ts` já
 * estabeleceu o motivo, e numa grade de calendário ele pesa como nas duas irmãs.
 * A força de cada casa É a foto — cinco stacks escrevendo as próprias contagens
 * mostrariam cinco mapas diferentes, e a divergência só apareceria no Chromatic,
 * como diferença de layout que ninguém consegue atribuir a nada.
 *
 * SEM I18N, como manda a §3.3 da guideline 17: o que se traduz são os RÓTULOS DA
 * INTERFACE — o nome da camada que rola, os nomes dos meses e dos dias, a frase
 * de cada casa —, e esses moram na `translations.json`. O que está aqui é a
 * medição do exemplo.
 *
 * A JANELA É DECLARADA E FIXA, e é o ponto inteiro da peça: a fonte que ela
 * absorve prende a janela nos 365 dias que terminam HOJE, e uma janela presa ao
 * relógio faz a foto mudar sozinha todo dia. Com a janela em dado, a
 * demonstração fotografa sempre o mesmo trimestre — e é isso que permite
 * comparar duas stacks.
 *
 * A ATIVIDADE É GERADA, e não escrita dia a dia. Noventa datas escritas à mão
 * seriam noventa linhas para ler e nenhuma informação a mais; o que a
 * demonstração precisa é de um padrão que mostre a escala inteira, com fins de
 * semana vazios e picos de meio de semana — que é a forma que um mapa de
 * atividade tem quando ele é de trabalho.
 */

import type { ActivityDay } from './chat-protocol';

/** O primeiro dia da janela de exemplo. */
export const ACTIVITY_START = '2026-01-01';

/** O último dia da janela de exemplo. */
export const ACTIVITY_END = '2026-03-31';

/**
 * Os degraus da escala de exemplo.
 *
 * Quatro degraus, cinco níveis com o zero. É a escala da fonte, e ela é
 * DECLARADA e não derivada: escala derivada do maior valor faria a mesma
 * contagem pintar diferente em duas grades lado a lado.
 */
export const ACTIVITY_THRESHOLDS: readonly number[] = [1, 4, 8, 13];

/** Um dia em ano-mês-dia, a partir do número de dias desde a época. */
function isoOf(dayNumber: number): string {
  const date = new Date(dayNumber * 86_400_000);
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Um trimestre de trabalho, com fins de semana vazios e picos no meio da semana.
 *
 * O padrão é determinístico de propósito — nada de sorteio: a foto tem de ser a
 * mesma em toda rodada e em toda stack, e um gerador com semente ainda seria uma
 * decisão a mais para alguém entender. A conta é o resto de uma divisão, e ela
 * cobre os cinco níveis da escala ao longo do trimestre.
 */
function buildQuarter(): ActivityDay[] {
  const first = Math.round(Date.UTC(2026, 0, 1) / 86_400_000);
  const last = Math.round(Date.UTC(2026, 2, 31) / 86_400_000);
  const days: ActivityDay[] = [];

  for (let number = first; number <= last; number += 1) {
    // 1970-01-01 foi quinta, que é o índice 4 numa semana que começa no domingo.
    const weekday = (((number + 4) % 7) + 7) % 7;
    const index = number - first;
    // Fim de semana vazio, e é o que faz a grade PARECER um calendário de
    // trabalho: duas linhas apagadas em toda coluna.
    const count = weekday === 0 || weekday === 6 ? 0 : (index * 5) % 17;
    days.push({ date: isoOf(number), count });
  }

  return days;
}

/** O trimestre inteiro, com atividade nos cinco níveis. */
export const ACTIVITY_DAYS: readonly ActivityDay[] = buildQuarter();

/**
 * O mesmo trimestre sem atividade nenhuma.
 *
 * Existe porque GRADE VAZIA É GRADE, e é a diferença desta peça em relação às
 * duas irmãs da família: sem nó não há grafo e sem eixo não há cascata, mas um
 * trimestre em que nada aconteceu É a resposta, e se desenha como um trimestre
 * de casas apagadas.
 */
export const ACTIVITY_DAYS_EMPTY: readonly ActivityDay[] = [];

/**
 * Um mês só, para quando a demonstração precisa de uma grade que caiba.
 *
 * A janela é dado, e é isto que a fonte absorvida não sabia fazer: lá ela é fixa
 * nos 365 dias que terminam hoje, e não há como pedir março.
 */
export const ACTIVITY_MONTH_START = '2026-03-01';
export const ACTIVITY_MONTH_END = '2026-03-31';
