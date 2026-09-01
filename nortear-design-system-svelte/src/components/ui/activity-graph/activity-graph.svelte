<script lang="ts" module>
  // ─── ActivityGraph ─────────────────────────────────────────────────────────
  //
  // Um período de trabalho numa grade de datas: uma casa por dia, uma coluna
  // por semana, a força da tinta dizendo quanto aconteceu.
  //
  // Desenho em `nds/resposta-estruturada.css`, no bloco "Grade de atividade",
  // que também guarda as seis decisões de acessibilidade e as seis regras da
  // família. O vocabulário — `ActivityDay` — vem de
  // `@shared/primitives/chat-protocol`, e a conta de
  // `@shared/primitives/activity-calendar`.
  //
  // POR QUE ELA É PEÇA, e não um tipo a mais no gráfico. O teste não é se a
  // peça existente PODERIA crescer até cobrir a entrada — tudo pode crescer —,
  // é se o DESENHO já existe. Medido antes de construir: o gráfico tem oito
  // tipos e nenhum é mapa de calor, e o calendário desta casa é uma tabela de
  // mês para ESCOLHER data, com navegação e células que são botões. Outra
  // geometria, outro propósito.
  //
  // ELA ABSORVE O MAPA DE CALOR do catálogo, que é a mesma grade sabendo
  // menos: um prop só, sem classe de quem consome, janela fixa nos 365 dias
  // que terminam hoje e cinco cores em hexadecimal puro, sem modo escuro. A
  // própria fonte dele manda quem quiser uma versão restilizável começar por
  // esta.
  //
  // A JANELA É DADO, e é o coração da absorção: nada aqui olha o relógio. Quem
  // monta declara o primeiro e o último dia, e é isso que permite pedir o
  // trimestre passado — e é isso que faz a fotografia da documentação ser a
  // mesma amanhã (§2 da guideline 17: nada aqui agenda relógio de negócio).
  //
  // A ESCALA TAMBÉM É DADO, e obrigatória. Uma escala derivada do maior valor
  // faria a MESMA contagem pintar com forças diferentes em duas grades lado a
  // lado, e comparar duas grades é para o que um mapa de calendário serve.
  //
  // GRADE VAZIA É GRADE, e é a diferença desta peça em relação às duas irmãs
  // da família. Sem nó não há grafo e sem eixo não há cascata, mas uma janela
  // sem atividade nenhuma É a resposta: um trimestre em que nada aconteceu se
  // desenha como um trimestre de casas apagadas. A peça só devolve nada
  // quando não há JANELA — ou não há escala, porque aí todo dia pintaria
  // igual.
  //
  // A CASA NÃO É PARADA DE TECLADO. Um ano são 365 paradas de tabulação que
  // não levam a lugar nenhum, e o que a acessibilidade da peça precisava era
  // do NOME de cada casa, não do foco: o nome está lá, dentro de cada uma, em
  // texto que só quem ouve recebe.
  //
  // O QUE O COMPONENTE NÃO FAZ: olhar o relógio, derivar a escala, medir
  // elemento, animar, abrir dica, contar tempo, buscar nada. Ele desenha os
  // dias que recebe na janela que recebe.
  //
  // DIVERGÊNCIA DE API, em relação à referência, e ela se REGISTRA em vez de
  // se "alinhar" (§4.1 da guideline 17): lá a peça é uma fábrica que recebe um
  // objeto de opções e devolve o elemento — ou `null`, quando não há grade.
  // Aqui ela é um componente, as opções são props com os MESMOS nomes, e o
  // "devolve nada" vira um `{#if}` que não desenha marcação nenhuma. Markup,
  // classes `.nds-*`, `data-slot` e ARIA são os mesmos.
  import type { ActivityDay } from '@shared/primitives/chat-protocol';

  export interface ActivityGraphLabels {
    /**
     * O nome da camada que rola.
     *
     * OBRIGATÓRIO, e é decisão da família. A grade é mais larga que a
     * conversa, então ela rola, e o que rola é parada de teclado com
     * `tabindex="0"` — sem nome, quem chega ali ouvindo não sabe onde entrou.
     * Quem monta é quem sabe o nome: duas peças destas na mesma tela com o
     * mesmo nome são duas paradas indistinguíveis.
     */
    region: string;
    /**
     * Quanto aconteceu na janela, visível. `{count}`, `{start}` e `{end}`
     * viram a soma e as duas datas.
     *
     * VISÍVEL, e é decisão: sem ele a grade mostra densidade relativa e nunca
     * diz relativa a quanto — nem qual janela está desenhada, que aqui é dado
     * e não o relógio de hoje.
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
     * tamanho do quadrado resolve para quem vê; esta palavra resolve para
     * quem ouve, na casa e na legenda.
     */
    levels: readonly string[];
    /** A ponta fraca da legenda. */
    legendLess: string;
    /** A ponta forte da legenda. */
    legendMore: string;
  }
</script>

<script lang="ts">
  import type { RunStatus } from '@shared/primitives/chat-protocol';
  import {
    resolveActivityCalendar,
    type ActivityCalendarCell,
  } from '@shared/primitives/activity-calendar';
  import { cn } from '@/lib/utils.js';

  const {
    days,
    start,
    end,
    thresholds,
    weekStart,
    status = 'idle',
    labels,
    class: className,
  }: {
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
     * Os degraus da escala, em contagem.
     *
     * OBRIGATÓRIO, e é decisão — ver o docblock do módulo. Uma escala
     * derivada do maior valor faria a MESMA contagem pintar com forças
     * diferentes em duas grades lado a lado.
     */
    thresholds: readonly number[];
    /** Em que dia a semana começa, com zero no domingo. */
    weekStart?: number;
    /**
     * Em que pé está a execução que escreve a grade.
     *
     * Usado para uma pergunta só: ela ainda corre? É ela que decide se a
     * peça se declara ocupada. Receber as cinco palavras e perguntar uma
     * coisa só não é achatamento de dado — um booleano na assinatura
     * obrigaria quem consome a traduzir cinco palavras em duas no ponto da
     * chamada, que é onde a perda aconteceria.
     */
    status?: RunStatus;
    labels: ActivityGraphLabels;
    class?: string;
  } = $props();

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
   * A conta inteira, e ela mora no compartilhado.
   *
   * `resolveActivityCalendar` encaixa cada dia na semana que o contém, soma
   * dia repetido e resolve o nível contra a escala — cinco stacks fazendo
   * cada uma a sua dariam cinco grades diferentes para o mesmo período.
   *
   * SEM JANELA, OU SEM ESCALA, NÃO HÁ GRADE, e a conta devolve `null`. E note
   * o que NÃO está aqui: dias vazios. Uma janela sem atividade nenhuma é a
   * resposta, e devolver nada esconderia exatamente essa informação.
   */
  const drawing = $derived(resolveActivityCalendar(days, { start, end, thresholds, weekStart }));

  /**
   * A data por extenso, montada a partir do molde do idioma.
   *
   * Montada aqui e não por biblioteca de fuso: o dia já chegou repartido em
   * três números pela conta compartilhada, e o que falta é a ordem em que o
   * idioma os diz — que é exatamente o que um molde resolve.
   */
  function formatDate(cell: ActivityCalendarCell): string {
    return labels.dateFormat
      .replace(DAY_PLACEHOLDER, String(cell.day))
      .replace(MONTH_PLACEHOLDER, labels.monthsLong[cell.month] ?? '')
      .replace(YEAR_PLACEHOLDER, String(cell.year));
  }

  /** A frase de uma casa: a contagem, o dia e a palavra do nível. */
  function readingOf(cell: ActivityCalendarCell): string {
    const date = formatDate(cell);
    // O DIA SEM NADA TEM FRASE PRÓPRIA, e não a frase de contagem com um
    // zero dentro: "zero contribuições" e "nada aconteceu" são a mesma
    // informação, e uma delas se ouve.
    if (cell.count === 0) return labels.none.replace(DATE_PLACEHOLDER, date);

    const template = cell.count === 1 ? labels.one : labels.many;
    return template
      .replace(COUNT_PLACEHOLDER, String(cell.count))
      .replace(DATE_PLACEHOLDER, date)
      // A PALAVRA DO NÍVEL, e ela é o que impede a força da tinta de ser só
      // cor.
      .replace(LEVEL_PLACEHOLDER, labels.levels[cell.level] ?? '');
  }

  function totalText(total: number, from: ActivityCalendarCell, to: ActivityCalendarCell): string {
    return labels.total
      .replace(COUNT_PLACEHOLDER, String(total))
      .replace(START_PLACEHOLDER, formatDate(from))
      .replace(END_PLACEHOLDER, formatDate(to));
  }
</script>

{#if drawing}
  <!--
    O TETO DA ESCALA É DADO, e entra por propriedade personalizada porque é
    dele que a folha tira a fração de tinta de cada nível (regra 2 da folha).

    OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Uma
    grade que se reanunciasse a cada casa é impossível de ouvir.
  -->
  <div
    class={cn('nds-activity-graph', className)}
    data-slot="activity-graph"
    style="--activity-graph-levels: {drawing.levels}"
    aria-busy={status === 'running' ? 'true' : undefined}
  >
    <!--
      QUANTO ACONTECEU, E EM QUE JANELA. Sem ela a grade mostra densidade
      relativa e nunca diz relativa a quanto — nem qual janela está
      desenhada, que aqui é dado e não o relógio de hoje.
    -->
    <p class="nds-activity-graph-total" data-slot="activity-graph-total">
      {totalText(drawing.total, drawing.from, drawing.to)}
    </p>

    <!--
      A CAMADA QUE ROLA, e o PAR COMPLETO — ele é o par: `tabindex` sem papel
      deixaria uma parada de teclado anônima, e `aria-label` sobre um `div`
      sem papel é DESCARTADO pelo navegador (`aria-prohibited-attr`), que foi
      exatamente o defeito de duas peças desta casa. `group` e não `region`:
      uma página de documentação tem dezenas destas, e `region` com nome vira
      dezenas de marcos homônimos.

      A diretiva abaixo cala um falso positivo conhecido: a regra do
      compilador só aceita papel de widget, e nem `region` nem `group` a
      dispensam. Aviso conhecido convivendo com o build é como o repositório
      perde o aviso NOVO.
    -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="nds-activity-graph-viewport"
      data-slot="activity-graph-viewport"
      tabindex="0"
      role="group"
      aria-label={labels.region}
    >
      <div
        class="nds-activity-graph-calendar"
        data-slot="activity-graph-calendar"
        style="--activity-graph-weeks: {drawing.weeks}"
      >
        <!--
          OS RÓTULOS DE MÊS. FORA DA LEITURA (decisão 5): eles são âncora
          para o olho encontrar a coluna, e a data inteira já vem dentro de
          cada casa.
        -->
        <ol class="nds-activity-graph-months" data-slot="activity-graph-months" aria-hidden="true">
          {#each drawing.months as month, index (index)}
            <li
              class="nds-activity-graph-month"
              data-slot="activity-graph-month"
              style="--activity-graph-month-column: {month.column}; --activity-graph-month-span: {month.span}"
            >{labels.monthsShort[month.month] ?? ''}</li>
          {/each}
        </ol>

        <!-- Os rótulos de dia da semana, pelo mesmo motivo. -->
        <ol class="nds-activity-graph-weekdays" data-slot="activity-graph-weekdays" aria-hidden="true">
          {#each drawing.weekdays as weekday, index (index)}
            <li
              class="nds-activity-graph-weekday"
              data-slot="activity-graph-weekday"
              style="--activity-graph-weekday-row: {weekday.row}"
            >{labels.weekdaysShort[weekday.weekday] ?? ''}</li>
          {/each}
        </ol>

        <!--
          AS CASAS. `<ol>` e não `<ul>`: a ordem é a do calendário, do
          primeiro dia da janela ao último, e ela é a ordem de leitura
          (decisão 3, WCAG 1.3.2). A posição na grade é para o olho.

          A chave do `{#each}` é o ÍNDICE: cada casa da grade resolvida
          corresponde a um dia único da janela, e o índice já é estável
          nesta lista.
        -->
        <ol class="nds-activity-graph-days" data-slot="activity-graph-days">
          {#each drawing.cells as cell, index (index)}
            <li
              class="nds-activity-graph-day"
              data-slot="activity-graph-day"
              data-level={cell.level}
              data-date={cell.date}
              style="--activity-graph-day-column: {cell.column}; --activity-graph-day-row: {cell.row}; --activity-graph-day-level: {cell.level}"
            >
              <!--
                A LEITURA DA CASA: o dia, a contagem e a palavra do nível. É
                o que faz a grade se reconstruir de ouvido, e é o que o
                desenho não diz.
              -->
              <span class="nds-sr-only" data-slot="activity-graph-day-reading">{readingOf(cell)}</span>
            </li>
          {/each}
        </ol>
      </div>
    </div>

    <!--
      A LEGENDA. ELA É LIDA, e não é decoração (decisão 4): as duas pontas
      são texto visível, e cada amostra carrega a palavra do seu nível para
      quem não distingue as forças. Sem isso a escala existiria só para quem
      vê.
    -->
    <div class="nds-activity-graph-legend" data-slot="activity-graph-legend">
      <span class="nds-activity-graph-legend-end" data-slot="activity-graph-legend-end">{labels.legendLess}</span>
      <ol class="nds-activity-graph-scale" data-slot="activity-graph-scale">
        {#each Array.from({ length: drawing.levels + 1 }) as _, level (level)}
          <li
            class="nds-activity-graph-swatch"
            data-slot="activity-graph-swatch"
            data-level={level}
            style="--activity-graph-day-level: {level}"
          >
            <span class="nds-sr-only" data-slot="activity-graph-swatch-reading">{labels.levels[level] ?? ''}</span>
          </li>
        {/each}
      </ol>
      <span class="nds-activity-graph-legend-end" data-slot="activity-graph-legend-end">{labels.legendMore}</span>
    </div>
  </div>
{/if}
