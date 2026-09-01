import type { ActivityDay, RunStatus } from '@shared/primitives/chat-protocol';
import {
  resolveActivityCalendar,
  type ActivityCalendarCell,
} from '@shared/primitives/activity-calendar';

/**
 * Um período de trabalho numa grade de datas: uma casa por dia, uma coluna por
 * semana, a força da tinta dizendo quanto aconteceu.
 *
 * Desenho em `nds/resposta-estruturada.css`, no bloco "Grade de atividade", que
 * também guarda as seis decisões de acessibilidade e as seis regras da família.
 * O vocabulário — `ActivityDay` — vem de `@shared/primitives/chat-protocol`, e a
 * conta de `@shared/primitives/activity-calendar`.
 *
 * POR QUE ELA É PEÇA, e não um tipo a mais no gráfico. O teste não é se a peça
 * existente PODERIA crescer até cobrir a entrada — tudo pode crescer —, é se o
 * DESENHO já existe. Medido antes de construir: o gráfico tem oito tipos e
 * nenhum é mapa de calor, e o calendário desta casa é uma tabela de mês para
 * ESCOLHER data, com navegação e células que são botões. Outra geometria, outro
 * propósito.
 *
 * ELA ABSORVE O MAPA DE CALOR do catálogo, que é a mesma grade sabendo menos: um
 * prop só, sem classe de quem consome, janela fixa nos 365 dias que terminam
 * hoje e cinco cores em hexadecimal puro, sem modo escuro. A própria fonte dele
 * manda quem quiser uma versão restilizável começar por esta.
 *
 * A JANELA É DADO, e é o coração da absorção: nada aqui olha o relógio. Quem
 * monta declara o primeiro e o último dia, e é isso que permite pedir o
 * trimestre passado — e é isso que faz a fotografia da documentação ser a mesma
 * amanhã (§2 da guideline 17: nada aqui agenda relógio de negócio).
 *
 * A ESCALA TAMBÉM É DADO, e obrigatória. Uma escala derivada do maior valor
 * faria a MESMA contagem pintar com forças diferentes em duas grades lado a
 * lado, e comparar duas grades é para o que um mapa de calendário serve.
 *
 * GRADE VAZIA É GRADE, e é a diferença desta peça em relação às duas irmãs da
 * família. Sem nó não há grafo e sem eixo não há cascata, mas uma janela sem
 * atividade nenhuma É a resposta: um trimestre em que nada aconteceu se desenha
 * como um trimestre de casas apagadas. A peça só devolve `null` quando não há
 * JANELA — ou não há escala, porque aí todo dia pintaria igual.
 *
 * A CASA NÃO É PARADA DE TECLADO. Um ano são 365 paradas de tabulação que não
 * levam a lugar nenhum, e o que a acessibilidade da peça precisava era do NOME
 * de cada casa, não do foco: o nome está lá, dentro de cada uma, em texto que só
 * quem ouve recebe. Ver o bloco da folha, que registra a leitura da triagem que
 * isto corrige.
 *
 * O QUE O COMPONENTE NÃO FAZ: olhar o relógio, derivar a escala, medir elemento,
 * animar, abrir dica, contar tempo, buscar nada. Ele desenha os dias que recebe
 * na janela que recebe.
 */

export interface ActivityGraphLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão da família. A grade é mais larga que a conversa,
   * então ela rola, e o que rola é parada de teclado com `tabindex="0"` — sem
   * nome, quem chega ali ouvindo não sabe onde entrou (regra 6 da §8 da
   * guideline 17). Quem monta é quem sabe o nome: duas peças destas na mesma
   * tela com o mesmo nome são duas paradas indistinguíveis.
   */
  region: string;
  /**
   * Quanto aconteceu na janela, visível. `{count}`, `{start}` e `{end}` viram a
   * soma e as duas datas.
   *
   * VISÍVEL, e é decisão: sem ele a grade mostra densidade relativa e nunca diz
   * relativa a quanto — nem qual janela está desenhada, que aqui é dado e não o
   * relógio de hoje.
   */
  total: string;
  /** O molde de uma data. `{day}`, `{month}` e `{year}` viram os três pedaços. */
  dateFormat: string;
  /** Os doze meses, curtos, para os rótulos de coluna. Janeiro é o primeiro. */
  monthsShort: readonly string[];
  /** Os doze meses, por extenso, para a frase que quem ouve recebe. */
  monthsLong: readonly string[];
  /** Os sete dias da semana, curtos. Domingo é o primeiro. */
  weekdaysShort: readonly string[];
  /** A frase do dia sem atividade. `{date}` vira a data. */
  none: string;
  /** A frase do dia com uma ocorrência. `{count}`, `{date}` e `{level}`. */
  one: string;
  /** A frase do dia com mais de uma. `{count}`, `{date}` e `{level}`. */
  many: string;
  /**
   * A palavra de cada nível, do zero ao teto da escala — uma a mais que os
   * degraus.
   *
   * É o que impede o nível de ser só cor (WCAG 1.4.1, regra 4 da folha). O
   * tamanho do quadrado resolve para quem vê; esta palavra resolve para quem
   * ouve, na casa e na legenda.
   */
  levels: readonly string[];
  /** A ponta fraca da legenda. */
  legendLess: string;
  /** A ponta forte da legenda. */
  legendMore: string;
}

export interface ActivityGraphOptions {
  /**
   * O que aconteceu, dia a dia. Dia fora da janela sai; dia repetido soma.
   *
   * Pode vir vazio, e vazio não é ausência de resposta: é a resposta de um
   * período em que nada aconteceu.
   */
  days: readonly ActivityDay[];
  /** O primeiro dia da janela, em ano-mês-dia. */
  start: string;
  /** O último dia da janela, em ano-mês-dia. */
  end: string;
  /**
   * Os degraus da escala, em contagem. Obrigatório — ver o docblock do módulo.
   */
  thresholds: readonly number[];
  /** Em que dia a semana começa, com zero no domingo. */
  weekStart?: number;
  /**
   * Em que pé está a execução que escreve a grade.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça se
   * declara ocupada. Receber as cinco palavras e perguntar uma coisa só não é
   * achatamento de dado — um booleano na assinatura obrigaria quem consome a
   * traduzir cinco palavras em duas no ponto da chamada, que é onde a perda
   * aconteceria.
   */
  status?: RunStatus;
  labels: ActivityGraphLabels;
  class?: string;
}

/** Os lugares marcados dos moldes de texto. */
const COUNT_PLACEHOLDER = '{count}';
const DATE_PLACEHOLDER = '{date}';
const LEVEL_PLACEHOLDER = '{level}';
const START_PLACEHOLDER = '{start}';
const END_PLACEHOLDER = '{end}';
const DAY_PLACEHOLDER = '{day}';
const MONTH_PLACEHOLDER = '{month}';
const YEAR_PLACEHOLDER = '{year}';

/**
 * A data por extenso, montada a partir do molde do idioma.
 *
 * Montada aqui e não por biblioteca de fuso: o dia já chegou repartido em três
 * números pela conta compartilhada, e o que falta é a ordem em que o idioma os
 * diz — que é exatamente o que um molde resolve. Trazer formatação de data para
 * dentro da peça traria calendário, fuso e localidade junto, e nenhum dos três é
 * assunto de uma grade de casas.
 */
function formatDate(cell: ActivityCalendarCell, labels: ActivityGraphLabels): string {
  return labels.dateFormat
    .replace(DAY_PLACEHOLDER, String(cell.day))
    .replace(MONTH_PLACEHOLDER, labels.monthsLong[cell.month] ?? '')
    .replace(YEAR_PLACEHOLDER, String(cell.year));
}

/** A frase de uma casa: a contagem, o dia e a palavra do nível. */
function readingOf(cell: ActivityCalendarCell, labels: ActivityGraphLabels): string {
  const date = formatDate(cell, labels);
  // O DIA SEM NADA TEM FRASE PRÓPRIA, e não a frase de contagem com um zero
  // dentro: "zero contribuições" e "nada aconteceu" são a mesma informação, e
  // uma delas se ouve.
  if (cell.count === 0) return labels.none.replace(DATE_PLACEHOLDER, date);

  const template = cell.count === 1 ? labels.one : labels.many;
  return template
    .replace(COUNT_PLACEHOLDER, String(cell.count))
    .replace(DATE_PLACEHOLDER, date)
    // A PALAVRA DO NÍVEL, e ela é o que impede a força da tinta de ser só cor.
    .replace(LEVEL_PLACEHOLDER, labels.levels[cell.level] ?? '');
}

export function createActivityGraph(
  options: ActivityGraphOptions,
): HTMLElement | null {
  const { days, start, end, thresholds, weekStart, status = 'idle', labels } = options;

  const drawing = resolveActivityCalendar(days, { start, end, thresholds, weekStart });
  // SEM JANELA, OU SEM ESCALA, NÃO HÁ GRADE. E note o que NÃO está aqui: dias
  // vazios. Uma janela sem atividade nenhuma é a resposta, e devolver nada
  // esconderia exatamente essa informação.
  if (!drawing) return null;

  const root = document.createElement('div');
  root.dataset.slot = 'activity-graph';
  root.className = ['nds-activity-graph', options.class].filter(Boolean).join(' ');
  // O TETO DA ESCALA É DADO, e entra por propriedade personalizada porque é dele
  // que a folha tira a fração de tinta de cada nível (regra 2 da folha).
  root.style.setProperty('--activity-graph-levels', String(drawing.levels));

  // OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Uma
  // grade que se reanunciasse a cada casa é impossível de ouvir.
  if (status === 'running') root.setAttribute('aria-busy', 'true');

  // ── Quanto aconteceu, e em que janela ───────────────────────────────────────
  const total = document.createElement('p');
  total.className = 'nds-activity-graph-total';
  total.dataset.slot = 'activity-graph-total';
  total.textContent = labels.total
    .replace(COUNT_PLACEHOLDER, String(drawing.total))
    .replace(START_PLACEHOLDER, formatDate(drawing.from, labels))
    .replace(END_PLACEHOLDER, formatDate(drawing.to, labels));
  root.appendChild(total);

  // ── A camada que rola ───────────────────────────────────────────────────────
  //
  // O PAR COMPLETO, e ele é o par: `tabindex` sem papel deixaria uma parada de
  // teclado anônima, e `aria-label` sobre um `div` sem papel é DESCARTADO pelo
  // navegador (`aria-prohibited-attr`) — que foi exatamente o defeito de duas
  // peças desta casa. `group` e não `region`: uma página de documentação tem
  // dezenas destas, e `region` com nome vira dezenas de marcos homônimos.
  const viewport = document.createElement('div');
  viewport.className = 'nds-activity-graph-viewport';
  viewport.dataset.slot = 'activity-graph-viewport';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-label', labels.region);

  const calendar = document.createElement('div');
  calendar.className = 'nds-activity-graph-calendar';
  calendar.dataset.slot = 'activity-graph-calendar';
  // A CONTAGEM DE SEMANAS É DADO: `repeat()` aceita a substituição de
  // propriedade personalizada no contador, mas não aceita `calc()` — o número
  // tem de chegar pronto.
  calendar.style.setProperty('--activity-graph-weeks', String(drawing.weeks));

  // ── Os rótulos de mês ───────────────────────────────────────────────────────
  //
  // FORA DA LEITURA (decisão 5): eles são âncora para o olho encontrar a coluna,
  // e a data inteira já vem dentro de cada casa.
  const months = document.createElement('ol');
  months.className = 'nds-activity-graph-months';
  months.dataset.slot = 'activity-graph-months';
  months.setAttribute('aria-hidden', 'true');
  for (const month of drawing.months) {
    const item = document.createElement('li');
    item.className = 'nds-activity-graph-month';
    item.dataset.slot = 'activity-graph-month';
    item.style.setProperty('--activity-graph-month-column', String(month.column));
    item.style.setProperty('--activity-graph-month-span', String(month.span));
    item.textContent = labels.monthsShort[month.month] ?? '';
    months.appendChild(item);
  }
  calendar.appendChild(months);

  // ── Os rótulos de dia da semana ─────────────────────────────────────────────
  const weekdays = document.createElement('ol');
  weekdays.className = 'nds-activity-graph-weekdays';
  weekdays.dataset.slot = 'activity-graph-weekdays';
  weekdays.setAttribute('aria-hidden', 'true');
  for (const weekday of drawing.weekdays) {
    const item = document.createElement('li');
    item.className = 'nds-activity-graph-weekday';
    item.dataset.slot = 'activity-graph-weekday';
    item.style.setProperty('--activity-graph-weekday-row', String(weekday.row));
    item.textContent = labels.weekdaysShort[weekday.weekday] ?? '';
    weekdays.appendChild(item);
  }
  calendar.appendChild(weekdays);

  // ── As casas ────────────────────────────────────────────────────────────────
  //
  // `<ol>` e não `<ul>`: a ordem é a do calendário, do primeiro dia da janela ao
  // último, e ela é a ordem de leitura (decisão 3). A posição na grade é para o
  // olho.
  const list = document.createElement('ol');
  list.className = 'nds-activity-graph-days';
  list.dataset.slot = 'activity-graph-days';

  for (const cell of drawing.cells) {
    const item = document.createElement('li');
    item.className = 'nds-activity-graph-day';
    item.dataset.slot = 'activity-graph-day';
    // O NÍVEL É ESTADO, lido por atributo, e é ele que separa a casa apagada das
    // pintadas. A data é o endereço, e é por ela que quem compõe uma dica
    // encontra o dia.
    item.dataset.level = String(cell.level);
    item.dataset.date = cell.date;
    item.style.setProperty('--activity-graph-day-column', String(cell.column));
    item.style.setProperty('--activity-graph-day-row', String(cell.row));
    // A FORÇA DA TINTA É DADO, e a conta que a transforma em tamanho e em
    // opacidade mora na folha (regra 2 da folha).
    item.style.setProperty('--activity-graph-day-level', String(cell.level));

    // A LEITURA DA CASA: o dia, a contagem e a palavra do nível. É o que faz a
    // grade se reconstruir de ouvido, e é o que o desenho não diz.
    const reading = document.createElement('span');
    reading.className = 'nds-sr-only';
    reading.dataset.slot = 'activity-graph-day-reading';
    reading.textContent = readingOf(cell, labels);
    item.appendChild(reading);

    list.appendChild(item);
  }

  calendar.appendChild(list);
  viewport.appendChild(calendar);
  root.appendChild(viewport);

  // ── A legenda ───────────────────────────────────────────────────────────────
  //
  // ELA É LIDA, e não é decoração (decisão 4): as duas pontas são texto visível,
  // e cada amostra carrega a palavra do seu nível para quem não distingue as
  // forças. Sem isso a escala existiria só para quem vê.
  const legend = document.createElement('div');
  legend.className = 'nds-activity-graph-legend';
  legend.dataset.slot = 'activity-graph-legend';

  const less = document.createElement('span');
  less.className = 'nds-activity-graph-legend-end';
  less.dataset.slot = 'activity-graph-legend-end';
  less.textContent = labels.legendLess;
  legend.appendChild(less);

  const scale = document.createElement('ol');
  scale.className = 'nds-activity-graph-scale';
  scale.dataset.slot = 'activity-graph-scale';
  for (let level = 0; level <= drawing.levels; level += 1) {
    const swatch = document.createElement('li');
    swatch.className = 'nds-activity-graph-swatch';
    swatch.dataset.slot = 'activity-graph-swatch';
    swatch.dataset.level = String(level);
    swatch.style.setProperty('--activity-graph-day-level', String(level));

    const word = document.createElement('span');
    word.className = 'nds-sr-only';
    word.dataset.slot = 'activity-graph-swatch-reading';
    word.textContent = labels.levels[level] ?? '';
    swatch.appendChild(word);

    scale.appendChild(swatch);
  }
  legend.appendChild(scale);

  const more = document.createElement('span');
  more.className = 'nds-activity-graph-legend-end';
  more.dataset.slot = 'activity-graph-legend-end';
  more.textContent = labels.legendMore;
  legend.appendChild(more);

  root.appendChild(legend);
  return root;
}
