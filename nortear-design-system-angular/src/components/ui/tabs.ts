import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  RdxTabsRoot,
  RdxTabsList,
  RdxTabsTab,
  RdxTabsPanel,
  injectTabsRootContext,
} from '@radix-ng/primitives/tabs';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-tabs, .nds-tabs-list, .nds-tabs-trigger e
// .nds-tabs-content (docs/shared/styles/nds/tabs.css).
//
// COM os primitivos do Radix NG, e aqui eles contribuem quase tudo o que o
// Vanilla escreve à mão, tecla por tecla:
//
//   · roving tabindex — só a aba ativa é alcançável por Tab, o resto sai do
//     percurso (o `RdxCompositeRoot` por baixo do `[rdxTabsList]`);
//   · setas ← → (horizontal) e ↑ ↓ (vertical) conforme a orientação da raiz,
//     mais Home/End, com laço no fim da lista;
//   · `role="tablist" | "tab" | "tabpanel"`, `aria-selected`, `aria-controls`,
//     `aria-labelledby` e `aria-orientation`, todos derivados do valor ativo —
//     o Vanilla precisa gerar par de ids e reescrever os atributos na mão;
//   · ativação automática (a seta já troca de aba) ou manual (a seta só move o
//     foco; Enter/Space troca), que é o `activationMode` do conteúdo;
//   · `hidden` no painel inativo e `tabindex` 0/-1 no painel, para o Tab
//     seguinte cair dentro do conteúdo.
//
// TUDO É DIRETIVA DE ATRIBUTO em elemento nativo, como no Progress e no Card: o
// Vanilla — referência de markup — renderiza `<div>` e `<button>`, e markup é o
// que a auditoria cross-stack compara. Um `<nds-tabs>` teria a mesma classe e o
// mesmo `data-slot`, mas outra TAG.
//
// Nenhuma das quatro tem template: só aplicam classe, `data-slot` e o primitivo
// ao elemento que já existe. `@Directive`, portanto — um `@Component` com
// `template: '<ng-content />'` criaria view e ciclo de detecção para reprojetar
// exatamente os mesmos filhos.
//
// ─── O que NÃO vem do primitivo ───────────────────────────────────────────────
//
// `data-state="active|inactive"` no trigger. O Radix NG emite `data-active`
// (presença, convenção do Base UI) e as outras quatro stacks emitem
// `data-state`. O CSS compartilhado aceita os dois, mas a paridade de markup é o
// que a auditoria cross-stack compara — então emitimos os dois de propósito,
// mesma decisão do Checkbox e do RadioGroup.
//
// `data-variant` na lista, que é o seletor da variante `line` no CSS. É estilo,
// não comportamento: o primitivo não tem (nem deveria ter) opinião sobre isso.
//
// ─── Desabilitado ─────────────────────────────────────────────────────────────
//
// O primitivo apaga o atributo `disabled` nativo do botão (`[attr.disabled]` fica
// `null`) e marca `aria-disabled="true"` + `data-disabled`. É de propósito: o
// padrão WAI-ARIA de tabs manda a seta PODER pousar numa aba desabilitada, e um
// `<button disabled>` sai do alcance do foco. O bloqueio do clique vem do
// `pointer-events: none` que o CSS aplica em `[aria-disabled="true"]`.

/** Orientação da navegação por setas e do layout. */
export type TabsOrientation = 'horizontal' | 'vertical';

/** Estilo visual da lista de abas. */
export type TabsListVariant = 'default' | 'line';

/** Como a seta troca de aba: já ativando, ou só movendo o foco. */
export type TabsActivationMode = 'automatic' | 'manual';

/**
 * Raiz — guarda a aba ativa e a orientação.
 *
 * `value` é model do primitivo, então `[(value)]` funciona; `defaultValue`
 * cobre o uso não-controlado. Sem nenhum dos dois, o primitivo seleciona a
 * primeira aba habilitada.
 */
@Directive({
  selector: 'div[ndsTabs]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxTabsRoot,
      inputs: ['value', 'defaultValue', 'orientation'],
      outputs: ['valueChange', 'onValueChange'],
    },
  ],
  host: {
    class: 'nds-tabs',
    '[attr.data-slot]': '"tabs"',
    // `data-orientation` NÃO entra aqui: o próprio `RdxTabsRoot` liga o atributo
    // a `orientation()`. Repetir a ligação neste host seria duas fontes
    // disputando o mesmo atributo.
  },
})
export class NdsTabs {}

/**
 * Lista de abas — `role="tablist"`, navegação por setas e Home/End.
 */
@Directive({
  selector: 'div[ndsTabsList]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxTabsList,
      // `activateOnFocus` fica FORA da lista de propósito: quem responde por
      // ativação neste stack é `activationMode`, que é o nome do contrato das
      // cinco stacks (ver o `effect` abaixo). Deixá-lo exposto daria dois jeitos
      // de dizer a mesma coisa, com o segundo vencendo em silêncio.
      inputs: ['loopFocus'],
    },
  ],
  host: {
    class: 'nds-tabs-list',
    '[attr.data-slot]': '"tabs-list"',
    '[attr.data-variant]': 'variant()',
  },
})
export class NdsTabsList {
  /**
   * `default` — trilho com fundo `muted` e a aba ativa em relevo.
   * `line` — sem trilho, com linha sob (ou ao lado d)a aba ativa.
   *
   * O atributo é sempre escrito, inclusive no default: é assim que as outras
   * stacks emitem, e a auditoria cross-stack compara markup.
   */
  readonly variant = input<TabsListVariant>('default');

  /**
   * `automatic` (padrão) — a seta já troca de aba.
   * `manual` — a seta só move o foco; Enter ou Space troca.
   */
  readonly activationMode = input<TabsActivationMode>('automatic');

  // A raiz vem do elemento pai (a lista é filha do `div[ndsTabs]`).
  private readonly raiz = inject(RdxTabsRoot);

  constructor() {
    // ── Por que escrever no signal da raiz, e não no input do primitivo ──────
    //
    // `RdxTabsList.activateOnFocus` é booleano com transform `booleanAttribute`:
    // aliasá-lo para `activationMode` faria "manual" — string não vazia — virar
    // `true`, ou seja, ativação automática pedindo a manual. Sem erro nenhum.
    //
    // O primitivo espelha o próprio input na raiz com um effect
    // (`rootContext.setActivateOnFocus(...)`) que, como o input é constante, roda
    // UMA vez na inicialização. Este effect nasce depois — host directives são
    // instanciadas antes da diretiva que as declara — então roda depois e é o
    // último a escrever. E, ao contrário do dele, reage à troca de `activationMode`.
    //
    // A ordem é o que sustenta isto, e ordem não se afirma em comentário: a
    // story `Teclado` de `tabs-estados` prova a ativação automática e a story
    // `AtivacaoManual` prova a manual. Se a ordem inverter, as duas caem.
    effect(() => {
      this.raiz.activateOnFocus.set(this.activationMode() === 'automatic');
    });
  }
}

/**
 * Aba — `role="tab"`, ligada ao painel de mesmo `value`.
 */
@Directive({
  selector: 'button[ndsTabsTrigger]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxTabsTab,
      // `id` entra na lista porque o primitivo é DONO do atributo: ele liga
      // `[attr.id]` a `tabId()`, que só respeita um id escolhido quando ele
      // chega pelo input. Um `id="perfil"` estático no elemento é lido como
      // input (Angular casa atributo estático com input de mesmo nome) e por
      // isso continua valendo — o painel o encontra por `aria-labelledby`.
      inputs: ['value', 'disabled', 'id'],
    },
  ],
  host: {
    class: 'nds-tabs-trigger',
    '[attr.data-slot]': '"tabs-trigger"',
    '[attr.data-state]': 'state()',
  },
})
export class NdsTabsTrigger {
  private readonly aba = inject(RdxTabsTab, { self: true });
  private readonly raiz = injectTabsRootContext();

  /** Espelha o estado do primitivo para o `data-state` das outras stacks. */
  protected readonly state = computed(() =>
    this.raiz.value() === this.aba.value() ? 'active' : 'inactive',
  );
}

/**
 * Painel — `role="tabpanel"`, ligado à aba de mesmo `value`.
 *
 * O painel inativo continua no DOM com `hidden`; `keepMounted` só importa junto
 * com a diretiva estrutural de presença do primitivo, que este stack não usa.
 */
@Directive({
  selector: 'div[ndsTabsContent]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxTabsPanel,
      inputs: ['value', 'keepMounted'],
    },
  ],
  host: {
    class: 'nds-tabs-content',
    '[attr.data-slot]': '"tabs-content"',
  },
})
export class NdsTabsContent {}

// ─── Ícone da aba ─────────────────────────────────────────────────────────────
//
// Mesmo desenho do `NdsToggleIcon` e do `NdsButtonIcon`: o host é o próprio
// `<svg>`, então a regra `.nds-tabs-trigger svg` dimensiona o elemento real e
// não sobra wrapper. Nenhuma classe é declarada aqui — a medida do ícone já vive
// na folha do tabs.
//
// Os filhos nascem de `createElementNS` num `effect` porque cada ícone do lucide
// é uma lista `[tag, attrs]` com tag variável (`path`/`line`/`circle`), e
// template Angular exige tag estática. Construir nós é imune a XSS: não há
// `innerHTML` no caminho.

import { User, Settings, ShieldCheck } from 'lucide';

export type TabsIconKind = 'user' | 'settings' | 'shield';

type LucideIconNode = [string, Record<string, string>];

const TABS_ICON_MAP: Record<TabsIconKind, LucideIconNode[]> = {
  user:     User        as unknown as LucideIconNode[],
  settings: Settings    as unknown as LucideIconNode[],
  shield:   ShieldCheck as unknown as LucideIconNode[],
};

@Component({
  selector: 'svg[ndsTabsIcon]',
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
    // O ícone reforça o rótulo da aba, nunca o substitui: o texto visível já
    // nomeia a aba para o leitor de tela, e repetir viraria eco.
    'aria-hidden': 'true',
  },
})
export class NdsTabsIcon {
  readonly kind = input.required<TabsIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of TABS_ICON_MAP[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

/** As quatro partes — conveniência para o `imports` de quem compõe. */
export const NDS_TABS = [NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent] as const;
