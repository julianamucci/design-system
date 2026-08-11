import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/divergencias-cross-stack/translations.json';

/**
 * Divergências cross-stack — página de fundamento sem desenho próprio.
 *
 * As duas tabelas desta página (libs base e matriz de sincronização) já trazem
 * Angular no conteúdo compartilhado — linha em `baseLibs.rows` e coluna em
 * `syncMatrix.cols`. Não há nada a acrescentar aqui: o renderer deriva a tabela
 * de `cols` + `rows`, e é `cols` que define a ordem das células.
 */
@Component({
  selector: 'nds-cross-stack-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="divergencias-cross-stack" [translations]="translations" />`,
})
export class NdsCrossStackDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
