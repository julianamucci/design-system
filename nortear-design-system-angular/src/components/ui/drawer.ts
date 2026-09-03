import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  output,
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
import { cn } from '@/lib/utils';
import { attachDrawerSwipe, type DrawerSwipeDirection } from '@shared/primitives/drawer-swipe';

// ─── Drawer ───────────────────────────────────────────────────────────────────
//
// Painel que entra por uma borda da tela, com alça visível na direção padrão
// (de baixo). Visual inteiro em classes .nds-drawer-*, de
// `docs/shared/styles/nds/drawer.css`, mais véu, título e descrição, que vêm de
// `sheet.css` e são compartilhados com o Sheet.
//
// ─── Por que compõe o Dialog do Radix NG ──────────────────────────────────────
//
// A decisão é a mesma do Sheet, e pela mesma razão: a parte difícil de um
// painel modal não é o CSS. O primitivo de Dialog entrega, e escreve-se errado
// à mão:
//
//   · `role="dialog"` + `aria-modal="true"` no painel;
//   · `aria-labelledby` / `aria-describedby` apontando para os ids REAIS do
//     título e da descrição — as diretivas registram o próprio id no contexto
//     da raiz, então o painel nunca aponta para um id inexistente;
//   · foco preso enquanto aberto e devolvido ao gatilho ao fechar;
//   · Escape e clique fora fecham, do diálogo mais profundo para fora;
//   · trava de rolagem e `inert` nos irmãos enquanto modal;
//   · portal para o `document.body`, desmontando só depois da transição de saída.
//
// O que o primitivo NÃO entrega é `data-state="open|closed"`: o Radix NG segue
// a convenção do Base UI (`data-open` / `data-closed`). Emitimos os dois — o par
// do primitivo, que o CSS lê, e o `data-state`, que o conteúdo compartilhado
// documenta na tabela de estados.
//
// ─── Por que o atributo se chama `data-vaul-drawer-direction` ─────────────────
//
// Não é invenção nem homenagem: é o seletor que o CSS COMPARTILHADO usa. Toda
// regra de posição, borda e canto arredondado do painel mora em
// `.nds-drawer-content[data-vaul-drawer-direction="…"]`, e o próprio conteúdo
// compartilhado cobra o atributo no critério de teste `functional.item5`
// ("Painel entra pela direita com data-vaul-drawer-direction=right"). O nome
// nasceu da lib que as stacks de React/Vue/Svelte usam; aqui ele é apenas o
// contrato de markup que o design system publicou. Emitir outro nome (ou criar
// uma classe `.nds-drawer-right`) deixaria o painel sem posição nenhuma.
//
// ─── Decisão de acessibilidade (bloco canônico no drawer da stack vanilla) ───
//
// Foco preso enquanto o painel existe, `role="dialog"` com nome vindo do
// título, `aria-modal` só no modo modal, Escape e clique no véu fechando, foco
// de volta ao gatilho, rolagem da página travada enquanto modal, corpo rolável
// com `tabindex="0"` e `role="group"` só quando nomeado, e NENHUMA região viva.
//
// O mecanismo desta stack: tudo isso vem do Dialog do primitivo, listado logo
// acima — inclusive o `aria-modal`, que aqui NÃO precisa ser escrito à mão.
//
// Diverge do Sheet em quatro pontos deliberados: existe gesto de arraste (o
// Sheet não tem em stack nenhuma), existe alça decorativa, NÃO existe botão de
// fechar próprio (a saída visível é a do rodapé), e a largura sai de
// `--drawer-width`/`--drawer-max-width` em vez dos tokens do Sheet.
//
// ─── O gesto de arrastar, e por que ele é escrito à mão ──────────────────────
//
// O arraste existe nas cinco stacks. Aqui o motor é
// `@shared/primitives/drawer-swipe`, escrito com eventos de ponteiro a partir da
// leitura da lib de gaveta que as outras três usam — mesmos limiares, mesma
// curva de resistência, mesma guarda de rolagem.
//
// O `@radix-ng/primitives` 1.1.2 TEM um subpacote `drawer` (não aparece como
// diretório: está no mapa de `exports` do pacote, em `fesm2022`), com o gesto
// pronto, pontos de parada e tratamento de teclado virtual. Ele NÃO foi adotado
// nesta rodada, e a razão não é "dependência nova" — o pacote já está instalado:
//
//   · ele é headless de verdade. Publica `--drawer-swipe-movement-x/-y`,
//     `--drawer-swipe-strength` e `[data-swiping]` e não aplica transform
//     nenhum; quem desenha o movimento é o CSS de quem consome. O CSS
//     compartilhado teria de ganhar um `transform` lendo essas variáveis, e
//     esse `transform` alcançaria as outras quatro stacks, onde ele não tem
//     origem — mexer no repouso das cinco para ligar o gesto de uma;
//   · trocar `RdxDialog*` por `RdxDrawer*` refaz a fundação inteira deste
//     componente (raiz, portal, backdrop, popup, título, descrição, fechador) —
//     mudança de arquitetura, não de comportamento, e decisão da dona;
//   · o único portão que exerceria qualquer uma das duas versões é a suíte de
//     navegador, que não roda nesta rodada.
//
// Fica registrado como recomendação: quando a suíte voltar a rodar, o subpacote
// é o caminho natural desta stack, e o que ele acrescenta sobre o motor à mão é
// ponto de parada e teclado virtual — capacidades que, se entrarem, precisam de
// caminho alternativo próprio (WCAG 2.5.7), porque nenhuma delas é coberta por
// Escape, véu ou botão.
//
// ─── WCAG 2.5.7 (Dragging Movements) ─────────────────────────────────────────
//
// O gesto só DISPENSA, e dispensar tem três caminhos sem trajeto: Escape,
// clique no overlay e o botão de saída do rodapé. Enquanto o arraste não
// existia, o critério era atendido por ausência; agora é atendido por
// cobertura. A alça segue `aria-hidden` e sem foco: o arraste vale no painel
// inteiro e não nela, então foco ali seria parada de tabulação sem função.

/** Borda por onde o painel entra. */
export type DrawerDirection = 'bottom' | 'top' | 'left' | 'right';

/** Caminho que fechou o painel — o vocabulário que o analytics do produto usa. */
export type DrawerCloseReason = 'escape' | 'overlay' | 'close-button' | 'action';

/**
 * Traduz o motivo do primitivo para o vocabulário do design system.
 *
 * Função pura e exportada de propósito: o evento `drawer_close` nasce na camada
 * de produto (docs page, app), nunca aqui dentro — primitivo de UI que importa
 * `@/lib/analytics` é o que a regra `analytics_in_ui_primitive` proíbe.
 *
 * Duplica a lógica do Sheet em vez de importá-la: um primitivo de overlay que
 * importa outro só para reaproveitar um `switch` amarra os dois para sempre, e
 * o nome "sheet" vazaria para dentro do Drawer.
 */
export function drawerCloseReason(motivo: RdxDialogOpenChangeReason): DrawerCloseReason {
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
 * `<ng-template>` e não elemento: o painel é criado dentro do portal, e este é
 * o único jeito de o conteúdo escrito por quem consome atravessar para lá sem
 * perder o contexto de binding do componente que o declarou. O
 * `rdxDialogPortal` é diretiva estrutural e o portal precisa de dois nós raiz
 * (overlay + painel), então não há elemento hospedeiro para projetar.
 *
 * `panelClass` é a única exceção à regra "nunca criar input de classe" neste
 * stack, e a exceção tem causa: a regra existe porque o Angular já mescla a
 * classe que quem consome escreve NO ELEMENTO. Aqui não há elemento — quem
 * constrói o painel é este componente, dentro do portal.
 */
@Directive({
  selector: 'ng-template[ndsDrawerContent]',
  standalone: true,
})
export class NdsDrawerContent {
  /** O próprio template — instanciado pelo `ngTemplateOutlet` dentro do portal. */
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);

  /** Classes .nds-* extras no painel. */
  readonly panelClass = input('');
}

/**
 * Instala o arraste para dispensar no painel.
 *
 * Diretiva, e não `(pointerdown)` no template, por dois motivos medidos:
 *
 *   · o motor compartilhado instala e solta os próprios ouvintes, e uma
 *     diretiva tem exatamente o ciclo de vida do painel — nasce quando o portal
 *     cria a view e morre quando ele a destrói. Com bindings de template os
 *     ouvintes seriam de Angular e os do motor ficariam sem quem os soltasse;
 *   · a carência de 500 ms depois da abertura, que o motor conta a partir da
 *     própria construção, precisa começar quando o painel aparece. É a mesma
 *     janela em que a lib de gaveta recusa arrastar: o painel ainda está
 *     deslizando para dentro, e ali todo movimento é rolagem.
 *
 * Nada aqui roda dentro do ciclo de detecção do Angular: o motor escreve
 * `transform` e `data-swiping` direto no elemento a cada quadro, que é o que
 * mantém o painel colado no ponteiro.
 */
@Directive({
  selector: '[ndsDrawerSwipe]',
  standalone: true,
})
export class NdsDrawerSwipe {
  /** Borda de entrada — e, portanto, o eixo da dispensa. */
  readonly direction = input<DrawerSwipeDirection>('bottom', { alias: 'ndsDrawerSwipe' });

  /** Painel não dispensável não arrasta, como na lib. */
  readonly dismissible = input(true, { alias: 'ndsDrawerSwipeDismissible' });

  /** Soltar o painel resolveu por dispensar. */
  readonly swipeDismiss = output<void>();

  constructor() {
    const panel = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const engine = attachDrawerSwipe({
      panel: panel,
      // Funções, e não valores: a direção e o `dismissible` são lidos no
      // instante do gesto, então trocá-los com o painel aberto vale já no
      // próximo arraste.
      direction: () => this.direction(),
      dismissible: () => this.dismissible(),
      onDismiss: () => this.swipeDismiss.emit(),
    });
    inject(DestroyRef).onDestroy(() => engine.destroy());
  }
}

/**
 * Raiz do Drawer.
 *
 * `direction` mora AQUI, e não no conteúdo, porque é assim que o conteúdo
 * compartilhado documenta a prop (`props.table.direction`) e é a forma que o
 * snippet de extensibilidade publica. É input próprio deste componente: o
 * atributo que o CSS lê é escrito no painel, que este componente constrói.
 *
 * `open` é model do primitivo, então `[(open)]` funciona; `defaultOpen` cobre o
 * modo não-controlado. `modal` fica exposto porque decide três coisas de uma vez
 * (foco preso, rolagem travada, ponteiro bloqueado fora).
 *
 * `disablePointerDismissal` é o mais perto que o primitivo chega do
 * `dismissible` que o conteúdo compartilhado descreve — e a diferença é
 * deliberada: ele desliga o fechamento por clique fora e por perda de foco, mas
 * Escape continua fechando. Um painel modal que engole Escape é armadilha de
 * teclado (WCAG 2.1.2), então o caminho por teclado nunca sai.
 *
 * `triggerId` / `defaultTriggerId` / `handle` ficam FORA da lista: servem ao
 * caso de gatilho destacado, que este design system não documenta.
 */
@Component({
  selector: 'nds-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // O visual inteiro vem de @shared/styles/nds/sheet.css, que é global.
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, RdxDialogPortal, RdxDialogBackdrop, RdxDialogPopup, NdsDrawerSwipe],
  hostDirectives: [
    {
      directive: RdxDialogRoot,
      inputs: ['open', 'defaultOpen', 'modal', 'disablePointerDismissal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    '[attr.data-slot]': '"drawer"',
  },
  template: `
    <ng-content />

    @if (content(); as c) {
      <ng-template rdxDialogPortal>
        <!-- O overlay do Drawer é o mesmo do Sheet, por decisão do CSS
             compartilhado: .nds-drawer-* só define painel, alça, cabeçalho e
             rodapé, e o cabeçalho do arquivo diz que overlay, título e descrição
             são reusados. -->
        <div
          rdxDialogBackdrop
          class="nds-sheet-overlay"
          data-slot="drawer-overlay"
          [attr.data-state]="state()"
        ></div>

        <div
          rdxDialogPopup
          [class]="classeDoPainel()"
          data-slot="drawer-content"
          [attr.data-vaul-drawer-direction]="direction()"
          [attr.data-state]="state()"
          [ndsDrawerSwipe]="direction()"
          [ndsDrawerSwipeDismissible]="swipeEnabled()"
          (swipeDismiss)="dismissBySwipe()"
        >
          <!-- Alça: pura afordância. O CSS só a mostra na direção de baixo, e
               ela não recebe foco nem nome — o arraste vale no painel inteiro,
               não nela, então foco aqui seria parada de tabulação sem função. -->
          <div class="nds-drawer-handle" aria-hidden="true"></div>

          <ng-container [ngTemplateOutlet]="c.tpl" />
        </div>
      </ng-template>
    }
  `,
})
export class NdsDrawer {
  /**
   * A raiz do Dialog aplicada como host directive. Injetável daqui porque host
   * directive vive no injector de elemento do próprio componente.
   */
  private readonly root = inject(RdxDialogRoot);

  readonly direction = input<DrawerDirection>('bottom');

  protected readonly content = contentChild(NdsDrawerContent, { descendants: true });

  /**
   * `data-state` para as outras stacks e para a tabela de estados do conteúdo
   * compartilhado. O par `data-open` / `data-closed` que o primitivo escreve
   * continua lá — este atributo é adição, não substituição.
   */
  protected readonly state = computed(() => (this.root.open() ? 'open' : 'closed'));

  protected readonly classeDoPainel = computed(() =>
    cn('nds-drawer-content', this.content()?.panelClass()),
  );

  /**
   * O painel pode ser arrastado para fora?
   *
   * Sai de `disablePointerDismissal`, que é o input que o conteúdo compartilhado
   * documenta como `dismissible` — e a leitura é a certa: arrastar é gesto de
   * PONTEIRO, exatamente o que aquele input desliga. Escape continua fechando de
   * qualquer forma, porque diálogo modal que engole Escape é armadilha de
   * teclado (WCAG 2.1.2).
   */
  protected readonly swipeEnabled = computed(() => !this.root.disablePointerDismissal());

  /**
   * Soltar o painel para fora da tela fecha.
   *
   * Fecha pelo model do primitivo, e não por um caminho próprio: assim o
   * fechamento passa pelo mesmo desmonte, pela mesma devolução de foco ao
   * gatilho e pela mesma transição de saída que Escape e véu já usam. O motivo
   * que chega em `onOpenChange` é o de fechamento por código — `drawerCloseReason`
   * o traduz para `'action'`. É divergência de API de framework em relação à
   * stack de referência, que informa `'overlay'`: registrada, não "alinhada",
   * porque aqui o vocabulário do motivo é do primitivo, não nosso.
   */
  protected dismissBySwipe(): void {
    this.root.open.set(false);
  }

  constructor() {
    // Painel modal sem nome acessível é o defeito silencioso deste componente:
    // o leitor de tela anuncia "diálogo" e nada mais, e nenhum teste de render
    // percebe. O primitivo só escreve `aria-labelledby` quando existe um
    // `ndsDrawerTitle` registrado — sem título visível, use um com .nds-sr-only.
    effect(() => {
      if (!isDevMode()) return;
      if (!this.root.open()) return;
      // A checagem é adiada de propósito. O `ndsDrawerTitle` registra o próprio
      // id no construtor, e o construtor só roda quando o portal cria a view do
      // painel — um passo DEPOIS de `open` virar true. Avaliar aqui dentro
      // acusaria todo painel correto no instante da abertura.
      setTimeout(() => {
        if (untracked(this.root.open) && !untracked(this.root.titleId)) {
          console.warn(
            '[nds-drawer] painel aberto sem ndsDrawerTitle: o diálogo fica sem nome ' +
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
 */
@Directive({
  selector: 'button[ndsDrawerTrigger]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxDialogTrigger,
      inputs: ['id', 'payload'],
    },
  ],
  host: {
    '[attr.data-slot]': '"drawer-trigger"',
  },
})
export class NdsDrawerTrigger {}

/**
 * Cabeçalho do painel — título e descrição.
 *
 * Diretiva, não componente: só acrescenta classe e `data-slot` a um `<div>` que
 * quem consome já escreveu.
 */
@Directive({
  selector: 'div[ndsDrawerHeader]',
  standalone: true,
  host: {
    class: 'nds-drawer-header',
    '[attr.data-slot]': '"drawer-header"',
  },
})
export class NdsDrawerHeader {}

/**
 * Título acessível.
 *
 * A classe é `nds-sheet-title` de propósito, não descuido: o CSS compartilhado
 * declara, no cabeçalho do bloco do Drawer, que o painel "reusa
 * nds-sheet-overlay/-title/-description". Não existe `.nds-drawer-title` — usar
 * o nome que "parece certo" pintaria nada.
 *
 * Seletor restrito a cabeçalho porque o título de um diálogo é cabeçalho de
 * verdade; o nível certo depende do que existe na página em volta.
 */
@Directive({
  selector: 'h2[ndsDrawerTitle], h3[ndsDrawerTitle]',
  standalone: true,
  hostDirectives: [RdxDialogTitle],
  host: {
    class: 'nds-sheet-title',
    '[attr.data-slot]': '"drawer-title"',
  },
})
export class NdsDrawerTitle {}

/**
 * Descrição acessível — vira o `aria-describedby` do painel pelo mesmo caminho
 * do título. Mesma reutilização de classe explicada em `NdsDrawerTitle`.
 */
@Directive({
  selector: 'p[ndsDrawerDescription]',
  standalone: true,
  hostDirectives: [RdxDialogDescription],
  host: {
    class: 'nds-sheet-description',
    '[attr.data-slot]': '"drawer-description"',
  },
})
export class NdsDrawerDescription {}

/**
 * Corpo rolável do painel.
 *
 * A classe é `.nds-drawer-body`, do CSS compartilhado — a mesma das outras
 * quatro stacks. O docblock anterior dizia que essa classe NÃO existia e por
 * isso montava o corpo com utilitárias (`nds-overflow-y nds-px-4`); a afirmação
 * ficou velha quando a folha ganhou a regra, e nenhum portão vê classe que
 * deixou de ser necessária. As utilitárias chegavam perto e não eram iguais:
 * faltava o `flex: 1 1 auto`, que é o que faz o corpo contribuir com a altura
 * do conteúdo para o painel — sem ele, o teto de 80% da altura da tela não
 * chega a apertar ninguém.
 *
 * `min-height: 0` (e o `overflow` diferente de `visible`) é o que deixa o item
 * encolher em coluna flex, cedendo altura em vez de esticar o painel. E
 * `.nds-drawer-footer` tem `margin-top: auto`, que segura o rodapé embaixo
 * enquanto o corpo rola.
 *
 * `tabindex="0"` estático: região rolável precisa ser alcançável por teclado
 * (WCAG 2.1.1 — regra `scrollable-region-focusable` do axe).
 */
@Directive({
  selector: 'div[ndsDrawerBody]',
  standalone: true,
  host: {
    class: 'nds-drawer-body',
    tabindex: '0',
    '[attr.data-slot]': '"drawer-body"',
    '[attr.role]': 'ariaLabel() ? "group" : null',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class NdsDrawerBody {
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

/** Rodapé de ações — cancelar e ação primária. */
@Directive({
  selector: 'div[ndsDrawerFooter]',
  standalone: true,
  host: {
    class: 'nds-drawer-footer',
    '[attr.data-slot]': '"drawer-footer"',
  },
})
export class NdsDrawerFooter {}

/**
 * Botão que fecha o painel — o "Cancelar" do rodapé, tipicamente.
 *
 * Sem `data-slot` próprio, de propósito. O elemento que esta diretiva decora é,
 * quase sempre, também um `ndsButton`, e o `NdsButton` liga
 * `[attr.data-slot]="button"` no host. Duas diretivas ligando o MESMO atributo
 * não têm vencedor definido: quem roda por último ganha, e a ordem depende de
 * como as diretivas casaram. O slot do elemento fica sendo `button`, que é o que
 * ele é; o que o marca como fechador é a diretiva. Em teste, procure pelo nome
 * acessível do botão, não pelo `data-slot`.
 */
@Directive({
  selector: 'button[ndsDrawerClose]',
  standalone: true,
  hostDirectives: [RdxDialogClose],
})
export class NdsDrawerClose {}

/** As peças todas — conveniência para o `imports` de quem compõe. */
export const NDS_DRAWER = [
  NdsDrawer,
  NdsDrawerTrigger,
  NdsDrawerContent,
  NdsDrawerHeader,
  NdsDrawerTitle,
  NdsDrawerDescription,
  NdsDrawerBody,
  NdsDrawerFooter,
  NdsDrawerClose,
] as const;
