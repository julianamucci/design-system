/**
 * Andaime de demonstração do ScrollArea — um construtor, dois arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * Nada variava: a lista era a MESMA em `scroll-area.stories.ts` e em
 * `scroll-area-estados.stories.ts`, letra por letra. Só o total de itens mudava,
 * e ele já era parâmetro.
 */

/** Lista de `count` itens — conteúdo alto o bastante para a área transbordar. */
export function buildList(count: number): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'nds-stack nds-list-none nds-p-2 nds-m-0';
  ul.dataset.spacing = 'sm';
  for (let i = 1; i <= count; i++) {
    const li = document.createElement('li');
    li.className = 'nds-text-body nds-border-b-soft nds-pb-2';
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  return ul;
}
