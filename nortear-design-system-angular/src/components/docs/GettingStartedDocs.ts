import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import translations from '@shared/content/foundations/comece-por-aqui/translations.json';

/**
 * Comece por aqui — página de fundamento sem desenho próprio.
 *
 * A seção de instalação é um roteiro numerado: as chaves soltas (`cloneTitle`,
 * `cloneCode`, `installTitle`, `installNote`, `installCode`) são renderizadas na
 * ordem em que aparecem no JSON, porque aqui a ordem É o conteúdo. As chaves
 * `*Code` passam antes por `resolverVariantesDeCodigo` no renderer, então um
 * snippet que ganhe variante por stack continua chegando como bloco de código —
 * e não como uma lista com "react"/"vue"/"angular" de itens.
 */
@Component({
  selector: 'nds-getting-started-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage],
  template: `<nds-foundation-page slug="comece-por-aqui" [translations]="translations" />`,
})
export class NdsGettingStartedDocs {
  protected readonly translations = translations as Record<string, unknown>;
}
