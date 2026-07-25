import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/comece-por-aqui/translations.json';

export function createGettingStartedDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'comece-por-aqui',
  });
}
