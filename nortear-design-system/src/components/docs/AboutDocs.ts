import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/sobre-design-system/translations.json';

export function createAboutDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'sobre-design-system',
  });
}
