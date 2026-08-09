import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

export type CardSize = 'default' | 'sm';

/**
 * Card — visual em `.nds-card` (docs/shared/styles/nds/card.css).
 *
 * `data-size` no root propaga padding/fonte para os subcomponentes via CSS,
 * igual às outras stacks.
 */
@Component({
  selector: 'nds-card, [ndsCard]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    // `class` estático: o Angular mescla com o que o consumidor escrever no
    // elemento. Um input `class` refazendo a mesclagem seria hábito de React.
    class: 'nds-card',
    '[attr.data-slot]': '"card"',
    '[attr.data-size]': 'size()',
  },
})
export class NdsCard {
  readonly size = input<CardSize>('default');
}
