import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/tom-de-voz/translations.json';

export function createToneOfVoiceDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'tom-de-voz',
  });
}
