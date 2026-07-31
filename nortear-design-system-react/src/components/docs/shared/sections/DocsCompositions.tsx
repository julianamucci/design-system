import { DocsVariants, type DocsVariantItem } from './DocsVariants';
import DOMPurify from 'dompurify';

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
  /** Nota introdutória da seção — repassada a DocsVariants. */
  note?: string;
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
  note,
}: DocsCompositionsProps) {
  const variantItems: DocsVariantItem[] = items.map(item => {
    if (!item.useWhen) return item;
    return {
      ...item,
      description: DOMPurify.sanitize(
        `${item.description}<br><br><strong>${useWhenLabel}</strong> ${item.useWhen}`,
      ),
    };
  });

  return (
    <DocsVariants
      id={id}
      title={title}
      note={note}
      items={variantItems}
      componentSlug={componentSlug}
    />
  );
}
