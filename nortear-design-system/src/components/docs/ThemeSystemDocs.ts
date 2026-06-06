import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/sistema-de-temas/translations.json';

export function createThemeSystemDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'sistema-de-temas',
  });
}
