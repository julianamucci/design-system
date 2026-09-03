import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import {
  RdxDialogRoot,
  RdxDialogTrigger,
  RdxDialogPortal,
  RdxDialogBackdrop,
  RdxDialogPopup,
  RdxDialogTitle,
  RdxDialogDescription,
  RdxDialogClose,
  injectRdxDialogRootContext,
} from '@radix-ng/primitives/dialog';
import { NdsButton } from './button';

// ─── Dialog ───────────────────────────────────────────────────────────────────
//
// Visual: classes `.nds-dialog-*` (docs/shared/styles/nds/dialog.css). O markup
// é o do Vanilla — referência cross-stack: um `<div data-slot="dialog">` em
// volta do gatilho, e overlay + painel renderizados no `<body>`.
//
// COM os primitivos do Radix NG, porque o que eles entregam aqui é justamente a
// parte que se escreve errado à mão — e que o `createDialog` do Vanilla teve de
// reimplementar linha a linha:
//
//   · `role="dialog"` + `aria-modal="true"` no painel;
//   · `aria-labelledby` / `aria-describedby` ligados aos ids REAIS do título e
//     da descrição, e só enquanto esses elementos existem (descrição ausente =
//     atributo ausente, não id órfão, que o axe reprova por
//     `aria-valid-attr-value`);
//   · foco preso no painel (Tab e Shift+Tab não saem) e devolvido ao gatilho no
//     fechamento;
//   · Escape e clique fora fechando, com a ordem certa quando há diálogos
//     aninhados (o mais profundo primeiro);
//   · trava de rolagem do body e `inert` no resto da página enquanto modal;
//   · o painel montado até a animação de saída terminar — sem isso o
//     fechamento não teria o que animar.
//
// ─── O que o separa do AlertDialog ────────────────────────────────────────────
//
// O bloco canônico da decisão de acessibilidade da família (dez itens, medidos
// na fonte das cinco libs) está no cabeçalho do `dialog.ts` do Vanilla.
//
// Papel: `dialog` aqui, `alertdialog` lá — o leitor de tela anuncia o
// segundo com urgência e lê a descrição junto do título.
//
// Dispensa: aqui o clique no véu FECHA; no AlertDialog não fecha. Lá isso não é
// input público, é o perfil do componente, fixado na construção por
// `provideRdxDialogVariant({ forcePointerDismissalDisabled: true })` — ninguém
// que consome consegue afrouxar por engano.
//
// Escape: fecha NOS DOIS, e no AlertDialog equivale a cancelar.
//
// O que os primitivos NÃO entregam é `data-state="open|closed"`: o Radix NG
// segue a convenção do Base UI (`data-open` / `data-closed`) e as outras quatro
// stacks emitem `data-state`. O CSS compartilhado aceita as duas formas, mas
// paridade de markup é o que a auditoria cross-stack compara — então o overlay
// e o painel emitem `data-state` também, exatamente como o Vanilla.
//
// Anatomia (a família inteira é escrita pelo call site, como no Vanilla):
//
//   <div ndsDialog>
//     <button ndsDialogTrigger ndsButton>Editar perfil</button>
//
//     <ng-template ndsDialogPortal>
//       <div ndsDialogOverlay></div>
//       <div ndsDialogContent>
//         <div ndsDialogHeader>
//           <h2 ndsDialogTitle>Editar perfil</h2>
//           <p ndsDialogDescription>…</p>
//         </div>
//         <div ndsDialogBody>…</div>
//         <div ndsDialogFooter>…</div>
//       </div>
//     </ng-template>
//   </div>
//
// O portal é `<ng-template>` porque o diálogo tem DOIS nós raiz (overlay e
// painel) e o primitivo exige a forma estrutural para teleportar os dois.

// ─── NdsDialog ────────────────────────────────────────────────────────────────

/**
 * Raiz do Dialog.
 *
 * `@Directive` e seletor de atributo num `<div>`: a raiz não desenha nada — ela
 * só guarda estado e serve de âncora de injeção. Um `@Component` com
 * `<ng-content />` criaria view e ciclo de detecção para renderizar nada, e um
 * elemento `<nds-dialog>` divergiria do `<div data-slot="dialog">` do Vanilla.
 *
 * `open` é model do primitivo, então `[(open)]` funciona; `defaultOpen` cobre o
 * modo não-controlado.
 *
 * `modal` fica exposto porque é ele que decide se há trava de rolagem e `inert`
 * no resto da página. `disablePointerDismissal` desliga o fechamento por clique
 * fora (Escape continua fechando) — é o que separa este Dialog de um
 * AlertDialog sem trocar de componente.
 */
@Directive({
  selector: 'div[ndsDialog]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxDialogRoot,
      inputs: ['open', 'defaultOpen', 'modal', 'disablePointerDismissal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    '[attr.data-slot]': '"dialog"',
  },
})
export class NdsDialog {}

// ─── NdsDialogTrigger ─────────────────────────────────────────────────────────

/**
 * Botão que abre o diálogo.
 *
 * `disabled` É exposto, ao contrário do que o Collapsible faz. A razão é o
 * oposto da de lá: `RdxDialogTrigger` e `RdxButtonDirective` (que vem junto do
 * `ndsButton`) ligam os DOIS o atributo `disabled` do host. Se só um recebesse
 * o valor, o outro escreveria `undefined` e — dependendo da ordem em que as
 * diretivas casaram — apagaria o atributo que o primeiro acabou de pôr, sem
 * erro nenhum. Expondo o input aqui, um único `[disabled]` alimenta os dois e
 * eles concordam.
 *
 * `id` e `payload` seguem expostos porque são a forma de identificar QUAL
 * gatilho abriu um diálogo com vários gatilhos.
 */
@Directive({
  selector: 'button[ndsDialogTrigger]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxDialogTrigger,
      inputs: ['id', 'payload', 'disabled'],
    },
  ],
  host: {
    '[attr.data-slot]': '"dialog-trigger"',
  },
})
export class NdsDialogTrigger {}

// ─── NdsDialogPortal ──────────────────────────────────────────────────────────

/**
 * Teleporta overlay + painel para fora da árvore do pai (por padrão o `<body>`).
 *
 * Estrutural de propósito: o conteúdo do diálogo não deve existir no DOM
 * enquanto ele está fechado, e o primitivo mantém a view montada até a animação
 * de saída terminar. `container` troca o destino do teleporte.
 *
 * O portal é o que isola o painel de `overflow: hidden` e de `transform` de
 * qualquer ancestral — sem ele, um diálogo dentro de um card com `overflow`
 * seria recortado.
 */
@Directive({
  selector: 'ng-template[ndsDialogPortal]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxDialogPortal,
      inputs: ['container'],
    },
  ],
})
export class NdsDialogPortal {}

// ─── NdsDialogOverlay ─────────────────────────────────────────────────────────

/**
 * Backdrop translúcido atrás do painel.
 *
 * Na ROTA A (padrão) é irmão do painel, nunca pai: `.nds-dialog-content` é
 * posicionado e cria contexto de empilhamento próprio, então um overlay
 * aninhado pintaria POR CIMA do fundo do painel — e o clique nele contaria como
 * "dentro", desligando o fechamento por clique fora.
 *
 * Na ROTA B a relação se INVERTE, e é o que o par `scroll` exige: o overlay
 * vira a área de rolagem e o painel entra no fluxo DELE, como filho. Medido
 * contra a folha compartilhada: com os dois como irmãos, o overlay não tem o
 * que rolar (`scrollHeight === clientHeight`) e a rota não acontece — a classe
 * chega e não pinta. Aninhar é do call site, e por isso está no snippet e na
 * story, não aqui.
 *
 * `scroll` troca o overlay para o modo rolável: ele vira a área de rolagem e o
 * painel entra no fluxo, para conteúdo mais alto que a janela. As duas rotas
 * estão descritas no docblock de `NdsDialogContent`.
 */
@Directive({
  selector: 'div[ndsDialogOverlay]',
  standalone: true,
  hostDirectives: [RdxDialogBackdrop],
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"dialog-overlay"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsDialogOverlay {
  /** Rola a página inteira do diálogo em vez de centralizar o painel. */
  readonly scroll = input(false, { transform: booleanAttribute });

  private readonly root = injectRdxDialogRootContext();

  protected readonly state = computed(() => (this.root.isOpen() ? 'open' : 'closed'));

  protected readonly hostClass = computed(() =>
    ['nds-dialog-overlay', this.scroll() ? 'nds-dialog-overlay-scroll' : '']
      .filter(Boolean)
      .join(' '),
  );
}

// ─── NdsDialogContent ─────────────────────────────────────────────────────────

/**
 * Painel modal.
 *
 * Este é o único `@Component` da família, e por um motivo só: o botão de fechar
 * do canto. Ele é parte do componente (o conteúdo compartilhado documenta
 * `showCloseButton`), não do call site — repetir seis linhas de SVG em toda
 * página é como o "X" some quando alguém esquece.
 *
 * Seletor de atributo num `<div>`: o host É o painel, então o CSS
 * `.nds-dialog-content` casa sem wrapper e o markup fica igual ao do Vanilla.
 *
 * Uma `<ng-content />` só, fora de qualquer `@if`: dois destinos de projeção em
 * ramos de um `@if` não entregam conteúdo a nenhum dos dois (a projeção é
 * resolvida em tempo de compilação, antes de existir ramo ativo).
 */
@Component({
  selector: 'div[ndsDialogContent]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxDialogClose],
  hostDirectives: [
    {
      directive: RdxDialogPopup,
      outputs: [
        'escapeKeyDown',
        'pointerDownOutside',
        'focusOutside',
        'interactOutside',
        'openAutoFocus',
        'closeAutoFocus',
      ],
    },
  ],
  host: {
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"dialog-content"',
    '[attr.data-state]': 'state()',
  },
  template: `
    <ng-content />

    @if (showCloseButton()) {
      <!--
        Botão puro com .nds-dialog-close, não um ndsButton ghost.

        É o markup do Vanilla, que é a referência: a folha compartilhada já
        posiciona, dimensiona o ícone e desenha o anel de foco desta classe.
        Compor com o botão do design system também custaria o data-slot — o
        NdsButton liga [attr.data-slot]="button" no host, e duas diretivas
        disputando o mesmo atributo não têm vencedor definido. Aqui o slot é
        dialog-close em todas as stacks, sem disputa.

        O SVG é desenhado à mão porque o ícone é decorativo e o nome acessível
        vem do texto ao lado — repetir o ícone no leitor de tela seria ruído.
      -->
      <button type="button" class="nds-dialog-close" data-slot="dialog-close" rdxDialogClose>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <span class="nds-sr-only">{{ closeLabel() }}</span>
      </button>
    }
  `,
})
export class NdsDialogContent {
  /** Botão X no canto superior direito. */
  readonly showCloseButton = input(true, { transform: booleanAttribute });

  /**
   * Nome acessível do botão X. Vai num `<span class="nds-sr-only">` e não num
   * `aria-label`: é o mecanismo que o conteúdo compartilhado documenta, e texto
   * real sobrevive à tradução automática da página, que ignora `aria-label`.
   */
  readonly closeLabel = input('Fechar');

  /**
   * ROTA B — par do `scroll` do overlay: tira o painel do centro fixo e o põe
   * no fluxo, e a partir daí quem rola é o overlay. O cabeçalho sobe junto com
   * o conteúdo.
   *
   * Os dois `scroll` andam juntos E o painel tem de estar DENTRO do overlay no
   * template: rolagem de um elemento só alcança o que está dentro dele. Com os
   * dois como irmãos as classes chegam e não produzem rolagem nenhuma.
   *
   * ROTA A, o padrão, é o contrário: o painel fica parado e centralizado, o
   * cabeçalho e o rodapé não saem da tela, e a rolagem acontece dentro do corpo
   * — quem compõe pendura `.nds-dialog-body-scroll` no `div ndsDialogBody`,
   * com `tabindex="0"`, `role="group"` e nome.
   *
   * A FORMA da rota B diverge por stack, e isso é divergência de API de
   * framework: não há fonte de verdade e não se "alinha". Aqui é um par de
   * inputs, porque a composição do overlay e do painel é do template.
   */
  readonly scroll = input(false, { transform: booleanAttribute });

  private readonly root = injectRdxDialogRootContext();

  protected readonly state = computed(() => (this.root.isOpen() ? 'open' : 'closed'));

  protected readonly hostClass = computed(() =>
    ['nds-dialog-content', this.scroll() ? 'nds-dialog-content-scroll' : '']
      .filter(Boolean)
      .join(' '),
  );
}

// ─── Estrutura interna ────────────────────────────────────────────────────────

/**
 * Agrupa título e descrição. Centralizado no estreito, à esquerda a partir de
 * 40rem — a regra mora no CSS compartilhado, não aqui.
 */
@Directive({
  selector: 'div[ndsDialogHeader]',
  standalone: true,
  host: {
    class: 'nds-dialog-header',
    '[attr.data-slot]': '"dialog-header"',
  },
})
export class NdsDialogHeader {}

/**
 * Título — obrigatório, e é dele que sai o `aria-labelledby` do painel.
 *
 * `h2` ou `h3` no seletor: o nível do cabeçalho depende da página que abre o
 * diálogo, e forçar um só quebraria a hierarquia de quem já tem `h2` na tela.
 */
@Directive({
  selector: 'h2[ndsDialogTitle], h3[ndsDialogTitle]',
  standalone: true,
  hostDirectives: [RdxDialogTitle],
  host: {
    class: 'nds-dialog-title',
    '[attr.data-slot]': '"dialog-title"',
  },
})
export class NdsDialogTitle {}

/**
 * Descrição — opcional, e fonte do `aria-describedby` quando existe. Ausente,
 * o primitivo simplesmente não escreve o atributo.
 */
@Directive({
  selector: 'p[ndsDialogDescription]',
  standalone: true,
  hostDirectives: [RdxDialogDescription],
  host: {
    class: 'nds-dialog-description',
    '[attr.data-slot]': '"dialog-description"',
  },
})
export class NdsDialogDescription {}

/**
 * Corpo do diálogo.
 *
 * `.nds-dialog-body` não pinta nada de propósito — o espaçamento entre as
 * partes vem do `gap` do grid de `.nds-dialog-content`, e o conteúdo interno é
 * escolha de quem usa.
 */
@Directive({
  selector: 'div[ndsDialogBody]',
  standalone: true,
  host: {
    class: 'nds-dialog-body',
    '[attr.data-slot]': '"dialog-body"',
  },
})
export class NdsDialogBody {}

/**
 * Rodapé de ações.
 *
 * `@Component` pelo mesmo motivo do Content: `showCloseButton` põe um botão de
 * fechar ABAIXO das ações, e o conteúdo compartilhado documenta essa
 * configuração como uma composição própria.
 *
 * A ordem visual (empilhado no estreito, lado a lado a partir de 40rem, com a
 * ação primária à direita) é `flex-direction: column-reverse` no CSS: no DOM a
 * ação primária vem por último, que é a ordem de leitura e de foco correta.
 */
@Component({
  selector: 'div[ndsDialogFooter]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsButton, RdxDialogClose],
  host: {
    class: 'nds-dialog-footer',
    '[attr.data-slot]': '"dialog-footer"',
  },
  template: `
    <ng-content />

    @if (showCloseButton()) {
      <!--
        Aqui o botão É um ndsButton: no rodapé ele fica lado a lado com as
        ações e precisa da mesma aparência. Por isso também não recebe
        data-slot próprio — o slot do elemento é button, e o que o identifica
        como fechador é o texto e a diretiva.
      -->
      <button rdxDialogClose ndsButton variant="outline">{{ closeLabel() }}</button>
    }
  `,
})
export class NdsDialogFooter {
  /** Botão de fechar dentro do rodapé, abaixo das ações. */
  readonly showCloseButton = input(false, { transform: booleanAttribute });

  /** Rótulo visível do botão de fechar do rodapé. */
  readonly closeLabel = input('Fechar');
}

/**
 * Qualquer botão que feche o diálogo — o "Cancelar" do rodapé, tipicamente.
 *
 * O primitivo já registra o clique e já fixa `type="button"`: sem isso, um
 * Cancelar dentro de `<form>` herdaria `type="submit"` e fechar o diálogo
 * enviaria o formulário.
 *
 * Sem `data-slot` próprio de propósito. O elemento que esta diretiva decora é,
 * quase sempre, também um `ndsButton` — e o `NdsButton` liga
 * `[attr.data-slot]="button"` no host. Duas diretivas ligando o MESMO atributo
 * não têm vencedor definido: quem roda por último ganha, e a ordem depende de
 * como as diretivas casaram. O slot do elemento fica sendo `button`, que é o
 * que ele é; o que o marca como fechador é a diretiva. O único `data-slot`
 * `dialog-close` do sistema é o do X embutido no Content, que não compõe com o
 * botão e por isso não disputa nada.
 */
@Directive({
  selector: 'button[ndsDialogClose]',
  standalone: true,
  hostDirectives: [RdxDialogClose],
})
export class NdsDialogClose {}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_DIALOG = [
  NdsDialog,
  NdsDialogTrigger,
  NdsDialogPortal,
  NdsDialogOverlay,
  NdsDialogContent,
  NdsDialogHeader,
  NdsDialogTitle,
  NdsDialogDescription,
  NdsDialogBody,
  NdsDialogFooter,
  NdsDialogClose,
] as const;
