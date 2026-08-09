import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { NdsComponentDemo } from '@/components/ComponentDemo';

/**
 * Seção "Demonstração" — moldura para o preview vivo do componente.
 *
 * O preview entra por projeção de conteúdo, não por factory: no Angular o
 * componente demonstrado é declarado no template da docs page, com bindings
 * reais. Os `data-track*` dos elementos interativos são responsabilidade de
 * quem projeta — o observer do DocsPageLayout captura via
 * `.closest('[data-track]')`.
 */
@Component({
  selector: 'nds-docs-demonstration',
  standalone: true,
  imports: [NdsComponentDemo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section
      id="demonstracao"
      data-track="demo"
      data-track-container="true"
      data-track-id="page:demonstracao:demo"
    >
      <h2 class="nds-section-title">{{ title() }}</h2>
      <div ndsComponentDemo>
        <ng-content />
      </div>
    </section>
  `,
})
export class NdsDocsDemonstration {
  readonly title = input.required<string>();
}
