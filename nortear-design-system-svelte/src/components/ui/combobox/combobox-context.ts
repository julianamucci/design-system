/**
 * Estado partilhado do Combobox — o que o `bits-ui` NÃO entrega.
 *
 * A lib reaproveita as peças do Select e cobre a parte fácil: papel de
 * combobox no input, `aria-activedescendant`, camada flutuante, item com
 * `role="option"`. Fica de fora, e é o que mora aqui:
 *
 *   · **filtragem** — a lib espera a lista JÁ FILTRADA;
 *   · **chips** — não existem em peça nenhuma dela, nem há `TagsInput`;
 *   · **vazio** — não há parte correspondente.
 *
 * Módulo de TS puro, sem import de `.svelte`: assim as funções rodam também no
 * projeto `unit` do vitest, e o contexto continua sendo um tipo só para as
 * dezenove peças.
 */
import { getContext, setContext } from 'svelte';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Rótulo do grupo. Itens com o mesmo texto saem sob o mesmo cabeçalho. */
  group?: string;
}

/** Decide se uma opção sobrevive ao texto digitado. */
export type ComboboxFilter = (item: ComboboxOption, query: string) => boolean;

/**
 * Como os chips ocupam o campo.
 *
 *   `wrap`         eles acumulam LINHAS e o campo cresce em altura
 *   `single-line`  ficam numa linha só e o conjunto rola na horizontal
 *
 * Nos dois casos limpar e gatilho ficam na primeira linha — quem quebra ou
 * rola é a caixa dos chips, por dentro do campo, e eles estão fora dela.
 */
export type ComboboxChipsLayout = 'wrap' | 'single-line';

/** Comparação sem acento e sem caixa — filtrar "sao" tem de achar "São Paulo". */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Filtro padrão: casa por trecho do rótulo, ignorando acento e caixa. */
export const defaultFilter: ComboboxFilter = (item, query) => {
  const needle = normalizeText(query.trim());
  return needle === '' || normalizeText(item.label).includes(needle);
};

/**
 * Opções que sobrevivem ao texto digitado.
 *
 * Exportada porque quem compõe a lista precisa da MESMA conta que a peça usa
 * para se esconder: um grupo cujo cabeçalho continua na tela sem nenhuma opção
 * embaixo é o defeito clássico de filtrar item a item.
 */
export function filterItems(
  items: ComboboxOption[],
  query: string,
  filter: ComboboxFilter = defaultFilter,
): ComboboxOption[] {
  return items.filter((entry) => filter(entry, query));
}

export interface ComboboxState {
  readonly inputId: string;
  readonly listboxId: string;
  readonly multiple: boolean;
  /**
   * A escolha é da RAIZ e chega à caixa do campo por aqui, e não como prop de
   * `ComboboxInputWrapper`.
   *
   * Quem lê a documentação ajusta o campo num lugar só — é onde `multiple`,
   * `disabled` e `invalid` já moram, e os três descem por este mesmo caminho.
   * Pedi-la na peça obrigaria a repetir a decisão em cada composição e deixaria
   * o modo de chips solto do modo múltiplo que o produz.
   */
  readonly chipsLayout: ComboboxChipsLayout;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly open: boolean;
  /** Texto digitado — fonte única do que o campo mostra e do que a lista filtra. */
  readonly query: string;
  readonly selected: string[];
  /** Quantas opções sobrevivem ao texto atual. Zero acende a mensagem de vazio. */
  readonly matchCount: number;
  matches(item: ComboboxOption): boolean;
  labelFor(value: string): string;
  setQuery(next: string): void;
  deselect(value: string): void;
  clearAll(): void;
  registerInput(element: HTMLInputElement | null): void;
  focusInput(): void;
}

const COMBOBOX_KEY = Symbol('nds-combobox');

export function setComboboxState(state: ComboboxState): void {
  setContext(COMBOBOX_KEY, state);
}

export function getComboboxState(): ComboboxState {
  return getContext<ComboboxState>(COMBOBOX_KEY);
}

/** Um chip só sabe o próprio valor; o botão de remover o lê daqui. */
const CHIP_KEY = Symbol('nds-combobox-chip');

export function setChipValue(read: () => string): void {
  setContext(CHIP_KEY, read);
}

export function getChipValue(): () => string {
  return getContext<() => string>(CHIP_KEY) ?? (() => '');
}
