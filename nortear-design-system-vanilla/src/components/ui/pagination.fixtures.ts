// Fixture compartilhada pelas stories do Pagination.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function wrap()` dentro de um `*.stories.ts` viraria uma story
// "Wrap" que não renderiza nada.
//
// Eram três cópias — composições, estados e variantes — idênticas letra por
// letra, e todas só com classes `.nds-*`: não havia divergência nenhuma para
// conciliar, só a espera de que alguém corrigisse uma das três.

/** Moldura centrada da faixa de paginação. */
export function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-cluster nds-w-full nds-p-2 nds-min-h-24';
  wrapper.dataset.justify = 'center';
  wrapper.dataset.align = 'center';
  wrapper.appendChild(child);
  return wrapper;
}
