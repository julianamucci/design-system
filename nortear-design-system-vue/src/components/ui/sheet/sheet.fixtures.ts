// Espera compartilhada pelas stories do Sheet.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado vira story:
// um helper exportado apareceria na sidebar como se fosse um exemplo. É o mesmo
// motivo do `popover.fixtures.ts`.

import { waitFor } from 'storybook/test';

/**
 * Espera o `body` voltar a aceitar ponteiro depois de um fechamento.
 *
 * Enquanto o painel é modal a lib deixa `pointer-events: none` no `body` e só o
 * devolve DEPOIS de remover o nó: o portal sumir não basta, e o clique de
 * reabertura falha nesse intervalo — medido.
 *
 * Dentro do `waitFor`, só leitura: `getComputedStyle` não toca no DOM, e uma
 * condição que MEXESSE reagendaria a si mesma até o navegador travar sem
 * reprovar.
 */
export async function waitForPointerRelease(): Promise<void> {
  await waitFor(() => {
    if (getComputedStyle(document.body).pointerEvents === 'none') {
      throw new Error('o overlay ainda bloqueia o ponteiro');
    }
  });
}
