import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/tipografia/translations.json';

export function createTypographyDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'tipografia',
  });
}
