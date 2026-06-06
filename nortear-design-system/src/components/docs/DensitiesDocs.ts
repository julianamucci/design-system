import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/densidades/translations.json';

export function createDensitiesDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'densidades',
  });
}
