// ─── Andaime compartilhado das stories do Command ─────────────────────────────
//
// As três stories da paleta (variants, states, compositions) montavam a mesma
// lista inline e procuravam os mesmos nós com cópias próprias dos helpers. Uma
// cópia por arquivo é dívida mecânica enquanto os corpos coincidem — e vira
// defeito silencioso no dia em que alguém corrige um e não os outros, que é o
// que `fixture_duplicada_entre_stories` mede.

import { userEvent } from 'storybook/test';
import { createCommand, type CommandEntry } from './command';

/** Moldura de todas as demonstrações inline da paleta. */
export const WRAPPER = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';

export const NO_RESULT = 'Nenhum resultado encontrado.';

/** O item pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
export const comando = (root: ParentNode, value: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

export const separadores = (root: ParentNode): NodeListOf<HTMLElement> =>
  root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

export const searchOf = (root: ParentNode): HTMLInputElement =>
  root.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;

/** A região viva de "sem resultados" — irmã da lista, nunca filha dela. */
export const regiaoVazia = (root: ParentNode): HTMLElement =>
  root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

/**
 * Deixa a busca vazia E o destaque zerado.
 *
 * O item em destaque só volta a "nenhum" num re-render do filtro, e
 * `userEvent.clear` num campo JÁ vazio não dispara `input`. No REPLAY (a play
 * reexecuta no mesmo DOM) o destaque da rodada anterior sobreviveria, e a
 * primeira seta partiria do meio da lista.
 */
export async function zerarSearch(field: HTMLElement): Promise<void> {
  await userEvent.type(field, 'zzz');
  await userEvent.clear(field);
}

/** A paleta inline dentro da moldura padrão. */
export function mountInline(
  items: CommandEntry[],
  placeholder: string,
  onSelect?: (v: string) => void,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = WRAPPER;
  wrap.appendChild(
    createCommand({ placeholder, emptyMessage: NO_RESULT, items, onSelect }),
  );
  return wrap;
}
