import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/sobre-design-system/translations.json';

/**
 * Sobre o design system — página de abertura, também sem desenho próprio.
 *
 * O slug é `sobre-design-system` (o mesmo das outras stacks): é ele que vai
 * para o `?component=` do SEO e para o `component_name` do analytics, então
 * mudá-lo aqui separaria esta stack das demais no GA4.
 */
@Component({
  selector: 'nds-about-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="sobre-design-system" [translations]="translations" />`,
})
export class NdsAboutDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
