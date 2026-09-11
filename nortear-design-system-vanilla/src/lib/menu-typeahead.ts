// ─── Typeahead de menu — uma implementação para os três menus desta stack ─────
//
// Digitar um caractere com o menu aberto leva o foco ao item cujo rótulo começa
// com ele, e caracteres digitados em sequência se ACUMULAM por um segundo — o
// padrão WAI-ARIA de menu: "co" rápido procura "co", e não "c" e depois "o".
//
// A mesma capacidade estava escrita três vezes, e divergia: o `dropdown-menu` e o
// `context-menu` acumulavam, cada um com a sua cópia; o `menubar` casava UMA
// letra, só `[a-zA-Z0-9]`, sem janela nenhuma — numa lista com "Refazer" e
// "Recortar", "rec" ia a "Refazer", depois ao primeiro item com "e", depois ao
// primeiro com "c". Nenhum portão vê divergência entre arquivos, e por isso ela
// viveu; é o mesmo motivo de `@/lib/submenu` existir.
//
// O que ESTE módulo decide é a busca: que tecla conta, por quanto tempo o
// acúmulo dura, de onde a procura parte. O que ele NÃO decide é quais elementos
// são itens — cada menu entrega a própria roda, na ordem do teclado dele.

/** Janela de acúmulo, em ms — o valor do padrão WAI-ARIA de menu. */
export const TYPEAHEAD_WINDOW_MS = 1000;

/**
 * A tecla é um caractere que o typeahead procura?
 *
 * Um caractere visível só, sem modificador. O ESPAÇO fica de fora porque ativa
 * o item focado; Ctrl, Alt e Meta ficam de fora porque a combinação é atalho —
 * e o atalho é justamente o que o item de menu exibe à direita.
 */
export function isTypeaheadKey(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>): boolean {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    /\S/.test(event.key)
  );
}

/**
 * Índice do rótulo que começa com `search`, ou `-1`.
 *
 * A procura parte do item DEPOIS do atual e dá a volta, terminando nele: repetir
 * a mesma letra percorre os homônimos em vez de travar no primeiro. `current`
 * `-1` (foco fora da roda) começa do primeiro item.
 *
 * Função pura, sobre rótulos e não sobre elementos — é o que a deixa ao alcance
 * do teste unitário, que roda em node.
 */
export function findTypeaheadMatch(labels: readonly string[], current: number, search: string): number {
  const total = labels.length;
  const needle = search.toLowerCase();
  for (let step = 1; step <= total; step++) {
    const index = (current + step + total) % total;
    if (labels[index].trim().toLowerCase().startsWith(needle)) return index;
  }
  return -1;
}

export type MenuTypeahead = {
  /**
   * Soma o caractere à busca, reinicia a janela e foca o item que casa.
   * Devolve o item focado, ou `null` quando nada casa — o foco fica onde estava.
   */
  type: (char: string, items: readonly HTMLElement[]) => HTMLElement | null;
  /**
   * Zera a busca e solta o temporizador. Quem fecha o menu chama: a próxima
   * abertura não pode herdar letras da anterior, e um temporizador vivo depois
   * da destruição seria uma referência presa à fábrica.
   */
  reset: () => void;
};

/** Um acumulador por menu — a busca é estado do menu aberto, não do item. */
export function createMenuTypeahead(windowMs = TYPEAHEAD_WINDOW_MS): MenuTypeahead {
  let search = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  function reset(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    search = '';
  }

  function type(char: string, items: readonly HTMLElement[]): HTMLElement | null {
    search += char.toLowerCase();
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      search = '';
      timer = null;
    }, windowMs);

    const current = items.indexOf(document.activeElement as HTMLElement);
    const index = findTypeaheadMatch(
      items.map((el) => el.textContent ?? ''),
      current,
      search,
    );
    const target = index >= 0 ? items[index] : null;
    target?.focus();
    return target;
  }

  return { type, reset };
}
