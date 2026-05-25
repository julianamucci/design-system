import { createDocsVariants, type DocsVariantItem } from './DocsVariants';

/**
 * Item de uma composição documentada. Mesma forma de `DocsVariantItem` + um
 * campo opcional `useWhen` (situação de uso recomendada). Quando presente,
 * é mesclado à descrição via "<br><br><strong>{useWhenLabel}</strong> {useWhen}".
 */
export interface DocsCompositionItem extends DocsVariantItem {
  useWhen?: string;
}

export interface DocsCompositionsProps {
  /** Título da seção (ex: t('variants.compositionsTitle')). */
  title: string;
  /** Composições documentadas. */
  items: DocsCompositionItem[];
  /** Label da linha "Quando usar:" (i18n, ex: tNav('common.useWhen')). */
  useWhenLabel?: string;
  /** Slug do componente para tracking GA4 dos toggles de código. */
  componentSlug?: string;
  /** Id da seção. Default: 'composicoes'. */
  id?: string;
}

/**
 * Seção "Composições" — combinações canônicas do componente
 * (ícone + label, par de ações, icon-only, etc.).
 *
 * Por baixo usa createDocsVariants, então o layout (card com preview +
 * toggle "Ver código") é idêntico ao de Variantes e Tamanhos.
 */
export function createDocsCompositions(props: DocsCompositionsProps): HTMLElement {
  const useWhenLabel = props.useWhenLabel ?? 'Quando usar:';

  const items: DocsVariantItem[] = props.items.map(item => {
    if (!item.useWhen) return item;
    return {
      ...item,
      description:
        `${item.description}<br><br><strong>${useWhenLabel}</strong> ${item.useWhen}`,
    };
  });

  return createDocsVariants({
    id: props.id ?? 'composicoes',
    title: props.title,
    componentSlug: props.componentSlug,
    items,
  });
}
