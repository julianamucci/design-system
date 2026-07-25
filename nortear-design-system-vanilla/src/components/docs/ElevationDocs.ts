import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/elevacao-bordas-sombras/translations.json';

export function createElevationDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'elevacao-bordas-sombras',
  });
}
