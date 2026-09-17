import { waitFor } from 'storybook/test';

/**
 * Esperas que mais de um arquivo de story do Sheet precisa.
 *
 * Elas vivem aqui porque a cópia é o defeito: a mesma função em dois arquivos
 * envelhece em um só, e foi o portão `fixture_duplicada_entre_stories` que
 * cobrou a extração.
 */

/**
 * Espera o `body` voltar a aceitar ponteiro depois de um fechamento.
 *
 * O ponteiro volta DEPOIS de o nó sair: enquanto o painel é modal a lib deixa
 * `pointer-events: none` no `body` e só o devolve ao remover o painel. Sem esta
 * espera, o clique seguinte falha nesse intervalo — medido.
 *
 * Leitura PURA dentro da espera: condição que toca o DOM se realimenta pelo
 * observador de mutação e pendura a aba sem nunca reprovar.
 */
export async function waitForPointerRelease(): Promise<void> {
  await waitFor(() => {
    if (getComputedStyle(document.body).pointerEvents === 'none') {
      throw new Error('o overlay ainda bloqueia o ponteiro');
    }
  });
}

/**
 * Espera a rolagem da página voltar depois de um fechamento.
 *
 * A lib devolve o atributo `style` do `body` num tique próprio, depois de
 * remover o painel.
 */
export async function waitForScrollRelease(): Promise<void> {
  await waitFor(() => {
    if (document.body.style.overflow === 'hidden') {
      throw new Error('a rolagem da página continua travada');
    }
  });
}
