import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  RdxAccordionItemDirective,
  RdxAccordionPanelDirective,
  RdxAccordionRootDirective,
  RdxAccordionTriggerDirective,
  injectAccordionItemContext,
} from '@radix-ng/primitives/accordion';
import { injectCollapsibleRootContext } from '@radix-ng/primitives/collapsible';

// ─── Accordion ────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-accordion-* (docs/shared/styles/nds/accordion.css).
//
// COM os primitivos do Radix NG. O que eles trazem aqui é a máquina de estado
// inteira: exclusividade do modo único, acumulação do modo múltiplo,
// `aria-expanded`, `aria-controls` ligando gatilho e painel, ids estáveis,
// `hidden="until-found"` no painel fechado (o Ctrl+F do navegador acha a
// resposta e abre o item) e as fases `data-starting-style`/`data-ending-style`,
// que seguram a remoção até a animação de fechamento terminar.
//
// O que eles NÃO trazem — e por isso está aqui: navegação por setas. O
// `RdxAccordionRootDirective` deprecou `orientation` e `loopFocus` "seguindo a
// atualização da APG que removeu o roving focus", então ArrowUp/ArrowDown/Home/
// End caem no scroll da página. Vanilla, reka-ui e bits-ui implementam, o
// conteúdo compartilhado documenta o comportamento (accessibility.keyboard.*) e
// o React o repõe com o mesmo patch — repô-lo aqui é o que mantém as cinco
// stacks iguais.
//
// Markup idêntico ao do Vanilla (a referência cross-stack):
//
//   <div class="nds-accordion" data-slot="accordion" data-type="single">
//     <div class="nds-accordion-item" data-slot="accordion-item">
//       <h3 class="nds-accordion-header">
//         <button class="nds-accordion-trigger" data-slot="accordion-trigger">
//           <span>Pergunta</span><svg class="nds-accordion-icon">…</svg>
//         </button>
//       </h3>
//       <div class="nds-accordion-content" data-slot="accordion-content">
//         <div class="nds-accordion-content-body">Resposta</div>
//       </div>
//     </div>
//   </div>
//
// O `<h3>` e os dois invólucros internos nascem dos templates — quem consome
// escreve só gatilho e conteúdo, e o cabeçalho semântico não fica na mão de
// quem lembrar dele. O gatilho chega ao `<h3>` por projeção com seletor, e
// projeção preserva o injetor do ponto de DECLARAÇÃO: o `<button>` continua
// enxergando o contexto do item, que é o elemento onde ele foi escrito.

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'] as const;

type NavKey = (typeof NAV_KEYS)[number];

/** Gatilhos operáveis, na ordem do documento. Desabilitado não recebe foco. */
const SELETOR_GATILHOS =
  '[data-slot="accordion-trigger"]:not([disabled]):not([aria-disabled="true"])';

// ─── NdsAccordion (raiz) ──────────────────────────────────────────────────────

@Component({
  selector: 'div[ndsAccordion]',
  standalone: true,
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxAccordionRootDirective,
      // `multiple`, e não `type="single" | "multiple"`: é o nome do primitivo.
      // No modo único o item aberto sempre fecha ao ser clicado de novo — é o
      // comportamento do design system nas cinco stacks, e não há entrada para
      // desligá-lo.
      inputs: ['multiple', 'value', 'defaultValue', 'disabled'],
      outputs: ['valueChange', 'onValueChange'],
    },
  ],
  host: {
    class: 'nds-accordion',
    '[attr.data-slot]': '"accordion"',
    // O modo fica registrado no DOM, e não só na prop: sem isto nada distingue
    // um accordion único de um múltiplo depois de montado — CSS, teste,
    // devtools e o painel Code veriam exatamente o mesmo HTML. Mesmo atributo
    // nas cinco stacks.
    '[attr.data-type]': 'modo()',
    '(keydown)': 'aoTeclar($event)',
  },
})
export class NdsAccordion {
  private readonly raiz = inject(RdxAccordionRootDirective, { self: true });
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly modo = computed(() => (this.raiz.multiple() ? 'multiple' : 'single'));

  /**
   * Setas, Home e End movendo o foco entre gatilhos, com laço nas pontas.
   *
   * Só age quando o foco está NUM gatilho: tecla apertada dentro do conteúdo
   * (link, campo, tabela rolável) segue o comportamento nativo.
   */
  protected aoTeclar(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (!NAV_KEYS.includes(event.key as NavKey)) return;

    const alvo = event.target as HTMLElement | null;
    const focado = alvo?.closest<HTMLButtonElement>('[data-slot="accordion-trigger"]');
    if (!focado) return;

    const gatilhos = Array.from(
      this.hostRef.nativeElement.querySelectorAll<HTMLButtonElement>(SELETOR_GATILHOS),
    );
    const indice = gatilhos.indexOf(focado);
    if (indice < 0) return;

    event.preventDefault();
    const ultimo = gatilhos.length - 1;
    const proximo =
      event.key === 'ArrowDown' ? (indice + 1) % gatilhos.length
      : event.key === 'ArrowUp' ? (indice - 1 + gatilhos.length) % gatilhos.length
      : event.key === 'Home' ? 0
      : ultimo;
    gatilhos[proximo]?.focus();
  }
}

// ─── NdsAccordionItem ─────────────────────────────────────────────────────────

@Component({
  selector: 'div[ndsAccordionItem]',
  standalone: true,
  // O gatilho é projetado DENTRO do `<h3>`; todo o resto (o conteúdo) cai no
  // slot livre. O cabeçalho é exigência da APG e some do markup de quem usa.
  template: `
    <h3 class="nds-accordion-header">
      <ng-content select="[ndsAccordionTrigger]" />
    </h3>
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxAccordionItemDirective,
      inputs: ['value', 'disabled'],
      outputs: ['onOpenChange'],
    },
  ],
  host: {
    class: 'nds-accordion-item',
    '[attr.data-slot]': '"accordion-item"',
  },
})
export class NdsAccordionItem {
  private readonly colapsavel = injectCollapsibleRootContext();

  constructor() {
    // ── O painel fechado FICA no documento ────────────────────────────────
    //
    // `hidden="until-found"` esconde por `content-visibility`, não por
    // `display: none` — é o que deixa o Ctrl+F do navegador achar a resposta
    // dentro de um item fechado e abri-lo (evento `beforematch`, que o próprio
    // primitivo escuta). Isso exige o painel montado, então `keepMounted` vem
    // junto. As cinco stacks combinam esse comportamento; não é opção de quem
    // consome, é o contrato do componente.
    //
    // Por que effect e não valor de input: o `RdxAccordionItemDirective`
    // reencaminha `keepMounted`/`hiddenUntilFound` da RAIZ para o contexto do
    // collapsible em effects próprios, e binding de host não escreve input de
    // outra diretiva. Os effects das host directives são registrados antes
    // deste (o construtor delas roda antes do meu), então este roda por
    // último. A leitura antes da escrita é de propósito: se algo reescrever
    // `false`, este effect acorda e reafirma — em vez de perder o recurso em
    // silêncio.
    effect(() => {
      if (!this.colapsavel.keepMounted()) this.colapsavel.keepMounted.set(true);
      if (!this.colapsavel.hiddenUntilFound()) this.colapsavel.hiddenUntilFound.set(true);
    });
  }
}

// ─── NdsAccordionTrigger ──────────────────────────────────────────────────────

@Component({
  selector: 'button[ndsAccordionTrigger]',
  standalone: true,
  // O rótulo vive num <span> próprio: o sublinhado de hover é
  // `.nds-accordion-trigger:hover > span:first-child` e não deve alcançar o
  // ícone. Um único chevron, que gira 180° ao abrir (ver accordion.css).
  template: `
    <span><ng-content /></span>
    <svg
      class="nds-accordion-icon"
      data-slot="accordion-trigger-icon"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [RdxAccordionTriggerDirective],
  host: {
    class: 'nds-accordion-trigger',
    type: 'button',
    '[attr.data-slot]': '"accordion-trigger"',
    // `data-state` além do que o primitivo emite: o Radix NG marca
    // `data-panel-open` (convenção do Base UI) e as outras quatro stacks
    // emitem `data-state="open|closed"`. O CSS aceita as duas convenções, mas
    // a paridade de markup é o que a auditoria cross-stack compara.
    '[attr.data-state]': 'aberto() ? "open" : "closed"',
    // O primitivo só aponta `aria-controls` enquanto o painel existe, porque
    // no Base UI ele desmonta ao fechar. Aqui o painel NUNCA desmonta (ver
    // NdsAccordionItem), então o id sempre resolve — e apontar sempre é o que
    // o Vanilla faz.
    '[attr.aria-controls]': 'painelId()',
    // `role="button"` num <button> é redundante; o primitivo o escreve por
    // causa dos hosts não-nativos. Removê-lo mantém o markup igual ao Vanilla.
    '[attr.role]': 'null',
  },
})
export class NdsAccordionTrigger {
  private readonly item = injectAccordionItemContext();
  private readonly colapsavel = injectCollapsibleRootContext();

  protected readonly aberto = computed(() => this.item.open());
  protected readonly painelId = computed(() => this.colapsavel.panelId());
}

// ─── NdsAccordionContent ──────────────────────────────────────────────────────

@Component({
  selector: 'div[ndsAccordionContent]',
  standalone: true,
  // O corpo é um filho separado de propósito: a animação é
  // `grid-template-rows: 0fr → 1fr` no painel, e o `padding-bottom` do corpo
  // encolhe junto. Sem esse par, o fechamento trava num piso de 16px.
  template: '<div class="nds-accordion-content-body"><ng-content /></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [RdxAccordionPanelDirective],
  host: {
    class: 'nds-accordion-content',
    '[attr.data-slot]': '"accordion-content"',
    '[attr.data-state]': 'aberto() ? "open" : "closed"',
    // Sem `role="region"` e sem `aria-labelledby`, os dois vindos do
    // primitivo. Com o painel sempre montado (exigência do `until-found`), o
    // role transformaria TODO item fechado em landmark: medido na docs page,
    // 41 painéis viraram 41 landmarks e os de mesmo rótulo colidiram no axe
    // (landmark-unique). É a proliferação que a APG manda evitar — e por isso
    // ela trata o role no painel como opcional. A relação gatilho → conteúdo
    // fica no `aria-controls`. Binding vence atributo estático de host
    // directive, e as host directives ligam antes das do próprio componente.
    '[attr.role]': 'null',
    '[attr.aria-labelledby]': 'null',
  },
})
export class NdsAccordionContent {
  private readonly colapsavel = injectCollapsibleRootContext();

  protected readonly aberto = computed(() => this.colapsavel.open());
}
