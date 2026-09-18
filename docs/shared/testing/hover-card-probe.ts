/**
 * Colhedor compartilhado do HoverCard.
 *
 * O painel do cartão mora num portal no `<body>` — fora do `canvasElement` — e
 * nenhuma consulta de `within(canvasElement)` o alcança. Estas funções são a
 * única porta de entrada usada pelas cinco stacks, e existem por dois motivos:
 *
 *  1. **o mesmo contrato medido do mesmo jeito.** Cada stack roda uma lib
 *     diferente (base-ui, reka-ui, bits-ui, Radix NG, factory própria) e cada
 *     uma publica seus estados com atributos ligeiramente diferentes. O que as
 *     cinco têm em comum é `data-slot="hover-card-content"` — é por ele que a
 *     busca começa, e não pelo `role`, porque o `role` é justamente um dos
 *     itens sob teste;
 *  2. **a saída do ponteiro é difícil de simular certo.** Três libs montam um
 *     polígono de tolerância entre gatilho e painel; sair "para fora" com uma
 *     chamada só nunca escapa dele, e o teste passa a provar o contrário do que
 *     pretendia. `leaveWithPointer` encapsula a sequência correta.
 */

// @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
// que inclui este arquivo compartilhado: daqui o caminho de node_modules é o de
// docs/shared, que não tem as libs de teste. Mesmo marcador do slider-probe. Se
// algum dia resolver, ele passa a acusar sozinho.
import { expect, userEvent, waitFor } from 'storybook/test';
import {
  expectOndeDiz as expectOndeDizCompartilhado,
  noLugarDeEspera,
} from './ancoragem';

export const SELECTOR_PANEL = '[data-slot="hover-card-content"]';

/** Painel aberto, ou `null`. Consulta o documento inteiro, não o canvas. */
export function panelOpen(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(SELECTOR_PANEL);
}

/** Todos os painéis abertos — para as stories que mostram vários cartões. */
export function panelsAbertos(): HTMLElement[] {
  return [...document.body.querySelectorAll<HTMLElement>(SELECTOR_PANEL)];
}

/**
 * Aberto, ASSENTADO e POSICIONADO.
 *
 * O painel entra no DOM antes de a medição de posição terminar, e até lá as
 * libs o mantêm invisível — `visibility: hidden` (Radix NG), `opacity: 0`
 * (transição de entrada). Afirmar `toBeVisible` nesse intervalo reprova por
 * corrida, não por defeito: é a mesma armadilha que o `waitForPortal` de cada
 * stack resolve para os overlays com `role`, e aqui o `role` não serve de
 * âncora porque ele próprio está sob teste.
 *
 * O degrau de POSIÇÃO veio depois, e veio do Angular: o `hover-card.fixtures.ts`
 * daquela stack esperava por `data-side` com o comentário de que era "um sinal
 * mais preciso, neste stack, que a opacidade que o colhedor compartilhado usa".
 * Estava certo, e não era do Angular — era um degrau que faltava aqui. Enquanto
 * ele viveu só lá, o Angular foi a única stack que não reprovava por corrida, e
 * a divergência parecia peculiaridade da lib dele.
 */
function assentado(panel: HTMLElement | null): panel is HTMLElement {
  if (!panel) return false;
  if (panel.getAttribute('data-state') === 'closed') return false;
  const estilo = getComputedStyle(panel);
  if (estilo.visibility === 'hidden' || estilo.display === 'none') return false;
  const opacity = parseFloat(estilo.opacity);
  if (estilo.opacity !== '1' && opacity < 0.9) return false;
  return !noLugarDeEspera(panel);
}

export async function waitForOpen(contexto = '', timeout = 3000): Promise<HTMLElement> {
  await waitFor(
    () => {
      if (!assentado(panelOpen())) {
        throw new Error(`o cartão ainda não abriu e assentou ${contexto}`);
      }
    },
    { timeout, interval: 50 },
  );
  return panelOpen()!;
}

export async function waitForCount(quantos: number, timeout = 3000): Promise<HTMLElement[]> {
  await waitFor(
    () => {
      const prontos = panelsAbertos().filter(assentado).length;
      if (prontos !== quantos) throw new Error(`abertos ${prontos} cartões, esperado ${quantos}`);
    },
    { timeout, interval: 50 },
  );
  return panelsAbertos();
}

export async function waitForClosed(contexto = '', timeout = 3000): Promise<void> {
  // `waitFor` e não asserção seca. A RAZÃO mudou em 2026-09-17, com a D14: não
  // existe mais transição de saída para esperar em stack nenhuma. O que sobra é o
  // desmonte do portal, assíncrono em parte das libs — asserção seca logo depois
  // do gesto leria o painel ainda montado.
  await waitFor(
    () => {
      if (panelOpen()) throw new Error(`o cartão ainda está aberto ${contexto}`);
    },
    { timeout, interval: 50 },
  );
}

/** Centro de um elemento em coordenadas de viewport. */
function center(el: HTMLElement): { clientX: number; clientY: number } {
  const r = el.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
}

/**
 * Tira o ponteiro de cima do gatilho E da ponte de tolerância.
 *
 * Três paradas numa ÚNICA chamada, e as três são necessárias:
 *
 *  1. o gatilho — cada chamada direta do `userEvent` nasce com o ponteiro em
 *     lugar nenhum, então sem esta parada não há de onde sair e o
 *     `pointerleave` do gatilho, que é o que arma a ponte, nunca acontece;
 *  2. um ponto fora do gatilho — dispara o `pointerleave` e monta o polígono
 *     de tolerância entre a saída e o painel;
 *  3. um ponto além do polígono — é só aqui que o fechamento é pedido.
 *
 * As coordenadas são explícitas de propósito: sem `coords` o user-event dispara
 * tudo em (0,0) e o ponto nunca sai do polígono.
 */
export async function leaveWithPointer(trigger: HTMLElement, panel: HTMLElement): Promise<void> {
  const r = panel.getBoundingClientRect();
  const y1 = Math.min(r.bottom + 40, window.innerHeight - 140);
  await userEvent.pointer([
    { target: trigger, coords: center(trigger) },
    { target: document.body, coords: { clientX: 2, clientY: y1 } },
    { target: document.body, coords: { clientX: 2, clientY: y1 + 120 } },
  ]);
}

/**
 * Leva o ponteiro do gatilho para dentro do painel, na mesma chamada.
 *
 * Separar em duas chamadas tornaria o teste vazio: sem a saída do gatilho não
 * há fechamento agendado, e "continua aberto" passaria mesmo com o componente
 * quebrado.
 */
export async function panelEntrar(trigger: HTMLElement, panel: HTMLElement): Promise<void> {
  await userEvent.pointer([
    { target: trigger, coords: center(trigger) },
    { target: panel, coords: center(panel) },
  ]);
}

/**
 * Vão padrão entre gatilho e painel do CARTÃO. As cinco stacks declaram o mesmo
 * número; quem mudar um lado sem mudar o outro reprova aqui.
 */
export const SIDE_OFFSET_PADRAO = 4;

/**
 * Deslocamento no eixo CRUZADO, e ele é zero nas cinco (D11, 2026-09-17).
 *
 * Mora ao lado do vão de propósito. O react declarava 4 aqui enquanto as outras
 * quatro declaravam 0 ou nada, e a divergência sobreviveu meses porque a D9 —
 * que fixou o `sideOffset` em 4 — dava a impressão de ter tratado os dois eixos.
 * São dois números com o mesmo valor de origem e significados opostos; separados
 * em arquivos diferentes, o segundo some atrás do primeiro.
 *
 * E o efeito não é só em `start`/`end`, que era a leitura anterior: com
 * `align: 'center'` — o padrão de TODAS as stories das cinco — base-ui, radix-ng
 * e a conta do vanilla APLICAM o deslocamento cruzado; só o `@floating-ui` o
 * ignora ali. O painel do react saía 4px fora do lugar na configuração que todo
 * mundo exercita, e nenhuma asserção via, porque nenhuma afirma a coordenada do
 * eixo cruzado.
 */
export const ALIGN_OFFSET_PADRAO = 0;

/**
 * A ancoragem em si mora em `ancoragem.ts`, e não aqui, porque o invariante não
 * é do cartão: a mesma declaração de folha derrubou tooltip, hover-card e a
 * família do dropdown-menu. Reexportado para que as stories das cinco stacks
 * continuem importando de um lugar só.
 */
export { medirAncoragem, noLugarDeEspera, type Ancoragem } from './ancoragem';

/**
 * O painel DAQUELE gatilho, pelo `aria-describedby`.
 *
 * A story dos lados abre quatro cartões ao mesmo tempo, e parear por ORDEM não
 * serve: a ordem no portal é de montagem, não a da tela, e varia entre as libs.
 * O `aria-describedby` é o vínculo que as cinco já mantêm — é ele que aponta o
 * gatilho para o painel enquanto o painel existe.
 */
export function painelDoGatilho(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-describedby');
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

/**
 * Todo gatilho ABERTO com o painel dele, pareados.
 *
 * Pelo `data-slot`, e não pelo nome acessível: as cinco stacks rotulam os
 * gatilhos da story dos lados de jeitos diferentes — UMA acrescenta `aria-label`,
 * o vanilla, em três pontos das composições; a linha aqui dizia "duas" e a
 * medição de 2026-09-17 achou uma — e parear por nome faria a asserção divergir
 * stack a stack, que
 * é exatamente o que uma asserção compartilhada existe para evitar.
 */
export function paresAbertos(canvasElement: HTMLElement): Array<[HTMLElement, HTMLElement]> {
  const gatilhos = [
    ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="hover-card-trigger"]'),
  ];
  return gatilhos
    .map((t) => [t, painelDoGatilho(t)] as const)
    .filter((par): par is [HTMLElement, HTMLElement] => par[1] !== null)
    .map(([t, p]) => [t, p]);
}

export function expectOndeDiz(
  trigger: HTMLElement,
  panel: HTMLElement,
  sideOffset = SIDE_OFFSET_PADRAO,
): void {
  expectOndeDizCompartilhado(trigger, panel, sideOffset);
}

/**
 * O painel está CENTRADO no gatilho, no eixo cruzado (D11).
 *
 * Afirma a COORDENADA, e não o valor da opção — afirmar `alignOffset === 0`
 * seria repetir a constante para ela mesma, que é a forma de asserção que deixou
 * a D8 passar meses. Aqui o que se mede é onde o painel FICOU: com
 * `align: 'center'` e deslocamento cruzado zero, o centro do painel coincide com
 * o centro do gatilho no eixo perpendicular ao lado escolhido.
 *
 * A tolerância de 1,5px não é folga arbitrária: é arredondamento de subpixel de
 * três motores de posicionamento diferentes. O defeito que isto pega — 4px de
 * deslocamento — está bem acima dela.
 *
 * Em `side` top/bottom o eixo cruzado é o HORIZONTAL; em left/right, o vertical.
 * Quem passa o lado é a story, que é quem o pediu.
 */
export function expectCentradoNoEixoCruzado(
  trigger: HTMLElement,
  panel: HTMLElement,
  side: 'top' | 'bottom' | 'left' | 'right',
): void {
  const g = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const horizontal = side === 'top' || side === 'bottom';
  const centroGatilho = horizontal ? g.left + g.width / 2 : g.top + g.height / 2;
  const centroPainel = horizontal ? p.left + p.width / 2 : p.top + p.height / 2;
  const desvio = Math.abs(centroPainel - centroGatilho);
  expect(
    desvio,
    `painel fora do centro do gatilho no eixo cruzado: ${desvio.toFixed(1)}px `
      + `(lado ${side}, tolerância 1.5px). Deslocamento cruzado tem de ser ${ALIGN_OFFSET_PADRAO} — D11.`,
  ).toBeLessThanOrEqual(1.5);
}

/**
 * Afasta a cena da borda, mede, e devolve tudo ao lugar.
 *
 * O executor de teste NÃO aplica o `layout: 'centered'` do Storybook — isso é do
 * canvas, e no vitest a story renderiza encostada à ESQUERDA. Medido em
 * 2026-09-17: gatilho em `left 116.2`, painel de 320px travado em `left 0`,
 * centro 15,2px fora do lugar. Ou seja, `expectCentradoNoEixoCruzado` não pode
 * passar no Playground sem afastar a cena primeiro — o painel não está
 * descentrado por defeito, está batendo na borda da janela.
 *
 * Mora aqui, e não em cada story, porque cinco stacks inventariam cinco formas
 * de afastar a cena e a comparação entre elas deixaria de responder alguma
 * coisa. É a mesma razão de `expectOndeDiz` ser compartilhado.
 *
 * O NOME é em inglês porque a catraca `identificador_pt_novo` reprovou a primeira
 * versão dele em TRÊS stacks de uma vez: o nome de um export compartilhado vira
 * identificador em todo arquivo que o importa, então ele multiplica dívida em vez
 * de criar uma.
 *
 * `transform` e não `margin`: é propriedade mecânica, então não cai no portão de
 * estilo inline, e não reflui o layout que se quer medir. O `resize` é o que
 * cutuca o reposicionamento das libs sem tocar em ROLAGEM — em pelo menos uma
 * delas rolar DISPENSA o cartão em vez de reposicioná-lo. Restaura num `finally`
 * porque o painel Interactions reexecuta a play no mesmo DOM.
 */
export async function withSceneAwayFromEdge(
  canvasElement: HTMLElement,
  medir: () => void,
): Promise<void> {
  const anterior = canvasElement.style.transform;
  try {
    canvasElement.style.transform = 'translateX(240px)';
    window.dispatchEvent(new Event('resize'));
    await waitUntilSettled();
    medir();
  } finally {
    canvasElement.style.transform = anterior;
    window.dispatchEvent(new Event('resize'));
    await waitUntilSettled();
  }
}

/**
 * Espera a coordenada do painel PARAR de mudar, em vez de esperar um prazo.
 *
 * Aqui havia `setTimeout(150)`, e 150ms é chute — não é o tempo que a lib leva
 * para recolocar o painel, é o tempo que pareceu bastar na máquina de quem
 * escreveu. Medido em 2026-09-18, com uma suíte irmã carregando a máquina: o
 * passo do eixo cruzado reprovou por **219,8px** onde o defeito plantado causa
 * 3,9px, e a reconstrução mostrou o painel ainda na posição de ANTES do
 * deslocamento. A asserção estava certa; a leitura é que era velha.
 *
 * Esta é a forma que o CLAUDE.md prescreve para esperar coisa que a lib repinta:
 * laço de RELÓGIO com prazo. `waitFor` não serve, e por dois motivos — ele
 * reagenda por observador de mutação, e reposicionar não muta o DOM; e ler
 * geometria dentro dele força layout a cada tentativa, que é a armadilha que
 * pendura o arquivo inteiro sem reportar.
 *
 * Dois ciclos iguais e não um: a primeira igualdade pode ser o intervalo entre
 * dois passos da lib.
 */
async function waitUntilSettled(deadline = 1200): Promise<void> {
  const inicio = Date.now();
  let anterior: number | null = null;
  let iguais = 0;
  while (Date.now() - inicio < deadline) {
    await new Promise((resolve) => { setTimeout(resolve, 30); });
    const painel = panelOpen();
    // Arredonda ao décimo: subpixel de três motores de posicionamento oscila na
    // última casa sem que nada esteja se movendo, e sem isto o laço nunca fecha.
    const atual = painel ? Math.round(painel.getBoundingClientRect().left * 10) / 10 : null;
    if (atual !== null && atual === anterior) {
      iguais += 1;
      if (iguais >= 2) return;
    } else {
      iguais = 0;
    }
    anterior = atual;
  }
}

/**
 * Foco que a plataforma trata como NÃO sendo gesto do usuário.
 *
 * `trigger.focus()` pelado NÃO serve para provar a D12, e isto custou uma
 * medição: o Chromium só considera um foco de script invisível quando o foco
 * ANTERIOR veio do mouse — estado que os eventos do executor não produzem. Com
 * `.focus()` cru, `matches(':focus-visible')` dá **true** e o cartão abre até nas
 * stacks cujas libs já filtram corretamente. O passo reprovaria o comportamento
 * certo.
 *
 * `focusVisible: false` é a forma que a plataforma tem de dizer "este foco não é
 * gesto de usuário", que é a frase da D12 quase palavra por palavra.
 */
export function focusWithoutGesture(trigger: HTMLElement): void {
  trigger.focus({ focusVisible: false } as FocusOptions);
}

/** Contraste WCAG entre duas cores computadas (`rgb(...)` / `rgba(...)`). */
export function contrastRatio(corA: string, corB: string): number {
  const luminancia = (cor: string): number => {
    const [r, g, b] = (cor.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
    const canal = (v: number): number => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const a = luminancia(corA);
  const b = luminancia(corB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Nome acessível do painel, venha ele de `aria-label` ou de `aria-labelledby`.
 *
 * Desde 2026-09-02 o contrato é que ele seja VAZIO nas cinco: o painel perdeu o
 * `role="dialog"`, e nome próprio em elemento sem papel é `aria-prohibited-attr`
 * no axe. A função continua aqui — e continua olhando os dois caminhos —
 * justamente porque é ela que prova a ausência: cada stack resolvia o nome de um
 * jeito, e conferir só `aria-label` deixaria passar quem usava `aria-labelledby`.
 */
export function accessibleName(panel: HTMLElement): string {
  const labelled = panel.getAttribute('aria-labelledby');
  if (labelled) {
    const target = panel.ownerDocument.getElementById(labelled);
    if (target) return target.textContent?.trim() ?? '';
  }
  return panel.getAttribute('aria-label')?.trim() ?? '';
}
