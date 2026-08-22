/**
 * O GESTO DE CLIQUE DIREITO — abrir, fechar e medir, compartilhado pelas 5 stacks.
 *
 * O vocabulário de classe da área mora em
 * `docs/shared/primitives/context-menu-area.ts` e é reexportado aqui: as docs
 * pages são produto e não podem arrastar `storybook/test` para o bundle só para
 * ler uma string.
 */
// @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
// que inclui este arquivo compartilhado: daqui o caminho de node_modules é o de
// docs/shared, que não tem as libs de teste. Mesmo marcador do hover-card-probe.
// Se algum dia resolver, ele passa a acusar sozinho.
import { userEvent, waitFor } from 'storybook/test';
import { AREA_CLICK_DIREITO } from '../primitives/context-menu-area';

export { AREA_CLICK_DIREITO };

/**
 * Monta a área de clique direito por DOM — a forma que o stack Vanilla usa.
 *
 * Vive aqui, e não no arquivo de stories, porque toda exportação nomeada de um
 * `*.stories.ts` é indexada como story pelo Storybook: um helper exportado dali
 * viraria uma entrada quebrada no menu lateral.
 */
export function clickCreateArea(rotulo: string): HTMLElement {
  const el = document.createElement('div');
  el.className = AREA_CLICK_DIREITO;
  el.dataset.align = 'center';
  el.dataset.justify = 'center';
  el.dataset.testid = 'area';
  el.textContent = rotulo;
  return el;
}

/** O painel do menu raiz, se estiver montado. */
export function menuOpen(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="context-menu-content"]');
}

/** Fecha o menu se estiver aberto — precondição própria, sobrevive ao replay. */
export async function closeMenu(): Promise<void> {
  if (!menuOpen()) return;
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (menuOpen()) throw new Error('o menu continua aberto depois do Escape');
  });
}

/**
 * Abre pelo GESTO real, no centro da área.
 *
 * Dois motivos para não despachar `contextmenu` à mão: o popup tira a posição
 * das coordenadas do ponteiro, e é o `mousedown` do gesto que põe o foco na
 * área — sem ele a lib devolve o foco ao `<body>` no fechamento, e o teste
 * reprovaria um componente correto. Custou uma sonda para descobrir.
 *
 * Fecha antes de abrir para que cada chamada seja um clique de verdade nesta
 * rodada, e não herança da anterior.
 */
export async function gestoOpen(area: HTMLElement): Promise<HTMLElement> {
  await closeMenu();
  const caixa = area.getBoundingClientRect();
  await userEvent.pointer({
    keys: '[MouseRight]',
    target: area,
    coords: { clientX: caixa.left + caixa.width / 2, clientY: caixa.top + caixa.height / 2 },
  });
  await waitFor(() => {
    const menu = menuOpen();
    if (!menu) throw new Error('o menu não abriu com o botão direito');
    // Espera a animação de entrada terminar. Sem este portão, `toBeVisible()` e
    // qualquer medida de geometria leem o painel a meio caminho: o `toBeVisible`
    // do jest-dom só reprova em opacidade exatamente 0, então a asserção passa
    // no vitest e falha no painel Interactions — o pior dos dois mundos.
    const opacidade = parseFloat(getComputedStyle(menu).opacity);
    if (opacidade < 0.9) throw new Error(`o menu ainda está animando (${opacidade})`);
  });
  return menuOpen()!;
}

/**
 * Clique fora do menu, por despacho direto no `<body>`.
 *
 * `userEvent.click(document.body)` não serve aqui: no modo modal a lib põe
 * `pointer-events: none` no `<body>` para segurar o resto da página, e o
 * `userEvent` se recusa a clicar em elemento assim — a play morre com erro em
 * vez de falha, e o que quebra é o teste, não o componente.
 *
 * Os três eventos são de propósito: a camada dispensável escuta `pointerdown`
 * numa lib, `mousedown` noutra e `click` na factory do Vanilla. Despachar só o
 * `click` foi a causa da falha antiga do Sheet.
 */
export async function clickOutside(): Promise<void> {
  for (const tipo of ['pointerdown', 'mousedown', 'click'] as const) {
    document.body.dispatchEvent(
      new MouseEvent(tipo, { bubbles: true, cancelable: true, button: 0 }),
    );
  }
  await waitFor(() => {
    if (menuOpen()) throw new Error('o menu continua aberto depois do clique fora');
  });
}

/** Luminância relativa aproximada — só para comparar duas cores entre si. */
export function brilho(cor: string): number {
  const [r = 0, g = 0, b = 0] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
