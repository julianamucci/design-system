/**
 * Ponte de id entre SelectTrigger e SelectContent.
 *
 * O trigger declara `role="combobox"` — é o contrato do design system: o
 * `@base-ui/react` emite esse role no React e as stories das 4 stacks consultam
 * por ele. Mas combobox EXIGE `aria-controls` apontando para o listbox
 * (axe `aria-required-attr`), e o bits-ui não emite nem o role nem um id
 * alcançável no painel — o role escrito à mão ficava pela metade.
 *
 * Tentar descobrir o painel pelo DOM a partir do trigger não funciona: ele é
 * portalado e só existe enquanto aberto. O id nasce na raiz e desce por
 * contexto para os dois lados, que é como o accordion resolve o mesmo problema
 * (ver `accordion-a11y.ts`).
 *
 * Um id por instância de Select: a mesma página monta vários, e um id fixo
 * criaria duplicata no documento.
 */
export const SELECT_LISTBOX_ID = Symbol('nds-select-listbox-id');
