import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  RdxDialogRoot,
  RdxDialogTrigger,
  RdxDialogPortal,
  RdxDialogBackdrop,
  RdxDialogPopup,
  RdxDialogTitle,
  RdxDialogDescription,
  RdxDialogClose,
  type RdxDialogOpenChangeReason,
} from '@radix-ng/primitives/dialog';
import { NdsButton, NdsButtonIcon } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Sheet ────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-sheet-* (docs/shared/styles/nds/sheet.css), o mesmo
// conjunto que o Vanilla — referência de markup — escreve à mão.
//
// COM os primitivos de Dialog do Radix NG, porque o Sheet É um Dialog com
// posicionamento lateral e a parte difícil dele não é o CSS. O que o primitivo
// entrega, e que se escreve errado à mão:
//
//   · `role="dialog"` + `aria-modal="true"` no painel;
//   · `aria-labelledby` / `aria-describedby` ligados aos ids REAIS do título e
//     da descrição — as diretivas de título/descrição registram o próprio id no
//     contexto da raiz, então o painel nunca aponta para um id que não existe;
//   · foco preso enquanto aberto e devolvido ao gatilho ao fechar (o gerenciador
//     sobrevive à animação de saída, senão o foco voltaria antes da hora);
//   · Escape e clique fora fecham, com o dialog mais profundo primeiro;
//   · trava de rolagem da página e `inert` nos irmãos enquanto modal;
//   · portal para o `document.body` com desmontagem só depois da transição de
//     saída — é o que dá o que animar no fechamento;
//   · `data-starting-style` / `data-ending-style`, exatamente os ganchos que o
//     CSS compartilhado usa para animar entrada e saída.
//
// O que o primitivo NÃO entrega é `data-state="open|closed"`: o Radix NG segue a
// convenção do Base UI (`data-open` / `data-closed`). Emitimos os dois — o par
// do primitivo, que o CSS lê, e o `data-state`, que o conteúdo compartilhado
// documenta na tabela de estados e que Vue e Svelte também emitem.
//
// ─── Forma da API ─────────────────────────────────────────────────────────────
//
// O painel é renderizado por PORTAL, fora da posição em que quem consome o
// escreveu. Em Angular isso obriga o conteúdo a viver num `<ng-template>`: o
// `rdxDialogPortal` é diretiva estrutural e o portal precisa de dois nós raiz
// (backdrop + painel). Daí a forma:
//
//   <nds-sheet>
//     <button ndsSheetTrigger ndsButton variant="outline">Abrir</button>
//     <ng-template ndsSheetContent side="right">…</ng-template>
//   </nds-sheet>
//
// O gatilho fica onde foi escrito (uma `<ng-content />` só, sem ramo de `@if` —
// duas destinações de projeção não entregariam conteúdo a nenhuma das duas), e o
// conteúdo do painel entra pelo `ngTemplateOutlet` dentro do portal.

/** Borda de onde o painel desliza. */
export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

/** Caminho que fechou o painel — o vocabulário que o analytics do produto usa. */
export type SheetCloseReason = 'escape' | 'overlay' | 'close-button' | 'action';

/**
 * Traduz o motivo do primitivo para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `dialog_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 */
export function sheetCloseReason(motivo: RdxDialogOpenChangeReason): SheetCloseReason {
  switch (motivo) {
    case 'escape-key':
      return 'escape';
    // Clique no backdrop e foco que escapa são o mesmo gesto do ponto de vista
    // de quem usa: "saí do painel sem decidir nada".
    case 'outside-press':
    case 'focus-out':
      return 'overlay';
    case 'close-press':
      return 'close-button';
    default:
      return 'action';
  }
}

/**
 * Conteúdo do painel.
 *
 * `<ng-template>` e não elemento: o painel é criado dentro do portal, e é o
 * único jeito de o conteúdo escrito por quem consome atravessar para lá sem
 * perder o contexto de binding do componente que o declarou.
 *
 * `side` mora aqui, e não na raiz, porque é isso que o conteúdo compartilhado
 * documenta ("a prop side fica no Content") e o que as outras quatro stacks
 * fazem.
 *
 * `panelClass` é a única exceção à regra "nunca criar input de classe" neste
 * stack, e a exceção tem causa: a regra existe porque o Angular já mescla a
 * classe que quem consome escreve NO ELEMENTO. Aqui não há elemento — o painel
 * é construído por este componente, dentro do portal, e quem consome não tem
 * onde escrever. O conteúdo compartilhado documenta essa mesma escotilha nas
 * outras stacks como `className`, e é por ela que se ajusta a largura do painel.
 */
@Directive({
  selector: 'ng-template[ndsSheetContent]',
  standalone: true,
})
export class NdsSheetContent {
  /** O próprio template — instanciado pelo `ngTemplateOutlet` dentro do portal. */
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);

  readonly side = input<SheetSide>('right');

  /** Botão X embutido no canto do painel. */
  readonly showCloseButton = input(true);

  /**
   * Nome acessível do botão X. O default é o mesmo das outras quatro stacks —
   * que até 2026-08-30 tinham a palavra cravada no markup, sem entrada nenhuma
   * para trocá-la. Numa aplicação traduzida, passe o rótulo.
   */
  readonly closeLabel = input('Fechar');

  /** Classes .nds-* extras no painel (largura, principalmente). */
  readonly panelClass = input('');
}

/**
 * Raiz do Sheet.
 *
 * `open` é model do primitivo, então `[(open)]` funciona; `defaultOpen` cobre o
 * modo não-controlado. `modal` fica exposto porque decide três coisas de uma vez
 * (foco preso, rolagem travada, ponteiro bloqueado fora) e há painel lateral que
 * quer conviver com a página.
 *
 * `triggerId` / `defaultTriggerId` / `handle` do primitivo ficam FORA da lista:
 * servem ao caso de gatilho destacado, que este design system não documenta.
 */
@Component({
  selector: 'nds-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O visual inteiro vem de @shared/styles/nds/sheet.css, que é global.
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgTemplateOutlet,
    RdxDialogPortal,
    RdxDialogBackdrop,
    RdxDialogPopup,
    RdxDialogClose,
    NdsButton,
    NdsButtonIcon,
  ],
  hostDirectives: [
    {
      directive: RdxDialogRoot,
      inputs: ['open', 'defaultOpen', 'modal', 'disablePointerDismissal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    '[attr.data-slot]': '"sheet"',
  },
  template: `
    <ng-content />

    @if (content(); as c) {
      <ng-template rdxDialogPortal>
        <div
          rdxDialogBackdrop
          class="nds-sheet-overlay"
          data-slot="sheet-overlay"
          [attr.data-state]="state()"
        ></div>

        <div
          rdxDialogPopup
          [class]="classeDoPainel()"
          data-slot="sheet-content"
          [attr.data-side]="c.side()"
          [attr.data-state]="state()"
        >
          <ng-container [ngTemplateOutlet]="c.tpl" />

          @if (c.showCloseButton()) {
            <!-- Botão do design system, não um <button> cru: assim o X herda
                 anel de foco, hover e área de toque do sistema. O CSS
                 compartilhado tem .nds-sheet-close-position justamente para
                 esta composição — só posicionamento, nenhum visual próprio. -->
            <button
              rdxDialogClose
              ndsButton
              variant="ghost"
              size="icon-sm"
              class="nds-sheet-close-position"
              data-slot="sheet-close"
            >
              <svg ndsButtonIcon kind="x"></svg>
              <span class="nds-sr-only">{{ c.closeLabel() }}</span>
            </button>
          }
        </div>
      </ng-template>
    }
  `,
})
export class NdsSheet {
  /**
   * A raiz do Dialog aplicada como host directive. Injetável daqui porque host
   * directive vive no injector de elemento do próprio componente.
   */
  private readonly root = inject(RdxDialogRoot);

  protected readonly content = contentChild(NdsSheetContent, { descendants: true });

  /**
   * `data-state` para as outras stacks e para a tabela de estados do conteúdo
   * compartilhado. O par `data-open` / `data-closed` que o CSS lê continua vindo
   * do primitivo — este atributo é adição, não substituição.
   */
  protected readonly state = computed(() => (this.root.open() ? 'open' : 'closed'));

  protected readonly classeDoPainel = computed(() =>
    cn('nds-sheet-content', this.content()?.panelClass()),
  );

  constructor() {
    // Painel modal sem nome acessível é o defeito silencioso deste componente:
    // o leitor de tela anuncia "diálogo" e nada mais, e nenhum teste de render
    // percebe. O primitivo só escreve `aria-labelledby` quando existe um
    // `ndsSheetTitle` registrado — sem título visível, use um com .nds-sr-only.
    effect(() => {
      if (!isDevMode()) return;
      if (!this.root.open()) return;
      // A checagem é adiada de propósito. O `ndsSheetTitle` registra o próprio
      // id no construtor, e o construtor só roda quando o portal cria a view do
      // painel — um passo DEPOIS de `open` virar true. Avaliar aqui dentro
      // acusaria todo painel correto no instante da abertura.
      setTimeout(() => {
        if (untracked(this.root.open) && !untracked(this.root.titleId)) {
          console.warn(
            '[nds-sheet] painel aberto sem ndsSheetTitle: o diálogo fica sem nome ' +
              'acessível. Se o título não deve aparecer, mantenha o elemento e ' +
              'aplique a classe nds-sr-only.',
          );
        }
      });
    });
  }
}

/**
 * Botão que abre o painel.
 *
 * `disabled` do `RdxDialogTrigger` fica FORA da lista de inputs: quando o
 * gatilho também é `ndsButton`, os dois ligariam `attr.disabled` no mesmo
 * elemento e o último a rodar venceria. Desabilitar pelo botão dá as três coisas
 * de uma vez — sem clique, sem foco, aparência e anúncio nativos.
 *
 * `handle` também fica de fora: serve ao gatilho destacado, fora da raiz, que
 * este design system não documenta.
 */
@Directive({
  selector: 'button[ndsSheetTrigger]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxDialogTrigger,
      inputs: ['id', 'payload'],
    },
  ],
  host: {
    '[attr.data-slot]': '"sheet-trigger"',
  },
})
export class NdsSheetTrigger {}

/**
 * Cabeçalho do painel — título e descrição.
 *
 * Diretiva, não componente: só acrescenta classe e `data-slot` a um `<div>` que
 * quem consome já escreveu.
 */
@Directive({
  selector: 'div[ndsSheetHeader]',
  standalone: true,
  host: {
    class: 'nds-sheet-header',
    '[attr.data-slot]': '"sheet-header"',
  },
})
export class NdsSheetHeader {}

/**
 * Título acessível.
 *
 * O primitivo publica o id deste elemento no contexto da raiz, e é dele que sai
 * o `aria-labelledby` do painel. Seletor restrito a cabeçalho porque o título de
 * um diálogo é cabeçalho de verdade — o nível certo depende do que existe na
 * página em volta.
 */
@Directive({
  selector: 'h2[ndsSheetTitle], h3[ndsSheetTitle]',
  standalone: true,
  hostDirectives: [RdxDialogTitle],
  host: {
    class: 'nds-sheet-title',
    '[attr.data-slot]': '"sheet-title"',
  },
})
export class NdsSheetTitle {}

/**
 * Descrição acessível — vira o `aria-describedby` do painel pelo mesmo caminho
 * do título.
 */
@Directive({
  selector: 'p[ndsSheetDescription]',
  standalone: true,
  hostDirectives: [RdxDialogDescription],
  host: {
    class: 'nds-sheet-description',
    '[attr.data-slot]': '"sheet-description"',
  },
})
export class NdsSheetDescription {}

/**
 * Corpo rolável do painel.
 *
 * `tabindex="0"` estático, como no Vanilla: quando o conteúdo excede a altura do
 * painel, a região rolável precisa ser alcançável por teclado (WCAG 2.1.1 —
 * é a regra `scrollable-region-focusable` do axe). O `flex: 1` do CSS
 * compartilhado é o que mantém o rodapé no lugar enquanto o corpo rola.
 */
@Directive({
  selector: 'div[ndsSheetBody]',
  standalone: true,
  host: {
    class: 'nds-sheet-body',
    tabindex: '0',
    '[attr.data-slot]': '"sheet-body"',
    '[attr.role]': 'ariaLabel() ? "group" : null',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class NdsSheetBody {
  /**
   * Nome acessível da região que rola. Sem padrão, de propósito.
   *
   * O conteúdo é o que quem monta pôs lá dentro, e só ali se sabe o que é;
   * padrão genérico anunciaria sem informar. Sem nome NÃO emitimos papel
   * nenhum — nome em elemento sem papel é atributo proibido, e o axe acusa
   * `aria-prohibited-attr`.
   *
   * Divergência de API de framework, registrada e não "alinhada": aqui é
   * `input` com apelido, para que o markup escrito continue idêntico ao das
   * outras stacks.
   */
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });
}

/** Rodapé de ações — cancelar à esquerda, ação primária à direita. */
@Directive({
  selector: 'div[ndsSheetFooter]',
  standalone: true,
  host: {
    class: 'nds-sheet-footer',
    '[attr.data-slot]': '"sheet-footer"',
  },
})
export class NdsSheetFooter {}

/**
 * Botão que fecha o painel.
 *
 * Vale para o "Cancelar" do rodapé e para qualquer outro caminho de saída. O X
 * do canto já vem embutido no `ndsSheetContent`.
 */
@Directive({
  selector: 'button[ndsSheetClose]',
  standalone: true,
  hostDirectives: [RdxDialogClose],
  host: {
    '[attr.data-slot]': '"sheet-close"',
  },
})
export class NdsSheetClose {}

/** As peças todas — conveniência para o `imports` de quem compõe. */
export const NDS_SHEET = [
  NdsSheet,
  NdsSheetTrigger,
  NdsSheetContent,
  NdsSheetHeader,
  NdsSheetTitle,
  NdsSheetDescription,
  NdsSheetBody,
  NdsSheetFooter,
  NdsSheetClose,
] as const;
