import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/analytics-catalogo/translations.json';

/**
 * Catálogo de analytics — página de fundamento sem desenho próprio.
 *
 * O slug `analytics-catalogo` é o mesmo das outras stacks: ele vai para o
 * `?component=` do SEO e para o `component_name` do GA4, então trocá-lo aqui
 * partiria a mesma página em duas entradas de relatório.
 */
@Component({
  selector: 'nds-analytics-catalog-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="analytics-catalogo" [translations]="translations" />`,
})
export class NdsAnalyticsCatalogDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
