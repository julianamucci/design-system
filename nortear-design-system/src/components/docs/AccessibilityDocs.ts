import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/acessibilidade/translations.json';

export function createAccessibilityDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'acessibilidade',
  });
}
