import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { cn } from '@/lib/utils';

// ─── Separator ────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-separator (docs/shared/styles/nds/separator.css).
// Decorativo por default (role="none"); use [decorative]="false" para semântico.
//
// SEM `RdxSeparatorRootDirective`. O primitivo do Radix NG só guarda a
// `orientation` num signal: não emite `role`, `aria-orientation` nem
// `data-orientation`, e não conhece `decorative` — que é a decisão de
// acessibilidade que este design system define (ver Vanilla, a referência
// cross-stack). Compor com ele acrescentaria uma dependência que não contribui
// atributo nenhum e ainda deixaria `decorative` fora do contrato do primitivo.
//
// Seletor de atributo: o separador é um <div> comum e o CSS aplica no próprio
// elemento — um <nds-separator> deixaria um host extra entre o pai flex e a
// linha, quebrando o `align-self: stretch` da orientação vertical.

export type SeparatorOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'div[ndsSeparator]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-slot]': '"separator"',
    '[attr.data-orientation]': 'orientation()',
    '[class]': 'hostClass()',
    // Quando decorativo o elemento sai da árvore de acessibilidade
    // (role="none" + aria-hidden); quando semântico anuncia a própria
    // orientação. São exatamente os atributos que as outras stacks emitem.
    '[attr.role]': 'decorative() ? "none" : "separator"',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.aria-orientation]': 'decorative() ? null : orientation()',
  },
})
export class NdsSeparator {
  readonly orientation = input<SeparatorOrientation>('horizontal');
  /** `true` (padrão) esconde da tecnologia assistiva; `false` expõe como divisor. */
  readonly decorative = input<boolean>(true);
  readonly class = input<string>('');

  protected readonly hostClass = computed(() => cn('nds-separator', this.class()));
}
