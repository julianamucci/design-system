import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/** Moldura padrão de preview usada por Demonstração e Anatomia. */
@Component({
  selector: 'nds-component-demo',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-slot]': '"card"',
    '[attr.data-size]': '"default"',
    '[attr.data-docs-preview]': '"demonstracao"',
    class: 'nds-card nds-docs-demo',
  },
})
export class NdsComponentDemo {}
