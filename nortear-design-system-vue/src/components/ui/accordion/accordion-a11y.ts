import type { InjectionKey, Ref } from 'vue'

/**
 * Ponte de id entre AccordionItem, Trigger e Content.
 *
 * O `reka-ui` monta o `aria-controls` do gatilho a partir de
 * `rootContext.contentId`, que nasce `""` e só é preenchido quando o CONTEÚDO
 * se registra — depois de o gatilho já ter renderizado. O contexto é um objeto
 * simples, não reativo, então o gatilho nunca re-renderiza e o atributo fica
 * vazio para sempre. Medido pela sonda: esta era a única stack sem
 * `aria-controls`, aberta ou fechada.
 *
 * Pesa mais aqui do que na maioria dos disclosures porque o painel também não
 * carrega `role="region"` nem `aria-labelledby` (ver AccordionContent.vue):
 * sem `aria-controls` não sobrava nenhum vínculo entre gatilho e conteúdo, e o
 * conteúdo compartilhado documenta esse vínculo como aplicado automaticamente.
 *
 * Passar um id nosso ao painel NÃO resolve: o `CollapsibleContent` do reka faz
 * `mergeProps($attrs, { id: contentId })` com o objeto dele por último, então
 * o id da lib vence e o `aria-controls` passaria a apontar para um elemento
 * inexistente (axe `aria-valid-attr-value`). Por isso a direção é invertida —
 * o Content publica o id REAL que o reka gerou, e o Trigger o consome. O
 * gatilho é uma passagem de atributo comum (fallthrough substitui o declarado
 * no filho), então o valor do reka é sobrescrito sem briga.
 */
export const ACCORDION_ITEM_IDS = Symbol('nds-accordion-item-ids') as InjectionKey<
  Ref<string>
>
