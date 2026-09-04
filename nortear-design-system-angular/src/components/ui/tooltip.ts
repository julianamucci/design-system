import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  RdxTooltip,
  RdxTooltipArrow,
  RdxTooltipPopup,
  RdxTooltipPortal,
  RdxTooltipPositioner,
  RdxTooltipProvider,
  RdxTooltipTrigger,
} from '@radix-ng/primitives/tooltip';

// ─── Tooltip ──────────────────────────────────────────────────────────────────
//
// Visual: .nds-tooltip-positioner (camada) + .nds-tooltip-content (balão), em
// docs/shared/styles/nds/tooltip.css. A raiz e o gatilho não têm visual próprio
// — o gatilho é sempre um botão do design system, e é por isso que o exemplo
// canônico compõe com `ndsButton`.
//
// COM os primitivos do Radix NG. O que eles entregam aqui é exatamente a parte
// que se escreve errado à mão:
//
//   · `role="tooltip"` no balão e `aria-describedby` no gatilho SÓ enquanto o
//     balão existe — um describedby apontando para id ausente é violação de
//     `aria-valid-attr-value`. As cinco stacks cumprem isso hoje: o Vanilla
//     escreve o atributo em `show()` e o remove em `hide()`;
//   · abertura por hover E por foco, com o foco abrindo INSTANTANEAMENTE e o
//     hover respeitando o delay — os dois lados da WCAG 1.4.13;
//   · Escape fecha sem mexer no foco (o gatilho continua focado), e clique fora
//     também fecha;
//   · a "grace area" entre gatilho e balão, que é o que deixa a pessoa levar o
//     mouse até o texto sem ele sumir no caminho (persistência, WCAG 1.4.13);
//   · posicionamento com auto-flip por colisão, e `data-side`/`data-align`
//     publicados no balão para o CSS saber de que lado ele nasceu.
//
// O que os primitivos NÃO entregam é `data-state="open|closed"`: o Radix NG usa
// `data-open`/`data-closed` (convenção do Base UI), enquanto Vue e Svelte
// emitem `data-state`. Como o conteúdo compartilhado documenta os estados por
// `data-state`, o balão emite os dois — o do primitivo e o do contrato.
//
// Sobre a Arrow: ela NÃO é composta aqui, de propósito. Ver a nota no fim do
// arquivo.
//
// ─── Acessibilidade: a decisão, medida nas cinco stacks em 2026-09-02 ────────
//
// 1. Abre por FOCO além de ponteiro, e o foco abre sem espera (WCAG 2.1.1).
// 2. Escape fecha sem mover o foco (WCAG 1.4.13, Dismissible).
// 3. Pairável e persistente por COORDENADA: a folha dá `pointer-events: none`
//    ao balão, então quem segura a abertura é a área de tolerância entre
//    gatilho e balão, e não um hover no nó (WCAG 1.4.13, Hoverable).
// 4. O gatilho é DESCRITO pelo balão (`aria-describedby`, e só enquanto o balão
//    existe), nunca NOMEADO por ele. Gatilho icon-only carrega `aria-label`
//    próprio: em touch não há hover.
// 5. Nada de região viva — o balão é `role="tooltip"`, e o anúncio chega pela
//    descrição do gatilho, ao focar.
//
// Texto canônico, com o porquê de cada uma: cabeçalho do tooltip do Vanilla,
// que é a referência de comportamento.
//
// Mecanismo nesta stack: os primitivos do `@radix-ng/primitives`, com polígono
// de segurança do floating-ui.
//

/** Lado preferido de abertura. O auto-flip por colisão pode trocá-lo. */
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

/** Alinhamento ao longo do eixo do `side`. */
export type TooltipAlign = 'start' | 'center' | 'end';

/**
 * Grupo de tooltips que compartilham delay.
 *
 * Diretiva de atributo em qualquer elemento — na prática, o elemento raiz da
 * app. É `@Directive` porque não tem markup próprio: só provê contexto.
 *
 * Além do delay compartilhado, o grupo mantém a janela de abertura instantânea
 * (`timeout`): depois que um tooltip do grupo abriu, os vizinhos abrem sem
 * esperar de novo, que é o que faz uma barra de ferramentas parecer uma coisa
 * só e não seis esperas independentes.
 */
@Directive({
  selector: '[ndsTooltipProvider]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxTooltipProvider,
      inputs: ['delay', 'closeDelay', 'timeout'],
    },
  ],
  host: {
    '[attr.data-slot]': '"tooltip-provider"',
  },
})
export class NdsTooltipProvider {}

/**
 * O texto do tooltip, declarado como `<ng-template>`.
 *
 * Template e não elemento: o balão vive num PORTAL (fora do fluxo, no `body`) e
 * só existe enquanto está aberto. Um `<div>` escrito pelo consumidor teria de
 * ser teleportado para lá e devolvido no fechamento; um `TemplateRef` é criado
 * e destruído junto com o portal, sem nó órfão nenhum.
 *
 * É também a razão de não existir aqui a prop `className` que o conteúdo
 * compartilhado descreve: quem escreve não é dono do elemento do balão. Classe
 * extra no balão seria API nova; enquanto não houver caso concreto, o balão tem
 * uma classe só, a do design system.
 */
@Directive({
  selector: 'ng-template[ndsTooltipContent]',
  standalone: true,
})
export class NdsTooltipContent {
  /** O template que o portal instancia dentro do balão. */
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);

  /** Lado preferido. `top` é o padrão do primitivo e do conteúdo compartilhado. */
  readonly side = input<TooltipSide>('top');

  /** Alinhamento no eixo do lado. */
  readonly align = input<TooltipAlign>('center');

  /**
   * Distância em pixels entre gatilho e balão.
   *
   * `numberAttribute` porque `sideOffset="8"` escrito como atributo chegaria
   * como string, e o cálculo de posição somaria texto a número.
   */
  readonly sideOffset = input(4, { transform: numberAttribute });
}

/**
 * Gatilho — o elemento que abre o tooltip ao hover ou ao foco.
 *
 * Seletor restrito a `button`: o primitivo escreve `type="button"` no host, o
 * que só faz sentido num botão, e a WCAG 2.1.1 exige que o gatilho seja
 * alcançável por teclado. Um `<span>` com tooltip é justamente o caso que este
 * componente não deve facilitar.
 *
 * `disabled` do `RdxTooltipTrigger` fica FORA da lista de inputs de propósito:
 * quando o gatilho é um `<button ndsTooltipTrigger ndsButton>`, o `[disabled]`
 * escrito no elemento já é o do botão — e um botão nativamente desabilitado não
 * recebe foco nem eventos de ponteiro, então o tooltip não abre de qualquer
 * forma. Duas diretivas disputando o mesmo nome de input só duplicaria o
 * mecanismo.
 *
 * `id`, ao contrário, PRECISA ser exposto: o primitivo liga `[id]` no host com
 * um id gerado, e um `id="meu-id"` escrito por quem consome seria sobrescrito
 * em runtime se não chegasse ao input.
 */
@Directive({
  selector: 'button[ndsTooltipTrigger]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxTooltipTrigger,
      inputs: ['id', 'delay', 'closeDelay', 'closeOnClick'],
    },
  ],
  host: {
    '[attr.data-slot]': '"tooltip-trigger"',
  },
})
export class NdsTooltipTrigger {}

/**
 * Raiz do Tooltip — envolve o gatilho e o template do balão.
 *
 * Seletor de atributo SEM tag: o Vanilla usa um wrapper `display: contents`
 * para não interferir no layout, e o CSS compartilhado não tem classe para
 * isso. Deixando a tag livre, quem escreve resolve o mesmo problema escolhendo
 * o elemento certo — `<span ndsTooltip>` numa linha, `<div ndsTooltip>` num
 * bloco — sem precisar de regra nova.
 *
 * É `@Component` (e não `@Directive`) porque tem markup próprio: o portal, o
 * posicionador e o balão. Uma `<ng-content />` só, no topo, projeta o gatilho —
 * o `<ng-template ndsTooltipContent>` também passa por ela e, sendo template,
 * não deixa nada no DOM.
 */
@Component({
  selector: '[ndsTooltip]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxTooltipPortal, RdxTooltipPositioner, RdxTooltipPopup, RdxTooltipArrow, NgTemplateOutlet],
  hostDirectives: [
    {
      directive: RdxTooltip,
      inputs: ['open', 'defaultOpen', 'delay', 'closeDelay', 'disabled', 'disableHoverablePopup'],
      outputs: ['openChange', 'onOpenChange'],
    },
  ],
  host: {
    '[attr.data-slot]': '"tooltip"',
  },
  template: `
    <ng-content />

    @if (content(); as c) {
      <ng-template rdxTooltipPortal>
        <div
          rdxTooltipPositioner
          class="nds-tooltip-positioner"
          [side]="c.side()"
          [align]="c.align()"
          [sideOffset]="c.sideOffset()"
        >
          <div
            rdxTooltipPopup
            class="nds-tooltip-content"
            data-slot="tooltip-content"
            [attr.data-state]="state()"
          >
            <ng-container [ngTemplateOutlet]="c.template" />
            <div rdxTooltipArrow class="nds-tooltip-arrow"></div>
          </div>
        </div>
      </ng-template>
    }
  `,
})
export class NdsTooltip {
  // A instância da host directive, não `injectRdxTooltipContext()`: a diretiva
  // está NESTE elemento, então a injeção direta é a mais curta e não depende de
  // como o primitivo registra o contexto.
  private readonly root = inject(RdxTooltip);

  // `descendants` explícito: o `<ng-template ndsTooltipContent>` costuma estar
  // um nível abaixo (dentro de um wrapper de layout do consumidor), e uma busca
  // só em filhos diretos devolveria `undefined` sem erro nenhum — tooltip que
  // nunca abre.
  protected readonly content = contentChild(NdsTooltipContent, { descendants: true });

  /** Espelha o estado para o `data-state` que Vue e Svelte também emitem. */
  protected readonly state = computed(() => (this.root.open() ? 'open' : 'closed'));
}

// ─── Sobre a Arrow ────────────────────────────────────────────────────────────
//
// Composta desde 2026-09-04. A recusa anterior está registrada aqui porque a
// premissa dela era verdadeira e DEIXOU de ser:
//
//   · o CSS compartilhado desenhava um QUADRADO girado 45° e deslocava a ponta
//     por conta própria, com `bottom`/`top`/`left`/`right` em `[data-side]`;
//   · o `RdxPopperArrow` escreve `position`, o eixo cruzado, o lado oposto e o
//     `transform` DIRETO no `style` do host — e style inline vence folha.
//
// A folha era descartada em silêncio. Ela passou a desenhar só a FORMA (um
// triângulo em `clip-path`) e a repetir, nas regras `[data-side]`, exatamente os
// valores que o `RdxPopperArrow` já aplica — os mesmos da reka-ui e do bits-ui.
// Não há mais conflito: a lib posiciona, a folha desenha.
//
// O segundo motivo continua verdadeiro e é tratado na folha, não aqui: o
// `RdxArrow` projeta um `<svg>` de polígono com `fill="currentColor"`, que
// pegaria a cor do TEXTO do balão. É conteúdo de fallback de um `<ng-content>`,
// e `.nds-tooltip-arrow > svg { display: none }` o cala.

/** As quatro peças — conveniência para o `imports` de quem compõe. */
export const NDS_TOOLTIP = [
  NdsTooltipProvider,
  NdsTooltip,
  NdsTooltipTrigger,
  NdsTooltipContent,
] as const;
