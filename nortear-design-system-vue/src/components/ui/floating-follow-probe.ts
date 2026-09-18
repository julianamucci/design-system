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
//  1. **a cena não pode rolar a janela.** A `reka-ui` DISPENSA o cartão quando um
//     ancestral rolável do gatilho rola — `HoverCardContentImpl.js:150-153`
//     escuta `scroll` em `window` na fase de captura e chama `onDismiss()` se o
//     alvo do evento contém o gatilho. Rolar aqui não provaria acompanhamento:
//     fecharia o cartão. (E um `new Event('scroll')` disparado em `window` ainda
//     por cima explodiria dentro do ouvinte da lib, porque `window.contains` não
//     existe.) A cena move o GATILHO e cutuca o `autoUpdate` do `@floating-ui`
//     pelo caminho que a lib mantém e que nada dispensa: o `resize` da janela.
//     É esse ouvinte que some se um bump de lib desligar o acompanhamento.
//  2. **a coordenada não está no painel.** Quem recebe posição é o invólucro
//     anônimo que a lib monta em volta (`transform: translate(...)` vindo do
//     `floatingStyles`), e o painel não tem `left` nenhum para ler. A medida é a
//     caixa do painel — e ela é estável porque desde a D14 nada anima aqui, nem
//     na entrada nem na saída.
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

/**
 * Espera de CONTROLE antes de rolar, em ms.
 *
 * É ela que separa "a rolagem dispensou o cartão" de "o cartão fechou sozinho
 * enquanto a play esperava". Sem ela o degrau de dispensa passaria com um
 * componente que fecha por qualquer motivo, inclusive por defeito.
 */
const CONTROL_WAIT = 400;

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
 * `document.fonts.status` ainda é `loading`, e 34ms depois a caixa do gatilho
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
function bordaEsquerda(panel: HTMLElement): number {
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
async function moverEMedir(panel: HTMLElement, antes: number, timeout = 1200): Promise<number> {
  window.dispatchEvent(new Event('resize'));
  await nextFrames(2);
  const fim = performance.now() + timeout;
  // 1. espera a coordenada MUDAR — antes disso não há o que medir, e um
  //    critério só de estabilidade aprovaria o painel PARADO.
  let atual = bordaEsquerda(panel);
  while (atual === antes && performance.now() < fim) {
    await new Promise<void>((resolve) => setTimeout(resolve, 32));
    atual = bordaEsquerda(panel);
  }
  // 2. e então espera ela PARAR de mudar (ver `STABLE_READS`). Se o painel não
  //    se moveu, este degrau devolve o mesmo valor em ~190ms e a asserção
  //    reprova, que é o que se quer.
  return settledEdge(panel, 'left', Math.max(400, fim - performance.now()));
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
 * Desloca `shifted` 40px para a direita e afirma que o painel andou os mesmos
 * 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO. Com `startAt`, a cena primeiro leva o gatilho para longe da borda e só
 * então mede os 40px.
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
      await moverEMedir(panel, bordaEsquerda(panel));
    }
    before = bordaEsquerda(panel);
    shifted.style.transform = `translateX(${startAt + SHIFT}px)`;
    after = await moverEMedir(panel, before);
  } finally {
    // Prazo curto na restauração: se a asserção já vai reprovar, o painel não
    // acompanha nada e esperar o prazo inteiro só encareceria a reprovação.
    shifted.style.transform = previous;
    await moverEMedir(panel, bordaEsquerda(panel), 300);
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
 * Rola `scroller` — um ancestral rolável DE VERDADE do gatilho — e afirma que o
 * cartão é DISPENSADO: o painel sai do documento, e sai POR CAUSA da rolagem.
 *
 * **Esta função afirma o OPOSTO da irmã das outras quatro stacks**, e é de
 * propósito. A D10 do hover-card mede quatro stacks reposicionando o painel
 * quando um ancestral rolável rola e UMA dispensando-o: a `reka-ui` escuta
 * `scroll` em `window` na fase de CAPTURA e chama `onDismiss()` se o alvo do
 * evento contém o gatilho (`HoverCardContentImpl.js:150-153`). Nas outras a
 * função equivalente chama-se `checkPanelSurvivesAncestorScroll` e cobra a
 * sobrevivência; aqui o nome diz o que esta stack faz, porque nome igual sobre
 * comportamento oposto seria mentira na leitura de quem compara as cinco.
 *
 * O que ela é: o PORTÃO da exceção declarada. Enquanto a exceção só existia em
 * prosa no PRD, um bump da `reka-ui` que passasse a reposicionar deixaria a
 * suíte verde e a D10 errada. Com este passo, o dia em que a lib mudar é o dia
 * em que a asserção reprova e o documento volta para a mesa.
 *
 * Por que não bastava o `checkPanelFollowsTrigger`: ele cutuca o
 * acompanhamento por um `resize` da janela, e nas libs que reposicionam rolagem
 * e redimensionamento passam pelo MESMO `update` do mesmo `autoUpdate` — o
 * cutucão prova que a conta roda de novo, e não prova nada sobre rolagem. É
 * exatamente a lacuna que a D10 registrou.
 *
 * A rolagem é REAL — `scrollTop` de um contêiner com `overflow` —, e não um
 * `Event('scroll')` despachado à mão. Além de só a de verdade chegar ao ouvinte
 * daquele ancestral, `new Event('scroll')` disparado em `window` EXPLODE dentro
 * do ouvinte da `reka-ui`: ele faz `event.target.contains(gatilho)`, e `window`
 * não tem `contains`. O erro que sai de lá não fala de rolagem nenhuma, e já
 * custou uma rodada a quem foi por esse caminho.
 *
 * A ordem dos três elementos é `(panel, trigger, scroller)`, IGUAL à das outras
 * quatro stacks, e a uniformidade aqui não é estética. O NOME diverge de
 * propósito — comportamento oposto, rótulo igual seria mentira —, mas a ordem
 * divergir é diferença gratuita: `trigger` e `scroller` são os dois
 * `HTMLElement`, então quem lê a chamada de uma stack e escreve noutra troca os
 * dois e a asserção passa a medir a coisa errada sem o compilador ver nada. Foi
 * exatamente o defeito que o svelte teve em 2026-09-18.
 *
 * Não recebe `stillOpen`, e é a única coisa que esta assinatura tira das outras:
 * lá a consulta ao portal separa "o painel continua montado" de "o painel aberto
 * ainda é O MESMO nó", e aqui a metade afirma AUSÊNCIA — quem consulta o portal
 * é a própria asserção da story, depois da dispensa.
 *
 * Restaura o `scrollTop` num `finally`, ANTES de afirmar, pelo mesmo motivo do
 * irmão acima: o replay do painel Interactions parte do estado original.
 */
export async function checkAncestorScrollDismissesPanel(
  panel: HTMLElement,
  trigger: HTMLElement,
  scroller: HTMLElement,
  { by = SCROLL_BY }: { by?: number } = {},
): Promise<void> {
  // Mesma precondição da sonda irmã: este passo cobra que o GATILHO tenha se
  // movido com a rolagem, e a troca de fonte move o gatilho por conta própria —
  // um reflow no meio da espera de controle falsearia esse degrau nos dois
  // sentidos.
  await fontsSettled();

  const previous = scroller.scrollTop;
  const measurement = {
    survivedTheWait: false,
    connected: true,
    triggerBefore: Number.NaN,
    triggerAfter: Number.NaN,
    room: 0,
  };

  try {
    measurement.room = scroller.scrollHeight - scroller.clientHeight - previous;
    // Espera de CONTROLE: o mesmo relógio que a rolagem vai consumir, sem rolar
    // nada. Sem ela a asserção de ausência mediria a espera, e não a rolagem.
    await new Promise<void>((resolve) => { setTimeout(resolve, CONTROL_WAIT); });
    measurement.survivedTheWait = panel.isConnected;

    measurement.triggerBefore = trigger.getBoundingClientRect().top;
    // `scrollTop` aplica o deslocamento na hora; o EVENTO de rolagem é que vem
    // no próximo quadro, e é ele que a lib escuta.
    scroller.scrollTop = previous + by;
    await nextFrames(3);
    measurement.triggerAfter = trigger.getBoundingClientRect().top;
    // Laço de RELÓGIO e não `waitFor`: a lib desmonta o portal de forma
    // assíncrona, e `waitFor` aqui reagendaria por observador de mutação — que
    // é justamente o que o desmonte produz.
    const deadline = performance.now() + 1000;
    while (panel.isConnected && performance.now() < deadline) {
      await new Promise<void>((resolve) => { setTimeout(resolve, 32); });
    }
    measurement.connected = panel.isConnected;
  } finally {
    scroller.scrollTop = previous;
    await nextFrames(3);
  }

  // A cena precisa ter rolado de verdade: contêiner sem transbordo devolveria
  // gatilho parado, e a dispensa passaria sem medir nada.
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

  // O cartão estava VIVO no instante anterior à rolagem. Esta é a metade que
  // transforma "sumiu" em "a rolagem dispensou".
  await expect(
    measurement.survivedTheWait,
    `O cartão já tinha fechado durante os ${CONTROL_WAIT}ms de espera, ANTES de a cena rolar: `
      + 'o passo mediria a espera, não a rolagem.',
  ).toBe(true);

  await expect(
    measurement.connected,
    'Rolar o ancestral NÃO dispensou o cartão: o painel continuou no documento. '
      + 'Se a `reka-ui` passou a reposicionar em vez de dispensar, a exceção declarada da D10 '
      + '(docs/shared/prd/hover-card.md §3) caiu — corrija o PRD e troque este passo pelo '
      + '`checkPanelSurvivesAncestorScroll` das outras quatro stacks.',
  ).toBe(false);
}
