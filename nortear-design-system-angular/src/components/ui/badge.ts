import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'info'
  | 'outline';

// Tabela em vez de cadeia de ternários — mesma decisão do Vanilla: com sete
// variantes o último ramo é inalcançável e vira ruído de cobertura.
const CLASSE_POR_VARIANTE: Record<BadgeVariant, string> = {
  default: '',
  secondary: 'nds-badge-secondary',
  destructive: 'nds-badge-destructive',
  warning: 'nds-badge-warning',
  success: 'nds-badge-success',
  info: 'nds-badge-info',
  outline: 'nds-badge-outline',
};

/**
 * Badge — etiqueta inline.
 *
 * Seletor em `span[ndsBadge]`: o badge mora dentro de frase, título e célula de
 * tabela, então o host precisa ser inline. Um elemento próprio (`<nds-badge>`)
 * seria `display: inline` por default mas quebraria os seletores `.nds-badge`
 * que o CSS compartilhado aplica ao próprio elemento.
 */
@Component({
  selector: 'span[ndsBadge]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-slot]': '"badge"',
    '[attr.data-variant]': 'variant()',
    '[class]': 'hostClass()',
  },
})
export class NdsBadge {
  readonly variant = input<BadgeVariant>('default');
  readonly class = input<string>('');

  protected readonly hostClass = computed(() =>
    cn('nds-badge', CLASSE_POR_VARIANTE[this.variant()], this.class()),
  );
}
