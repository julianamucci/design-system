import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import type {
  RunStatus,
  ToolCallState,
  TraceSpan,
} from '@shared/primitives/chat-protocol';
import { resolveTraceWaterfall } from '@shared/primitives/trace-waterfall-axis';

// ─── TraceWaterfall ─────────────────────────────────────────────────────────
//
// O tempo de uma execução repartido entre trechos que se aninham e se
// sobrepõem: uma linha por trecho, uma barra POSICIONADA no eixo comum, e o
// recuo dizendo quem está dentro de quem.
//
// Desenho em docs/shared/styles/nds/resposta-estruturada.css, no bloco
// "Cascata de trechos", que também guarda as oito decisões de acessibilidade e
// as seis regras da família. O vocabulário — TraceSpan, ToolCallState — vem de
// `@shared/primitives/chat-protocol`, e a conta de
// `@shared/primitives/trace-waterfall-axis`.
//
// POR QUE ELA É PEÇA, e não a barra de progresso numa tabela. O que decide é o
// COMEÇO. Medido no repositório antes de construir: `.nds-progress-indicator`
// é uma barra ANCORADA NO ZERO por construção, que preenche a partir do início
// e não sabe começar no meio de um eixo. E a medição do tempo de uma resposta,
// na família 5, não tem eixo nenhum: é um `<dl>` de pares termo/valor. Barra
// com começo é outro desenho, não outra variante.
//
// O EIXO CHEGA DE FORA, e não é derivado dos trechos. É ele que faz as barras
// dividirem uma régua só, e é ele que continua sendo o total verdadeiro quando
// quem monta mostra apenas parte do rastro — derivado, ele encolheria a cada
// trecho retirado e as barras restantes reescalariam, perdendo exatamente a
// posição que a peça existe para mostrar.
//
// A PEÇA NÃO ORDENA. Os trechos saem na ordem em que foram declarados, e não
// ordenados por começo: a ordem no DOM é a ordem de leitura (WCAG 1.3.2), e
// ordenar seria a peça reescrevendo o rastro de quem monta.
//
// O ESTADO É `ToolCallState` INTEIRO, e não os três da fonte. Lá em curso,
// concluído e falhou são três desenhos, e o que se perde é `pending`: o trecho
// que ainda não começou, que num eixo de tempo é justamente o que se quer ver.
//
// NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família. Quem quer revelar
// aos poucos passa MENOS trechos, e o eixo continua o mesmo.
//
// O QUE O COMPONENTE NÃO FAZ: ordenar, derivar o eixo, medir elemento, animar,
// contar tempo, avançar sozinho, buscar nada. Ele desenha os trechos que
// recebe na régua que recebe.
//
// A RAIZ É UM `div`, e por isso o seletor é de ATRIBUTO. A escolha do elemento
// é da folha e não desta stack — mesma escolha do `div[ndsFlowGraph]` e do
// `figure[ndsComputerUse]`.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - SEM TRECHO, OU SEM EIXO, A PEÇA NÃO DESENHA NADA — mas o host continua
//     no documento, e é divergência de framework, não de markup. Onde a
//     fábrica compartilhada devolve `null` e quem monta não chega a inserir
//     elemento nenhum, aqui quem escreve o `<div ndsTraceWaterfall>` é quem
//     consome, e nenhum componente do Angular pode recusar o próprio host. O
//     que a peça faz é não desenhar NADA dentro: sem régua, sem camada que
//     rola, sem parada de teclado e sem `aria-busy`. Sobra um bloco vazio de
//     altura zero, que é o mesmo nada visto da tela — e a razão da guarda
//     continua valendo por inteiro, porque o que ela existe para evitar é a
//     parada de teclado que leva a uma caixa vazia.
//   - as entradas são `input()` de signal, então os trechos chegam por
//     `[spans]="trechos"` e o eixo por `[totalMs]="1200"`.
//   - não há entrada `class`: `class` é nativo do host, e quem consome a
//     escreve direto no elemento. Mesma escolha do grafo.
//   - não há saída nenhuma: a peça não oferece ação, e não há o que avisar.

export interface TraceWaterfallLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão da família. A cascata é mais larga que a
   * conversa, então ela rola, e o que rola é parada de teclado com
   * `tabindex="0"` — sem nome, quem chega ali ouvindo não sabe onde entrou.
   * Quem monta é quem sabe o nome: duas peças destas na mesma tela com o
   * mesmo nome são duas paradas indistinguíveis.
   */
  region: string;
  /**
   * A régua dita em palavras. `{total}` vira o eixo declarado.
   *
   * VISÍVEL, e é decisão: sem ela, "todas as barras contra o mesmo eixo" é
   * uma afirmação que só quem escreveu o dado consegue conferir.
   */
  axis: string;
  /** A duração de cada linha, visível. `{duration}` vira o número. */
  duration: string;
  /**
   * A posição no eixo, para quem não vê a barra. `{start}` e `{duration}`
   * viram os números.
   *
   * É o que faz a cascata inteira se reconstruir de ouvido: percorrida a
   * lista, cada trecho disse onde está, e a sobreposição entre dois deles é
   * dedutível dos números.
   */
  reading: string;
  /**
   * A frase do trecho que não coube no eixo declarado.
   *
   * Existe porque a barra recortada é uma AFIRMAÇÃO A MENOS: quem vê nota que
   * ela encosta na borda; quem ouve receberia a duração inteira sem saber que
   * só parte dela está desenhada.
   */
  clipped: string;
  /**
   * A palavra de cada estado, que é o que chega a quem ouve.
   *
   * A forma resolve para quem vê — a marca ao lado do rótulo e o
   * preenchimento da barra —, e a palavra resolve para quem ouve. Ninguém
   * fica com a cor sozinha (WCAG 1.4.1).
   */
  state: Record<ToolCallState, string>;
}

/** Os lugares marcados dos moldes de texto. */
const TOTAL_PLACEHOLDER = '{total}';
const START_PLACEHOLDER = '{start}';
const DURATION_PLACEHOLDER = '{duration}';

/**
 * Uma linha já pronta para o template.
 *
 * As coordenadas saem daqui como CADEIA, e não como número: `[style.--custom]`
 * com valor numérico faz o Angular anexar "px" à propriedade personalizada, e
 * o `calc(var(--trace-waterfall-bar-start) * 1%)` da folha passaria a receber
 * "9.167px". É a mesma nota do `NdsFlowGraph`, e o defeito é silencioso: a
 * barra simplesmente não aparece no lugar.
 */
interface RowView {
  /** A posição entra na chave: o id pode se repetir, e duas chaves iguais num
   *  laço rastreado derrubam a renderização. */
  key: string;
  spanId: string;
  state: ToolCallState;
  label: string;
  indent: string;
  barStart: string;
  barSize: string;
  durationLabel: string;
  /** A palavra do estado e a posição no eixo em números. */
  reading: string;
}

/** A cascata pronta para o template, ou nada quando não há o que desenhar. */
interface WaterfallView {
  axisLabel: string;
  rows: readonly RowView[];
}

@Component({
  selector: 'div[ndsTraceWaterfall]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-trace-waterfall',
    '[attr.data-slot]': '"trace-waterfall"',
    // OCUPADO ENQUANTO CORRE, e nada aqui é região viva. Um rastro ganha
    // trecho mais depressa do que se lê, e narrar cada trecho é a mesma
    // armadilha do relógio ao vivo.
    '[attr.aria-busy]': 'busy()',
  },
  template: `
    <!-- SEM TRECHO, OU SEM EIXO, NÃO HÁ CASCATA, e nada é desenhado: nem
         régua, nem camada que rola. Uma parada de teclado que leva a uma
         caixa vazia é ruído com nome, e por isso a peça prefere não
         desenhar. -->
    @if (view(); as drawn) {
      <!-- A RÉGUA DITA EM PALAVRAS, e ela é visível de propósito. -->
      <p class="nds-trace-waterfall-axis" data-slot="trace-waterfall-axis">{{ drawn.axisLabel }}</p>

      <!-- A CAMADA QUE ROLA, com o PAR COMPLETO: a parada de tabulação sem
           papel deixaria uma parada de teclado anônima, e o nome acessível
           sobre um div sem papel é DESCARTADO pelo navegador
           (aria-prohibited-attr). Papel de grupo e não de região: uma página
           de documentação tem dezenas destas, e região com nome vira dezenas
           de marcos homônimos. -->
      <div
        class="nds-trace-waterfall-viewport"
        data-slot="trace-waterfall-viewport"
        tabindex="0"
        role="group"
        [attr.aria-label]="labels().region"
      >
        <!-- LISTA ORDENADA e não lista simples: a ordem de declaração é a
             ordem de leitura, e é ela que quem monta escolheu. -->
        <ol class="nds-trace-waterfall-rows" data-slot="trace-waterfall-rows">
          @for (row of drawn.rows; track row.key) {
            <li
              class="nds-trace-waterfall-row"
              data-slot="trace-waterfall-row"
              [attr.data-state]="row.state"
              [attr.data-span-id]="row.spanId"
              [style.--trace-waterfall-row-indent]="row.indent"
            >
              <span class="nds-trace-waterfall-name" data-slot="trace-waterfall-name">
                <!-- A MARCA É DECORATIVA e carrega FORMA, não só cor: cheia,
                     anel, anel interrompido, cruz. A palavra do estado está
                     na leitura da linha, para quem não vê nenhuma das
                     quatro. -->
                <span
                  class="nds-trace-waterfall-marker"
                  data-slot="trace-waterfall-marker"
                  aria-hidden="true"
                ></span>
                <span
                  class="nds-trace-waterfall-label"
                  data-slot="trace-waterfall-label"
                >{{ row.label }}</span>
              </span>

              <!-- A RÉGUA da linha, fora do que é lido em voz: barra não se
                   lê, e o que se lê é a frase logo abaixo. -->
              <span
                class="nds-trace-waterfall-track"
                data-slot="trace-waterfall-track"
                aria-hidden="true"
              >
                <span
                  class="nds-trace-waterfall-bar"
                  data-slot="trace-waterfall-bar"
                  [style.--trace-waterfall-bar-start]="row.barStart"
                  [style.--trace-waterfall-bar-size]="row.barSize"
                ></span>
              </span>

              <span
                class="nds-trace-waterfall-duration"
                data-slot="trace-waterfall-duration"
              >{{ row.durationLabel }}</span>

              <!-- A LEITURA DA LINHA: a palavra do estado e a posição no
                   eixo em números. É o que faz a cascata inteira se
                   reconstruir de ouvido. -->
              <span
                class="nds-sr-only"
                data-slot="trace-waterfall-row-reading"
              >{{ row.reading }}</span>
            </li>
          }
        </ol>
      </div>
    }
  `,
})
export class NdsTraceWaterfall {
  /**
   * Os trechos, NA ORDEM EM QUE DEVEM SER OUVIDOS.
   *
   * A posição no eixo é livre; a ordem nesta lista não é, porque ela é a
   * ordem de leitura (WCAG 1.3.2). Sem trecho nenhum não há cascata, e a
   * peça não desenha nada.
   */
  readonly spans = input.required<readonly TraceSpan[]>();

  /**
   * O eixo, em milissegundos. É ele que as barras dividem.
   *
   * Obrigatório e não derivado — ver o docblock do módulo. Eixo sem extensão
   * (zero ou negativo) não posiciona nada, e a peça não desenha nada.
   */
  readonly totalMs = input.required<number>();

  /**
   * Em que pé está a execução que escreve o rastro.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça
   * se declara ocupada. Receber as cinco palavras e perguntar uma coisa só
   * não é achatamento de dado — um booleano na assinatura obrigaria quem
   * consome a traduzir cinco palavras em duas no ponto da chamada, que é onde
   * a perda aconteceria.
   */
  readonly status = input<RunStatus>('idle');

  /** O texto da peça. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<TraceWaterfallLabels>();

  /**
   * A cascata pronta para o template, ou nada.
   *
   * A conta inteira sai de `resolveTraceWaterfall`, e o que este `computed`
   * faz com o resultado é só o que é DESTA stack: virar cadeia o que entra em
   * propriedade personalizada, e escrever a frase de cada linha.
   */
  protected readonly view = computed<WaterfallView | null>(() => {
    const drawing = resolveTraceWaterfall(this.spans(), this.totalMs());
    if (!drawing) return null;

    const labels = this.labels();

    return {
      axisLabel: labels.axis.replace(TOTAL_PLACEHOLDER, String(drawing.totalMs)),
      rows: drawing.rows.map((drawn, index) => {
        const parts = [
          labels.state[drawn.span.state],
          labels.reading
            .replace(START_PLACEHOLDER, String(drawn.span.startMs))
            .replace(DURATION_PLACEHOLDER, String(drawn.span.durationMs)),
        ];
        // A barra recortada é uma afirmação a menos: quem vê nota que ela
        // encosta na borda, e quem ouve receberia a duração inteira sem
        // saber disso.
        if (drawn.clipped) parts.push(labels.clipped);

        return {
          // O ENDEREÇO PODE SE REPETIR, então a chave do laço leva a posição
          // junto. Sem isso, duas linhas com o mesmo endereço derrubariam a
          // renderização inteira.
          key: `${index}-${drawn.span.id}`,
          spanId: drawn.span.id,
          state: drawn.span.state,
          label: drawn.span.label,
          // O RECUO É DADO, e o que entra é um NÚMERO de degraus — a
          // multiplicação que o transforma em distância mora na folha, onde
          // pode mudar sem tocar nas cinco stacks.
          indent: String(drawn.indent),
          // AS DUAS COORDENADAS SÃO DADO, e entram por propriedade
          // personalizada: a conta que as transforma em posição mora na
          // folha.
          barStart: String(drawn.start),
          barSize: String(drawn.size),
          durationLabel: labels.duration.replace(
            DURATION_PLACEHOLDER,
            String(drawn.span.durationMs),
          ),
          reading: parts.join(' '),
        };
      }),
    };
  });

  /**
   * A peça se declara ocupada enquanto a execução corre, e em nenhum outro
   * momento — nem quando não há cascata, porque aí não há peça a declarar.
   */
  protected readonly busy = computed(() =>
    this.status() === 'running' && this.view() !== null ? 'true' : null,
  );
}
