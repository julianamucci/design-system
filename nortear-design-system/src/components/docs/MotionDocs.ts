import { createFoundationsDocs } from './shared/foundationsRenderer';
import translations from '@shared/content/foundations/motion/translations.json';

export function createMotionDocs(): HTMLElement {
  return createFoundationsDocs({
    translations: translations as Record<string, unknown>,
    componentSlug: 'motion',
  });
}
