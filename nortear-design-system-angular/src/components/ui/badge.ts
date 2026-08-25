import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'info';

// Tabela em vez de cadeia de ternários — mesma decisão do Vanilla: com cinco
// variantes o último ramo é inalcançável e vira ruído de cobertura.
//
// `secondary` e `outline` saíram: a primeira era quase indistinguível da
// default, e a borda neutra que era da outline passou a ser a da `info`.
const VARIANT_CLASSNAME: Record<BadgeVariant, string> = {
  default: '',
  destructive: 'nds-badge-destructive',
  warning: 'nds-badge-warning',
  success: 'nds-badge-success',
  info: 'nds-badge-info',
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

  // `[class]` porque a variante é dinâmica; o `class` que o consumidor
  // escreve no elemento é mesclado pelo Angular, sem input dedicado.
  protected readonly hostClass = computed(() =>
    cn('nds-badge', VARIANT_CLASSNAME[this.variant()]),
  );
}

// ─── BadgeCounter ─────────────────────────────────────────────────────────────
//
// Contador da etiqueta — o número à direita do rótulo, DENTRO do badge.
//
// `@Directive` e não `@Component`: a peça é folha. O número já é conteúdo que o
// consumidor escreve no próprio `<span>`, não há nada a projetar nem markup
// próprio a montar — é a mesma escolha de `NdsAlertTitle` e `NdsAlertAction`, e
// evita o `<ng-content />` de um componente que só existiria para repassar o
// texto adiante.
//
// Seletor amarrado a `span[...]`: o contador mora dentro de uma etiqueta que já
// é inline, e um `<div>` aqui quebraria a linha do rótulo.
//
// Não é variante, é peça: qualquer variante do badge a aceita. Fosse variante,
// o número de combinações dobrava para dizer a mesma coisa.
//
// Ela é NEUTRA por decisão de contraste (fundo `--secondary`, texto
// `--foreground`): preencher o contador com a cor da variante deixa o número
// abaixo de 4.5:1 em parte dos temas. A cor não se perde — quem a carrega é a
// borda da etiqueta, ao redor.
//
// `class` estático no host (o Angular mescla com o que o call site escrever) e
// `data-slot` como host binding, no mesmo formato das demais subpeças da stack.
// Vale lembrar que só `npm run build` (`ngc --noEmit`) type-checka esta
// expressão — `build-storybook` não olha binding de host.
@Directive({
  selector: 'span[ndsBadgeCounter]',
  standalone: true,
  host: {
    class: 'nds-badge-counter',
    '[attr.data-slot]': '"badge-counter"',
  },
})
export class NdsBadgeCounter {}
