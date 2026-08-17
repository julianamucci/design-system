import { Directive, input } from '@angular/core';

// ─── Separator ────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-separator (docs/shared/styles/nds/separator.css).
// Decorativo por default (role="none"); use [decorative]="false" para semântico.
//
// `@Directive` e não `@Component`: não há template nem projeção de conteúdo —
// só atributos aplicados a um <div> que já existe. Um componente criaria view e
// ciclo de detecção para renderizar nada.
//
// SEM `RdxSeparatorRootDirective`. O primitivo do Radix NG só guarda a
// `orientation` num signal: não emite `role`, `aria-orientation` nem
// `data-orientation`, e não conhece `decorative` — que é a decisão de
// acessibilidade que este design system define (ver Vanilla, a referência
// cross-stack). Compor com ele acrescentaria dependência sem contribuição.
//
// Seletor de atributo: o separador é um <div> comum e o CSS aplica no próprio
// elemento — um <nds-separator> deixaria um host extra entre o pai flex e a
// linha, quebrando o `align-self: stretch` da orientação vertical.
//
// `class` estático no host, sem input de classe nem `cn()`: o Angular MESCLA a
// classe declarada aqui com a que o consumidor escreve no elemento. Um input
// `class` que refaz a mesclagem à mão é hábito de React (`className`), onde a
// prop sobrescreve — aqui ele só duplicaria o que o framework já faz.

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorEmphasis = 'default' | 'strong';

@Directive({
  selector: 'div[ndsSeparator]',
  standalone: true,
  host: {
    class: 'nds-separator',
    '[attr.data-slot]': '"separator"',
    '[attr.data-orientation]': 'orientation()',
    // A folha compartilhada só conhece `strong`; o valor default não vira
    // atributo para o DOM não carregar um estado que não muda nada.
    '[attr.data-emphasis]': 'emphasis() === "strong" ? "strong" : null',
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
  /** `strong` dobra a espessura e troca o token de cor da linha. */
  readonly emphasis = input<SeparatorEmphasis>('default');
}
