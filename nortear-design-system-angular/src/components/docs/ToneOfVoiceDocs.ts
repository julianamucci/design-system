import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/tom-de-voz/translations.json';

/**
 * Tom de voz — página de fundamento sem desenho próprio.
 *
 * O slug segue o do conteúdo compartilhado (`tom-de-voz`), não o nome do
 * arquivo: é o slug que identifica a página no SEO e no analytics das cinco
 * stacks.
 */
@Component({
  selector: 'nds-tone-of-voice-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="tom-de-voz" [translations]="translations" />`,
})
export class NdsToneOfVoiceDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
