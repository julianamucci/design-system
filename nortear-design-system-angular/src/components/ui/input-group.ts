import { Directive, ElementRef, inject, input } from '@angular/core';

// ─── InputGroup ───────────────────────────────────────────────────────────────
//
// Visual: classes .nds-input-group-* (docs/shared/styles/nds/input-group.css).
//
// Moldura única em volta de um input (ou textarea) mais addons: ícone, texto,
// atalho de teclado, botão. A borda e o anel de foco vivem no GRUPO; o controle
// interno fica nu. É por isso que existe um `InputGroupInput` em vez de
// reaproveitar o `NdsInput` cru — ele precisa perder a própria moldura.
//
// SEM primitivo do Radix NG: não existe `@radix-ng/primitives/input-group`.
// Como no Sidebar, a peça é do design system e não da lib headless.
//
// Família própria, arquivo próprio, embora o conteúdo compartilhado documente
// tudo dentro do slug `input` — é o mesmo recorte que Svelte e Vue fazem, com
// uma pasta `input-group/` separada.

export type InputGroupAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end';

/**
 * A moldura.
 *
 * `role="group"` porque o conjunto — addon mais campo — é uma coisa só para
 * quem navega por regiões. Quem compõe dá o nome em `aria-label` ou aponta o
 * `<label>` para o campo interno.
 */
@Directive({
  selector: 'div[ndsInputGroup]',
  standalone: true,
  host: {
    class: 'nds-input-group',
    role: 'group',
    '[attr.data-slot]': '"input-group"',
  },
})
export class NdsInputGroup {}

/**
 * Addon: o que acompanha o campo dentro da moldura.
 *
 * Clicar nele leva o foco ao campo — é a área que parece parte do campo, e a
 * pessoa que mira o ícone da lupa espera começar a digitar. Um clique em cima
 * de botão NÃO faz isso: ali o alvo é o botão.
 */
@Directive({
  selector: 'div[ndsInputGroupAddon], span[ndsInputGroupAddon]',
  standalone: true,
  host: {
    class: 'nds-input-group-addon',
    '[attr.data-slot]': '"input-group-addon"',
    '[attr.data-align]': 'align()',
    '(click)': 'onClick($event)',
  },
})
export class NdsInputGroupAddon {
  /**
   * Onde o addon fica. `inline-*` mantém tudo na linha; `block-*` empilha e o
   * grupo vira coluna — o CSS reage sozinho por `:has()`.
   */
  readonly align = input<InputGroupAlign>('inline-start');

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onClick(evento: Event): void {
    const target = evento.target as HTMLElement | null;
    // Clique em botão é do botão. Sem esta guarda, apertar "limpar" também
    // devolveria o foco ao campo — e o botão perderia o próprio foco no meio
    // da ação, o que quebra a navegação por teclado.
    if (target?.closest('button')) return;

    // A moldura sai de `closest`, e não do pai imediato: um invólucro de
    // layout entre o addon e o grupo deixaria `parentElement` apontando para
    // ele, e o atalho pararia de achar o campo sem erro nenhum.
    const group = this.hostRef.nativeElement.closest('[data-slot="input-group"]');
    // O campo é procurado pela CLASSE, e não pelo `data-slot`: aqui o
    // `data-slot` sai de host binding, e host binding DISPUTA com atributo
    // estático de template quando duas diretivas caem no mesmo elemento — é o
    // risco que o docblock do `InputGroupInput` descreve logo abaixo. A classe
    // está nas cinco stacks, no mesmo elemento, e não tem essa disputa.
    group?.querySelector<HTMLElement>('.nds-input-group-control')?.focus();
  }
}

/**
 * O campo dentro do grupo. Usa-se SOZINHO: `<input ndsInputGroupInput>`.
 *
 * Não se combina com `ndsInput` no mesmo elemento, e isso não é preferência —
 * as duas diretivas ligariam `data-slot` no mesmo host, uma sobrescreveria a
 * outra em ordem não declarada, e o atributo é justamente o que o CSS do grupo
 * usa para achar o campo (`:has([data-slot="input-group-control"]:focus-visible)`).
 * O sintoma foi o anel de foco não aparecer e o clique no addon não focar
 * nada — sem erro nenhum. Por isso a classe base vem daqui também.
 */
@Directive({
  selector: 'input[ndsInputGroupInput]',
  standalone: true,
  host: {
    class: 'nds-input nds-input-group-control',
    '[attr.data-slot]': '"input-group-control"',
  },
})
export class NdsInputGroupInput {}

/** Mesma ideia do acima, e a mesma razão: `<textarea ndsInputGroupTextarea>`. */
@Directive({
  selector: 'textarea[ndsInputGroupTextarea]',
  standalone: true,
  host: {
    class: 'nds-textarea nds-input-group-control',
    '[attr.data-slot]': '"input-group-control"',
  },
})
export class NdsInputGroupTextarea {}

/** Texto ou ícone decorativo dentro do addon. */
@Directive({
  selector: 'span[ndsInputGroupText]',
  standalone: true,
  host: {
    class: 'nds-input-group-text',
    '[attr.data-slot]': '"input-group-text"',
  },
})
export class NdsInputGroupText {}

/**
 * Botão compacto dentro do grupo.
 *
 * Vai no mesmo elemento que o `ndsButton` (`<button ndsButton variant="ghost"
 * size="icon-xs" ndsInputGroupButton>`): o visual de botão continua sendo do
 * botão, e daqui sai só o aperto de medida que cabe dentro da moldura.
 *
 * A MEDIDA É DO `ndsButton`, e esta diretiva NÃO tem entrada `size` — é
 * divergência de API desta stack, registrada em vez de "alinhada". Nas outras
 * quatro, `size` é prop do próprio `InputGroupButton`, que a repassa ao botão.
 * Aqui as duas diretivas dividem o mesmo elemento, então uma entrada `size`
 * daqui seria a SEGUNDA com esse nome no mesmo host — e só produziria um
 * atributo inerte: nenhuma folha do design system lê `[data-size]` para
 * `.nds-input-group-button`. Entrada que promete medida e não aplica nenhuma é
 * pior que entrada nenhuma, porque o botão sai no tamanho padrão sem erro em
 * lugar algum. Escreva `size` no `ndsButton` do mesmo elemento.
 */
@Directive({
  selector: 'button[ndsInputGroupButton]',
  standalone: true,
  host: {
    class: 'nds-input-group-button',
    type: 'button',
    '[attr.data-slot]': '"input-group-button"',
  },
})
export class NdsInputGroupButton {}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_INPUT_GROUP = [
  NdsInputGroup, NdsInputGroupAddon, NdsInputGroupInput, NdsInputGroupTextarea,
  NdsInputGroupText, NdsInputGroupButton,
] as const;
