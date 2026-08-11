import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/sistema-de-temas/translations.json';

/**
 * Sistema de temas — página de fundamento sem desenho próprio.
 *
 * É a página com mais seções do conjunto (toolbar, subdomínio, tokens, criação
 * de tema, reatividade, cross-stack, regras). Todas saem do mesmo renderer: o
 * que decide a forma de cada uma são as chaves que ela traz no JSON, não código
 * escrito aqui.
 */
@Component({
  selector: 'nds-theme-system-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="sistema-de-temas" [translations]="translations" />`,
})
export class NdsThemeSystemDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
