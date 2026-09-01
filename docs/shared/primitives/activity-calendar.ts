/**
 * A conta da grade de atividade: em que casa de calendário cada dia cai, com que
 * força ele é pintado, onde cada rótulo de mês começa e quantos dias houve.
 *
 * Sem framework, sem DOM. É a mesma divisão de `chat-scroll.ts`, de
 * `flow-graph-edges.ts` e de `trace-waterfall-axis.ts`: `chat-protocol.ts` é o
 * VOCABULÁRIO — `ActivityDay` —, e este módulo é a CONTA que cinco stacks fariam
 * de cinco maneiras.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A DECISÃO QUE ESTAVA DEFERIDA: contagem em nível MERECE primitivo, e não
 * merece arquivo próprio.
 *
 * O critério da §3.2 da guideline 17 é "regra que caiba em duas frases e renda
 * cinco `if`", e `activityLevel` é o caso mais literal dele em toda a campanha:
 * o nível é quantos degraus da escala a contagem alcança, e escrito cinco vezes
 * ele diverge nas bordas — no dia de contagem zero, no dia que empata com o
 * degrau, na escala fora de ordem. Cinco divergências dessas não aparecem em
 * teste: aparecem como a mesma contagem pintada com forças diferentes em duas
 * stacks, e ninguém consegue atribuir isso a nada.
 *
 * O que ele NÃO merece é morar sozinho. Um módulo com uma função de três linhas
 * é exatamente o que a §3.2 dispensou ao matar `diff-hunks.ts` — primitivo que
 * perde as tarefas não nasce menor, não nasce. Aqui ele não perde tarefa
 * nenhuma: ele é UM CAMPO da casa resolvida, e a casa já precisa de coluna,
 * linha, rótulo de mês e total. Ele é exportado com nome próprio porque a regra
 * é dele, e mora ao lado da geometria porque é ali que ela é usada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AS DECISÕES QUE CINCO STACKS REESCREVERIAM
 *
 *   · A JANELA CHEGA DE FORA. `start` e `end` são declarados, e não "os últimos
 *     365 dias que terminam hoje". Uma janela presa ao relógio é um relógio de
 *     negócio dentro do componente (§2 da guideline 17), e é o defeito exato da
 *     fonte que esta peça absorve: lá a janela é fixa e não há como mostrar o
 *     ano passado. Fim antes do começo não é janela, e a conta devolve nada.
 *   · A GRADE COMEÇA NO COMEÇO DA SEMANA. A primeira coluna é a semana que
 *     CONTÉM o começo da janela, e não o começo dela — sem isso as linhas
 *     deixariam de ser dias da semana, que é a leitura inteira de um mapa de
 *     calendário. Os dias anteriores ao começo simplesmente não são desenhados.
 *   · O DIA REPETIDO SOMA. Duas entradas para a mesma data são duas medições do
 *     mesmo dia; ficar com a última perderia dado em silêncio, e ficar com a
 *     maior seria uma afirmação que ninguém fez.
 *   · O DIA FORA DA JANELA SAI, e não é erro: é quem passou o ano inteiro e
 *     pediu um trimestre.
 *   · O RÓTULO DE MÊS NÃO DIVIDE COLUNA COM O ANTERIOR. Um mês curto numa janela
 *     apertada começa na mesma semana do vizinho, e dois rótulos na mesma casa se
 *     sobrepõem — o que se lê ali vira nada. Ele espera a coluna seguinte, e só
 *     fica sem rótulo o mês que não chega a ocupar coluna própria.
 *   · O RÓTULO DE DIA DA SEMANA É ALTERNADO. Sete rótulos na altura de sete
 *     casas não cabem em fonte nenhuma; três cabem, e três bastam para ancorar a
 *     leitura das outras quatro.
 *
 * GRADE VAZIA É GRADE, e essa é a diferença em relação às duas irmãs desta
 * família. Sem nó não há grafo e sem eixo não há cascata, mas uma janela sem
 * atividade nenhuma É a resposta: um trimestre em que nada aconteceu se desenha
 * como um trimestre de casas apagadas, e devolver nada esconderia justamente
 * essa informação. A conta só devolve `null` quando a JANELA não existe.
 *
 * A DATA É CONTADA EM UTC, DO PRIMEIRO AO ÚLTIMO PASSO. `new Date('2026-03-04')`
 * é lido como meia-noite UTC, mas `getDay()` devolve o dia da semana LOCAL — e a
 * oeste de Greenwich isso é o dia anterior. O par silencioso desloca a grade
 * inteira em uma casa para quem estiver do lado errado do mundo, e não reprova
 * em teste nenhum rodado em Greenwich. Aqui a data vira um número de dias desde
 * a época e nunca mais volta a ser `Date`.
 *
 * O QUE NÃO MORA AQUI: formatação. Este módulo não escreve "4 de março" nem
 * escolhe nome de mês — número e índice são dado, e a frase que os apresenta é
 * do idioma, em `translations.json`.
 *
 * Derivado do catálogo Elements da assistant-ui (MIT) — o desenho e a escala.
 */

import type { ActivityDay } from './chat-protocol';

/** Quantos milissegundos tem um dia. */
const DAY_MS = 86_400_000;

/**
 * O deslocamento entre o dia zero da época e o domingo.
 *
 * 1970-01-01 foi uma quinta-feira, que é o índice 4 numa semana que começa no
 * domingo. É o que transforma número de dia em dia da semana sem tocar em
 * `Date` outra vez.
 */
const EPOCH_WEEKDAY = 4;

/** Quantos dias da semana uma semana tem. Escrito porque a conta o usa três vezes. */
const WEEK = 7;

/**
 * A cada quantas linhas um dia da semana ganha rótulo visível.
 *
 * Duas, começando pela SEGUNDA linha: sete rótulos na altura de sete casas não
 * cabem em fonte nenhuma, e três âncoras bastam para a leitura das outras
 * quatro. Começar pela segunda e não pela primeira é o que deixa a de cima livre
 * para o rótulo de mês respirar.
 */
const WEEKDAY_LABEL_STEP = 2;

/** Um dia em ano-mês-dia vira número de dias desde a época, ou nada. */
function toDayNumber(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const stamp = Date.UTC(year, month - 1, day);
  // Data que não existe — 31 de fevereiro — transborda para o mês seguinte, e o
  // silêncio disso seria uma casa desenhada num dia que ninguém mediu.
  const back = new Date(stamp);
  if (back.getUTCFullYear() !== year || back.getUTCMonth() !== month - 1) return null;
  if (back.getUTCDate() !== day) return null;
  return Math.round(stamp / DAY_MS);
}

/** O dia da semana de um número de dia, com zero no domingo. */
function weekdayOf(dayNumber: number): number {
  return (((dayNumber + EPOCH_WEEKDAY) % WEEK) + WEEK) % WEEK;
}

/** O mês (zero a onze) de um número de dia. */
function monthOf(dayNumber: number): number {
  return new Date(dayNumber * DAY_MS).getUTCMonth();
}

/** O dia do mês de um número de dia. */
function dayOfMonth(dayNumber: number): number {
  return new Date(dayNumber * DAY_MS).getUTCDate();
}

/** O ano de um número de dia. */
function yearOf(dayNumber: number): number {
  return new Date(dayNumber * DAY_MS).getUTCFullYear();
}

/**
 * O NÍVEL DE UMA CONTAGEM contra uma escala: quantos degraus dela a contagem
 * alcança.
 *
 * Duas frases, e é por isso que ela é primitivo (ver o cabeçalho). Zero degraus
 * alcançados é o nível zero, que é "não houve o bastante para pintar" — e nunca
 * "não houve", porque uma escala pode começar acima de um.
 *
 * A ESCALA NÃO PRECISA CHEGAR ORDENADA. A conta soma degraus alcançados em vez
 * de procurar o primeiro que falha, então uma escala fora de ordem devolve o
 * mesmo nível que a mesma escala ordenada. É de graça, e tira do caminho a única
 * maneira silenciosa de errar aqui.
 *
 * CONTAGEM NEGATIVA É NÍVEL ZERO, porque nenhum degrau positivo é alcançado por
 * ela — e não porque alguém a tenha tratado.
 */
export function activityLevel(count: number, thresholds: readonly number[]): number {
  let level = 0;
  for (const threshold of thresholds) if (count >= threshold) level += 1;
  return level;
}

/** Uma casa da grade: o dia que ela mostra e onde ela cai. */
export interface ActivityCalendarCell {
  /** O dia, em ano-mês-dia, como quem monta o escreveu. */
  date: string;
  /** Quanto aconteceu nele. Zero para o dia que não veio na lista. */
  count: number;
  /** A força da tinta, de zero ao número de degraus da escala. */
  level: number;
  /** A linha de grade da coluna — a semana —, contada a partir de UM. */
  column: number;
  /** A linha de grade da linha — o dia da semana —, contada a partir de UM. */
  row: number;
  /** O dia do mês, para a frase que quem ouve recebe. */
  day: number;
  /** O mês, de zero a onze, para escolher o nome no idioma. */
  month: number;
  /** O ano. */
  year: number;
}

/** Um rótulo de mês, e as colunas que ele cobre. */
export interface ActivityCalendarMonth {
  /** O mês, de zero a onze. */
  month: number;
  /** A coluna em que o rótulo começa, contada a partir de um. */
  column: number;
  /** Quantas colunas ele cobre. */
  span: number;
}

/** Um rótulo de dia da semana, e a linha em que ele cai. */
export interface ActivityCalendarWeekday {
  /** O dia da semana, com zero no domingo — o índice do nome no idioma. */
  weekday: number;
  /** A linha de grade, contada a partir de um. */
  row: number;
}

/** A grade pronta para desenhar. */
export interface ActivityCalendarDrawing {
  /** Quantas colunas a grade tem. Uma por semana. */
  weeks: number;
  /** Quantos degraus a escala tem. É o teto do nível. */
  levels: number;
  /** Quanto aconteceu na janela inteira. */
  total: number;
  /** O primeiro e o último dia da janela, para a frase do total. */
  from: ActivityCalendarCell;
  to: ActivityCalendarCell;
  cells: readonly ActivityCalendarCell[];
  months: readonly ActivityCalendarMonth[];
  weekdays: readonly ActivityCalendarWeekday[];
}

/** A janela e a escala. Tudo declarado, nada derivado do relógio. */
export interface ActivityCalendarOptions {
  /** O primeiro dia da janela, em ano-mês-dia. */
  start: string;
  /** O último dia da janela, em ano-mês-dia. */
  end: string;
  /**
   * Os degraus da escala, em contagem.
   *
   * OBRIGATÓRIO, e é decisão. Uma escala derivada do maior valor faria a MESMA
   * contagem pintar com forças diferentes em duas grades lado a lado, e a
   * comparação entre elas — que é para o que um mapa de calendário serve —
   * deixaria de valer. Um padrão silencioso pareceria gentileza e produziria
   * exatamente isso, num domínio que o design system não conhece: dez commits e
   * dez erros não são a mesma escala.
   */
  thresholds: readonly number[];
  /** Em que dia a semana começa, com zero no domingo. */
  weekStart?: number;
}

/**
 * A grade pronta para desenhar, ou `null` quando não há janela.
 *
 * `null` só nesses casos, e não quando não há atividade: janela sem atividade
 * nenhuma É a resposta, e devolver nada esconderia a informação. Sem escala
 * também não há grade, porque sem degrau todo dia pintaria igual e a peça
 * deixaria de dizer alguma coisa.
 */
export function resolveActivityCalendar(
  days: readonly ActivityDay[],
  options: ActivityCalendarOptions,
): ActivityCalendarDrawing | null {
  const { thresholds } = options;
  if (thresholds.length === 0) return null;

  const start = toDayNumber(options.start);
  const end = toDayNumber(options.end);
  if (start === null || end === null || end < start) return null;

  const weekStart = ((Math.round(options.weekStart ?? 0) % WEEK) + WEEK) % WEEK;

  // A GRADE COMEÇA NA SEMANA QUE CONTÉM O COMEÇO, e não no começo: sem isso as
  // linhas deixariam de ser dias da semana.
  const offsetOfStart = (((weekdayOf(start) - weekStart) % WEEK) + WEEK) % WEEK;
  const gridStart = start - offsetOfStart;

  // DIA REPETIDO SOMA: duas entradas para a mesma data são duas medições do
  // mesmo dia, e ficar com uma perderia dado em silêncio.
  const counts = new Map<number, number>();
  for (const day of days) {
    const number = toDayNumber(day.date);
    // DIA FORA DA JANELA SAI, e não é erro: é quem passou o ano e pediu um
    // trimestre. Data ilegível sai pelo mesmo caminho.
    if (number === null || number < start || number > end) continue;
    counts.set(number, (counts.get(number) ?? 0) + day.count);
  }

  const cells: ActivityCalendarCell[] = [];
  const months: ActivityCalendarMonth[] = [];
  let total = 0;
  let weeks = 0;

  for (let number = start; number <= end; number += 1) {
    const column = Math.floor((number - gridStart) / WEEK) + 1;
    const row = (((weekdayOf(number) - weekStart) % WEEK) + WEEK) % WEEK + 1;
    const count = counts.get(number) ?? 0;
    total += count;
    if (column > weeks) weeks = column;

    cells.push({
      // A data volta na forma em que entrou, e é reconstruída e não guardada:
      // duas entradas para o mesmo dia somaram numa casa só, e escolher qual das
      // duas cadeias sobrevive seria escolher por sorteio.
      date: `${String(yearOf(number)).padStart(4, '0')}-${String(monthOf(number) + 1).padStart(2, '0')}-${String(dayOfMonth(number)).padStart(2, '0')}`,
      count,
      level: activityLevel(count, thresholds),
      column,
      row,
      day: dayOfMonth(number),
      month: monthOf(number),
      year: yearOf(number),
    });

    const month = monthOf(number);
    const last = months[months.length - 1];
    if (!last || last.month !== month) {
      // O RÓTULO QUE CAIRIA NA MESMA COLUNA DO ANTERIOR ESPERA A COLUNA
      // SEGUINTE: dois rótulos na mesma casa se sobrepõem, e o que se lê ali
      // vira nada. Esperar e não sumir é o que se ganha por tentar de novo a
      // cada dia — o mês recebe o rótulo na sua segunda semana, e só fica sem
      // rótulo o mês que não chega a ocupar coluna própria.
      if (last && last.column === column) continue;
      if (last) last.span = column - last.column;
      months.push({ month, column, span: 1 });
    }
  }

  const lastMonth = months[months.length - 1];
  if (lastMonth) lastMonth.span = weeks - lastMonth.column + 1;

  // O RÓTULO DE DIA DA SEMANA É ALTERNADO: sete não cabem na altura de sete
  // casas, e três âncoras bastam.
  const weekdays: ActivityCalendarWeekday[] = [];
  for (let row = WEEKDAY_LABEL_STEP; row <= WEEK; row += WEEKDAY_LABEL_STEP) {
    weekdays.push({ weekday: (weekStart + row - 1) % WEEK, row });
  }

  return {
    weeks,
    levels: thresholds.length,
    total,
    from: cells[0],
    to: cells[cells.length - 1],
    cells,
    months,
    weekdays,
  };
}
