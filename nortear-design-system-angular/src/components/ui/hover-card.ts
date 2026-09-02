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
// ─── Acessibilidade: o cartão é enriquecimento, e o teclado não entra nele ──
//
// Abre por PONTEIRO e por FOCO, fecha no `blur` do gatilho e não move o foco
// para o painel — então um Tab a partir do gatilho fecha o cartão antes de
// alcançar o que houver dentro. Conteúdo interativo no painel é inalcançável
// por teclado, e isso vale nas cinco stacks: é a forma do gesto, não defeito de
// uma delas. Daí as três regras — nada de ação, link ou campo no painel; o
// gatilho continua sendo o caminho; abrir por foco é obrigatório.
//
// **Descrição sim, papel não** (decisão de 2026-09-02, que INVERTE a anterior).
// O painel era `role="dialog"` nomeado pelo gatilho, e o gatilho não apontava
// para ele — para não anunciar a mesma coisa duas vezes. O argumento estava
// certo e resolvia o problema errado: a duplicação vinha de o painel ser um
// diálogo homônimo, e isso era escolha nossa. Medido, o defeito era outro — com
// o cartão ABERTO na tela, o leitor anunciava só o gatilho, porque nada leva o
// foco ao painel e o `blur` fecha o cartão. Agora o painel não tem papel, e o
// gatilho o DESCREVE por `aria-describedby` enquanto o cartão está aberto.
//
//  · GANHA-SE o anúncio do conteúdo, no foco do gatilho;
//  · PERDE-SE o painel como nó com papel próprio na árvore de acessibilidade.
//
// O painel também não tem nome próprio: `aria-label` em elemento sem papel é
// `aria-prohibited-attr` no axe, então o nome saiu junto com o papel em vez de
// sobrar apontando para nada. `aria-labelledby` continua fora (trocaria o nome
// do link pelo do cartão), e `aria-describedby` só existe enquanto o painel
// existe — escrito na montagem seria `aria-valid-attr-value`.
//
// **Mecanismo desta stack** (medido em `node_modules`): o gatilho liga
// `pointerenter`, `pointerleave`, `focus` e `blur` no host — o foco é o CRU,
// sem guarda de foco visível. O painel cancela o fechamento no próprio
// `pointerenter`, e o Escape sai da camada dispensável do popup.
//
// Bloco canônico, com a comparação contra tooltip e popover e as três condições
// da WCAG 1.4.13: `hover-card.ts` do Vanilla.
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
//   · a ASSOCIAÇÃO entre gatilho e painel. O primitivo não emite papel nem
//     relação nenhuma (medido em `node_modules`: nem o popup nem o gatilho
//     escrevem `role` ou `aria-*` de relação), e é o design system que decide.
//     O `id` do painel já vem do primitivo — `contentId` do contexto da raiz é
//     o mesmo valor que o host do popup escreve —, e o gatilho o aponta por
//     `aria-describedby` enquanto `isOpen()`.
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

    @if (content(); as c) {
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
  protected readonly content = contentChild(NdsHoverCardContent);
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
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class NdsHoverCardTrigger {
  // O contexto da raiz alcança o gatilho porque `RdxPreviewCardRoot` é host
  // directive do `span[ndsHoverCard]`, e o gatilho é filho dele no template de
  // quem compõe — o mesmo injetor que o `RdxPreviewCardTrigger` já usa.
  private readonly root = injectRdxPreviewCardRootContext();

  /**
   * `aria-describedby` só enquanto o cartão está aberto.
   *
   * `contentId` é o mesmo valor que o host do popup escreve no `id` — não há
   * `id` a gerar aqui. Fechado, o atributo sai: apontando para um nó fora do
   * documento, seria `aria-valid-attr-value` no axe.
   */
  protected readonly describedBy = computed(() =>
    this.root.isOpen() ? this.root.contentId : null,
  );

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
