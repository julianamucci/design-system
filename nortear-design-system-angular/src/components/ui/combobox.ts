import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injector,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import {
  RdxComboboxChip,
  RdxComboboxChipRemove,
  RdxComboboxChips,
  RdxComboboxClear,
  RdxComboboxGroup,
  RdxComboboxGroupLabel,
  RdxComboboxInput,
  RdxComboboxItem,
  RdxComboboxItemIndicator,
  RdxComboboxLabel,
  RdxComboboxList,
  RdxComboboxPopup,
  RdxComboboxPortal,
  RdxComboboxPositioner,
  RdxComboboxRoot,
  RdxComboboxTrigger,
  injectComboboxRootContext,
} from '@radix-ng/primitives/combobox';
import { ChevronDown } from 'lucide';

// ─── Combobox ─────────────────────────────────────────────────────────────────
//
// Campo de texto que filtra uma lista. No modo múltiplo os escolhidos viram
// CHIPS dentro do próprio campo.
//
// Visual: bloco `.nds-combobox-*` de docs/shared/styles/nds/combobox.css. QUEM
// PARECE UM CAMPO é o `.nds-combobox-input-wrapper`, não o `<input>`: o input é
// transparente por dentro dele, e é isso que permite chips e texto conviverem
// na mesma caixa com um anel de foco só.
//
// Markup (o `data-slot` de cada peça é o contrato compartilhado — o Vanilla é a
// referência e o que ele emite é o que este arquivo espelha):
//
//   <nds-combobox data-slot="combobox">
//     <label ndsComboboxLabel>
//     <div ndsComboboxInputWrapper>
//       <div ndsComboboxChips>
//         <span ndsComboboxChip>
//           <span data-slot="combobox-chip-text">
//           <button ndsComboboxChipRemove>
//       <input ndsComboboxInput role="combobox">
//       <button ndsComboboxClear>
//       <button ndsComboboxTrigger>
//         <svg ndsComboboxIcon>
//     <ng-template ndsComboboxPopup>          ← miolo, instanciado no popup
//       <div ndsComboboxList role="listbox">
//         <div ndsComboboxGroup role="group">
//           <div ndsComboboxGroupLabel>
//         <div ndsComboboxItem role="option">
//           <span data-slot="combobox-item-text">
//           <span ndsComboboxItemIndicator>
//         <div ndsComboboxSeparator aria-hidden="true">
//       <div ndsComboboxEmpty>
//
// `role="combobox"` vai no INPUT, não num wrapper — é o padrão ARIA 1.2. O foco
// NUNCA sai do input enquanto a lista navega: a opção ativa é apontada por
// `aria-activedescendant` e realçada por `[data-highlighted]`.
//
// ─── O que o primitivo entrega ────────────────────────────────────────────────
//
// `@radix-ng/primitives/combobox` é um port do Base UI e cobre, sem nada disto
// reescrito aqui:
//
//   · `role="combobox"` + `aria-autocomplete="list"` + `aria-expanded` +
//     `aria-controls` + `aria-activedescendant` no input, todos apontando ids
//     REAIS, e `role="listbox"` / `role="option"` com `aria-selected`;
//   · filtro sensível ao locale, com o item fora do resultado saindo da árvore
//     de acessibilidade, e grupo que se esconde quando todos os filhos somem;
//   · ↓ ↑ percorrendo o modelo de DESTAQUE (o foco fica no input), Enter
//     escolhendo a opção ativa, Escape fechando, Tab fechando e saindo;
//   · Backspace com o input vazio removendo o último chip, e as setas
//     horizontais entrando na fila de chips;
//   · posicionamento por floating-ui com fuga de colisão, portal para o `body` e
//     desmonte ao fechar;
//   · `ControlValueAccessor` e `<input type="hidden">` irmão quando a raiz tem
//     `name`, para o valor entrar no `FormData` do `<form>`.
//
// ─── O que NÃO vem do primitivo (e por quê) ───────────────────────────────────
//
//   · DESTAQUE DA PRIMEIRA OPÇÃO VISÍVEL. O `autoHighlight` do primitivo nasce
//     desligado, e as outras quatro stacks destacam a primeira opção sempre que
//     a lista filtra — sem isso, digitar e apertar Enter não escolhe nada. Como
//     input de host directive não aceita valor padrão, o comportamento é regra
//     da raiz (ver `NdsCombobox`), e não opção que se possa desligar: ele é
//     contrato das cinco, não preferência.
//   · `Empty`. `RdxComboboxEmpty` é `@Component`, e `@Component` não pode ser
//     host directive. A região viva foi reescrita — são quatro atributos.
//   · `Separator`. O primitivo emite `role="separator"`, e separador não é filho
//     permitido de `role="listbox"`: o axe reprova por `aria-required-children`.
//     O divisor é decorativo, como no Vanilla, e sai da árvore com `aria-hidden`.
//   · Nome acessível do `role="listbox"`. A regra `aria-input-field-name` do axe
//     cobre listbox; o primitivo não nomeia a lista. Ela herda o rótulo do campo.
//   · `for` do `<label>`. O primitivo amarra rótulo e campo só por
//     `aria-labelledby`, então clicar no rótulo não levava o foco ao campo.
//   · Região viva da REMOÇÃO DE CHIP. Remover um chip é mudança de estado que
//     não move o foco: sem anúncio, quem não vê a tela não recebe nada.
//   · Troca de classe no lugar do atributo `hidden`. `[hidden] { display: none }`
//     é regra do NAVEGADOR e perde para `.nds-combobox-item { display: flex }`,
//     que é regra de autor — o item filtrado continuaria desenhado. `.nds-hidden`
//     é utilitário compartilhado, entra por último na folha e vence.
//
// ─── Divergências registradas (API/lib, não alinháveis) ───────────────────────
//
//   · O contêiner de chips do primitivo carrega `role="toolbar"`, que é o modelo
//     de teclado dele (chips navegáveis por seta). O Vanilla não tem contêiner.
//   · `Escape` com a lista JÁ FECHADA limpa o texto E a escolha no primitivo; o
//     Vanilla limpa só o texto.
//   · O `<input type="hidden">` do formulário é criado pelo primitivo como IRMÃO
//     da raiz, com `data-rdx-native-form-control` em vez de
//     `data-slot="combobox-hidden-input"`.
//   · Em modo simples o valor é uma string; na fábrica do Vanilla é sempre lista.
//     É divergência de API de framework — registrada, não alinhada.
//
// ─── Por que o miolo é um `<ng-template>` ─────────────────────────────────────
//
// Mesma decisão do Select: o miolo chega como `TemplateRef` e é instanciado
// DENTRO do popup, a cada abertura. Se viesse como elemento projetado, fechar
// removeria os nós do DOM sem destruir as diretivas — e é o desmonte que
// desregistra os itens do motor de filtragem.

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Lado preferido de abertura da lista em relação ao campo. */
export type ComboboxSide = 'top' | 'right' | 'bottom' | 'left';

/** Alinhamento da lista no eixo perpendicular ao `side`. */
export type ComboboxAlign = 'start' | 'center' | 'end';

// ─── Ícone ────────────────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

const CHEVRON_DOWN = ChevronDown as unknown as LucideIconNode[];

/**
 * O chevron do gatilho.
 *
 * O host é o próprio `<svg>`, então a regra `.nds-combobox-icon` dimensiona o
 * elemento real e não sobra wrapper. Os filhos nascem de `createElementNS`
 * porque cada ícone do lucide é uma lista `[tag, attrs]` com tag variável, e
 * template Angular exige tag estática. Construir nós é imune a XSS: não há
 * `innerHTML` no caminho.
 *
 * Os outros três desenhos do componente (o X do limpar, o X do remover chip e a
 * marca de escolhido) são escritos à mão no template de cada peça: eles não
 * fazem parte do contrato de slots, e passá-los por aqui daria a todos o
 * `data-slot="combobox-icon"` que só o chevron tem.
 */
@Component({
  selector: 'svg[ndsComboboxIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    // O chevron acompanha um botão que já é nomeado ("Abrir lista"). Repetir a
    // informação viraria eco no leitor de tela.
    'aria-hidden': 'true',
    class: 'nds-combobox-icon',
    '[attr.data-slot]': '"combobox-icon"',
  },
})
export class NdsComboboxIcon implements OnInit {
  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  ngOnInit(): void {
    const svg = this.hostRef.nativeElement;
    svg.replaceChildren();
    for (const [tag, attrs] of CHEVRON_DOWN) {
      const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, value);
      svg.appendChild(child);
    }
  }
}

// ─── Popup (o molde do miolo) ─────────────────────────────────────────────────

/**
 * O miolo da lista, guardado até a abertura.
 *
 * Guarda também as preferências de posicionamento, que a raiz lê e repassa ao
 * positioner. Elas moram aqui, e não na raiz, porque é da lista que se fala ao
 * dizer "abre para cima" — é o contrato das outras quatro stacks.
 */
@Directive({
  selector: 'ng-template[ndsComboboxPopup]',
  standalone: true,
})
export class NdsComboboxPopup {
  /** O molde do miolo. Injetado, não consultado: a diretiva ESTÁ no template. */
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  /** Lado preferido em relação ao campo. Vira o oposto quando não há espaço. */
  readonly side = input<ComboboxSide>('bottom');

  /** Alinhamento ao longo do eixo do `side`. */
  readonly align = input<ComboboxAlign>('start');

  /** Distância em pixels entre campo e lista. */
  readonly sideOffset = input(4, { transform: numberAttribute });

  /** Deslocamento em pixels a partir do alinhamento `start`/`end`. */
  readonly alignOffset = input(0, { transform: numberAttribute });
}

// ─── Outlet ───────────────────────────────────────────────────────────────────

/**
 * Instancia o molde do miolo DENTRO do popup, com o injetor do popup.
 *
 * `createEmbeddedView(..., { injector })` marca a view com esse injetor, e o
 * Angular o consulta ao esgotar os injetores de nó da própria view, ANTES de
 * subir para a árvore de declaração. Aqui as duas árvores chegam ao contexto da
 * raiz, então o injetor explícito é redundância barata — mas é a mesma peça que
 * o Select usa, e mantê-la igual evita que a próxima parte a exigir contexto do
 * popup descubra tarde que ela não estava lá.
 *
 * A view é criada em `ngOnInit`, e não num `effect`: assim os itens entram no
 * mesmo ciclo de detecção do popup, e o destaque da primeira opção já encontra
 * a lista montada. Um `input()` lido no construtor devolveria o default.
 */
@Directive({
  selector: 'ng-container[ndsComboboxOutlet]',
  standalone: true,
})
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera precisa IMPORTAR a classe, e símbolo não exportado quebra a
// geração (NG3004). Não é API pública — nenhum barril a reexporta.
export class NdsComboboxOutlet implements OnInit {
  readonly template = input.required<TemplateRef<unknown>>({ alias: 'ndsComboboxOutlet' });

  private readonly container = inject(ViewContainerRef);
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    this.container.createEmbeddedView(this.template(), undefined, { injector: this.injector });
  }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/** Normaliza o valor da raiz — simples ou múltiplo — para uma lista de strings. */
function toValueList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  return value === null || value === undefined ? [] : [String(value)];
}

/**
 * Raiz do Combobox — estado, valor, texto do campo, portal e posicionamento.
 *
 * `value`, `inputValue` e `open` são models do primitivo, então `[(value)]`,
 * `[(inputValue)]` e `[(open)]` funcionam. `name` faz a raiz manter um
 * `<input type="hidden">` irmão com o valor serializado — em modo múltiplo, uma
 * entrada por escolhido.
 *
 * `grid`, `virtualized`, `items`, `modal` e `selectionMode` ficam de fora: o
 * recorte de 16 partes exclui o que só o Base UI e o Radix NG sustentam, e expor
 * chave sem documentação nem contrapartida nas outras stacks só cria superfície
 * morta.
 */
@Component({
  selector: 'nds-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxComboboxPortal, RdxComboboxPositioner, RdxComboboxPopup, NdsComboboxOutlet],
  hostDirectives: [
    {
      directive: RdxComboboxRoot,
      // `invalid` NÃO aparece na lista de inputs do `ɵdir` do primitivo: ele vem
      // de `RdxFormUiControlBase` e chega por `usesInheritance: true`. Ler só
      // aquela lista levaria à conclusão errada de que a chave não existe.
      inputs: [
        'value',
        'defaultValue',
        'inputValue',
        'open',
        'defaultOpen',
        'multiple',
        'disabled',
        'readOnly',
        'required',
        'invalid',
        'name',
        'form',
        'filter',
        'locale',
        'limit',
        'loopFocus',
        'highlightItemOnHover',
        'openOnInputClick',
        'itemToStringLabel',
        'isItemEqualToValue',
      ],
      outputs: ['valueChange', 'inputValueChange', 'openChange'],
    },
  ],
  host: {
    // `nds-block` porque a raiz é um invólucro de estado com rótulo em cima do
    // campo: um elemento customizado nasce `display: inline` e jogaria rótulo e
    // caixa para a mesma linha. É o mesmo bloco que o `<div>` do Vanilla ocupa.
    class: 'nds-block',
    '[attr.data-slot]': '"combobox"',
    '[attr.data-state]': 'state()',
  },
  template: `
    <!--
      Uma \`<ng-content>\` só, sem seletor: o que precisa aparecer na página é o
      rótulo e a caixa do campo. O \`<ng-template>\` do miolo passa por aqui e
      não deixa nó nenhum — ele é instanciado lá embaixo, dentro do popup.
    -->
    <ng-content />

    <!--
      Região viva da remoção de chip. Fica montada o tempo todo: uma região viva
      só é lida quando o conteúdo muda DENTRO dela, então criá-la no instante da
      remoção não anunciaria nada.
    -->
    <span class="nds-sr-only" role="status" aria-live="polite">{{ announcement() }}</span>

    @if (popup(); as content) {
      <!--
        O portal teleporta o popup para o \`body\` ao abrir e o DESMONTA ao
        fechar. É o desmonte que desregistra os itens do motor de filtragem.
      -->
      <ng-template rdxComboboxPortal>
        <div
          rdxComboboxPositioner
          class="nds-combobox-positioner"
          data-slot="combobox-positioner"
          [side]="content.side()"
          [align]="content.align()"
          [sideOffset]="content.sideOffset()"
          [alignOffset]="content.alignOffset()"
        >
          <div
            rdxComboboxPopup
            class="nds-combobox-popup"
            data-slot="combobox-popup"
            [attr.data-state]="state()"
          >
            <ng-container [ndsComboboxOutlet]="content.templateRef" />
          </div>
        </div>
      </ng-template>
    }
  `,
})
export class NdsCombobox {
  /**
   * Sufixo do anúncio de remoção: "<rótulo do chip> <sufixo>".
   *
   * O texto é do produto, não do componente — quem traduz a página traduz isto
   * junto. O padrão espelha o que o Vanilla anuncia.
   */
  readonly removedLabel = input('removido');

  private readonly root = injectComboboxRootContext();

  /**
   * O molde do miolo.
   *
   * `descendants: true` porque o `<ng-template ndsComboboxPopup>` costuma vir
   * embrulhado — dentro de um `@if` de quem consome, por exemplo — e uma
   * consulta só de filhos diretos o perderia em silêncio, deixando o campo
   * abrir uma lista vazia.
   */
  protected readonly popup = contentChild(NdsComboboxPopup, { descendants: true });

  protected readonly state = computed(() => (this.root.open() ? 'open' : 'closed'));

  protected readonly announcement = signal('');

  /** Rótulo visível de cada chip montado, por valor — a fonte do anúncio. */
  private readonly chipLabels = new Map<string, string>();

  /** Escolhidos da última passada, para saber o que SAIU e anunciar o rótulo. */
  private previousValues: string[] = [];

  constructor() {
    /**
     * Destaque da primeira opção visível — o contrato das cinco stacks.
     *
     * O `autoHighlight` do primitivo nasce desligado, e sem destaque o Enter não
     * tem o que escolher: digitar "bra" e confirmar não faria nada. As
     * dependências são só `open` e `visibleCount`, e a leitura do destaque atual
     * é `untracked` de propósito — o primitivo LIMPA o destaque quando o
     * ponteiro sai da lista, e uma dependência ali faria o realce saltar de
     * volta para a primeira opção a cada saída do mouse.
     */
    effect(() => {
      const open = this.root.open();
      const visible = this.root.visibleCount();
      if (!open) return;
      untracked(() => {
        if (visible === 0) {
          // Sem opção alguma, `aria-activedescendant` apontaria um id que já não
          // existe — o leitor de tela anunciaria uma opção fantasma.
          this.root.clearHighlight();
          return;
        }
        if (this.root.highlightedItem() === null) this.root.highlightFirst();
      });
    });

    /**
     * Anúncio da remoção.
     *
     * Vale para os três gestos que tiram um escolhido — botão do chip, Backspace
     * com o texto vazio e Delete sobre o chip focado —, e por isso mora aqui, no
     * valor, e não no clique de nenhum deles.
     */
    effect(() => {
      const current = toValueList(this.root.value());
      const removed = untracked(() => this.previousValues.filter((v) => !current.includes(v)));
      this.previousValues = current;
      if (removed.length !== 1) return;
      const label = this.chipLabels.get(removed[0]) ?? this.root.labelFor(removed[0]) ?? removed[0];
      this.announcement.set(`${label} ${this.removedLabel()}`);
    });
  }

  /** @internal Chamado pelo `NdsComboboxChip` quando o chip termina de montar. */
  registerChipLabel(value: string, label: string): void {
    this.chipLabels.set(value, label);
  }
}

// ─── Label ────────────────────────────────────────────────────────────────────

/**
 * Rótulo acessível do campo.
 *
 * O primitivo publica o id do rótulo e o campo o referencia por
 * `aria-labelledby`. Falta o `for`: sem ele, clicar no rótulo não leva o foco ao
 * campo — que é metade do que um `<label>` existe para fazer.
 */
@Directive({
  selector: 'label[ndsComboboxLabel]',
  standalone: true,
  hostDirectives: [RdxComboboxLabel],
  host: {
    class: 'nds-combobox-label',
    '[attr.data-slot]': '"combobox-label"',
    '[attr.for]': 'inputId()',
  },
})
export class NdsComboboxLabel {
  private readonly root = injectComboboxRootContext();

  // O campo se registra no contexto ao nascer, e o rótulo costuma vir ANTES dele
  // no DOM: por isso é um computed sobre o signal, e não uma leitura única.
  protected readonly inputId = computed(() => this.root.inputElement()?.id ?? null);
}

// ─── InputWrapper ─────────────────────────────────────────────────────────────

/**
 * A caixa que contém chips e texto — é ela que parece um campo.
 *
 * A borda, o fundo e o anel de foco moram aqui, e não no `<input>`: o anel
 * envolve o CONJUNTO, porque quem tem foco de verdade é sempre o campo de texto
 * e um anel só nele deixaria os chips visualmente de fora da caixa que habitam.
 */
@Directive({
  selector: 'div[ndsComboboxInputWrapper]',
  standalone: true,
  host: {
    class: 'nds-combobox-input-wrapper',
    '[attr.data-slot]': '"combobox-input-wrapper"',
    '[attr.data-disabled]': 'root.disabledState() ? "" : null',
    '[attr.aria-invalid]': 'root.validState() === false ? "true" : null',
  },
})
export class NdsComboboxInputWrapper {
  protected readonly root = injectComboboxRootContext();
}

// ─── Chips ────────────────────────────────────────────────────────────────────

/**
 * Contêiner dos escolhidos, dentro da caixa do campo.
 *
 * `display: contents` na folha: um contêiner real criaria uma caixa de flex
 * própria e os chips deixariam de quebrar linha junto com o campo de texto.
 *
 * O `role="toolbar"` vem do primitivo e não tem par no Vanilla — é o modelo de
 * teclado dele, com os chips navegáveis por seta. Divergência registrada.
 */
@Directive({
  selector: 'div[ndsComboboxChips]',
  standalone: true,
  hostDirectives: [RdxComboboxChips],
  host: {
    class: 'nds-combobox-chips',
    '[attr.data-slot]': '"combobox-chips"',
  },
})
export class NdsComboboxChips {}

/**
 * Um escolhido.
 *
 * O texto projetado é embrulhado em `data-slot="combobox-chip-text"`, e o botão
 * de remover é puxado para fora desse embrulho pelo seletor — assim quem escreve
 * o chip só escreve rótulo e botão, e o DOM final é o do Vanilla.
 */
@Component({
  selector: 'span[ndsComboboxChip]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: RdxComboboxChip, inputs: ['value'] }],
  host: {
    class: 'nds-combobox-chip',
    '[attr.data-slot]': '"combobox-chip"',
    '[attr.data-value]': 'dataValue()',
    '[attr.data-disabled]': 'root.disabledState() ? "" : null',
  },
  template: `
    <span data-slot="combobox-chip-text"><ng-content /></span>
    <ng-content select="button[ndsComboboxChipRemove]" />
  `,
})
export class NdsComboboxChip {
  protected readonly root = injectComboboxRootContext();

  private readonly chip = inject(RdxComboboxChip, { self: true });
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly combobox = inject(NdsCombobox);

  protected readonly dataValue = computed(() => String(this.chip.value() ?? ''));

  constructor() {
    // O anúncio da remoção acontece DEPOIS de o chip sair do DOM, então o rótulo
    // precisa estar guardado antes. `afterNextRender` porque o conteúdo
    // projetado só existe depois do primeiro render.
    afterNextRender(() => {
      const text = this.hostRef.nativeElement
        .querySelector('[data-slot="combobox-chip-text"]')
        ?.textContent?.trim();
      this.combobox.registerChipLabel(this.dataValue(), text || this.dataValue());
    });
  }
}

/**
 * Botão de remover, dentro do chip.
 *
 * O nome acessível é PRÓPRIO — "Remover <rótulo>", nunca só "Remover": numa
 * lista de cinco chips, cinco botões com o mesmo nome são indistinguíveis para
 * quem navega por lista de controles. Quem escreve o chip passa o nome, e o
 * `aria-label="Remove"` estático do primitivo perde para o atributo do template
 * (o Angular funde os atributos do template POR ÚLTIMO).
 */
@Component({
  selector: 'button[ndsComboboxChipRemove]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [RdxComboboxChipRemove],
  host: {
    class: 'nds-combobox-chip-remove',
    '[attr.data-slot]': '"combobox-chip-remove"',
    '[attr.disabled]': 'root.disabledState() ? "" : null',
  },
  template: `
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
      <path d="M6 6l12 12" />
    </svg>
  `,
})
export class NdsComboboxChipRemove {
  protected readonly root = injectComboboxRootContext();
}

// ─── Input ────────────────────────────────────────────────────────────────────

/**
 * O texto de busca — e o elemento que carrega `role="combobox"`.
 *
 * Detém o foco o tempo todo: as setas movem o DESTAQUE, nunca o foco, e é o
 * `aria-activedescendant` que conta ao leitor de tela onde ele está.
 *
 * Nenhum `aria-*` é escrito aqui: o primitivo liga `aria-expanded`,
 * `aria-controls`, `aria-labelledby`, `aria-activedescendant`, `aria-invalid` e
 * `aria-disabled` por host binding, e binding de host sobrescreve o que estiver
 * no template. Marcar o campo como inválido é `[invalid]`, na raiz ou aqui.
 */
@Directive({
  selector: 'input[ndsComboboxInput]',
  standalone: true,
  hostDirectives: [{ directive: RdxComboboxInput, inputs: ['id', 'invalid'] }],
  host: {
    type: 'text',
    class: 'nds-combobox-input',
    '[attr.data-slot]': '"combobox-input"',
  },
})
export class NdsComboboxInput {}

// ─── Clear ────────────────────────────────────────────────────────────────────

/**
 * Limpa a escolha e o texto.
 *
 * Some quando não há o que limpar. O primitivo liga o atributo `hidden` para
 * isso, mas `[hidden] { display: none }` é regra do navegador e perde para
 * `.nds-combobox-clear { display: inline-flex }`, que é regra de autor — o botão
 * continuaria desenhado. `.nds-hidden` entra por último na folha e vence.
 */
@Component({
  selector: 'button[ndsComboboxClear]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: RdxComboboxClear, inputs: ['disabled'] }],
  host: {
    class: 'nds-combobox-clear',
    '[class.nds-hidden]': 'empty()',
    '[attr.data-slot]': '"combobox-clear"',
  },
  template: `
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
      <path d="M6 6l12 12" />
    </svg>
  `,
})
export class NdsComboboxClear {
  private readonly root = injectComboboxRootContext();

  protected readonly empty = computed(() => toValueList(this.root.value()).length === 0);
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Abre e fecha a lista, pelo clique e pelas setas.
 *
 * Fora da ordem de tabulação — o primitivo dá `tabindex="-1"` quando o campo
 * está fora do popup, que é sempre aqui: quem tem foco é o campo de texto, e o
 * Tab tem de sair dele, não parar num segundo alvo que faz o que a seta já faz.
 *
 * `aria-labelledby` é APAGADO de propósito. O primitivo o liga ao rótulo do
 * campo, e `aria-labelledby` vence `aria-label` no cálculo do nome acessível: o
 * botão passaria a se chamar "País" em vez de "Abrir lista", e a lista de
 * controles do leitor de tela mostraria dois elementos com o mesmo nome. Quem
 * escreve o gatilho passa o `aria-label`, como nas outras quatro stacks.
 */
@Directive({
  selector: 'button[ndsComboboxTrigger]',
  standalone: true,
  hostDirectives: [RdxComboboxTrigger],
  host: {
    class: 'nds-combobox-trigger',
    '[attr.data-slot]': '"combobox-trigger"',
    '[attr.aria-labelledby]': 'null',
  },
})
export class NdsComboboxTrigger {}

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * A lista de opções — `role="listbox"`, com o id que o `aria-controls` do campo
 * aponta.
 *
 * O nome acessível não vem do primitivo, e a regra `aria-input-field-name` do
 * axe cobre listbox: sem nome, a lista reprova. Ele é herdado do rótulo do campo
 * — assim campo e lista dizem a mesma coisa e não há um segundo texto para
 * traduzir. Sem rótulo, cai no `aria-label` do próprio campo.
 */
@Directive({
  selector: 'div[ndsComboboxList]',
  standalone: true,
  hostDirectives: [RdxComboboxList],
  host: {
    class: 'nds-combobox-list',
    '[attr.data-slot]': '"combobox-list"',
    '[attr.aria-labelledby]': 'labelId()',
    '[attr.aria-label]': 'fallbackLabel()',
  },
})
export class NdsComboboxList {
  private readonly root = injectComboboxRootContext();

  protected readonly labelId = computed(() => this.root.labelId() ?? null);

  protected readonly fallbackLabel = computed(() => {
    if (this.root.labelId()) return null;
    const field = this.root.inputElement();
    return field?.getAttribute('aria-label') || field?.placeholder || null;
  });
}

// ─── Item ─────────────────────────────────────────────────────────────────────

/**
 * Uma opção — `role="option"` com `aria-selected`.
 *
 * É um `<div>` e não um `<button>`, como no Select e pelo mesmo motivo: a folha
 * `.nds-combobox-item` não zera a aparência nativa de botão. O que a semântica
 * pede é papel, seleção e teclado — e num listbox o teclado é do CAMPO: os itens
 * não são focáveis um a um, o destaque anda por `aria-activedescendant`.
 *
 * O texto projetado é embrulhado em `data-slot="combobox-item-text"` e a marca
 * de escolhido é puxada para fora desse embrulho pelo seletor, como no chip.
 */
@Component({
  selector: 'div[ndsComboboxItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: RdxComboboxItem, inputs: ['value', 'textValue', 'disabled'] }],
  host: {
    class: 'nds-combobox-item',
    '[class.nds-hidden]': '!visible()',
    '[attr.data-slot]': '"combobox-item"',
    '[attr.data-value]': 'dataValue()',
  },
  template: `
    <span data-slot="combobox-item-text"><ng-content /></span>
    <ng-content select="span[ndsComboboxItemIndicator]" />
  `,
})
export class NdsComboboxItem {
  private readonly item = inject(RdxComboboxItem, { self: true });

  /** Se a opção sobreviveu ao filtro. Lido pelo grupo, que some sem opções. */
  readonly visible = computed(() => this.item.isVisible());

  protected readonly dataValue = computed(() => String(this.item.value() ?? ''));
}

/**
 * Marca de escolhido.
 *
 * Fica sempre no DOM: a folha esconde por `visibility` quando a opção não está
 * escolhida, e um ícone que entra e sai do DOM faria a largura do item pular a
 * cada mudança.
 */
@Component({
  selector: 'span[ndsComboboxItemIndicator]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [RdxComboboxItemIndicator],
  host: {
    class: 'nds-combobox-item-indicator',
    '[attr.data-slot]': '"combobox-item-indicator"',
  },
  template: `
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  `,
})
export class NdsComboboxItemIndicator {}

// ─── Group + GroupLabel ───────────────────────────────────────────────────────

/**
 * Agrupa opções de uma mesma categoria — `role="group"`, nomeado pelo cabeçalho.
 *
 * Some quando todas as suas opções saem do filtro; sem isso a lista mostraria
 * "Legumes" com nada embaixo. A conta é feita aqui, sobre as opções projetadas,
 * porque a do primitivo é `protected` e chega ao DOM pelo atributo `hidden` —
 * que perde para `.nds-combobox-group { display: block }`, regra de autor.
 */
@Component({
  selector: 'div[ndsComboboxGroup]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [RdxComboboxGroup],
  host: {
    class: 'nds-combobox-group',
    '[class.nds-hidden]': 'allFiltered()',
    '[attr.data-slot]': '"combobox-group"',
  },
  template: `<ng-content />`,
})
export class NdsComboboxGroup {
  private readonly items = contentChildren(NdsComboboxItem, { descendants: true });

  protected readonly allFiltered = computed(() => {
    const list = this.items();
    return list.length > 0 && !list.some((item) => item.visible());
  });
}

/**
 * Cabeçalho de um grupo de opções — não é interativo.
 *
 * O primitivo escreve o id aqui e o amarra ao `aria-labelledby` do grupo:
 * `role="group"` sem nome não agrupa nada para quem usa leitor de tela.
 */
@Directive({
  selector: 'div[ndsComboboxGroupLabel]',
  standalone: true,
  hostDirectives: [RdxComboboxGroupLabel],
  host: {
    class: 'nds-combobox-group-label',
    '[attr.data-slot]': '"combobox-group-label"',
  },
})
export class NdsComboboxGroupLabel {}

// ─── Separator ────────────────────────────────────────────────────────────────

/**
 * Divisor entre grupos — decorativo.
 *
 * `aria-hidden` de propósito, e sem o primitivo: ele emite `role="separator"`, e
 * separador não é filho permitido de `role="listbox"` (só `option` e `group`
 * são) — o axe reprova por `aria-required-children`. O que separa os blocos para
 * quem não vê a tela é o rótulo de cada grupo, não o traço. É o que o Vanilla
 * faz.
 */
@Directive({
  selector: 'div[ndsComboboxSeparator]',
  standalone: true,
  host: {
    class: 'nds-combobox-separator',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"combobox-separator"',
  },
})
export class NdsComboboxSeparator {}

// ─── Empty ────────────────────────────────────────────────────────────────────

/**
 * "Nenhum resultado" — e o ponto não é desenhar a frase, é ANUNCIÁ-LA.
 *
 * O elemento fica montado o tempo todo, com `role="status"` e `aria-live`: uma
 * região viva só é lida quando o conteúdo muda DENTRO dela. O que aparece e some
 * é o conteúdo projetado; a classe `.nds-combobox-empty`, que traz 24px de
 * `padding-block`, entra e sai junto para não deixar um vão embaixo da lista
 * cheia.
 *
 * Fica FORA do `<div ndsComboboxList>` de propósito: `role="status"` não é filho
 * permitido de `role="listbox"`, e o axe reprova por `aria-required-children`.
 */
@Component({
  selector: 'div[ndsComboboxEmpty]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"combobox-empty"',
    '[attr.data-empty]': 'empty() ? "" : null',
  },
  template: `
    @if (empty()) {
      <ng-content />
    }
  `,
})
export class NdsComboboxEmpty {
  private readonly root = injectComboboxRootContext();

  protected readonly empty = computed(() => this.root.visibleCount() === 0);

  protected readonly hostClass = computed(() => (this.empty() ? 'nds-combobox-empty' : ''));
}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/** A família inteira — para o `imports` de quem compõe. */
export const NDS_COMBOBOX = [
  NdsCombobox,
  NdsComboboxIcon,
  NdsComboboxPopup,
  NdsComboboxLabel,
  NdsComboboxInputWrapper,
  NdsComboboxChips,
  NdsComboboxChip,
  NdsComboboxChipRemove,
  NdsComboboxInput,
  NdsComboboxClear,
  NdsComboboxTrigger,
  NdsComboboxList,
  NdsComboboxItem,
  NdsComboboxItemIndicator,
  NdsComboboxGroup,
  NdsComboboxGroupLabel,
  NdsComboboxSeparator,
  NdsComboboxEmpty,
] as const;
