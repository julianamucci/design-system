// Utilitários de medição do Chart, compartilhados pelos arquivos de story.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: um
// auxiliar exportado apareceria na barra lateral como um exemplo do componente
// que não renderiza nada.

import { expect, waitFor } from 'storybook/test';

/**
 * Espera a ANIMAÇÃO DE ENTRADA fechar — precondição de toda CONTAGEM de formas.
 *
 * `designPintado` marca a primeira forma de dado pintada, e isso é cedo demais
 * para quem vai contar: enquanto a entrada corre, cada forma sai com
 * `fill-opacity="0"` e sobe até 1. Não é só uma medida borrada — é uma medida
 * ERRADA de outra coisa. O único elemento que TERMINA em `fill-opacity="0"` é o
 * fundo da legenda, e é por essa marca que um coletor a reconhece para excluí-la
 * do que conta como forma de dado. No meio da animação há um candidato por forma
 * desenhada, o primeiro deles uma faixa do funil: a caixa da legenda sai sendo a
 * primeira faixa, nada mais é excluído, e um funil de quatro etapas devolve oito
 * formas.
 *
 * Por isso a condição de parada é a própria invariante que o coletor assume: no
 * máximo UM `fill-opacity="0"` no desenho. Sem legenda o número é zero e a
 * espera passa direto; com `prefers-reduced-motion` não há animação e também não
 * há o que esperar.
 */
export async function drawingSettled(root: HTMLElement): Promise<void> {
  await waitFor(
    () => expect(root.querySelectorAll('svg path[fill-opacity="0"]').length)
      .toBeLessThanOrEqual(1),
    { timeout: 3000 },
  );
}
