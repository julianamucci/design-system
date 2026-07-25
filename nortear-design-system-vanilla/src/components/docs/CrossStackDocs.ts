import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/divergencias-cross-stack/translations.json';

export function createCrossStackDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'divergencias-cross-stack',
  });
}
