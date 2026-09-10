// ─── Andaime compartilhado das stories do Command ─────────────────────────────
//
// As stories de variants, states e compositions procuram os mesmos nós. Uma
// cópia por arquivo é dívida mecânica enquanto os corpos coincidem — e vira
// defeito silencioso no dia em que alguém corrige um e não os outros, que é o
// que `fixture_duplicada_entre_stories` mede. Mesma forma do `command.fixtures`
// do Vanilla, com nomes em inglês.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story.

/** O comando pelo `value`, e não pelo nome acessível: atalho e marca entram no nome. */
export const commandItem = (root: ParentNode, value: string): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="command-item"][data-value="${value}"]`)!;

/** Os traços montados. Nesta lib o traço sai do DOM em qualquer busca (padrão cmdk). */
export const separatorsOf = (root: ParentNode): NodeListOf<HTMLElement> =>
  root.querySelectorAll<HTMLElement>('[data-slot="command-separator"]');

export const searchOf = (root: ParentNode): HTMLInputElement =>
  root.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;

/** A região viva de "sem resultados" — irmã da lista, nunca filha dela. */
export const emptyRegionOf = (root: ParentNode): HTMLElement =>
  root.querySelector<HTMLElement>('[data-slot="command-empty"]')!;

/**
 * O comando em destaque, pelo caminho que o leitor de tela percorre: o campo
 * aponta com `aria-activedescendant`, e o id tem de existir. Leitura pura —
 * serve dentro de `waitFor` sem mexer no DOM.
 */
export function highlightedOf(field: HTMLElement): HTMLElement | null {
  const id = field.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
}
