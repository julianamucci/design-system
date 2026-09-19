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
import { NDS_DROPDOWN_MENU, menuCloseReason } from '@/components/ui/dropdown-menu';
import {
  dropdownMenuSnippet,
  type DropdownMenuSnippetCheckbox,
  type DropdownMenuSnippetEntry,
  type DropdownMenuSnippetItem,
} from '@/components/ui/dropdown-menu.source';
import { NdsButton, type ButtonSize } from '@/components/ui/button';
import uiTranslations from '@/i18n/ui.json';
import dropdownMenuTranslations from '@shared/content/dropdown-menu/translations.json';

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

// Overrides: só texto DESCRITIVO que muda (ou nasce) nesta stack. Nenhum
// snippet `*Code` entra aqui — snippet em override fica preso a um stack e some
// do conteúdo compartilhado; os que divergem viram const neste arquivo, com a
// divergência reportada.
//
// NENHUMA nota entra aqui. Até 2026-09-18 esta página reescrevia `notes.item1`,
// `item2` e `item5` e acrescentava `item6` e `item7`: sete notas onde o conteúdo
// compartilhado tem cinco, e onde as outras quatro stacks mostram cinco
// (inconsistência 21(b) da §7 do PRD, maioria = o conteúdo compartilhado sem
// override). O `item1` compartilhado já é neutro de API — "a lib headless desta
// stack" —, que é exatamente o que uma página consumida isoladamente precisa.
// `props.*` — as props que o conteúdo compartilhado não descreve (as quatro
// peças deste stack têm mais superfície do que as seis linhas da tabela dele).
// `snippet.*` — os COMENTÁRIOS do código de extensibilidade desta stack, que é
// montado por `extensibilitySnippet()` na língua de quem lê. É prosa, não
// snippet: o código em si vive no arquivo, os rótulos vêm de
// `demonstration.labels.*`.
const { t, dict } = useTranslation(dropdownMenuTranslations as Record<string, unknown>, {
  'pt-BR': {
    'snippet.controlled': 'Menu controlado, com posicionamento e analytics',
    'snippet.inComponent': 'no componente',
    'snippet.stableIds':
      'O payload leva IDENTIFICADORES estáveis, em inglês e kebab-case — o do menu e o do item —,',
    'snippet.stableIdsWhy':
      'nunca o rótulo traduzido: o rótulo partiria um evento em três no GA4, um por idioma.',
    'snippet.location':
      'location é a SEÇÃO da tela onde o menu mora: nestas docs, docs_<seção>; no produto, a seção dele.',
    'snippet.reasons':
      'escape: Escape · overlay: clique fora, Tab ou gatilho aberto · api: item escolhido ou código',
    'props.disabled.description':
      'Bloqueia a abertura do menu inteiro. Itens individuais têm o próprio bloqueio.',
    'props.loopFocus.description':
      'Quando verdadeiro (padrão), a seta dá a volta do último item para o primeiro.',
    'props.sideOffset.description':
      'Distância em pixels entre o popup e o gatilho. Submenu nasce encostado; menu de raiz, a 4px.',
    'props.alignOffset.description':
      'Deslocamento em pixels no eixo do alinhamento, para casar o primeiro item com quem o abriu.',
    'props.variant.description':
      'Ênfase do item. A cor de perigo é reservada a ação irreversível.',
    'props.inset.description':
      'Recua o item para alinhá-lo com irmãos que têm ícone à esquerda.',
    'props.itemDisabled.description':
      'Bloqueia a execução do item. Ele continua alcançável pela seta, para ser anunciado como desabilitado.',
    'props.closeOnClick.description':
      'Se escolher o item fecha o menu. Verdadeiro no item de ação; falso no alternador e na escolha única.',
    'props.onSelect.description':
      'Emite quando o item é escolhido, por clique ou por Enter.',
    'props.checked.description':
      'Estado do alternador. Aceita ligação de mão dupla.',
    'props.checkedChange.description':
      'Emite o novo estado do alternador.',
    'props.groupValue.description':
      'Valor escolhido no grupo. Aceita ligação de mão dupla.',
    'props.groupValueChange.description': 'Emite o valor recém-escolhido.',
    'props.itemValue.description':
      'Valor desta opção. É o que o grupo compara para decidir quem está marcado.',
    'props.openChangeDetail.description':
      'Emite a mudança de abertura junto do motivo ({ open, reason }): diz se o menu fechou por Escape, por clique fora ou por item escolhido.',
  },
  en: {
    'snippet.controlled': 'Controlled menu, with positioning and analytics',
    'snippet.inComponent': 'in the component',
    'snippet.stableIds':
      'The payload carries STABLE identifiers, in English and kebab-case — the menu one and the item one —,',
    'snippet.stableIdsWhy':
      'never the translated label: the label would split one event into three in GA4, one per language.',
    'snippet.location':
      'location is the SECTION of the screen where the menu lives: in these docs, docs_<section>; in the product, its own.',
    'snippet.reasons':
      'escape: Escape · overlay: click outside, Tab or open trigger · api: item chosen or code',
    'props.disabled.description':
      'Blocks the whole menu from opening. Individual items have their own switch.',
    'props.loopFocus.description':
      'When true (default), arrow keys wrap from the last item back to the first.',
    'props.sideOffset.description':
      'Distance in pixels between popup and trigger. A submenu opens flush; a root menu at 4px.',
    'props.alignOffset.description':
      'Offset in pixels along the alignment axis, to line the first item up with whatever opened it.',
    'props.variant.description':
      'Item emphasis. The danger color is reserved for irreversible actions.',
    'props.inset.description': 'Indents the item to line it up with siblings that carry a left icon.',
    'props.itemDisabled.description':
      'Blocks the item from running. It stays reachable by arrow keys so it gets announced as disabled.',
    'props.closeOnClick.description':
      'Whether choosing the item closes the menu. True for action items; false for toggles and single choice.',
    'props.onSelect.description': 'Emits when the item is chosen, by click or by Enter.',
    'props.checked.description': 'Toggle state. Supports two-way binding.',
    'props.checkedChange.description': 'Emits the new toggle state.',
    'props.groupValue.description': 'Value selected in the group. Supports two-way binding.',
    'props.groupValueChange.description': 'Emits the newly selected value.',
    'props.itemValue.description':
      'This option value. It is what the group compares to decide which one is checked.',
    'props.openChangeDetail.description':
      'Emits the open change together with its reason ({ open, reason }): tells whether the menu closed by Escape, by a click outside or by a chosen item.',
  },
  es: {
    'snippet.controlled': 'Menú controlado, con posicionamiento y analytics',
    'snippet.inComponent': 'en el componente',
    'snippet.stableIds':
      'El payload lleva IDENTIFICADORES estables, en inglés y kebab-case — el del menú y el del ítem —,',
    'snippet.stableIdsWhy':
      'nunca la etiqueta traducida: la etiqueta partiría un evento en tres en GA4, uno por idioma.',
    'snippet.location':
      'location es la SECCIÓN de la pantalla donde vive el menú: en estas docs, docs_<sección>; en el producto, la suya.',
    'snippet.reasons':
      'escape: Escape · overlay: clic fuera, Tab o disparador abierto · api: ítem elegido o código',
    'props.disabled.description':
      'Bloquea la apertura de todo el menú. Los items tienen su propio bloqueo.',
    'props.loopFocus.description':
      'Cuando es verdadero (por defecto), la flecha da la vuelta del último item al primero.',
    'props.sideOffset.description':
      'Distancia en píxeles entre el popup y el disparador. El submenú nace pegado; el menú raíz, a 4px.',
    'props.alignOffset.description':
      'Desplazamiento en píxeles en el eje de alineación, para casar el primer item con quien lo abrió.',
    'props.variant.description':
      'Énfasis del item. El color de peligro se reserva a la acción irreversible.',
    'props.inset.description':
      'Sangra el item para alinearlo con hermanos que tienen icono a la izquierda.',
    'props.itemDisabled.description':
      'Bloquea la ejecución del item. Sigue alcanzable por la flecha, para ser anunciado como deshabilitado.',
    'props.closeOnClick.description':
      'Si elegir el item cierra el menú. Verdadero en el item de acción; falso en el alternador y la selección única.',
    'props.onSelect.description': 'Emite cuando el item es elegido, por clic o por Enter.',
    'props.checked.description': 'Estado del alternador. Admite enlace de doble vía.',
    'props.checkedChange.description': 'Emite el nuevo estado del alternador.',
    'props.groupValue.description': 'Valor elegido en el grupo. Admite enlace de doble vía.',
    'props.groupValueChange.description': 'Emite el valor recién elegido.',
    'props.itemValue.description':
      'Valor de esta opción. Es lo que el grupo compara para decidir cuál está marcada.',
    'props.openChangeDetail.description':
      'Emite el cambio de apertura junto con el motivo ({ open, reason }): dice si el menú se cerró por Escape, por clic fuera o por ítem elegido.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'estados', 'propriedades', 'tokens',
  'acessibilidade', 'relacionados', 'notas', 'analytics', 'testes',
] as const;

// Sem entrada para Composições: o conteúdo compartilhado deste slug não tem
// `variants.compositions` — as quatro composições canônicas moram em
// `variants.items`, junto das duas variantes de item, e saem todas na mesma
// seção. Uma seção de composições sem conteúdo seria placeholder — e o
// auditor cobra os dois sentidos: conteúdo sem seção e seção sem conteúdo.
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

// A anatomia vem do conteúdo (`t('anatomy.structureCode')`): a variante
// `angular` passou a compilar contra os seletores desta stack (itens e
// sub-gatilho em `<div>`), com en/es traduzidos. O bloco local que a contornava
// até 2026-09-11 saiu — contorno local é o que mantém defeito de conteúdo vivo.

// A interface é só CÓDIGO, sem prosa: comentário cravado aqui sairia em
// português nos três idiomas. O que cada entrada faz está nas tabelas de props,
// que são traduzidas.
const INTERFACE_CODE = `@Component({
  selector: 'nds-dropdown-menu, nds-dropdown-menu-sub',
  hostDirectives: [
    { directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'modal', 'loopFocus'],
      outputs: ['openChange', 'onOpenChange'] },
  ],
})
export class NdsDropdownMenu {}

@Directive({ selector: 'ng-template[ndsDropdownMenuContent]' })
export class NdsDropdownMenuContent {
  readonly side = input<'top' | 'bottom' | 'left' | 'right' | undefined>(undefined);
  readonly align = input<'start' | 'center' | 'end' | undefined>(undefined);
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({
  selector: 'div[ndsDropdownMenuItem]',
  hostDirectives: [
    { directive: RdxMenuItem,
      inputs: ['disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'] },
  ],
})
export class NdsDropdownMenuItem {
  readonly variant = input<'default' | 'destructive'>('default');
  readonly inset = input(false);
}`;

/**
 * O código de extensibilidade, na língua de quem lê.
 *
 * Local, e não `t('props.extensibilityCode')`: a variante `angular` do conteúdo
 * mostra um menu controlado sem rastreio e com o item em `<button>`, seletor que
 * esta stack não tem. O exemplo daqui compila, e o rastreio que ele ensina é o
 * da família (PRD dropdown-menu §9): três eventos, `menu` e `label` como
 * identificadores estáveis, `location` como a seção da tela e o motivo pelo
 * `menuCloseReason` — a mesma tradução que as prévias desta página usam. Até
 * 2026-09-11 ele ensinava uma região inventada da tela como `location` e vinha
 * em português cravado.
 */
function extensibilitySnippet(): string {
  const label = (key: string) => t(`demonstration.labels.${key}`);
  return `<!-- ${t('snippet.controlled')} -->
<nds-dropdown-menu
  [open]="isOpen()"
  (openChange)="isOpen.set($event)"
  (onOpenChange)="onOpenChange($event)"
>
  <button ndsDropdownMenuTrigger ndsButton variant="outline">${label('account')}</button>

  <ng-template ndsDropdownMenuContent side="right" align="end" [sideOffset]="8">
    <div ndsDropdownMenuItem (onSelect)="onSelect('profile')">${label('profile')}</div>
    <div ndsDropdownMenuItem (onSelect)="onSelect('settings')">${label('settings')}</div>
    <div ndsDropdownMenuSeparator></div>
    <div ndsDropdownMenuItem variant="destructive" (onSelect)="onSelect('logout')">${label('logout')}</div>
  </ng-template>
</nds-dropdown-menu>

// ${t('snippet.inComponent')}
readonly isOpen = signal(false);

// ${t('snippet.stableIds')}
// ${t('snippet.stableIdsWhy')}
// ${t('snippet.location')}
private readonly payload = { component: 'dropdown-menu', menu: 'demo-account', location: 'docs_demo' } as const;

onOpenChange({ open, reason }: { open: boolean; reason: string }) {
  if (open) {
    track('dropdown_menu_open', this.payload);
    return;
  }
  // ${t('snippet.reasons')}
  track('dropdown_menu_close', { ...this.payload, reason: menuCloseReason(reason) });
}

onSelect(item: string) {
  track('dropdown_menu_item_select', { ...this.payload, label: item });
}`;
}

const IMPORT_CODE = `import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';
import { NdsButton } from '@/components/ui/button';`;

// ─── As prévias vivas ─────────────────────────────────────────────────────────
//
// A docs page É o produto consumidor: toda prévia desta página — as quatro
// células da demonstração, as seis fichas de Variantes e os quatro lados do Do &
// Don't — abre, escolhe e fecha com evento de verdade. Até 2026-09-11 só a
// demonstração rastreava, com ids em português (`acoes`, `configuracoes`), o
// menu no campo `label` e `location` cravado em `docs_demo` dentro do helper; as
// dez prévias das outras duas seções abriam e fechavam sem deixar rastro.
//
// Uma prévia é DADO: a lista abaixo monta o menu vivo e imprime o código da
// ficha ao lado, e é isso que impede os dois de divergirem. O texto vem sempre
// de `demonstration.labels.*` — nada de literal —, e o mesmo conjunto de chaves
// nas cinco stacks é o que o portão `demonstration_labels_divergent` compara.

/** A seção da página em que a prévia está (guideline 07). */
type PreviewLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/** Rótulo de exemplo: sempre uma chave de `demonstration.labels`, nunca literal. */
type LabelKey = `demonstration.labels.${string}`;

type ItemEntry = {
  kind: 'item';
  label: LabelKey;
  /** O valor ESTÁVEL do item — é o `label` do evento, nunca o texto traduzido. */
  value: string;
  /** Texto que segue o rótulo sem tradução: o número de "Ação 1" … "Ação 10". */
  suffix?: string;
  shortcut?: LabelKey;
  destructive?: boolean;
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
  | { kind: 'group'; label: LabelKey; entries: readonly (ItemEntry | CheckboxEntry)[] }
  | RadioGroupEntry
  | { kind: 'sub'; label: LabelKey; entries: readonly ItemEntry[] };

/**
 * O id estável de um rótulo: a chave em kebab-case (`columnEmail` →
 * `column-email`). É o `label` dos eventos — a mesma forma nas cinco stacks.
 */
function idOf(label: LabelKey): string {
  return label
    .slice('demonstration.labels.'.length)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function item(label: LabelKey, extra: Partial<Omit<ItemEntry, 'kind' | 'label'>> = {}): ItemEntry {
  return { kind: 'item', label, value: idOf(label), ...extra };
}

function checkbox(label: LabelKey, checked: boolean): CheckboxEntry {
  return { kind: 'checkbox', label, value: idOf(label), checked };
}

function option(label: LabelKey): { label: LabelKey; value: string } {
  return { label, value: idOf(label) };
}

const SEPARATOR: PreviewEntry = { kind: 'separator' };

const ACCOUNT_GROUP: PreviewEntry = {
  kind: 'group',
  label: 'demonstration.labels.account',
  entries: [item('demonstration.labels.profile'), item('demonstration.labels.settings')],
};

const SUPPORT_GROUP: PreviewEntry = {
  kind: 'group',
  label: 'demonstration.labels.support',
  entries: [item('demonstration.labels.documentation'), item('demonstration.labels.logout')],
};

/** Conta — grupo nomeado, e a saída DESTRUTIVA por último, depois do traço. */
const ACCOUNT_ENTRIES: readonly PreviewEntry[] = [
  ACCOUNT_GROUP,
  SEPARATOR,
  item('demonstration.labels.logout', { destructive: true }),
];

/** Dois grupos nomeados e o traço entre eles — o "faça" do par 1 e a ficha withLabel. */
const GROUPED_ENTRIES: readonly PreviewEntry[] = [ACCOUNT_GROUP, SEPARATOR, SUPPORT_GROUP];

/** Alternadores independentes, com o primeiro marcado. */
const COLUMNS_ENTRIES: readonly PreviewEntry[] = [
  {
    kind: 'group',
    label: 'demonstration.labels.visibleColumns',
    entries: [
      checkbox('demonstration.labels.columnName', true),
      checkbox('demonstration.labels.columnEmail', false),
      checkbox('demonstration.labels.columnRole', false),
    ],
  },
];

/** Escolha única, com o claro marcado. */
const THEME_ENTRIES: readonly PreviewEntry[] = [
  {
    kind: 'radio-group',
    label: 'demonstration.labels.appearance',
    value: 'light',
    options: [
      option('demonstration.labels.light'),
      option('demonstration.labels.dark'),
      option('demonstration.labels.system'),
    ],
  },
];

/** Hierarquia em dois níveis: o sub-gatilho não tem ação própria, ele abre o painel filho. */
const FILE_ENTRIES: readonly PreviewEntry[] = [
  item('demonstration.labels.rename'),
  {
    kind: 'sub',
    label: 'demonstration.labels.export',
    entries: [item('demonstration.labels.pdf'), item('demonstration.labels.csv')],
  },
];

/** O "evite" do par 1: dez ações soltas, sem grupo nem traço. */
const ACTIONS_ENTRIES: readonly PreviewEntry[] = Array.from({ length: 10 }, (_, i) =>
  item('demonstration.labels.action', { value: `action-${i + 1}`, suffix: ` ${i + 1}` }),
);

/** A mesma ação irreversível: separada e destrutiva ("faça") contra neutra ("evite"). */
const DELETE_DO_ENTRIES: readonly PreviewEntry[] = [
  item('demonstration.labels.rename'),
  SEPARATOR,
  item('demonstration.labels.deleteAccount', { destructive: true }),
];

const DELETE_DONT_ENTRIES: readonly PreviewEntry[] = [
  item('demonstration.labels.rename'),
  SEPARATOR,
  item('demonstration.labels.deleteAccount'),
];

const SHORTCUT_ENTRIES: readonly PreviewEntry[] = [
  item('demonstration.labels.undo', { shortcut: 'demonstration.labels.undoShortcut' }),
  item('demonstration.labels.copy', { shortcut: 'demonstration.labels.copyShortcut' }),
  SEPARATOR,
  item('demonstration.labels.paste', { shortcut: 'demonstration.labels.pasteShortcut' }),
];

/**
 * As seis fichas de Variantes, pela CHAVE do conteúdo compartilhado. A chave é
 * o `trackId` da ficha (o `snippet_id` do toggle de código) e, em kebab, o
 * `menu` dos eventos da prévia — `withCheckboxItems` → `with-checkbox-items`.
 */
const VARIANTS = [
  { key: 'default', trigger: 'demonstration.labels.account', entries: ACCOUNT_ENTRIES },
  { key: 'destructive', trigger: 'demonstration.labels.account', entries: DELETE_DO_ENTRIES },
  { key: 'withLabel', trigger: 'demonstration.labels.account', entries: GROUPED_ENTRIES },
  { key: 'withCheckboxItems', trigger: 'demonstration.labels.columns', entries: COLUMNS_ENTRIES },
  { key: 'withRadioGroup', trigger: 'demonstration.labels.theme', entries: THEME_ENTRIES },
  { key: 'withShortcuts', trigger: 'demonstration.labels.edit', entries: SHORTCUT_ENTRIES },
] as const satisfies readonly { key: string; trigger: LabelKey; entries: readonly PreviewEntry[] }[];

type VariantKey = (typeof VARIANTS)[number]['key'];

/**
 * A lista da prévia TRADUZIDA, na forma que o construtor de snippet consome.
 *
 * O construtor mora em `ui/dropdown-menu.source.ts` desde 2026-09-18 — snippet
 * montado dentro da docs page não é importável, e por isso não era testável
 * (inconsistência 22 da §7 do PRD). Aqui fica só a tradução: a chave vira texto
 * no idioma da página, e o `suffix` (o número de "Ação 1" … "Ação 10"), que não
 * se traduz, é concatenado nesta passagem.
 */
function snippetEntries(entries: readonly PreviewEntry[]): readonly DropdownMenuSnippetEntry[] {
  const leaf = (
    e: ItemEntry | CheckboxEntry,
  ): DropdownMenuSnippetItem | DropdownMenuSnippetCheckbox =>
    e.kind === 'item'
      ? {
          kind: 'item',
          label: `${t(e.label)}${e.suffix ?? ''}`,
          ...(e.shortcut ? { shortcut: t(e.shortcut) } : {}),
          ...(e.destructive ? { destructive: true } : {}),
        }
      : { kind: 'checkbox', label: t(e.label), checked: e.checked };

  return entries.map((entry): DropdownMenuSnippetEntry => {
    switch (entry.kind) {
      case 'separator':
        return { kind: 'separator' };
      case 'group':
        return { kind: 'group', label: t(entry.label), entries: entry.entries.map(leaf) };
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
          entries: entry.entries.map((child) => leaf(child) as DropdownMenuSnippetItem),
        };
      default:
        return leaf(entry);
    }
  });
}

/**
 * O código da ficha, a partir da MESMA lista que monta a prévia — com os
 * rótulos no idioma da página, para que código e prévia digam o mesmo nos três.
 *
 * O que é instrumentação da página (`(onOpenChange)`, `(onSelect)` ligados ao
 * rastreio) não entra: é andaime desta docs page, não lição do menu.
 */
function menuSnippet(trigger: LabelKey, entries: readonly PreviewEntry[]): string {
  return dropdownMenuSnippet({ triggerLabel: t(trigger), entries: snippetEntries(entries) });
}

/**
 * Uma prévia VIVA do menu — o componente de verdade, com os três eventos.
 *
 * `menu` é o id estável da prévia (`demo-account`, `with-label`, `pair1-do`…)
 * e `location` a seção em que ela está. Os dois chegam por input, e não de uma
 * constante no topo do arquivo, porque a mesma peça mora em três seções — era
 * a constante dentro do helper que fazia Variantes e Do & Don't dizerem que
 * vieram da demonstração.
 *
 * Exportada por exigência do verificador de templates (NG3004): a docs page a
 * usa no próprio template. Não é API do design system — nada fora deste arquivo
 * a importa.
 */
@Component({
  selector: 'div[ndsDropdownMenuPreview]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [...NDS_DROPDOWN_MENU, NdsButton],
  template: `
    <nds-dropdown-menu (onOpenChange)="onOpenChange($event)">
      <button ndsDropdownMenuTrigger ndsButton variant="outline" [size]="size()">
        {{ t(trigger()) }}
      </button>

      <ng-template ndsDropdownMenuContent>
        @for (entry of entries(); track $index) {
          @if (entry.kind === 'separator') {
            <div ndsDropdownMenuSeparator></div>
          } @else if (entry.kind === 'item') {
            <div
              ndsDropdownMenuItem
              [variant]="entry.destructive ? 'destructive' : 'default'"
              (onSelect)="onSelect(entry.value)"
            >
              {{ t(entry.label) }}{{ entry.suffix ?? '' }}
              @if (entry.shortcut) {
                <span ndsDropdownMenuShortcut>{{ t(entry.shortcut) }}</span>
              }
            </div>
          } @else if (entry.kind === 'checkbox') {
            <div
              ndsDropdownMenuCheckboxItem
              [checked]="isChecked(entry)"
              (checkedChange)="onCheckedChange(entry, $event)"
            >{{ t(entry.label) }}</div>
          } @else if (entry.kind === 'group') {
            <div ndsDropdownMenuGroup>
              <div ndsDropdownMenuLabel>{{ t(entry.label) }}</div>
              @for (child of entry.entries; track child.value) {
                @if (child.kind === 'item') {
                  <div
                    ndsDropdownMenuItem
                    [variant]="child.destructive ? 'destructive' : 'default'"
                    (onSelect)="onSelect(child.value)"
                  >{{ t(child.label) }}</div>
                } @else {
                  <div
                    ndsDropdownMenuCheckboxItem
                    [checked]="isChecked(child)"
                    (checkedChange)="onCheckedChange(child, $event)"
                  >{{ t(child.label) }}</div>
                }
              }
            </div>
          } @else if (entry.kind === 'radio-group') {
            <div
              ndsDropdownMenuRadioGroup
              [value]="radioValue(entry)"
              (valueChange)="onRadioChange(entry, $event)"
            >
              <div ndsDropdownMenuLabel>{{ t(entry.label) }}</div>
              @for (opt of entry.options; track opt.value) {
                <!-- A escolha é o CLIQUE no item, não a mudança de valor: escolher a
                     opção já marcada também é uma escolha, e o evento sai igual
                     nas cinco. O teclado chega aqui pelo click() da lib. -->
                <div ndsDropdownMenuRadioItem [value]="opt.value" (click)="onToggle(opt.value)">{{ t(opt.label) }}</div>
              }
            </div>
          } @else {
            <nds-dropdown-menu-sub>
              <div ndsDropdownMenuSubTrigger>{{ t(entry.label) }}</div>
              <ng-template ndsDropdownMenuSubContent>
                @for (child of entry.entries; track child.value) {
                  <div ndsDropdownMenuItem (onSelect)="onSelect(child.value)">{{ t(child.label) }}</div>
                }
              </ng-template>
            </nds-dropdown-menu-sub>
          }
        }
      </ng-template>
    </nds-dropdown-menu>
  `,
})
export class NdsDropdownMenuPreview {
  readonly menu = input.required<string>();
  readonly location = input.required<PreviewLocation>();
  readonly trigger = input.required<LabelKey>();
  readonly entries = input.required<readonly PreviewEntry[]>();
  /** As fichas e o Do & Don't usam o botão pequeno; a demonstração, o padrão. */
  readonly size = input<ButtonSize>('default');

  protected readonly t = t;

  /**
   * O estado ATUAL dos alternadores e das escolhas únicas desta prévia, pela
   * entrada da lista. O miolo do menu é desmontado ao fechar e remontado ao
   * abrir: ligado à constante da lista, ele voltava ao estado inicial a cada
   * abertura — marcar "E-mail", fechar e abrir de novo mostrava "E-mail"
   * desmarcado. As outras quatro stacks guardam o estado; esta passou a guardar
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
   * clique fora, Tab e clique no gatilho aberto têm motivo próprio na lib; o que
   * chega sem motivo é o item escolhido ou o código — `api` nos dois casos.
   */
  protected onOpenChange(change: RdxMenuOpenChange): void {
    const payload = { component: 'dropdown-menu' as const, menu: this.menu(), location: this.location() };
    if (change.open) {
      track('dropdown_menu_open', payload);
      return;
    }
    track('dropdown_menu_close', { ...payload, reason: menuCloseReason(change.reason) });
  }

  /** Item de ação: a escolha FECHA o menu, e o fechamento que vem é `api`. */
  protected onSelect(label: string): void {
    track('dropdown_menu_item_select', {
      component: 'dropdown-menu',
      menu: this.menu(),
      label,
      location: this.location(),
    });
  }

  /**
   * Marcação e escolha única também são escolha, mas NÃO fecham o menu (C10): o
   * evento sai, e o fechamento seguinte leva o motivo de quem de fato fechou.
   */
  protected onToggle(label: unknown): void {
    if (typeof label !== 'string') return;
    track('dropdown_menu_item_select', {
      component: 'dropdown-menu',
      menu: this.menu(),
      label,
      location: this.location(),
    });
  }
}

@Component({
  selector: 'nds-dropdown-menu-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsDropdownMenuPreview,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Os menus das fichas nascem FECHADOS. Um popup aberto é posicionado em
      \`fixed\` e flutua por cima do que vier depois dele: seis fichas abertas
      cobririam a própria documentação. Quem lê abre a que quiser — e o estado
      aberto é o que as stories capturam para a regressão visual.
    -->

    <!-- Par 1 — agrupar: dois grupos nomeados e o traço entre eles, contra dez
         ações soltas numa lista só. -->
    <ng-template #tplDoDont1Do>
      <div
        ndsDropdownMenuPreview
        menu="pair1-do"
        location="docs_do_dont"
        trigger="demonstration.labels.account"
        size="sm"
        [entries]="groupedEntries"
      ></div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div
        ndsDropdownMenuPreview
        menu="pair1-dont"
        location="docs_do_dont"
        trigger="demonstration.labels.menu"
        size="sm"
        [entries]="actionsEntries"
      ></div>
    </ng-template>

    <!-- Par 2 — a mesma ação irreversível: separada e na variante destrutiva,
         contra a variante padrão. Só isso muda entre os dois lados. -->
    <ng-template #tplDoDont2Do>
      <div
        ndsDropdownMenuPreview
        menu="pair2-do"
        location="docs_do_dont"
        trigger="demonstration.labels.account"
        size="sm"
        [entries]="deleteDoEntries"
      ></div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div
        ndsDropdownMenuPreview
        menu="pair2-dont"
        location="docs_do_dont"
        trigger="demonstration.labels.account"
        size="sm"
        [entries]="deleteDontEntries"
      ></div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div
        ndsDropdownMenuPreview
        menu="default"
        location="docs_variantes"
        trigger="demonstration.labels.account"
        size="sm"
        [entries]="variants[0].entries"
      ></div>
    </ng-template>
    <ng-template #tplVarDestructive>
      <div
        ndsDropdownMenuPreview
        menu="destructive"
        location="docs_variantes"
        trigger="demonstration.labels.account"
        size="sm"
        [entries]="variants[1].entries"
      ></div>
    </ng-template>
    <ng-template #tplVarLabel>
      <div
        ndsDropdownMenuPreview
        menu="with-label"
        location="docs_variantes"
        trigger="demonstration.labels.account"
        size="sm"
        [entries]="variants[2].entries"
      ></div>
    </ng-template>
    <ng-template #tplVarCheckbox>
      <div
        ndsDropdownMenuPreview
        menu="with-checkbox-items"
        location="docs_variantes"
        trigger="demonstration.labels.columns"
        size="sm"
        [entries]="variants[3].entries"
      ></div>
    </ng-template>
    <ng-template #tplVarRadio>
      <div
        ndsDropdownMenuPreview
        menu="with-radio-group"
        location="docs_variantes"
        trigger="demonstration.labels.theme"
        size="sm"
        [entries]="variants[4].entries"
      ></div>
    </ng-template>
    <ng-template #tplVarShortcuts>
      <div
        ndsDropdownMenuPreview
        menu="with-shortcuts"
        location="docs_variantes"
        trigger="demonstration.labels.edit"
        size="sm"
        [entries]="variants[5].entries"
      ></div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="dropdown-menu"
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
        <!-- Quatro células, cada uma com a LEGENDA do conteúdo compartilhado em
             cima e o menu embaixo — a legenda diz o que a célula demonstra, e o
             gatilho diz o que o menu é (Conta, Colunas, Tema, Arquivo), como no
             Vanilla. Até 2026-09-11 a legenda ia DENTRO do botão. -->
        <nds-docs-demonstration>
          <div class="nds-cluster" data-spacing="md">
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('demonstration.labels.basic') }}
              </p>
              <div
                ndsDropdownMenuPreview
                menu="demo-account"
                location="docs_demo"
                trigger="demonstration.labels.account"
                [entries]="accountEntries"
              ></div>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('demonstration.labels.withCheckbox') }}
              </p>
              <div
                ndsDropdownMenuPreview
                menu="demo-columns"
                location="docs_demo"
                trigger="demonstration.labels.columns"
                [entries]="columnsEntries"
              ></div>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('demonstration.labels.withRadio') }}
              </p>
              <div
                ndsDropdownMenuPreview
                menu="demo-theme"
                location="docs_demo"
                trigger="demonstration.labels.theme"
                [entries]="themeEntries"
              ></div>
            </div>
            <div class="nds-stack" data-spacing="sm">
              <p class="nds-text-caption nds-font-medium nds-text-muted-foreground">
                {{ t('demonstration.labels.withSubmenu') }}
              </p>
              <div
                ndsDropdownMenuPreview
                menu="demo-file"
                location="docs_demo"
                trigger="demonstration.labels.file"
                [entries]="fileEntries"
              ></div>
            </div>
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
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [pairs]="doDontPairs()" />

        <nds-docs-import
          [code]="importCode"
          componentSlug="dropdown-menu"
          language="ts"
        />

        <nds-docs-compositions
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="dropdown-menu"
          id="variantes"
        />

        <nds-docs-states
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityCode]="extensibilityCode()"
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
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [items]="relatedItems()"
          componentSlug="dropdown-menu"
        />

        <nds-docs-notes
          [items]="noteItems()"
          componentSlug="dropdown-menu"
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
export class NdsDropdownMenuDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly interfaceCode = INTERFACE_CODE;
  /** Recalculado na troca de idioma: os comentários e rótulos vêm de `t()`. */
  protected readonly extensibilityCode = computed(() => {
    dict();
    return extensibilitySnippet();
  });
  protected readonly importCode = IMPORT_CODE;

  // Expostos ao template porque expressão de template Angular não enxerga o
  // escopo do módulo.
  protected readonly accountEntries = ACCOUNT_ENTRIES;
  protected readonly columnsEntries = COLUMNS_ENTRIES;
  protected readonly themeEntries = THEME_ENTRIES;
  protected readonly fileEntries = FILE_ENTRIES;
  protected readonly groupedEntries = GROUPED_ENTRIES;
  protected readonly actionsEntries = ACTIONS_ENTRIES;
  protected readonly deleteDoEntries = DELETE_DO_ENTRIES;
  protected readonly deleteDontEntries = DELETE_DONT_ENTRIES;
  protected readonly variants = VARIANTS;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarLabel = viewChild.required<TemplateRef<unknown>>('tplVarLabel');
  private readonly tplVarCheckbox = viewChild.required<TemplateRef<unknown>>('tplVarCheckbox');
  private readonly tplVarRadio = viewChild.required<TemplateRef<unknown>>('tplVarRadio');
  private readonly tplVarShortcuts = viewChild.required<TemplateRef<unknown>>('tplVarShortcuts');

  protected readonly navGroups = computed(() => {
    dict();
    return NAV_GROUPS.map((g) => ({
      label: tNav(g.labelKey),
      sections: g.sections.map((s) => ({ id: s.id, label: tNav(s.labelKey) })),
    }));
  });

  protected readonly anatomyItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4, 5].map((i) => t(`usage.guidelines.item${i}`)),
    };
  });

  protected readonly scenarios = computed(() => {
    const d = dict();
    return {
      title: t('usage.scenarios.title'),
      cols: {
        scenario: t('usage.scenarios.cols.scenario'),
        use: t('usage.scenarios.cols.use'),
        alternative: t('usage.scenarios.cols.alternative'),
      },
      items: itemsFromDict(d, 'usage.scenarios', ['s', 'u', 'a']),
    };
  });

  protected readonly uxWriting = computed(() => {
    dict();
    return {
      title: t('usage.uxWriting.title'),
      cols: {
        element: t('usage.uxWriting.table.element'),
        rules: t('usage.uxWriting.table.rules'),
        do: t('usage.uxWriting.table.correct'),
        dont: t('usage.uxWriting.table.avoid'),
      },
      items: ['trigger', 'label', 'item', 'destructive'].map((key) => ({
        element: toPlainText(t(`usage.uxWriting.table.${key}.name`)),
        rules: toPlainText(t(`usage.uxWriting.table.${key}.format`)),
        do: toPlainText(t(`usage.uxWriting.table.${key}.good`)),
        dont: toPlainText(t(`usage.uxWriting.table.${key}.bad`)),
      })),
    };
  });

  protected readonly usageDo = computed(() => {
    dict();
    return { title: t('usage.do.title'), items: [1, 2, 3, 4].map((i) => t(`usage.do.item${i}`)) };
  });

  protected readonly usageDont = computed(() => {
    dict();
    return { title: t('usage.dont.title'), items: [1, 2, 3, 4].map((i) => t(`usage.dont.item${i}`)) };
  });

  protected readonly doDontPairs = computed(() => {
    dict();
    const pairs: [TemplateRef<unknown>, TemplateRef<unknown>][] = [
      [this.tplDoDont1Do(), this.tplDoDont1Dont()],
      [this.tplDoDont2Do(), this.tplDoDont2Dont()],
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
   * As duas ênfases de item e as quatro composições canônicas saem na MESMA
   * seção: o conteúdo compartilhado guarda as seis em `variants.items`, e as
   * duas primeiras descrevem-se por `variants.styles`, sem "quando usar".
   *
   * `trackId` é a CHAVE do conteúdo (`withCheckboxItems`), como nas outras
   * quatro stacks — o `snippet_id` do toggle de código não pode mudar de nome
   * de uma stack para outra. O código de cada ficha sai da MESMA lista que monta
   * a prévia (`menuSnippet`), então os dois não divergem.
   */
  protected readonly variantItems = computed(() => {
    dict();
    const templates: Record<VariantKey, TemplateRef<unknown>> = {
      default: this.tplVarDefault(),
      destructive: this.tplVarDestructive(),
      withLabel: this.tplVarLabel(),
      withCheckboxItems: this.tplVarCheckbox(),
      withRadioGroup: this.tplVarRadio(),
      withShortcuts: this.tplVarShortcuts(),
    };
    return VARIANTS.map(({ key, trigger, entries }) => {
      const code = menuSnippet(trigger, entries);
      if (key === 'default' || key === 'destructive') {
        return {
          name: t(`variants.items.${key}`),
          description: stripHtml(t(`variants.styles.${key}`)),
          trackId: key,
          code,
          preview: templates[key],
        };
      }
      return {
        name: t(`variants.items.${key}.name`),
        description: t(`variants.items.${key}.description`),
        useWhen: t(`variants.items.${key}.use`),
        trackId: key,
        code,
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
    return ['closed', 'open', 'disabled', 'checked'].map((k) => ({
      label: t(`states.${k}.label`),
      trigger: toPlainText(t(`states.${k}.trigger`)),
      behavior: toPlainText(t(`states.${k}.behavior`)),
    }));
  });

  protected readonly propTables = computed(() => {
    dict();
    const cols = {
      prop: t('props.table.prop'),
      type: t('props.table.type'),
      default: t('props.table.default'),
      required: t('props.table.required'),
      description: t('props.table.description'),
    };
    const not = tNav('common.no');
    const sim = tNav('common.yes');

    /** Linha cujo tipo/padrão/descrição vêm da tabela do conteúdo compartilhado. */
    const ofContent = (name: string, key: string, type?: string) => ({
      name: name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: toPlainText(t(`props.table.${key}.default`)),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });

    /**
     * Linha que só existe neste stack — descrição vem do override.
     *
     * O override é o MÍNIMO: toda prop que o conteúdo compartilhado descreve
     * entra por `ofContent`, e só o que este stack acrescenta de verdade cai
     * aqui. Até 2026-09-18 havia também uma linha `class` — e o texto dela
     * dizia que não existe prop de classe, ou seja, uma linha de tabela de
     * PROPS para algo que não é prop.
     */
    const local = (name: string, type: string, defaultValue: string, key: string) => ({
      name: name,
      type: type,
      defaultValue,
      required: not,
      description: toPlainText(t(`props.${key}.description`)),
    });

    return [
      {
        title: 'NdsDropdownMenu',
        cols,
        items: [
          ofContent('open', 'open', 'model<boolean>'),
          ofContent('openChange', 'onOpenChange', 'output<boolean>'),
          local('onOpenChange', 'output<{ open: boolean; reason: string }>', '—', 'openChangeDetail'),
          ofContent('defaultOpen', 'defaultOpen'),
          ofContent('modal', 'modal'),
          local('disabled', 'boolean', 'false', 'disabled'),
          local('loopFocus', 'boolean', 'true', 'loopFocus'),
        ],
      },
      {
        title: 'NdsDropdownMenuContent',
        cols,
        items: [
          ofContent('side', 'side'),
          ofContent('align', 'align'),
          local('sideOffset', 'number', '4', 'sideOffset'),
          local('alignOffset', 'number', '0', 'alignOffset'),
        ],
      },
      {
        title: 'NdsDropdownMenuItem',
        cols,
        items: [
          local('variant', "'default' | 'destructive'", "'default'", 'variant'),
          local('inset', 'boolean', 'false', 'inset'),
          local('disabled', 'boolean', 'false', 'itemDisabled'),
          local('closeOnClick', 'boolean', 'true', 'closeOnClick'),
          local('onSelect', 'output<void>', '—', 'onSelect'),
        ],
      },
      {
        title: 'NdsDropdownMenuCheckboxItem',
        cols,
        items: [
          local('checked', 'model<boolean>', 'false', 'checked'),
          local('checkedChange', 'output<boolean>', '—', 'checkedChange'),
          local('disabled', 'boolean', 'false', 'itemDisabled'),
        ],
      },
      {
        title: 'NdsDropdownMenuRadioGroup + NdsDropdownMenuRadioItem',
        cols,
        items: [
          local('value', 'model<T>', '—', 'groupValue'),
          local('valueChange', 'output<T>', '—', 'groupValueChange'),
          {
            name: 'value (item)',
            type: 'T',
            defaultValue: '—',
            required: sim,
            description: toPlainText(t('props.itemValue.description')),
          },
        ],
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
    // A coluna do meio mostra a classe `.nds-*` real, não a classe utilitária
    // que o conteúdo compartilhado guarda — é o que existe no CSS deste sistema.
    return [
      { token: '--popover',            k: 'background',  className: '.nds-dropdown-menu-content'   },
      { token: '--popover-foreground', k: 'foreground',  className: '.nds-dropdown-menu-content'   },
      { token: '--border',             k: 'border',      className: '.nds-dropdown-menu-content'   },
      { token: '--elevation-md',       k: 'shadow',      className: '.nds-dropdown-menu-content'   },
      { token: '--radius',             k: 'rounded',     className: '.nds-dropdown-menu-content'   },
      { token: '--accent',             k: 'itemHover',   className: '.nds-dropdown-menu-item'      },
      { token: '--destructive',        k: 'destructive', className: '.nds-dropdown-menu-item'      },
    ].map(({ token, k, className }) => ({
      token,
      value: className,
      description: toPlainText(t(`tokens.table.${k}.part`)),
    }));
  });

  protected readonly a11yItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => t(`accessibility.items.item${i}`));
  });

  protected readonly keyboardItems = computed(() => {
    dict();
    return [
      { key: 'Tab',           description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: '↑ ↓ ← →',       description: toPlainText(t('accessibility.keyboard.arrows')) },
      { key: 'Enter / Space', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Esc',           description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Home / End',    description: toPlainText(t('accessibility.keyboard.homeEnd')) },
      { key: 'A-Z',           description: toPlainText(t('accessibility.keyboard.typeahead')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = dropdownMenuTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >;
    const sr = { ...(byLocale[locale]?.accessibility?.screenReader ?? {}) };
    // `title` é rótulo da subseção, não anúncio — entraria como item da lista.
    delete sr['title'];
    return Object.values(sr);
  });

  protected readonly relatedItems = computed(() => {
    dict();
    return [
      { key: 'contextMenu', path: '?path=/docs/components-overlay-contextmenu--docs' },
      { key: 'menubar',     path: '?path=/docs/components-navigation-menubar--docs'     },
      { key: 'command',     path: '?path=/docs/components-overlay-command--docs'     },
      { key: 'popover',     path: '?path=/docs/components-overlay-popover--docs'     },
      { key: 'select',      path: '?path=/docs/components-form-select--docs'      },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    // CINCO, que é o que o conteúdo compartilhado tem e o que as outras quatro
    // stacks mostram. Até 2026-09-18 eram sete, com `item6`/`item7` nascendo só
    // aqui (inconsistência 21(b) da §7 do PRD).
    return [1, 2, 3, 4, 5].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
  });

  protected readonly analyticsCols = computed(() => {
    dict();
    return {
      event: t('analytics.table.event'),
      trigger: t('analytics.table.trigger'),
      payload: t('analytics.table.payload'),
    };
  });

  /**
   * A tabela vem do CONTEÚDO (`analytics.table.*`), como a do ContextMenu. Até
   * 2026-09-11 as linhas eram cravadas aqui, com a descrição inteira repetida
   * como gatilho de cada evento e o payload antigo (`label` na abertura).
   */
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
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // tabs e do radio-group.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: stringsFromDict(d, 'testes.accessibility').map((criterion) => ({
        criterion: toPlainText(criterion),
        level: '—',
        how: 'axe + play',
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
        componentSlug: 'dropdown-menu',
      });
      track('docs_page_view', {
        component_name: 'dropdown-menu',
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
          component_name: 'dropdown-menu',
          section_id: id,
          locale: getLocale(),
        }),
    );
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function priorityLabel(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no dicionário.
 *
 * Contar à mão (`[1, 2, 3].map(...)`) trava a lista no tamanho de hoje: o
 * conteúdo compartilhado ganha um item e ele simplesmente não existe para quem
 * lê — sem erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com
 * o sétimo critério de acessibilidade deste componente.
 */
function stringsFromDict(d: Record<string, string>, base: string): string[] {
  const out: string[] = [];
  for (let i = 1; d[`${base}.item${i}`] !== undefined; i++) out.push(d[`${base}.item${i}`]);
  return out;
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
