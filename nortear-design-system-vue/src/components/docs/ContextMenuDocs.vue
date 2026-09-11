<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from '@shared/content/context-menu/translations.json';
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
  type ContextMenuCloseReason,
} from '@/components/ui/context-menu';
import {
  contextMenuSnippet,
  type ContextMenuSnippetEntry,
  type ContextMenuSnippetItem,
} from '@/components/ui/context-menu/context-menu.source';
import { Button } from '@/components/ui/button';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (componentTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// A moldura tracejada da área vem da constante COMPARTILHADA. Esta página
// escrevia a cadeia à mão em treze lugares, e com `nds-w-full nds-max-w-xs` no
// lugar de `nds-w-xs` — a divergência que a constante existe justamente para
// impedir (o docblock dela registra a rodada em que as cinco stacks desenhavam
// molduras diferentes).
const areaClasse = AREA_CLICK_DIREITO;

// A MESMA área, sem a dica visual: mesmo tamanho, mesmo recheio, mesmo texto
// atenuado — só sem moldura e sem cursor. É o lado do "evite" do par 3, e ela
// existe porque a legenda daquele par contrapõe área COM dica e área SEM. Com o
// tracejado dos dois lados só o rótulo mudava, e o par não ilustrava nada.
// Vanilla é a referência: `makePlainArea` em `ContextMenuDocs.ts`.
const areaSemDicaClasse =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-text-body nds-text-muted-foreground';

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

/**
 * Varre `base.item1`, `base.item2`, … enquanto existirem no conteúdo.
 *
 * Citar índice por índice trava a lista no tamanho de hoje: o conteúdo
 * compartilhado ganha um item e ele simplesmente não existe para quem lê — sem
 * erro, sem aviso, nos três idiomas de uma vez. Foi o que aconteceu com o nono
 * critério de acessibilidade deste componente, o do item desabilitado que
 * continua no percurso do teclado.
 *
 * Trocar 8 por 9 não resolveria: o total cravado É o defeito, e ele volta no
 * item seguinte.
 */
function stringsFromDict(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  prefix = 'item',
): string[] {
  const out: string[] = [];
  for (let i = 1; ; i++) {
    const value = t(`${base}.${prefix}${i}`, '');
    if (!value) break;
    out.push(value);
  }
  return out;
}

/**
 * A mesma varredura para a lista cujo item é um OBJETO — cenário, critério
 * funcional, story de regressão visual. O primeiro campo é quem decide se o
 * item existe, e os demais acompanham.
 */
function entriesFromDict<K extends string>(
  t: (key: string, defaultValue?: string) => string,
  base: string,
  fields: readonly K[],
): Array<Record<K, string>> {
  const out: Array<Record<K, string>> = [];
  for (let i = 1; ; i++) {
    if (!t(`${base}.item${i}.${fields[0]}`, '')) break;
    out.push(
      Object.fromEntries(
        fields.map(field => [field, t(`${base}.item${i}.${field}`, '')]),
      ) as Record<K, string>,
    );
  }
  return out;
}

/**
 * Nível WCAG e forma de verificar cada critério de acessibilidade, por índice.
 * Ficam aqui, e não no conteúdo compartilhado, porque são IDENTIFICADORES
 * (número de critério, consulta da suíte, regra do axe) e identificador não se
 * traduz. A coluna "como verificar" dizia "DOM inspection" e "Keyboard test" —
 * frase em inglês, igual nos três idiomas e sem ser nome de ferramenta nenhuma.
 * Agora ela diz a consulta ou a regra que de fato mede o critério.
 * Item novo que chegue além da lista cai no par padrão em vez de sumir.
 */
const a11yTestLevels = [
  'AA',
  '4.1.2 · A',
  '4.1.2 · A',
  '4.1.2 · A',
  '4.1.2 · A',
  '4.1.2 · A',
  '2.1.1 · A',
  '1.4.3 · AA',
  '2.1.1 · A',
];
const a11yTestHow = [
  'axe-core',
  "getByRole('menu')",
  "getAllByRole('menuitem')",
  "getAllByRole('menuitemcheckbox') · aria-checked",
  "getAllByRole('menuitemradio') · aria-checked",
  'aria-disabled',
  'Escape · document.activeElement',
  'axe-core · color-contrast',
  'ArrowDown · document.activeElement',
];

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'context-menu',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

// `page_title` é o título que a aba mostra — o mesmo que o `useSeoEffect`
// escreve, com o sufixo. O `seo.title` cru mandava outro texto que as outras
// quatro stacks, e o mesmo componente aparecia com dois títulos no GA4.
watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'context-menu',
    locale: newLocale,
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')       },
      { id: 'quando-usar',  label: tNav('nav.usage')         },
      { id: 'do-dont',      label: tNav('nav.doDont')        },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'estados',      label: tNav('nav.states')   },
      { id: 'propriedades', label: tNav('nav.props')    },
      { id: 'tokens',       label: tNav('nav.tokens')   },
    ],
  },
  {
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tNav('nav.accessibility') },
      { id: 'relacionados',   label: tNav('nav.related')       },
      { id: 'notas',          label: tNav('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tNav('nav.analytics') },
      { id: 'testes',    label: tNav('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap(g => g.sections.map(s => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'context-menu',
    locale: locale.value,
  });
});

// ─── Analytics — menus vivos ──────────────────────────────────────────────────

// Demonstração, Variantes e Do & Don't renderizam o componente VIVO, e abrir,
// escolher e fechar ali é tão real quanto na demo — por isso as três seções
// disparam os três eventos, cada uma com a SUA `location`.
//
// `menu` e `label` são IDENTIFICADORES, nunca o rótulo traduzido: texto
// localizado partiria o mesmo evento em um valor por idioma no GA4 — "Editar",
// "Edit" e "Editar" chegariam como três ações diferentes.
type DocsLocation = 'docs_demo' | 'docs_variantes' | 'docs_do_dont';

/**
 * O fechamento leva o motivo que a raiz desta stack entrega em `update:open`
 * (`escape`, `overlay` ou `api`). O `?? 'api'` só cobre o tipo: a raiz sempre o
 * manda ao fechar.
 */
function trackOpenChange(menu: string, location: DocsLocation) {
  return (open: boolean, reason?: ContextMenuCloseReason) => {
    if (open) {
      track('context_menu_open', { component: 'context-menu', menu, location });
      return;
    }
    track('context_menu_close', {
      component: 'context-menu',
      menu,
      reason: reason ?? 'api',
      location,
    });
  };
}

function trackItemSelect(menu: string, location: DocsLocation, label: string) {
  track('context_menu_item_select', { component: 'context-menu', label, menu, location });
}

// Um ouvinte por menu, criado uma vez: o template recebe a FUNÇÃO, e não uma
// chamada que a devolveria a cada evento sem nunca executá-la.
const openChange = {
  demo:          trackOpenChange('demo', 'docs_demo'),
  pair1Do:       trackOpenChange('pair1-do', 'docs_do_dont'),
  pair1Dont:     trackOpenChange('pair1-dont', 'docs_do_dont'),
  pair2Do:       trackOpenChange('pair2-do', 'docs_do_dont'),
  pair2Dont:     trackOpenChange('pair2-dont', 'docs_do_dont'),
  pair3Do:       trackOpenChange('pair3-do', 'docs_do_dont'),
  pair3Dont:     trackOpenChange('pair3-dont', 'docs_do_dont'),
  default:       trackOpenChange('default', 'docs_variantes'),
  destructive:   trackOpenChange('destructive', 'docs_variantes'),
  label:         trackOpenChange('label', 'docs_variantes'),
  withCheckbox:  trackOpenChange('with-checkbox', 'docs_variantes'),
  withRadio:     trackOpenChange('with-radio', 'docs_variantes'),
  withSubmenu:   trackOpenChange('with-submenu', 'docs_variantes'),
  withShortcuts: trackOpenChange('with-shortcuts', 'docs_variantes'),
};

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";`;

const codeImportWithCheckbox = `import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";`;

// ─── Variantes — estado inicial e código das prévias ──────────────────────────

// Estado inicial das prévias de marcação e de rádio. É o MESMO valor que o
// `ref` de cada prévia recebe e que o trecho de código ao lado declara — um só
// lugar, para que os dois não possam divergir. Grade desmarcada e réguas
// marcadas, como na referência: a prévia chegou a abrir com os dois trocados.
const SHOW_GRID_INITIAL = false;
const SHOW_RULERS_INITIAL = true;
const LAYOUT_INITIAL = 'grid';

/**
 * O código dos sete cards, com os rótulos no idioma da página.
 *
 * Até 2026-09-10 cada card levava um literal em português ao lado de uma prévia
 * traduzida: em inglês a prévia dizia "Edit" e o código "Editar". Agora o
 * trecho sai de `contextMenuSnippet`, a partir dos mesmos
 * `demonstration.labels.*` que a prévia lê — o código que se copia desenha o
 * que se vê, nos três idiomas.
 *
 * O que é instrumentação da página (`@update:open`, `@select` ligados ao
 * rastreio) não entra: é andaime desta docs page, não lição do menu.
 */
const variantCode = computed(() => {
  const edit: ContextMenuSnippetItem = { kind: 'item', label: tContent('demonstration.labels.edit') };
  const duplicate: ContextMenuSnippetItem = { kind: 'item', label: tContent('demonstration.labels.duplicate') };
  const remove: ContextMenuSnippetItem = {
    kind: 'item',
    label: tContent('demonstration.labels.delete'),
    destructive: true,
  };
  const separator: ContextMenuSnippetEntry = { kind: 'separator' };
  const code = (entries: ContextMenuSnippetEntry[]) =>
    contextMenuSnippet({ triggerLabel: tContent('demonstration.labels.triggerLabel'), entries });

  return {
    default: code([edit, duplicate]),
    destructive: code([edit, separator, remove]),
    // O rótulo mora DENTRO do grupo: é o grupo que o usa como nome.
    label: code([
      {
        kind: 'group',
        label: tContent('demonstration.labels.groupActions'),
        inset: true,
        entries: [{ ...edit, inset: true }, { ...duplicate, inset: true }],
      },
    ]),
    withCheckbox: code([
      {
        kind: 'group',
        label: tContent('demonstration.labels.groupView'),
        entries: [
          { kind: 'checkbox', label: tContent('demonstration.labels.showGrid'), model: 'showGrid', checked: SHOW_GRID_INITIAL },
          { kind: 'checkbox', label: tContent('demonstration.labels.showRulers'), model: 'showRulers', checked: SHOW_RULERS_INITIAL },
        ],
      },
    ]),
    // UM grupo só: o de rádio, com o rótulo dentro dele.
    withRadio: code([
      {
        kind: 'radio-group',
        label: tContent('demonstration.labels.groupLayout'),
        model: 'layout',
        value: LAYOUT_INITIAL,
        options: [
          { label: tContent('demonstration.labels.layoutGrid'), value: 'grid' },
          { label: tContent('demonstration.labels.layoutList'), value: 'list' },
          { label: tContent('demonstration.labels.layoutColumns'), value: 'columns' },
        ],
      },
    ]),
    withSubmenu: code([
      edit,
      duplicate,
      {
        kind: 'sub',
        label: tContent('demonstration.labels.share'),
        entries: [
          { kind: 'item', label: tContent('demonstration.labels.shareEmail') },
          { kind: 'item', label: tContent('demonstration.labels.shareLink') },
        ],
      },
    ]),
    withShortcuts: code([
      { ...edit, shortcut: tContent('demonstration.labels.editShortcut') },
      { ...duplicate, shortcut: tContent('demonstration.labels.duplicateShortcut') },
      separator,
      { ...remove, shortcut: tContent('demonstration.labels.deleteShortcut') },
    ]),
  };
});

// A API desta stack, conferida contra os tipos da reka-ui e os wrappers de
// `ui/context-menu/`. `side`, `sideOffset` e `align` NÃO aparecem no painel:
// o `ContextMenuContent` da reka os fixa (direita, 2 e início) por cima do que
// vier de fora — num ponto de ancoragem, o painel nasce no ponteiro. `inset`
// está onde a folha tem regra para ele (item, rótulo, sub-gatilho); nos itens
// de marcação e de rádio a pista do indicador já faz o alinhamento.
const interfaceCode = `// ContextMenu — raiz
interface ContextMenuProps {
  modal?: boolean;          // padrão: true
  dir?: 'ltr' | 'rtl';
  pressOpenDelay?: number;  // padrão: 700
}
// @update:open → (open: boolean, reason?: 'escape' | 'overlay' | 'api')

// ContextMenuContent
interface ContextMenuContentProps {
  alignOffset?: number;     // padrão: 0
  loop?: boolean;
  class?: string;
}

// ContextMenuItem
interface ContextMenuItemProps {
  variant?: 'default' | 'destructive';
  inset?: boolean;
  disabled?: boolean;
  textValue?: string;
  class?: string;
}
// @select → (event: Event)

// ContextMenuCheckboxItem
interface ContextMenuCheckboxItemProps {
  checked?: boolean | 'indeterminate';
  disabled?: boolean;
  class?: string;
}
// @update:checked → (value: boolean)

// ContextMenuRadioGroup
interface ContextMenuRadioGroupProps {
  modelValue?: string;      // v-model
}
// @update:model-value → (value: string)

// ContextMenuRadioItem
interface ContextMenuRadioItemProps {
  value: string;
  disabled?: boolean;
  class?: string;
}

// ContextMenuLabel e ContextMenuSubTrigger
interface ContextMenuLabelProps {
  inset?: boolean;
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => stringsFromDict(tContent, 'anatomy'));

const usageGuidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: stringsFromDict(tContent, 'usage.guidelines'),
}));

const usageScenarios = computed(() => ({
  title: tContent('usage.scenarios.title'),
  cols: {
    scenario: tContent('usage.scenarios.cols.scenario'),
    use: tContent('usage.scenarios.cols.use'),
    alternative: tContent('usage.scenarios.cols.alternative'),
  },
  items: entriesFromDict(tContent, 'usage.scenarios', ['s', 'u', 'a']),
}));

const usageDo = computed(() => ({
  title: tContent('usage.do.title'),
  items: stringsFromDict(tContent, 'usage.do'),
}));

const usageDont = computed(() => ({
  title: tContent('usage.dont.title'),
  items: stringsFromDict(tContent, 'usage.dont'),
}));

// `name` e `trackId` são a CHAVE do card no conteúdo compartilhado — é deles
// que sai o `snippet_id` do botão de copiar. O nome traduzido partiria o mesmo
// botão em três valores no GA4, e "Label" com maiúscula não casava com a chave
// `label` que as outras stacks mandam.
const variantItems = computed(() => [
  { name: 'default',      description: stripHtml(tContent('variants.items.default')),      code: variantCode.value.default     },
  { name: 'destructive',  description: stripHtml(tContent('variants.items.destructive')),  code: variantCode.value.destructive },
  { name: 'label',        description: stripHtml(tContent('variants.items.label')),        code: variantCode.value.label       },
  {
    trackId: 'withCheckbox',
    name: tContent('variants.items.withCheckbox.name'),
    description: tContent('variants.items.withCheckbox.description'),
    useWhen: tContent('variants.items.withCheckbox.use'),
    code: variantCode.value.withCheckbox,
  },
  {
    trackId: 'withRadio',
    name: tContent('variants.items.withRadio.name'),
    description: tContent('variants.items.withRadio.description'),
    useWhen: tContent('variants.items.withRadio.use'),
    code: variantCode.value.withRadio,
  },
  {
    trackId: 'withSubmenu',
    name: tContent('variants.items.withSubmenu.name'),
    description: tContent('variants.items.withSubmenu.description'),
    useWhen: tContent('variants.items.withSubmenu.use'),
    code: variantCode.value.withSubmenu,
  },
  {
    trackId: 'withShortcuts',
    name: tContent('variants.items.withShortcuts.name'),
    description: tContent('variants.items.withShortcuts.description'),
    useWhen: tContent('variants.items.withShortcuts.use'),
    code: variantCode.value.withShortcuts,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),   trigger: toPlainText(tContent('states.closed.trigger')),   behavior: toPlainText(tContent('states.closed.behavior'))},
  { label: tContent('states.open.label'),     trigger: toPlainText(tContent('states.open.trigger')),     behavior: toPlainText(tContent('states.open.behavior'))},
  { label: tContent('states.focused.label'),  trigger: toPlainText(tContent('states.focused.trigger')),  behavior: toPlainText(tContent('states.focused.behavior'))},
  { label: tContent('states.disabled.label'), trigger: toPlainText(tContent('states.disabled.trigger')), behavior: toPlainText(tContent('states.disabled.behavior'))},
  { label: tContent('states.checked.label'),  trigger: toPlainText(tContent('states.checked.trigger')),  behavior: toPlainText(tContent('states.checked.behavior'))},
  { label: tContent('states.mixed.label'),    trigger: toPlainText(tContent('states.mixed.trigger')),    behavior: toPlainText(tContent('states.mixed.behavior'))},
  { label: tContent('states.subOpen.label'),  trigger: toPlainText(tContent('states.subOpen.trigger')),  behavior: toPlainText(tContent('states.subOpen.behavior'))},
]);

const propCols = computed(() => ({
  prop:        tContent('props.table.prop'),
  type:        tContent('props.table.type'),
  default:     tContent('props.table.default'),
  required:    tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

// As tabelas trazem só o que ESTA stack tem, com o nome que se escreve aqui:
// evento é `@update:checked`, não `onCheckedChange`; e a coluna Padrão é o valor
// real da reka-ui. Prop sem descrição no conteúdo compartilhado (`dir`,
// `pressOpenDelay`, `loop`, `textValue`) fica no bloco de interface abaixo, e
// não ganha frase escrita à mão — que ficaria em português nos três idiomas.
const yes = computed(() => tNav('common.yes'));
const no = computed(() => tNav('common.no'));

// `modal` nasce ligado na reka (`ContextMenuRoot`), e aqui ele quer dizer véu e
// trava de rolagem — não prende o foco (D1).
const rootPropItems = computed(() => [
  { name: 'modal',        type: 'boolean', defaultValue: 'true', required: no.value, description: stripHtml(tContent('props.items.modal')) },
  { name: '@update:open', type: "(open: boolean, reason?: 'escape' | 'overlay' | 'api') => void", defaultValue: '—', required: no.value, description: stripHtml(tContent('props.items.onOpenChange')) },
]);

// `side`, `sideOffset` e `align` não estão aqui porque não são props nesta
// stack: o `ContextMenuContent` da reka os fixa em direita, 2 e início.
const contentPropItems = computed(() => [
  { name: 'alignOffset', type: 'number', defaultValue: '0', required: no.value, description: stripHtml(tContent('props.items.alignOffset')) },
]);

const itemPropItems = computed(() => [
  { name: 'variant',  type: "'default' | 'destructive'", defaultValue: "'default'", required: no.value, description: stripHtml(tContent('props.items.variant'))  },
  { name: 'inset',    type: 'boolean',                   defaultValue: 'false',     required: no.value, description: stripHtml(tContent('props.items.inset'))    },
  { name: 'disabled', type: 'boolean',                   defaultValue: 'false',     required: no.value, description: stripHtml(tContent('props.items.disabled')) },
  { name: '@select',  type: '(event: Event) => void',    defaultValue: '—',         required: no.value, description: stripHtml(tContent('props.items.onSelect')) },
]);

// Sem `inset`: a folha não tem regra de recuo para item de marcação nem de
// rádio — a pista do indicador é quem alinha —, então a prop não existe aqui.
const checkboxItemPropItems = computed(() => [
  { name: 'checked',         type: "boolean | 'indeterminate'", defaultValue: 'false', required: no.value, description: stripHtml(tContent('props.items.checked'))         },
  { name: '@update:checked', type: '(value: boolean) => void',  defaultValue: '—',     required: no.value, description: stripHtml(tContent('props.items.onCheckedChange')) },
  { name: 'disabled',        type: 'boolean',                   defaultValue: 'false', required: no.value, description: stripHtml(tContent('props.items.disabled'))        },
]);

const radioGroupPropItems = computed(() => [
  { name: 'modelValue',          type: 'string',                  defaultValue: '—', required: no.value, description: stripHtml(tContent('props.items.modelValue')) },
  { name: '@update:model-value', type: '(value: string) => void', defaultValue: '—', required: no.value, description: stripHtml(tContent('props.items.onValueChange')) },
]);

const radioItemPropItems = computed(() => [
  { name: 'value',    type: 'string',  defaultValue: '—',     required: yes.value, description: stripHtml(tContent('props.items.value'))    },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', required: no.value,  description: stripHtml(tContent('props.items.disabled')) },
]);

const labelPropItems = computed(() => [
  { name: 'inset', type: 'boolean', defaultValue: 'false', required: no.value, description: stripHtml(tContent('props.items.inset')) },
]);

// A coluna do meio é "Classe .nds-*" e trazia nome de utilitária do Tailwind —
// vocabulário morto desde a migração. Cada linha aponta agora o seletor que o
// CSS realmente usa, e cada token foi medido no navegador: só `--elevation-md`
// muda a sombra (`--shadow` e `--shadow-md` não movem nada), o separador é
// `--muted` e não `--border`, e o raio do item é `--radius-sm`, não `--radius`.
const tokenRows = computed(() => [
  { token: '--popover',             value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.popoverBg')        },
  { token: '--popover-foreground',  value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.popoverFg')        },
  { token: '--accent',              value: '.nds-dropdown-menu-item',       description: tContent('tokens.table.accentBg')         },
  { token: '--accent-foreground',   value: '.nds-dropdown-menu-item',       description: tContent('tokens.table.accentFg')         },
  { token: '--destructive',         value: '[data-variant="destructive"]',  description: tContent('tokens.table.destructive')      },
  { token: '--destructive',         value: '.nds-dropdown-menu-item[data-variant="destructive"]:focus', description: tContent('tokens.table.destructiveFocus') },
  { token: '--muted-foreground',    value: '.nds-dropdown-menu-shortcut',   description: tContent('tokens.table.mutedFg')          },
  { token: '--muted-foreground',    value: '.nds-dropdown-menu-label',      description: tContent('tokens.table.mutedFgLabel')     },
  { token: '--muted',               value: '.nds-dropdown-menu-separator',  description: tContent('tokens.table.border')           },
  { token: '--border',              value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.popupBorder')      },
  { token: '--elevation-md',        value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.shadow')           },
  { token: '--radius',              value: '.nds-dropdown-menu-content',    description: tContent('tokens.table.radius')           },
  { token: '--radius-sm',           value: '.nds-dropdown-menu-item',       description: tContent('tokens.table.radiusItem')       },
  { token: '--z-popover',           value: '.nds-dropdown-menu-positioner', description: tContent('tokens.table.zIndex')           },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.warning'),
  tContent('accessibility.aria.roleMenu'),
  tContent('accessibility.aria.roleMenuItem'),
  tContent('accessibility.aria.roleMenuitemCheckbox'),
  tContent('accessibility.aria.roleMenuitemRadio'),
  tContent('accessibility.aria.ariaChecked'),
  tContent('accessibility.aria.ariaDisabled'),
  tContent('accessibility.aria.ariaHaspopup'),
  tContent('accessibility.aria.ariaExpanded'),
]);

const keyboardItems = computed(() => [
  { key: 'Right-click / Menu / Shift+F10', description: tContent('accessibility.keyboard.rightClick') },
  { key: 'Arrow Down',  description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'Arrow Up',    description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'Arrow Right', description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'Arrow Left',  description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'Home / End',  description: tContent('accessibility.keyboard.homeEnd')    },
  { key: 'A–Z',         description: tContent('accessibility.keyboard.typeahead')  },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')      },
  { key: 'Esc',         description: tContent('accessibility.keyboard.escape')     },
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
]);

const relatedItems = computed(() => [
  { name: 'DropdownMenu', description: toPlainText(tContent('related.dropdownMenu')), path: '?path=/docs/components-overlay-dropdownmenu--docs' },
  { name: 'Menubar',      description: toPlainText(tContent('related.menubar')),      path: '?path=/docs/components-navigation-menubar--docs'      },
  { name: 'Dialog',       description: toPlainText(tContent('related.dialog')),       path: '?path=/docs/components-overlay-dialog--docs'       },
  { name: 'AlertDialog',  description: toPlainText(tContent('related.alertDialog')),  path: '?path=/docs/components-overlay-alertdialog--docs'  },
  { name: 'Tooltip',      description: toPlainText(tContent('related.tooltip')),      path: '?path=/docs/components-overlay-tooltip--docs'      },
]);

const noteItems = computed(() =>
  stringsFromDict(tContent, 'notes', 'tip').map(content => ({ title: '', content })),
);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.menuOpen'),     trigger: toPlainText(tContent('analytics.table.menuOpenTrigger')),     payload: tContent('analytics.table.menuOpenPayload')     },
  { event: tContent('analytics.table.itemClick'),    trigger: toPlainText(tContent('analytics.table.itemClickTrigger')),    payload: tContent('analytics.table.itemClickPayload')    },
  { event: tContent('analytics.table.close'),        trigger: toPlainText(tContent('analytics.table.closeTrigger')),        payload: tContent('analytics.table.closePayload')        },
  { event: tContent('analytics.table.pageView'),     trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),     payload: tContent('analytics.table.pageViewPayload')     },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),   trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),   payload: tContent('analytics.table.langSwitchPayload')   },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() =>
  entriesFromDict(tContent, 'testes.functional', ['action', 'result', 'priority']).map(entry => ({
    ...entry,
    priority: localPriority(entry.priority),
  })),
);

const a11yTestItems = computed(() =>
  stringsFromDict(tContent, 'testes.accessibility').map((criterion, i) => ({
    criterion,
    level: a11yTestLevels[i] ?? 'AA',
    how: a11yTestHow[i] ?? 'axe-core',
  })),
);

const visualTestItems = computed(() =>
  entriesFromDict(tContent, 'testes.visual', ['story', 'priority']).map(entry => ({
    ...entry,
    priority: localPriority(entry.priority),
  })),
);

// ─── Variantes — estado das prévias de marcação e de rádio ─────────────────────
// Os mesmos valores iniciais que o trecho de código ao lado declara.
const variantShowGrid   = ref(SHOW_GRID_INITIAL);
const variantShowRulers = ref(SHOW_RULERS_INITIAL);
const variantLayout     = ref(LAYOUT_INITIAL);

</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="context-menu"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!--
      ── Demonstração ───────────────────────────────────────────────────────
      Sem grupo em volta das ações: grupo sem rótulo não tem nome, e a lib
      escreve nele um `aria-labelledby` para um id que não existe. O Vanilla,
      que é a referência, só abre grupo onde há rótulo.
    -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-cluster nds-w-full nds-p-8"
        data-align="center"
        data-justify="center"
      >
        <ContextMenu @update:open="openChange.demo">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('demo', 'docs_demo', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('demo', 'docs_demo', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem @select="trackItemSelect('demo', 'docs_demo', 'share-email')">
                  {{ tContent('demonstration.labels.shareEmail') }}
                </ContextMenuItem>
                <ContextMenuItem @select="trackItemSelect('demo', 'docs_demo', 'share-link')">
                  {{ tContent('demonstration.labels.shareLink') }}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              @select="trackItemSelect('demo', 'docs_demo', 'delete')"
            >
              {{ tContent('demonstration.labels.delete') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.deleteShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="usageGuidelines"
      :scenarios="usageScenarios"
      :do="usageDo"
      :dont="usageDont"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair3.do')), dontCaption: toPlainText(tContent('doDont.pair3.dont')) },
      ]"
    >
      <!--
        Par 1: alternativa explícita.

        A legenda promete "as mesmas ações também via botão visível", então o
        lado do faça DESENHA o botão — anunciá-lo por escrito era contar, não
        mostrar. Os dois lados levam o MESMO menu — Editar e Excluir, sem linha
        entre eles: o que muda entre os lados é só a alternativa visível, que é o
        assunto do par. O separador antes do destrutivo é assunto do par 2.
      -->
      <template #do-preview-0>
        <div
          class="nds-stack"
          data-spacing="sm"
          data-align="center"
        >
          <ContextMenu @update:open="openChange.pair1Do">
            <ContextMenuTrigger
              :class="areaClasse"
              data-align="center"
              data-justify="center"
            >
              {{ tContent('demonstration.labels.triggerLabel') }}
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem @select="trackItemSelect('pair1-do', 'docs_do_dont', 'edit')">
                {{ tContent('demonstration.labels.edit') }}
              </ContextMenuItem>
              <ContextMenuItem
                variant="destructive"
                @select="trackItemSelect('pair1-do', 'docs_do_dont', 'delete')"
              >
                {{ tContent('demonstration.labels.delete') }}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <!-- A MESMA ação do menu, alcançável sem o botão direito. -->
          <Button
            variant="outline"
            size="sm"
          >
            {{ tContent('demonstration.labels.edit') }}
          </Button>
        </div>
      </template>
      <template #dont-preview-0>
        <ContextMenu @update:open="openChange.pair1Dont">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('pair1-dont', 'docs_do_dont', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              @select="trackItemSelect('pair1-dont', 'docs_do_dont', 'delete')"
            >
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!--
        Par 2: o item destrutivo.

        À esquerda, na variante destrutiva e separado dos demais por uma linha;
        à direita, o MESMO item na variante padrão, no meio da lista — com a
        aparência das ações inofensivas e ao alcance de um deslize da seta. As
        duas metades da legenda falam disso, e é isso que as prévias desenham.
      -->
      <template #do-preview-1>
        <ContextMenu @update:open="openChange.pair2Do">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('pair2-do', 'docs_do_dont', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('pair2-do', 'docs_do_dont', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              @select="trackItemSelect('pair2-do', 'docs_do_dont', 'delete')"
            >
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <template #dont-preview-1>
        <ContextMenu @update:open="openChange.pair2Dont">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('pair2-dont', 'docs_do_dont', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('pair2-dont', 'docs_do_dont', 'delete')">
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('pair2-dont', 'docs_do_dont', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!--
        Par 3: dica visual de que a área tem menu de contexto.

        Os dois lados montam o MESMO menu; o que os separa é a DICA VISUAL, que
        é o assunto da legenda: à esquerda a moldura tracejada da constante
        compartilhada e a linha que diz o gesto; à direita a mesma área SEM
        moldura e sem aviso — o menu existe e ninguém tem como saber.
      -->
      <template #do-preview-2>
        <ContextMenu @update:open="openChange.pair3Do">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('pair3-do', 'docs_do_dont', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('pair3-do', 'docs_do_dont', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
      <template #dont-preview-2>
        <ContextMenu @update:open="openChange.pair3Dont">
          <ContextMenuTrigger
            :class="areaSemDicaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.areaNoHint') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('pair3-dont', 'docs_do_dont', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('pair3-dont', 'docs_do_dont', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withCheckbox')"
      :secondary-code="codeImportWithCheckbox"
    />

    <!-- ── Variantes ────────────────────────────────────────────────────────── -->
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :note="tContent('variants.note')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="context-menu"
      :items="variantItems"
    >
      <!-- default -->
      <template #variant-preview-0>
        <ContextMenu @update:open="openChange.default">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('default', 'docs_variantes', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('default', 'docs_variantes', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- destructive -->
      <template #variant-preview-1>
        <ContextMenu @update:open="openChange.destructive">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('destructive', 'docs_variantes', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              @select="trackItemSelect('destructive', 'docs_variantes', 'delete')"
            >
              {{ tContent('demonstration.labels.delete') }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- label: o rótulo dentro do grupo, que o usa como nome -->
      <template #variant-preview-2>
        <ContextMenu @update:open="openChange.label">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel inset>
                {{ tContent('demonstration.labels.groupActions') }}
              </ContextMenuLabel>
              <ContextMenuItem
                inset
                @select="trackItemSelect('label', 'docs_variantes', 'edit')"
              >
                {{ tContent('demonstration.labels.edit') }}
              </ContextMenuItem>
              <ContextMenuItem
                inset
                @select="trackItemSelect('label', 'docs_variantes', 'duplicate')"
              >
                {{ tContent('demonstration.labels.duplicate') }}
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withCheckbox -->
      <template #variant-preview-3>
        <ContextMenu @update:open="openChange.withCheckbox">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>
                {{ tContent('demonstration.labels.groupView') }}
              </ContextMenuLabel>
              <ContextMenuCheckboxItem
                v-model:checked="variantShowGrid"
                @select="trackItemSelect('with-checkbox', 'docs_variantes', 'show-grid')"
              >
                {{ tContent('demonstration.labels.showGrid') }}
              </ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem
                v-model:checked="variantShowRulers"
                @select="trackItemSelect('with-checkbox', 'docs_variantes', 'show-rulers')"
              >
                {{ tContent('demonstration.labels.showRulers') }}
              </ContextMenuCheckboxItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!--
        withRadio: UM grupo só — o de rádio, nomeado pelo rótulo que mora dentro
        dele. O grupo de rádio já é um grupo por baixo; um grupo comum em volta
        criaria o segundo, e o de dentro ficaria com `aria-labelledby` para um id
        que não existe.
      -->
      <template #variant-preview-4>
        <ContextMenu @update:open="openChange.withRadio">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup v-model="variantLayout">
              <ContextMenuLabel>
                {{ tContent('demonstration.labels.groupLayout') }}
              </ContextMenuLabel>
              <ContextMenuRadioItem
                value="grid"
                @select="trackItemSelect('with-radio', 'docs_variantes', 'layout-grid')"
              >
                {{ tContent('demonstration.labels.layoutGrid') }}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                value="list"
                @select="trackItemSelect('with-radio', 'docs_variantes', 'layout-list')"
              >
                {{ tContent('demonstration.labels.layoutList') }}
              </ContextMenuRadioItem>
              <ContextMenuRadioItem
                value="columns"
                @select="trackItemSelect('with-radio', 'docs_variantes', 'layout-columns')"
              >
                {{ tContent('demonstration.labels.layoutColumns') }}
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withSubmenu -->
      <template #variant-preview-5>
        <ContextMenu @update:open="openChange.withSubmenu">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('with-submenu', 'docs_variantes', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('with-submenu', 'docs_variantes', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>{{ tContent('demonstration.labels.share') }}</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem @select="trackItemSelect('with-submenu', 'docs_variantes', 'share-email')">
                  {{ tContent('demonstration.labels.shareEmail') }}
                </ContextMenuItem>
                <ContextMenuItem @select="trackItemSelect('with-submenu', 'docs_variantes', 'share-link')">
                  {{ tContent('demonstration.labels.shareLink') }}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </template>

      <!-- withShortcuts -->
      <template #variant-preview-6>
        <ContextMenu @update:open="openChange.withShortcuts">
          <ContextMenuTrigger
            :class="areaClasse"
            data-align="center"
            data-justify="center"
          >
            {{ tContent('demonstration.labels.triggerLabel') }}
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @select="trackItemSelect('with-shortcuts', 'docs_variantes', 'edit')">
              {{ tContent('demonstration.labels.edit') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.editShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem @select="trackItemSelect('with-shortcuts', 'docs_variantes', 'duplicate')">
              {{ tContent('demonstration.labels.duplicate') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.duplicateShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              @select="trackItemSelect('with-shortcuts', 'docs_variantes', 'delete')"
            >
              {{ tContent('demonstration.labels.delete') }}
              <ContextMenuShortcut>{{ tContent('demonstration.labels.deleteShortcut') }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.rootTitle'), cols: propCols, items: rootPropItems },
        { title: tContent('props.contentTitle'), cols: propCols, items: contentPropItems },
        { title: tContent('props.itemTitle'), cols: propCols, items: itemPropItems },
        { title: tContent('props.checkboxItemTitle'), cols: propCols, items: checkboxItemPropItems },
        { title: tContent('props.radioGroupTitle'), cols: propCols, items: radioGroupPropItems },
        { title: tContent('props.radioItemTitle'), cols: propCols, items: radioItemPropItems },
        { title: tContent('props.labelTitle'), cols: propCols, items: labelPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="tContent('tokens.customizationCode')"
    />

    <!-- ── Acessibilidade ───────────────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ────────────────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: {
          action: tNav('common.userAction'),
          result: tNav('common.expectedResult'),
          priority: tNav('common.priority'),
        },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
