import { expect, userEvent, waitFor, within } from 'storybook/test';

/**
 * Andaimes de teste do Command — um módulo, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente. E mora junto porque as quatro stories
 * procuram os mesmos nós e zeram a busca do mesmo jeito — cópia por arquivo é o
 * que `fixture_duplicada_entre_stories` mede, e vira defeito no dia em que
 * alguém corrige uma e não as outras.
 *
 * As esperas daqui só LEEM o DOM (regra do `waitFor` que pendura): o filtro e
 * o destaque são sinais, e a tela só os reflete no ciclo de detecção seguinte —
 * sem zona, esse ciclo é agendado, não síncrono com o evento.
 */

/** Moldura de todas as demonstrações inline da paleta. */
export const WRAPPER = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';

export const NO_RESULT = 'Nenhum resultado encontrado.';

/** O item pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
export const commandItem = (root: ParentNode, value: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

/**
 * Os traços que estão NA TELA.
 *
 * Aqui o traço que perdeu um dos lados continua no DOM, com `hidden` — o
 * filtro não desmonta nada, só esconde. Contar nós contaria o traço escondido.
 */
export const visibleSeparators = (root: ParentNode): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>('.nds-command-separator')].filter((el) => !el.hidden);

/** A região viva de "sem resultados" — irmã da lista, nunca filha dela. */
export const emptyRegion = (root: ParentNode): HTMLElement =>
  root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

/** O comando que o `aria-activedescendant` do campo aponta, quando há um. */
export const highlightedOption = (field: HTMLElement): HTMLElement | null => {
  const id = field.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};

/** Espera a lista mostrar exatamente `n` comandos. */
export async function waitForOptions(root: HTMLElement, n: number): Promise<void> {
  await waitFor(async () => {
    await expect(within(root).queryAllByRole('option')).toHaveLength(n);
  });
}

/** Espera o destaque chegar ao comando com este texto. */
export async function waitForHighlight(field: HTMLElement, text: string): Promise<void> {
  await waitFor(async () => {
    await expect(highlightedOption(field)).toHaveTextContent(text);
  });
}

/**
 * Deixa a busca vazia, com os `total` comandos de volta e o PRIMEIRO habilitado
 * em destaque (PRD, D11).
 *
 * O destaque só volta ao primeiro numa busca nova. `userEvent.clear` num campo
 * JÁ vazio não dispara `input`, e no REPLAY (a play reexecuta no mesmo DOM) o
 * destaque da rodada anterior — de seta ou de ponteiro — sobreviveria: a
 * primeira seta partiria do meio da lista. Por isso a busca passa por um texto
 * que não casa com nada, e a espera no meio garante que o esvaziamento chegou à
 * tela antes de apagar.
 */
export async function resetSearch(root: HTMLElement, field: HTMLElement, total: number): Promise<void> {
  await userEvent.clear(field);
  await userEvent.type(field, 'zzz');
  await waitForOptions(root, 0);
  await userEvent.clear(field);
  await waitForOptions(root, total);
}
