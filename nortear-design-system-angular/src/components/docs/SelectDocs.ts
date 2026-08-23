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
import { NDS_SELECT } from '@/components/ui/select';

import { NdsLabel } from '@/components/ui/label';
import uiTranslations from '@/i18n/ui.json';
import selectTranslations from '@shared/content/select/translations.json';

import {
  NdsDocsPageLayout,
  NdsDocsHeader,
  NdsDocsDemonstration,
  NdsDocsAnatomy,
  NdsDocsWhenToUse,
  NdsDocsDoDont,
  NdsDocsImport,
  NdsDocsVariants,
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
// `notes.item3` — o texto compartilhado promete typeahead com o gatilho FOCADO
// e a lista fechada; aqui o primitivo só faz busca por digitação com a lista
// aberta. Prometer o que não acontece é pior do que não prometer.
// `related.items.form.description` — cita o ecossistema de outra stack.
// `states.*` — a tabela compartilhada descreve os estados por classes
// utilitárias de uma era anterior à migração `.nds-*`.
// `props.table.size.description` — fala em tokens de ALTURA; aqui altura nasce
// de padding, que é o que a guideline 12 exige (WCAG 1.4.4).
// `props.*` sem entrada no conteúdo compartilhado — as peças deste stack têm
// mais superfície do que as sete linhas da tabela dele.
const { t, dict } = useTranslation(selectTranslations as Record<string, unknown>, {
  'pt-BR': {
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/select</code> — entrega os papéis ARIA, o modelo de destaque por <code>aria-activedescendant</code>, setas, Home/End, busca por digitação, Escape com devolução do foco, posicionamento com fuga de colisão e o <code>ControlValueAccessor</code> que faz o campo participar do formulário.',
    'notes.item2':
      '<strong>Portal</strong> — a lista é teleportada para o <code>body</code> ao abrir e desmontada ao fechar, então nenhum <code>overflow: hidden</code> de ancestral a recorta. Fechada, ela não existe no DOM — não é um painel escondido.',
    'notes.item3':
      '<strong>Busca por digitação</strong> — com a lista ABERTA, digitar uma letra move o destaque para a próxima opção que começa com ela. Com a lista fechada, o gatilho trata apenas Enter, Espaço, seta para cima e seta para baixo, que a abrem.',
    'notes.item5':
      '<strong>Rótulo do valor</strong> — os rótulos das opções só existem enquanto a lista está montada. Um valor que chega antes da primeira abertura (<code>defaultValue</code>, valor inicial de um controle de formulário) não teria rótulo para exibir: passe <code>itemToStringLabel</code> quando valor e rótulo forem diferentes.',
    'notes.item6':
      '<strong>Opção é um <code>&lt;div&gt;</code></strong> com papel de opção, e não um <code>&lt;button&gt;</code>: a folha do componente não zera a aparência nativa de botão. Num listbox o teclado é do popup — as opções não são focáveis uma a uma —, então um botão só acrescentaria paradas de Tab que o padrão não prevê.',
    'notes.item7':
      '<strong>Complementos ao primitivo</strong> — <code>aria-expanded</code> e <code>aria-haspopup</code> no gatilho, nome acessível para o <code>role="listbox"</code>, o id do cabeçalho que o <code>aria-labelledby</code> do grupo referencia, e <code>data-state="open|closed"</code> ao lado do <code>data-open</code>/<code>data-closed</code> do primitivo. Sem os três primeiros o axe reprova; o quarto é o contrato de markup das outras stacks.',
    'related.items.form.description': 'Integração com validação no modelo reativo de formulário.',
    'states.selected.behavior':
      'Opção escolhida — <code>aria-selected="true"</code> e <code>data-selected</code>, com o ícone de confirmação à direita.',
    'states.focus.behavior':
      'Gatilho focado por teclado — anel desenhado com o token <code>--ring</code>.',
    'states.disabled.behavior':
      'Bloqueado — opacidade reduzida, cursor de indisponível e clique barrado pela folha.',
    'states.invalid.behavior':
      '<code>aria-invalid="true"</code> — borda e anel na cor de perigo.',
    'props.table.size.description':
      'Altura do gatilho. Nasce de <code>padding-block</code> mais tipografia, nunca de altura fixa, para o campo crescer junto com a fonte do navegador.',
    'props.open.description': 'Estado de abertura da lista. Aceita ligação de mão dupla.',
    'props.openChange.description': 'Emite o novo estado de abertura.',
    'props.defaultOpen.description': 'Abre a lista já na montagem, em modo não-controlado.',
    'props.readOnly.description':
      'O valor não pode ser trocado, mas a lista ainda abre para consulta.',
    'props.required.description':
      'Marca o campo como obrigatório para a tecnologia assistiva. A obrigatoriedade real é do formulário.',
    'props.invalid.description':
      'Marca o campo como inválido. É por aqui que se pede a borda de perigo — o atributo escrito no elemento seria sobrescrito pelo primitivo.',
    'props.form.description':
      'Id de um formulário externo que é dono deste campo, para quando ele não está dentro do <code>&lt;form&gt;</code>.',
    'props.modal.description':
      'Isola o resto da página enquanto a lista está aberta. Verdadeiro por padrão.',
    'props.itemToStringLabel.description':
      'Converte um valor no rótulo exibido pelo gatilho. Necessário quando o campo pode nascer preenchido e o valor não é o próprio rótulo.',
    'props.side.description': 'Lado preferido de abertura. Vira o oposto quando não há espaço.',
    'props.align.description': 'Alinhamento da lista no eixo perpendicular ao lado.',
    'props.sideOffset.description': 'Distância em pixels entre o gatilho e a lista.',
    'props.alignOffset.description': 'Deslocamento em pixels no eixo do alinhamento.',
    'props.triggerId.description':
      'Id do gatilho. Gerado automaticamente; declare quando um rótulo externo precisar apontar para ele.',
    'props.itemValue.description': 'Valor desta opção — é o que a raiz compara para saber qual está escolhida.',
    'props.textValue.description':
      'Texto usado pela busca por digitação quando o conteúdo da opção não é texto simples.',
    'props.itemDisabled.description':
      'Torna a opção indisponível. Ela continua anunciada, para quem usa leitor de tela saber que existe.',
    'props.class.description':
      'Classes extras escritas no elemento são mescladas com as do componente; não há prop de classe.',
  },
  en: {
    'notes.item1':
      '<strong>Primitive</strong>: <code>@radix-ng/primitives/select</code> — provides the ARIA roles, the highlight model driven by <code>aria-activedescendant</code>, arrows, Home/End, type-ahead, Escape with focus return, collision-aware positioning and the <code>ControlValueAccessor</code> that makes the field part of the form.',
    'notes.item2':
      '<strong>Portal</strong> — the list is teleported to the <code>body</code> on open and unmounted on close, so no ancestor <code>overflow: hidden</code> clips it. While closed it is absent from the DOM — not a hidden panel.',
    'notes.item3':
      '<strong>Type-ahead</strong> — with the list OPEN, typing a letter moves the highlight to the next option starting with it. With the list closed the trigger only handles Enter, Space, Arrow Up and Arrow Down, which open it.',
    'notes.item5':
      '<strong>Value label</strong> — option labels only exist while the list is mounted. A value that arrives before the first open (<code>defaultValue</code>, a form control initial value) would have no label to show: pass <code>itemToStringLabel</code> whenever value and label differ.',
    'notes.item6':
      '<strong>An option is a <code>&lt;div&gt;</code></strong> with an option role, not a <code>&lt;button&gt;</code>: the component stylesheet does not reset the browser button look. In a listbox the keyboard belongs to the popup — options are not individually focusable — so a button would only add Tab stops the pattern does not call for.',
    'notes.item7':
      '<strong>Additions to the primitive</strong> — <code>aria-expanded</code> and <code>aria-haspopup</code> on the trigger, an accessible name for the <code>role="listbox"</code>, the heading id the group’s <code>aria-labelledby</code> points at, and <code>data-state="open|closed"</code> alongside the primitive’s <code>data-open</code>/<code>data-closed</code>. Without the first three axe fails; the fourth is the markup contract of the other stacks.',
    'related.items.form.description': 'Validation integration with the reactive form model.',
    'states.selected.behavior':
      'Chosen option — <code>aria-selected="true"</code> and <code>data-selected</code>, with the confirmation icon on the right.',
    'states.focus.behavior':
      'Trigger focused via keyboard — ring drawn with the <code>--ring</code> token.',
    'states.disabled.behavior':
      'Blocked — reduced opacity, unavailable cursor and the click barred by the stylesheet.',
    'states.invalid.behavior': '<code>aria-invalid="true"</code> — border and ring in the danger color.',
    'props.table.size.description':
      'Trigger height. It comes from <code>padding-block</code> plus typography, never a fixed height, so the field grows with the browser font size.',
    'props.open.description': 'List open state. Supports two-way binding.',
    'props.openChange.description': 'Emits the new open state.',
    'props.defaultOpen.description': 'Opens the list on mount, uncontrolled.',
    'props.readOnly.description': 'The value cannot be changed, but the list still opens to view it.',
    'props.required.description':
      'Marks the field required for assistive technology. Real enforcement belongs to the form.',
    'props.invalid.description':
      'Marks the field invalid. This is how the danger border is requested — an attribute written on the element would be overwritten by the primitive.',
    'props.form.description':
      'Id of an external form that owns this field, for when it is not inside the <code>&lt;form&gt;</code>.',
    'props.modal.description': 'Isolates the rest of the page while the list is open. True by default.',
    'props.itemToStringLabel.description':
      'Turns a value into the label the trigger shows. Needed when the field can start filled and the value is not the label itself.',
    'props.side.description': 'Preferred opening side. Flips when there is no room.',
    'props.align.description': 'List alignment on the axis perpendicular to the side.',
    'props.sideOffset.description': 'Distance in pixels between trigger and list.',
    'props.alignOffset.description': 'Offset in pixels along the alignment axis.',
    'props.triggerId.description':
      'Trigger id. Generated automatically; declare it when an external label must point at it.',
    'props.itemValue.description':
      'This option value — it is what the root compares to know which one is chosen.',
    'props.textValue.description':
      'Text used by type-ahead when the option content is not plain text.',
    'props.itemDisabled.description':
      'Makes the option unavailable. It stays announced, so screen reader users know it exists.',
    'props.class.description':
      'Extra classes written on the element are merged with the component ones; there is no class prop.',
  },
  es: {
    'notes.item1':
      '<strong>Primitivo</strong>: <code>@radix-ng/primitives/select</code> — aporta los roles ARIA, el modelo de resalte por <code>aria-activedescendant</code>, flechas, Home/End, búsqueda por digitación, Escape con devolución del foco, posicionamiento con evasión de colisión y el <code>ControlValueAccessor</code> que hace del campo parte del formulario.',
    'notes.item2':
      '<strong>Portal</strong> — la lista se teletransporta al <code>body</code> al abrir y se desmonta al cerrar, así ningún <code>overflow: hidden</code> ancestro la recorta. Cerrada no existe en el DOM — no es un panel escondido.',
    'notes.item3':
      '<strong>Búsqueda por digitación</strong> — con la lista ABIERTA, escribir una letra mueve el resalte a la siguiente opción que empieza por ella. Con la lista cerrada el disparador solo trata Enter, Espacio, flecha arriba y flecha abajo, que la abren.',
    'notes.item5':
      '<strong>Etiqueta del valor</strong> — las etiquetas de las opciones solo existen mientras la lista está montada. Un valor que llega antes de la primera apertura (<code>defaultValue</code>, valor inicial de un control de formulario) no tendría etiqueta que mostrar: pasa <code>itemToStringLabel</code> cuando valor y etiqueta sean distintos.',
    'notes.item6':
      '<strong>La opción es un <code>&lt;div&gt;</code></strong> con papel de opción, no un <code>&lt;button&gt;</code>: la hoja del componente no anula la apariencia nativa de botón. En un listbox el teclado es del popup — las opciones no son enfocables una a una —, así que un botón solo añadiría paradas de Tab que el patrón no prevé.',
    'notes.item7':
      '<strong>Complementos al primitivo</strong> — <code>aria-expanded</code> y <code>aria-haspopup</code> en el disparador, nombre accesible para el <code>role="listbox"</code>, el id del encabezado al que apunta el <code>aria-labelledby</code> del grupo, y <code>data-state="open|closed"</code> junto al <code>data-open</code>/<code>data-closed</code> del primitivo. Sin los tres primeros axe reprueba; el cuarto es el contrato de markup de las otras stacks.',
    'related.items.form.description': 'Integración de validación con el modelo reactivo de formulario.',
    'states.selected.behavior':
      'Opción elegida — <code>aria-selected="true"</code> y <code>data-selected</code>, con el icono de confirmación a la derecha.',
    'states.focus.behavior':
      'Disparador enfocado por teclado — anillo dibujado con el token <code>--ring</code>.',
    'states.disabled.behavior':
      'Bloqueado — opacidad reducida, cursor de no disponible y clic barrado por la hoja.',
    'states.invalid.behavior':
      '<code>aria-invalid="true"</code> — borde y anillo en el color de peligro.',
    'props.table.size.description':
      'Altura del disparador. Nace de <code>padding-block</code> más tipografía, nunca de altura fija, para que el campo crezca junto con la fuente del navegador.',
    'props.open.description': 'Estado de apertura de la lista. Admite enlace de doble vía.',
    'props.openChange.description': 'Emite el nuevo estado de apertura.',
    'props.defaultOpen.description': 'Abre la lista al montar, en modo no controlado.',
    'props.readOnly.description': 'El valor no se puede cambiar, pero la lista aún abre para consultarlo.',
    'props.required.description':
      'Marca el campo como obligatorio para la tecnología asistiva. La obligatoriedad real es del formulario.',
    'props.invalid.description':
      'Marca el campo como inválido. Es por aquí que se pide el borde de peligro — el atributo escrito en el elemento sería sobrescrito por el primitivo.',
    'props.form.description':
      'Id de un formulario externo dueño de este campo, para cuando no está dentro del <code>&lt;form&gt;</code>.',
    'props.modal.description': 'Aísla el resto de la página mientras la lista está abierta. Verdadero por defecto.',
    'props.itemToStringLabel.description':
      'Convierte un valor en la etiqueta que muestra el disparador. Necesario cuando el campo puede nacer relleno y el valor no es la propia etiqueta.',
    'props.side.description': 'Lado preferido de apertura. Se invierte cuando no hay espacio.',
    'props.align.description': 'Alineación de la lista en el eje perpendicular al lado.',
    'props.sideOffset.description': 'Distancia en píxeles entre el disparador y la lista.',
    'props.alignOffset.description': 'Desplazamiento en píxeles en el eje de alineación.',
    'props.triggerId.description':
      'Id del disparador. Se genera automáticamente; decláralo cuando una etiqueta externa deba apuntarle.',
    'props.itemValue.description':
      'Valor de esta opción — es lo que la raíz compara para saber cuál está elegida.',
    'props.textValue.description':
      'Texto que usa la búsqueda por digitación cuando el contenido de la opción no es texto simple.',
    'props.itemDisabled.description':
      'Vuelve la opción no disponible. Sigue siendo anunciada, para que quien usa lector de pantalla sepa que existe.',
    'props.class.description':
      'Las clases extra escritas en el elemento se combinan con las del componente; no hay prop de clase.',
  },
});

const SECTION_IDS = [
  'demonstracao', 'anatomia', 'quando-usar', 'do-dont',
  'importacao', 'variantes', 'composicoes', 'estados', 'propriedades', 'tokens',
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
    { id: 'importacao',   labelKey: 'nav.import'       },
    { id: 'variantes',    labelKey: 'nav.variants'     },
    { id: 'composicoes',  labelKey: 'nav.compositions' },
    { id: 'estados',      labelKey: 'nav.states'       },
    { id: 'propriedades', labelKey: 'nav.props'        },
    { id: 'tokens',       labelKey: 'nav.tokens'       },
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
// conteúdo compartilhado desenha a opção como `<button ndsSelectItem>`. Aqui a
// opção é um `<div>` com papel de opção — a folha não zera a aparência nativa
// de botão, e num listbox as opções não são focáveis uma a uma. Mesmo caminho
// do DropdownMenuDocs; a correção do conteúdo está reportada.
const ANATOMY_CODE = `<nds-select [(value)]="estado">
  <button ndsSelectTrigger aria-label="Estado">
    <span ndsSelectValue placeholder="Selecione..."></span>
  </button>

  <ng-template ndsSelectContent>
    <div ndsSelectGroup>
      <div ndsSelectLabel>Sudeste</div>
      <div ndsSelectItem value="sp">São Paulo</div>
      <div ndsSelectItem value="rj">Rio de Janeiro</div>
    </div>
  </ng-template>
</nds-select>`;

const IMPORT_CODE = `import { NDS_SELECT } from '@/components/ui/select';`;

const INTERFACE_CODE = `// A raiz é componente: é ela que declara o portal, o positioner e o popup.
@Component({
  selector: 'nds-select',
  hostDirectives: [
    { directive: RdxSelectRoot,
      inputs: ['value', 'defaultValue', 'open', 'defaultOpen', 'disabled',
               'readOnly', 'required', 'invalid', 'name', 'form', 'modal',
               'itemToStringLabel'],
      outputs: ['valueChange', 'openChange'] },
  ],
})
export class NdsSelect {}

// O miolo da lista é um <ng-template>: quem monta e desmonta é o portal.
@Directive({ selector: 'ng-template[ndsSelectContent]' })
export class NdsSelectContent {
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  readonly side = input<'top' | 'right' | 'bottom' | 'left'>('bottom');
  readonly align = input<'start' | 'center' | 'end'>('start');
}

@Component({
  selector: 'div[ndsSelectItem]',
  hostDirectives: [
    { directive: RdxSelectItem, inputs: ['value', 'textValue', 'disabled'] },
  ],
})
export class NdsSelectItem {}`;

// Também hardcoded: a variante `angular` de `props.extensibilityCode` compõe com
// `nds-form-field`, `ndsFormLabel` e `ndsFormMessage`, que não existem neste
// stack. Aqui o exemplo é o que compila.
const EXTENSIBILITY_CODE = `<!-- Campo dentro de um formulário reativo -->
<form [formGroup]="form" (ngSubmit)="salvar()">
  <label ndsLabel id="rotulo-estado">Estado</label>

  <nds-select formControlName="estado" [invalid]="controle.invalid && controle.touched">
    <button ndsSelectTrigger aria-labelledby="rotulo-estado">
      <span ndsSelectValue placeholder="Selecione..."></span>
    </button>

    <ng-template ndsSelectContent>
      @for (opcao of opcoes; track opcao.value) {
        <div ndsSelectItem [value]="opcao.value">{{ opcao.label }}</div>
      }
    </ng-template>
  </nds-select>

  @if (controle.invalid && controle.touched) {
    <p class="nds-text-caption nds-text-destructive">Escolha um estado.</p>
  }
</form>

// no componente
readonly form = new FormGroup({
  estado: new FormControl<string | null>(null, Validators.required),
});
get controle() { return this.form.controls.estado; }

salvar() {
  // O payload leva o identificador do campo e o valor, nunca o rótulo
  // traduzido: o rótulo partiria um evento em três no GA4, um por idioma.
  track('option_select', {
    component: 'select',
    field_name: 'estado',
    value: this.form.value.estado ?? '',
    location: 'cadastro',
  });
}`;

// Snippets das fichas de Variantes e Composições. Ficam aqui, e não no conteúdo
// compartilhado, porque descrevem a composição DESTE stack.
const CODE_DEFAULT = `<ng-template ndsSelectContent>
  <div ndsSelectItem value="sp">São Paulo</div>
  <div ndsSelectItem value="rj">Rio de Janeiro</div>
</ng-template>`;

const CODE_WITH_GROUPS = `<ng-template ndsSelectContent>
  <div ndsSelectGroup>
    <div ndsSelectLabel>Sudeste</div>
    <div ndsSelectItem value="sp">São Paulo</div>
  </div>
  <div ndsSelectSeparator></div>
  <div ndsSelectGroup>
    <div ndsSelectLabel>Sul</div>
    <div ndsSelectItem value="rs">Rio Grande do Sul</div>
  </div>
</ng-template>`;

const CODE_WITH_ICON = `<div ndsSelectItem value="sp">
  <svg ndsIconePin aria-hidden="true"></svg>
  São Paulo
</div>`;

const CODE_IN_FORM = `<form [formGroup]="form">
  <label ndsLabel id="rotulo-estado">Estado</label>

  <nds-select formControlName="estado" name="estado" required>
    <button ndsSelectTrigger aria-labelledby="rotulo-estado">
      <span ndsSelectValue placeholder="Selecione..."></span>
    </button>

    <ng-template ndsSelectContent>
      <div ndsSelectItem value="sp">São Paulo</div>
    </ng-template>
  </nds-select>
</form>`;

@Component({
  selector: 'nds-select-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    ...NDS_SELECT, NdsLabel,
    NdsDocsPageLayout, NdsDocsHeader, NdsDocsDemonstration, NdsDocsAnatomy,
    NdsDocsWhenToUse, NdsDocsDoDont, NdsDocsImport, NdsDocsVariants,
    NdsDocsCompositions, NdsDocsStates, NdsDocsProps, NdsDocsTokens,
    NdsDocsAccessibility, NdsDocsRelated, NdsDocsNotes, NdsDocsAnalytics,
    NdsDocsTestes,
  ],
  template: `
    <!--
      Os campos das fichas nascem FECHADOS. Uma lista aberta é posicionada em
      \`fixed\` e flutua por cima do que vier depois dela: várias fichas abertas
      cobririam a própria documentação. Quem lê abre a que quiser — e o estado
      aberto é o que as stories capturam para a regressão visual.
    -->
    <ng-template #tplDoDont1Do>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.stateLabel')">
          <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
        </button>
        <ng-template ndsSelectContent>
          @for (state of states(); track state.value) {
            <div ndsSelectItem [value]="state.value">
              {{ state.label }}
            </div>
          }
        </ng-template>
      </nds-select>
    </ng-template>
    <ng-template #tplDoDont1Dont>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.stateLabel')">
          <span ndsSelectValue placeholder="-- -- --"></span>
        </button>
        <ng-template ndsSelectContent>
          <div ndsSelectItem value="sp">SP</div>
          <div ndsSelectItem value="rj">{{ t('demonstration.labels.rj') }}</div>
          <div ndsSelectItem value="mg">MG</div>
        </ng-template>
      </nds-select>
    </ng-template>
    <ng-template #tplDoDont2Do>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.regionLabel')">
          <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
        </button>
        <ng-template ndsSelectContent>
          @for (grupo of grupos(); track grupo.label; let last = $last) {
            <div ndsSelectGroup>
              <div ndsSelectLabel>{{ grupo.label }}</div>
              @for (state of grupo.itens; track state.value) {
                <div ndsSelectItem [value]="state.value">
                  {{ state.label }}
                </div>
              }
            </div>
            @if (!last) {
              <div ndsSelectSeparator></div>
            }
          }
        </ng-template>
      </nds-select>
    </ng-template>
    <ng-template #tplDoDont2Dont>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.regionLabel')">
          <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
        </button>
        <ng-template ndsSelectContent>
          @for (grupo of grupos(); track grupo.label) {
            <div ndsSelectGroup>
              <div ndsSelectLabel>{{ grupo.label }}</div>
              <div ndsSelectItem [value]="grupo.itens[0].value">
                {{ grupo.itens[0].label }}
              </div>
            </div>
          }
        </ng-template>
      </nds-select>
    </ng-template>

    <ng-template #tplVarDefault>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.stateLabel')">
          <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
        </button>
        <ng-template ndsSelectContent>
          @for (state of states(); track state.value) {
            <div ndsSelectItem [value]="state.value">
              {{ state.label }}
            </div>
          }
        </ng-template>
      </nds-select>
    </ng-template>
    <ng-template #tplVarGroups>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.regionLabel')">
          <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
        </button>
        <ng-template ndsSelectContent>
          @for (grupo of grupos(); track grupo.label; let last = $last) {
            <div ndsSelectGroup>
              <div ndsSelectLabel>{{ grupo.label }}</div>
              @for (state of grupo.itens; track state.value) {
                <div ndsSelectItem [value]="state.value">
                  {{ state.label }}
                </div>
              }
            </div>
            @if (!last) {
              <div ndsSelectSeparator></div>
            }
          }
        </ng-template>
      </nds-select>
    </ng-template>
    <ng-template #tplVarIcon>
      <nds-select>
        <button ndsSelectTrigger size="sm" [attr.aria-label]="t('demonstration.labels.stateLabel')">
          <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
        </button>
        <ng-template ndsSelectContent>
          @for (state of states(); track state.value) {
            <div ndsSelectItem [value]="state.value">
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
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {{ state.label }}
            </div>
          }
        </ng-template>
      </nds-select>
    </ng-template>

    <ng-template #tplCompForm>
      <div class="nds-stack" data-spacing="sm">
        <label ndsLabel id="docs-select-form-label">
          {{ t('demonstration.labels.stateLabel') }}
        </label>
        <nds-select name="estado" required>
          <button ndsSelectTrigger size="sm" aria-labelledby="docs-select-form-label">
            <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
          </button>
          <ng-template ndsSelectContent>
            @for (state of states(); track state.value) {
              <div ndsSelectItem [value]="state.value">
                {{ state.label }}
              </div>
            }
          </ng-template>
        </nds-select>
      </div>
    </ng-template>

    <nds-docs-page-layout
      [navGroups]="navGroups()"
      [activeSection]="activeSection()"
      componentSlug="select"
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
            <nds-select (valueChange)="onValueChange('estado', $event)">
              <button ndsSelectTrigger [attr.aria-label]="t('demonstration.labels.stateLabel')">
                <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
              </button>
              <ng-template ndsSelectContent>
                @for (state of states(); track state.value) {
                  <div ndsSelectItem [value]="state.value">
                    {{ state.label }}
                  </div>
                }
              </ng-template>
            </nds-select>

            <nds-select (valueChange)="onValueChange('regiao', $event)">
              <button ndsSelectTrigger [attr.aria-label]="t('demonstration.labels.regionLabel')">
                <span ndsSelectValue [placeholder]="t('demonstration.labels.placeholder')"></span>
              </button>
              <ng-template ndsSelectContent>
                @for (grupo of grupos(); track grupo.label; let last = $last) {
                  <div ndsSelectGroup>
                    <div ndsSelectLabel>{{ grupo.label }}</div>
                    @for (state of grupo.itens; track state.value) {
                      <div ndsSelectItem [value]="state.value">
                        {{ state.label }}
                      </div>
                    }
                  </div>
                  @if (!last) {
                    <div ndsSelectSeparator></div>
                  }
                }
              </ng-template>
            </nds-select>
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
          componentSlug="select"
          language="ts"
        />

        <nds-docs-variants
          [title]="t('variants.title')"
          [items]="variantItems()"
          componentSlug="select"
          language="html"
        />

        <nds-docs-compositions
          [title]="t('variants.compositionsTitle')"
          [items]="compositionItems()"
          [useWhenLabel]="tNav('common.useWhen')"
          componentSlug="select"
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
          componentSlug="select"
        />

        <nds-docs-notes
          [title]="t('notes.title')"
          [items]="noteItems()"
          componentSlug="select"
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
export class NdsSelectDocs implements AfterViewInit, OnDestroy {
  protected readonly t = t;
  protected readonly tNav = tNav;
  protected readonly anatomyCode = ANATOMY_CODE;
  protected readonly interfaceCode = INTERFACE_CODE;
  protected readonly extensibilityCode = EXTENSIBILITY_CODE;
  protected readonly importCode = IMPORT_CODE;

  protected readonly activeSection = signal<string | undefined>(undefined);

  /**
   * Opções da demonstração e das fichas.
   *
   * Cada rótulo é uma chamada de tradução com a chave escrita por extenso, e
   * não uma chave montada por concatenação dentro do laço: só a forma literal é
   * verificável — a auditoria confere que a chave existe no conteúdo
   * compartilhado, e uma chave montada em runtime passaria batido (e apareceria
   * na tela como texto cru se alguém a renomeasse).
   *
   * O VALOR é sigla e o RÓTULO é o nome por extenso, de propósito: é o caso em
   * que o gatilho precisa do rótulo antes da primeira abertura da lista.
   */
  protected readonly states = computed(() => {
    dict();
    return [
      { value: 'sp', label: t('demonstration.labels.sp') },
      { value: 'rj', label: t('demonstration.labels.rj') },
      { value: 'mg', label: t('demonstration.labels.mg') },
    ];
  });

  protected readonly grupos = computed(() => {
    dict();
    return [
      {
        label: t('demonstration.labels.groupSoutheast'),
        itens: [
          { value: 'sp', label: t('demonstration.labels.sp') },
          { value: 'es', label: t('demonstration.labels.es') },
        ],
      },
      {
        label: t('demonstration.labels.groupSouth'),
        itens: [
          { value: 'rs', label: t('demonstration.labels.rs') },
          { value: 'pr', label: t('demonstration.labels.pr') },
        ],
      },
    ];
  });

  private readonly tplDoDont1Do = viewChild.required<TemplateRef<unknown>>('tplDoDont1Do');
  private readonly tplDoDont1Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont1Dont');
  private readonly tplDoDont2Do = viewChild.required<TemplateRef<unknown>>('tplDoDont2Do');
  private readonly tplDoDont2Dont = viewChild.required<TemplateRef<unknown>>('tplDoDont2Dont');
  private readonly tplVarDefault = viewChild.required<TemplateRef<unknown>>('tplVarDefault');
  private readonly tplVarGroups = viewChild.required<TemplateRef<unknown>>('tplVarGroups');
  private readonly tplVarIcon = viewChild.required<TemplateRef<unknown>>('tplVarIcon');
  private readonly tplCompForm = viewChild.required<TemplateRef<unknown>>('tplCompForm');

  /**
   * A demonstração é produto: quem escolhe uma opção aqui dispara o mesmo evento
   * que o componente dispararia num app. O payload leva o IDENTIFICADOR do campo
   * e o valor, nunca o rótulo traduzido — o rótulo partiria um evento em três no
   * GA4, um por idioma.
   */
  protected onValueChange(campo: string, valor: unknown): void {
    track('option_select', {
      component: 'select',
      field_name: campo,
      value: String(valor ?? ''),
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
    return [1, 2, 3, 4, 5, 6].map((i) => t(`anatomy.item${i}`));
  });

  protected readonly guidelines = computed(() => {
    dict();
    return {
      title: t('usage.guidelines.title'),
      items: [1, 2, 3, 4].map((i) => t(`usage.guidelines.item${i}`)),
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
      items: ['placeholder', 'itemLabel', 'groupLabel'].map((key) => ({
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
   * As três variantes vêm de `variants.items` — que aqui são STRINGS, com a
   * descrição em `variants.styles`. Não é a forma de objeto que outros slugs
   * usam, e ler as duas chaves é o que evita imprimir a chave crua.
   */
  protected readonly variantItems = computed(() => {
    dict();
    return [
      { key: 'default', trackId: 'default', code: CODE_DEFAULT, tpl: this.tplVarDefault() },
      { key: 'withGroups', trackId: 'with-groups', code: CODE_WITH_GROUPS, tpl: this.tplVarGroups() },
      { key: 'withIcon', trackId: 'with-icon', code: CODE_WITH_ICON, tpl: this.tplVarIcon() },
    ].map(({ key, trackId, code, tpl }) => ({
      name: t(`variants.items.${key}`),
      description: stripHtml(t(`variants.styles.${key}`)),
      trackId,
      code,
      preview: tpl,
    }));
  });

  /** `variants.compositions.inForm` é OBJETO — nome, descrição e quando usar. */
  protected readonly compositionItems = computed(() => {
    dict();
    return [
      {
        name: t('variants.compositions.inForm.name'),
        description: t('variants.compositions.inForm.description'),
        useWhen: t('variants.compositions.inForm.use'),
        trackId: 'in-form',
        code: CODE_IN_FORM,
        preview: this.tplCompForm(),
      },
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
    return ['default', 'open', 'selected', 'hover', 'focus', 'disabled', 'invalid'].map((k) => ({
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
    const ofContent = (nome: string, chave: string, tipo?: string) => ({
      name: nome,
      type: tipo ?? toPlainText(t(`props.table.${chave}.type`)),
      defaultValue: toPlainText(t(`props.table.${chave}.default`)),
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
        title: 'NdsSelect',
        cols,
        items: [
          ofContent('value', 'value', 'model<T>'),
          ofContent('valueChange', 'onValueChange', 'output<T>'),
          ofContent('defaultValue', 'defaultValue'),
          local('open', 'model<boolean>', 'false', 'open'),
          local('openChange', 'output<boolean>', '—', 'openChange'),
          local('defaultOpen', 'boolean', 'false', 'defaultOpen'),
          ofContent('disabled', 'disabled'),
          local('readOnly', 'boolean', 'false', 'readOnly'),
          local('required', 'boolean', 'false', 'required'),
          local('invalid', 'boolean', 'false', 'invalid'),
          ofContent('name', 'name'),
          local('form', 'string', '—', 'form'),
          local('modal', 'boolean', 'true', 'modal'),
          local('itemToStringLabel', '(value: T) => string', '—', 'itemToStringLabel'),
          className,
        ],
      },
      {
        title: 'NdsSelectTrigger',
        cols,
        items: [
          ofContent('size', 'size'),
          ofContent('disabled', 'disabled'),
          local('id', 'string', 'gerado', 'triggerId'),
          className,
        ],
      },
      {
        title: 'NdsSelectValue',
        cols,
        items: [ofContent('placeholder', 'placeholder'), className],
      },
      {
        title: 'NdsSelectContent',
        cols,
        items: [
          local('side', "'top' | 'right' | 'bottom' | 'left'", "'bottom'", 'side'),
          local('align', "'start' | 'center' | 'end'", "'start'", 'align'),
          local('sideOffset', 'number', '4', 'sideOffset'),
          local('alignOffset', 'number', '0', 'alignOffset'),
        ],
      },
      {
        title: 'NdsSelectItem',
        cols,
        items: [
          {
            name: 'value',
            type: 'T',
            defaultValue: '—',
            required: sim,
            description: toPlainText(t('props.itemValue.description')),
          },
          local('textValue', 'string', '—', 'textValue'),
          local('disabled', 'boolean', 'false', 'itemDisabled'),
          className,
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
    // A coluna do meio vem do conteúdo compartilhado, como as outras duas. Ela
    // já guarda o seletor `.nds-*` com o estado que carrega o token
    // (`:focus-visible`, `[aria-invalid]`, `[data-highlighted]`); a lista cravada
    // aqui era herança de quando o conteúdo guardava classe utilitária, e desde
    // então dizia menos do que a folha (perdia o estado) e não acompanhava
    // correção nenhuma feita no compartilhado.
    return [
      { token: '--input',              k: 'input'             },
      { token: '--ring',               k: 'ring'              },
      { token: '--destructive',        k: 'destructive'       },
      { token: '--popover',            k: 'popover'           },
      { token: '--popover-foreground', k: 'popoverForeground' },
      { token: '--accent',             k: 'accent'            },
      { token: '--accent-foreground',  k: 'accentForeground'  },
      { token: '--muted-foreground',   k: 'mutedForeground'   },
    ].map(({ token, k }) => ({
      token,
      value: toPlainText(t(`tokens.table.${k}.class`)),
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
      { key: 'Tab',        description: toPlainText(t('accessibility.keyboard.tab')) },
      { key: 'Enter',      description: toPlainText(t('accessibility.keyboard.enter')) },
      { key: 'Space',      description: toPlainText(t('accessibility.keyboard.space')) },
      { key: '↓',          description: toPlainText(t('accessibility.keyboard.arrowDown')) },
      { key: '↑',          description: toPlainText(t('accessibility.keyboard.arrowUp')) },
      { key: 'Home',       description: toPlainText(t('accessibility.keyboard.home')) },
      { key: 'End',        description: toPlainText(t('accessibility.keyboard.end')) },
      { key: 'Esc',        description: toPlainText(t('accessibility.keyboard.escape')) },
      { key: 'A-Z',        description: toPlainText(t('accessibility.keyboard.typeAhead')) },
    ];
  });

  protected readonly screenReaderItems = computed(() => {
    dict();
    const locale = getLocale();
    const byLocale = selectTranslations as unknown as Record<
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
      { key: 'combobox',     path: '?path=/docs/ui-combobox--docs'     },
      { key: 'radioGroup',   path: '?path=/docs/ui-radiogroup--docs'   },
      { key: 'dropdownMenu', path: '?path=/docs/ui-dropdownmenu--docs' },
      { key: 'form',         path: '?path=/docs/ui-input--docs'        },
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
    return [
      {
        event: 'option_select',
        trigger: toPlainText(t('analytics.table.option_select.trigger')),
        payload: toPlainText(t('analytics.table.option_select.payload')),
      },
      {
        event: 'docs_page_view',
        trigger: toPlainText(t('analytics.description')),
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
    // Critério como frase única, não {criterion, level, how}: é a forma que este
    // slug usa no conteúdo compartilhado — `testes.accessibility.itemN` é string.
    return {
      title: t('testes.accessibility.title'),
      description: t('testes.accessibility.description'),
      cols: { criterion: tNav('common.criterion'), level: 'WCAG', how: tNav('common.howToVerify') },
      items: [1, 2, 3, 4, 5].map((i) => ({
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
        componentSlug: 'select',
      });
      track('docs_page_view', {
        component_name: 'select',
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
          component_name: 'select',
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
