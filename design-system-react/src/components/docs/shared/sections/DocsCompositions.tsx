import { DocsVariants, type DocsVariantItem } from './DocsVariants';
import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsCompositionItem extends DocsVariantItem {
  /** Situação de uso recomendada — renderizada após "Quando usar:" abaixo da descrição. */
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
 * Por baixo usa DocsVariants — layout idêntico ao de Variantes/Tamanhos.
 */
export function DocsCompositions({
  title,
  items,
  useWhenLabel = 'Quando usar:',
  componentSlug,
  id = 'composicoes',
}: DocsCompositionsProps) {
  const variantItems: DocsVariantItem[] = items.map(item => {
    if (!item.useWhen) return item;
    return {
      ...item,
      description: sanitizeHtml(
        `${item.description}<br><br><strong>${useWhenLabel}</strong> ${item.useWhen}`,
      ),
    };
  });

  return (
    <DocsVariants
      id={id}
      title={title}
      items={variantItems}
      componentSlug={componentSlug}
    />
  );
}
