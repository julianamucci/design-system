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
import { userEvent, waitFor } from 'storybook/test';

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
 * Aberto E ASSENTADO.
 *
 * O painel entra no DOM antes de a medição de posição terminar, e até lá as
 * libs o mantêm invisível — `visibility: hidden` (Radix NG), `opacity: 0`
 * (transição de entrada). Afirmar `toBeVisible` nesse intervalo reprova por
 * corrida, não por defeito: é a mesma armadilha que o `waitForPortal` de cada
 * stack resolve para os overlays com `role`, e aqui o `role` não serve de
 * âncora porque ele próprio está sob teste.
 */
function assentado(panel: HTMLElement | null): panel is HTMLElement {
  if (!panel) return false;
  if (panel.getAttribute('data-state') === 'closed') return false;
  const estilo = getComputedStyle(panel);
  if (estilo.visibility === 'hidden' || estilo.display === 'none') return false;
  const opacity = parseFloat(estilo.opacity);
  return !(estilo.opacity !== '1' && opacity < 0.9);
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

export async function waitForQuantidade(quantos: number, timeout = 3000): Promise<HTMLElement[]> {
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
  // `waitFor` e não asserção seca: fechado, o painel continua no DOM enquanto a
  // transição de saída roda (`[data-ending-style]`); só depois o portal desmonta.
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
