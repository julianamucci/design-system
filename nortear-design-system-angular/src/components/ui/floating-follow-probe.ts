// ─── Sonda de acompanhamento do painel flutuante ─────────────────────────────
//
// Apoio das plays que provam que um painel ABERTO continua colado ao gatilho
// quando o gatilho se move (D10). O equivalente do Vanilla é
// `nortear-design-system-vanilla/src/components/ui/floating-follow-probe.ts`, e
// esta é a mesma pergunta medida com os instrumentos desta stack. Fica fora dos
// `*.stories.ts` porque ali todo export nomeado vira story.
//
// Nesta stack quem acompanha é o `autoUpdate` do `@floating-ui/dom`, ligado pelo
// `RdxPopperContentWrapper` enquanto o positioner está montado
// (`radix-ng-primitives-popper.mjs`, o `afterRenderEffect` que chama
// `autoUpdate(anchor, …, () => this.position.reload())`). Sem asserção nenhuma,
// um bump de lib que o desligasse fecharia a suíte VERDE.
//
// **Duas coisas mudam em relação ao Vanilla, as duas MEDIDAS, não presumidas:**
//
//  1. **a cena cutuca por `scroll`, e pode.** O `autoUpdate` escuta `scroll` em
//     cada ancestral rolável do gatilho e do painel e na JANELA (defaults
//     `ancestorScroll`/`ancestorResize` ligados), e o radix-ng NÃO dispensa o
//     cartão por rolagem — nem o preview-card nem a camada dispensável têm
//     ouvinte de rolagem que feche, ao contrário da `reka-ui`, que por isso
//     obriga o vue a cutucar por `resize`.
//  2. **a coordenada não está no painel.** Quem recebe `top`/`left` é o
//     `.nds-hover-card-positioner`; o painel não tem coordenada própria para
//     ler, ao contrário do Vanilla. A medida é a caixa do painel, e ela é
//     estável porque desde a D14 nada anima aqui, nem na entrada nem na saída.
//
// Por que `transform` e não `margin` para deslocar o gatilho: deslocar é
// mecânica de cena, e `transform` é propriedade mecânica para o portão de estilo
// inline; `margin` é valor de desenho e reprovaria. Ele também não muda o
// TAMANHO de nada, então o `ResizeObserver` do acompanhamento não entra na conta
// — quem move o painel aqui é só a rolagem, que é o que se quer provar.

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
 * O que este número cobre é o plateau INTERMEDIÁRIO do reposicionamento: com o
 * gatilho dentro de um ancestral rolável a conta roda em mais de um passo, e
 * entre os passos a coordenada fica parada tempo suficiente para enganar um
 * critério de três quadros.
 *
 * **O que ele NÃO cobre, e a versão anterior deste comentário errava ao dizer
 * que sim: o `left 177 → 185`.** Aqueles 8px eram troca de FONTE, não plateau —
 * a medição está em `fontsSettled`, logo abaixo. Os ~190ms daqui passavam por
 * cima dos ~114ms da troca por ACASO, e bastaria a rede ficar mais lenta ou a
 * cena crescer para o número deixar de bastar. Quem espera a fonte é
 * `fontsSettled`; este critério é a tolerância a reposicionamento em passos, que
 * existe de verdade e é outra coisa.
 *
 * O número é o mesmo nas cinco stacks de propósito: a pergunta — "o painel
 * PAROU?" — tem de ser a mesma para que comparar as cinco páginas responda
 * alguma coisa.
 */
const STABLE_READS = 6;

/** Intervalo entre duas leituras do critério de assentamento, em ms. */
const READ_INTERVAL = 32;

/**
 * Espera a CENA parar de reflowar antes de medir pixel nenhum.
 *
 * Medido nesta stack em 2026-09-18, na `States/Controlled` rodando FRIA (só ela
 * no filtro): na entrada da play `document.fonts.status` é `loading`, e 199ms
 * depois o gatilho andou sozinho de `left 109.39` para `116.16` e engordou de
 * `55.39` para `57.38` — sem ninguém ter tocado em nada. Não é o componente e
 * não é a rolagem: é a troca de fonte. O `preview-head.html` carrega Inter e
 * Outfit do Google Fonts com `display=swap`, então a primeira pintura sai na
 * fonte de reserva e o texto REFLUI quando as duas chegam; o gatilho é um `<a>`
 * inline no meio de um parágrafo, e reflui com ele.
 *
 * O estrago é o pior tipo: o painel é centrado no gatilho, então os 6.77px de
 * deslocamento mais metade dos 1.99px de largura dão 7.75px de salto no painel —
 * em cima de uma tolerância de 2px. A asserção acusaria o painel de andar 48px
 * onde ele andou 40, e o componente está certo.
 *
 * Latente por construção, e é o que faz dele um caso de "não reproduz": rodando
 * o ARQUIVO inteiro, as stories anteriores já pagaram a troca de fonte e a mesma
 * medição passa. `document.fonts.ready` resolve na hora quando as fontes já
 * estão em memória, então isto não custa nada nas rodadas em que não era
 * preciso.
 */
async function fontsSettled(): Promise<void> {
  await document.fonts.ready;
}

/** Espera `count` quadros — o acompanhamento agrupa por `requestAnimationFrame`. */
export async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

/**
 * Lê uma coordenada da caixa do elemento até ela PARAR de mudar, ou até o prazo
 * acabar.
 *
 * Laço de RELÓGIO, e não `waitFor`: a leitura força layout, e condição que força
 * layout dentro do `waitFor` reagenda a si mesma pelo observador de mutação —
 * pendura sem reportar em vez de reprovar. O laço desiste no prazo e devolve o
 * que leu, para a asserção falar em pixels.
 *
 * O eixo entra por função de leitura porque as duas medições desta sonda usam
 * eixos diferentes: deslocar o gatilho é horizontal, rolar um ancestral é
 * vertical. Duas cópias do laço divergiriam no dia em que o prazo mudasse numa
 * delas.
 *
 * O compasso é de RELÓGIO (32ms), e não de quadro: o plateau intermediário do
 * reposicionamento em dois passos dura mais que um punhado de quadros, e um
 * critério em `requestAnimationFrame` declararia assentado o valor do meio.
 */
async function settledCoordinate(
  element: HTMLElement,
  read: (box: DOMRect) => number,
  timeout = 1200,
): Promise<number> {
  const deadline = performance.now() + timeout;
  let last = read(element.getBoundingClientRect());
  let stable = 0;
  while (performance.now() < deadline && stable < STABLE_READS) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, READ_INTERVAL);
    });
    const current = read(element.getBoundingClientRect());
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
  let current = panel.getBoundingClientRect().left;
  while (current === from && performance.now() < deadline) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, READ_INTERVAL);
    });
    current = panel.getBoundingClientRect().left;
  }
  return settledCoordinate(
    panel,
    (box) => box.left,
    Math.max(400, deadline - performance.now()),
  );
}

/**
 * Desloca `shifted` 40px para a direita, dispara `scroll` na janela e afirma que
 * o painel andou os mesmos 40px (±2).
 *
 * `startAt` existe para o gatilho encostado numa borda: ali o painel centrado
 * nasce travado no respiro da janela, e os primeiros pixels do deslocamento são
 * engolidos pelo travamento — o painel andaria menos que o gatilho estando
 * CERTO.
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
 * Rola um ancestral ROLÁVEL do gatilho e afirma as DUAS metades da D10: o cartão
 * não é dispensado, e ele acompanha o gatilho.
 *
 * **Por que esta sonda existe ao lado da de cima.** A outra desloca o gatilho e
 * cutuca por `resize`/`scroll` de JANELA. Nas libs que reposicionam, os dois
 * eventos entram pelo MESMO `update` do mesmo `autoUpdate` — então o cutucão
 * prova reposicionamento e NÃO prova sobrevivência à rolagem. A diferença entre
 * reposicionar e dispensar o cartão (que é o que a `reka-ui` faz no vue) só
 * aparece rolando um ancestral de verdade, com evento de rolagem de verdade:
 * mexer no `scrollTop` de um contêiner que rola é o que dispara os dois
 * caminhos ao mesmo tempo — o do acompanhamento e o do fechamento — e deixa o
 * resultado decidir qual das duas coisas a lib faz.
 *
 * As duas metades são asserções SEPARADAS, e nessa ordem:
 *
 *  1. `stillOpen()` devolve o MESMO nó — não `null` (dispensado) e não outro nó
 *     (fechado e reaberto);
 *  2. o painel andou o mesmo tanto que o gatilho.
 *
 * `stillOpen` entra por parâmetro porque a consulta ao portal é do COMPONENTE
 * (`panelOpen` do hover-card, do popover, do menu), e esta sonda serve os seis
 * consumidores do posicionamento flutuante da stack.
 *
 * A rolagem é DESFEITA num `finally`, antes de qualquer asserção, pelo mesmo
 * motivo do `transform` da sonda irmã: o replay do painel Interactions parte do
 * estado original.
 */
export async function checkPanelSurvivesAncestorScroll(
  panel: HTMLElement,
  trigger: HTMLElement,
  scroller: HTMLElement,
  { stillOpen, by = SCROLL_BY }: { stillOpen: () => HTMLElement | null; by?: number },
): Promise<void> {
  // Mesma precondição da sonda irmã: este passo compara o delta do gatilho com o
  // delta do painel, e a troca de fonte move o gatilho por conta própria.
  await fontsSettled();

  const start = scroller.scrollTop;
  const range = scroller.scrollHeight - scroller.clientHeight;
  // A cena antes da medição: contêiner que não rola faria as duas metades
  // passarem sem nada ter acontecido — é a forma de asserção sem dentes que a
  // D8 sobreviveu meses.
  await expect(
    range,
    `O ancestral precisa ROLAR de verdade: ${scroller.scrollHeight}px de conteúdo `
      + `em ${scroller.clientHeight}px de caixa dão ${range}px de curso, menos que os ${by}px do passo.`,
  ).toBeGreaterThanOrEqual(by);

  const measurement = {
    panelBefore: Number.NaN,
    panelAfter: Number.NaN,
    triggerBefore: Number.NaN,
    triggerAfter: Number.NaN,
    scrolled: Number.NaN,
  };
  const survivor: { panel: HTMLElement | null } = { panel: null };

  try {
    measurement.panelBefore = await settledCoordinate(panel, (box) => box.top);
    measurement.triggerBefore = trigger.getBoundingClientRect().top;
    // `scrollTop` aplica o deslocamento na hora; o EVENTO de rolagem é que vem
    // no próximo quadro, e é ele que o acompanhamento escuta. Daí os quadros
    // antes de esperar a coordenada assentar.
    scroller.scrollTop = start + by;
    measurement.scrolled = scroller.scrollTop - start;
    await nextFrames(3);
    measurement.triggerAfter = trigger.getBoundingClientRect().top;
    measurement.panelAfter = await settledCoordinate(panel, (box) => box.top);
    // Lido ANTES do `finally`: desfazer a rolagem é outra chance de a lib
    // dispensar, e o que se mede é o estado logo depois de rolar.
    survivor.panel = stillOpen();
  } finally {
    scroller.scrollTop = start;
    await nextFrames(2);
  }

  // Metade 1 — o cartão CONTINUA montado, e é o mesmo nó.
  await expect(
    survivor.panel,
    survivor.panel === null
      ? 'Rolar um ancestral do gatilho DISPENSOU o cartão: não sobrou painel no portal.'
      : 'Rolar um ancestral do gatilho fechou e reabriu o cartão: o painel no portal é OUTRO nó.',
  ).toBe(panel);

  // A rolagem aconteceu mesmo, e o gatilho subiu com ela. Sem isto, um
  // `scrollTop` que não pega deixaria a metade 2 comparando zero com zero.
  const triggerMoved = measurement.triggerAfter - measurement.triggerBefore;
  await expect(
    Math.abs(measurement.scrolled - by),
    `O contêiner deveria ter rolado ${by}px e rolou ${measurement.scrolled.toFixed(1)}px.`,
  ).toBeLessThanOrEqual(TOLERANCE);
  await expect(
    Math.abs(triggerMoved + by),
    `Rolando ${by}px, o gatilho deveria subir ${by}px e andou ${triggerMoved.toFixed(1)}px.`,
  ).toBeLessThanOrEqual(TOLERANCE);

  // Metade 2 — e andou JUNTO. A diferença inteira na mensagem: "andou 0px" diz
  // que o painel ficou parado no lugar de antes da rolagem.
  const panelMoved = measurement.panelAfter - measurement.panelBefore;
  await expect(
    Math.abs(panelMoved - triggerMoved),
    `O gatilho andou ${triggerMoved.toFixed(1)}px com a rolagem e o painel andou `
      + `${panelMoved.toFixed(1)}px (topo ${measurement.panelBefore.toFixed(1)}px → `
      + `${measurement.panelAfter.toFixed(1)}px).`,
  ).toBeLessThanOrEqual(TOLERANCE);
}
