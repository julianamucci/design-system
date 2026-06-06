import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/internacionalizacao/translations.json';

export function createI18nDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'internacionalizacao',
  });
}
