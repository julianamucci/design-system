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
 * Com `fecharAoClicar`, os dois botões passam a fechar o painel — pelo contrato
 * de markup, marcados com `data-slot="sheet-close"`, que a fábrica delega no
 * painel e relata como `close-button`. Antes de 2026-09-11 não havia o que
 * marcar, e a fixture fingia um clique no véu: o motivo relatado era `overlay`
 * para dois caminhos que são de botão.
 *
 * `formId` religa a ação principal ao `<form>` do corpo. O rodapé do Sheet é
 * IRMÃO do corpo rolável por construção da fábrica — é o que o mantém visível
 * enquanto o formulário rola —, então a primária nunca está dentro do `<form>`:
 * sem `type="submit"` e sem o atributo `form`, o painel tem formulário e NENHUMA
 * forma de submeter, e o Enter num campo não dispara nada (PRD D10). A fábrica
 * de botão não expõe `form`, e por isso ele entra por `setAttribute`.
 */
export function makeFooter(
  cancelLabel: string,
  actionLabel: string,
  fecharAoClicar = false,
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

  if (fecharAoClicar) {
    cancel.dataset.slot = 'sheet-close';
    action.dataset.slot = 'sheet-close';
  }

  return footer;
}
