import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  OnDestroy,
  viewChild,
  TemplateRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useTranslation, getLocale } from '@/lib/i18n';
import { createActiveSectionObserver } from '@/lib/use-active-section';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import { NDS_MENUBAR } from '@/components/ui/menubar';
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
const { t, dict } = useTranslation(menubarTranslations as Record<string, unknown>, {
  'pt-BR': {
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
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/menubar</code> coordena os menus de <code>@radix-ng/primitives/menu</code> — daí vêm o papel de barra, as setas Esquerda/Direita entre gatilhos (abrindo o vizinho quando um menu já está aberto), Home/End, a troca de menu por ponteiro e a parada única de tabulação.',
    'notes.item2':
      '<strong>Portal</strong>: o painel é teleportado para o <code>body</code> ao abrir e desmontado ao fechar, então nenhum <code>overflow: hidden</code> de ancestral o recorta. Fechado, ele não existe no DOM — não é um painel escondido.',
    'notes.item6':
      '<strong>Gatilho</strong>: é um <code>&lt;button&gt;</code> com o estilo próprio da barra, não o botão do sistema. Ele recebe papel de item de menu, porque num menubar o gatilho pertence à barra, e não é uma parada de tabulação separada.',
  },
  en: {
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
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/menubar</code> coordinates the menus from <code>@radix-ng/primitives/menu</code> — that is where the bar role, the Left/Right arrows between triggers (opening the neighbour when a menu is already open), Home/End, pointer menu switching and the single tab stop come from.',
    'notes.item2':
      '<strong>Portal</strong>: the panel is teleported to the <code>body</code> on open and unmounted on close, so no ancestor <code>overflow: hidden</code> clips it. While closed it is absent from the DOM — not a hidden panel.',
    'notes.item6':
      '<strong>Trigger</strong>: it is a <code>&lt;button&gt;</code> with the bar styling, not the system button. It takes a menu item role, because in a menubar the trigger belongs to the bar and is not a separate tab stop.',
  },
  es: {
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

// Hardcoded, e não `t('anatomy.structureCode')`: a variante `angular` do
// conteúdo compartilhado desenha os itens como `<button>`, e aqui o item é um
// `<div>` com papel de menu — a folha do componente não zera a aparência nativa
// de botão. Mesmo caminho do DropdownMenuDocs; a correção do conteúdo está
// reportada.
const ANATOMY_CODE = `<nds-menubar>
  <nds-menubar-menu>
    <button ndsMenubarTrigger>Arquivo</button>

    <ng-template ndsMenubarContent>
      <div ndsMenubarItem>Novo <span ndsMenubarShortcut>Ctrl N</span></div>
      <div ndsMenubarItem>Abrir <span ndsMenubarShortcut>Ctrl O</span></div>
      <div ndsMenubarSeparator></div>

      <nds-menubar-sub>
        <div ndsMenubarSubTrigger>Exportar</div>
        <ng-template ndsMenubarSubContent>
          <div ndsMenubarItem>PDF</div>
          <div ndsMenubarItem>CSV</div>
        </ng-template>
      </nds-menubar-sub>
    </ng-template>
  </nds-menubar-menu>

  <nds-menubar-menu>
    <button ndsMenubarTrigger>Editar</button>
    <ng-template ndsMenubarContent>
      <div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl Z</span></div>
    </ng-template>
  </nds-menubar-menu>
</nds-menubar>`;

const INTERFACE_CODE = `// A barra coordena os menus: papel, setas entre gatilhos e UMA parada de Tab.
@Component({
  selector: 'nds-menubar',
  hostDirectives: [
    { directive: RdxMenubarRoot, inputs: ['disabled', 'modal', 'loopFocus'] },
  ],
})
export class NdsMenubar {}

// Um menu (e o submenu): estado de abertura, portal e posicionamento.
@Component({
  selector: 'nds-menubar-menu, nds-menubar-sub',
  hostDirectives: [
    { directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'loopFocus'],
      outputs: ['openChange'] },
  ],
})
export class NdsMenubarMenu {}

// O miolo do menu é um <ng-template>: quem monta e desmonta é o portal.
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

// Também hardcoded: a variante `angular` de `props.extensibilityCode` descreve
// um menu ativo controlado na barra (`[(value)]`), API que este stack não tem —
// aqui quem controla abertura é cada menu. Divergência reportada.
const EXTENSIBILITY_CODE = `<!-- Menu controlado, com posicionamento e analytics -->
<nds-menubar [loopFocus]="false">
  <nds-menubar-menu [open]="arquivoAberto()" (openChange)="onOpenChange('arquivo', $event)">
    <button ndsMenubarTrigger>Arquivo</button>

    <ng-template ndsMenubarContent align="end" [sideOffset]="12">
      @for (acao of acoes; track acao.value) {
        <div ndsMenubarItem (onSelect)="onSelect('arquivo', acao.value)">{{ acao.label }}</div>
      }
    </ng-template>
  </nds-menubar-menu>
</nds-menubar>

// no componente
readonly arquivoAberto = signal(false);

onOpenChange(menu: string, aberto: boolean) {
  this.arquivoAberto.set(aberto);
  // O payload leva o identificador do menu, nunca o rótulo traduzido: o rótulo
  // partiria um evento em três no GA4, um por idioma.
  track('menubar_menu_open', { component: 'menubar', menu });
}`;

const IMPORT_CODE = `import { NDS_MENUBAR } from '@/components/ui/menubar';`;

// Snippets das seis fichas da seção Variantes. Ficam aqui, e não no conteúdo
// compartilhado, porque descrevem a composição DESTE stack.
const CODE_DEFAULT = `<div ndsMenubarItem>Salvar</div>`;

const CODE_DESTRUCTIVE = `<div ndsMenubarItem variant="destructive">Descartar alterações</div>`;

const CODE_WITH_SHORTCUTS = `<ng-template ndsMenubarContent>
  <div ndsMenubarItem>
    Desfazer <span ndsMenubarShortcut>Ctrl Z</span>
  </div>
  <div ndsMenubarItem>
    Refazer <span ndsMenubarShortcut>Ctrl Y</span>
  </div>
</ng-template>`;

const CODE_WITH_CHECKBOX = `<ng-template ndsMenubarContent>
  <div ndsMenubarLabel>Mostrar na tela</div>
  <div ndsMenubarCheckboxItem [(checked)]="regua">Régua</div>
  <div ndsMenubarCheckboxItem [(checked)]="grade">Grade</div>
</ng-template>`;

const CODE_WITH_RADIO = `<ng-template ndsMenubarContent>
  <div ndsMenubarRadioGroup [(value)]="tema">
    <div ndsMenubarLabel>Tema</div>
    <div ndsMenubarRadioItem value="light">Claro</div>
    <div ndsMenubarRadioItem value="dark">Escuro</div>
  </div>
</ng-template>`;

const CODE_EDITOR = `<nds-menubar>
  <nds-menubar-menu>
    <button ndsMenubarTrigger>Arquivo</button>
    <ng-template ndsMenubarContent>
      <div ndsMenubarGroup>
        <div ndsMenubarLabel>Documento</div>
        <div ndsMenubarItem>Novo <span ndsMenubarShortcut>Ctrl N</span></div>
      </div>
      <div ndsMenubarSeparator></div>
      <div ndsMenubarItem variant="destructive">Descartar alterações</div>
    </ng-template>
  </nds-menubar-menu>

  <nds-menubar-menu>
    <button ndsMenubarTrigger>Editar</button>
    <ng-template ndsMenubarContent>
      <div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl Z</span></div>
    </ng-template>
  </nds-menubar-menu>
</nds-menubar>`;

/** Itens do menu Arquivo da demonstração — base estável, sem número cravado. */
const ITEMS_FILE = ['Novo', 'Abrir', 'Salvar'] as const;
const EXPORTACOES = ['PDF', 'CSV'] as const;
const SHORTCUTS_EDIT = [
  { label: 'Desfazer', atalho: 'Ctrl Z' },
  { label: 'Refazer', atalho: 'Ctrl Y' },
] as const;
const EXIBICOES = ['Régua', 'Grade'] as const;
const THEMES = [
  { valor: 'light', label: 'Claro' },
  { valor: 'dark', label: 'Escuro' },
  { valor: 'system', label: 'Do sistema' },
] as const;

@Component({
  selector: 'nds-menubar-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_MENUBAR,
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
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          </ng-template>
        </nds-menubar-menu>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.editMenu') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>{{ atalhosEdicao[0].label }}</div>
          </ng-template>
        </nds-menubar-menu>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.viewMenu') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>{{ exibicoes[0] }}</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.editMenu') }}</button>
          <ng-template ndsMenubarContent>
            @for (a of atalhosEdicao; track a.label) {
              <div ndsMenubarItem>
                {{ a.label }} <span ndsMenubarShortcut>{{ a.atalho }}</span>
              </div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
          <ng-template ndsMenubarContent>
            <nds-menubar-sub>
              <div ndsMenubarSubTrigger>{{ t('demonstration.labels.fileMenu') }}</div>
              <ng-template ndsMenubarSubContent>
                <nds-menubar-sub>
                  <div ndsMenubarSubTrigger>{{ t('demonstration.labels.toolsMenu') }}</div>
                  <ng-template ndsMenubarSubContent>
                    <div ndsMenubarItem>{{ exportacoes[0] }}</div>
                  </ng-template>
                </nds-menubar-sub>
              </ng-template>
            </nds-menubar-sub>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>

    <ng-template #tplVarDefault>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
          <ng-template ndsMenubarContent>
            @for (i of itensArquivo; track i) {
              <div ndsMenubarItem>{{ i }}</div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplVarDestructive>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>{{ t('usage.uxWriting.table.item.good') }}</div>
            <div ndsMenubarSeparator></div>
            <div ndsMenubarItem variant="destructive">
              {{ t('usage.uxWriting.table.destructive.good') }}
            </div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplVarShortcuts>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.editMenu') }}</button>
          <ng-template ndsMenubarContent>
            @for (a of atalhosEdicao; track a.label) {
              <div ndsMenubarItem>
                {{ a.label }} <span ndsMenubarShortcut>{{ a.atalho }}</span>
              </div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplVarCheckbox>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.viewMenu') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>{{ t('demonstration.labels.viewMenu') }}</div>
            <div ndsMenubarCheckboxItem [(checked)]="regua">{{ exibicoes[0] }}</div>
            <div ndsMenubarCheckboxItem [(checked)]="grade">{{ exibicoes[1] }}</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplVarRadio>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.toolsMenu') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarRadioGroup [(value)]="tema">
              <div ndsMenubarLabel>{{ t('demonstration.labels.toolsMenu') }}</div>
              @for (opcao of temas; track opcao.valor) {
                <div ndsMenubarRadioItem [value]="opcao.valor">{{ opcao.label }}</div>
              }
            </div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    </ng-template>
    <ng-template #tplVarEditor>
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarGroup>
              <div ndsMenubarLabel>{{ t('usage.uxWriting.table.trigger.good') }}</div>
              @for (i of itensArquivo; track i) {
                <div ndsMenubarItem>{{ i }}</div>
              }
            </div>
            <div ndsMenubarSeparator></div>
            <div ndsMenubarItem variant="destructive">
              {{ t('usage.uxWriting.table.destructive.good') }}
            </div>
          </ng-template>
        </nds-menubar-menu>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.editMenu') }}</button>
          <ng-template ndsMenubarContent>
            @for (a of atalhosEdicao; track a.label) {
              <div ndsMenubarItem>
                {{ a.label }} <span ndsMenubarShortcut>{{ a.atalho }}</span>
              </div>
            }
          </ng-template>
        </nds-menubar-menu>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>{{ t('demonstration.labels.viewMenu') }}</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarCheckboxItem [(checked)]="regua">{{ exibicoes[0] }}</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
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
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <nds-menubar>
            <nds-menubar-menu>
              <button ndsMenubarTrigger>{{ t('usage.uxWriting.table.trigger.good') }}</button>
              <ng-template ndsMenubarContent>
                @for (i of itensArquivo; track i) {
                  <div ndsMenubarItem>{{ i }}</div>
                }
                <div ndsMenubarSeparator></div>
                <nds-menubar-sub>
                  <div ndsMenubarSubTrigger>{{ t('demonstration.labels.fileMenu') }}</div>
                  <ng-template ndsMenubarSubContent>
                    @for (e of exportacoes; track e) {
                      <div ndsMenubarItem>{{ e }}</div>
                    }
                  </ng-template>
                </nds-menubar-sub>
              </ng-template>
            </nds-menubar-menu>

            <nds-menubar-menu>
              <button ndsMenubarTrigger>{{ t('demonstration.labels.editMenu') }}</button>
              <ng-template ndsMenubarContent>
                @for (a of atalhosEdicao; track a.label) {
                  <div ndsMenubarItem>
                    {{ a.label }} <span ndsMenubarShortcut>{{ a.atalho }}</span>
                  </div>
                }
              </ng-template>
            </nds-menubar-menu>

            <nds-menubar-menu>
              <button ndsMenubarTrigger>{{ t('demonstration.labels.viewMenu') }}</button>
              <ng-template ndsMenubarContent>
                <div ndsMenubarGroup>
                  <div ndsMenubarLabel>{{ t('demonstration.labels.viewMenu') }}</div>
                  <div ndsMenubarCheckboxItem [(checked)]="regua">{{ exibicoes[0] }}</div>
                  <div ndsMenubarCheckboxItem [(checked)]="grade">{{ exibicoes[1] }}</div>
                </div>
              </ng-template>
            </nds-menubar-menu>

            <nds-menubar-menu>
              <button ndsMenubarTrigger>{{ t('demonstration.labels.toolsMenu') }}</button>
              <ng-template ndsMenubarContent>
                <div ndsMenubarRadioGroup [(value)]="tema">
                  <div ndsMenubarLabel>{{ t('demonstration.labels.toolsMenu') }}</div>
                  @for (opcao of temas; track opcao.valor) {
                    <div ndsMenubarRadioItem [value]="opcao.valor">{{ opcao.label }}</div>
                  }
                </div>
              </ng-template>
            </nds-menubar-menu>
          </nds-menubar>
        </nds-docs-demonstration>

        <nds-docs-anatomy
          [title]="t('anatomy.title')"
          [items]="anatomyItems()"
          [structureLabel]="t('anatomy.structureLabel')"
          [structureCode]="anatomyCode"
          language="html"
        />

        <nds-docs-when-to-use
          [title]="t('usage.title')"
          [guidelines]="guidelines()"
          [scenarios]="scenarios()"
          [uxWriting]="uxWriting()"
          [do]="usageDo()"
          [dont]="usageDont()"
        />

        <nds-docs-do-dont [title]="t('doDont.title')" [pairs]="doDontPairs()" />

        <nds-docs-import
          [title]="t('import.title')"
          [code]="importCode"
          componentSlug="menubar"
          language="ts"
        />

        <nds-docs-compositions
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="menubar"
          id="variantes"
        />

        <nds-docs-states
          [title]="t('states.title')"
          [cols]="statesCols()"
          [items]="stateItems()"
        />

        <nds-docs-props
          [title]="t('props.title')"
          [tables]="propTables()"
          [interfaceCode]="interfaceCode"
          [extensibilityTitle]="t('props.extensibilityTitle')"
          [extensibilityCode]="extensibilityCode"
        />

        <nds-docs-tokens
          [title]="t('tokens.title')"
          [cols]="tokensCols()"
          [items]="tokenItems()"
          [customizationTitle]="t('tokens.customizationTitle')"
          [customizationCode]="t('tokens.customizationCode')"
        />

        <nds-docs-accessibility
          [title]="t('accessibility.title')"
          [summary]="t('accessibility.summary')"
          [items]="a11yItems()"
          [keyboardTitle]="t('accessibility.keyboard.title')"
          [keyboardItems]="keyboardItems()"
          [screenReaderTitle]="t('accessibility.screenReader.title')"
          [screenReaderItems]="screenReaderItems()"
        />

        <nds-docs-related
          [title]="t('related.title')"
          [items]="relatedItems()"
          componentSlug="menubar"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="menubar"
        />

        <nds-docs-analytics
          [title]="t('analytics.title')"
          [cols]="analyticsCols()"
          [items]="analyticsItems()"
        />

        <nds-docs-testes
          [title]="t('testes.title')"
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
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;

  // Expostos ao template porque expressão de template Angular não enxerga o
  // escopo do módulo — nem `String(...)`, nem uma const de arquivo.
  protected readonly itensArquivo = ITEMS_FILE;
  protected readonly exportacoes = EXPORTACOES;
  protected readonly atalhosEdicao = SHORTCUTS_EDIT;
  protected readonly temas = THEMES;
  protected readonly exibicoes = EXIBICOES;

  /** Estado dos exemplos vivos — alternadores e escolha única. */
  protected readonly regua = signal(true);
  protected readonly grade = signal(false);
  protected readonly tema = signal<unknown>('light');

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
   */
  protected readonly variantItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.items.default'),
        description: stripHtml(t('variants.styles.default')),
        trackId: 'default',
        code: CODE_DEFAULT,
        preview: this.tplVarDefault(),
      },
      {
        name: t('variants.items.destructive'),
        description: stripHtml(t('variants.styles.destructive')),
        trackId: 'destructive',
        code: CODE_DESTRUCTIVE,
        preview: this.tplVarDestructive(),
      },
      ...[
        { key: 'withShortcuts',  trackId: 'with-shortcuts', code: CODE_WITH_SHORTCUTS, tpl: this.tplVarShortcuts() },
        { key: 'withCheckbox',   trackId: 'with-checkbox',  code: CODE_WITH_CHECKBOX,  tpl: this.tplVarCheckbox()   },
        { key: 'withRadio',      trackId: 'with-radio',     code: CODE_WITH_RADIO,     tpl: this.tplVarRadio()      },
        { key: 'editorComplete', trackId: 'editor',         code: CODE_EDITOR,         tpl: this.tplVarEditor()     },
      ].map(({ key, trackId, code, tpl }) => ({
        name: t(`variants.items.${key}.name`),
        description: t(`variants.items.${key}.description`),
        useWhen: t(`variants.items.${key}.use`),
        trackId,
        code,
        preview: tpl,
      })),
    ];
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
    const ofContent = (nome: string, chave: string, tipo?: string, padrao?: string) => ({
      name: nome,
      type: tipo ?? toPlainText(t(`props.table.${chave}.type`)),
      defaultValue: padrao ?? toPlainText(t(`props.table.${chave}.default`)),
      required: toPlainText(t(`props.table.${chave}.required`)),
      description: toPlainText(t(`props.table.${chave}.description`)),
    });

    /** Linha que só existe neste stack — descrição vem do override. */
    const local = (nome: string, tipo: string, padrao: string, chave: string) => ({
      name: nome,
      type: tipo,
      defaultValue: padrao,
      required: not,
      description: toPlainText(t(`props.${chave}.description`)),
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
      { token: '--accent',       k: 'triggerHover',  className: '.nds-menubar-trigger'         },
      { token: '--popover',      k: 'contentBg',     className: '.nds-dropdown-menu-content'   },
      { token: '--border',       k: 'contentBorder', className: '.nds-dropdown-menu-content'   },
      { token: '--radius',       k: 'rounded',       className: '.nds-dropdown-menu-content'   },
      { token: '--accent',       k: 'itemHover',     className: '.nds-dropdown-menu-item'      },
      { token: '--destructive',  k: 'destructive',   className: '.nds-dropdown-menu-item'      },
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
      { key: 'navigationMenu', path: '?path=/docs/ui-navigationmenu--docs' },
      { key: 'dropdownMenu',   path: '?path=/docs/ui-dropdownmenu--docs'   },
      { key: 'sidebar',        path: '?path=/docs/ui-sidebar--docs'        },
      { key: 'command',        path: '?path=/docs/ui-command--docs'        },
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
      event: tNav('common.event'),
      trigger: tNav('common.eventTrigger'),
      payload: tNav('common.payload'),
    };
  });

  protected readonly analyticsItems = computed(() => {
    dict();
    // Sem tabela no conteúdo compartilhado: os eventos vêm da descrição. Os
    // três de produto ainda NÃO existem no catálogo tipado de nenhuma stack —
    // a demonstração acima não os dispara, e a lacuna está reportada.
    const gatilho = toPlainText(t('analytics.description'));
    return [
      { event: 'menubar_menu_open',       trigger: gatilho, payload: 'component, menu' },
      { event: 'menubar_item_select',     trigger: gatilho, payload: 'component, menu, label' },
      { event: 'menubar_shortcut_invoke', trigger: gatilho, payload: 'component, menu, label' },
      {
        event: 'docs_page_view',
        trigger: gatilho,
        payload: 'component_name, locale, page_title',
      },
    ];
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
    dict();
    // Critério como frase única, não {criterion, level, how} — é a forma que
    // este slug usa no conteúdo compartilhado.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        criterion: toPlainText(t(`testes.accessibility.item${i}`)),
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
