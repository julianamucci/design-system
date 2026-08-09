import { Directive, input } from '@angular/core';

// ─── Card ─────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-card-* (docs/shared/styles/nds/card.css).
//
// TODAS as partes são diretiva de atributo em elemento nativo, não elemento
// próprio. O Vanilla — referência de markup — renderiza `<div class="nds-card">`
// e `<div class="nds-card-header">`; um `<nds-card-header>` teria a mesma classe
// e o mesmo data-slot, mas outra TAG, e markup é justamente o que a auditoria
// cross-stack compara. Com atributo, o DOM sai idêntico ao das outras quatro.
//
// Isso também preserva os seletores de filho direto do CSS
// (`has-[> .nds-card-footer]`, `> img:first-child`): sem host intermediário, a
// relação pai→filho é a mesma que o CSS espera.
//
// O título é `[ndsCardTitle]` sem input de nível: quem escreve decide o heading
// pelo elemento (`<h2 ndsCardTitle>`), mantendo a hierarquia do documento sob
// controle de quem monta a página — em vez de gerar tag dinâmica só para isso.

export type CardSize = 'default' | 'sm';

@Directive({
  selector: 'div[ndsCard]',
  standalone: true,
  host: {
    class: 'nds-card',
    '[attr.data-slot]': '"card"',
    // `data-size` propaga padding e tipografia para as partes internas via CSS.
    '[attr.data-size]': 'size()',
  },
})
export class NdsCard {
  readonly size = input<CardSize>('default');
}

@Directive({
  selector: 'div[ndsCardHeader]',
  standalone: true,
  host: { class: 'nds-card-header', '[attr.data-slot]': '"card-header"' },
})
export class NdsCardHeader {}

@Directive({
  selector: '[ndsCardTitle]',
  standalone: true,
  host: { class: 'nds-card-title', '[attr.data-slot]': '"card-title"' },
})
export class NdsCardTitle {}

@Directive({
  selector: '[ndsCardDescription]',
  standalone: true,
  host: { class: 'nds-card-description', '[attr.data-slot]': '"card-description"' },
})
export class NdsCardDescription {}

@Directive({
  selector: 'div[ndsCardAction]',
  standalone: true,
  host: { class: 'nds-card-action', '[attr.data-slot]': '"card-action"' },
})
export class NdsCardAction {}

@Directive({
  selector: 'div[ndsCardContent]',
  standalone: true,
  host: { class: 'nds-card-content', '[attr.data-slot]': '"card-content"' },
})
export class NdsCardContent {}

@Directive({
  selector: 'div[ndsCardFooter]',
  standalone: true,
  host: { class: 'nds-card-footer', '[attr.data-slot]': '"card-footer"' },
})
export class NdsCardFooter {}

/** Todas as partes do Card — conveniência para o `imports` de quem compõe. */
export const NDS_CARD = [
  NdsCard, NdsCardHeader, NdsCardTitle, NdsCardDescription,
  NdsCardAction, NdsCardContent, NdsCardFooter,
] as const;
