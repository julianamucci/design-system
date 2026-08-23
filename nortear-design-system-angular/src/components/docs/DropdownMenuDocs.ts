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
import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';
import { NdsButton } from '@/components/ui/button';
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
// `notes.item1` — o texto compartilhado lista as libs das outras stacks pelo
// nome, e cada docs page é consumida isoladamente.
// `notes.item2` / `notes.item5` — o comportamento descrito é o desta stack.
// `props.*` — as props que o conteúdo compartilhado não descreve (as quatro
// peças deste stack têm mais superfície do que as seis linhas da tabela dele).
const { t, dict } = useTranslation(dropdownMenuTranslations as Record<string, unknown>, {
  'pt-BR': {
    'props.class.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
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
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/menu</code> — entrega os papéis ARIA, o foco no primeiro item ao abrir, roving tabindex, setas, Home/End, typeahead, Escape com devolução do foco, posicionamento com fuga de colisão e submenu com abertura em diagonal.',
    'notes.item2':
      '<strong>Portal</strong>: o popup é teleportado para o <code>body</code> ao abrir e desmontado ao fechar, então nenhum <code>overflow: hidden</code> de ancestral o recorta. Fechado, ele não existe no DOM — não é um painel escondido.',
    'notes.item5':
      '<strong>Gatilho</strong>: o mesmo <code>&lt;button&gt;</code> recebe o gatilho e o estilo de botão. Um botão dentro de outro é violação de ARIA e quebra o teclado.',
    'notes.item6':
      '<strong>Item é um <code>&lt;div&gt;</code></strong> com papel de menu, e não um <code>&lt;button&gt;</code>: a folha do componente não zera a aparência nativa de botão. O que a semântica pede é papel, foco e teclado — e os três vêm do primitivo.',
    'notes.item7':
      '<strong>Pendência da lib</strong>: as âncoras de foco que cercam o conteúdo portalizado combinam <code>aria-hidden</code> com <code>tabindex="0"</code>, e o axe lê isso como armadilha de foco. Elas existem justamente para o Tab não ficar preso; a regra está desligada nas stories que terminam com o menu aberto, com o achado registrado.',
  },
  en: {
    'props.class.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
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
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/menu</code> — provides the ARIA roles, focus on the first item when opening, roving tabindex, arrows, Home/End, typeahead, Escape with focus return, collision-aware positioning and diagonal submenu opening.',
    'notes.item2':
      '<strong>Portal</strong>: the popup is teleported to the <code>body</code> on open and unmounted on close, so no ancestor <code>overflow: hidden</code> clips it. While closed it is absent from the DOM — not a hidden panel.',
    'notes.item5':
      '<strong>Trigger</strong>: the same <code>&lt;button&gt;</code> carries the trigger and the button styling. A button inside a button is an ARIA violation and breaks the keyboard.',
    'notes.item6':
      '<strong>An item is a <code>&lt;div&gt;</code></strong> with a menu role, not a <code>&lt;button&gt;</code>: the component stylesheet does not reset the browser button look. What semantics asks for is role, focus and keyboard — and the primitive provides all three.',
    'notes.item7':
      '<strong>Upstream pending item</strong>: the focus guards around the portaled content combine <code>aria-hidden</code> with <code>tabindex="0"</code>, and axe reads that as a focus trap. They exist precisely so Tab does not get trapped; the rule is off in the stories that end with the menu open, and the finding is on record.',
  },
  es: {
    'props.class.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
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
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/menu</code> — aporta los roles ARIA, el foco en el primer item al abrir, roving tabindex, flechas, Home/End, typeahead, Escape con devolución del foco, posicionamiento con evasión de colisión y submenú con apertura en diagonal.',
    'notes.item2':
      '<strong>Portal</strong>: el popup se teletransporta al <code>body</code> al abrir y se desmonta al cerrar, así ningún <code>overflow: hidden</code> ancestro lo recorta. Cerrado no existe en el DOM — no es un panel escondido.',
    'notes.item5':
      '<strong>Disparador</strong>: el mismo <code>&lt;button&gt;</code> recibe el disparador y el estilo de botón. Un botón dentro de otro es violación de ARIA y rompe el teclado.',
    'notes.item6':
      '<strong>El item es un <code>&lt;div&gt;</code></strong> con papel de menú, no un <code>&lt;button&gt;</code>: la hoja del componente no anula la apariencia nativa de botón. Lo que la semántica pide es papel, foco y teclado — y los tres vienen del primitivo.',
    'notes.item7':
      '<strong>Pendiente de la lib</strong>: las anclas de foco que rodean el contenido portalizado combinan <code>aria-hidden</code> con <code>tabindex="0"</code>, y axe lo lee como trampa de foco. Existen justamente para que el Tab no quede atrapado; la regla está desactivada en las stories que terminan con el menú abierto, con el hallazgo registrado.',
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

// Hardcoded, e não `t('anatomy.structureCode')`: a variante `angular` do
// conteúdo compartilhado põe os itens dentro de um `<ng-template>` e os desenha
// como `<button>`. Aqui o popup é um elemento escrito por quem consome (é o que
// mantém a árvore de injeção dos itens correta) e o item é um `<div>` com papel
// de menu (a folha não zera a aparência nativa de botão). Mesmo caminho do
// TabsDocs e do SwitchDocs; a correção do conteúdo está reportada.
const ANATOMY_CODE = `<nds-dropdown-menu>
  <button ndsDropdownMenuTrigger ndsButton variant="outline">Abrir menu</button>

  <ng-template ndsDropdownMenuContent side="bottom" align="start">
    <div ndsDropdownMenuLabel>Conta</div>
    <div ndsDropdownMenuItem>Perfil</div>
    <div ndsDropdownMenuItem>Configurações</div>
    <div ndsDropdownMenuSeparator></div>
    <div ndsDropdownMenuItem variant="destructive">Sair</div>
  </ng-template>
</nds-dropdown-menu>`;

const INTERFACE_CODE = `// A raiz é componente: é ela que declara o portal, o positioner e o popup.
@Component({
  selector: 'nds-dropdown-menu, nds-dropdown-menu-sub',
  hostDirectives: [
    { directive: RdxMenuRoot,
      inputs: ['open', 'defaultOpen', 'disabled', 'modal', 'loopFocus'],
      outputs: ['openChange'] },
  ],
})
export class NdsDropdownMenu {}

// O miolo do menu é um <ng-template>: quem monta e desmonta é o portal.
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

// Também hardcoded: a variante `angular` de `props.extensibilityCode` descreve
// o popup dentro de um `<ng-template>`. Aqui o exemplo é o que compila.
const EXTENSIBILITY_CODE = `<!-- Menu controlado, com posicionamento e analytics -->
<nds-dropdown-menu [open]="aberto()" (openChange)="onOpenChange($event)">
  <button ndsDropdownMenuTrigger ndsButton variant="outline">Ações</button>

  <ng-template ndsDropdownMenuContent side="right" align="end" [sideOffset]="8">
    @for (acao of acoes; track acao.value) {
      <div ndsDropdownMenuItem (onSelect)="onSelect(acao.value)">{{ acao.label }}</div>
    }
  </ng-template>
</nds-dropdown-menu>

// no componente
readonly aberto = signal(false);

onOpenChange(proximo: boolean) {
  this.aberto.set(proximo);
  // O payload leva o identificador do menu, nunca o rótulo traduzido: o rótulo
  // partiria um evento em três no GA4, um por idioma.
  track(proximo ? 'dropdown_menu_open' : 'dropdown_menu_close', {
    component: 'dropdown-menu',
    label: 'acoes',
    location: 'toolbar',
  });
}`;

const IMPORT_CODE = `import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';
import { NdsButton } from '@/components/ui/button';`;

// Snippets das seis fichas da seção Variantes. Ficam aqui, e não no conteúdo
// compartilhado, porque descrevem a composição DESTE stack.
const CODE_DEFAULT = `<div ndsDropdownMenuItem>Perfil</div>`;

const CODE_DESTRUCTIVE = `<div ndsDropdownMenuItem variant="destructive">Excluir conta</div>`;

const CODE_WITH_LABEL = `<ng-template ndsDropdownMenuContent>
  <div ndsDropdownMenuGroup>
    <div ndsDropdownMenuLabel>Conta</div>
    <div ndsDropdownMenuItem>Perfil</div>
  </div>
  <div ndsDropdownMenuSeparator></div>
  <div ndsDropdownMenuGroup>
    <div ndsDropdownMenuLabel>Suporte</div>
    <div ndsDropdownMenuItem>Documentação</div>
  </div>
</ng-template>`;

const CODE_WITH_CHECKBOX = `<ng-template ndsDropdownMenuContent>
  <div ndsDropdownMenuGroup>
    <div ndsDropdownMenuLabel>Colunas visíveis</div>
    <div ndsDropdownMenuCheckboxItem [(checked)]="nome">Nome</div>
    <div ndsDropdownMenuCheckboxItem [(checked)]="email">E-mail</div>
  </div>
</ng-template>`;

const CODE_WITH_RADIO = `<ng-template ndsDropdownMenuContent>
  <div ndsDropdownMenuRadioGroup [(value)]="tema">
    <div ndsDropdownMenuLabel>Aparência</div>
    <div ndsDropdownMenuRadioItem value="light">Claro</div>
    <div ndsDropdownMenuRadioItem value="dark">Escuro</div>
  </div>
</ng-template>`;

const CODE_WITH_SHORTCUTS = `<ng-template ndsDropdownMenuContent>
  <div ndsDropdownMenuItem>
    Copiar <span ndsDropdownMenuShortcut>Ctrl C</span>
  </div>
</ng-template>`;

/** Itens da demonstração — base estável do payload de analytics. */
const ITEMS_DEMO = ['perfil', 'configuracoes', 'sair'] as const;

@Component({
  selector: 'nds-dropdown-menu-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_DROPDOWN_MENU, NdsButton,
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
    <ng-template #tplDoDont1Do>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('usage.uxWriting.table.label.good') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>{{ t('usage.uxWriting.table.label.good') }}</div>
            <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }}</div>
            <div ndsDropdownMenuItem>{{ t('demonstration.labels.basic') }}</div>
          </div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>{{ t('related.items.command.name') }}</div>
            <div ndsDropdownMenuItem>{{ t('demonstration.labels.withCheckbox') }}</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('usage.uxWriting.table.trigger.bad') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          @for (n of dezItens; track n) {
            <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }} {{ n }}</div>
          }
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('usage.uxWriting.table.label.good') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuItem variant="destructive">
            {{ t('usage.uxWriting.table.destructive.good') }}
          </div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('usage.uxWriting.table.label.good') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.destructive.good') }}</div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>

    <ng-template #tplVarDefault>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('demonstration.labels.basic') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          <div ndsDropdownMenuItem>{{ t('demonstration.labels.basic') }}</div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplVarDestructive>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('usage.uxWriting.table.destructive.good') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuItem variant="destructive">
            {{ t('usage.uxWriting.table.destructive.good') }}
          </div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplVarLabel>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('usage.uxWriting.table.label.good') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>{{ t('usage.uxWriting.table.label.good') }}</div>
            <div ndsDropdownMenuItem>{{ t('usage.uxWriting.table.item.good') }}</div>
          </div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>{{ t('related.items.command.name') }}</div>
            <div ndsDropdownMenuItem>{{ t('demonstration.labels.basic') }}</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplVarCheckbox>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('demonstration.labels.withCheckbox') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuGroup>
            <div ndsDropdownMenuLabel>{{ t('demonstration.labels.withCheckbox') }}</div>
            <div ndsDropdownMenuCheckboxItem [(checked)]="colunaNome">
              {{ t('usage.uxWriting.table.label.good') }}
            </div>
            <div ndsDropdownMenuCheckboxItem [(checked)]="colunaEmail">
              {{ t('usage.uxWriting.table.item.good') }}
            </div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplVarRadio>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('demonstration.labels.withRadio') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuRadioGroup [(value)]="theme">
            <div ndsDropdownMenuLabel>{{ t('demonstration.labels.withRadio') }}</div>
            <div ndsDropdownMenuRadioItem value="light">Light</div>
            <div ndsDropdownMenuRadioItem value="dark">Dark</div>
            <div ndsDropdownMenuRadioItem value="system">System</div>
          </div>
        </ng-template>
      </nds-dropdown-menu>
    </ng-template>
    <ng-template #tplVarShortcuts>
      <nds-dropdown-menu>
        <button ndsDropdownMenuTrigger ndsButton variant="outline" size="sm">
          {{ t('demonstration.labels.basic') }}
        </button>
        <ng-template ndsDropdownMenuContent>
          <div ndsDropdownMenuItem>
            {{ t('usage.uxWriting.table.item.good') }}
            <span ndsDropdownMenuShortcut>Ctrl E</span>
          </div>
          <div ndsDropdownMenuItem>
            {{ t('demonstration.labels.basic') }}
            <span ndsDropdownMenuShortcut>Ctrl K</span>
          </div>
        </ng-template>
      </nds-dropdown-menu>
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
        <nds-docs-demonstration [title]="t('demonstration.title')">
          <div class="nds-cluster" data-gap="sm">
            <nds-dropdown-menu (openChange)="onOpenChange('acoes', $event)">
              <button ndsDropdownMenuTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.basic') }}
              </button>
              <ng-template ndsDropdownMenuContent>
                <div ndsDropdownMenuGroup>
                  <div ndsDropdownMenuLabel>{{ t('usage.uxWriting.table.label.good') }}</div>
                  @for (item of itensDemo; track item) {
                    <div ndsDropdownMenuItem (onSelect)="onSelect('acoes', item)">
                      {{ t('usage.uxWriting.table.item.good') }} — {{ item }}
                    </div>
                  }
                </div>
              </ng-template>
            </nds-dropdown-menu>

            <nds-dropdown-menu (openChange)="onOpenChange('colunas', $event)">
              <button ndsDropdownMenuTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.withCheckbox') }}
              </button>
              <ng-template ndsDropdownMenuContent>
                <div ndsDropdownMenuGroup>
                  <div ndsDropdownMenuLabel>{{ t('demonstration.labels.withCheckbox') }}</div>
                  <div ndsDropdownMenuCheckboxItem [(checked)]="colunaNome">
                    {{ t('usage.uxWriting.table.label.good') }}
                  </div>
                  <div ndsDropdownMenuCheckboxItem [(checked)]="colunaEmail">
                    {{ t('usage.uxWriting.table.item.good') }}
                  </div>
                </div>
              </ng-template>
            </nds-dropdown-menu>

            <nds-dropdown-menu (openChange)="onOpenChange('tema', $event)">
              <button ndsDropdownMenuTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.withRadio') }}
              </button>
              <ng-template ndsDropdownMenuContent>
                <div ndsDropdownMenuRadioGroup [(value)]="theme">
                  <div ndsDropdownMenuLabel>{{ t('demonstration.labels.withRadio') }}</div>
                  <div ndsDropdownMenuRadioItem value="light">Light</div>
                  <div ndsDropdownMenuRadioItem value="dark">Dark</div>
                  <div ndsDropdownMenuRadioItem value="system">System</div>
                </div>
              </ng-template>
            </nds-dropdown-menu>

            <nds-dropdown-menu (openChange)="onOpenChange('submenu', $event)">
              <button ndsDropdownMenuTrigger ndsButton variant="outline">
                {{ t('demonstration.labels.withSubmenu') }}
              </button>
              <ng-template ndsDropdownMenuContent>
                <div ndsDropdownMenuItem (onSelect)="onSelect('submenu', 'renomear')">
                  {{ t('usage.uxWriting.table.item.good') }}
                </div>
                <nds-dropdown-menu-sub>
                  <div ndsDropdownMenuSubTrigger>
                    {{ t('demonstration.labels.withSubmenu') }}
                  </div>
                  <ng-template ndsDropdownMenuSubContent>
                    <div ndsDropdownMenuItem (onSelect)="onSelect('submenu', 'pdf')">PDF</div>
                    <div ndsDropdownMenuItem (onSelect)="onSelect('submenu', 'csv')">CSV</div>
                  </ng-template>
                </nds-dropdown-menu-sub>
              </ng-template>
            </nds-dropdown-menu>
          </div>
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
          componentSlug="dropdown-menu"
          language="ts"
        />

        <nds-docs-compositions
          [title]="t('variants.title')"
          [items]="variantItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="dropdown-menu"
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
          componentSlug="dropdown-menu"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="dropdown-menu"
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
export class NdsDropdownMenuDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;
  protected readonly itensDemo = ITEMS_DEMO;
  protected readonly dezItens = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  /** Estado dos exemplos vivos — alternadores e escolha única. */
  protected readonly colunaNome = signal(true);
  protected readonly colunaEmail = signal(false);
  protected readonly theme = signal<unknown>('light');

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

  /**
   * A demonstração é produto: quem abre um menu aqui dispara o mesmo evento que
   * o componente dispararia num app. O payload leva o IDENTIFICADOR do menu e do
   * item, nunca o rótulo traduzido — o rótulo partiria um evento em três no GA4.
   */
  protected onOpenChange(menu: string, isOpen: boolean): void {
    track(isOpen ? 'dropdown_menu_open' : 'dropdown_menu_close', {
      component: 'dropdown-menu',
      label: menu,
      location: 'docs-demonstration',
    });
  }

  protected onSelect(menu: string, item: string): void {
    track('dropdown_menu_item_select', {
      component: 'dropdown-menu',
      label: item,
      menu,
      location: 'docs-demonstration',
    });
  }

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
        { key: 'withLabel',         trackId: 'with-label',         code: CODE_WITH_LABEL,     tpl: this.tplVarLabel()     },
        { key: 'withCheckboxItems', trackId: 'with-checkbox',      code: CODE_WITH_CHECKBOX,  tpl: this.tplVarCheckbox()  },
        { key: 'withRadioGroup',    trackId: 'with-radio',         code: CODE_WITH_RADIO,     tpl: this.tplVarRadio()     },
        { key: 'withShortcuts',     trackId: 'with-shortcuts',     code: CODE_WITH_SHORTCUTS, tpl: this.tplVarShortcuts() },
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
    const ofContent = (name: string, key: string, type?: string) => ({
      name: name,
      type: type ?? toPlainText(t(`props.table.${key}.type`)),
      defaultValue: toPlainText(t(`props.table.${key}.default`)),
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
        title: 'NdsDropdownMenu',
        cols,
        items: [
          ofContent('open', 'open', 'model<boolean>'),
          ofContent('openChange', 'onOpenChange', 'output<boolean>'),
          ofContent('defaultOpen', 'defaultOpen'),
          ofContent('modal', 'modal'),
          local('disabled', 'boolean', 'false', 'disabled'),
          local('loopFocus', 'boolean', 'true', 'loopFocus'),
          className,
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
          className,
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
      { key: 'contextMenu', path: '?path=/docs/ui-contextmenu--docs' },
      { key: 'menubar',     path: '?path=/docs/ui-menubar--docs'     },
      { key: 'command',     path: '?path=/docs/ui-command--docs'     },
      { key: 'popover',     path: '?path=/docs/ui-popover--docs'     },
      { key: 'select',      path: '?path=/docs/ui-select--docs'      },
    ].map(({ key, path }) => ({
      name: t(`related.items.${key}.name`),
      description: t(`related.items.${key}.description`),
      path,
    }));
  });

  protected readonly noteItems = computed(() => {
    dict();
    return [1, 2, 3, 4, 5, 6, 7].map((i) => ({ title: '', content: t(`notes.item${i}`) }));
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
    // Sem tabela no conteúdo compartilhado: os eventos vêm da descrição, e são
    // os mesmos que a demonstração acima dispara de verdade.
    const trigger = toPlainText(t('analytics.description'));
    return [
      { event: 'dropdown_menu_open',        trigger: trigger, payload: 'component, label, location' },
      { event: 'dropdown_menu_close',       trigger: trigger, payload: 'component, label, location' },
      { event: 'dropdown_menu_item_select', trigger: trigger, payload: 'component, label, menu, location' },
      {
        event: 'docs_page_view',
        trigger: trigger,
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
    // Critério como frase única, não {criterion, level, how} — mesma forma do
    // tabs e do radio-group.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5, 6].map((i) => ({
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
