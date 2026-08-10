import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  RdxPreviewCardPopup,
  RdxPreviewCardPortal,
  RdxPreviewCardPositioner,
  RdxPreviewCardRoot,
  RdxPreviewCardTrigger,
  injectRdxPreviewCardRootContext,
} from '@radix-ng/primitives/preview-card';

// ─── HoverCard ────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-hover-card-positioner e .nds-hover-card-content
// (docs/shared/styles/nds/hover-card.css). O gatilho não tem visual próprio —
// é um `<a>` ou `<button>` de quem consome, e é ele que precisa continuar
// clicável: o cartão é ENRIQUECIMENTO, nunca o único caminho para a informação.
//
// COM os primitivos do Radix NG (`rdxPreviewCard*`, o nome do preview card no
// Radix NG). O que eles entregam é exatamente a parte difícil de escrever à mão:
//
//   · os DOIS temporizadores — abrir depois de `openDelay`, fechar depois de
//     `closeDelay` — com cancelamento cruzado, então entrar e sair rápido não
//     deixa cartão órfão nem pisca;
//   · abertura por FOCO além de ponteiro, que é o que sustenta a WCAG 1.4.13
//     para quem navega por teclado (o `focus` no gatilho abre com o mesmo
//     delay do hover);
//   · fechamento por Escape, por clique fora e por saída de foco, via a camada
//     de dismissal — o listener de Escape é do documento, então funciona com o
//     foco ainda no gatilho;
//   · o posicionamento contra o gatilho (floating-ui) com fuga de colisão, e a
//     publicação de `data-side`/`data-align` no painel;
//   · a PONTE DE PONTEIRO entre gatilho e painel: ao sair do gatilho o
//     positioner monta um polígono de tolerância até o painel, e o cartão só
//     fecha quando o ponteiro sai desse polígono. Sem isso, o espaço vazio
//     entre os dois fecharia o cartão no meio do caminho — o defeito clássico
//     do hover card feito à mão;
//   · o portal, que só monta enquanto o cartão está presente e sobrevive à
//     animação de saída (é o que dá o que animar em `[data-ending-style]`).
//
// O que os primitivos NÃO entregam, e este componente acrescenta:
//
//   · `role="dialog"` no painel. O primitivo não emite nenhum papel de
//     propósito (o Base UI trata o preview card como conteúdo suplementar), mas
//     o Vanilla — referência de markup — escreve `role="dialog"` no painel, e é
//     o que as outras stacks emitem. Paridade de markup é o que a auditoria
//     cross-stack compara, então emitimos igual;
//   · o NOME ACESSÍVEL desse dialog, sem o qual o axe reprova (`aria-dialog-name`).
//     Sai de `label` quando quem compõe informa, e cai no texto do gatilho —
//     mesma regra do Vanilla.
//
// Anatomia: a raiz é elemento nativo com diretiva de atributo, como no resto do
// stack, e o CONTEÚDO é um `<ng-template>`. Duas razões: o painel vive num
// portal no `<body>`, então declarar o conteúdo como template evita deixar um
// elemento vazio no meio do texto; e o template só é instanciado quando o
// cartão abre, que é o mesmo custo das outras stacks.

export type HoverCardSide = 'top' | 'right' | 'bottom' | 'left';
export type HoverCardAlign = 'start' | 'center' | 'end';

/**
 * Conteúdo do cartão — um `<ng-template>`, não um elemento.
 *
 * Carrega também o posicionamento, porque é aqui que o conteúdo compartilhado o
 * documenta (`side`/`align` "em HoverCardContent"). A raiz lê estes inputs e os
 * repassa ao positioner.
 */
@Directive({
  selector: 'ng-template[ndsHoverCardContent]',
  standalone: true,
})
export class NdsHoverCardContent {
  /** Lado preferido de abertura. Vira o outro lado sozinho se não couber. */
  readonly side = input<HoverCardSide>('bottom');

  /** Alinhamento no eixo do lado escolhido. */
  readonly align = input<HoverCardAlign>('center');

  /**
   * Distância entre gatilho e painel, em px. 8 para bater com o Vanilla, que é
   * a referência de medida do sistema.
   */
  readonly sideOffset = input<number>(8);

  /** Deslocamento no eixo de alinhamento, em px. */
  readonly alignOffset = input<number>(0);

  /**
   * Nome acessível do painel. Só é preciso quando o texto do gatilho não
   * descreve o cartão — sem nada aqui, o nome vem do próprio gatilho.
   */
  readonly label = input<string>('');

  /**
   * Classes extras para o painel.
   *
   * Não é o input `class` que a convenção do stack proíbe: aquele duplica a
   * mesclagem que o Angular já faz no elemento que quem consome escreve. Aqui o
   * painel é criado DENTRO deste componente, dentro de um portal — não existe
   * elemento em que escrever a classe. É o único caminho para trocar a largura
   * padrão de 20rem, por exemplo.
   */
  readonly contentClass = input<string>('');

  /**
   * O `<ng-template>` em si. `inject(TemplateRef)` JÁ é a TemplateRef — quem
   * consome nunca chama isto como função.
   */
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

/**
 * Raiz do HoverCard — agrupa gatilho e conteúdo e monta o portal.
 *
 * `span` e não `div`: o gatilho canônico é uma menção no meio de uma frase
 * ("Comentário de @joana"), e um bloco ali quebraria o parágrafo. O Vanilla
 * resolve com `display: contents` num `<div>`, que é estilo inline e não pode
 * ser escrito aqui; o `<span>` é o equivalente sem CSS inline (ver o relatório
 * de divergências).
 */
@Component({
  selector: 'span[ndsHoverCard]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Como todo componente de UI deste stack: o visual inteiro vem de
  // @shared/styles/nds/, que é global.
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    RdxPreviewCardPortal,
    RdxPreviewCardPositioner,
    RdxPreviewCardPopup,
  ],
  hostDirectives: [
    {
      directive: RdxPreviewCardRoot,
      // `open` é model do primitivo, então `[(open)]` funciona. `openDelay` e
      // `closeDelay` NÃO estão aqui: no Radix NG eles moram no gatilho (ver a
      // nota em NdsHoverCardTrigger).
      inputs: ['open', 'defaultOpen'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    '[attr.data-slot]': '"hover-card"',
  },
  template: `
    <ng-content />

    @if (conteudo(); as c) {
      <!-- A diretiva de portal é ESTRUTURAL: teleporta para o body só
           enquanto o cartão está presente e segura o elemento durante a
           animação de saída. Fechado, não há nada no DOM — o mesmo contrato do
           estado "Fechado" descrito no conteúdo compartilhado. -->
      <div
        *rdxPreviewCardPortal
        rdxPreviewCardPositioner
        class="nds-hover-card-positioner"
        [side]="c.side()"
        [align]="c.align()"
        [sideOffset]="c.sideOffset()"
        [alignOffset]="c.alignOffset()"
      >
        <div
          rdxPreviewCardPopup
          class="nds-hover-card-content"
          [class]="c.contentClass()"
          role="dialog"
          [attr.aria-label]="nomeAcessivel()"
          [attr.data-slot]="'hover-card-content'"
        >
          <ng-container [ngTemplateOutlet]="c.templateRef" />
        </div>
      </div>
    }
  `,
})
export class NdsHoverCard {
  /**
   * Uma `<ng-content>` só, e ela projeta o GATILHO. O conteúdo do cartão entra
   * por consulta de conteúdo e é instanciado dentro do portal — dois destinos
   * de projeção padrão não entregariam nada a nenhum dos dois.
   */
  protected readonly conteudo = contentChild(NdsHoverCardContent);

  // O contexto da raiz vem do próprio elemento: `RdxPreviewCardRoot` é host
  // directive deste componente e publica o contexto no injetor do host.
  private readonly raiz = injectRdxPreviewCardRootContext();

  /**
   * Nome acessível do painel.
   *
   * `role="dialog"` sem nome é violação de axe (`aria-dialog-name`), e o texto
   * do gatilho é o rótulo natural: o cartão é o preview DAQUELA menção. Ler o
   * `textContent` não reage a mudanças de texto — como no Vanilla, o valor é
   * resolvido quando o painel monta, que é quando ele importa.
   */
  protected readonly nomeAcessivel = computed(() => {
    const explicito = this.conteudo()?.label();
    if (explicito) return explicito;
    return this.raiz.trigger()?.textContent?.trim() || undefined;
  });
}

/**
 * Gatilho — o elemento que abre o cartão ao ponteiro E ao foco.
 *
 * Só `<a>` e `<button>`: o cartão precisa ser alcançável por teclado, e um
 * `<span>` com hover deixaria de fora quem não usa mouse. O primitivo emite um
 * aviso em dev quando o host não é focável por natureza.
 *
 * Os delays moram AQUI, e não na raiz. O primitivo lê `delay`/`closeDelay` do
 * gatilho no momento do `pointerenter`/`focus` e só então os informa à raiz —
 * é o que permite dois gatilhos com tempos diferentes compartilhando um cartão.
 * Os nomes públicos seguem o conteúdo compartilhado (`openDelay`/`closeDelay`).
 */
@Directive({
  selector: 'a[ndsHoverCardTrigger], button[ndsHoverCardTrigger]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxPreviewCardTrigger,
      inputs: ['delay: openDelay', 'closeDelay', 'disabled'],
    },
  ],
  host: {
    '[attr.data-slot]': '"hover-card-trigger"',
  },
})
export class NdsHoverCardTrigger {
  constructor() {
    // `type="button"` de criação, e só quando o host é `<button>` e quem
    // escreveu não pediu outro tipo. Sem isso, um gatilho dentro de `<form>`
    // herdaria `type="submit"` e passar o mouse — depois um Enter — enviaria o
    // formulário. Não pode ser `host: { type: 'button' }` porque o mesmo
    // seletor atende `<a>`, onde `type` significa outra coisa.
    const el = inject(ElementRef).nativeElement as HTMLElement;
    if (el.tagName === 'BUTTON' && !el.hasAttribute('type')) {
      el.setAttribute('type', 'button');
    }
  }
}

/** As três peças — conveniência para o `imports` de quem compõe. */
export const NDS_HOVER_CARD = [
  NdsHoverCard,
  NdsHoverCardTrigger,
  NdsHoverCardContent,
] as const;
