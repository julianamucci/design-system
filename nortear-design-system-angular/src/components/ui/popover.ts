import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  contentChild,
  inject,
  input,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  RdxPopoverRoot,
  RdxPopoverTrigger,
  RdxPopoverPortal,
  RdxPopoverPositioner,
  RdxPopoverPopup,
  RdxPopoverTitle,
  RdxPopoverDescription,
  RdxPopoverClose,
  injectRdxPopoverRootContext,
} from '@radix-ng/primitives/popover';

// ─── Popover ──────────────────────────────────────────────────────────────────
//
// Painel flutuante ancorado a um gatilho, com conteúdo INTERATIVO — é o que
// separa o Popover do Tooltip: ele recebe foco, guarda formulário e botão, e o
// gatilho precisa anunciar que abre algo. Hover não abre; só clique e teclado.
//
// Visual: `.nds-popover-content` (painel), `.nds-popover-positioner` (wrapper de
// posicionamento), `.nds-popover-header/-title/-description`, todas em
// docs/shared/styles/nds/popover.css. Nenhuma classe nova foi inventada.
//
// COM os primitivos do Radix NG, porque o que eles entregam aqui é exatamente a
// parte que se escreve errado à mão:
//
//   · posicionamento por floating-ui no `RdxPopoverPositioner`, com auto-flip
//     por colisão e as variáveis `--transform-origin` / `data-side` /
//     `data-align` que o CSS compartilhado já lê;
//   · portal para o `document.body`, que tira o painel de todo `overflow:
//     hidden` e de todo contexto de empilhamento dos ancestrais — e só monta
//     enquanto o popover está aberto, que é o que faz o painel fechado NÃO
//     existir no DOM em vez de existir escondido;
//   · `role="dialog"` no painel e o par `aria-labelledby`/`aria-describedby`
//     ligado ao título e à descrição REAIS, por id gerado;
//   · `aria-expanded`, `aria-controls` e `aria-haspopup="dialog"` no gatilho,
//     sempre em sincronia — e `aria-controls` some quando o painel desmonta, que
//     é o detalhe que evita `aria-valid-attr-value` no axe;
//   · Escape e clique fora fecham, e o foco volta ao gatilho pelo gerenciador de
//     foco do próprio primitivo.
//
// O PAINEL NÃO ESPERA ANIMAÇÃO NENHUMA PARA SAIR, desde 2026-09-12. Até essa
// data este bloco citava uma terceira razão para o portal: ele SEGURAVA o
// elemento até a transição de saída terminar, e era isso que dava tempo ao
// `[data-ending-style]` da folha compartilhada. A dona tirou o movimento do
// Popover — entrada e saída —, e a regra que animava saiu de
// `docs/shared/styles/nds/popover.css`; a razão morreu com ela.
//
// O mecanismo do lado da lib continua de pé e é o que explica a mudança: a
// `PresenceMachine` do `@radix-ng/primitives` adia o desmonte um render (o
// `afterNextRender` que deixa os estilos de fechado chegarem ao DOM) e só o
// SUSPENDE se achar animação ou transição de saída recém-iniciada na subárvore.
// Sem nenhuma regra de movimento, ela não acha nada e desmonta ali mesmo.
// Consequência medida: `onOpenChangeComplete` passa a emitir junto com o
// fechamento, e não ~`--duration-fast` depois. Nenhuma play desta stack
// dependia daquele intervalo — todas esperam o painel sumir por `waitFor`, que
// só ficou mais rápido. Quem reintroduzir movimento aqui devolve as duas
// coisas de uma vez: a espera e a razão.
//
// O que os primitivos NÃO entregam é `data-state="open|closed"`: o Radix NG usa
// `data-open` / `data-closed` (convenção do Base UI). As outras stacks e a
// tabela de estados do conteúdo compartilhado falam `data-state`, então
// emitimos os dois — o nosso por cima, sem tirar nada do primitivo.
//
// A raiz é o único `@Component` da família: ela precisa de template para montar
// portal + positioner + painel. Todas as outras peças só acrescentam atributos e
// classe a um elemento que quem consome já escreveu, então são `@Directive`.

/**
 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
 *
 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que o
 * separa do tooltip), mas NÃO fica preso — `Tab` do último focável, ou
 * `Shift+Tab` do primeiro, SAI do painel: o painel FECHA e o foco VOLTA AO
 * GATILHO, nos dois sentidos (decisão da dona, 2026-09-17). Painel sem nada
 * focável fecha com qualquer um dos dois. O fechamento chega ao relatório como
 * `overlay`, o mesmo motivo de quem dispensou o painel sem decidir.
 * E o painel também FECHA quando PERDE o foco (D15, decisão da dona,
 * 2026-09-17): foco levado por código a outro elemento da página — que não o
 * gatilho, que conta como parte do painel — fecha uma vez, com `overlay`, e o
 * foco FICA onde foi posto, sem voltar ao gatilho. Foco que sai do documento
 * (outra janela) não fecha. No modo MODAL nada disso vale — lá o foco fica
 * preso e não há "sair".
 * Por isso o painel só recebe `aria-modal` no modo modal: o atributo manda o
 * leitor de tela esconder o resto da página, e sem foco preso ele mentiria.
 * `Escape` fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho
 * declara `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
 *
 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a rolagem e
 * anuncia `aria-modal`; desde 2026-09-17, também esconde o resto da página do
 * leitor de tela — os quatro juntos. O padrão continua não-modal. O esconder vale
 * com ou sem `ndsPopoverClose`, por `aria-hidden` — ver `hideOutside`.
 *
 * Mecanismo desta stack, medido na fonte do `@radix-ng/primitives` 1.1.2
 * (`fesm2022/`): o gerenciador de foco do primitivo trapeia com
 * `'trap-focus' || (modal === true && hasPopupClose())`
 * (`radix-ng-primitives-popover.mjs:622-623`), isola o lado de fora (`inert`) só
 * com `modal === true && hasPopupClose()` (`:625`), e a trava de rolagem cai de
 * `modal === true` sozinho (`useAnchoredScrollLock`, `:581`). O `aria-modal` do
 * Radix NG está no DIALOG, não no popover — aqui ele é nosso.
 *
 * DUAS CORREÇÕES DE 2026-09-17, as duas medidas nesta passagem:
 *
 *  - o trap do primitivo NÃO LIGA NESTA COMPOSIÇÃO, em nenhum caso — nem com
 *    peça de fechar. `hasPopupClose()` nunca fica verdadeiro: o `RdxPopoverClose`
 *    só se registra se injetar o `RdxPopoverPopup` (`:693-694`), e o
 *    `ndsPopoverClose` vive num `<ng-template ndsPopoverContent>` declarado FORA
 *    do painel, então o injetor dele é o da declaração e não o do painel. Até
 *    esta data este bloco dizia que "modal com um botão de fechar" trapearia pela
 *    lib, e que a alternativa a isso seria injetar um botão que o desenho não
 *    pede: as duas frases descreviam um caminho que não existe. Quem prende o
 *    foco aqui é SEMPRE o laço de tabulação do `NdsPopover` abaixo;
 *  - a string `'trap-focus'`, que o `transformModal` (`:16`) ainda aceita, SAIU
 *    do contrato desta stack — ver `PopoverModal` e `NdsPopover.travaFoco`.
 *
 * Por isso o modo modal aqui é metade lib e metade nosso, igual à stack do
 * base-ui: `modal` segue para a raiz (trava de rolagem) e o laço de tabulação
 * está escrito no `NdsPopover` abaixo, na mesma forma do `popover.ts` do
 * Vanilla.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * Modo MODAL. O padrão é `false`, que é o popover normal desta casa.
 *
 * `true` prende o foco no painel, trava a rolagem da página, faz o painel
 * anunciar `aria-modal="true"` e esconde o resto da página do leitor de tela —
 * os quatro juntos. Anunciar inércia sem prender o foco nem esconder o resto
 * seria mentir para quem usa leitor de tela.
 *
 * BOOLEANO, como nas outras quatro stacks, desde 2026-09-17 (decisão da dona).
 * Até essa data o tipo era `boolean | 'trap-focus'`: um valor público só desta
 * stack, herdado do `transformModal` do primitivo, que prendia o foco e fazia o
 * painel anunciar `aria-modal="true"` — mas NÃO travava a rolagem nem escondia o
 * resto da página, duas das quatro coisas que o modo modal liga juntas. Ou seja,
 * anunciava inércia sem cumpri-la, que é exatamente o defeito que as decisões D1
 * e D2 do PRD existem para proibir. Divergência de API de framework se registra;
 * promessa de acessibilidade quebrada, não.
 *
 * A lib continua aceitando a string na entrada (`transformModal`), e é por isso
 * que `NdsPopover.travaFoco` compara com `true` de forma ESTRITA: nada desta
 * stack escreve o valor, e qualquer coisa que não seja `true` é não-modal.
 */
export type PopoverModal = boolean;

export { popoverCloseReason, type PopoverCloseReason } from './popover-close-reason';

// ─── NdsPopoverContent ────────────────────────────────────────────────────────

/**
 * O conteúdo do painel, declarado num `<ng-template>`.
 *
 * É `<ng-template>` e não um elemento comum porque o painel vive em portal no
 * `document.body`: o conteúdo precisa ser um molde que a raiz instancia lá
 * dentro, e não markup que já nasceu na posição errada da árvore. Como o
 * `<ng-template>` é escrito dentro de `<div ndsPopover>`, o injetor dele continua
 * enxergando a raiz — é isso que faz `ndsPopoverTitle` e `ndsPopoverClose`
 * funcionarem mesmo renderizados fora, no fim do body.
 *
 * As opções de posicionamento moram aqui, e não na raiz, porque é o painel que
 * se posiciona — mesma divisão do `PopoverContent` das outras stacks.
 */
@Directive({
  selector: 'ng-template[ndsPopoverContent]',
  standalone: true,
})
export class NdsPopoverContent {
  /** O molde do painel. Injetado, não consultado: a diretiva ESTÁ no template. */
  readonly templateRef = inject(TemplateRef);

  /** Lado preferido em relação ao gatilho. Vira o oposto quando não há espaço. */
  readonly side = input<PopoverSide>('bottom');

  /** Alinhamento ao longo do eixo do `side`. */
  readonly align = input<PopoverAlign>('center');

  /** Distância em pixels entre gatilho e painel. */
  readonly sideOffset = input(4, { transform: numberAttribute });

  /** Deslocamento em pixels a partir do alinhamento `start`/`end`. */
  readonly alignOffset = input(0, { transform: numberAttribute });

  /**
   * Nome acessível EXPLÍCITO do painel, para o painel de conteúdo livre — o que
   * não tem `ndsPopoverTitle` dentro.
   *
   * Entra como INPUT da diretiva, e não como `aria-label` no `<ng-template>`:
   * template não renderiza elemento, então o atributo escrito ali não chegaria
   * a lugar nenhum. Quem o aplica é o `[attr.aria-label]` do painel lá embaixo.
   *
   * Só age quando não há título — com título quem nomeia é o `aria-labelledby`
   * do primitivo. Sem este input o painel segue herdando o texto do gatilho.
   */
  readonly ariaLabel = input<string | undefined>(undefined);
}

// ─── NdsPopover ───────────────────────────────────────────────────────────────

/**
 * Raiz do Popover.
 *
 * `open` é model do primitivo, então `[(open)]` funciona; `defaultOpen` cobre o
 * modo não-controlado e `modal` escolhe entre não-modal (padrão) e modal
 * (`true`: foco preso, rolagem travada, `aria-modal` e o resto da página
 * escondido do leitor de tela — os quatro juntos). Ver `PopoverModal`.
 *
 * `triggerId` / `defaultTriggerId` / `handle` ficam FORA da lista de inputs de
 * propósito: os três servem ao caso de um popover com gatilhos destacados,
 * compartilhado por várias linhas de uma tabela. É uma API própria, que pede
 * documentação própria — expor por tabela sem exemplo só cria superfície morta.
 *
 * `openOnHover` do gatilho também não é exposto: um popover que abre no hover é
 * um HoverCard, e o conteúdo compartilhado é explícito nisso.
 */
@Component({
  selector: 'div[ndsPopover]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // encapsulation None: o componente não declara `styles` próprios — o visual
  // inteiro vem de @shared/styles/nds/popover.css, que é global.
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, RdxPopoverPortal, RdxPopoverPositioner, RdxPopoverPopup],
  hostDirectives: [
    {
      directive: RdxPopoverRoot,
      inputs: ['open', 'defaultOpen', 'modal'],
      outputs: ['openChange', 'onOpenChange', 'onOpenChangeComplete'],
    },
  ],
  host: {
    // `nds-inline-block` porque o wrapper do Vanilla é `display: contents`, ou
    // seja, some do layout e deixa o gatilho participar do fluxo do pai. Um
    // `<div>` de bloco jogaria o gatilho para uma linha só dele; inline-block
    // encolhe até o gatilho e chega no mesmo resultado visual sem CSS novo.
    class: 'nds-inline-block',
    '[attr.data-slot]': '"popover"',
    '[attr.data-state]': 'state()',
  },
  // Uma `<ng-content>` só, e o painel instanciado por `ngTemplateOutlet`: duas
  // `<ng-content>` em ramos de `@if` não entregariam conteúdo a nenhum dos dois.
  // O `<ng-template ndsPopoverContent>` também passa por aqui, mas template não
  // renderiza — quem o instancia é o outlet lá embaixo, dentro do portal.
  template: `
    <ng-content />

    @if (content(); as panel) {
      <ng-template rdxPopoverPortal>
        <div
          rdxPopoverPositioner
          class="nds-popover-positioner"
          [side]="panel.side()"
          [align]="panel.align()"
          [sideOffset]="panel.sideOffset()"
          [alignOffset]="panel.alignOffset()"
        >
          <div
            #popup
            rdxPopoverPopup
            class="nds-popover-content"
            data-slot="popover-content"
            [attr.data-state]="state()"
            [attr.aria-label]="rotuloDeReserva()"
            [attr.aria-modal]="ariaModal()"
            (openAutoFocus)="aoAutoFocar($event)"
            (keydown)="aoTeclar($event)"
          >
            <ng-container [ngTemplateOutlet]="panel.templateRef" />
          </div>
        </div>
      </ng-template>
    }
  `,
})
export class NdsPopover {
  private readonly root = injectRdxPopoverRootContext();

  /**
   * O molde do painel.
   *
   * `descendants: true` porque o `<ng-template ndsPopoverContent>` costuma vir
   * embrulhado — dentro de um `@if` do consumidor, por exemplo — e uma consulta
   * só de filhos diretos o perderia em silêncio, deixando o gatilho abrir um
   * painel vazio.
   */
  protected readonly content = contentChild(NdsPopoverContent, { descendants: true });

  protected readonly state = computed(() => (this.root.isOpen() ? 'open' : 'closed'));

  /**
   * O foco está PRESO no painel?
   *
   * UM valor, e ele é o contrato cross-stack: `modal === true`. É desta pergunta
   * que saem o `aria-modal`, o laço de tabulação e o esconder do lado de fora —
   * os três têm de concordar sempre, porque um sem o outro é o defeito.
   *
   * Comparação ESTRITA de propósito. Até 2026-09-17 a string `'trap-focus'`
   * também entrava aqui e anunciava `aria-modal="true"` sem trava de rolagem e
   * sem esconder o resto da página; o valor saiu do contrato naquela data (ver
   * `PopoverModal`), mas o `transformModal` do primitivo ainda o deixa chegar à
   * raiz — então qualquer coisa que não seja `true` é não-modal, aqui.
   */
  protected readonly travaFoco = computed(() => this.root.modal() === true);

  /**
   * `aria-modal` SÓ quando o foco está preso, e nunca `"false"` no padrão: o
   * atributo ausente e o negado dizem a mesma coisa ao leitor de tela.
   */
  protected readonly ariaModal = computed(() => (this.travaFoco() ? 'true' : null));

  /** O painel vivo, quando existe — é dele que sai a cadeia de ancestrais. */
  private readonly popup = viewChild('popup', { read: ElementRef<HTMLElement> });

  constructor() {
    // Modo MODAL com o painel aberto: o resto da página some do leitor de tela
    // — ver `hideOutside`. Depois do render, e não num `effect` comum: o portal
    // do primitivo muda o painel para o `<body>` num efeito próprio
    // (`radix-ng-primitives-portal.mjs:136-145`), e a cadeia de ancestrais só é
    // a definitiva depois dele. Fechar (ou desmontar) roda a limpeza, que
    // devolve cada elemento ao estado de antes.
    //
    // Pela MESMA pergunta que liga o `aria-modal` e o laço de tabulação
    // (`travaFoco`), e não por uma leitura própria de `modal`: as três coisas são
    // o mesmo modo, e ler `modal` em três lugares é como elas se separam.
    afterRenderEffect((onCleanup) => {
      const popup = this.popup()?.nativeElement;
      if (!popup || !this.root.isOpen() || !this.travaFoco()) return;
      onCleanup(hideOutside(popup));
    });
  }

  /**
   * O `Tab` na borda do painel — os dois modos, com resultados opostos.
   *
   * NÃO-MODAL: do ÚLTIMO focável com `Tab`, ou do PRIMEIRO com `Shift+Tab`, a
   * tecla é barrada, o painel FECHA e o foco volta ao GATILHO. Painel sem nada
   * focável fecha com qualquer um dos dois. Mesma forma do ramo não-modal do
   * `handleKeydown` do Vanilla, que é a referência.
   *
   * Por `keydown`, e não pelo fechamento por foco do primitivo
   * (`focusManager.focusOut` → `close('focus-out')`): o painel mora em portal
   * no FIM do `<body>`, então o Tab do último focável leva o foco para FORA DO
   * DOCUMENTO — sem `focusin` em elemento nenhum, e o gerenciador de foco não vê
   * a saída. Medido em 2026-09-17 pela story `Focused`: o painel ficava aberto.
   *
   * Fecha com o motivo cru `'focus-out'`, o mesmo que a lib usaria, e é isso que
   * faz o `popoverCloseReason` entregar `overlay` sem mapa novo. O foco NÃO é
   * movido aqui: com a tecla barrada ele continua no painel até o desmonte, e o
   * escopo de foco do primitivo o devolve ao elemento focado antes da abertura
   * — o gatilho — no quadro seguinte (`focus(previouslyFocusedElement)`, porque
   * foco que caiu no `<body>` não conta como "movido"). A story afirma o destino.
   *
   * ─── E a PERDA DE FOCO (D15), que é o caso oposto ─────────────────────────
   *
   * Foco levado por código a outro elemento da página fecha o painel com
   * `overlay`, uma vez, e o foco FICA onde foi posto. Não há código nosso para
   * isso, nem devolução a suprimir — medido na suíte e na fonte do
   * `@radix-ng/primitives` 1.1.2 (`fesm2022/`), em 2026-09-17:
   *
   *  - quem fecha é o gerenciador de foco: `focusout` com `relatedTarget` fora
   *    da árvore flutuante emite `focusOut`
   *    (`radix-ng-primitives-floating-focus-manager.mjs:497-513`), e o popup o
   *    converte em `close('focus-out')` (`radix-ng-primitives-popover.mjs:609-613`);
   *  - a devolução do escopo de foco no desmonte
   *    (`radix-ng-primitives-focus-scope.mjs:655-663`) só foca o elemento de antes
   *    da abertura quando `shouldPreserveMovedFocus()` (`:681`) é falso — e ele é
   *    verdadeiro exatamente aqui: foco num elemento que não é o `<body>` e não
   *    está no painel. Por isso o `Tab` da borda, que segura o foco dentro, volta
   *    ao gatilho, e a perda de foco não;
   *  - o gatilho conta como parte do painel: `isRelatedTargetInside` (`:509`, e
   *    `:637`) o exclui, então o clique nele fecha pelo `trigger-press`, uma vez;
   *  - o clique fora não soma dois: com o botão apertado a perda de foco é
   *    ignorada (`pointerDown`, `:499`), e quem fecha é só o `outside-press`.
   *
   * Consequência para quem mexer aqui: mover o foco explicitamente para o
   * gatilho no fechamento (num `(closeAutoFocus)`, por exemplo) desfaria a D15 —
   * foi o defeito plantado que deu dentes à story `Focused`.
   *
   * MODAL: laço. Escrito aqui porque o primitivo NÃO trapeia nesta composição —
   * em nenhum caso, nem com peça de fechar: ele exige `hasPopupClose()`, e um
   * `ndsPopoverClose` declarado no `<ng-template ndsPopoverContent>` nunca se
   * registra no painel (medido em 2026-09-17; ver o bloco no topo deste
   * arquivo). Some com isso a última hipótese de redundância, porque a string
   * `'trap-focus'` da lib saiu do contrato na mesma data: este laço é o ÚNICO
   * trap de foco desta stack, e não uma segunda camada por cima do da lib.
   */
  protected aoTeclar(evento: KeyboardEvent): void {
    if (evento.key !== 'Tab' || evento.defaultPrevented) return;

    const panel = evento.currentTarget as HTMLElement | null;
    if (!panel) return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(
      (el) => !el.closest('[hidden]'),
    );

    if (!this.travaFoco()) {
      const active = document.activeElement;
      const saindo =
        !focusable.length ||
        (evento.shiftKey ? active === focusable[0] : active === focusable[focusable.length - 1]);
      if (!saindo) return;
      evento.preventDefault();
      this.root.close('focus-out', evento);
      return;
    }

    // Sem nada focável dentro, ficar preso é literal: o gerenciador de foco já
    // deixou o painel com `tabindex="-1"`, e ele segura o foco sozinho.
    if (!focusable.length) {
      evento.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (evento.shiftKey) {
      if (document.activeElement === first) {
        evento.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      evento.preventDefault();
      first.focus();
    }
  }

  /**
   * Nome acessível do painel quando não há título.
   *
   * `role="dialog"` sem nome reprova na regra `aria-dialog-name` do axe, e a
   * variante "apenas conteúdo" do conteúdo compartilhado não tem título. O
   * Vanilla — referência de markup — resolve exatamente assim: com título, o
   * primitivo liga `aria-labelledby`; sem título, vale o `ariaLabel` declarado
   * por quem compõe e, na falta dele, o texto acessível do gatilho como rede de
   * segurança. Devolve `null` quando há título para não deixar os dois
   * contratos no mesmo elemento.
   */
  protected readonly rotuloDeReserva = computed(() => {
    if (this.root.titleId()) return null;
    const declarado = this.content()?.ariaLabel()?.trim();
    if (declarado) return declarado;
    const trigger = this.root.trigger();
    return trigger?.getAttribute('aria-label') || trigger?.textContent?.trim() || null;
  });

  /**
   * Leva o foco para dentro do painel ao abrir.
   *
   * O primitivo TENTA fazer isso — o gerenciador de foco chama `focus()` no
   * primeiro elemento tabulável no mesmo microtask em que o painel monta. Só
   * que nesse instante o positioner ainda está `visibility: hidden`, esperando
   * o floating-ui medir a posição, e `focus()` em elemento invisível é no-op no
   * navegador. O resultado é o foco parado no gatilho, sem erro nenhum: é o que
   * a própria documentação do primitivo registra como "a positioned popover
   * does not auto-focus into the popup on open".
   *
   * Aqui a política é assumida: barramos a tentativa cedo demais e refazemos
   * assim que o painel fica visível. Não é preferência — o conteúdo
   * compartilhado promete, em três idiomas e em três seções (acessibilidade,
   * estados e critérios de teste), que o foco vai para o primeiro elemento
   * focável. Um popover guarda formulário e botão; deixar o foco fora obrigaria
   * quem navega por teclado a caçar o painel.
   */
  protected aoAutoFocar(evento: Event): void {
    evento.preventDefault();
    const panel = evento.target as HTMLElement | null;
    if (panel) this.focarQuandoVisivel(panel, 0);
  }

  /**
   * Espera o painel ficar visível e então foca.
   *
   * Por quadro, e não por `setTimeout`: o que falta é a medição do floating-ui,
   * que acontece em `requestAnimationFrame`. O teto de tentativas existe para
   * que um painel que nunca aparece (fechado no mesmo quadro, por exemplo) não
   * deixe um laço rodando.
   */
  private focarQuandoVisivel(panel: HTMLElement, attempt: number): void {
    if (!panel.isConnected || attempt > 10) return;
    if (getComputedStyle(panel).visibility === 'hidden') {
      requestAnimationFrame(() => this.focarQuandoVisivel(panel, attempt + 1));
      return;
    }
    // Se o conteúdo já levou o foco para dentro, não mexer: a intenção dele é
    // mais específica que a política genérica de "primeiro focável".
    if (panel.contains(document.activeElement)) return;

    // `data-autofocus` é como o conteúdo diz ONDE quer o foco.
    //
    // Existe porque "primeiro elemento focável" é a resposta errada para alguma
    // coisa. No Calendar dentro de um Popover, o primeiro focável é o botão de
    // mês anterior, e o foco parava lá — quem abre por teclado tinha que
    // atravessar a navegação inteira antes de chegar a um dia. O Calendar
    // tentava se corrigir sozinho, e não conseguia: ele foca enquanto o painel
    // ainda está `visibility: hidden` esperando o floating-ui, e `focus()` em
    // elemento invisível é no-op. Quem sabe quando o painel ficou visível é este
    // laço, aqui; então é aqui que a escolha do conteúdo tem que ser lida.
    //
    // Sem elemento focável nenhum, o foco vai para o próprio painel — que o
    // gerenciador de foco já deixou com `tabindex="-1"`. Assim o leitor de tela
    // anuncia o diálogo mesmo quando ele só tem texto.
    const declarado = panel.querySelector<HTMLElement>('[data-autofocus]');
    const target = declarado ?? panel.querySelector<HTMLElement>(FOCAVEIS);
    (target ?? panel).focus();
  }
}

/**
 * Modo MODAL: o resto da página some do leitor de tela enquanto o painel está
 * aberto — decisão da dona de 2026-09-17 (item 7 da §7 do PRD), igual nas cinco.
 * `aria-modal` sozinho não basta: leitores de tela o honram de forma desigual
 * (o VoiceOver do Safari é o caso conhecido).
 *
 * O algoritmo "esconder os outros": para cada ancestral do painel até o
 * `<body>`, os IRMÃOS desse ancestral recebem `aria-hidden="true"`; o painel e a
 * cadeia de ancestrais dele, não — e as REGIÕES VIVAS também não, ver
 * `REGIOES_VIVAS`. `aria-hidden` e NUNCA `inert`: `inert` também tira do
 * ponteiro os elementos de fora, e o clique fora é o que fecha.
 *
 * POR QUE A STACK COMPLEMENTA o primitivo, medido no `@radix-ng/primitives`
 * 1.1.2 (`fesm2022/`) em 2026-09-17:
 * - o primitivo não usa `aria-hidden` para isso; ele isola o lado de fora com
 *   `inert`, e só com `modal === true && hasPopupClose()`
 *   (`radix-ng-primitives-popover.mjs:625`);
 * - e `hasPopupClose()` NUNCA é verdadeiro nesta composição: o
 *   `RdxPopoverClose` só se registra se injetar o `RdxPopoverPopup`
 *   (`radix-ng-primitives-popover.mjs:693-694`), e o `ndsPopoverClose` vive num
 *   `<ng-template ndsPopoverContent>` declarado FORA do painel — o injetor dele
 *   é o da declaração, não o do painel. Medido com uma story descartável: modo
 *   modal COM `ndsPopoverClose`, painel aberto, nenhum elemento com `inert`;
 * - e o `markOthers` do primitivo, quando age, trata `"false"` como "não
 *   isolado" e REMOVE o atributo ao soltar
 *   (`radix-ng-primitives-floating-focus-manager.mjs:95`, `:128`) — o valor
 *   anterior não voltaria.
 *
 * Por isso a restauração aqui é EXATA: cada elemento guarda o valor que tinha
 * (ou a ausência dele) e o recebe de volta. O contador por elemento é o que
 * deixa dois painéis modais simultâneos soltarem o mesmo elemento só quando o
 * último fechar. Mesma forma do `hideOutside` do `popover.tsx` do react.
 */
const hiddenCount = new WeakMap<Element, number>();
const previousAriaHidden = new WeakMap<Element, string | null>();

/**
 * O que o esconder NÃO marca: REGIÃO VIVA e `<script>`.
 *
 * Escondido do leitor de tela, um toast que anuncia "salvo" — ou um erro que
 * chega enquanto o painel está aberto — fica MUDO, e o anúncio é justamente o
 * que não pode se perder. As libs das outras stacks pulam os mesmos elementos,
 * medido em 2026-09-17: o `markOthers` da base-ui 1.7.0 preserva todo
 * `[aria-live]` e ignora `script` (`markOthers.mjs:86`, `:53`), e o pacote
 * `aria-hidden` 1.2.6 que a reka usa faz o mesmo, com a mesma justificativa em
 * comentário (`dist/es2015/index.js:131-133`). O `<script>` entra porque não tem
 * efeito nenhum na árvore de acessibilidade — marcá-lo é só ruído.
 *
 * Os `role` da lista são as regiões vivas IMPLÍCITAS do ARIA: um elemento com
 * `role="status"` anuncia sem nunca declarar `aria-live`, e uma exceção que só
 * olhasse o atributo o silenciaria. `[aria-live]` com qualquer valor, inclusive
 * `"off"`: quem escreveu o atributo é quem manda no anúncio, não nós.
 */
const REGIOES_VIVAS = [
  '[aria-live]',
  'script',
  '[role="status"]',
  '[role="alert"]',
  '[role="log"]',
  '[role="progressbar"]',
  '[role="marquee"]',
  '[role="timer"]',
].join(', ');

function hideOutside(panel: HTMLElement): () => void {
  const body = panel.ownerDocument.body;
  const hidden: Element[] = [];
  let node: Element = panel;
  while (node !== body && node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || sibling.matches(REGIOES_VIVAS)) continue;
      const count = hiddenCount.get(sibling) ?? 0;
      if (count === 0) {
        previousAriaHidden.set(sibling, sibling.getAttribute('aria-hidden'));
        sibling.setAttribute('aria-hidden', 'true');
      }
      hiddenCount.set(sibling, count + 1);
      hidden.push(sibling);
    }
    node = node.parentElement;
  }
  return () => {
    for (const element of hidden) {
      const count = (hiddenCount.get(element) ?? 1) - 1;
      if (count > 0) {
        hiddenCount.set(element, count);
        continue;
      }
      hiddenCount.delete(element);
      const previous = previousAriaHidden.get(element) ?? null;
      previousAriaHidden.delete(element);
      if (previous === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', previous);
    }
  };
}

/**
 * O que conta como "primeiro elemento focável".
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 *
 * **A regra vale para TODOS os seletores, e até 2026-09-13 só o último a
 * cobrava.** `input[tabindex="-1"]` entrava pela porta do `input:not([disabled])`,
 * e um elemento que o Tab nunca visita virava o "último focável": o ramo do laço
 * deixava de disparar e o foco SAÍA do painel modal — justamente o contrato que
 * este laço existe para sustentar quando a composição não tem `ndsPopoverClose`.
 *
 * Aqui é latente, porque o `ndsCheckbox` desta stack é um `<button>`. No react
 * não era: a base-ui renderiza um `<input tabindex="-1" aria-hidden>` escondido
 * ao lado de cada Checkbox, e bastou a story do modo modal passar a usar
 * checkbox para o laço quebrar. A lista é cópia da do vanilla, que é a
 * referência; ela foi corrigida lá no mesmo dia.
 */
const FOCAVEIS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ');

// ─── NdsPopoverTrigger ────────────────────────────────────────────────────────

/**
 * Botão que abre o popover.
 *
 * Seletor em `button` porque o primitivo exige elemento nativo: `aria-expanded`
 * e `aria-haspopup` num `<div>` seriam remendo para o que o `<button>` já dá de
 * graça (foco, Enter, Space, anúncio de papel).
 *
 * `disabled` do `RdxPopoverTrigger` fica FORA da lista de inputs pelo mesmo
 * motivo do Collapsible: quando o gatilho também é `ndsButton`, os dois
 * primitivos ligariam `[attr.disabled]` no mesmo elemento e o último a rodar
 * venceria. Desabilitar pelo botão dá o atributo nativo, que já barra o clique.
 */
@Directive({
  selector: 'button[ndsPopoverTrigger]',
  standalone: true,
  hostDirectives: [RdxPopoverTrigger],
  host: {
    '[attr.data-slot]': '"popover-trigger"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsPopoverTrigger {
  // O contexto da raiz, e não `inject(RdxPopoverRoot)`: a raiz está em OUTRO
  // elemento (o wrapper), então a injeção por diretiva não a alcança.
  private readonly root = injectRdxPopoverRootContext();

  protected readonly state = computed(() => (this.root.isOpen() ? 'open' : 'closed'));
}

// ─── NdsPopoverHeader ─────────────────────────────────────────────────────────

/**
 * Agrupador opcional de título e descrição.
 *
 * Sem primitivo por baixo: `.nds-popover-header` é só a pilha com espaçamento
 * menor entre as duas linhas. Compor um primitivo aqui não acrescentaria nem
 * ARIA nem estado.
 */
@Directive({
  selector: 'div[ndsPopoverHeader]',
  standalone: true,
  host: {
    class: 'nds-popover-header',
    '[attr.data-slot]': '"popover-header"',
  },
})
export class NdsPopoverHeader {}

// ─── NdsPopoverTitle ──────────────────────────────────────────────────────────

/**
 * Título acessível do painel.
 *
 * Seletor de atributo sem elemento fixo: quem escreve escolhe o nível de
 * cabeçalho que faz sentido na página (`<h3>` dentro de uma seção `<h2>`), e
 * cravar a tag aqui produziria hierarquia errada em metade dos usos.
 *
 * O primitivo gera o id e o registra na raiz; é dali que sai o `aria-labelledby`
 * do painel. Por isso o título precisa estar DENTRO do `<ng-template
 * ndsPopoverContent>`: registrado fora, ele nomearia um painel que não existe.
 */
@Directive({
  selector: '[ndsPopoverTitle]',
  standalone: true,
  hostDirectives: [RdxPopoverTitle],
  host: {
    class: 'nds-popover-title',
    '[attr.data-slot]': '"popover-title"',
  },
})
export class NdsPopoverTitle {}

// ─── NdsPopoverDescription ────────────────────────────────────────────────────

/** Descrição opcional. O primitivo a liga ao painel via `aria-describedby`. */
@Directive({
  selector: '[ndsPopoverDescription]',
  standalone: true,
  hostDirectives: [RdxPopoverDescription],
  host: {
    class: 'nds-popover-description',
    '[attr.data-slot]': '"popover-description"',
  },
})
export class NdsPopoverDescription {}

// ─── NdsPopoverClose ──────────────────────────────────────────────────────────

/**
 * Botão que fecha o popover a partir de dentro do painel.
 *
 * Existe porque o popover guarda conteúdo interativo: um "Cancelar" precisa
 * fechar o painel sem obrigar quem consome a controlar `open` por fora só para
 * isso. Sem visual próprio — componha com `ndsButton`.
 */
@Directive({
  selector: 'button[ndsPopoverClose]',
  standalone: true,
  hostDirectives: [RdxPopoverClose],
  host: {
    '[attr.data-slot]': '"popover-close"',
  },
})
export class NdsPopoverClose {}

/** A família inteira — conveniência para o `imports` de quem compõe. */
export const NDS_POPOVER = [
  NdsPopover,
  NdsPopoverTrigger,
  NdsPopoverContent,
  NdsPopoverHeader,
  NdsPopoverTitle,
  NdsPopoverDescription,
  NdsPopoverClose,
] as const;
