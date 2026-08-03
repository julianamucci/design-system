/**
 * Ponte de ids entre AccordionItem, Trigger e Content.
 *
 * O bits-ui não emite `aria-controls` no trigger nem `role="region"` +
 * `aria-labelledby` no painel — o `@base-ui/react`, o `reka-ui` e a factory
 * Vanilla emitem, e o `translations.json` compartilhado documenta os três como
 * "aplicados automaticamente". Sem eles esta stack perde a relação
 * trigger → conteúdo e a fronteira do painel no leitor de tela.
 *
 * O par de ids nasce no Item (um `$props.id()` por instância, para não colidir
 * quando a mesma página monta vários accordions) e desce por contexto.
 */
export const ACCORDION_ITEM_IDS = Symbol('nds-accordion-item-ids');

export interface AccordionItemIds {
  triggerId: string;
  contentId: string;
}
