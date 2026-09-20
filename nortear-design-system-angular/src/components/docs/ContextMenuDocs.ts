import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  OnDestroy,
  viewChild,
  TemplateRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { CheckedState, RdxMenuOpenChange } from '@radix-ng/primitives/menu';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_CONTEXT_MENU, menuCloseReason } from '@/components/ui/context-menu';
import {
  contextMenuSnippet,
  type ContextMenuSnippetCheckbox,
  type ContextMenuSnippetEntry,
  type ContextMenuSnippetItem,
} from '@/components/ui/context-menu.source';
import { NdsButton } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import contextMenuTranslations from '@shared/content/context-menu/translations.json';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsCompositions,
  NdsDocsStates,
  NdsDocsProps,
  NdsDocsTokens,
  NdsDocsAccessibility,
  NdsDocsRelated,
  NdsDocsNotes,
  NdsDocsAnalytics,
  NdsDocsTestes,
} from '@/components/docs/shared/sections';

const { t: tNav } = useTranslation(uiTranslations as Record<string, unknown>);
const { t, dict } = useTranslation(contextMenuTranslations as Record<string, unknown>);

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

const NAV_GROUPS: { labelKey: string; sections: { id: string; labelKey: string }[] }[] = [
  { labelKey: 'nav.overview', sections: [
    { id: 'demonstracao', labelKey: 'nav.demonstration' },
    { id: 'anatomia',     labelKey: 'nav.anatomy'       },
    { id: 'quando-usar',  labelKey: 'nav.usage'         },
    { id: 'do-dont',      labelKey: 'nav.doDont'        },
  ]},
  { labelKey: 'nav.techRef', sections: [
    { id: 'importacao',   labelKey: 'nav.import'   },
    { id: 'variantes',    labelKey: 'nav.variants' },
    { id: 'estados',      labelKey: 'nav.states'   },
    { id: 'propriedades', labelKey: 'nav.props'    },
    { id: 'tokens',       labelKey: 'nav.tokens'   },
  ]},
  { labelKey: 'nav.context', sections: [
    { id: 'acessibilidade', labelKey: 'nav.accessibility' },
    { id: 'relacionados',   labelKey: 'nav.related'       },
    { id: 'notas',          labelKey: 'nav.notes'         },
  ]},
  { labelKey: 'nav.quality', sections: [
    { id: 'analytics', labelKey: 'nav.analytics' },
    { id: 'testes',    labelKey: 'nav.testes'    },
  ]},
];

// A interface é só CÓDIGO, sem prosa: comentário cravado aqui sairia em
// português nos três idiomas. O que cada peça faz está nas tabelas de props e
// nas notas, que são traduzidas — o submenu com raiz própria inclusive.
const INTERFACE_CODE = `@Component({
  selector: 'div[ndsContextMenu]',
  hostDirectives: [RdxContextMenuRoot],
})
export class NdsContextMenu {}

@Component({ selector: 'div[ndsContextMenuSub]', hostDirectives: [RdxMenuRoot] })
export class NdsContextMenuSub {}`;

const IMPORT_CODE = `import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';`;

/**
 * A importação peça a peça, para quem compõe marcação e escolha única: são
 * diretivas próprias, e o conjunto `NDS_CONTEXT_MENU` só as reúne.
 */
const IMPORT_PIECES_CODE = `import {
  NdsContextMenu,
  NdsContextMenuTrigger,
  NdsContextMenuContent,
  NdsContextMenuGroup,
  NdsContextMenuLabel,
  NdsContextMenuCheckboxItem,
  NdsContextMenuRadioGroup,
  NdsContextMenuRadioItem,
} from '@/components/ui/context-menu';`;

/**
 * A mesma área do gesto SEM as duas classes de moldura — é `AREA_CLICK_DIREITO`
 * menos `nds-border-default nds-border-dashed` e sem cursor próprio. Serve ao lado
 * "evite" do par 3 do Do & Don't, onde a ausência da dica visual é o assunto, e
 * é a mesma lista que o Vanilla monta ali. Escrita por extenso, e não derivada
 * por `replace`, porque derivação vira no-op silencioso no dia em que a
 * constante mudar.
 */
const AREA_SEM_DICA =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground';

// ─── As prévias vivas ─────────────────────────────────────────────────────────
//
// A docs page É o produto consumidor: toda prévia desta página — demonstração,
// Variantes e Do & Don't — abre, escolhe e fecha com evento de verdade. Até
// 2026-09-10 só a demonstração rastreava, e com o vocabulário antigo
// (`menu_open`/`menu_item_click`); as treze prévias das outras duas seções
// abriam e fechavam sem deixar rastro.
//
// Uma prévia é DADO: a lista abaixo monta o menu vivo e imprime o código do card
// ao lado, e é isso que impede os dois de divergirem — o card de marcação e
// escolha única misturava "Duplicar" marcado com rádios "Por e-mail"/"Por link",
// e nenhum card tinha código.

/** A seção da página em que a prévia está (guideline 07). */
type PreviewLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/** Rótulo de exemplo: sempre uma chave de `demonstration.labels`, nunca literal. */
type LabelKey = `demonstration.labels.${string}`;

type ItemEntry = {
  kind: 'item';
  label: LabelKey;
  /** O valor ESTÁVEL do item — é o `label` do evento, nunca o texto traduzido. */
  value: string;
  shortcut?: LabelKey;
  destructive?: boolean;
  inset?: boolean;
};

/** `checked` é o estado INICIAL; o atual mora na prévia (`checkedState`). */
type CheckboxEntry = { kind: 'checkbox'; label: LabelKey; value: string; checked: boolean };

/** `value` é a escolha INICIAL; a atual mora na prévia (`radioState`). */
type RadioGroupEntry = {
  kind: 'radio-group';
  label: LabelKey;
  value: string;
  options: readonly { label: LabelKey; value: string }[];
};

type PreviewEntry =
  | ItemEntry
  | CheckboxEntry
  | { kind: 'separator' }
  /** Rótulo DENTRO do grupo, que é o nome dele — rótulo solto não nomeia nada. */
  | { kind: 'group'; label: LabelKey; inset?: boolean; entries: readonly (ItemEntry | CheckboxEntry)[] }
  | RadioGroupEntry
  | { kind: 'sub'; label: LabelKey; entries: readonly { label: LabelKey; value: string }[] };

const EDIT: ItemEntry = { kind: 'item', label: 'demonstration.labels.edit', value: 'edit' };
const DUPLICATE: ItemEntry = { kind: 'item', label: 'demonstration.labels.duplicate', value: 'duplicate' };
const DELETE: ItemEntry = { kind: 'item', label: 'demonstration.labels.delete', value: 'delete' };
const DELETE_DESTRUCTIVE: ItemEntry = { ...DELETE, destructive: true };
const SEPARATOR: PreviewEntry = { kind: 'separator' };

/** "Compartilhar" é SUBMENU nas cinco stacks, com os dois destinos dentro. */
const SHARE: PreviewEntry = {
  kind: 'sub',
  label: 'demonstration.labels.share',
  entries: [
    { label: 'demonstration.labels.shareEmail', value: 'share-email' },
    { label: 'demonstration.labels.shareLink', value: 'share-link' },
  ],
};

/** A demonstração é a MESMA nas cinco stacks. */
const DEMO_ENTRIES: readonly PreviewEntry[] = [
  { ...EDIT, shortcut: 'demonstration.labels.editShortcut' },
  DUPLICATE,
  SHARE,
  SEPARATOR,
  { ...DELETE_DESTRUCTIVE, shortcut: 'demonstration.labels.deleteShortcut' },
];

/**
 * Os sete cards de Variantes, pela CHAVE do conteúdo compartilhado. A chave é o
 * `trackId` do card (vira o `snippet_id` do toggle de código) e, em kebab, o
 * `menu` dos eventos da prévia — nome traduzido ali partiria o mesmo card em três
 * valores no GA4.
 */
const VARIANT_KEYS = [
  'default', 'destructive', 'label', 'withCheckbox', 'withRadio', 'withSubmenu', 'withShortcuts',
] as const;
type VariantKey = (typeof VARIANT_KEYS)[number];

const VARIANT_ENTRIES: Record<VariantKey, readonly PreviewEntry[]> = {
  default: [EDIT, DUPLICATE],
  destructive: [EDIT, SEPARATOR, DELETE_DESTRUCTIVE],
  label: [
    {
      kind: 'group',
      label: 'demonstration.labels.groupActions',
      inset: true,
      entries: [{ ...EDIT, inset: true }, { ...DUPLICATE, inset: true }],
    },
  ],
  withCheckbox: [
    {
      kind: 'group',
      label: 'demonstration.labels.groupView',
      entries: [
        { kind: 'checkbox', label: 'demonstration.labels.showGrid', value: 'show-grid', checked: false },
        { kind: 'checkbox', label: 'demonstration.labels.showRulers', value: 'show-rulers', checked: true },
      ],
    },
  ],
  withRadio: [
    {
      kind: 'radio-group',
      label: 'demonstration.labels.groupLayout',
      value: 'layout-grid',
      options: [
        { label: 'demonstration.labels.layoutGrid', value: 'layout-grid' },
        { label: 'demonstration.labels.layoutList', value: 'layout-list' },
        { label: 'demonstration.labels.layoutColumns', value: 'layout-columns' },
      ],
    },
  ],
  withSubmenu: [EDIT, DUPLICATE, SHARE],
  withShortcuts: [
    { ...EDIT, shortcut: 'demonstration.labels.editShortcut' },
    { ...DUPLICATE, shortcut: 'demonstration.labels.duplicateShortcut' },
    SEPARATOR,
    { ...DELETE_DESTRUCTIVE, shortcut: 'demonstration.labels.deleteShortcut' },
  ],
};

/**
 * Do & Don't: cada par muda UMA coisa entre os dois lados, e é a coisa de que a
 * legenda fala; o resto é igual, para que a diferença se leia sozinha.
 *
 *  · par 1 — o MESMO menu nos dois lados; muda só a alternativa visível;
 *  · par 2 — a mesma ação destrutiva: na variante destrutiva e separada por
 *    linha, contra a variante padrão no meio da lista;
 *  · par 3 — o mesmo menu; muda só a dica visual da área.
 */
const PAIR1_ENTRIES: readonly PreviewEntry[] = [EDIT, DELETE_DESTRUCTIVE];
const PAIR2_DO_ENTRIES: readonly PreviewEntry[] = [EDIT, DUPLICATE, SEPARATOR, DELETE_DESTRUCTIVE];
const PAIR2_DONT_ENTRIES: readonly PreviewEntry[] = [EDIT, DELETE, DUPLICATE];
const PAIR3_ENTRIES: readonly PreviewEntry[] = [EDIT, DUPLICATE];

/**
 * A lista da prévia TRADUZIDA, na forma que o construtor de snippet consome.
 *
 * O construtor mora em `ui/context-menu.source.ts` desde 2026-09-18 — snippet
 * montado dentro da docs page não é importável, e por isso não era testável
 * (inconsistência 22 da §7 do PRD). Aqui fica só a tradução: a chave vira texto
 * no idioma da página.
 */
function snippetEntries(entries: readonly PreviewEntry[]): readonly ContextMenuSnippetEntry[] {
  const leaf = (
    e: ItemEntry | CheckboxEntry,
  ): ContextMenuSnippetItem | ContextMenuSnippetCheckbox =>
    e.kind === 'item'
      ? {
          kind: 'item',
          label: t(e.label),
          ...(e.shortcut ? { shortcut: t(e.shortcut) } : {}),
          ...(e.destructive ? { destructive: true } : {}),
          ...(e.inset ? { inset: true } : {}),
        }
      : { kind: 'checkbox', label: t(e.label), checked: e.checked };

  return entries.map((entry): ContextMenuSnippetEntry => {
    switch (entry.kind) {
      case 'separator':
        return { kind: 'separator' };
      case 'group':
        return {
          kind: 'group',
          label: t(entry.label),
          ...(entry.inset ? { inset: true } : {}),
          entries: entry.entries.map(leaf),
        };
      case 'radio-group':
        return {
          kind: 'radio-group',
          label: t(entry.label),
          value: entry.value,
          options: entry.options.map((o) => ({ label: t(o.label), value: o.value })),
        };
      case 'sub':
        return {
          kind: 'sub',
          label: t(entry.label),
          entries: entry.entries.map((child) => ({ label: t(child.label) })),
        };
      default:
        return leaf(entry);
    }
  });
}

/**
 * O código do card, a partir da MESMA lista que monta a prévia — com os rótulos
 * no idioma da página, para que código e prévia digam o mesmo nos três.
 *
 * O que é instrumentação da página (`(onOpenChange)`, `(onSelect)` ligados ao
 * rastreio) não entra: é andaime desta docs page, não lição do menu.
 */
function menuSnippet(entries: readonly PreviewEntry[]): string {
  return contextMenuSnippet({
    triggerLabel: t('demonstration.labels.triggerLabel'),
    entries: snippetEntries(entries),
  });
}

/**
 * Nível WCAG e instrumento de verificação de cada `testes.accessibility.itemN`,
 * na ordem do conteúdo. Nomes técnicos (critério, ferramenta, consulta), que não
 * se traduzem. Item novo sem entrada aqui aparece com "—", e não com um nível
 * inventado.
 */
const A11Y_CRITERIA: readonly { level: string; how: string }[] = [
  { level: 'AA',          how: 'axe-core' },
  { level: '4.1.2 · A',   how: "getByRole('menu')" },
  { level: '4.1.2 · A',   how: "getAllByRole('menuitem')" },
  { level: '4.1.2 · A',   how: "getAllByRole('menuitemcheckbox') · aria-checked" },
  { level: '4.1.2 · A',   how: "getAllByRole('menuitemradio') · aria-checked" },
  { level: '4.1.2 · A',   how: 'aria-disabled' },
  { level: '2.1.1 · A',   how: 'Escape · document.activeElement' },
  { level: '1.4.3 · AA',  how: 'axe-core · color-contrast' },
  { level: '2.1.1 · A',   how: 'ArrowDown · document.activeElement' },
  { level: '4.1.2 · A',   how: 'aria-haspopup · aria-expanded' },
];

/**
 * Uma prévia VIVA do menu — o componente de verdade, com os três eventos.
 *
 * `menu` é o id estável da prévia (`demo`, `with-checkbox`, `pair1-do`…) e
 * `location` a seção em que ela está. Os dois chegam por input, e não de uma
 * constante no topo do arquivo, porque a mesma peça mora em três seções.
 *
 * Exportada por exigência do verificador de templates (NG3004): a docs page a
 * usa no próprio template. Não é API do design system — nada fora deste arquivo
 * a importa.
 */
@Component({
  selector: 'div[ndsContextMenuPreview]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [...NDS_CONTEXT_MENU],
  template: `
    <div ndsContextMenu (onOpenChange)="onOpenChange($event)">
      <div
        ndsContextMenuTrigger
        [class]="hint() ? areaWithHint : areaWithoutHint"
        data-align="center"
        data-justify="center"
      >{{ t(triggerLabel()) }}</div>

      <ng-template ndsContextMenuContent>
        @for (entry of entries(); track $index) {
          @if (entry.kind === 'separator') {
            <div ndsContextMenuSeparator></div>
          } @else if (entry.kind === 'item') {
            <div
              ndsContextMenuItem
              [variant]="entry.destructive ? 'destructive' : 'default'"
              [inset]="entry.inset ?? false"
              (onSelect)="onSelect(entry.value)"
            >
              {{ t(entry.label) }}
              @if (entry.shortcut) {
                <span ndsContextMenuShortcut>{{ t(entry.shortcut) }}</span>
              }
            </div>
          } @else if (entry.kind === 'checkbox') {
            <div
              ndsContextMenuCheckboxItem
              [checked]="isChecked(entry)"
              (checkedChange)="onCheckedChange(entry, $event)"
            >{{ t(entry.label) }}</div>
          } @else if (entry.kind === 'group') {
            <div ndsContextMenuGroup>
              <div ndsContextMenuLabel [inset]="entry.inset ?? false">{{ t(entry.label) }}</div>
              @for (child of entry.entries; track child.value) {
                @if (child.kind === 'item') {
                  <div
                    ndsContextMenuItem
                    [variant]="child.destructive ? 'destructive' : 'default'"
                    [inset]="child.inset ?? false"
                    (onSelect)="onSelect(child.value)"
                  >{{ t(child.label) }}</div>
                } @else {
                  <div
                    ndsContextMenuCheckboxItem
                    [checked]="isChecked(child)"
                    (checkedChange)="onCheckedChange(child, $event)"
                  >{{ t(child.label) }}</div>
                }
              }
            </div>
          } @else if (entry.kind === 'radio-group') {
            <div
              ndsContextMenuRadioGroup
              [value]="radioValue(entry)"
              (valueChange)="onRadioChange(entry, $event)"
            >
              <div ndsContextMenuLabel>{{ t(entry.label) }}</div>
              @for (option of entry.options; track option.value) {
                <!-- A escolha é o CLIQUE no item, não a mudança de valor: escolher a
                     opção já marcada também é uma escolha, e o evento sai igual
                     nas cinco. O teclado chega aqui pelo click() da lib. -->
                <div ndsContextMenuRadioItem [value]="option.value" (click)="onToggle(option.value)">{{ t(option.label) }}</div>
              }
            </div>
          } @else {
            <div ndsContextMenuSub>
              <div ndsContextMenuSubTrigger>{{ t(entry.label) }}</div>
              <ng-template ndsContextMenuSubContent>
                @for (child of entry.entries; track child.value) {
                  <div ndsContextMenuItem (onSelect)="onSelect(child.value)">{{ t(child.label) }}</div>
                }
              </ng-template>
            </div>
          }
        }
      </ng-template>
    </div>
  `,
})
export class NdsContextMenuPreview {
  readonly menu = input.required<string>();
  readonly location = input.required<PreviewLocation>();
  readonly entries = input.required<readonly PreviewEntry[]>();
  readonly triggerLabel = input<LabelKey>('demonstration.labels.triggerLabel');
  /** Sem dica, a área perde a moldura tracejada — o lado "evite" do par 3. */
  readonly hint = input(true);

  protected readonly t = t;
  protected readonly areaWithHint = AREA_CLICK_DIREITO;
  protected readonly areaWithoutHint = AREA_SEM_DICA;

  /**
   * O estado ATUAL dos alternadores e das escolhas únicas desta prévia, pela
   * entrada da lista. O miolo do menu é desmontado ao fechar e remontado ao
   * abrir: ligado à constante da lista, ele voltava ao estado inicial a cada
   * abertura. As outras quatro stacks guardam o estado; esta passou a guardar
   * em 2026-09-11.
   */
  private readonly checkedState = signal(new Map<CheckboxEntry, CheckedState>());
  private readonly radioState = signal(new Map<RadioGroupEntry, string>());

  protected isChecked(entry: CheckboxEntry): CheckedState {
    return this.checkedState().get(entry) ?? entry.checked;
  }

  protected radioValue(group: RadioGroupEntry): string {
    return this.radioState().get(group) ?? group.value;
  }

  protected onCheckedChange(entry: CheckboxEntry, checked: CheckedState): void {
    this.checkedState.update((state) => new Map(state).set(entry, checked));
    this.onToggle(entry.value);
  }

  protected onRadioChange(group: RadioGroupEntry, value: unknown): void {
    if (typeof value !== 'string') return;
    this.radioState.update((state) => new Map(state).set(group, value));
  }

  /**
   * O motivo sai do `menuCloseReason`, a tradução única da família: Escape,
   * clique fora, Tab e o botão solto fora do painel têm motivo próprio na lib; o
   * que chega sem motivo é o item escolhido ou o código — `api` nos dois casos.
   */
  protected onOpenChange(change: RdxMenuOpenChange): void {
    const payload = { component: 'context-menu' as const, menu: this.menu(), location: this.location() };
    if (change.open) {
      track('context_menu_open', payload);
      return;
    }
    track('context_menu_close', { ...payload, reason: menuCloseReason(change.reason) });
  }

  /** Item de ação: a escolha FECHA o menu, e o fechamento que vem é `api`. */
  protected onSelect(label: string): void {
    track('context_menu_item_select', {
      component: 'context-menu',
      label,
      menu: this.menu(),
      location: this.location(),
    });
  }

  /**
   * Marcação e escolha única também são escolha, mas NÃO fecham o menu: o
   * evento sai, e o fechamento seguinte leva o motivo de quem de fato fechou.
   */
  protected onToggle(label: unknown): void {
    if (typeof label !== 'string') return;
    track('context_menu_item_select', {
      component: 'context-menu',
      label,
      menu: this.menu(),
      location: this.location(),
    });
  }
}

@Component({
  selector: 'nds-context-menu-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsContextMenuPreview, NdsButton,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!-- Par 1 — o gesto nunca é o único caminho. O MESMO menu nos dois lados;
         o que muda é a alternativa visível ao lado da área. -->
    <ng-template #tplDoDont1Do>
      <div class="nds-cluster" data-spacing="sm" data-align="center" data-justify="center">
        <div ndsContextMenuPreview menu="pair1-do" location="docs_do_dont" [entries]="pair1Entries"></div>
        <button ndsButton variant="outline" size="sm" type="button">
          {{ t('demonstration.labels.edit') }}
        </button>
      </div>
    </ng-template>

    <ng-template #tplDoDont1Dont>
      <div ndsContextMenuPreview menu="pair1-dont" location="docs_do_dont" [entries]="pair1Entries"></div>
    </ng-template>

    <!-- Par 2 — a mesma ação destrutiva: na variante destrutiva e separada por
         uma linha, contra a variante padrão no meio da lista. -->
    <ng-template #tplDoDont2Do>
      <div ndsContextMenuPreview menu="pair2-do" location="docs_do_dont" [entries]="pair2DoEntries"></div>
    </ng-template>

    <ng-template #tplDoDont2Dont>
      <div ndsContextMenuPreview menu="pair2-dont" location="docs_do_dont" [entries]="pair2DontEntries"></div>
    </ng-template>

    <!-- Par 3 — a dica visual. Os dois lados montam o MESMO menu: à esquerda a
         moldura tracejada e a linha que diz o gesto; à direita a mesma área sem
         contorno e sem aviso. Sem opacity: o esmaecimento levava o texto a
         1,52:1 (axe: color-contrast), e o texto já diz o que falta. -->
    <ng-template #tplDoDont3Do>
      <div ndsContextMenuPreview menu="pair3-do" location="docs_do_dont" [entries]="pair3Entries"></div>
    </ng-template>

    <ng-template #tplDoDont3Dont>
      <div
        ndsContextMenuPreview
        menu="pair3-dont"
        location="docs_do_dont"
        [entries]="pair3Entries"
        [hint]="false"
        triggerLabel="demonstration.labels.areaNoHint"
      ></div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div ndsContextMenuPreview menu="default" location="docs_variantes" [entries]="variantEntries.default"></div>
    </ng-template>

    <ng-template #tplVarDestructive>
      <div ndsContextMenuPreview menu="destructive" location="docs_variantes" [entries]="variantEntries.destructive"></div>
    </ng-template>

    <ng-template #tplVarLabel>
      <div ndsContextMenuPreview menu="label" location="docs_variantes" [entries]="variantEntries.label"></div>
    </ng-template>

    <ng-template #tplVarWithCheckbox>
      <div ndsContextMenuPreview menu="with-checkbox" location="docs_variantes" [entries]="variantEntries.withCheckbox"></div>
    </ng-template>

    <ng-template #tplVarWithRadio>
      <div ndsContextMenuPreview menu="with-radio" location="docs_variantes" [entries]="variantEntries.withRadio"></div>
    </ng-template>

    <ng-template #tplVarWithSubmenu>
      <div ndsContextMenuPreview menu="with-submenu" location="docs_variantes" [entries]="variantEntries.withSubmenu"></div>
    </ng-template>

    <ng-template #tplVarWithShortcuts>
      <div ndsContextMenuPreview menu="with-shortcuts" location="docs_variantes" [entries]="variantEntries.withShortcuts"></div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="context-menu"
    >
      <div docsHeader>
        <nds-docs-header
          [title]="t('title')"
          [description]="t('description')"
          [category]="t('category')"
          [type]="t('type')"
        />
      </div>

      <ng-container docsMain>
        <!-- A demonstração é a MESMA nas cinco stacks: editar, duplicar, o
             submenu de compartilhar e — depois do único traço — a ação
             destrutiva. -->
        <nds-docs-demonstration>
          <div class="nds-cluster nds-w-full nds-p-8" data-align="center" data-justify="center">
            <div ndsContextMenuPreview menu="demo" location="docs_demo" [entries]="demoEntries"></div>
          </div>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="t('anatomy.structureCode')"
          language="html"
        />

        <nds-docs-when-to-use
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [pairs]="doDontPairs()" />

        <nds-docs-import
          [description]="t('import.basic')"
          [code]="importCode"
          [secondaryDescription]="t('import.withCheckbox')"
          [secondaryCode]="importPiecesCode"
          componentSlug="context-menu"
          language="ts"
        />

        <!--
          O container de COMPOSIÇÕES, como nas outras catorze páginas da
          família: até 2026-09-18 esta era a única a usar nds-docs-variants
          direto (inconsistência 21(a) da §7 do PRD). O layout é o mesmo — o de
          composições renderiza o de variantes por dentro —, e o id continua
          "variantes" porque é a seção do menu lateral que salta para cá.
        -->
        <nds-docs-compositions
          [note]="t('variants.note')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="context-menu"
          id="variantes"
          language="html"
        />

        <nds-docs-states
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityNotes]="t('props.extensibility')"
        />

        <nds-docs-tokens
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboardTitle')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="tNav('common.screenReader')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [items]="relatedItems()"
          componentSlug="context-menu"
        />

        <nds-docs-notes
          [items]="noteItems()"
          componentSlug="context-menu"
        />

        <nds-docs-analytics
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [functional]="testesFunctional()"
          [accessibility]="testesAccessibility()"
          [visual]="testesVisual()"
        />
      </ng-container>
    </nds-docs-page-layout>
  `,
})
export class NdsContextMenuDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly importPiecesCode = IMPORT_PIECES_CODE;

  protected readonly demoEntries = DEMO_ENTRIES;
  protected readonly variantEntries = VARIANT_ENTRIES;
  protected readonly pair1Entries = PAIR1_ENTRIES;
  protected readonly pair2DoEntries = PAIR2_DO_ENTRIES;
  protected readonly pair2DontEntries = PAIR2_DONT_ENTRIES;
  protected readonly pair3Entries = PAIR3_ENTRIES;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplDoDont3Do = viewChild.required<TemplateRef<unknown>>('tplDoDont3Do');
  private readonly tplDoDont3Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont3Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarLabel = viewChild.required<TemplateRef<unknown>>('tplVarLabel');
  private readonly tplVarWithCheckbox = viewChild.required<TemplateRef<unknown>>('tplVarWithCheckbox');
  private readonly tplVarWithRadio = viewChild.required<TemplateRef<unknown>>('tplVarWithRadio');
  private readonly tplVarWithSubmenu = viewChild.required<TemplateRef<unknown>>('tplVarWithSubmenu');
  private readonly tplVarWithShortcuts = viewChild.required<TemplateRef<unknown>>('tplVarWithShortcuts');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    const d = dict();
    return Object.keys(d)
      .filter((k) => /^anatomy\.item\d+$/.test(k))
      // Ordem numérica: com 11 itens, `item10` viria antes de `item2`.
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
      .map((k) => d[k]);
  });

  protected readonly guidelines = computed(() => {
    const d = dict();
    return { title: d['usage.guidelines.title'] ?? '', items: numberedItems(d, 'usage.guidelines') };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: d['usage.scenarios.title'] ?? '',
      cols: {
        scenario: d['usage.scenarios.cols.scenario'] ?? '',
        use: d['usage.scenarios.cols.use'] ?? '',
        alternative: d['usage.scenarios.cols.alternative'] ?? '',
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly usageDo = computed(() => {
    const d = dict();
    return { title: t('usage.do.title'), items: numberedItems(d, 'usage.do') };
  });

  protected readonly usageDont = computed(() => {
    const d = dict();
    return { title: t('usage.dont.title'), items: numberedItems(d, 'usage.dont') };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
      [this.tplDoDont3Do(), this.tplDoDont3Dont()],
    ];
    return pairs.map(([doTpl, dontTpl], i) => ({
      doLabel: tNav('common.do'),
      dontLabel: tNav('common.dont'),
      doCaption: toPlainText(t(`doDont.pair${i + 1}.do`)),
      dontCaption: toPlainText(t(`doDont.pair${i + 1}.dont`)),
      doPreview: doTpl,
      dontPreview: dontTpl,
    }));
  });

  /**
   * Os sete cards. `trackId` é a CHAVE (`default`, `withCheckbox`…) — o
   * `snippet_id` do toggle de código não pode mudar com o idioma. Os três cards
   * de string solta (`default`, `destructive`, `label`) leem o nome de
   * `variants.names.*`; os quatro de objeto trazem nome, descrição e "quando
   * usar" em `variants.items.<card>`. Até 2026-09-11 os três primeiros
   * mostravam a chave crua como título, nas cinco stacks.
   */
  protected readonly variantItems = computed(() => {
    dict();
    const templates: Record<VariantKey, TemplateRef<unknown>> = {
      default: this.tplVarDefault(),
      destructive: this.tplVarDestructive(),
      label: this.tplVarLabel(),
      withCheckbox: this.tplVarWithCheckbox(),
      withRadio: this.tplVarWithRadio(),
      withSubmenu: this.tplVarWithSubmenu(),
      withShortcuts: this.tplVarWithShortcuts(),
    };
    return VARIANT_KEYS.map((key) => {
      const hasName = t(`variants.items.${key}.name`) !== `variants.items.${key}.name`;
      const description = hasName
        ? `${t(`variants.items.${key}.description`)}<br><br><strong>${tNav('common.useWhen')}</strong> ${t(`variants.items.${key}.use`)}`
        : t(`variants.items.${key}`);
      return {
        name: hasName ? t(`variants.items.${key}.name`) : t(`variants.names.${key}`),
        description,
        trackId: key,
        code: menuSnippet(VARIANT_ENTRIES[key]),
        preview: templates[key],
      };
    });
  });

  protected readonly statesCols = computed(() => {
    dict();
    return {
      state: t('states.cols.state'),
      trigger: t('states.cols.trigger'),
      behavior: t('states.cols.behavior'),
    };
  });

  protected readonly stateItems = computed(() => {
    dict();
    return ['closed', 'open', 'focused', 'disabled', 'checked', 'mixed', 'subOpen'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  /**
   * As tabelas descrevem o que ESTA stack tem, com os nomes dela: saída de
   * evento entre parênteses, como se escreve no template, e os padrões reais do
   * wrapper — o menu de raiz resolve `side`, `align` e os deslocamentos quando o
   * conteúdo não diz nada. Marcação e escolha única não têm `inset` aqui.
   */
  protected readonly propTables = computed(() => {
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const not = tNav('common.no');
    const line = (name: string, key: string, type: string, defaultValue: string) => ({
      name,
      type,
      defaultValue,
      required: not,
      description: toPlainText(t(`props.items.${key}`)),
    });

    // `modal` monta o véu interno e trava a rolagem da página — NÃO prende o
    // foco (D1): Tab fecha o menu. A descrição vem do conteúdo compartilhado.
    const modalRow = [line('modal', 'modal', 'boolean', 'true')];

    return [
      {
        title: t('props.rootTitle'),
        cols,
        items: [line('(openChange)', 'onOpenChange', 'output<boolean>', '—'), ...modalRow],
      },
      {
        title: t('props.contentTitle'),
        cols,
        items: [
          line('side', 'side', `'top' | 'bottom' | 'left' | 'right'`, `'bottom'`),
          line('align', 'align', `'start' | 'center' | 'end'`, `'start'`),
          line('sideOffset', 'sideOffset', 'number', '0'),
          line('alignOffset', 'alignOffset', 'number', '0'),
        ],
      },
      {
        title: t('props.itemTitle'),
        cols,
        items: [
          line('variant', 'variant', `'default' | 'destructive'`, `'default'`),
          line('inset', 'inset', 'boolean', 'false'),
          line('disabled', 'disabled', 'boolean', 'false'),
          line('(onSelect)', 'onSelect', 'output<void>', '—'),
        ],
      },
      {
        title: t('props.labelTitle'),
        cols,
        items: [line('inset', 'inset', 'boolean', 'false')],
      },
      {
        title: t('props.checkboxItemTitle'),
        cols,
        items: [
          line('checked', 'checked', `model<boolean | 'indeterminate'>`, 'false'),
          line('(checkedChange)', 'onCheckedChange', `output<boolean | 'indeterminate'>`, '—'),
        ],
      },
      {
        title: t('props.radioGroupTitle'),
        cols,
        items: [
          line('value', 'modelValue', 'model<string>', '—'),
          line('(valueChange)', 'onValueChange', 'output<string>', '—'),
        ],
      },
      {
        title: t('props.radioItemTitle'),
        cols,
        items: [line('value', 'value', 'string', '—')],
      },
    ];
  });

  protected readonly tokensCols = computed(() => {
    dict();
    return {
      token: t('tokens.table.token'),
      value: t('tokens.table.class'),
      description: t('tokens.table.part'),
    };
  });

  protected readonly tokenItems = computed(() => {
    dict();
    return [
      { token: '--popover',              k: 'popoverBg',        target: '.nds-dropdown-menu-content' },
      { token: '--popover-foreground',   k: 'popoverFg',        target: '.nds-dropdown-menu-content' },
      { token: '--accent',               k: 'accentBg',         target: '.nds-dropdown-menu-item' },
      { token: '--accent-foreground',    k: 'accentFg',         target: '.nds-dropdown-menu-item' },
      // O atributo sozinho não é seletor da folha: a regra é sempre a classe
      // do item mais o atributo.
      { token: '--destructive',          k: 'destructive',      target: '.nds-dropdown-menu-item[data-variant="destructive"]' },
      { token: '--destructive',          k: 'destructiveFocus', target: '.nds-dropdown-menu-item[data-variant="destructive"]:focus' },
      { token: '--muted-foreground',     k: 'mutedFg',          target: '.nds-dropdown-menu-shortcut' },
      { token: '--muted-foreground',     k: 'mutedFgLabel',     target: '.nds-dropdown-menu-label' },
      // Medido no navegador: o separador é `--muted` (245,245,245), não
      // `--border` (230,230,230) — este último pinta a BORDA do popup, que
      // agora tem linha própria. O raio do item é `--radius-sm` (6px), não o
      // `--radius` (10px) do popup.
      { token: '--muted',                k: 'border',           target: '.nds-dropdown-menu-separator' },
      { token: '--border',               k: 'popupBorder',      target: '.nds-dropdown-menu-content' },
      { token: '--elevation-md',         k: 'shadow',           target: '.nds-dropdown-menu-content' },
      { token: '--radius',               k: 'radius',           target: '.nds-dropdown-menu-content' },
      { token: '--radius-sm',            k: 'radiusItem',       target: '.nds-dropdown-menu-item' },
      { token: '--z-popover',            k: 'zIndex',           target: '.nds-dropdown-menu-positioner' },
    ].map(({ token, k, target }) => ({
      token,
      value: target,
      description: toPlainText(t(`tokens.table.${k}`)),
    }));
  });

  /**
   * O aviso vem PRIMEIRO — é a regra que decide se o componente pode ser usado
   * —, e depois TODO item de `accessibility.aria`, na ordem do conteúdo. Listar à
   * mão travava a lista em dois papéis dos oito, e o resto não chegava à página.
   */
  protected readonly a11yItems = computed(() => {
    const d = dict();
    const aria = Object.keys(d)
      .filter((k) => k.startsWith('accessibility.aria.'))
      .map((k) => d[k]);
    return [t('accessibility.warning'), ...aria];
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Right-click / Menu / Shift+F10', description: toPlainText(t('accessibility.keyboard.rightClick')) },
      { key: 'Arrow Down',  description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: 'Arrow Up',    description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Arrow Right', description: toPlainText(t('accessibility.keyboard.arrowRight')) },
      { key: 'Arrow Left',  description: toPlainText(t('accessibility.keyboard.arrowLeft')) },
      { key: 'Home / End',  description: toPlainText(t('accessibility.keyboard.homeEnd')) },
      { key: 'A–Z',         description: toPlainText(t('accessibility.keyboard.typeahead')) },
      { key: 'Enter',       description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',       description: toPlainText(t('accessibility.keyboard.space')) },
      { key: 'Esc',         description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Tab',         description: toPlainText(t('accessibility.keyboard.tab')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    return ['onOpen', 'onNavigate', 'onSelect', 'shortcuts', 'alternative'].map((k) =>
      t(`accessibility.screenReader.${k}`),
    );
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'dropdownMenu', name: 'DropdownMenu', path: '?path=/docs/components-navigation-dropdownmenu--docs' },
      { key: 'menubar',      name: 'Menubar',      path: '?path=/docs/components-navigation-menubar--docs'  },
      { key: 'dialog',       name: 'Dialog',       path: '?path=/docs/components-overlay-dialog--docs'      },
      { key: 'alertDialog',  name: 'AlertDialog',  path: '?path=/docs/components-overlay-alertdialog--docs' },
      { key: 'tooltip',      name: 'Tooltip',      path: '?path=/docs/components-overlay-tooltip--docs'     },
    ].map(({ key, name, path }) => ({ name, description: toPlainText(t(`related.${key}`)), path }));
  });

  /** Todas as `notes.tipN`, quantas o conteúdo tiver — contar à mão trava a lista. */
  protected readonly noteItems = computed(() => {
    const d = dict();
    return Object.keys(d)
      .filter((k) => /^notes\.tip\d+$/.test(k))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
      .map((k) => ({ title: '', content: d[k] }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    return [
      { e: 'menuOpen',      trigger: 'menuOpenTrigger',      carga: 'menuOpenPayload'      },
      { e: 'itemClick',     trigger: 'itemClickTrigger',     carga: 'itemClickPayload'     },
      { e: 'close',         trigger: 'closeTrigger',         carga: 'closePayload'         },
      { e: 'pageView',      trigger: 'pageViewTrigger',      carga: 'pageViewPayload'      },
      { e: 'sectionViewed', trigger: 'sectionViewedTrigger', carga: 'sectionViewedPayload' },
      { e: 'langSwitch',    trigger: 'langSwitchTrigger',    carga: 'langSwitchPayload'    },
    ].map(({ e, trigger, carga }) => ({
      event: t(`analytics.table.${e}`),
      trigger: toPlainText(t(`analytics.table.${trigger}`)),
      payload: toPlainText(t(`analytics.table.${carga}`)),
    }));
  });

  protected readonly testesFunctional = computed(() => {
    const d = dict();
    return {
      title: t('testes.functional.title'),
      description: t('testes.functional.description'),
      cols: {
        action: tNav('common.userAction'),
        result: tNav('common.expectedResult'),
        priority: tNav('common.priority'),
      },
      items: itemsFromDict(d, 'testes.functional', ['action', 'result', 'priority']).map((r) => ({
        action: toPlainText(r.action),
        result: stripHtml(toPlainText(r.result)),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  protected readonly testesAccessibility = computed(() => {
    const d = dict();
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      // Os itens são string solta; o critério WCAG e o instrumento de cada um
      // moram em `A11Y_CRITERIA`, na mesma ordem.
      items: numberedItems(d, 'testes.accessibility').map((text, i) => ({
        criterion: toPlainText(text),
        level: A11Y_CRITERIA[i]?.level ?? '—',
        how: A11Y_CRITERIA[i]?.how ?? '—',
      })),
    };
  });

  protected readonly testesVisual = computed(() => {
    const d = dict();
    return {
      title: t('testes.visual.title'),
      description: t('testes.visual.description'),
      cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
      items: itemsFromDict(d, 'testes.visual', ['story', 'priority']).map((r) => ({
        story: toPlainText(r.story),
        priority: priorityLabel(r.priority),
      })),
    };
  });

  private observer: { disconnect: () => void } | undefined;

  constructor() {
    effect((onCleanup) => {
      dict();
      const locale = getLocale();
      const cleanup = applySeo({
        title: t('seo.title'),
        description: t('seo.description'),
        locale,
        componentSlug: 'context-menu',
        // O resumo e as entidades para os mecanismos de IA existiam no conteúdo
        // compartilhado e não chegavam a lugar nenhum: a página não os passava.
        aiSummary: t('seo.aiSummary'),
        aiEntities: t('seo.aiEntities'),
      });
      track('docs_page_view', {
        component_name: 'context-menu',
        locale,
        page_title: `${t('title')} · Design System`,
      });
      onCleanup(cleanup);
    });
  }

  ngAfterViewInit(): void {
    this.observer = createActiveSectionObserver(
      [...SECTION_IDS],
      (id) => document.getElementById(id),
      (id) => this.activeSection.set(id),
      (id) =>
        track('docs_section_viewed', {
          component_name: 'context-menu',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** Itens `base.itemN` na ordem numérica, quantos existirem. */
function numberedItems(d: Record<string, string>, base: string): string[] {
  const items: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) items.push(d[`${base}.item${i}`]);
  return items;
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

function itemsFromDict<K extends string>(
  d: Record<string, string>,
  base: string,
  fields: readonly K[],
): Record<K, string>[] {
  const rows: Record<K, string>[] = [];
  for (let i = 1; ; i++) {
    if (d[`${base}.item${i}.${fields[0]}`] === undefined) break;
    const row = {} as Record<K, string>;
    for (const f of fields) row[f] = d[`${base}.item${i}.${f}`] ?? '';
    rows.push(row);
  }
  return rows;
}
