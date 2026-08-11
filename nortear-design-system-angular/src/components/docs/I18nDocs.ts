import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/internacionalizacao/translations.json';

/**
 * Internacionalização — página de fundamento sem desenho próprio.
 *
 * A própria página é trilíngue: o renderer lê o signal de locale, então trocar
 * o idioma no seletor do cabeçalho recalcula todas as seções sem remontar nada.
 */
@Component({
  selector: 'nds-i18n-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="internacionalizacao" [translations]="translations" />`,
})
export class NdsI18nDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
