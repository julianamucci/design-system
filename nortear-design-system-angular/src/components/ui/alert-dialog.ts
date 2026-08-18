import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
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
  provideRdxDialogVariant,
  injectRdxDialogRootContext,
} from '@radix-ng/primitives/dialog';

// ─── AlertDialog ──────────────────────────────────────────────────────────────
//
// Visual: classes `.nds-alert-dialog-*` (docs/shared/styles/nds/alert-dialog.css).
//
// É o irmão do Dialog para decisões que não têm volta: excluir, revogar,
// descartar. Três coisas o separam, e nenhuma é estética:
//
//   1. `role="alertdialog"` — o leitor de tela anuncia com urgência e lê a
//      descrição junto do título, em vez de esperar a pessoa navegar até ela.
//   2. Clique fora NÃO fecha. Um diálogo comum se dispensa por engano sem
//      consequência; aqui a dispensa acidental esconde a pergunta e deixa a
//      pessoa sem saber se a ação aconteceu.
//   3. Escape FECHA, e equivale a cancelar. É o que o conteúdo compartilhado
//      documenta em `testes.functional.item4`, e é o certo: tirar a única saída
//      de teclado seria pior do que o risco de dispensa acidental.
//
// As três vêm de `provideRdxDialogVariant`, que o primitivo expõe justamente
// para isto — não são inputs públicos, são o perfil do componente, fixado na
// construção. Ninguém que consome consegue afrouxá-las por engano.
//
// ─── A forma da API ───────────────────────────────────────────────────────────
//
//   <nds-alert-dialog>                        raiz: estado, portal, overlay
//     <button ndsAlertDialogTrigger>          gatilho
//     <ng-template ndsAlertDialogContent>     o painel
//
// O painel é `<ng-template>` e não elemento projetado. Nó projetado pertence à
// view de quem consome: o portal remove o DOM ao fechar mas NÃO destrói as
// diretivas, e é a destruição que devolve o foco ao gatilho. O sintoma seria o
// foco caindo no `<body>` depois de confirmar — sem erro nenhum na tela.

/** Guarda o painel até a abertura e instancia dentro do portal. */
@Directive({
  selector: 'ng-template[ndsAlertDialogContent]',
  standalone: true,
})
export class NdsAlertDialogContent {
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}

@Component({
  selector: 'nds-alert-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxDialogPortal, RdxDialogBackdrop, RdxDialogPopup, NgTemplateOutlet],
  providers: [
    // O perfil do componente, não configuração. `forcePointerDismissalDisabled`
    // desliga só a dispensa por clique fora e por perda de foco — o Escape
    // segue fechando, de propósito.
    provideRdxDialogVariant({
      role: 'alertdialog',
      forceModal: true,
      forcePointerDismissalDisabled: true,
    }),
  ],
  hostDirectives: [
    {
      directive: RdxDialogRoot,
      // `modal` e `disablePointerDismissal` NÃO entram: a variante acima os
      // fixa, e expor um input que não muda nada seria mentir na tabela de
      // propriedades.
      inputs: ['open', 'defaultOpen'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    '[attr.data-slot]': '"alert-dialog"',
  },
  template: `
    <!-- Uma ng-content só: o que aparece na página é o gatilho. O ng-template
         do painel passa por aqui e não deixa nó nenhum. -->
    <ng-content />

    <ng-template rdxDialogPortal>
      <div
        rdxDialogBackdrop
        class="nds-alert-dialog-overlay"
        data-slot="alert-dialog-overlay"
        [attr.data-state]="estado()"
      ></div>

      <div
        rdxDialogPopup
        class="nds-alert-dialog-content"
        data-slot="alert-dialog-content"
        [attr.data-state]="estado()"
      >
        <ng-container [ngTemplateOutlet]="painel()!.tpl" />
      </div>
    </ng-template>
  `,
})
export class NdsAlertDialog {
  protected readonly painel = contentChild.required(NdsAlertDialogContent);

  private readonly raiz = injectRdxDialogRootContext();

  /**
   * `data-state` para o contrato de markup das outras stacks e para a tabela de
   * estados do conteúdo. O par `data-open`/`data-closed` que o CSS lê continua
   * vindo do primitivo — este atributo é adição, não substituição.
   */
  protected readonly estado = computed(() => (this.raiz.isOpen() ? 'open' : 'closed'));
}

/** Abre o diálogo. Compõe com `ndsButton` no mesmo elemento. */
@Directive({
  selector: 'button[ndsAlertDialogTrigger]',
  standalone: true,
  hostDirectives: [{ directive: RdxDialogTrigger, inputs: ['id', 'payload', 'disabled'] }],
})
export class NdsAlertDialogTrigger {}

@Directive({
  selector: 'div[ndsAlertDialogHeader]',
  standalone: true,
  host: {
    class: 'nds-alert-dialog-header',
    '[attr.data-slot]': '"alert-dialog-header"',
  },
})
export class NdsAlertDialogHeader {}

/**
 * Bloco de ícone acima do título.
 *
 * `aria-hidden` porque o ícone repete o que o título já diz — e num
 * `alertdialog` o título é lido de imediato. Um ícone anunciado ali seria a
 * terceira voz na mesma frase.
 */
@Directive({
  selector: 'div[ndsAlertDialogMedia]',
  standalone: true,
  host: {
    class: 'nds-alert-dialog-media',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"alert-dialog-media"',
  },
})
export class NdsAlertDialogMedia {}

/** Título — obrigatório. É a fonte do `aria-labelledby`. */
@Directive({
  selector: 'h2[ndsAlertDialogTitle], h3[ndsAlertDialogTitle]',
  standalone: true,
  hostDirectives: [RdxDialogTitle],
  host: {
    class: 'nds-alert-dialog-title',
    '[attr.data-slot]': '"alert-dialog-title"',
  },
})
export class NdsAlertDialogTitle {}

/**
 * Descrição — opcional, e fortemente recomendada.
 *
 * `role="alertdialog"` faz o leitor de tela ler a descrição junto do título na
 * abertura: é ela que diz o que a confirmação custa. Sem ela, a pessoa ouve
 * "Excluir conta" e dois botões, sem saber o que se perde — por isso omiti-la
 * só se justifica quando o próprio título já diz.
 *
 * Omitir é seguro: o primitivo só emite `aria-describedby` quando esta diretiva
 * registra um id, então o painel fica sem o atributo em vez de apontar para um
 * alvo inexistente. É o mesmo comportamento das outras quatro stacks.
 */
@Directive({
  selector: 'p[ndsAlertDialogDescription]',
  standalone: true,
  hostDirectives: [RdxDialogDescription],
  host: {
    class: 'nds-alert-dialog-description',
    '[attr.data-slot]': '"alert-dialog-description"',
  },
})
export class NdsAlertDialogDescription {}

@Directive({
  selector: 'div[ndsAlertDialogFooter]',
  standalone: true,
  host: {
    class: 'nds-alert-dialog-footer',
    '[attr.data-slot]': '"alert-dialog-footer"',
  },
})
export class NdsAlertDialogFooter {}

/**
 * Sai sem fazer nada. Vem ANTES da ação no DOM, e isso não é ordem visual: é
 * onde o foco pousa ao abrir. Num diálogo de destruição, a tecla Enter apertada
 * por reflexo tem que cair na saída segura.
 */
@Directive({
  selector: 'button[ndsAlertDialogCancel]',
  standalone: true,
  hostDirectives: [RdxDialogClose],
  host: { '[attr.data-slot]': '"alert-dialog-cancel"' },
})
export class NdsAlertDialogCancel {}

/**
 * Confirma e fecha.
 *
 * Também compõe `RdxDialogClose`: a ação de quem consome roda no `(click)` do
 * próprio elemento, e o fechamento vem do primitivo. Nenhum `(click)` é
 * declarado neste host — listener de host corre DEPOIS do de quem consome
 * (armadilha 10), então declarar um aqui não daria ordem garantida.
 */
@Directive({
  selector: 'button[ndsAlertDialogAction]',
  standalone: true,
  hostDirectives: [RdxDialogClose],
  host: { '[attr.data-slot]': '"alert-dialog-action"' },
})
export class NdsAlertDialogAction {}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_ALERT_DIALOG = [
  NdsAlertDialog, NdsAlertDialogContent, NdsAlertDialogTrigger, NdsAlertDialogHeader,
  NdsAlertDialogMedia, NdsAlertDialogTitle, NdsAlertDialogDescription, NdsAlertDialogFooter,
  NdsAlertDialogCancel, NdsAlertDialogAction,
] as const;
