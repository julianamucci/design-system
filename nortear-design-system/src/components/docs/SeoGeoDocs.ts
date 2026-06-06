import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/seo-e-geo/translations.json';

export function createSeoGeoDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'seo-e-geo',
  });
}
