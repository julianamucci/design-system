// Fixture compartilhada pelas stories do Menubar.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function embrulhar()` dentro de um `*.stories.ts` viraria uma
// story "Embrulhar" que não renderiza nada.
//
// Havia quatro cópias de `embrulhar`, três de `gatilhosDe` e duas de
// `painelAberto` — e o que variava entre elas era só a altura reservada para o
// painel aberto, que é medida de cada story e não do helper. Por isso a altura
// virou PARÂMETRO: cada arquivo continua reservando exatamente o que reservava.

/**
 * Só os gatilhos da barra: nesta stack o painel mora DENTRO da raiz, então
 * procurar por papel na barra devolveria também os itens do menu aberto.
 */
export function gatilhosDe(barra: HTMLElement): HTMLElement[] {
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
export function embrulhar(filho: HTMLElement, alturaMinima = '260px'): HTMLElement {
  const wrapper = document.createElement('div');
  // `contain` é mecânica de layout, não valor de design.
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = alturaMinima;
  wrapper.appendChild(filho);
  return wrapper;
}

/** O painel é ancorado por CSS, não portalizado: mora dentro do canvas. */
export function painelAberto(canvasElement: HTMLElement): HTMLElement | null {
  return canvasElement.querySelector<HTMLElement>('[data-slot="menubar-content"]:not([hidden])');
}
