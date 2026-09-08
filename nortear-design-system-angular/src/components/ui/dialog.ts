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
 * É irmão do painel, nunca pai: `.nds-dialog-content` é posicionado e cria
 * contexto de empilhamento próprio, então um overlay aninhado pintaria POR CIMA
 * do fundo do painel — e o clique nele contaria como "dentro", desligando o
 * fechamento por clique fora.
 *
 * Houve uma segunda rota, em que o painel entrava no fluxo do véu e a PÁGINA é
 * que rolava. Foi retirada em 2026-09-08 (PRD D7): modal que rola junto com a
 * página desfaz a própria promessa de interromper, e duas saídas opostas para o
 * mesmo problema obrigam cada tela a escolher sem critério. Para conteúdo longo
 * ficou uma saída só — quem rola é o CORPO, e cabeçalho e rodapé param.
 */
@Directive({
  selector: 'div[ndsDialogOverlay]',
  standalone: true,
  hostDirectives: [RdxDialogBackdrop],
  host: {
    class: 'nds-dialog-overlay',
    '[attr.data-slot]': '"dialog-overlay"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsDialogOverlay {
  private readonly root = injectRdxDialogRootContext();

  protected readonly state = computed(() => (this.root.isOpen() ? 'open' : 'closed'));
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
 *
 * CONTEÚDO LONGO: o painel fica parado e centralizado, e quem rola é o CORPO —
 * cabeçalho e rodapé não saem da tela. Quem compõe pendura
 * `.nds-dialog-body-scroll` no `div ndsDialogBody`, com `tabindex="0"`,
 * `role="group"` e nome juntos: caixa que rola é parada de teclado (WCAG
 * 2.1.1), parada de teclado precisa de papel, e nome em elemento sem papel é
 * atributo proibido. Não há segunda rota — a de rolar o véu saiu em 2026-09-08
 * (PRD D7).
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
    class: 'nds-dialog-content',
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

  private readonly root = injectRdxDialogRootContext();

  protected readonly state = computed(() => (this.root.isOpen() ? 'open' : 'closed'));
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
 * O seletor cobre os SEIS níveis: o nível do cabeçalho depende da página que
 * abre o painel, e forçar um só quebraria a hierarquia de quem já tem `h2` na
 * tela. Eram só `h2` e `h3` até 2026-09-08 — decisão da dona ao fechar a
 * divergência com as outras quatro stacks, que aceitam qualquer nível pelo
 * mecanismo da própria lib (`render` no base-ui, `as` na reka, `level` no
 * bits) e, no vanilla, pela opção `titleLevel` das fábricas.
 */
@Directive({
  selector: 'h1[ndsDialogTitle], h2[ndsDialogTitle], h3[ndsDialogTitle], h4[ndsDialogTitle], h5[ndsDialogTitle], h6[ndsDialogTitle]',
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
 * `@Component` pelo mesmo motivo do Content: `showCloseButton` acrescenta um
 * botão de fechar como a ação de MENOR ênfase do rodapé, e o conteúdo
 * compartilhado documenta essa configuração como uma composição própria.
 *
 * A ordem visual (empilhado no estreito, lado a lado a partir de 40rem, com a
 * ação primária à direita) é `flex-direction: column-reverse` no CSS: no DOM os
 * secundários vêm primeiro e a ação primária por último, que é a ordem de
 * leitura e de foco correta — e é a regra de "Alinhamento de Grupos de Botões"
 * da guideline 04. Por isso o botão deste rodapé é projetado ANTES do
 * `<ng-content />`: depois dele, o fechar cairia na posição da primária.
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
    @if (showCloseButton()) {
      <!--
        ANTES do ng-content, e a ordem é o assunto: fechar é a ação de MENOR
        ênfase do rodapé, e a folha compartilhada deriva as duas leituras da
        mesma ordem de DOM — column-reverse no estreito põe o primeiro do DOM
        embaixo, row + justify-end no largo o põe à esquerda. Projetado depois
        do conteúdo, este botão ocupava a posição da ação PRIMÁRIA nas duas
        larguras.

        Aqui o botão É um ndsButton: no rodapé ele fica lado a lado com as
        ações e precisa da mesma aparência. Por isso também não recebe
        data-slot próprio — o slot do elemento é button, e o que o identifica
        como fechador é o texto e a diretiva.

        E a variante é ghost: pela tabela de 06-form-components.md, default é a
        ação primária, outline a secundária e ghost a TERCIÁRIA. Fechar é a
        ação menos importante do rodapé — com outline ele saía com o mesmo peso
        do secundário ao lado e a escala de ênfase desaparecia.
      -->
      <button rdxDialogClose ndsButton variant="ghost">{{ closeLabel() }}</button>
    }

    <ng-content />
  `,
})
export class NdsDialogFooter {
  /**
   * Botão de fechar dentro do rodapé, como a ação de MENOR ênfase: abaixo das
   * demais no empilhamento e à esquerda delas quando lado a lado.
   */
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
