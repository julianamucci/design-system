import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  numberAttribute,
  ViewEncapsulation,
} from '@angular/core';
import { RdxCompositeRoot } from '@radix-ng/primitives/composite';
import { provideToggleGroupContext } from '@radix-ng/primitives/toggle-group';
import type { ToggleVariant } from './toggle';

// ─── Toggle Group ─────────────────────────────────────────────────────────────
//
// Visual: classe .nds-toggle-group (docs/shared/styles/nds/toggle-group.css).
// Os itens são `<button ndsToggle value="…">` — o MESMO componente do slug
// `toggle`, sem subclasse nem cópia: o grupo não redesenha o botão, ele só
// passa a decidir quem está pressionado.
//
// COM `RdxCompositeRoot` + `provideToggleGroupContext`, e não com
// `RdxToggleGroup`. A diferença não é de gosto:
//
//   · `RdxToggleGroup` decide entre exclusivo e combinado por um input
//     `multiple` de transform booleano, e `value` dele é SEMPRE `string[]`.
//     Input de host directive não se escreve por código — só por binding no
//     elemento — então `type="single|multiple"` e `value: string | string[]`,
//     que é o contrato documentado do design system, ficariam impossíveis:
//     'single' e 'multiple' são ambos truthy, e o grupo nasceria combinado.
//   · `RdxCompositeRoot` tem SETTERS públicos (`setOrientation`, `setLoopFocus`,
//     `setDisabledIndices`, `setHighlightedIndex`) — é a peça pensada para ser
//     dirigida por quem compõe, e é dela que vem tudo o que importa aqui:
//     roving tabindex, setas conforme a orientação, Home/End, laço na ponta e
//     o pulo dos itens desabilitados.
//   · `provideToggleGroupContext` é o contrato público que o `RdxToggle` já
//     procura: achando o contexto, cada item deriva `pressedState` (e portanto
//     `aria-pressed` e o `data-state` do NdsToggle) do valor do GRUPO, e o
//     clique/Space/Enter passa a chamar `toggle()` daqui em vez de alternar
//     sozinho. Nada de estado é reimplementado no item.
//
// Ou seja: do primitivo vêm o teclado e a derivação de estado; deste arquivo
// vêm só a forma do valor (string ou lista) e as classes do design system.

export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

/** Valor de um grupo: string no modo exclusivo, lista no modo combinado. */
export type ToggleGroupValue = string | string[];

@Directive({
  selector: 'div[ndsToggleGroup]',
  standalone: true,
  // Lista de inputs vazia de propósito (armadilha 7 do CLAUDE.md): o
  // `RdxCompositeRoot` também expõe um input `orientation`, e expô-lo aqui
  // faria o mesmo atributo alimentar dois donos com semânticas diferentes
  // ('both' é válido lá e não aqui). Quem escreve nele é o `effect` abaixo.
  hostDirectives: [RdxCompositeRoot],
  providers: [
    provideToggleGroupContext(() => {
      const grupo = inject(NdsToggleGroup);
      return {
        value: grupo.valoresSelecionados,
        disabled: grupo.disabled,
        orientation: grupo.orientation,
        isValueInitialized: grupo.valorInicializado,
        toggle: (valor: string, proximo: boolean) => grupo.alternar(valor, proximo),
      };
    }),
  ],
  host: {
    class: 'nds-toggle-group',
    // `toolbar` e não `group`: o contrato do CSS e das outras stacks é o do
    // WAI-ARIA APG — um único item na ordem de tabulação e setas navegando
    // dentro do conjunto. É exatamente o que o composite entrega, então o
    // anúncio "barra de ferramentas" é verdadeiro.
    role: 'toolbar',
    '[attr.data-slot]': '"toggle-group"',
    // `default` não vira atributo: o CSS trata a ausência como padrão e o
    // Vanilla, que é a referência de markup, também o omite.
    '[attr.data-variant]': 'variant() === "default" ? null : variant()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-spacing]': 'atributoSpacing()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
})
export class NdsToggleGroup {
  /** Exclusivo (`single`) ou combinado (`multiple`). Define a forma de `value`. */
  readonly type = input<ToggleGroupType>('single');

  /**
   * Seleção controlada. `model`, então aceita `[(value)]` e emite `valueChange`
   * com a MESMA forma que entrou: string no modo exclusivo, lista no combinado.
   */
  readonly value = model<ToggleGroupValue | undefined>(undefined);

  /** Seleção inicial não-controlada. */
  readonly defaultValue = input<ToggleGroupValue | undefined>(undefined);

  /** Desabilita o grupo inteiro — cada item herda pelo contexto. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Direção da navegação por setas e do empilhamento visual. */
  readonly orientation = input<ToggleGroupOrientation>('horizontal');

  /** Estilo visual do conjunto. `outline` emenda os itens num container só. */
  readonly variant = input<ToggleVariant>('default');

  /**
   * Distância entre os itens. `0` emenda as bordas (visual segmentado);
   * qualquer valor maior separa os botões.
   *
   * A escada fina não existe no CSS compartilhado: a regra
   * `.nds-toggle-group[data-spacing]` calcula o gap a partir de uma custom
   * property `--gap` que só um style inline consegue definir — e style inline
   * é proibido neste stack. Enquanto a folha não ganhar a regra por valor
   * (`[data-spacing="1"] { --gap: 1 }` …), o atributo só é emitido no caso
   * `0`; acima disso ele fica de fora e vale o `gap: var(--spacing-1)` da
   * regra base, que é o mesmo espaçamento que o Vanilla mostra.
   */
  readonly spacing = input(0, { transform: numberAttribute });

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly composite = inject(RdxCompositeRoot, { self: true });

  protected readonly atributoSpacing = computed(() => (this.spacing() === 0 ? '0' : null));

  /**
   * Sempre lista, mesmo no modo exclusivo — é a forma que o `RdxToggle` lê para
   * decidir se está pressionado. A forma pública (`value`) continua sendo a
   * documentada; a conversão mora aqui, num lugar só.
   */
  readonly valoresSelecionados = computed<string[]>(() => {
    const bruto = this.value() ?? this.defaultValue();
    if (bruto === undefined) return [];
    if (Array.isArray(bruto)) return [...bruto];
    return bruto === '' ? [] : [bruto];
  });

  /**
   * O primitivo avisa em dev quando um item entra num grupo sem `value`; o
   * aviso só faz sentido depois que o grupo tem seleção definida por alguém.
   */
  readonly valorInicializado = computed(
    () => this.value() !== undefined || this.defaultValue() !== undefined,
  );

  /**
   * Índices que as setas devem pular. O `RdxToggle` publica
   * `{ disabled, value }` como metadado do seu item de composite; ler dali (e
   * não do DOM) é o que mantém a lista correta quando um item nasce ou some.
   */
  private readonly indicesDesabilitados = computed(() =>
    Array.from(this.composite.itemMap().values())
      .filter((meta) => meta['disabled'] === true)
      .map((meta) => meta.index),
  );

  private readonly indiceAtivo = computed(() => {
    const selecionados = this.valoresSelecionados();
    if (selecionados.length === 0) return -1;
    const itens = Array.from(this.composite.itemMap().values());
    return itens.find((meta) => selecionados.includes(meta['value'] as string))?.index ?? -1;
  });

  constructor() {
    effect(() => {
      this.composite.setOrientation(this.orientation());
      // Home/End estão na tabela de teclado do conteúdo compartilhado, e o
      // laço na ponta é o comportamento circular que o Vanilla implementa.
      this.composite.setEnableHomeAndEndKeys(true);
      this.composite.setLoopFocus(true);
    });

    effect(() => {
      this.composite.setDisabledIndices(this.indicesDesabilitados());
    });

    // Tab entra no item selecionado, não no primeiro — senão a pessoa tabula
    // para dentro do grupo e cai num item diferente do que está ativo. Só
    // enquanto o foco está FORA do grupo: com o foco dentro, quem manda é a
    // navegação por setas, e reposicionar aqui roubaria o foco dela.
    effect(() => {
      const active = this.indiceAtivo();
      if (active === -1 || this.indicesDesabilitados().includes(active)) return;
      const focado = this.hostRef.nativeElement.ownerDocument.activeElement;
      if (focado && this.hostRef.nativeElement.contains(focado)) return;
      this.composite.setHighlightedIndex(active);
    });
  }

  /**
   * Aplica a decisão do item ao valor do grupo. Quem calcula o próximo estado
   * pressionado é o `RdxToggle` (paridade com o Base UI); aqui só se mapeia
   * esse booleano para a seleção, respeitando a forma do modo.
   */
  alternar(valor: string, proximo: boolean): void {
    if (this.disabled()) return;

    const atual = this.valoresSelecionados();

    if (this.type() === 'multiple') {
      const lista = proximo
        ? atual.includes(valor)
          ? atual
          : [...atual, valor]
        : atual.filter((item) => item !== valor);
      this.value.set(lista);
      return;
    }

    this.value.set(proximo ? valor : '');
  }
}

// ─── Ícones ───────────────────────────────────────────────────────────────────
//
// Mesmo mecanismo do `NdsToggleIcon` — host `<svg>`, filhos criados por
// `createElementNS` — mas com o conjunto que faltava. `NdsToggleIcon` cobre
// bold/italic/underline/list/eye e continua sendo o usado nesses casos; os
// exemplos canônicos do toggle-group (barra de alinhamento, modo de
// visualização) pedem alinhamento e grade, que não existem lá. Este arquivo
// acrescenta só a diferença, em vez de duplicar o conjunto inteiro.

import { AlignLeft, AlignCenter, AlignRight, AlignJustify, LayoutGrid } from 'lucide';

export type ToggleGroupIconKind =
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'grid';

type LucideIconNode = [string, Record<string, string>];

const TOGGLE_GROUP_ICON_MAP: Record<ToggleGroupIconKind, LucideIconNode[]> = {
  'align-left':    AlignLeft    as unknown as LucideIconNode[],
  'align-center':  AlignCenter  as unknown as LucideIconNode[],
  'align-right':   AlignRight   as unknown as LucideIconNode[],
  'align-justify': AlignJustify as unknown as LucideIconNode[],
  grid:            LayoutGrid   as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsToggleGroupIcon]',
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
    // O ícone reforça o rótulo, nunca o substitui: quem compõe dá o nome
    // acessível no `aria-label` do botão (icon-only) ou no texto visível.
    'aria-hidden': 'true',
  },
})
export class NdsToggleGroupIcon {
  readonly kind = input.required<ToggleGroupIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of TOGGLE_GROUP_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}
