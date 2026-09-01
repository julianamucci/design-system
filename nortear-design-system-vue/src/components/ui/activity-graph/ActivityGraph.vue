<script lang="ts">
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
 * como um trimestre de casas apagadas. A peça só devolve nada quando não há
 * JANELA — ou não há escala, porque aí todo dia pintaria igual.
 *
 * A CASA NÃO É PARADA DE TECLADO. Um ano são 365 paradas de tabulação que não
 * levam a lugar nenhum, e o que a acessibilidade da peça precisava era do NOME
 * de cada casa, não do foco: o nome está lá, dentro de cada uma, em texto que só
 * quem ouve recebe. Ver o bloco da folha, que registra a leitura da triagem que
 * isto corrige.
 *
 * A DIVERGÊNCIA DE API DE FRAMEWORK, e ela é uma só: a CLASSE EXTRA entra por
 * atributo de repasse, e não por uma propriedade `class` declarada — mesma
 * decisão já registrada no `flow-graph` e no `trace-waterfall` desta stack. É a
 * forma desta stack: o Vue funde `class` e `style` de quem chama na raiz do
 * componente sozinho, e declarar a propriedade tiraria a fusão em vez de
 * acrescentar coisa alguma. É o mesmo caminho por onde a story da casa apertada
 * aperta `--activity-graph-cell` no próprio elemento. O resto do contrato — os
 * dias, a janela, a escala e os rótulos — não diverge.
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
  region: string
  /**
   * Quanto aconteceu na janela, visível. `{count}`, `{start}` e `{end}` viram a
   * soma e as duas datas.
   *
   * VISÍVEL, e é decisão: sem ele a grade mostra densidade relativa e nunca diz
   * relativa a quanto — nem qual janela está desenhada, que aqui é dado e não o
   * relógio de hoje.
   */
  total: string
  /** O molde de uma data. `{day}`, `{month}` e `{year}` viram os três pedaços. */
  dateFormat: string
  /** Os doze meses, curtos, para os rótulos de coluna. Janeiro é o primeiro. */
  monthsShort: readonly string[]
  /** Os doze meses, por extenso, para a frase que quem ouve recebe. */
  monthsLong: readonly string[]
  /** Os sete dias da semana, curtos. Domingo é o primeiro. */
  weekdaysShort: readonly string[]
  /** A frase do dia sem atividade. `{date}` vira a data. */
  none: string
  /** A frase do dia com uma ocorrência. `{count}`, `{date}` e `{level}`. */
  one: string
  /** A frase do dia com mais de uma. `{count}`, `{date}` e `{level}`. */
  many: string
  /**
   * A palavra de cada nível, do zero ao teto da escala — uma a mais que os
   * degraus.
   *
   * É o que impede o nível de ser só cor (WCAG 1.4.1, regra 4 da folha). O
   * tamanho do quadrado resolve para quem vê; esta palavra resolve para quem
   * ouve, na casa e na legenda.
   */
  levels: readonly string[]
  /** A ponta fraca da legenda. */
  legendLess: string
  /** A ponta forte da legenda. */
  legendMore: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { ActivityDay, RunStatus } from '@shared/primitives/chat-protocol'
import {
  resolveActivityCalendar,
  type ActivityCalendarCell,
} from '@shared/primitives/activity-calendar'

const props = withDefaults(
  defineProps<{
    /**
     * O que aconteceu, dia a dia. Dia fora da janela sai; dia repetido soma.
     *
     * Pode vir vazio, e vazio não é ausência de resposta: é a resposta de um
     * período em que nada aconteceu.
     */
    days: readonly ActivityDay[]
    /** O primeiro dia da janela, em ano-mês-dia. */
    start: string
    /** O último dia da janela, em ano-mês-dia. */
    end: string
    /**
     * Os degraus da escala, em contagem. Obrigatório — ver o docblock do
     * módulo.
     */
    thresholds: readonly number[]
    /** Em que dia a semana começa, com zero no domingo. */
    weekStart?: number
    /**
     * Em que pé está a execução que escreve a grade.
     *
     * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça
     * se declara ocupada. Receber as cinco palavras e perguntar uma coisa só
     * não é achatamento de dado — um booleano na assinatura obrigaria quem
     * consome a traduzir cinco palavras em duas no ponto da chamada, que é
     * onde a perda aconteceria.
     */
    status?: RunStatus
    labels: ActivityGraphLabels
  }>(),
  { status: 'idle' },
)

/** Os lugares marcados dos moldes de texto. */
const COUNT_PLACEHOLDER = '{count}'
const DATE_PLACEHOLDER = '{date}'
const LEVEL_PLACEHOLDER = '{level}'
const START_PLACEHOLDER = '{start}'
const END_PLACEHOLDER = '{end}'
const DAY_PLACEHOLDER = '{day}'
const MONTH_PLACEHOLDER = '{month}'
const YEAR_PLACEHOLDER = '{year}'

/**
 * A grade pronta para desenhar, ou nada quando não há janela ou não há escala.
 *
 * SEM JANELA, OU SEM ESCALA, NÃO HÁ GRADE. E note o que NÃO é o caso: dias
 * vazios. Uma janela sem atividade nenhuma é a resposta, e devolver nada
 * esconderia exatamente essa informação.
 */
const drawing = computed(() =>
  resolveActivityCalendar(props.days, {
    start: props.start,
    end: props.end,
    thresholds: props.thresholds,
    weekStart: props.weekStart,
  }),
)

/**
 * As três listas já resolvidas fora do template.
 *
 * O `v-if` da raiz garante que nenhuma delas chega à tela com a grade ausente;
 * elas existem separadas para que o template não dependa de estreitamento de
 * tipo dentro de expressão de atributo, que é onde uma mudança de versão da
 * ferramenta de tipos custa um build.
 */
const drawnCells = computed(() => drawing.value?.cells ?? [])
const drawnMonths = computed(() => drawing.value?.months ?? [])
const drawnWeekdays = computed(() => drawing.value?.weekdays ?? [])

/** A escala inteira, do vazio ao nível cheio, para a legenda. */
const scaleLevels = computed(() => {
  const levels = drawing.value?.levels ?? 0
  return Array.from({ length: levels + 1 }, (_, index) => index)
})

/**
 * O TETO DA ESCALA É DADO, e entra por propriedade personalizada porque é dele
 * que a folha tira a fração de tinta de cada nível.
 */
const rootStyle = computed(() => ({
  '--activity-graph-levels': String(drawing.value?.levels ?? 0),
}))

/**
 * A CONTAGEM DE SEMANAS É DADO: `repeat()` aceita a substituição de
 * propriedade personalizada no contador, mas não aceita `calc()` — o número
 * tem de chegar pronto.
 */
const calendarStyle = computed(() => ({
  '--activity-graph-weeks': String(drawing.value?.weeks ?? 0),
}))

/**
 * OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Uma
 * grade que se reanunciasse a cada casa é impossível de ouvir. `undefined`
 * remove o atributo, porque `aria-busy="false"` é uma afirmação a mais que
 * ninguém pediu.
 */
const busy = computed(() => (props.status === 'running' ? 'true' : undefined))

/**
 * A data por extenso, montada a partir do molde do idioma.
 *
 * Montada aqui e não por biblioteca de fuso: o dia já chegou repartido em três
 * números pela conta compartilhada, e o que falta é a ordem em que o idioma os
 * diz — que é exatamente o que um molde resolve.
 */
function formatDate(cell: ActivityCalendarCell): string {
  return props.labels.dateFormat
    .replace(DAY_PLACEHOLDER, String(cell.day))
    .replace(MONTH_PLACEHOLDER, props.labels.monthsLong[cell.month] ?? '')
    .replace(YEAR_PLACEHOLDER, String(cell.year))
}

/** A frase do total: quanto aconteceu, e em que janela. */
const totalText = computed(() => {
  if (!drawing.value) return ''
  return props.labels.total
    .replace(COUNT_PLACEHOLDER, String(drawing.value.total))
    .replace(START_PLACEHOLDER, formatDate(drawing.value.from))
    .replace(END_PLACEHOLDER, formatDate(drawing.value.to))
})

/** A frase de uma casa: a contagem, o dia e a palavra do nível. */
function readingOf(cell: ActivityCalendarCell): string {
  const date = formatDate(cell)
  // O DIA SEM NADA TEM FRASE PRÓPRIA, e não a frase de contagem com um zero
  // dentro: "zero contribuições" e "nada aconteceu" são a mesma informação, e
  // uma delas se ouve.
  if (cell.count === 0) return props.labels.none.replace(DATE_PLACEHOLDER, date)

  const template = cell.count === 1 ? props.labels.one : props.labels.many
  return template
    .replace(COUNT_PLACEHOLDER, String(cell.count))
    .replace(DATE_PLACEHOLDER, date)
    // A PALAVRA DO NÍVEL, e ela é o que impede a força da tinta de ser só cor.
    .replace(LEVEL_PLACEHOLDER, props.labels.levels[cell.level] ?? '')
}

/** A casa da grade, em propriedade personalizada. */
function cellStyle(cell: ActivityCalendarCell) {
  return {
    '--activity-graph-day-column': String(cell.column),
    '--activity-graph-day-row': String(cell.row),
    '--activity-graph-day-level': String(cell.level),
  }
}
</script>

<template>
  <div
    v-if="drawing"
    class="nds-activity-graph"
    data-slot="activity-graph"
    :style="rootStyle"
    :aria-busy="busy"
  >
    <!-- QUANTO ACONTECEU, E EM QUE JANELA — visível de propósito (ver folha). -->
    <p
      class="nds-activity-graph-total"
      data-slot="activity-graph-total"
    >{{ totalText }}</p>

    <!-- ── A camada que rola ────────────────────────────────────────
         O PAR COMPLETO, e ele é o par: `tabindex` sem papel deixaria uma parada
         de teclado anônima, e `aria-label` sobre um `div` sem papel é
         DESCARTADO pelo navegador (`aria-prohibited-attr`) — que foi exatamente
         o defeito de duas peças desta casa. `group` e não `region`: uma página
         de documentação tem dezenas destas, e `region` com nome vira dezenas de
         marcos homônimos. -->
    <div
      class="nds-activity-graph-viewport"
      data-slot="activity-graph-viewport"
      tabindex="0"
      role="group"
      :aria-label="labels.region"
    >
      <div
        class="nds-activity-graph-calendar"
        data-slot="activity-graph-calendar"
        :style="calendarStyle"
      >
        <!-- ── Os rótulos de mês ─────────────────────────────────
             FORA DA LEITURA (decisão 5): eles são âncora para o olho encontrar
             a coluna, e a data inteira já vem dentro de cada casa. -->
        <ol
          class="nds-activity-graph-months"
          data-slot="activity-graph-months"
          aria-hidden="true"
        >
          <li
            v-for="(month, index) in drawnMonths"
            :key="index"
            class="nds-activity-graph-month"
            data-slot="activity-graph-month"
            :style="{
              '--activity-graph-month-column': String(month.column),
              '--activity-graph-month-span': String(month.span),
            }"
          >{{ labels.monthsShort[month.month] ?? '' }}</li>
        </ol>

        <!-- ── Os rótulos de dia da semana ───────────────────────── -->
        <ol
          class="nds-activity-graph-weekdays"
          data-slot="activity-graph-weekdays"
          aria-hidden="true"
        >
          <li
            v-for="(weekday, index) in drawnWeekdays"
            :key="index"
            class="nds-activity-graph-weekday"
            data-slot="activity-graph-weekday"
            :style="{ '--activity-graph-weekday-row': String(weekday.row) }"
          >{{ labels.weekdaysShort[weekday.weekday] ?? '' }}</li>
        </ol>

        <!-- ── As casas ───────────────────────────────────────────
             `<ol>` e não `<ul>`: a ordem é a do calendário, do primeiro dia da
             janela ao último, e ela é a ordem de leitura (decisão 3). A
             posição na grade é para o olho. -->
        <ol
          class="nds-activity-graph-days"
          data-slot="activity-graph-days"
        >
          <li
            v-for="cell in drawnCells"
            :key="cell.date"
            class="nds-activity-graph-day"
            data-slot="activity-graph-day"
            :data-level="String(cell.level)"
            :data-date="cell.date"
            :style="cellStyle(cell)"
          >
            <!-- A LEITURA DA CASA: o dia, a contagem e a palavra do nível. É o
                 que faz a grade se reconstruir de ouvido, e é o que o desenho
                 não diz. -->
            <span
              class="nds-sr-only"
              data-slot="activity-graph-day-reading"
            >{{ readingOf(cell) }}</span>
          </li>
        </ol>
      </div>
    </div>

    <!-- ── A legenda ─────────────────────────────────────────────
         ELA É LIDA, e não é decoração (decisão 4): as duas pontas são texto
         visível, e cada amostra carrega a palavra do seu nível para quem não
         distingue as cinco forças. Sem isso a escala existiria só para quem
         vê. -->
    <div
      class="nds-activity-graph-legend"
      data-slot="activity-graph-legend"
    >
      <span
        class="nds-activity-graph-legend-end"
        data-slot="activity-graph-legend-end"
      >{{ labels.legendLess }}</span>

      <ol
        class="nds-activity-graph-scale"
        data-slot="activity-graph-scale"
      >
        <li
          v-for="level in scaleLevels"
          :key="level"
          class="nds-activity-graph-swatch"
          data-slot="activity-graph-swatch"
          :data-level="String(level)"
          :style="{ '--activity-graph-day-level': String(level) }"
        >
          <span
            class="nds-sr-only"
            data-slot="activity-graph-swatch-reading"
          >{{ labels.levels[level] ?? '' }}</span>
        </li>
      </ol>

      <span
        class="nds-activity-graph-legend-end"
        data-slot="activity-graph-legend-end"
      >{{ labels.legendMore }}</span>
    </div>
  </div>
</template>
