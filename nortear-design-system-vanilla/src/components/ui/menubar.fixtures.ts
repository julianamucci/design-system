import { waitFor } from 'storybook/test';

// Fixture compartilhada pelas stories do Menubar.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function embrulhar()` dentro de um `*.stories.ts` viraria uma
// story "Embrulhar" que não renderiza nada.
//
// Havia quatro cópias de `embrulhar`, três de `triggersOf` e duas de
// `panelOpen` — e o que variava entre elas era só a altura reservada para o
// painel aberto, que é medida de cada story e não do helper. Por isso a altura
// virou PARÂMETRO: cada arquivo continua reservando exatamente o que reservava.

/**
 * Só os gatilhos da barra: nesta stack o painel mora DENTRO da raiz, então
 * procurar por papel na barra devolveria também os itens do menu aberto.
 */
export function triggersOf(barra: HTMLElement): HTMLElement[] {
  return Array.from(barra.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]'));
}

/**
 * Moldura da story, com espaço reservado para o painel aberto.
 *
 * `alturaMinima` é da story, não do helper: o painel abre para baixo e ocupa a
 * moldura, então uma barra de quatro menus e uma de um menu com submenu pedem
 * reservas diferentes. Sem a reserva, o canvas encolhe e o painel sai da foto
 * da regressão visual.
 */
export function embrulhar(child: HTMLElement, alturaMinima = '260px'): HTMLElement {
  const wrapper = document.createElement('div');
  // `contain` é mecânica de layout, não valor de design.
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = alturaMinima;
  wrapper.appendChild(child);
  return wrapper;
}

/** O painel é ancorado por CSS, não portalizado: mora dentro do canvas. */
export function panelOpen(canvasElement: HTMLElement): HTMLElement | null {
  return canvasElement.querySelector<HTMLElement>('[data-slot="menubar-content"]:not([hidden])');
}

/**
 * Espera o painel do menu aberto aparecer dentro do canvas.
 *
 * Estava copiada nas composições e nas variantes, com o mesmo seletor e sem
 * timeout próprio — passa a ser o `waitFor` em cima de `panelOpen`, para
 * haver UM caminho até o painel e não dois livres para divergir.
 */
export async function waitForPanel(canvasElement: HTMLElement): Promise<HTMLElement> {
  return await waitFor(() => {
    const p = panelOpen(canvasElement);
    if (!p) throw new Error('painel não abriu');
    return p;
  });
}
