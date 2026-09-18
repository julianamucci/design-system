// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam o `autoUpdateFloating` de `@/lib/floating`: com o
// painel aberto, o gatilho anda e a página rola — o painel tem de andar junto.
//
// São DUAS perguntas, e a segunda não sai da primeira:
// `checkPanelFollowsTrigger` cutuca o acompanhamento por evento sintético e
// prova que a conta roda de novo; `checkPanelSurvivesAncestorScroll` rola um
// ancestral DE VERDADE e prova que o cartão não é dispensado por isso. Ver o
// docblock do segundo para o que separa um do outro.
//
// Mora fora dos `*.stories.ts` porque ali todo export nomeado vira story, e mora
// num módulo só porque seis componentes fazem a MESMA pergunta (tooltip,
// hover-card, dropdown-menu, popover e o submenu do menubar e do context-menu).
// Seis cópias da conta seriam seis portões que envelhecem cada um no seu ritmo.
//
// Por que `transform` e não `margin`: deslocar o gatilho é mecânica de cena, e
// `transform` é propriedade mecânica para o portão de estilo inline; `margin`
// é valor de desenho e reprovaria. Ele também não muda o TAMANHO de nada, então
// o `ResizeObserver` do acompanhamento não é acionado — quem move o painel aqui
// é SÓ o evento de rolagem, que é o que se quer provar.
//
// Por que medir `style.left` e não `getBoundingClientRect()`: os painéis entram
// com animação de escala, e a caixa medida no meio dela anda sozinha. `left` é
// a coordenada que o posicionador escreve — é exatamente o que reposicionar
// muda, e não muda por nenhum outro motivo.

import { expect } from 'storybook/test';

/** Quanto o gatilho é deslocado, em px. */
const SHIFT = 40;

/** Quanto o ancestral rolável é rolado, em px. */
const SCROLL_BY = 60;

/** Frouxidão para arredondamento de subpixel. */
const TOLERANCE = 2;

/**
 * Quantas leituras IGUAIS seguidas, de 32 em 32ms, declaram a coordenada
 * assentada — 6, ou seja ~190ms parada.
 *
 * Um critério de três QUADROS (~50ms) declarava assentada uma coordenada que
 * ainda ia mudar, e a asserção reprovava o componente CERTO dizendo que o painel
 * andou 48px onde ele andou 40. O número é o mesmo nas cinco stacks de propósito:
 * a pergunta — "o painel PAROU?" — tem de ser a mesma para que comparar as cinco
 * páginas responda alguma coisa.
 *
 * O critério sozinho NÃO basta nesta stack, e as duas peças que faltam estão
 * medidas logo abaixo: `publishedLeft` força layout a cada leitura (sem isso o
 * laço é cego ao próprio reflow) e `fontsSettled` espera a troca de fonte antes
 * de qualquer medida.
 */
const STABLE_READS = 6;

/** Intervalo entre duas leituras do critério de assentamento, em ms. */
const READ_INTERVAL = 32;

/**
 * Espera a CENA parar de reflowar antes de medir pixel nenhum.
 *
 * Medido em 2026-09-18, na `States/Controlled`, com a story rodando FRIA (só ela
 * no filtro): aos 114ms da play, sem ninguém ter tocado em nada, o gatilho andou
 * sozinho de `left 109.39` para `116.16` e engordou de `55.39` para `57.38`. Não
 * é o componente e não é a rolagem — é a troca de fonte. O `preview-head.html`
 * carrega Inter e Outfit do Google Fonts com `display=swap`, então a primeira
 * pintura sai na fonte de reserva e o texto REFLUI quando as duas chegam; o
 * gatilho é um `<a>` inline no meio de um parágrafo, e reflui com ele.
 *
 * O estrago era o pior tipo: o painel media 177.09 (centrado na caixa VELHA do
 * gatilho) e depois 184.84 (na caixa nova). Os 7.75px são metade dos 15.5px que
 * o parágrafo mudou de largura, e caíam exatamente em cima da tolerância de 2px
 * — a asserção acusava o painel de andar 48px onde ele andou 40, e o componente
 * estava certo. Latente por construção: rodando o ARQUIVO inteiro, as stories
 * anteriores já tinham pago a troca de fonte e a mesma medição passava. Só a
 * rodada fria reprovava, o que é a receita do "não reproduz".
 *
 * `document.fonts.ready` resolve na hora quando as fontes já estão em memória,
 * então isto não custa nada nas rodadas em que não era preciso.
 */
async function fontsSettled(): Promise<void> {
  await document.fonts.ready;
}

/** Espera `count` quadros — o acompanhamento agrupa por `requestAnimationFrame`. */
export async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

/**
 * Coordenada que o posicionador publica, e que o passo de deslocamento observa.
 *
 * A leitura da CAIXA antes do `style.left` não é decoração e não é a medida: ela
 * FORÇA layout, e sem esse flush o laço de assentamento é CEGO.
 *
 * Medido em 2026-09-18: `style.left` é uma string, e lê-la não faz o navegador
 * calcular nada. Quem faria a conta rodar de novo é o `ResizeObserver` que o
 * `autoUpdateFloating` mantém na âncora — e ele só é notificado depois de um
 * layout. Amostrando `style.left` de 32 em 32ms sem tocar em caixa nenhuma, a
 * sonda viu a coordenada parada em 177.09 por 1440 SEGUIDOS e teria declarado
 * assentado um valor errado por 7.75px; qualquer prazo maior daria no mesmo,
 * porque nada ali converge com o tempo. Com o flush, a conta roda e a coordenada
 * chega ao valor final no ciclo seguinte.
 *
 * É o que as outras quatro stacks ganham de graça: lá a medida é a caixa do
 * painel, então toda leitura já força layout. Aqui a coordenada publicada é a
 * melhor medida — é exatamente o que reposicionar muda, e não muda por mais nada
 * —, e o flush entra explícito para a leitura não ser cega ao próprio reflow.
 */
function publishedLeft(panel: HTMLElement): number {
  panel.getBoundingClientRect();
  return parseFloat(panel.style.left);
}

/**
 * Lê `read()` até o valor PARAR de mudar, ou até o prazo acabar.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 *
 * A leitura entra por função porque as duas medições desta sonda leem coisas
 * diferentes: deslocar o gatilho observa o `left` que o posicionador publica,
 * rolar um ancestral observa o topo da CAIXA (ver o docblock de cada uma). Duas
 * cópias do laço divergiriam no dia em que o critério mudasse numa delas.
 *
 * O compasso é de RELÓGIO (32ms), e não de quadro: o plateau intermediário do
 * reposicionamento em dois passos dura mais que um punhado de quadros, e um
 * critério em `requestAnimationFrame` declararia assentado o valor do meio.
 */
async function settledValue(read: () => number, timeout = 1200): Promise<number> {
  const deadline = performance.now() + timeout;
  let last = read();
  let stable = 0;
  while (performance.now() < deadline && stable < STABLE_READS) {
    await new Promise<void>((resolve) => { setTimeout(resolve, READ_INTERVAL); });
    const current = read();
    stable = Math.abs(current - last) < 0.5 ? stable + 1 : 0;
    last = current;
  }
  return last;
}

/**
 * Cutuca o acompanhamento e espera o painel PARAR de onde estava.
 *
 * São dois degraus, e a ordem importa. Primeiro espera-se a coordenada MUDAR:
 * antes disso não há o que medir, e um critério só de estabilidade aprovaria o
 * painel PARADO — que é o defeito que a sonda existe para pegar. Só então entra
 * o critério de `STABLE_READS`, que é o que atravessa o plateau intermediário.
 * Se o painel não se moveu, o segundo degrau devolve o mesmo valor em ~190ms e a
 * asserção reprova, que é o que se quer.
 */
async function nudgeAndMeasure(panel: HTMLElement, from: number, timeout = 1200): Promise<number> {
  window.dispatchEvent(new Event('scroll'));
  await nextFrames(2);
  const deadline = performance.now() + timeout;
  let current = publishedLeft(panel);
  while (current === from && performance.now() < deadline) {
    await new Promise<void>((resolve) => { setTimeout(resolve, READ_INTERVAL); });
    current = publishedLeft(panel);
  }
  return settledValue(() => publishedLeft(panel), Math.max(400, deadline - performance.now()));
}

/**
 * Desloca `shifted` 40px para a direita, dispara `scroll` na janela, espera o
 * painel ASSENTAR e afirma que ele andou os mesmos 40px (±2).
 *
 * `startAt` existe para o gatilho encostado na borda ESQUERDA do canvas: ali o
 * painel centrado já nasce travado no respiro da janela, e os primeiros pixels
 * do deslocamento são engolidos pelo travamento — o painel andaria menos que o
 * gatilho estando CERTO. Com `startAt`, a cena primeiro leva o gatilho até
 * longe da borda (o que já exige reposicionar) e só então mede os 40px.
 *
 * Restaura o `transform` e dispara de novo ANTES de afirmar, num `finally`: o
 * replay do painel Interactions tem de partir do estado original, e uma
 * asserção que reprova não pode deixar o gatilho deslocado para trás.
 */
export async function checkPanelFollowsTrigger(
  panel: HTMLElement,
  shifted: HTMLElement,
  { startAt = 0 }: { startAt?: number } = {},
): Promise<void> {
  // Antes de tudo: a cena tem de estar parada. Ver `fontsSettled` — a troca de
  // fonte move o gatilho sozinha, e medir deslocamento durante ela acusa o
  // componente de um defeito que é da medição.
  await fontsSettled();

  const previous = shifted.style.transform;
  let before: number;
  let after: number;

  try {
    if (startAt !== 0) {
      shifted.style.transform = `translateX(${startAt}px)`;
      await nudgeAndMeasure(panel, publishedLeft(panel));
    }
    before = publishedLeft(panel);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    after = await nudgeAndMeasure(panel, before);
  } finally {
    // Prazo curto na restauração: se a asserção já vai reprovar, o painel não
    // acompanha nada e esperar o prazo inteiro só encareceria a reprovação.
    shifted.style.transform = previous;
    await nudgeAndMeasure(panel, publishedLeft(panel), 300);
  }

  await expect(Number.isFinite(before)).toBe(true);
  // A diferença inteira na mensagem: "andou 0px" diz que o painel ficou parado,
  // "andou 20px" diz que a borda da janela o travou — dois defeitos distintos.
  const moved = after - before;
  if (Math.abs(moved - SHIFT) > TOLERANCE) {
    throw new Error(
      `O gatilho andou ${SHIFT}px e o painel andou ${moved}px (left ${before}px → ${after}px).`,
    );
  }
  await expect(Math.abs(moved - SHIFT)).toBeLessThanOrEqual(TOLERANCE);
}

/**
 * Lê uma borda da CAIXA do painel até ela parar de mudar — o mesmo critério de
 * `settledValue`, com a leitura de caixa já montada.
 *
 * Caixa e não `style.top` aqui: o passo de rolagem compara os DELTAS das duas
 * caixas, e é a única forma que serve às cinco stacks sem saber qual delas
 * escreve coordenada no painel e qual escreve `transform` no invólucro.
 */
async function settledEdge(
  panel: HTMLElement,
  edge: 'left' | 'top',
  timeout = 1200,
): Promise<number> {
  return settledValue(() => panel.getBoundingClientRect()[edge], timeout);
}

/**
 * Rola `scroller` — um ancestral rolável DE VERDADE do gatilho — e afirma as
 * duas metades que separam reposicionar de dispensar:
 *
 *  1. o painel CONTINUA no documento depois da rolagem;
 *  2. ele andou o MESMO tanto que o gatilho.
 *
 * Por que isto não é o `checkPanelFollowsTrigger` com outro nome: aquele cutuca
 * o acompanhamento por um `scroll` sintético na JANELA, e nas libs que
 * reposicionam os eventos de rolagem e de redimensionamento passam pelo mesmo
 * `update` do mesmo `autoUpdate` — o cutucão prova que a conta roda de novo, e
 * não prova que a rolagem deixa o cartão vivo. Quem dispensa por rolagem (a
 * `reka-ui` o faz, medido na D10 do hover-card) passaria naquele passo e reprova
 * neste.
 *
 * A rolagem é REAL — `scrollTop` de um contêiner com `overflow` —, e não um
 * `Event('scroll')` despachado à mão: só a de verdade chega ao ouvinte que
 * `autoUpdateFloating` registrou naquele ancestral, e só ela move o gatilho.
 *
 * Mede as duas caixas com `getBoundingClientRect()` e compara os DELTAS, em vez
 * do `style.top` que esta stack publica: é a única forma que serve às cinco sem
 * saber qual delas escreve coordenada no painel e qual escreve `transform` no
 * invólucro. O invariante é o mesmo nas cinco — o vão entre gatilho e painel
 * sobrevive à rolagem — e a leitura de caixa fica protegida da animação de
 * entrada pelo laço de relógio de `settledEdge`.
 *
 * Restaura o `scrollTop` num `finally`, ANTES de afirmar, pelo mesmo motivo do
 * irmão acima: o replay do painel Interactions parte do estado original.
 */
export async function checkPanelSurvivesAncestorScroll(
  panel: HTMLElement,
  trigger: HTMLElement,
  scroller: HTMLElement,
  {
    stillOpen,
    by = SCROLL_BY,
  }: { stillOpen: () => HTMLElement | null; by?: number },
): Promise<void> {
  // Mesma precondição da sonda irmã: este passo compara o delta do gatilho com o
  // delta do painel, e a troca de fonte move o gatilho por conta própria.
  await fontsSettled();

  const previous = scroller.scrollTop;
  const measurement = {
    panelBefore: Number.NaN,
    panelAfter: Number.NaN,
    triggerBefore: Number.NaN,
    triggerAfter: Number.NaN,
    connected: false,
    same: false,
    room: 0,
  };

  try {
    measurement.room = scroller.scrollHeight - scroller.clientHeight - previous;
    measurement.panelBefore = await settledEdge(panel, 'top');
    measurement.triggerBefore = trigger.getBoundingClientRect().top;
    // `scrollTop` aplica o deslocamento na hora; o EVENTO de rolagem é que vem
    // no próximo quadro, e é ele que o acompanhamento escuta. Daí os quadros
    // antes de esperar a coordenada assentar.
    scroller.scrollTop = previous + by;
    await nextFrames(3);
    measurement.triggerAfter = trigger.getBoundingClientRect().top;
    measurement.panelAfter = await settledEdge(panel, 'top');
    measurement.connected = panel.isConnected;
    measurement.same = stillOpen() === panel;
  } finally {
    scroller.scrollTop = previous;
    await nextFrames(3);
  }

  // A cena precisa ter rolado de verdade: contêiner sem transbordo devolveria
  // gatilho parado, e as duas metades passariam sem medir nada.
  await expect(
    measurement.room,
    `O ancestral não tem ${by}px para rolar (sobra ${measurement.room.toFixed(1)}px): `
      + 'a cena não prova nada sobre rolagem.',
  ).toBeGreaterThanOrEqual(by);

  const triggerMoved = measurement.triggerAfter - measurement.triggerBefore;
  await expect(
    Math.abs(triggerMoved),
    `O gatilho não se moveu com a rolagem (andou ${triggerMoved.toFixed(1)}px): `
      + 'o elemento passado como `scroller` não é o ancestral que rola.',
  ).toBeGreaterThan(by / 2);

  // Metade 1 — sobrevivência. Primeiro, porque painel desmontado devolve caixa
  // zerada e faria a metade 2 reprovar pelo motivo errado.
  //
  // Duas asserções, e a segunda não sai da primeira: `isConnected` diz que ESTE
  // nó continua no documento, e `stillOpen()` — que é a consulta ao portal, do
  // componente, por isso entra por parâmetro — diz que ele ainda é O painel
  // aberto. Um cartão dispensado e reaberto no meio da rolagem satisfaz a
  // primeira com um nó órfão e reprova na segunda.
  await expect(
    measurement.connected,
    'Rolar o ancestral DISPENSOU o cartão: o painel saiu do documento em vez de acompanhar o gatilho.',
  ).toBe(true);
  await expect(
    measurement.same,
    'Depois da rolagem o painel aberto é OUTRO nó: o cartão fechou e reabriu em vez de acompanhar o gatilho.',
  ).toBe(true);

  // Metade 2 — acompanhamento. O vão entre as duas caixas é o que tem de
  // sobreviver; a diferença inteira na mensagem separa "painel parado" de
  // "painel andou menos".
  const panelMoved = measurement.panelAfter - measurement.panelBefore;
  await expect(
    Math.abs(panelMoved - triggerMoved),
    `O gatilho andou ${triggerMoved.toFixed(1)}px com a rolagem e o painel andou `
      + `${panelMoved.toFixed(1)}px (topo ${measurement.panelBefore.toFixed(1)}px → `
      + `${measurement.panelAfter.toFixed(1)}px).`,
  ).toBeLessThanOrEqual(TOLERANCE);
}
