import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/densidades/translations.json';

/**
 * Densidades — página de fundamento sem desenho próprio.
 *
 * A densidade em si se experimenta pela toolbar do Storybook (classes
 * `densidade-*` no <html>); esta página é a prosa e as tabelas de tokens que
 * explicam a escada.
 */
@Component({
  selector: 'nds-densities-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="densidades" [translations]="translations" />`,
})
export class NdsDensitiesDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
