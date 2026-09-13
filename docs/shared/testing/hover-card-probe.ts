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
import { userEvent, waitFor, expect } from 'storybook/test';

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
 * O painel está no LUGAR DE ESPERA da lib, antes da primeira medição?
 *
 * As libs de linhagem Radix (reka no vue, bits no svelte) estacionam o painel
 * fora da tela enquanto o floating-ui não devolveu a posição, com um
 * `transform: translate(0, -200%)` INLINE no invólucro — e o comentário delas
 * diz exatamente isso: "keep off page when measuring". Nesse intervalo o painel
 * já está no DOM, já está visível e já publica `data-side`: tudo que uma sonda
 * costuma checar responde "pronto", e a posição ainda vai mudar.
 *
 * Medido em 2026-09-13, num cartão do Svelte pedindo `side="top"`:
 *
 *   imediato    lado=top     folga 129,6   transform -161,28   ← lugar de espera
 *   após 100ms  lado=bottom  folga 4       transform 77        ← medido, com flip
 *
 * Os dois valores são do MESMO cartão, sem evento nenhum no meio. Quem afirmar
 * posição no primeiro quadro reprova um componente correto — foi o que a
 * primeira versão desta sonda fez nas duas stacks de uma vez.
 *
 * A leitura é do atributo `style` CRU e não do estilo computado, porque o
 * computado devolve a matriz já resolvida em pixels e o `-200%` some. Nas
 * stacks sem esse mecanismo (react, angular, vanilla) a checagem não encontra
 * nada e não custa nada.
 */
function noLugarDeEspera(panel: HTMLElement): boolean {
  const involucro = panel.parentElement;
  return !!involucro?.getAttribute('style')?.includes('-200%');
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

/**
 * Vão padrão entre gatilho e painel. As cinco stacks declaram o mesmo número;
 * quem mudar um lado sem mudar o outro reprova aqui.
 */
export const SIDE_OFFSET_PADRAO = 4;

export type Ancoragem = {
  /** O lado que a stack PUBLICA — e que pode contradizer a coordenada. */
  sidePublicado: string | null;
  /** Vão medido em cada lado. Positivo = o painel está daquele lado do gatilho. */
  folga: Record<'top' | 'bottom' | 'left' | 'right', number>;
  /** Caixa do elemento que a lib posiciona — 0×0 denuncia painel fora do fluxo. */
  involucro: { width: number; height: number } | null;
};

/**
 * Geometria do painel EM RELAÇÃO AO GATILHO.
 *
 * Existe porque a ausência dela é o que deixou um defeito atravessar duas
 * folhas. Em 2026-09-04 o tooltip tirou `position: absolute` da folha dele —
 * fora do fluxo, o invólucro que a lib posiciona colapsa para 0×0 e a lib passa
 * a calcular tudo contra uma caixa sem tamanho — e fechou sem asserção. A mesma
 * declaração seguiu em `hover-card.css` por nove dias, com as suítes verdes nas
 * cinco: o cartão APARECE, só aparece no lugar errado, e nem compilador, nem
 * axe, nem asserção de largura olham para onde ele está.
 *
 * `involucro` é o pai do painel. Nas stacks de lib é o elemento posicionado
 * (`.nds-hover-card-positioner` no react e no angular, um invólucro sem classe
 * no vue e no svelte); no vanilla é o `<body>`, porque lá quem se posiciona é o
 * próprio painel. Por isso a asserção de ancoragem NÃO olha para ele: o que vale
 * nas cinco é onde o painel ficou, não quem o pôs lá.
 */
export function medirAncoragem(trigger: HTMLElement, panel: HTMLElement): Ancoragem {
  const g = trigger.getBoundingClientRect();
  const p = panel.getBoundingClientRect();
  const pai = panel.parentElement;
  const c = pai && pai !== panel.ownerDocument.body ? pai.getBoundingClientRect() : null;
  return {
    sidePublicado: panel.getAttribute('data-side'),
    folga: {
      top: g.top - p.bottom,
      bottom: p.top - g.bottom,
      left: g.left - p.right,
      right: p.left - g.right,
    },
    involucro: c ? { width: c.width, height: c.height } : null,
  };
}

/**
 * O painel DAQUELE gatilho, pelo `aria-describedby`.
 *
 * A story dos lados abre quatro cartões ao mesmo tempo, e parear por ORDEM não
 * serve: a ordem no portal é de montagem, não a da tela, e varia entre as
 * libs. O `aria-describedby` é o vínculo que as cinco já mantêm — é ele que
 * aponta o gatilho para o painel enquanto o painel existe.
 */
export function painelDoGatilho(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-describedby');
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

/**
 * Todo gatilho ABERTO com o painel dele, pareados.
 *
 * Pelo `data-slot`, e não pelo nome acessível: as cinco stacks rotulam os
 * gatilhos da story dos lados de jeitos diferentes — duas acrescentam
 * `aria-label` — e parear por nome faria a asserção divergir stack a stack,
 * que é exatamente o que uma asserção compartilhada existe para evitar.
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

/**
 * O painel está ONDE ELE DIZ QUE ESTÁ.
 *
 * Esta é a forma da asserção, e ela não é detalhe. A story `Sides` das cinco
 * stacks já lia `data-side` e conferia só o EIXO, com um comentário explicando
 * que afirmar o lado literal tornaria o tamanho da janela parte do contrato —
 * raciocínio correto, e mesmo assim a asserção media a AFIRMAÇÃO da lib em vez
 * do resultado dela. Com o painel fora do fluxo pela folha, as quatro stacks de
 * lib publicavam `top` e pousavam o cartão mais de 100px ABAIXO do gatilho; os
 * quatro `data-side` eram verdadeiros e o teste passava.
 *
 * Ela só vale depois de `waitForOpen`, que é quem garante que a lib já mediu —
 * ver `noLugarDeEspera`. Medir antes disso reprova componente correto.
 *
 * Cobrar coerência entre o atributo e a coordenada resolve os dois lados: é
 * estritamente mais forte que o eixo, e continua tolerante ao flip — o cartão
 * pode virar à vontade, desde que publique para onde virou.
 *
 * A tolerância é de 1px e não é conforto: o `sideOffset` é inteiro nas cinco, e
 * o meio pixel aparece só quando o gatilho em linha cai em coordenada
 * fracionária. Afrouxar devolveria o defeito — os painéis fora do fluxo erravam
 * por mais de 100px, mas um `shift` mal limitado erra por poucos.
 */
export function expectOndeDiz(
  trigger: HTMLElement,
  panel: HTMLElement,
  sideOffset = SIDE_OFFSET_PADRAO,
): void {
  const a = medirAncoragem(trigger, panel);
  const diagnostico =
    `publicou "${a.sidePublicado}" mas as folgas medidas são ` +
    (['top', 'bottom', 'left', 'right'] as const)
      .map((k) => `${k}=${a.folga[k].toFixed(1)}`)
      .join(' ') +
    ` · involucro=${a.involucro ? `${a.involucro.width}x${a.involucro.height}` : 'body'}`;

  expect(['top', 'bottom', 'left', 'right'], diagnostico).toContain(a.sidePublicado);
  const medida = a.folga[a.sidePublicado as 'top' | 'bottom' | 'left' | 'right'];
  expect(medida, diagnostico).toBeGreaterThan(sideOffset - 1);
  expect(medida, diagnostico).toBeLessThan(sideOffset + 1);
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
