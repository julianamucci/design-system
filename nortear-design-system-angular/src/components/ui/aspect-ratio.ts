import { Directive, computed, input } from '@angular/core';

// ─── Aspect Ratio ─────────────────────────────────────────────────────────────
//
// Visual: classe .nds-aspect-ratio (docs/shared/styles/nds/aspect-ratio.css).
// O CSS declara `aspect-ratio: var(--ratio)` e põe os filhos em
// `position: absolute; inset: 0`, para que img e iframe cubram a caixa mesmo
// tendo dimensão intrínseca.
//
// SEM `RdxAspectRatioDirective`. Ele resolve o mesmo problema por outro
// mecanismo: liga `[style.aspect-ratio]` direto no elemento. Funcionaria, mas
// as outras quatro stacks emitem a custom property `--ratio`, e é ela que o CSS
// compartilhado lê. Usar o primitivo daria a esta stack um inline style que
// nenhuma outra tem e sobrescreveria a regra do design system em vez de
// alimentá-la.

@Directive({
  selector: 'div[ndsAspectRatio]',
  standalone: true,
  host: {
    class: 'nds-aspect-ratio',
    '[attr.data-slot]': '"aspect-ratio"',
    '[style.--ratio]': 'ratioCss()',
  },
})
export class NdsAspectRatio {
  /** Proporção largura/altura. Ex.: `16/9`, `4/3`, `1`. */
  readonly ratio = input<number>(1);

  // String e não número: `[style.--ratio]` com valor numérico faz o Angular
  // anexar "px" a custom property em algumas versões. String passa literal.
  protected readonly ratioCss = computed(() => String(this.ratio()));
}
