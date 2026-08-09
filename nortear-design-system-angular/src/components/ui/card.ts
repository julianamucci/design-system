import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { cn } from '@/lib/utils';

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
    '[attr.data-slot]': '"card"',
    '[attr.data-size]': 'size()',
    '[class]': 'hostClass()',
  },
})
export class NdsCard {
  readonly size = input<CardSize>('default');
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => cn('nds-card', this.class()));
}
