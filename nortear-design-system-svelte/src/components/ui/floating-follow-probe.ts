// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam que um painel ABERTO continua colado ao gatilho
// quando o gatilho se move (D10). O equivalente do Vanilla é
// `nortear-design-system-vanilla/src/components/ui/floating-follow-probe.ts`, e
// esta é a mesma pergunta medida com os instrumentos desta stack. Fica fora dos
// `*.stories.ts` porque ali todo export nomeado vira story.
//
// **Duas coisas mudam em relação ao Vanilla, as duas MEDIDAS, não presumidas:**
//
//  1. **a coordenada não está no painel.** No Vanilla quem se posiciona é o
//     próprio painel, e o portão lê `panel.style.left`. Aqui o `@floating-ui`
//     que o bits-ui liga escreve `transform: translate(...)` no invólucro
//     anônimo da lib (`[data-bits-floating-content-wrapper]`, montado em
//     `use-floating-layer.svelte.js:127-140`), com o painel em FLUXO dentro
//     dele: `panel.style.left` devolveria `NaN` a cada rodada, que é asserção
//     que não pode reprovar. A medida é a caixa do painel — e ela é estável
//     porque desde a D14 esta folha não anima nada, nem na entrada nem na saída.
//  2. **a cena cutuca por `resize`, não por rolagem.** É o mesmo caminho que o
//     `withSceneAwayFromEdge` da sonda compartilhada usa, e pelo mesmo motivo:
//     em pelo menos uma das libs da casa rolar DISPENSA o cartão em vez de
//     reposicioná-lo, então uma cena que rola não mediria acompanhamento em
//     todas. O `autoUpdate` do `@floating-ui` mantém ouvinte de `resize` da
//     janela, e é esse ouvinte que some se um bump de lib desligar o
//     acompanhamento.
//
// Por que `transform` e não `margin` para deslocar o gatilho: deslocar é mecânica
// de cena, e `transform` é propriedade mecânica para o portão de estilo inline;
// `margin` é valor de desenho e reprovaria. Ele também não muda o TAMANHO de
// nada, então o `ResizeObserver` do acompanhamento não entra na conta.

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
 * **O que ele NÃO é: a defesa contra a troca de fonte.** A versão anterior deste
 * comentário atribuía o salto `left 177 → 185` a um plateau INTERMEDIÁRIO do
 * reposicionamento, e isso está factualmente errado — aquele salto era reflow de
 * FONTE, e quem o resolve é o `fontsSettled` logo abaixo. Os ~190ms parados
 * ultrapassavam os 114ms da troca por ACASO, e bastava a rede ficar mais lenta
 * ou a cena crescer para o número deixar de bastar. Aqui ele fica sendo o que
 * sempre deveria ter sido: tolerância a reposicionamento em PASSOS, que existe
 * de verdade — com o gatilho dentro de um ancestral rolável a lib reposiciona em
 * mais de um degrau, e entre os degraus a coordenada fica parada tempo
 * suficiente para enganar um critério curto.
 */
const STABLE_READS = 6;

/**
 * Espera a CENA parar de reflowar antes de medir pixel nenhum.
 *
 * Medido no vanilla em 2026-09-18, com a story rodando FRIA (só a `Controlled`
 * no filtro, não o arquivo inteiro): aos 114ms da play, sem ninguém ter tocado
 * em nada, o gatilho andou sozinho de `left 109.39` para `116.16` e engordou de
 * `55.39` para `57.38`. Não é o componente e não é a rolagem — é a troca de
 * fonte. O `preview-head.html` desta stack carrega Inter e Outfit do Google
 * Fonts com `display=swap`, então a primeira pintura sai na fonte de reserva e o
 * texto REFLUI quando as duas chegam; o gatilho é um `<a>` inline no meio de um
 * parágrafo, e reflui com ele. O painel media então 177.09 (centrado na caixa
 * VELHA do gatilho) e 184.84 (na caixa nova): os 7.75px são METADE dos 15.5px
 * que o parágrafo mudou de largura, porque o painel é centrado no gatilho — e
 * caíam exatamente em cima da tolerância de 2px.
 *
 * Medido NESTA stack no mesmo dia, instrumentando a entrada da sonda na mesma
 * rodada fria e isolada: quando `checkPanelFollowsTrigger` começa,
 * `document.fonts.status` ainda é `loading`, e 46ms depois a caixa do gatilho
 * engorda de `55.39` para `57.38` — os mesmos números do vanilla. A asserção
 * passava porque o degrau de `startAt` gasta ~190ms antes de ler o `before`, e
 * esses 190ms engoliam a troca por COINCIDÊNCIA. Com esta espera a defesa passa
 * a ser explícita, e o `STABLE_READS` volta a responder só pelo que é dele.
 *
 * Latente por construção, e é o que faz dele um caso de "não reproduz": rodando
 * o ARQUIVO inteiro, as stories anteriores já pagaram a troca de fonte e a mesma
 * medição passa. `document.fonts.ready` resolve na hora quando as fontes já
 * estão em memória, então isto não custa nada nas rodadas em que não era preciso.
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

/** Coordenada que a cena observa: a borda esquerda da caixa do painel. */
function leftEdge(panel: HTMLElement): number {
  return panel.getBoundingClientRect().left;
}

/**
 * Cutuca o acompanhamento e espera o painel parar de onde estava.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 */
async function nudgeAndMeasure(panel: HTMLElement, from: number, timeout = 1200): Promise<number> {
  window.dispatchEvent(new Event('resize'));
  await nextFrames(2);
  const deadline = performance.now() + timeout;
  // 1. espera a coordenada MUDAR — antes disso não há o que medir, e um
  //    critério só de estabilidade aprovaria o painel PARADO.
  let current = leftEdge(panel);
  while (current === from && performance.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 32));
    current = leftEdge(panel);
  }
  // 2. e então espera ela PARAR de mudar, pelo critério de `STABLE_READS`. Se o
  //    painel não se moveu, este degrau devolve o mesmo valor em ~190ms e a
  //    asserção reprova, que é o que se quer.
  return settledEdge(panel, 'left', Math.max(400, deadline - performance.now()));
}

/**
 * Desloca `shifted` 40px para a direita e afirma que o painel andou os mesmos
 * 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO. Medido nesta stack sem ele, na `States/Controlled`: o gatilho andou
 * 40px e o painel andou 25, partindo de `left 0`. Com `startAt`, a cena primeiro
 * leva o gatilho para longe da borda e só então mede os 40px.
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
  let before: number;
  let after: number;

  try {
    if (startAt !== 0) {
      shifted.style.transform = `translateX(${startAt}px)`;
      await nudgeAndMeasure(panel, leftEdge(panel));
    }
    before = leftEdge(panel);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    after = await nudgeAndMeasure(panel, before);
  } finally {
    // Prazo curto na restauração: se a asserção já vai reprovar, o painel não
    // acompanha nada e esperar o prazo inteiro só encareceria a reprovação.
    shifted.style.transform = previous;
    await nudgeAndMeasure(panel, leftEdge(panel), 300);
  }

  await expect(Number.isFinite(before)).toBe(true);
  // A diferença inteira na mensagem: "andou 0px" diz que o painel ficou parado,
  // "andou 20px" diz que a borda da janela o travou — dois defeitos distintos.
  const moved = after - before;
  if (Math.abs(moved - SHIFT) > TOLERANCE) {
    throw new Error(
      `O gatilho andou ${SHIFT}px e o painel andou ${moved}px (esquerda ${before}px → ${after}px).`,
    );
  }
  await expect(Math.abs(moved - SHIFT)).toBeLessThanOrEqual(TOLERANCE);
}

/**
 * Lê uma borda da caixa do painel até ela PARAR de mudar, ou até o prazo acabar.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 */
async function settledEdge(
  panel: HTMLElement,
  edge: 'left' | 'top',
  timeout = 1200,
): Promise<number> {
  const deadline = performance.now() + timeout;
  let last = panel.getBoundingClientRect()[edge];
  let stable = 0;
  while (performance.now() < deadline && stable < STABLE_READS) {
    await new Promise<void>((resolve) => { setTimeout(resolve, 32); });
    const current = panel.getBoundingClientRect()[edge];
    stable = Math.abs(current - last) < 0.5 ? stable + 1 : 0;
    last = current;
  }
  return last;
}

/**
 * Rola `scroller` — um ancestral rolável DE VERDADE do gatilho — e afirma as
 * duas metades que separam reposicionar de dispensar:
 *
 *  1. o painel aberto CONTINUA no documento e continua sendo o MESMO nó;
 *  2. ele andou o MESMO tanto que o gatilho.
 *
 * Por que isto não é o `checkPanelFollowsTrigger` com outro nome: aquele cutuca
 * o acompanhamento por um `resize` da janela, e nas libs que reposicionam os
 * eventos de rolagem e de redimensionamento passam pelo mesmo `update` do mesmo
 * `autoUpdate` — o cutucão prova que a conta roda de novo, e não prova que a
 * rolagem deixa o cartão vivo. Foi a lacuna que a D10 do hover-card registrou:
 * as cinco sondas cutucavam reposicionamento, e nenhuma afirmava sobrevivência.
 *
 * Aqui quem reposiciona é o `autoUpdate` do `@floating-ui` que o bits-ui liga
 * com `ancestorScroll` no default (`use-floating-layer.svelte.js:191-201`) — é
 * esse degrau que some num bump que o desligue, e é ele que este passo cobra.
 * **No vue a asserção é a OPOSTA** (`checkAncestorScrollDismissesPanel`), porque
 * a `reka-ui` dispensa o cartão em vez de reposicioná-lo; é a exceção declarada
 * da D10, e nome igual sobre comportamento oposto seria mentira na leitura de
 * quem compara as cinco.
 *
 * A rolagem é REAL — `scrollTop` de um contêiner com `overflow` —, e não um
 * `Event('scroll')` despachado à mão: só a de verdade chega ao ouvinte que o
 * `autoUpdate` registrou naquele ancestral, e só ela move o gatilho.
 *
 * Mede as duas caixas com `getBoundingClientRect()` e compara os DELTAS, em vez
 * da coordenada que o posicionador publica: é a única forma que serve às cinco
 * sem saber qual delas escreve `left` no painel e qual escreve `transform` no
 * invólucro — e nesta stack é a segunda, o `[data-bits-floating-content-wrapper]`.
 * O invariante é o mesmo nas cinco: o vão entre gatilho e painel sobrevive à
 * rolagem.
 *
 * `stillOpen` entra por PARÂMETRO porque a consulta ao portal é do componente, e
 * não da sonda — esta serve os vários consumidores de posicionamento flutuante
 * da stack, cada um com o seu seletor de painel.
 *
 * A ordem dos três elementos é `(panel, trigger, scroller)`, igual à das outras
 * stacks que fazem esta mesma pergunta: os três são `HTMLElement`, então trocar
 * dois deles não acorda compilador nenhum, e a asserção passaria a medir a coisa
 * errada em silêncio.
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
    sideBefore: '',
    sideAfter: '',
    connected: false,
    same: false,
    room: 0,
  };

  try {
    measurement.room = scroller.scrollHeight - scroller.clientHeight - previous;
    measurement.panelBefore = await settledEdge(panel, 'top');
    measurement.sideBefore = panel.getAttribute('data-side') ?? '';
    measurement.triggerBefore = trigger.getBoundingClientRect().top;
    // `scrollTop` aplica o deslocamento na hora; o EVENTO de rolagem é que vem
    // no próximo quadro, e é ele que o acompanhamento escuta. Daí os quadros
    // antes de esperar a coordenada assentar.
    scroller.scrollTop = previous + by;
    await nextFrames(3);
    measurement.triggerAfter = trigger.getBoundingClientRect().top;
    measurement.panelAfter = await settledEdge(panel, 'top');
    measurement.sideAfter = panel.getAttribute('data-side') ?? '';
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
  //
  // O `data-side` entra na mensagem porque ele separa dois defeitos que o
  // número sozinho confunde: painel PARADO (andou 0px, mesmo lado) e painel que
  // VIROU de lado durante a rolagem — este segundo é reposicionamento legítimo
  // da lib, e quem o vê tem de corrigir a CENA (dar respiro ao painel), não a
  // asserção.
  const panelMoved = measurement.panelAfter - measurement.panelBefore;
  await expect(
    Math.abs(panelMoved - triggerMoved),
    `O gatilho andou ${triggerMoved.toFixed(1)}px com a rolagem (topo `
      + `${measurement.triggerBefore.toFixed(1)}px → ${measurement.triggerAfter.toFixed(1)}px) `
      + `e o painel andou ${panelMoved.toFixed(1)}px (topo ${measurement.panelBefore.toFixed(1)}px → `
      + `${measurement.panelAfter.toFixed(1)}px, lado ${measurement.sideBefore || '?'} → `
      + `${measurement.sideAfter || '?'}).`,
  ).toBeLessThanOrEqual(TOLERANCE);
}
