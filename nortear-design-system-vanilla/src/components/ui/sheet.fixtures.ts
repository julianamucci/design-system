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
import { SHEET_BODY_TEXT } from './sheet.source';

/**
 * Clica o gatilho na próxima microtarefa — mas SÓ se ele estiver no documento.
 *
 * O runner avalia o `render()` de uma story MAIS DE UMA VEZ e descarta as
 * árvores que não chegam ao canvas. Um `queueMicrotask(() => trigger.click())`
 * cru abre o painel da árvore DESCARTADA também: ela portala um painel no
 * `body` e rouba o foco do painel vivo; quando a varredura de graça do
 * `tornarDestruivel` recolhe a instância órfã, o painel sai levando o foco
 * junto, e a asserção "aberto, o foco está no painel" reprova com
 * `activeElement === BODY`.
 *
 * Medido em 2026-09-12 no `dialog-states`, onde o defeito apareceu: passava
 * antes por acidente, porque o desmonte antigo devolvia o foco ao
 * `previousFocus` — que na instância órfã era justamente o botão do painel
 * vivo. Consertar o desmonte tirou a restituição acidental, e os sete pontos
 * iguais do Sheet eram a mesma forma esperando a ordem de avaliação mudar.
 *
 * `isConnected` é decisivo: a árvore descartada nunca entra no documento, e a
 * viva já está nele quando a microtarefa roda — o renderer anexa o que o
 * `render()` devolve na MESMA tarefa. A árvore viva, portanto, abre como antes.
 *
 * Gêmea da de `dialog.fixtures.ts` e da de `dropdown-menu.fixtures.ts` de
 * propósito: fixture de um componente não é importada por outro.
 */
export function clicarQuandoMontado(trigger: HTMLElement | null | undefined): void {
  if (!trigger) return;
  queueMicrotask(() => {
    if (trigger.isConnected) trigger.click();
  });
}

/**
 * Corpo de uma linha — o parágrafo canônico do painel.
 *
 * O texto vem de `sheet.source.ts` porque é ele que o painel Code publica: com
 * a constante compartilhada, snippet e preview não podem mostrar corpos
 * diferentes.
 */
export function makeBody(text: string = SHEET_BODY_TEXT): HTMLElement {
  const body = document.createElement('p');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = text;
  return body;
}

/**
 * Rodapé só de SAÍDA — um botão, e ele fecha o painel.
 *
 * É o rodapé do painel inferior de ações: a decisão já foi tomada no corpo, e
 * repetir uma confirmação aqui diria que falta um passo que não existe. Separado
 * de `makeFooter` porque aquele monta sempre o PAR, e um `actionLabel` vazio
 * deixaria um botão sem nome acessível em vez de nenhum botão.
 */
export function makeExitFooter(exitLabel: string): HTMLElement {
  const exit = createButton({ variant: 'outline', label: exitLabel });
  // O botão de fechar É componível: a fábrica delega o clique em
  // `[data-slot="sheet-close"]` dentro do painel e relata `close-button`. Antes
  // de 2026-09-11 não havia nada a marcar, e a fixture fingia um clique no véu —
  // que relatava `overlay` para um caminho que é de botão.
  exit.dataset.slot = 'sheet-close';
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'md';
  footer.appendChild(exit);
  return footer;
}

/**
 * Rodapé de duas ações — cancelar à esquerda, ação principal à direita.
 *
 * Com `closeOnClick`, é o CANCELAR que passa a fechar o painel — pelo contrato
 * de markup, marcado com `data-slot="sheet-close"`, que a fábrica delega no
 * painel e relata como `close-button`. Antes de 2026-09-11 não havia o que
 * marcar, e a fixture fingia um clique no véu: o motivo relatado era `overlay`
 * para um caminho que é de botão.
 *
 * A PRIMÁRIA não leva a marca, e isto não é detalhe de fixture: ela não é
 * controle de fechar. Quem confirma sai por decisão de DENTRO — `close()` no que
 * a fábrica devolve, relatado como `api`. Marcada, ela fechava como
 * `close-button` nas composições enquanto o `Playground`, que monta o rodapé à
 * mão, a fechava por `close()` e relatava `api`: o mesmo botão com dois motivos,
 * e a referência contradizendo a si mesma justamente no vocabulário que as
 * outras quatro stacks copiam.
 *
 * `formId` religa a ação principal ao `<form>` do corpo. O rodapé do Sheet é
 * IRMÃO do corpo rolável por construção da fábrica — é o que o mantém visível
 * enquanto o formulário rola —, então a primária nunca está dentro do `<form>`:
 * sem `type="submit"` e sem o atributo `form`, o painel tem formulário e NENHUMA
 * forma de submeter, e o Enter num campo não dispara nada (PRD D9). A fábrica
 * de botão não expõe `form`, e por isso ele entra por `setAttribute`.
 */
export function makeFooter(
  cancelLabel: string,
  actionLabel: string,
  closeOnClick = false,
  formId?: string,
): HTMLElement {
  const cancel = createButton({ variant: 'outline', label: cancelLabel });
  const action = createButton({
    variant: 'default',
    label: actionLabel,
    type: formId ? 'submit' : 'button',
  });
  if (formId) action.setAttribute('form', formId);
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'md';
  footer.append(cancel, action);

  if (closeOnClick) cancel.dataset.slot = 'sheet-close';

  return footer;
}
