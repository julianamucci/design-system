import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/espacamento/translations.json';

export function createSpacingDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'espacamento',
  });
}
