import type { RunStatus, ToolCallState, TraceSpan } from '@shared/primitives/chat-protocol';
import { resolveTraceWaterfall } from '@shared/primitives/trace-waterfall-axis';

/**
 * O tempo de uma execução repartido entre trechos que se aninham e se
 * sobrepõem: uma linha por trecho, uma barra posicionada no eixo comum, e o
 * recuo dizendo quem está dentro de quem.
 *
 * Desenho em `nds/resposta-estruturada.css`, no bloco "Cascata de trechos", que
 * também guarda as oito decisões de acessibilidade e as seis regras da família.
 * O vocabulário — `TraceSpan`, `ToolCallState` — vem de
 * `@shared/primitives/chat-protocol`, e a conta de
 * `@shared/primitives/trace-waterfall-axis`.
 *
 * POR QUE ELA É PEÇA, e não a barra de progresso numa tabela. O que decide é o
 * COMEÇO. Medido no repositório antes de construir: `.nds-progress-indicator` é
 * `transform: translateX(calc((var(--value) - 100) * 1%))`, uma barra ancorada
 * no zero por construção, que não tem como começar no meio de um eixo. E a
 * medição do tempo de uma resposta, na família 5, não tem eixo nenhum: é um
 * `<dl>` de pares termo/valor. Barra com começo é outro desenho, não outra
 * variante.
 *
 * O EIXO CHEGA DE FORA, e não é derivado dos trechos. É ele que faz as barras
 * dividirem uma régua só, e é ele que continua sendo o total verdadeiro quando
 * quem monta mostra apenas parte do rastro — derivado, ele encolheria a cada
 * trecho retirado e as barras restantes reescalariam, perdendo exatamente a
 * posição que a peça existe para mostrar (§2 da guideline 17, regra 1 da folha).
 *
 * A PEÇA NÃO ORDENA. Os trechos saem na ordem em que foram declarados, e não
 * ordenados por começo: a ordem no DOM é a ordem de leitura (WCAG 1.3.2), e
 * ordenar seria a peça reescrevendo o rastro de quem monta.
 *
 * O ESTADO É `ToolCallState` INTEIRO, e não os três da fonte. Lá em curso,
 * concluído e falhou são três desenhos, e o que se perde é `pending`: o trecho
 * que ainda não começou, que num eixo de tempo é justamente o que se quer ver.
 *
 * NÃO EXISTE CONTADOR DE REVELAÇÃO, e é decisão da família (regra 6 da folha).
 * Quem quer revelar aos poucos passa MENOS trechos, e o eixo continua o mesmo.
 *
 * O QUE O COMPONENTE NÃO FAZ: ordenar, derivar o eixo, medir elemento, animar,
 * contar tempo, avançar sozinho, buscar nada. Ele desenha os trechos que recebe
 * na régua que recebe.
 */

export interface TraceWaterfallLabels {
  /**
   * O nome da camada que rola.
   *
   * OBRIGATÓRIO, e é decisão da família. A cascata é mais larga que a conversa,
   * então ela rola, e o que rola é parada de teclado com `tabindex="0"` — sem
   * nome, quem chega ali ouvindo não sabe onde entrou (regra 6 da §8 da
   * guideline 17). Quem monta é quem sabe o nome: duas peças destas na mesma
   * tela com o mesmo nome são duas paradas indistinguíveis. Um padrão silencioso
   * pareceria gentileza e produziria exatamente isso — o que faz alguém pensar
   * em nomear uma camada que não se vê é a chamada não compilar sem ela.
   */
  region: string;
  /**
   * A régua dita em palavras. `{total}` vira o eixo declarado.
   *
   * VISÍVEL, e é decisão: sem ela, "todas as barras contra o mesmo eixo" é uma
   * afirmação que só quem escreveu o dado consegue conferir — a peça mostra
   * posições relativas e nunca diz relativas a quê.
   */
  axis: string;
  /** A duração de cada linha, visível. `{duration}` vira o número. */
  duration: string;
  /**
   * A posição no eixo, para quem não vê a barra. `{start}` e `{duration}` viram
   * os números.
   *
   * É o que faz a cascata inteira se reconstruir de ouvido: percorrida a lista,
   * cada trecho disse onde está, e a sobreposição entre dois deles é dedutível
   * dos números.
   */
  reading: string;
  /**
   * A frase do trecho que não coube no eixo declarado.
   *
   * Existe porque a barra recortada é uma AFIRMAÇÃO A MENOS: quem vê nota que
   * ela encosta na borda; quem ouve receberia a duração inteira sem saber que só
   * parte dela está desenhada.
   */
  clipped: string;
  /**
   * A palavra de cada estado, que é o que chega a quem ouve.
   *
   * A forma resolve para quem vê — a marca ao lado do rótulo e o preenchimento
   * da barra —, e a palavra resolve para quem ouve. Ninguém fica com a cor
   * sozinha (WCAG 1.4.1).
   */
  state: Record<ToolCallState, string>;
}

export interface TraceWaterfallOptions {
  /**
   * Os trechos, NA ORDEM EM QUE DEVEM SER OUVIDOS.
   *
   * A posição no eixo é livre; a ordem nesta lista não é, porque ela é a ordem
   * de leitura (WCAG 1.3.2). Sem trecho nenhum não há cascata, e a fábrica
   * devolve `null`.
   */
  spans: readonly TraceSpan[];
  /**
   * O eixo, em milissegundos. É ele que as barras dividem.
   *
   * Obrigatório e não derivado — ver o docblock do módulo. Eixo sem extensão
   * (zero ou negativo) não posiciona nada, e a fábrica devolve `null`.
   */
  totalMs: number;
  /**
   * Em que pé está a execução que escreve o rastro.
   *
   * Usado para uma pergunta só: ela ainda corre? É ela que decide se a peça se
   * declara ocupada. Receber as cinco palavras e perguntar uma coisa só não é
   * achatamento de dado — um booleano na assinatura obrigaria quem consome a
   * traduzir cinco palavras em duas no ponto da chamada, que é onde a perda
   * aconteceria.
   */
  status?: RunStatus;
  labels: TraceWaterfallLabels;
  class?: string;
}

/** Os lugares marcados dos moldes de texto. */
const TOTAL_PLACEHOLDER = '{total}';
const START_PLACEHOLDER = '{start}';
const DURATION_PLACEHOLDER = '{duration}';

export function createTraceWaterfall(
  options: TraceWaterfallOptions,
): HTMLElement | null {
  const { spans, totalMs, status = 'idle', labels } = options;

  const drawing = resolveTraceWaterfall(spans, totalMs);
  // SEM TRECHO, OU SEM EIXO, NÃO HÁ CASCATA, e devolver moldura vazia seria pior
  // que devolver nada: a camada que rola é parada de teclado, e uma parada de
  // teclado que leva a uma caixa vazia é ruído com nome.
  if (!drawing) return null;

  const root = document.createElement('div');
  root.dataset.slot = 'trace-waterfall';
  root.className = ['nds-trace-waterfall', options.class].filter(Boolean).join(' ');

  // OCUPADO ENQUANTO CORRE, e nada aqui é região viva (regra 5 da folha). Um
  // rastro ganha trecho mais depressa do que se lê, e narrar cada trecho é a
  // mesma armadilha do relógio ao vivo.
  if (status === 'running') root.setAttribute('aria-busy', 'true');

  // ── A régua dita em palavras ────────────────────────────────────────────────
  const axis = document.createElement('p');
  axis.className = 'nds-trace-waterfall-axis';
  axis.dataset.slot = 'trace-waterfall-axis';
  axis.textContent = labels.axis.replace(TOTAL_PLACEHOLDER, String(drawing.totalMs));
  root.appendChild(axis);

  // ── A camada que rola ───────────────────────────────────────────────────────
  //
  // O PAR COMPLETO, e ele é o par: `tabindex` sem papel deixaria uma parada de
  // teclado anônima, e `aria-label` sobre um `div` sem papel é DESCARTADO pelo
  // navegador (`aria-prohibited-attr`) — que foi exatamente o defeito de duas
  // peças desta casa. `group` e não `region`: uma página de documentação tem
  // dezenas destas, e `region` com nome vira dezenas de marcos homônimos.
  const viewport = document.createElement('div');
  viewport.className = 'nds-trace-waterfall-viewport';
  viewport.dataset.slot = 'trace-waterfall-viewport';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-label', labels.region);

  // `<ol>` e não `<ul>`: a ordem de declaração é a ordem de leitura, e é ela que
  // quem monta escolheu.
  const list = document.createElement('ol');
  list.className = 'nds-trace-waterfall-rows';
  list.dataset.slot = 'trace-waterfall-rows';

  for (const drawn of drawing.rows) {
    const row = document.createElement('li');
    row.className = 'nds-trace-waterfall-row';
    row.dataset.slot = 'trace-waterfall-row';
    row.dataset.state = drawn.span.state;
    row.dataset.spanId = drawn.span.id;
    // O RECUO É DADO, e o que entra é um NÚMERO de degraus — a multiplicação que
    // o transforma em distância mora na folha, onde pode mudar sem tocar nas
    // cinco stacks. Mesma decisão de `--computer-use-mark-x`.
    row.style.setProperty('--trace-waterfall-row-indent', String(drawn.indent));

    const name = document.createElement('span');
    name.className = 'nds-trace-waterfall-name';
    name.dataset.slot = 'trace-waterfall-name';

    // A MARCA É DECORATIVA e carrega FORMA, não só cor: cheia, anel, anel
    // interrompido, cruz. A palavra do estado está na leitura da linha, para
    // quem não vê nenhuma das quatro.
    const marker = document.createElement('span');
    marker.className = 'nds-trace-waterfall-marker';
    marker.dataset.slot = 'trace-waterfall-marker';
    marker.setAttribute('aria-hidden', 'true');
    name.appendChild(marker);

    const label = document.createElement('span');
    label.className = 'nds-trace-waterfall-label';
    label.dataset.slot = 'trace-waterfall-label';
    label.textContent = drawn.span.label;
    name.appendChild(label);
    row.appendChild(name);

    // A RÉGUA da linha, fora do que é lido em voz: barra não se lê, e o que se
    // lê é a frase logo abaixo, que diz a mesma posição em números.
    const track = document.createElement('span');
    track.className = 'nds-trace-waterfall-track';
    track.dataset.slot = 'trace-waterfall-track';
    track.setAttribute('aria-hidden', 'true');

    const bar = document.createElement('span');
    bar.className = 'nds-trace-waterfall-bar';
    bar.dataset.slot = 'trace-waterfall-bar';
    // AS DUAS COORDENADAS SÃO DADO, e entram por propriedade personalizada: a
    // conta que as transforma em posição mora na folha (regra 2 da folha).
    bar.style.setProperty('--trace-waterfall-bar-start', String(drawn.start));
    bar.style.setProperty('--trace-waterfall-bar-size', String(drawn.size));
    track.appendChild(bar);
    row.appendChild(track);

    const duration = document.createElement('span');
    duration.className = 'nds-trace-waterfall-duration';
    duration.dataset.slot = 'trace-waterfall-duration';
    duration.textContent = labels.duration.replace(
      DURATION_PLACEHOLDER,
      String(drawn.span.durationMs),
    );
    row.appendChild(duration);

    // A LEITURA DA LINHA: a palavra do estado e a posição no eixo em números. É
    // o que faz a cascata inteira se reconstruir de ouvido.
    const reading = document.createElement('span');
    reading.className = 'nds-sr-only';
    reading.dataset.slot = 'trace-waterfall-row-reading';
    const parts = [
      labels.state[drawn.span.state],
      labels.reading
        .replace(START_PLACEHOLDER, String(drawn.span.startMs))
        .replace(DURATION_PLACEHOLDER, String(drawn.span.durationMs)),
    ];
    // A barra recortada é uma afirmação a menos: quem vê nota que ela encosta na
    // borda, e quem ouve receberia a duração inteira sem saber disso.
    if (drawn.clipped) parts.push(labels.clipped);
    reading.textContent = parts.join(' ');
    row.appendChild(reading);

    list.appendChild(row);
  }

  viewport.appendChild(list);
  root.appendChild(viewport);
  return root;
}
