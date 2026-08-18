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
  computed,
  contentChild,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import {
  RdxSelectRoot,
  RdxSelectTrigger,
  RdxSelectValue,
  RdxSelectPortal,
  RdxSelectPositioner,
  RdxSelectPopup,
  RdxSelectList,
  RdxSelectItem,
  RdxSelectItemText,
  RdxSelectItemIndicator,
  RdxSelectGroup,
  RdxSelectSeparator,
  RdxSelectScrollUpButton,
  RdxSelectScrollDownButton,
  injectSelectRootContext,
} from '@radix-ng/primitives/select';
import { ChevronDown, ChevronUp, Check } from 'lucide';

// ─── Select ───────────────────────────────────────────────────────────────────
//
// Escolha de UM valor numa lista compacta. Diferente do DropdownMenu, que lista
// AÇÕES, aqui a lista tem valores: os papéis são `combobox` no gatilho e
// `listbox`/`option` na lista, o gatilho mostra o que está escolhido, e o
// conjunto é um CAMPO DE FORMULÁRIO — participa de `FormData`, de
// `formControlName` e de validação.
//
// Visual: bloco "composite" de docs/shared/styles/nds/select.css
// (`.nds-select-trigger`, `.nds-select-content`, `.nds-select-item`, …) — o
// único bloco de campo de escolha da folha compartilhada, e o que descreve este
// markup. Não existe classe para um `<select>` nativo de página: quem precisa de
// um traz classe própria (`.nds-calendar-select` e as da tabela de dados).
//
// ─── O que o primitivo entrega ────────────────────────────────────────────────
//
// `@radix-ng/primitives/select` cobre, e nada disso é reescrito aqui:
//
//   · `role="combobox"` + `type="button"` no gatilho e `role="listbox"` no
//     popup, com `aria-activedescendant` acompanhando o item destacado;
//   · `role="option"` com `aria-selected` e `aria-disabled` em cada item;
//   · o popup detém o foco do DOM e navega pelo MODELO DE DESTAQUE (setas,
//     Home/End, typeahead por letra) — os itens não são focáveis um a um, que é
//     o padrão WAI-ARIA de listbox e o oposto do menu;
//   · abertura por Enter, Espaço, ↑ e ↓ no gatilho; Escape fecha e devolve o
//     foco ao gatilho; clique fora fecha;
//   · posicionamento por floating-ui com fuga de colisão, portal para o `body` e
//     desmonte ao fechar;
//   · `ControlValueAccessor` (então `formControlName` e `ngModel` funcionam) e,
//     quando a raiz tem `name`, um `<input type="hidden">` irmão que leva o
//     valor no `FormData` do `<form>`;
//   · `aria-invalid` / `data-invalid` derivados do estado de validação, e
//     `aria-required` / `data-placeholder` no gatilho.
//
// ─── O que o primitivo NÃO entrega (e por que está aqui) ──────────────────────
//
//   · `aria-expanded` no gatilho. `role="combobox"` sem `aria-expanded` reprova
//     na regra `aria-required-attr` do axe e deixa o leitor de tela sem saber se
//     a lista está aberta. O estado existe no contexto da raiz; só faltava o
//     binding.
//   · `aria-haspopup="listbox"`, pelo mesmo motivo.
//   · nome acessível do `role="listbox"`. A regra `aria-input-field-name` do axe
//     vale para listbox: sem nome, o popup reprova. Derivamos do gatilho, que o
//     conteúdo compartilhado já obriga a nomear.
//   · o `id` do cabeçalho de grupo. `RdxSelectGroup` liga
//     `aria-labelledby` a um id gerado, mas `RdxSelectGroupLabel` não escreve
//     esse id em lugar nenhum — o `aria-labelledby` apontaria para um id
//     inexistente (`aria-valid-attr-value` no axe). `NdsSelectLabel` põe o id do
//     grupo no próprio cabeçalho, que é onde ele deveria estar.
//   · `data-state="open|closed"`. O Radix NG usa `data-open`/`data-closed`
//     (convenção do Base UI); as outras quatro stacks e a tabela de estados do
//     conteúdo compartilhado falam `data-state`. Emitimos os dois.
//
// ─── Por que o conteúdo é um `<ng-template>` ──────────────────────────────────
//
//   <nds-select>                        raiz: estado, portal, positioner, popup
//     <button ndsSelectTrigger>         gatilho (âncora do posicionamento)
//       <span ndsSelectValue>           valor escolhido ou placeholder
//     <ng-template ndsSelectContent>    o miolo da lista
//       <div ndsSelectItem value="sp">  opção
//
// Mesma decisão do DropdownMenu e do Popover: o miolo chega como `TemplateRef` e
// é instanciado DENTRO do popup, a cada abertura. Se ele viesse como elemento
// projetado, fechar removeria os nós do DOM sem destruir as diretivas — e é o
// desmonte que faz o gerenciador de foco devolver o foco ao gatilho.
//
// O preço é conhecido: a injeção de dependência de uma view embutida sobe pela
// árvore de DECLARAÇÃO, não pela de inserção. No DropdownMenu isso só custava o
// índice do item; aqui custaria o componente inteiro, porque `RdxSelectItem`
// exige o contexto do POPUP e lança sem ele. A saída é o `NdsSelectOutlet`
// abaixo: ele cria a view embutida passando o injetor do próprio popup, e o
// Angular consulta esse injetor ao chegar ao topo da view antes de subir para a
// árvore de declaração.

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Lado preferido de abertura da lista em relação ao gatilho. */
export type SelectSide = 'top' | 'right' | 'bottom' | 'left';

/** Alinhamento da lista no eixo perpendicular ao `side`. */
export type SelectAlign = 'start' | 'center' | 'end';

/** Altura do gatilho — resultado de `padding-block`, nunca de `height` fixo. */
export type SelectSize = 'default' | 'sm';

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Mesmo desenho do `NdsDropdownMenuIcon`: o host é o próprio `<svg>`, então as
// regras `.nds-select-trigger svg` e `.nds-select-item svg` dimensionam o
// elemento real e não sobra wrapper. Os filhos nascem de `createElementNS`
// porque cada ícone do lucide é uma lista `[tag, attrs]` com tag variável, e
// template Angular exige tag estática. Construir nós é imune a XSS: não há
// `innerHTML` no caminho.
//
// Não é exportado — serve só ao chevron do gatilho, aos botões de rolagem e ao
// indicador de item escolhido, todos montados aqui dentro.

type LucideIconNode = [string, Record<string, string>];

const SELECT_ICON_MAP = {
  chevronDown: ChevronDown as unknown as LucideIconNode[],
  chevronUp: ChevronUp as unknown as LucideIconNode[],
  check: Check as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsSelectIcon]',
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
    // O ícone acompanha um texto que já diz o que ele diz (o rótulo da opção, o
    // estado da lista). Repeti-lo viraria eco no leitor de tela.
    'aria-hidden': 'true',
  },
})
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera precisa IMPORTAR a classe, e símbolo não exportado quebra a
// geração (NG3004). Não é API pública — nenhum barril a reexporta.
export class NdsSelectIcon {
  readonly kind = input.required<keyof typeof SELECT_ICON_MAP>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of SELECT_ICON_MAP[this.kind()]) {
        const filho = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) filho.setAttribute(k, v);
        svg.appendChild(filho);
      }
    });
  }
}

// ─── Content ──────────────────────────────────────────────────────────────────

/**
 * O miolo da lista, guardado até a abertura.
 *
 * Guarda também as preferências de posicionamento, que a raiz lê e repassa ao
 * positioner. Elas moram aqui, e não na raiz, porque é da lista que se fala ao
 * dizer "abre para cima" — é o contrato das outras quatro stacks.
 */
@Directive({
  selector: 'ng-template[ndsSelectContent]',
  standalone: true,
})
export class NdsSelectContent {
  /** O molde da lista. Injetado, não consultado: a diretiva ESTÁ no template. */
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);

  /** Lado preferido em relação ao gatilho. Vira o oposto quando não há espaço. */
  readonly side = input<SelectSide>('bottom');

  /** Alinhamento ao longo do eixo do `side`. */
  readonly align = input<SelectAlign>('start');

  /** Distância em pixels entre gatilho e lista. */
  readonly sideOffset = input(4, { transform: numberAttribute });

  /** Deslocamento em pixels a partir do alinhamento `start`/`end`. */
  readonly alignOffset = input(0, { transform: numberAttribute });
}

// ─── Outlet ───────────────────────────────────────────────────────────────────

/**
 * Instancia o molde da lista DENTRO do popup, com o injetor do popup.
 *
 * É a peça que sustenta a escolha pelo `<ng-template>`. Sem o injetor
 * explícito, um `ngTemplateOutlet` comum criaria a view embutida e a resolução
 * de dependências dos itens subiria pela árvore de DECLARAÇÃO — que chega em
 * `<nds-select>` e nunca passa pelo popup. `RdxSelectItem` injeta o contexto do
 * popup sem `optional`, então a lista inteira lançaria em vez de renderizar.
 *
 * `createEmbeddedView(..., { injector })` marca a view com esse injetor, e o
 * Angular o consulta ao esgotar os injetores de nó da própria view, ANTES de
 * subir para a declaração (`lookupTokenUsingEmbeddedInjector`). Como o injetor
 * é o do `<ng-container>` que vive dentro do popup, o contexto do popup, a
 * lista composta e o contexto da raiz são todos encontrados.
 *
 * A view é criada em `ngOnInit`, e não num `effect`: assim os itens entram no
 * mesmo ciclo de detecção do popup, e o destaque do item escolhido — que o
 * primitivo calcula quando o floating-ui termina de posicionar — já encontra a
 * lista montada. Um `input()` lido no construtor devolveria o default.
 */
@Directive({
  selector: 'ng-container[ndsSelectOutlet]',
  standalone: true,
})
// Exportado por exigência do verificador de templates: o bloco de checagem que
// o compilador gera precisa IMPORTAR a classe, e símbolo não exportado quebra a
// geração (NG3004). Não é API pública — nenhum barril a reexporta.
export class NdsSelectOutlet implements OnInit {
  readonly molde = input.required<TemplateRef<unknown>>({ alias: 'ndsSelectOutlet' });

  private readonly container = inject(ViewContainerRef);
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    this.container.createEmbeddedView(this.molde(), undefined, { injector: this.injector });
  }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/**
 * Raiz do Select — estado, valor, portal e posicionamento.
 *
 * `value` e `open` são models do primitivo, então `[(value)]` e `[(open)]`
 * funcionam. `name` faz a raiz manter um `<input type="hidden">` irmão com o
 * valor serializado, que é o que põe o campo no `FormData` do `<form>` sem
 * `<select>` nenhum.
 *
 * `itemToStringLabel` entra na lista de inputs por um motivo concreto: os
 * rótulos das opções só existem enquanto a lista está montada, e a lista só
 * monta ao abrir. Um valor que chega ANTES da primeira abertura — `defaultValue`,
 * `formControlName` com valor inicial — não tem rótulo para exibir, e o gatilho
 * mostraria o valor cru ("sp" em vez de "São Paulo"). Quem tem valor e rótulo
 * diferentes passa a função e o gatilho fica correto desde o primeiro quadro.
 *
 * `multiple` fica de fora: o conteúdo compartilhado é explícito em mandar um
 * grupo de checkbox para escolha múltipla, e expor a chave sem a documentação
 * (nem o indicador visual de vários escolhidos) só criaria superfície morta.
 */
@Component({
  selector: 'nds-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RdxSelectPortal,
    RdxSelectPositioner,
    RdxSelectPopup,
    RdxSelectList,
    RdxSelectScrollUpButton,
    RdxSelectScrollDownButton,
    NdsSelectOutlet,
    NdsSelectIcon,
  ],
  hostDirectives: [
    {
      directive: RdxSelectRoot,
      inputs: [
        'value',
        'defaultValue',
        'open',
        'defaultOpen',
        'disabled',
        'readOnly',
        'required',
        'invalid',
        'name',
        'form',
        'modal',
        'itemToStringLabel',
      ],
      outputs: ['valueChange', 'openChange'],
    },
  ],
  host: {
    // `nds-inline-block` porque a raiz é só um invólucro de estado: sem ele um
    // elemento de bloco jogaria o gatilho para uma linha só dele. A classe já
    // existe no CSS compartilhado — mesma saída do Popover.
    class: 'nds-inline-block',
    '[attr.data-slot]': '"select"',
    '[attr.data-state]': 'estado()',
  },
  template: `
    <!--
      Uma \`<ng-content>\` só, sem seletor: o que precisa aparecer na página é o
      gatilho. O \`<ng-template>\` do conteúdo passa por aqui e não deixa nó
      nenhum — ele é instanciado lá embaixo, dentro do popup.
    -->
    <ng-content />

    @if (conteudo(); as lista) {
      <!--
        O portal teleporta o popup para o \`body\` ao abrir e o DESMONTA ao
        fechar. É o desmonte que devolve o foco ao gatilho.
      -->
      <ng-template rdxSelectPortal>
        <div
          rdxSelectPositioner
          class="nds-select-positioner"
          [side]="lista.side()"
          [align]="lista.align()"
          [sideOffset]="lista.sideOffset()"
          [alignOffset]="lista.alignOffset()"
        >
          <div
            rdxSelectPopup
            class="nds-select-content"
            data-slot="select-content"
            data-align-trigger="false"
            [finalFocus]="gatilho()"
            [attr.data-state]="estado()"
            [attr.aria-label]="rotuloDaLista()"
          >
            <div
              rdxSelectScrollUpButton
              class="nds-select-scroll-button"
              data-slot="select-scroll-up-button"
            >
              <svg ndsSelectIcon kind="chevronUp"></svg>
            </div>

            <div rdxSelectList class="nds-select-viewport" data-slot="select-viewport">
              <ng-container [ndsSelectOutlet]="lista.templateRef" />
            </div>

            <div
              rdxSelectScrollDownButton
              class="nds-select-scroll-button"
              data-slot="select-scroll-down-button"
            >
              <svg ndsSelectIcon kind="chevronDown"></svg>
            </div>
          </div>
        </div>
      </ng-template>
    }
  `,
})
export class NdsSelect {
  private readonly raiz = injectSelectRootContext();

  /**
   * O molde da lista.
   *
   * `descendants: true` porque o `<ng-template ndsSelectContent>` costuma vir
   * embrulhado — dentro de um `@if` de quem consome, por exemplo — e uma
   * consulta só de filhos diretos o perderia em silêncio, deixando o gatilho
   * abrir uma lista vazia.
   */
  protected readonly conteudo = contentChild(NdsSelectContent, { descendants: true });

  protected readonly estado = computed(() => (this.raiz.open() ? 'open' : 'closed'));

  /**
   * Para onde o foco volta quando a lista fecha.
   *
   * Sem isto o foco cai no `<body>` — e não por descuido do gerenciador de foco:
   * o gatilho do primitivo dá `preventDefault()` no `pointerdown` justamente
   * para não roubar o foco da lista que está abrindo, então numa abertura por
   * mouse ele NUNCA chega a ser o elemento focado. O escopo devolve o foco a
   * "quem estava focado antes de montar", que nesse caminho é o corpo do
   * documento: quem navega por teclado teria de percorrer a página inteira de
   * novo para voltar ao campo (WCAG 2.4.3).
   *
   * `finalFocus` é a costura do próprio primitivo para isso — um alvo explícito,
   * resolvido no quadro seguinte ao desmonte. É também o comportamento que o
   * conteúdo compartilhado promete em três idiomas, e o das outras stacks.
   */
  protected readonly gatilho = computed(() => this.raiz.triggerElement());

  /**
   * Nome acessível do `role="listbox"`.
   *
   * A regra `aria-input-field-name` do axe cobre listbox: um popup sem nome
   * reprova. O nome sai do gatilho — que o conteúdo compartilhado já obriga a
   * nomear com `aria-label` ou `aria-labelledby` —, então a lista e o campo
   * dizem a mesma coisa e não há um segundo texto para traduzir.
   *
   * Lê `open()` de propósito: o gatilho só é registrado no contexto depois do
   * primeiro render, e é a abertura que precisa reavaliar isto.
   */
  protected readonly rotuloDaLista = computed<string | null>(() => {
    this.raiz.open();
    const gatilho = this.raiz.triggerElement();
    if (!gatilho) return null;

    const rotulo = gatilho.getAttribute('aria-label')?.trim();
    if (rotulo) return rotulo;

    const ids = gatilho.getAttribute('aria-labelledby')?.trim();
    if (ids) {
      const texto = ids
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' ');
      if (texto) return texto;
    }

    // Último recurso: o texto do gatilho. Quando ele não tem nome nenhum o
    // campo inteiro já está errado — mas a lista herdar o valor exibido é
    // melhor do que ficar anônima.
    return gatilho.textContent?.trim() || null;
  });

  constructor() {
    /**
     * Desarma o "engole o primeiro pointerup" quando a lista NÃO foi aberta com
     * o dedo no botão.
     *
     * O primitivo arma, ao abrir, um ouvinte de `pointerup` em captura no
     * documento que dá `preventDefault()` na primeira soltura — e o item ignora
     * um `pointerup` já cancelado. É correto para o gesto de apertar o gatilho,
     * arrastar até a opção e soltar: sem isso, a soltura do próprio clique que
     * abriu já escolheria a opção que estivesse sob o cursor.
     *
     * O problema é que o registro da posição do ponteiro nasce em `{x:0, y:0}`,
     * e não em `null`. Numa abertura por TECLADO (Enter, Espaço, setas) ou por
     * estado (`defaultOpen`, `[open]`) não houve soltura para engolir — então a
     * engolida sobra para o PRIMEIRO CLIQUE em uma opção, que simplesmente não
     * faz nada. Sem erro: a lista continua aberta e o segundo clique funciona.
     *
     * Abrir por teclado e escolher com o mouse é uso corriqueiro; um campo que
     * ignora o primeiro clique é defeito. Zerar o registro quando a abertura não
     * veio de ponteiro devolve o comportamento sem tocar no gesto de arrastar.
     */
    effect(() => {
      if (!this.raiz.open()) return;
      const abertura = this.raiz.openMethod();
      if (abertura === 'mouse' || abertura === 'touch' || abertura === 'pen') return;
      this.raiz.triggerPointerDownPosRef.set(null);
    });
  }
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

/**
 * Botão que abre a lista e mostra o que está escolhido.
 *
 * Vive num `<button>` nativo. Não se compõe com `ndsButton`: `.nds-select-trigger`
 * já desenha a caixa de campo (borda de `--input`, anel de foco, estado
 * inválido) e as duas folhas brigariam por fundo e padding — além de as duas
 * diretivas disputarem `data-slot`.
 *
 * O chevron entra pelo template, como nas outras stacks, para quem escreve não
 * precisar lembrar dele.
 */
@Component({
  selector: 'button[ndsSelectTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsSelectIcon],
  hostDirectives: [{ directive: RdxSelectTrigger, inputs: ['id', 'disabled'] }],
  host: {
    class: 'nds-select-trigger',
    '[attr.data-slot]': '"select-trigger"',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'estado()',
    // Os dois que faltam no primitivo. `role="combobox"` sem `aria-expanded`
    // reprova em `aria-required-attr` e deixa quem usa leitor de tela sem saber
    // se a lista está aberta.
    'aria-haspopup': 'listbox',
    '[attr.aria-expanded]': 'raiz.open()',
  },
  template: `
    <ng-content />
    <svg ndsSelectIcon kind="chevronDown" class="nds-select-trigger-icon"></svg>
  `,
})
export class NdsSelectTrigger {
  /** Altura do gatilho. Sai de `padding-block`, nunca de `height` fixo. */
  readonly size = input<SelectSize>('default');

  protected readonly raiz = injectSelectRootContext();

  protected readonly estado = computed(() => (this.raiz.open() ? 'open' : 'closed'));
}

// ─── Value ────────────────────────────────────────────────────────────────────

/**
 * O texto do gatilho: o rótulo da opção escolhida, ou o placeholder.
 *
 * O primitivo é uma diretiva sem template — ele CALCULA o texto e o expõe, mas
 * não o escreve. Aqui o componente escreve, para que o markup de quem consome
 * seja só `<span ndsSelectValue placeholder="Selecione...">` como nas outras
 * stacks.
 *
 * O placeholder não vira texto cinza por conta própria: quem pinta é
 * `.nds-select-trigger[data-placeholder]`, e o atributo é do primitivo.
 */
@Component({
  selector: 'span[ndsSelectValue]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [{ directive: RdxSelectValue, inputs: ['placeholder'] }],
  host: {
    class: 'nds-select-value',
    '[attr.data-slot]': '"select-value"',
  },
  template: `{{ texto() }}`,
})
export class NdsSelectValue {
  private readonly valor = inject(RdxSelectValue, { self: true });

  protected readonly texto = computed(() => this.valor.slotText() ?? '');
}

// ─── Group + Label ────────────────────────────────────────────────────────────

/** Agrupa opções de uma mesma categoria — `role="group"`, nomeado pelo Label. */
@Directive({
  selector: 'div[ndsSelectGroup]',
  standalone: true,
  hostDirectives: [RdxSelectGroup],
  host: {
    class: 'nds-select-group',
    '[attr.data-slot]': '"select-group"',
  },
})
export class NdsSelectGroup {}

/**
 * Cabeçalho de um grupo de opções — não é interativo.
 *
 * `RdxSelectGroup` liga `aria-labelledby` a um id que gera, mas
 * `RdxSelectGroupLabel` não escreve esse id em elemento nenhum: o
 * `aria-labelledby` apontaria para um id que não existe, que é violação de
 * `aria-valid-attr-value`. O id do grupo vai no cabeçalho, que é onde o
 * `aria-labelledby` já esperava encontrá-lo.
 *
 * O grupo é injetado em modo opcional porque cabeçalho solto é uso legítimo —
 * uma lista curta com um título e nada de categorias.
 */
@Directive({
  selector: 'div[ndsSelectLabel]',
  standalone: true,
  host: {
    class: 'nds-select-label',
    '[attr.id]': 'idDoGrupo',
    '[attr.data-slot]': '"select-label"',
  },
})
export class NdsSelectLabel {
  private readonly grupo = inject(RdxSelectGroup, { optional: true });

  protected readonly idDoGrupo = this.grupo?.id ?? null;
}

// ─── Separator ────────────────────────────────────────────────────────────────

/** Divide grupos de opções — `role="separator"` e `aria-hidden`. */
@Directive({
  selector: 'div[ndsSelectSeparator]',
  standalone: true,
  hostDirectives: [RdxSelectSeparator],
  host: {
    class: 'nds-select-separator',
    '[attr.data-slot]': '"select-separator"',
  },
})
export class NdsSelectSeparator {}

// ─── Item ─────────────────────────────────────────────────────────────────────

/**
 * Uma opção — `role="option"` com `aria-selected`.
 *
 * É um `<div>` e não um `<button>`, como no DropdownMenu e pelo mesmo motivo: a
 * folha `.nds-select-item` não zera a aparência nativa de botão, e um
 * `<button>` ali apareceria com fundo e borda do navegador. O que a semântica
 * pede é papel, seleção e teclado — e num listbox o teclado é do POPUP: os
 * itens não são focáveis um a um, o destaque anda por `aria-activedescendant`.
 * Um `<button>` aqui só acrescentaria paradas de Tab que o padrão não prevê.
 *
 * O indicador de escolha entra pelo template. `RdxSelectItemIndicator` esconde o
 * `<span>` com `hidden` quando o item não está escolhido, então nada pisca.
 */
@Component({
  selector: 'div[ndsSelectItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxSelectItemText, RdxSelectItemIndicator, NdsSelectIcon],
  hostDirectives: [
    { directive: RdxSelectItem, inputs: ['value', 'textValue', 'disabled'] },
  ],
  host: {
    class: 'nds-select-item',
    '[attr.data-slot]': '"select-item"',
  },
  template: `
    <span rdxSelectItemText class="nds-select-item-text" data-slot="select-item-text">
      <ng-content />
    </span>

    <span
      rdxSelectItemIndicator
      class="nds-select-item-indicator"
      data-slot="select-item-indicator"
    >
      <svg ndsSelectIcon kind="check"></svg>
    </span>
  `,
})
export class NdsSelectItem {}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/** A família inteira — para o `imports` de quem compõe. */
export const NDS_SELECT = [
  NdsSelect,
  NdsSelectTrigger,
  NdsSelectValue,
  NdsSelectContent,
  NdsSelectGroup,
  NdsSelectLabel,
  NdsSelectSeparator,
  NdsSelectItem,
] as const;
