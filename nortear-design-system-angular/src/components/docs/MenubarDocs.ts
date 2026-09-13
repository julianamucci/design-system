import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
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
import { NDS_MENUBAR, MenuCloseTracker } from '@/components/ui/menubar';
import uiTranslations from '@/i18n/ui.json';
import menubarTranslations from '@shared/content/menubar/translations.json';

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
// `notes.item1` — o texto compartilhado lista as libs das outras stacks pelo
// nome, e cada docs page é consumida isoladamente.
// `notes.item2` / `notes.item6` — o comportamento descrito é o desta stack: o
// popup é desmontado ao fechar, e o gatilho já é o `<button>` estilizado da
// barra, sem composição com o botão do sistema.
// `props.*` — a tabela do conteúdo compartilhado descreve um menu ativo
// controlado na barra, que não é a forma deste stack: aqui quem controla
// abertura é cada menu.
// `snippet.*` — os COMENTÁRIOS do código de extensibilidade desta stack, que é
// montado por `extensibilitySnippet()` na língua de quem lê. É prosa, não
// snippet: o código em si vive no arquivo, os rótulos vêm de
// `demonstration.labels.*`.
const { t, dict } = useTranslation(menubarTranslations as Record<string, unknown>, {
  'pt-BR': {
    'snippet.controlled': 'Menu controlado, com posicionamento e analytics',
    'snippet.inComponent': 'no componente',
    'snippet.tracker':
      'A passagem ao menu vizinho e o clique no gatilho aberto chegam da lib sem motivo:',
    'snippet.trackerWhy':
      'o MenuCloseTracker os separa do menu fechado pelo código, ouvindo a barra em captura.',
    'snippet.stableIds':
      'O payload leva IDENTIFICADORES estáveis, em inglês e kebab-case — o do menu e o do item —,',
    'snippet.stableIdsWhy':
      'nunca o rótulo traduzido: o rótulo partiria um evento em três no GA4, um por idioma.',
    'snippet.location':
      'location é a SEÇÃO da tela onde a barra mora: nestas docs, docs_<seção>; no produto, a seção dele.',
    'snippet.reasons':
      'escape: Escape · overlay: clique fora, Tab, gatilho aberto ou menu vizinho · api: item ou código',
    'props.class.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
    'props.modal.description':
      'Enquanto um menu está aberto, bloqueia a interação com o resto da página e a rolagem. Vale para todos os menus da barra.',
    'props.barDisabled.description':
      'Desliga a barra inteira: nenhum gatilho abre, e as setas não movem o foco.',
    'props.open.description':
      'Abertura controlada deste menu. Aceita ligação de mão dupla.',
    'props.openChange.description': 'Emite o novo estado de abertura deste menu.',
    'props.defaultOpen.description':
      'Abre este menu já na montagem, em modo não-controlado.',
    'props.menuDisabled.description':
      'Bloqueia a abertura deste menu. O gatilho continua na barra, anunciado como indisponível.',
    'props.sideOffset.description':
      'Distância em pixels entre o popup e o gatilho. Submenu nasce encostado; menu da barra, a 8px.',
    'props.alignOffset.description':
      'Deslocamento em pixels no eixo do alinhamento, para casar o texto do primeiro item com o do gatilho.',
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
    'props.checked.description': 'Estado do alternador. Aceita ligação de mão dupla.',
    'props.checkedChange.description': 'Emite o novo estado do alternador.',
    'props.groupValue.description':
      'Valor escolhido no grupo. Aceita ligação de mão dupla.',
    'props.groupValueChange.description': 'Emite o valor recém-escolhido.',
    'props.itemValue.description':
      'Valor desta opção. É o que o grupo compara para decidir quem está marcado.',
    'props.openChangeDetail.description':
      'Emite a mudança de abertura deste menu junto do motivo ({ open, reason }): diz se ele fechou por Escape, por clique fora, por passagem ao menu vizinho ou por item escolhido.',
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/menubar</code> coordena os menus de <code>@radix-ng/primitives/menu</code> — daí vêm o papel de barra, as setas Esquerda/Direita entre gatilhos (abrindo o vizinho quando um menu já está aberto), Home/End, a troca de menu por ponteiro e a parada única de tabulação.',
    'notes.item2':
      '<strong>Portal</strong>: o painel é teleportado para o <code>body</code> ao abrir e desmontado ao fechar, então nenhum <code>overflow: hidden</code> de ancestral o recorta. Fechado, ele não existe no DOM — não é um painel escondido.',
    'notes.item6':
      '<strong>Gatilho</strong>: é um <code>&lt;button&gt;</code> com o estilo próprio da barra, não o botão do sistema. Ele recebe papel de item de menu, porque num menubar o gatilho pertence à barra, e não é uma parada de tabulação separada.',
  },
  en: {
    'snippet.controlled': 'Controlled menu, with positioning and analytics',
    'snippet.inComponent': 'in the component',
    'snippet.tracker':
      'Moving to the next menu and clicking the open trigger reach you from the lib with no reason:',
    'snippet.trackerWhy':
      'MenuCloseTracker tells them apart from a menu closed by code, listening to the bar in capture.',
    'snippet.stableIds':
      'The payload carries STABLE identifiers, in English and kebab-case — the menu one and the item one —,',
    'snippet.stableIdsWhy':
      'never the translated label: the label would split one event into three in GA4, one per language.',
    'snippet.location':
      'location is the SECTION of the screen where the bar lives: in these docs, docs_<section>; in the product, its own.',
    'snippet.reasons':
      'escape: Escape · overlay: click outside, Tab, open trigger or next menu · api: item or code',
    'props.class.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
    'props.modal.description':
      'While a menu is open, blocks interaction with the rest of the page and page scrolling. Applies to every menu on the bar.',
    'props.barDisabled.description':
      'Turns the whole bar off: no trigger opens, and arrow keys do not move focus.',
    'props.open.description': 'Controlled open state of this menu. Supports two-way binding.',
    'props.openChange.description': 'Emits the new open state of this menu.',
    'props.defaultOpen.description': 'Opens this menu on mount, in uncontrolled mode.',
    'props.menuDisabled.description':
      'Blocks this menu from opening. The trigger stays on the bar, announced as unavailable.',
    'props.sideOffset.description':
      'Distance in pixels between popup and trigger. A submenu opens flush; a bar menu at 8px.',
    'props.alignOffset.description':
      'Offset in pixels along the alignment axis, to line the first item text up with the trigger text.',
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
      'Emits the open change of this menu together with its reason ({ open, reason }): tells whether it closed by Escape, by a click outside, by moving to the next menu or by a chosen item.',
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/menubar</code> coordinates the menus from <code>@radix-ng/primitives/menu</code> — that is where the bar role, the Left/Right arrows between triggers (opening the neighbour when a menu is already open), Home/End, pointer menu switching and the single tab stop come from.',
    'notes.item2':
      '<strong>Portal</strong>: the panel is teleported to the <code>body</code> on open and unmounted on close, so no ancestor <code>overflow: hidden</code> clips it. While closed it is absent from the DOM — not a hidden panel.',
    'notes.item6':
      '<strong>Trigger</strong>: it is a <code>&lt;button&gt;</code> with the bar styling, not the system button. It takes a menu item role, because in a menubar the trigger belongs to the bar and is not a separate tab stop.',
  },
  es: {
    'snippet.controlled': 'Menú controlado, con posicionamiento y analytics',
    'snippet.inComponent': 'en el componente',
    'snippet.tracker':
      'El paso al menú vecino y el clic en el disparador abierto llegan de la lib sin motivo:',
    'snippet.trackerWhy':
      'MenuCloseTracker los separa del menú cerrado por código, escuchando la barra en captura.',
    'snippet.stableIds':
      'El payload lleva IDENTIFICADORES estables, en inglés y kebab-case — el del menú y el del ítem —,',
    'snippet.stableIdsWhy':
      'nunca la etiqueta traducida: la etiqueta partiría un evento en tres en GA4, uno por idioma.',
    'snippet.location':
      'location es la SECCIÓN de la pantalla donde vive la barra: en estas docs, docs_<sección>; en el producto, la suya.',
    'snippet.reasons':
      'escape: Escape · overlay: clic fuera, Tab, disparador abierto o menú vecino · api: ítem o código',
    'props.class.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
    'props.modal.description':
      'Mientras un menú está abierto, bloquea la interacción con el resto de la página y el desplazamiento. Vale para todos los menús de la barra.',
    'props.barDisabled.description':
      'Apaga la barra entera: ningún disparador abre, y las flechas no mueven el foco.',
    'props.open.description': 'Apertura controlada de este menú. Admite enlace de doble vía.',
    'props.openChange.description': 'Emite el nuevo estado de apertura de este menú.',
    'props.defaultOpen.description': 'Abre este menú al montar, en modo no controlado.',
    'props.menuDisabled.description':
      'Bloquea la apertura de este menú. El disparador sigue en la barra, anunciado como no disponible.',
    'props.sideOffset.description':
      'Distancia en píxeles entre el popup y el disparador. El submenú nace pegado; el menú de la barra, a 8px.',
    'props.alignOffset.description':
      'Desplazamiento en píxeles en el eje de alineación, para casar el texto del primer item con el del disparador.',
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
      'Emite el cambio de apertura de este menú junto con el motivo ({ open, reason }): dice si se cerró por Escape, por clic fuera, por paso al menú vecino o por ítem elegido.',
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/menubar</code> coordina los menús de <code>@radix-ng/primitives/menu</code> — de ahí vienen el papel de barra, las flechas Izquierda/Derecha entre disparadores (abriendo el vecino cuando un menú ya está abierto), Home/End, el cambio de menú por puntero y la parada única de tabulación.',
    'notes.item2':
      '<strong>Portal</strong>: el panel se teletransporta al <code>body</code> al abrir y se desmonta al cerrar, así ningún <code>overflow: hidden</code> ancestro lo recorta. Cerrado no existe en el DOM — no es un panel escondido.',
    'notes.item6':
      '<strong>Disparador</strong>: es un <code>&lt;button&gt;</code> con el estilo propio de la barra, no el botón del sistema. Recibe papel de item de menú, porque en un menubar el disparador pertenece a la barra y no es una parada de tabulación aparte.',
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
// seção. Uma seção de composições sem conteúdo seria placeholder.
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
  selector: 'nds-menubar',
  hostDirectives: [
    { directive: RdxMenubarRoot, inputs: ['disabled', 'modal', 'loopFocus'] },
  ],
})
export class NdsMenubar {}

@Component({
  selector: 'nds-menubar-menu, nds-menubar-sub',
  hostDirectives: [
    { directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'loopFocus'],
      outputs: ['openChange', 'onOpenChange'] },
  ],
})
export class NdsMenubarMenu {}

@Directive({ selector: 'ng-template[ndsMenubarContent]' })
export class NdsMenubarContent {
  readonly side = input<'top' | 'bottom' | 'left' | 'right' | undefined>(undefined);
  readonly align = input<'start' | 'center' | 'end' | undefined>(undefined);
  readonly tpl = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({
  selector: 'div[ndsMenubarItem]',
  hostDirectives: [
    { directive: RdxMenuItem,
      inputs: ['disabled', 'closeOnClick', 'label'],
      outputs: ['onSelect'] },
  ],
})
export class NdsMenubarItem {
  readonly variant = input<'default' | 'destructive'>('default');
  readonly inset = input(false);
}`;

/**
 * O código de extensibilidade, na língua de quem lê.
 *
 * Local, e não `t('props.extensibilityCode')`: a variante `angular` do
 * conteúdo mostra só a abertura controlada, sem rastreio. O exemplo daqui
 * compila, e o rastreio que ele ensina é o da família (PRD dropdown-menu §9):
 * `menubar_open`, `menubar_close` com o motivo e `menubar_item_select`, com
 * `menu` no formato das prévias (`demo-file`), `location` como a seção da tela
 * e o motivo pelo `MenuCloseTracker` — o mesmo que as barras desta página usam.
 * Até 2026-09-11 ele ensinava uma região inventada da tela como `location` e o
 * gatilho sem o id da prévia como `menu`, em português cravado.
 */
function extensibilitySnippet(): string {
  const label = (key: string) => t(`demonstration.labels.${key}`);
  return `<!-- ${t('snippet.controlled')} -->
<nds-menubar [loopFocus]="false">
  <nds-menubar-menu
    [open]="fileOpen()"
    (openChange)="fileOpen.set($event)"
    (onOpenChange)="onOpenChange('demo-file', $event)"
  >
    <button ndsMenubarTrigger>${label('file')}</button>

    <ng-template ndsMenubarContent align="end" [sideOffset]="12">
      <div ndsMenubarItem (onSelect)="onSelect('demo-file', 'new')">${label('new')}</div>
      <div ndsMenubarItem (onSelect)="onSelect('demo-file', 'open')">${label('open')}</div>
      <div ndsMenubarItem (onSelect)="onSelect('demo-file', 'save')">${label('save')}</div>
    </ng-template>
  </nds-menubar-menu>
</nds-menubar>

// ${t('snippet.inComponent')}
readonly fileOpen = signal(false);

// ${t('snippet.tracker')}
// ${t('snippet.trackerWhy')}
private readonly closeTracker = new MenuCloseTracker();

constructor() {
  inject(DestroyRef).onDestroy(this.closeTracker.watch(inject(ElementRef).nativeElement));
}

// ${t('snippet.stableIds')}
// ${t('snippet.stableIdsWhy')}
// ${t('snippet.location')}
onOpenChange(menu: string, { open, reason }: { open: boolean; reason: string }) {
  const payload = { component: 'menubar', menu, location: 'docs_demo' } as const;
  if (open) {
    this.closeTracker.opened(menu);
    track('menubar_open', payload);
    return;
  }
  // ${t('snippet.reasons')}
  track('menubar_close', { ...payload, reason: this.closeTracker.closed(menu, reason) });
}

onSelect(menu: string, item: string) {
  this.closeTracker.chose(menu);
  track('menubar_item_select', { component: 'menubar', menu, label: item, location: 'docs_demo' });
}`;
}

const IMPORT_CODE = `import { NDS_MENUBAR } from '@/components/ui/menubar';`;

// ─── As prévias vivas ─────────────────────────────────────────────────────────
//
// A docs page É o produto consumidor: toda barra desta página — a demonstração,
// as seis fichas de Variantes e os quatro lados do Do & Don't — abre, escolhe e
// fecha com evento de verdade. Até 2026-09-11 nenhuma disparava nada, e o
// conteúdo prometia eventos que o tipo não tinha.
//
// Uma barra é DADO: a lista abaixo monta a barra viva e imprime o código da
// ficha ao lado. O texto vem sempre de `demonstration.labels.*` — os gatilhos
// pelas chaves `file`, `edit`, `view`… e nunca pelas legendas antigas
// (`fileMenu`, "Menu Arquivo (com submenu)"), que este stack punha DENTRO do
// gatilho e também como rótulo de grupo e de sub-gatilho.

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
};

/** `checked` é o estado INICIAL; o atual mora na prévia (`checkedState`). */
type CheckboxEntry = { kind: 'checkbox'; label: LabelKey; value: string; checked: boolean };

/** `value` é a escolha INICIAL; a atual mora na prévia (`radioState`). */
type RadioGroupEntry = {
  kind: 'radio-group';
  label?: LabelKey;
  value: string;
  options: readonly { label: LabelKey; value: string }[];
};

/** Submenu dentro de submenu — só o "evite" do par 2 o usa, e é esse o assunto dele. */
type NestedSubEntry = { kind: 'sub'; label: LabelKey; entries: readonly ItemEntry[] };

type PreviewEntry =
  | ItemEntry
  | CheckboxEntry
  | { kind: 'separator' }
  /** Rótulo DENTRO do grupo, que é o nome dele — rótulo solto não nomeia nada. */
  | { kind: 'group'; label: LabelKey; entries: readonly (ItemEntry | CheckboxEntry)[] }
  | RadioGroupEntry
  | { kind: 'sub'; label: LabelKey; entries: readonly (ItemEntry | NestedSubEntry)[] };

/** Um menu da barra: o gatilho (chave do conteúdo) e o que ele abre. */
type BarMenu = { trigger: LabelKey; entries: readonly PreviewEntry[] };

/**
 * O id estável de um rótulo: a chave em kebab-case (`showRuler` →
 * `show-ruler`). É o `label` dos eventos e, no gatilho, o sufixo do `menu`.
 */
function idOf(label: LabelKey): string {
  return label
    .slice('demonstration.labels.'.length)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * O `menu` dos eventos: barra de um menu só → o id da prévia; barra de vários →
 * o id da prévia, hífen e a chave do gatilho (`demo-file`, `pair1-do-edit`).
 */
function menuIdOf(preview: string, menus: readonly BarMenu[], menu: BarMenu): string {
  return menus.length === 1 ? preview : `${preview}-${idOf(menu.trigger)}`;
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

/** A demonstração: UMA barra, quatro menus, igual nas cinco stacks. */
const DEMO_MENUS: readonly BarMenu[] = [
  {
    trigger: 'demonstration.labels.file',
    entries: [
      item('demonstration.labels.new', { shortcut: 'demonstration.labels.newShortcut' }),
      item('demonstration.labels.open', { shortcut: 'demonstration.labels.openShortcut' }),
      item('demonstration.labels.save', { shortcut: 'demonstration.labels.saveShortcut' }),
      SEPARATOR,
      {
        kind: 'sub',
        label: 'demonstration.labels.export',
        entries: [item('demonstration.labels.pdf'), item('demonstration.labels.csv')],
      },
      SEPARATOR,
      item('demonstration.labels.quit', { shortcut: 'demonstration.labels.quitShortcut' }),
    ],
  },
  {
    trigger: 'demonstration.labels.edit',
    entries: [
      item('demonstration.labels.undo', { shortcut: 'demonstration.labels.undoShortcut' }),
      item('demonstration.labels.redo', { shortcut: 'demonstration.labels.redoShortcut' }),
      SEPARATOR,
      item('demonstration.labels.cut', { shortcut: 'demonstration.labels.cutShortcut' }),
      item('demonstration.labels.copy', { shortcut: 'demonstration.labels.copyShortcut' }),
      item('demonstration.labels.paste', { shortcut: 'demonstration.labels.pasteShortcut' }),
    ],
  },
  {
    trigger: 'demonstration.labels.view',
    entries: [
      {
        kind: 'group',
        label: 'demonstration.labels.appearance',
        entries: [
          checkbox('demonstration.labels.darkMode', false),
          checkbox('demonstration.labels.showRuler', true),
        ],
      },
      SEPARATOR,
      item('demonstration.labels.fullScreen', { shortcut: 'demonstration.labels.fullScreenShortcut' }),
    ],
  },
  {
    trigger: 'demonstration.labels.tools',
    entries: [
      item('demonstration.labels.find', { shortcut: 'demonstration.labels.findShortcut' }),
      item('demonstration.labels.replace', { shortcut: 'demonstration.labels.replaceShortcut' }),
      SEPARATOR,
      {
        kind: 'radio-group',
        value: 'system-theme',
        options: [
          option('demonstration.labels.lightTheme'),
          option('demonstration.labels.darkTheme'),
          option('demonstration.labels.systemTheme'),
        ],
      },
    ],
  },
];

/**
 * Do & Don't: cada par muda UMA coisa entre os dois lados, e é a coisa de que a
 * legenda fala.
 *
 *  · par 1 — categorias numa barra de três menus, com três itens cada (a regra
 *    `usage.guidelines.item3` pede de 3 a 10), contra uma barra que é um menu
 *    só com uma ação;
 *  · par 2 — um nível, com atalho, contra submenu dentro de submenu. O "evite"
 *    é VIVO: aninhar dois níveis é o que o componente permite e a legenda
 *    desaconselha.
 */
const PAIR1_DO_MENUS: readonly BarMenu[] = [
  {
    trigger: 'demonstration.labels.file',
    entries: [
      item('demonstration.labels.new'),
      item('demonstration.labels.open'),
      item('demonstration.labels.save'),
    ],
  },
  {
    trigger: 'demonstration.labels.edit',
    entries: [
      item('demonstration.labels.undo'),
      item('demonstration.labels.copy'),
      item('demonstration.labels.paste'),
    ],
  },
  {
    // "Mostrar régua" como item de AÇÃO: o assunto do par é a categoria, não
    // o alternador.
    trigger: 'demonstration.labels.view',
    entries: [
      item('demonstration.labels.zoom'),
      item('demonstration.labels.fullScreen'),
      item('demonstration.labels.showRuler'),
    ],
  },
];

const PAIR1_DONT_MENUS: readonly BarMenu[] = [
  { trigger: 'demonstration.labels.menu', entries: [item('demonstration.labels.singleAction')] },
];

const PAIR2_DO_MENUS: readonly BarMenu[] = [
  {
    trigger: 'demonstration.labels.file',
    entries: [
      item('demonstration.labels.save', { shortcut: 'demonstration.labels.saveShortcut' }),
      item('demonstration.labels.open', { shortcut: 'demonstration.labels.openShortcut' }),
    ],
  },
];

const PAIR2_DONT_MENUS: readonly BarMenu[] = [
  {
    trigger: 'demonstration.labels.file',
    entries: [
      {
        kind: 'sub',
        label: 'demonstration.labels.export',
        entries: [
          {
            kind: 'sub',
            label: 'demonstration.labels.format',
            entries: [item('demonstration.labels.pdf')],
          },
        ],
      },
    ],
  },
];

/**
 * As seis fichas de Variantes, pela CHAVE do conteúdo compartilhado. A chave é
 * o `trackId` da ficha e, em kebab, o id da prévia — `editorComplete` →
 * `editor-complete`, e os quatro menus dele `editor-complete-file`…
 */
const VARIANTS = [
  {
    key: 'default',
    preview: 'default',
    menus: [
      {
        trigger: 'demonstration.labels.file',
        entries: [
          item('demonstration.labels.new', { shortcut: 'demonstration.labels.newShortcut' }),
          item('demonstration.labels.save', { shortcut: 'demonstration.labels.saveShortcut' }),
        ],
      },
    ],
  },
  {
    key: 'destructive',
    preview: 'destructive',
    menus: [
      {
        trigger: 'demonstration.labels.file',
        entries: [
          item('demonstration.labels.save'),
          SEPARATOR,
          item('demonstration.labels.deleteFile', { destructive: true }),
        ],
      },
    ],
  },
  {
    key: 'withShortcuts',
    preview: 'with-shortcuts',
    menus: [
      {
        trigger: 'demonstration.labels.edit',
        entries: [
          item('demonstration.labels.undo', { shortcut: 'demonstration.labels.undoShortcut' }),
          item('demonstration.labels.redo', { shortcut: 'demonstration.labels.redoShortcut' }),
          SEPARATOR,
          item('demonstration.labels.copy', { shortcut: 'demonstration.labels.copyShortcut' }),
          item('demonstration.labels.paste', { shortcut: 'demonstration.labels.pasteShortcut' }),
        ],
      },
    ],
  },
  {
    key: 'withCheckbox',
    preview: 'with-checkbox',
    menus: [
      {
        trigger: 'demonstration.labels.view',
        entries: [
          {
            kind: 'group',
            label: 'demonstration.labels.panels',
            entries: [
              checkbox('demonstration.labels.sidebar', true),
              checkbox('demonstration.labels.grid', false),
              checkbox('demonstration.labels.ruler', false),
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'withRadio',
    preview: 'with-radio',
    menus: [
      {
        trigger: 'demonstration.labels.theme',
        entries: [
          {
            kind: 'radio-group',
            label: 'demonstration.labels.appearance',
            value: 'dark',
            options: [
              option('demonstration.labels.light'),
              option('demonstration.labels.dark'),
              option('demonstration.labels.system'),
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'editorComplete',
    preview: 'editor-complete',
    menus: [
      {
        trigger: 'demonstration.labels.file',
        entries: [
          item('demonstration.labels.new', { shortcut: 'demonstration.labels.newShortcut' }),
          item('demonstration.labels.open', { shortcut: 'demonstration.labels.openShortcut' }),
          item('demonstration.labels.save', { shortcut: 'demonstration.labels.saveShortcut' }),
          SEPARATOR,
          item('demonstration.labels.quit', { shortcut: 'demonstration.labels.quitShortcut' }),
        ],
      },
      {
        trigger: 'demonstration.labels.edit',
        entries: [
          item('demonstration.labels.undo', { shortcut: 'demonstration.labels.undoShortcut' }),
          item('demonstration.labels.redo', { shortcut: 'demonstration.labels.redoShortcut' }),
        ],
      },
      {
        trigger: 'demonstration.labels.view',
        entries: [
          {
            kind: 'group',
            label: 'demonstration.labels.appearance',
            entries: [item('demonstration.labels.darkMode')],
          },
          SEPARATOR,
          item('demonstration.labels.fullScreen', { shortcut: 'demonstration.labels.fullScreenShortcut' }),
        ],
      },
      {
        trigger: 'demonstration.labels.help',
        entries: [item('demonstration.labels.documentation'), item('demonstration.labels.about')],
      },
    ],
  },
] as const satisfies readonly { key: string; preview: string; menus: readonly BarMenu[] }[];

type VariantKey = (typeof VARIANTS)[number]['key'];

/**
 * O código da ficha, a partir da MESMA lista que monta a barra — com os rótulos
 * no idioma da página, para que código e prévia digam o mesmo nos três.
 *
 * O que é instrumentação da página (`(onOpenChange)`, `(onSelect)` ligados ao
 * rastreio) não entra: é andaime desta docs page, não lição do menubar.
 */
function barSnippet(menus: readonly BarMenu[]): string {
  const pad = (n: number) => ' '.repeat(n);
  const itemLines = (e: ItemEntry, n: number): string[] => {
    const attrs = e.destructive ? ' variant="destructive"' : '';
    const shortcut = e.shortcut ? ` <span ndsMenubarShortcut>${t(e.shortcut)}</span>` : '';
    return [`${pad(n)}<div ndsMenubarItem${attrs}>${t(e.label)}${shortcut}</div>`];
  };
  const leaf = (e: ItemEntry | CheckboxEntry, n: number): string[] =>
    e.kind === 'item'
      ? itemLines(e, n)
      : [`${pad(n)}<div ndsMenubarCheckboxItem [checked]="${e.checked}">${t(e.label)}</div>`];
  const sub = (label: LabelKey, children: string[], n: number): string[] => [
    `${pad(n)}<nds-menubar-sub>`,
    `${pad(n + 2)}<div ndsMenubarSubTrigger>${t(label)}</div>`,
    `${pad(n + 2)}<ng-template ndsMenubarSubContent>`,
    ...children,
    `${pad(n + 2)}</ng-template>`,
    `${pad(n)}</nds-menubar-sub>`,
  ];

  const entryLines = (entries: readonly PreviewEntry[], n: number): string[] => {
    const lines: string[] = [];
    for (const entry of entries) {
      if (entry.kind === 'separator') {
        lines.push(`${pad(n)}<div ndsMenubarSeparator></div>`);
      } else if (entry.kind === 'item' || entry.kind === 'checkbox') {
        lines.push(...leaf(entry, n));
      } else if (entry.kind === 'group') {
        lines.push(`${pad(n)}<div ndsMenubarGroup>`);
        lines.push(`${pad(n + 2)}<div ndsMenubarLabel>${t(entry.label)}</div>`);
        for (const child of entry.entries) lines.push(...leaf(child, n + 2));
        lines.push(`${pad(n)}</div>`);
      } else if (entry.kind === 'radio-group') {
        lines.push(`${pad(n)}<div ndsMenubarRadioGroup value="${entry.value}">`);
        if (entry.label) lines.push(`${pad(n + 2)}<div ndsMenubarLabel>${t(entry.label)}</div>`);
        for (const opt of entry.options) {
          lines.push(`${pad(n + 2)}<div ndsMenubarRadioItem value="${opt.value}">${t(opt.label)}</div>`);
        }
        lines.push(`${pad(n)}</div>`);
      } else {
        const children: string[] = [];
        for (const child of entry.entries) {
          if (child.kind === 'sub') {
            const leaves = child.entries.flatMap((l) => itemLines(l, n + 8));
            children.push(...sub(child.label, leaves, n + 4));
          } else {
            children.push(...itemLines(child, n + 4));
          }
        }
        lines.push(...sub(entry.label, children, n));
      }
    }
    return lines;
  };

  const body = menus.map((m) =>
    [
      `  <nds-menubar-menu>`,
      `    <button ndsMenubarTrigger>${t(m.trigger)}</button>`,
      `    <ng-template ndsMenubarContent>`,
      ...entryLines(m.entries, 6),
      `    </ng-template>`,
      `  </nds-menubar-menu>`,
    ].join('\n'),
  );

  return `<nds-menubar>\n${body.join('\n\n')}\n</nds-menubar>`;
}

/**
 * Uma barra VIVA — o componente de verdade, com os três eventos.
 *
 * `preview` é o id estável da prévia (`demo`, `with-shortcuts`, `pair1-do`…) e
 * `location` a seção em que ela está. O `menu` de cada evento sai dos dois e do
 * gatilho (`menuIdOf`). Os dois chegam por input, e não de uma constante no
 * topo do arquivo, porque a mesma peça mora em três seções.
 *
 * Exportada por exigência do verificador de templates (NG3004): a docs page a
 * usa no próprio template. Não é API do design system — nada fora deste arquivo
 * a importa.
 */
@Component({
  selector: 'div[ndsMenubarPreview]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [...NDS_MENUBAR],
  template: `
    <nds-menubar>
      @for (m of menus(); track m.trigger) {
        <nds-menubar-menu (onOpenChange)="onOpenChange(menuId(m), $event)">
          <button ndsMenubarTrigger>{{ t(m.trigger) }}</button>

          <ng-template ndsMenubarContent>
            @for (entry of m.entries; track $index) {
              @if (entry.kind === 'separator') {
                <div ndsMenubarSeparator></div>
              } @else if (entry.kind === 'item') {
                <div
                  ndsMenubarItem
                  [variant]="entry.destructive ? 'destructive' : 'default'"
                  (onSelect)="onSelect(menuId(m), entry.value)"
                >
                  {{ t(entry.label) }}
                  @if (entry.shortcut) {
                    <span ndsMenubarShortcut>{{ t(entry.shortcut) }}</span>
                  }
                </div>
              } @else if (entry.kind === 'checkbox') {
                <div
                  ndsMenubarCheckboxItem
                  [checked]="isChecked(entry)"
                  (checkedChange)="onCheckedChange(menuId(m), entry, $event)"
                >{{ t(entry.label) }}</div>
              } @else if (entry.kind === 'group') {
                <div ndsMenubarGroup>
                  <div ndsMenubarLabel>{{ t(entry.label) }}</div>
                  @for (child of entry.entries; track child.value) {
                    @if (child.kind === 'item') {
                      <div
                        ndsMenubarItem
                        [variant]="child.destructive ? 'destructive' : 'default'"
                        (onSelect)="onSelect(menuId(m), child.value)"
                      >
                        {{ t(child.label) }}
                        @if (child.shortcut) {
                          <span ndsMenubarShortcut>{{ t(child.shortcut) }}</span>
                        }
                      </div>
                    } @else {
                      <div
                        ndsMenubarCheckboxItem
                        [checked]="isChecked(child)"
                        (checkedChange)="onCheckedChange(menuId(m), child, $event)"
                      >{{ t(child.label) }}</div>
                    }
                  }
                </div>
              } @else if (entry.kind === 'radio-group') {
                <div
                  ndsMenubarRadioGroup
                  [value]="radioValue(entry)"
                  (valueChange)="onRadioChange(entry, $event)"
                >
                  @if (entry.label) {
                    <div ndsMenubarLabel>{{ t(entry.label) }}</div>
                  }
                  @for (opt of entry.options; track opt.value) {
                    <!-- A escolha é o CLIQUE no item, não a mudança de valor: escolher
                         a opção já marcada também é uma escolha. O teclado chega
                         aqui pelo click() da lib. -->
                    <div
                      ndsMenubarRadioItem
                      [value]="opt.value"
                      (click)="onToggle(menuId(m), opt.value)"
                    >{{ t(opt.label) }}</div>
                  }
                </div>
              } @else {
                <nds-menubar-sub>
                  <div ndsMenubarSubTrigger>{{ t(entry.label) }}</div>
                  <ng-template ndsMenubarSubContent>
                    @for (child of entry.entries; track $index) {
                      @if (child.kind === 'sub') {
                        <nds-menubar-sub>
                          <div ndsMenubarSubTrigger>{{ t(child.label) }}</div>
                          <ng-template ndsMenubarSubContent>
                            @for (leaf of child.entries; track leaf.value) {
                              <div ndsMenubarItem (onSelect)="onSelect(menuId(m), leaf.value)">
                                {{ t(leaf.label) }}
                              </div>
                            }
                          </ng-template>
                        </nds-menubar-sub>
                      } @else {
                        <div ndsMenubarItem (onSelect)="onSelect(menuId(m), child.value)">
                          {{ t(child.label) }}
                        </div>
                      }
                    }
                  </ng-template>
                </nds-menubar-sub>
              }
            }
          </ng-template>
        </nds-menubar-menu>
      }
    </nds-menubar>
  `,
})
export class NdsMenubarPreview {
  readonly preview = input.required<string>();
  readonly location = input.required<PreviewLocation>();
  readonly menus = input.required<readonly BarMenu[]>();

  protected readonly t = t;

  /**
   * O motivo do fechamento de cada menu desta barra, pela tradução única da
   * família. Na barra ela precisa de estado: a lib entrega sem motivo o item
   * escolhido, a passagem ao menu vizinho, o clique no gatilho aberto e o
   * Escape com o foco no gatilho — e o primeiro é `api`, os dois do meio
   * `overlay` e o último `escape`. Até 2026-09-11 tudo o que não era item nem
   * Escape saía `overlay`, inclusive o menu fechado pelo código.
   */
  private readonly closeTracker = new MenuCloseTracker();

  /**
   * O estado ATUAL dos alternadores e das escolhas únicas desta barra, pela
   * entrada da lista. O miolo de cada menu é desmontado ao fechar e remontado
   * ao abrir: ligado à constante da lista, ele voltava ao estado inicial a cada
   * abertura. As outras quatro stacks guardam o estado; esta passou a guardar
   * em 2026-09-11.
   */
  private readonly checkedState = signal(new Map<CheckboxEntry, CheckedState>());
  private readonly radioState = signal(new Map<RadioGroupEntry, string>());

  constructor() {
    // Os gestos no GATILHO, em captura: o gatilho fecha o menu no próprio
    // ouvinte, e às vezes barra a propagação — ouvido depois, o gesto chegaria
    // tarde para o motivo.
    const stop = this.closeTracker.watch(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement);
    inject(DestroyRef).onDestroy(stop);
  }

  protected menuId(menu: BarMenu): string {
    return menuIdOf(this.preview(), this.menus(), menu);
  }

  protected isChecked(entry: CheckboxEntry): CheckedState {
    return this.checkedState().get(entry) ?? entry.checked;
  }

  protected radioValue(group: RadioGroupEntry): string {
    return this.radioState().get(group) ?? group.value;
  }

  protected onCheckedChange(menu: string, entry: CheckboxEntry, checked: CheckedState): void {
    this.checkedState.update((state) => new Map(state).set(entry, checked));
    this.onToggle(menu, entry.value);
  }

  protected onRadioChange(group: RadioGroupEntry, value: unknown): void {
    if (typeof value !== 'string') return;
    this.radioState.update((state) => new Map(state).set(group, value));
  }

  protected onOpenChange(menu: string, change: RdxMenuOpenChange): void {
    const payload = { component: 'menubar' as const, menu, location: this.location() };
    if (change.open) {
      this.closeTracker.opened(menu);
      track('menubar_open', payload);
      return;
    }
    track('menubar_close', { ...payload, reason: this.closeTracker.closed(menu, change.reason) });
  }

  /** Item de ação: a escolha FECHA o menu, e o fechamento que vem é `api`. */
  protected onSelect(menu: string, label: string): void {
    this.closeTracker.chose(menu);
    track('menubar_item_select', { component: 'menubar', menu, label, location: this.location() });
  }

  /**
   * Marcação e escolha única também são escolha, mas NÃO fecham o menu (C10): o
   * evento sai, e o fechamento seguinte leva o motivo de quem de fato fechou.
   */
  protected onToggle(menu: string, label: unknown): void {
    if (typeof label !== 'string') return;
    track('menubar_item_select', { component: 'menubar', menu, label, location: this.location() });
  }
}

@Component({
  selector: 'nds-menubar-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    NdsMenubarPreview,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsCompositions,
    NdsDocsStates, NdsDocsProps, NdsDocsTokens, NdsDocsAccessibility,
    NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics, NdsDocsTestes,
  ],
  template: `
    <!--
      Os menus das fichas nascem FECHADOS. Um painel aberto é posicionado em
      \`fixed\` e flutua por cima do que vier depois dele: seis fichas abertas
      cobririam a própria documentação. Quem lê abre a que quiser — e o estado
      aberto é o que as stories capturam para a regressão visual.
    -->
    <ng-template #tplDoDont1Do>
      <div ndsMenubarPreview preview="pair1-do" location="docs_do_dont" [menus]="pair1DoMenus"></div>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <div ndsMenubarPreview preview="pair1-dont" location="docs_do_dont" [menus]="pair1DontMenus"></div>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <div ndsMenubarPreview preview="pair2-do" location="docs_do_dont" [menus]="pair2DoMenus"></div>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <div ndsMenubarPreview preview="pair2-dont" location="docs_do_dont" [menus]="pair2DontMenus"></div>
    </ng-template>

    <ng-template #tplVarDefault>
      <div ndsMenubarPreview preview="default" location="docs_variantes" [menus]="variants[0].menus"></div>
    </ng-template>
    <ng-template #tplVarDestructive>
      <div ndsMenubarPreview preview="destructive" location="docs_variantes" [menus]="variants[1].menus"></div>
    </ng-template>
    <ng-template #tplVarShortcuts>
      <div ndsMenubarPreview preview="with-shortcuts" location="docs_variantes" [menus]="variants[2].menus"></div>
    </ng-template>
    <ng-template #tplVarCheckbox>
      <div ndsMenubarPreview preview="with-checkbox" location="docs_variantes" [menus]="variants[3].menus"></div>
    </ng-template>
    <ng-template #tplVarRadio>
      <div ndsMenubarPreview preview="with-radio" location="docs_variantes" [menus]="variants[4].menus"></div>
    </ng-template>
    <ng-template #tplVarEditor>
      <div ndsMenubarPreview preview="editor-complete" location="docs_variantes" [menus]="variants[5].menus"></div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="menubar"
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
        <!-- UMA barra com os quatro menus — Arquivo, Editar, Exibir e
             Ferramentas —, igual nas cinco stacks. -->
        <nds-docs-demonstration>
          <div ndsMenubarPreview preview="demo" location="docs_demo" [menus]="demoMenus"></div>
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
          componentSlug="menubar"
          language="ts"
        />

        <nds-docs-compositions
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="menubar"
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
          componentSlug="menubar"
        />

        <nds-docs-notes
          [items]="noteItems()"
          componentSlug="menubar"
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
export class NdsMenubarDocs implements AfterViewInit, OnDestroy {
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
  protected readonly demoMenus = DEMO_MENUS;
  protected readonly pair1DoMenus = PAIR1_DO_MENUS;
  protected readonly pair1DontMenus = PAIR1_DONT_MENUS;
  protected readonly pair2DoMenus = PAIR2_DO_MENUS;
  protected readonly pair2DontMenus = PAIR2_DONT_MENUS;
  protected readonly variants = VARIANTS;

  protected readonly activeSection = signal<string | undefined>(undefined);

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarDestructive = viewChild.required<TemplateRef<unknown>>('tplVarDestructive');
  private readonly tplVarShortcuts = viewChild.required<TemplateRef<unknown>>('tplVarShortcuts');
  private readonly tplVarCheckbox = viewChild.required<TemplateRef<unknown>>('tplVarCheckbox');
  private readonly tplVarRadio = viewChild.required<TemplateRef<unknown>>('tplVarRadio');
  private readonly tplVarEditor = viewChild.required<TemplateRef<unknown>>('tplVarEditor');

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
      items: ['trigger', 'item', 'shortcut', 'destructive'].map((key) => ({
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
   * seção: o conteúdo compartilhado guarda as seis em `variants.items`. As duas
   * primeiras são STRING no dicionário e descrevem-se por `variants.styles`; as
   * outras quatro são objeto, com `name`/`description`/`use`. Ler as duas formas
   * com a mesma chamada devolveria a chave crua na tela.
   *
   * `trackId` é a CHAVE do conteúdo (`withCheckbox`, `editorComplete`), como nas
   * outras quatro stacks — o `snippet_id` do toggle de código não pode mudar de
   * nome de uma stack para outra. O código de cada ficha sai da MESMA lista que
   * monta a barra (`barSnippet`), então os dois não divergem.
   */
  protected readonly variantItems = computed(() => {
    dict();
    const templates: Record<VariantKey, TemplateRef<unknown>> = {
      default: this.tplVarDefault(),
      destructive: this.tplVarDestructive(),
      withShortcuts: this.tplVarShortcuts(),
      withCheckbox: this.tplVarCheckbox(),
      withRadio: this.tplVarRadio(),
      editorComplete: this.tplVarEditor(),
    };
    return VARIANTS.map(({ key, menus }) => {
      const code = barSnippet(menus);
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
    const ofContent = (name: string, key: string, type?: string, padrao?: string) => ({
      name: name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: padrao ?? toPlainText(t(`props.table.${key}.default`)),
      required: toPlainText(t(`props.table.${key}.required`)),
      description: toPlainText(t(`props.table.${key}.description`)),
    });

    /** Linha que só existe neste stack — descrição vem do override. */
    const local = (name: string, type: string, padrao: string, key: string) => ({
      name: name,
      type: type,
      defaultValue: padrao,
      required: not,
      description: toPlainText(t(`props.${key}.description`)),
    });

    const className = local('class', 'string', '—', 'class');

    return [
      {
        title: 'NdsMenubar',
        cols,
        items: [
          // `loop` do conteúdo compartilhado: mesmo conceito, nome do primitivo.
          ofContent('loopFocus', 'loop'),
          local('modal', 'boolean', 'true', 'modal'),
          local('disabled', 'boolean', 'false', 'barDisabled'),
          className,
        ],
      },
      {
        title: 'NdsMenubarMenu',
        cols,
        items: [
          local('open', 'model<boolean>', 'false', 'open'),
          local('openChange', 'output<boolean>', '—', 'openChange'),
          local('onOpenChange', 'output<{ open: boolean; reason: string }>', '—', 'openChangeDetail'),
          local('defaultOpen', 'boolean', 'false', 'defaultOpen'),
          local('disabled', 'boolean', 'false', 'menuDisabled'),
        ],
      },
      {
        title: 'NdsMenubarContent',
        cols,
        items: [
          ofContent('side', 'side'),
          ofContent('align', 'align'),
          local('sideOffset', 'number', '8', 'sideOffset'),
          local('alignOffset', 'number', '-4', 'alignOffset'),
        ],
      },
      {
        title: 'NdsMenubarItem',
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
        title: 'NdsMenubarCheckboxItem',
        cols,
        items: [
          local('checked', 'model<boolean>', 'false', 'checked'),
          local('checkedChange', 'output<boolean>', '—', 'checkedChange'),
          local('disabled', 'boolean', 'false', 'itemDisabled'),
        ],
      },
      {
        title: 'NdsMenubarRadioGroup + NdsMenubarRadioItem',
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
      { token: '--background',   k: 'menubarBg',     className: '.nds-menubar'                 },
      { token: '--border',       k: 'menubarBorder', className: '.nds-menubar'                 },
      { token: '--accent',       k: 'triggerHover',  className: '.nds-menubar-trigger[data-state="open"]' },
      { token: '--accent-foreground', k: 'triggerText',   className: '.nds-menubar-trigger:hover · .nds-menubar-trigger[data-state="open"]' },
      { token: '--radius-sm',    k: 'triggerRadius', className: '.nds-menubar-trigger'         },
      // A barra fica no plano da página; o painel que ela abre é que flutua, e
      // lê `--elevation-md` pela folha do dropdown.
      { token: '--elevation-xs', k: 'elevation',     className: '.nds-menubar'                 },
      { token: '--popover',      k: 'contentBg',     className: '.nds-dropdown-menu-content'   },
      { token: '--border',       k: 'contentBorder', className: '.nds-dropdown-menu-content'   },
      { token: '--radius',       k: 'rounded',       className: '.nds-dropdown-menu-content'   },
      { token: '--accent',       k: 'itemHover',     className: '.nds-dropdown-menu-item:hover' },
      { token: '--destructive',  k: 'destructive',   className: '.nds-dropdown-menu-item[data-variant="destructive"]' },
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
      { key: '← →',           description: toPlainText(t('accessibility.keyboard.arrowsHorizontal')) },
      { key: '↑ ↓',           description: toPlainText(t('accessibility.keyboard.arrowsVertical')) },
      { key: 'Enter / Space', description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Esc',           description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'Home / End',    description: toPlainText(t('accessibility.keyboard.homeEnd')) },
      { key: 'A-Z',           description: toPlainText(t('accessibility.keyboard.typeahead')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = menubarTranslations as unknown as Record<
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
      { key: 'navigationMenu', path: '?path=/docs/components-navigation-navigationmenu--docs' },
      { key: 'dropdownMenu',   path: '?path=/docs/components-overlay-dropdownmenu--docs'   },
      { key: 'sidebar',        path: '?path=/docs/components-layout-sidebar--docs'        },
      { key: 'command',        path: '?path=/docs/components-overlay-command--docs'        },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
   * 2026-09-11 as linhas eram cravadas aqui e listavam `menubar_menu_open` e
   * `menubar_shortcut_invoke` — dois eventos que nenhum tipo declarava e que
   * nenhuma barra disparava. O atalho exibido é só texto: não gera evento.
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
    // Critério como frase única, não {criterion, level, how} — é a forma que
    // este slug usa no conteúdo compartilhado. A lista é VARRIDA, e não contada
    // à mão: o `[1..7]` de antes deixava o oitavo critério fora da página.
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
        componentSlug: 'menubar',
      });
      track('docs_page_view', {
        component_name: 'menubar',
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
          component_name: 'menubar',
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

/** Varre `base.item1`, `base.item2`, … enquanto existirem no dicionário. */
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
