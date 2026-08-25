/**
 * Dados fixos das stories do Combobox.
 *
 * Os mesmos rótulos que a spec de exemplos fechou, e que as outras quatro
 * stacks repetem. Divergir aqui é o que faz a mesma story mostrar coisas
 * diferentes em cada stack — e isso só aparece tarde, na comparação final.
 *
 * Ficam num módulo próprio porque três arquivos de story leem as mesmas listas:
 * copiá-las seria criar três verdades para o mesmo exemplo.
 */

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
}

export const COUNTRIES: ComboboxOption[] = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'colombia', label: 'Colômbia' },
  { value: 'mexico', label: 'México' },
  { value: 'peru', label: 'Peru' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'espanha', label: 'Espanha' },
  { value: 'uruguai', label: 'Uruguai' },
];

/** As três primeiras da lista: curta o bastante para a caixa aberta não rolar. */
export const SHORT_COUNTRIES: ComboboxOption[] = COUNTRIES.slice(0, 3);

export const FRUITS: ComboboxOption[] = [
  { value: 'maca', label: 'Maçã' },
  { value: 'banana', label: 'Banana' },
  { value: 'laranja', label: 'Laranja' },
];

export const VEGETABLES: ComboboxOption[] = [
  { value: 'cenoura', label: 'Cenoura' },
  { value: 'batata', label: 'Batata' },
  { value: 'abobrinha', label: 'Abobrinha' },
];

/** Nome acessível de cada botão de remover: verbo mais o rótulo do escolhido. */
export function removeLabelOf(label: string): string {
  return `Remover ${label}`;
}

/** O que a região viva anuncia DEPOIS de remover — o fato, não o comando. */
export function removedAnnouncementOf(label: string): string {
  return `${label} removido`;
}
