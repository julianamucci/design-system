// Fixture compartilhada pelas stories do Label.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: `export function bloco()` dentro de um `*.stories.ts` viraria uma story
// "Bloco" que não renderiza nada.
//
// Aqui não havia divergência nenhuma para conciliar — as composições e os
// estados carregavam a MESMA função, letra por letra, e a duplicação só
// esperava que alguém corrigisse uma das duas.

/** A coluna rótulo + controle: é o par que toda story do Label monta. */
export function block(): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-xs';
  wrapper.dataset.spacing = 'xs';
  return wrapper;
}
