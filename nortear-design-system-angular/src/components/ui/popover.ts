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
//   · portal para o `document.body` que só monta enquanto o popover está aberto
//     e segura o elemento até a animação de saída terminar — sem isso o
//     `[data-ending-style]` da folha não teria o que animar;
//   · `role="dialog"` no painel e o par `aria-labelledby`/`aria-describedby`
//     ligado ao título e à descrição REAIS, por id gerado;
//   · `aria-expanded`, `aria-controls` e `aria-haspopup="dialog"` no gatilho,
//     sempre em sincronia — e `aria-controls` some quando o painel desmonta, que
//     é o detalhe que evita `aria-valid-attr-value` no axe;
//   · Escape e clique fora fecham, e o foco volta ao gatilho pelo gerenciador de
//     foco do próprio primitivo.
//
// O que os primitivos NÃO entregam é `data-state="open|closed"`: o Radix NG usa
// `data-open` / `data-closed` (convenção do Base UI). As outras stacks e a
// tabela de estados do conteúdo compartilhado falam `data-state`, então
// emitimos os dois — o nosso por cima, sem tirar nada do primitivo.
//
// A raiz é o único `@Component` da família: ela precisa de template para montar
// portal + positioner + painel. Todas as outras peças só acrescentam atributos e
// classe a um elemento que quem consome já escreveu, então são `@Directive`.

// ─── Types ────────────────────────────────────────────────────────────────────

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';

/**
 * `true` bloqueia a rolagem da página; `'trap-focus'` prende o foco no painel
 * sem bloquear a interação com o resto da página. O padrão é não-modal.
 */
export type PopoverModal = boolean | 'trap-focus';

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
}

// ─── NdsPopover ───────────────────────────────────────────────────────────────

/**
 * Raiz do Popover.
 *
 * `open` é model do primitivo, então `[(open)]` funciona; `defaultOpen` cobre o
 * modo não-controlado e `modal` escolhe entre não-modal (padrão), trava de
 * rolagem (`true`) e prisão de foco (`'trap-focus'`).
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
    '[attr.data-state]': 'estado()',
  },
  // Uma `<ng-content>` só, e o painel instanciado por `ngTemplateOutlet`: duas
  // `<ng-content>` em ramos de `@if` não entregariam conteúdo a nenhum dos dois.
  // O `<ng-template ndsPopoverContent>` também passa por aqui, mas template não
  // renderiza — quem o instancia é o outlet lá embaixo, dentro do portal.
  template: `
    <ng-content />

    @if (conteudo(); as painel) {
      <ng-template rdxPopoverPortal>
        <div
          rdxPopoverPositioner
          class="nds-popover-positioner"
          [side]="painel.side()"
          [align]="painel.align()"
          [sideOffset]="painel.sideOffset()"
          [alignOffset]="painel.alignOffset()"
        >
          <div
            rdxPopoverPopup
            class="nds-popover-content"
            data-slot="popover-content"
            [attr.data-state]="estado()"
            [attr.aria-label]="rotuloDeReserva()"
            (openAutoFocus)="aoAutoFocar($event)"
          >
            <ng-container [ngTemplateOutlet]="painel.templateRef" />
          </div>
        </div>
      </ng-template>
    }
  `,
})
export class NdsPopover {
  private readonly raiz = injectRdxPopoverRootContext();

  /**
   * O molde do painel.
   *
   * `descendants: true` porque o `<ng-template ndsPopoverContent>` costuma vir
   * embrulhado — dentro de um `@if` do consumidor, por exemplo — e uma consulta
   * só de filhos diretos o perderia em silêncio, deixando o gatilho abrir um
   * painel vazio.
   */
  protected readonly conteudo = contentChild(NdsPopoverContent, { descendants: true });

  protected readonly estado = computed(() => (this.raiz.isOpen() ? 'open' : 'closed'));

  /**
   * Nome acessível de reserva para o painel.
   *
   * `role="dialog"` sem nome reprova na regra `aria-dialog-name` do axe, e a
   * variante "apenas conteúdo" do conteúdo compartilhado não tem título. O
   * Vanilla — referência de markup — resolve exatamente assim: com título, o
   * primitivo liga `aria-labelledby`; sem título, o painel herda o texto
   * acessível do gatilho. Devolve `null` quando há título para não deixar os
   * dois contratos no mesmo elemento.
   */
  protected readonly rotuloDeReserva = computed(() => {
    if (this.raiz.titleId()) return null;
    const gatilho = this.raiz.trigger();
    return gatilho?.getAttribute('aria-label') || gatilho?.textContent?.trim() || null;
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
    const painel = evento.target as HTMLElement | null;
    if (painel) this.focarQuandoVisivel(painel, 0);
  }

  /**
   * Espera o painel ficar visível e então foca.
   *
   * Por quadro, e não por `setTimeout`: o que falta é a medição do floating-ui,
   * que acontece em `requestAnimationFrame`. O teto de tentativas existe para
   * que um painel que nunca aparece (fechado no mesmo quadro, por exemplo) não
   * deixe um laço rodando.
   */
  private focarQuandoVisivel(painel: HTMLElement, tentativa: number): void {
    if (!painel.isConnected || tentativa > 10) return;
    if (getComputedStyle(painel).visibility === 'hidden') {
      requestAnimationFrame(() => this.focarQuandoVisivel(painel, tentativa + 1));
      return;
    }
    // Sem elemento focável dentro, o foco vai para o próprio painel — que o
    // gerenciador de foco já deixou com `tabindex="-1"`. Assim o leitor de tela
    // anuncia o diálogo mesmo quando ele só tem texto.
    const alvo = painel.querySelector<HTMLElement>(FOCAVEIS);
    (alvo ?? painel).focus();
  }
}

/**
 * O que conta como "primeiro elemento focável".
 *
 * `[tabindex="-1"]` fica de fora de propósito: é o marcador de foco
 * programático, não de parada na ordem de tabulação — e o próprio painel o tem.
 */
const FOCAVEIS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

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
    '[attr.data-state]': 'estado()',
  },
})
export class NdsPopoverTrigger {
  // O contexto da raiz, e não `inject(RdxPopoverRoot)`: a raiz está em OUTRO
  // elemento (o wrapper), então a injeção por diretiva não a alcança.
  private readonly raiz = injectRdxPopoverRootContext();

  protected readonly estado = computed(() => (this.raiz.isOpen() ? 'open' : 'closed'));
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
