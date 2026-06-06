import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/analytics-catalogo/translations.json';

export function createAnalyticsCatalogDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'analytics-catalogo',
  });
}
