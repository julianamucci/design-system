// Fixture compartilhada pelas stories do Skeleton.
//
// Fora do arquivo de story porque no CSF todo export nomeado é lido como story:
// um `export function regiaoDeCarregamento()` viraria uma story
// "RegiaoDeCarregamento" que não desenha esqueleto nenhum.
//
// As duas cópias — variantes e composições — eram idênticas; nada variava, e é
// por isso que a função vem para cá sem parâmetro novo.

/**
 * A caixa que ANUNCIA o carregamento.
 *
 * As peças de esqueleto ficam fora da árvore de acessibilidade (`aria-hidden`):
 * quem diz que algo está a caminho é esta região, uma por bloco, com papel,
 * estado e nome. Uma região por peça repetiria o mesmo aviso a cada linha.
 */
export function regiaoDeCarregamento(label: string, className = ''): HTMLElement {
  const wrap = document.createElement('div');
  if (className) wrap.className = className;
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-busy', 'true');
  wrap.setAttribute('aria-label', label);
  return wrap;
}
