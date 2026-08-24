// Fixture compartilhada pelas stories do Sheet.
//
// Fora do arquivo de story porque no CSF todo export nomeado é lido como story:
// um `export function makeFooter()` dentro de um `*.stories.ts` viraria uma
// story "MakeFooter" que não renderiza painel nenhum.
//
// O que divergia entre as duas cópias era o CLIQUE: a de composições fechava o
// painel pelos dois botões, a de variantes só desenhava o rodapé — as quatro
// direções são fotografadas ABERTAS, e fechar ali apagaria o que a story
// documenta. A divergência virou parâmetro, com o padrão no comportamento mais
// fraco: quem quer o fechamento pede.

import { createButton } from './button';

/**
 * Rodapé de duas ações — cancelar à esquerda, ação principal à direita.
 *
 * Com `fecharAoClicar`, os dois botões passam a fechar o painel. A factory não
 * expõe SheetClose: quem fecha por fora é o overlay.
 */
export function makeFooter(
  cancelLabel: string,
  actionLabel: string,
  fecharAoClicar = false,
): HTMLElement {
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  const action = createButton({ variant: 'default', label: actionLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'md';
  footer.append(cancel, action);

  if (fecharAoClicar) {
    const actionClose = () => {
      document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]')?.click();
    };
    cancel.addEventListener('click', actionClose);
    action.addEventListener('click', actionClose);
  }

  return footer;
}
