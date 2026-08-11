import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/acessibilidade/translations.json';

/**
 * Acessibilidade — página de fundamento sem desenho próprio.
 *
 * Tudo que se vê sai do conteúdo compartilhado, lido pelo renderer genérico:
 * a página inteira é a ligação entre o slug e o JSON. Quando o conteúdo ganhar
 * uma seção nova, ela aparece aqui sem ninguém tocar neste arquivo.
 */
@Component({
  selector: 'nds-accessibility-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="acessibilidade" [translations]="translations" />`,
})
export class NdsAccessibilityDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
