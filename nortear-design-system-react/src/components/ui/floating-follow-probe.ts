// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam que um painel ABERTO continua colado ao gatilho
// quando o gatilho se move (D10). O equivalente do Vanilla é
// `nortear-design-system-vanilla/src/components/ui/floating-follow-probe.ts`, e
// esta é a mesma pergunta medida com os instrumentos desta stack. Fica fora dos
// `*.stories.tsx` porque ali todo export nomeado vira story.
//
// São DUAS perguntas, e a segunda não sai da primeira:
// `checkPanelFollowsTrigger` cutuca o acompanhamento por evento sintético e
// prova que a conta roda de novo; `checkPanelSurvivesAncestorScroll` rola um
// ancestral DE VERDADE e prova que o cartão não é dispensado por isso. Ver o
// docblock do segundo para o que separa um do outro.
//
// Nesta stack quem acompanha é o `autoUpdate` do `@floating-ui`, ligado pelo
// base-ui por `whileElementsMounted` enquanto o painel está montado
// (`internals/useAnchorPositioning.js:316`). Sem asserção nenhuma, um bump de
// lib que o desligasse fecharia a suíte VERDE.
//
// **Duas coisas mudam em relação ao Vanilla, as duas MEDIDAS, não presumidas:**
//
//  1. **a cena cutuca por `scroll`, e pode.** O `autoUpdate` escuta `scroll` em
//     cada ancestral rolável e na JANELA (`getOverflowAncestors` devolve `win`
//     quando o ancestral rolável é o `body`), e o base-ui NÃO dispensa o cartão
//     por rolagem — ao contrário da `reka-ui`, que por isso obriga o vue a
//     cutucar por `resize`.
//  2. **a coordenada não está no painel.** Quem recebe posição é o
//     `.nds-hover-card-positioner`, e o base-ui escreve ali o `transform` do
//     `floatingStyles` — o painel não tem `left` nenhum para ler, ao contrário
//     do Vanilla. A medida é a caixa do painel, e ela é estável porque desde a
//     D14 nada anima aqui, nem na entrada nem na saída.
//
// Por que `transform` e não `margin` para deslocar o gatilho: deslocar é mecânica
// de cena, e `transform` é propriedade mecânica para o portão de estilo inline;
// `margin` é valor de desenho e reprovaria. Ele também não muda o TAMANHO de
// nada, então o `ResizeObserver` do acompanhamento não entra na conta — quem
// move o painel aqui é só a rolagem, que é o que se quer provar.

import { expect } from "storybook/test";

/** Quanto o gatilho é deslocado, em px. */
const SHIFT = 40;

/** Frouxidão para arredondamento de subpixel. */
const TOLERANCE = 2;

/** Espera `count` quadros — o acompanhamento agrupa por `requestAnimationFrame`. */
export async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

/** Quanto o ancestral rolável é rolado, em px. */
const SCROLL_BY = 60;

/**
 * Quantas leituras IGUAIS seguidas, de 32 em 32ms, declaram a coordenada
 * assentada — 6, ou seja ~190ms parada.
 *
 * Um critério de três QUADROS (~50ms) declarava assentada uma coordenada que
 * ainda ia mudar, e a asserção reprovava o componente CERTO dizendo que o painel
 * andou 48px onde ele andou 40. O número é o mesmo nas cinco stacks de propósito:
 * a pergunta — "o painel PAROU?" — tem de ser a mesma para que comparar as cinco
 * páginas responda alguma coisa.
 */
const STABLE_READS = 6;

/** Intervalo entre duas leituras do critério de assentamento, em ms. */
const READ_INTERVAL = 32;

/**
 * Espera a CENA parar de reflowar antes de medir pixel nenhum.
 *
 * Medido no vanilla em 2026-09-18, com a story rodando FRIA: aos 114ms da play,
 * sem ninguém ter tocado em nada, o gatilho andou sozinho 6.77px e engordou
 * 1.99px. Não é o componente — é a troca de fonte. O `preview-head.html` carrega
 * Inter e Outfit do Google Fonts com `display=swap`, então a primeira pintura
 * sai na fonte de reserva e o texto REFLUI quando as duas chegam; o gatilho é um
 * `<a>` inline no meio de um parágrafo, e reflui com ele. O painel media então
 * 177.09 (centrado na caixa VELHA) e 184.84 (na caixa nova) — 7.75px em cima de
 * uma tolerância de 2px.
 *
 * Esta stack carrega as mesmas duas fontes, com o mesmo `display=swap`, e mede a
 * mesma cena. Entra aqui antes de a rodada fria custar o mesmo diagnóstico.
 *
 * Latente por construção, e é o que faz dele um caso de "não reproduz": rodando
 * o ARQUIVO inteiro, as stories anteriores já pagaram a troca de fonte e a mesma
 * medição passa. `document.fonts.ready` resolve na hora quando as fontes já
 * estão em memória, então não custa nada nas rodadas em que não era preciso.
 */
async function fontsSettled(): Promise<void> {
  await document.fonts.ready;
}

/**
 * Lê uma borda da caixa do painel até ela PARAR de mudar, ou até o prazo acabar.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 *
 * O compasso é de RELÓGIO (32ms), e não de quadro: o plateau intermediário do
 * reposicionamento em dois passos dura mais que um punhado de quadros, e um
 * critério em `requestAnimationFrame` declararia assentado o valor do meio.
 */
async function settledEdge(
  panel: HTMLElement,
  edge: "left" | "top",
  timeout = 1200,
): Promise<number> {
  const deadline = performance.now() + timeout;
  let last = panel.getBoundingClientRect()[edge];
  let stable = 0;
  while (performance.now() < deadline && stable < STABLE_READS) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, READ_INTERVAL);
    });
    const current = panel.getBoundingClientRect()[edge];
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
async function nudgeAndMeasure(
  panel: HTMLElement,
  from: number,
  timeout = 1200,
): Promise<number> {
  window.dispatchEvent(new Event("scroll"));
  await nextFrames(2);
  const deadline = performance.now() + timeout;
  let current = panel.getBoundingClientRect().left;
  while (current === from && performance.now() < deadline) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, READ_INTERVAL);
    });
    current = panel.getBoundingClientRect().left;
  }
  return settledEdge(panel, "left", Math.max(400, deadline - performance.now()));
}

/**
 * Desloca `shifted` 40px para a direita, dispara `scroll` na janela e afirma que
 * o painel andou os mesmos 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO. Medido nesta stack: sem `startAt`, o gatilho andava 40px e o painel
 * 20px (esquerda 5px → 25px), porque os primeiros 20 eram o destravamento.
 *
 * Restaura o `transform` num `finally`, ANTES de afirmar: o replay do painel
 * Interactions tem de partir do estado original, e uma asserção que reprova não
 * pode deixar o gatilho deslocado para trás.
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
  // Campos de um objeto, e não duas variáveis: atribuição dentro de `try` com
  // leitura depois do `finally` é exatamente o que o `no-useless-assignment`
  // reprova quando a declaração já traz um valor.
  const measurement = { before: Number.NaN, after: Number.NaN };

  try {
    if (startAt !== 0) {
      shifted.style.transform = `translateX(${startAt}px)`;
      await nudgeAndMeasure(panel, panel.getBoundingClientRect().left);
    }
    measurement.before = panel.getBoundingClientRect().left;
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    measurement.after = await nudgeAndMeasure(panel, measurement.before);
  } finally {
    // Prazo curto na restauração: se a asserção já vai reprovar, o painel não
    // acompanha nada e esperar o prazo inteiro só encareceria a reprovação.
    shifted.style.transform = previous;
    await nudgeAndMeasure(panel, panel.getBoundingClientRect().left, 300);
  }

  await expect(Number.isFinite(measurement.before)).toBe(true);
  // A diferença inteira na mensagem: "andou 0px" diz que o painel ficou parado,
  // "andou 20px" diz que a borda da janela o travou — dois defeitos distintos.
  const moved = measurement.after - measurement.before;
  await expect(
    Math.abs(moved - SHIFT),
    `O gatilho andou ${SHIFT}px e o painel andou ${moved.toFixed(1)}px `
      + `(esquerda ${measurement.before.toFixed(1)}px → ${measurement.after.toFixed(1)}px).`,
  ).toBeLessThanOrEqual(TOLERANCE);
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
 * `reka-ui` o faz, medido na D10) passaria naquele passo e reprova neste.
 *
 * A rolagem é REAL — `scrollTop` de um contêiner com `overflow` —, e não um
 * `Event('scroll')` despachado à mão: só a de verdade chega ao ouvinte que a
 * lib registrou no ancestral, e só ela move o gatilho.
 *
 * Mede as duas caixas com `getBoundingClientRect()` e compara os DELTAS, em vez
 * da coordenada publicada pelo posicionador: é a única forma que serve às cinco
 * stacks sem saber qual delas escreve `left`/`top` no painel e qual escreve
 * `transform` no invólucro. O invariante é o mesmo nas cinco — o vão entre
 * gatilho e painel sobrevive à rolagem.
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
    measurement.panelBefore = await settledEdge(panel, "top");
    measurement.triggerBefore = trigger.getBoundingClientRect().top;
    // `scrollTop` aplica o deslocamento na hora; o EVENTO de rolagem é que vem
    // no próximo quadro, e é ele que a lib escuta. Daí os quadros antes de
    // esperar a coordenada assentar.
    scroller.scrollTop = previous + by;
    await nextFrames(3);
    measurement.triggerAfter = trigger.getBoundingClientRect().top;
    measurement.panelAfter = await settledEdge(panel, "top");
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
      + "a cena não prova nada sobre rolagem.",
  ).toBeGreaterThanOrEqual(by);

  const triggerMoved = measurement.triggerAfter - measurement.triggerBefore;
  await expect(
    Math.abs(triggerMoved),
    `O gatilho não se moveu com a rolagem (andou ${triggerMoved.toFixed(1)}px): `
      + "o elemento passado como `scroller` não é o ancestral que rola.",
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
    "Rolar o ancestral DISPENSOU o cartão: o painel saiu do documento em vez de acompanhar o gatilho.",
  ).toBe(true);
  await expect(
    measurement.same,
    "Depois da rolagem o painel aberto é OUTRO nó: o cartão fechou e reabriu em vez de acompanhar o gatilho.",
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
