import { Directive } from '@angular/core';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
//
// Visual: classe .nds-skeleton (docs/shared/styles/nds/skeleton.css), que já
// traz o pulso e o respeito a `prefers-reduced-motion`.
//
// Sem dimensão própria e sem inputs de tamanho: quem usa define largura e altura
// pela classe utilitária ou por style, porque o esqueleto tem que imitar a caixa
// do conteúdo que vai substituir — dimensão fixa no componente daria sempre o
// retângulo errado.
//
// `aria-hidden` fixo, não configurável: o esqueleto é ruído para leitor de tela.
// Quem anuncia o carregamento é o container, com `aria-busy` — está documentado
// na docs page e é o que as outras quatro stacks fazem.

@Directive({
  selector: 'div[ndsSkeleton]',
  standalone: true,
  host: {
    class: 'nds-skeleton',
    '[attr.data-slot]': '"skeleton"',
    '[attr.aria-hidden]': '"true"',
  },
})
export class NdsSkeleton {}
