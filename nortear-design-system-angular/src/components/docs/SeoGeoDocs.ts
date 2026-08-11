import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/seo-e-geo/translations.json';

/**
 * SEO e GEO — página de fundamento sem desenho próprio.
 *
 * Tudo que se vê sai do conteúdo compartilhado, lido pelo renderer genérico.
 * Seção nova no JSON aparece aqui sem ninguém tocar neste arquivo.
 */
@Component({
  selector: 'nds-seo-geo-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="seo-e-geo" [translations]="translations" />`,
})
export class NdsSeoGeoDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
