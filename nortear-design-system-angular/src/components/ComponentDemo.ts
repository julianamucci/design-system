import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/** Moldura padrão de preview usada por Demonstração e Anatomia. */
@Component({
  // Seletor de atributo em <div>: o Vanilla renderiza <div class="nds-card">,
  // e tag própria seria divergência de markup. Segue @Component (não diretiva)
  // porque projeta conteúdo.
  selector: 'div[ndsComponentDemo]',
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
