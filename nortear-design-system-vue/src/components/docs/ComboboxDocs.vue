<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxSeparator,
  ComboboxTrigger,
} from '@/components/ui/combobox';

import { Button } from '@/components/ui/button';

import DocsPageLayout    from '@/components/docs/shared/sections/DocsPageLayout.vue';
import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
import DocsStates        from '@/components/docs/shared/sections/DocsStates.vue';
import DocsProps         from '@/components/docs/shared/sections/DocsProps.vue';
import DocsTokens        from '@/components/docs/shared/sections/DocsTokens.vue';
import DocsAccessibility from '@/components/docs/shared/sections/DocsAccessibility.vue';
import DocsRelated       from '@/components/docs/shared/sections/DocsRelated.vue';
import DocsNotes         from '@/components/docs/shared/sections/DocsNotes.vue';
import DocsAnalytics     from '@/components/docs/shared/sections/DocsAnalytics.vue';
import DocsTestes        from '@/components/docs/shared/sections/DocsTestes.vue';

import uiTranslations from '@/i18n/ui.json';
import comboboxTranslations from '@shared/content/combobox/translations.json';
import { stripHtml, toPlainText } from '@/lib/strip-html';
import {
  comboboxGroupedSource,
  comboboxInFormSource,
  comboboxMultipleSource,
  comboboxSource,
} from '@/components/ui/combobox/combobox.source';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
// O idioma sai do próprio `useTranslation`, nunca de uma store: ler o locale de
// outro lugar já derrubou esta página em produção.
const { t: tContent, locale } = useTranslation(comboboxTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (comboboxTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'common.high',
  medium: 'common.medium',
  low: 'common.low',
};

function localPriority(raw: string): string {
  return tNav(priorityKeyMap[raw] ?? 'common.high');
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'combobox',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'combobox',
    locale: newLocale,
    page_title: tContent('seo.title'),
  });
}, { immediate: true });

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tNav('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tNav('nav.demonstration') },
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')       },
      { id: 'variantes',    label: tNav('nav.variants')     },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')       },
      { id: 'propriedades', label: tNav('nav.props')        },
      { id: 'tokens',       label: tNav('nav.tokens')       },
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
    component_name: 'combobox',
    locale: locale.value,
  });
});

// ─── Demo state ───────────────────────────────────────────────────────────────

const countries = computed(() => [
  { value: 'brasil',    label: tContent('demonstration.labels.brazil')    },
  { value: 'argentina', label: tContent('demonstration.labels.argentina') },
  { value: 'chile',     label: tContent('demonstration.labels.chile')     },
  { value: 'colombia',  label: tContent('demonstration.labels.colombia')  },
  { value: 'mexico',    label: tContent('demonstration.labels.mexico')    },
  { value: 'peru',      label: tContent('demonstration.labels.peru')      },
  { value: 'portugal',  label: tContent('demonstration.labels.portugal')  },
  { value: 'espanha',   label: tContent('demonstration.labels.spain')     },
  { value: 'uruguai',   label: tContent('demonstration.labels.uruguay')   },
]);

const fruits = computed(() => [
  { value: 'maca',    label: tContent('demonstration.labels.apple')  },
  { value: 'banana',  label: tContent('demonstration.labels.banana') },
  { value: 'laranja', label: tContent('demonstration.labels.orange') },
]);

const vegetables = computed(() => [
  { value: 'cenoura',   label: tContent('demonstration.labels.carrot')   },
  { value: 'batata',    label: tContent('demonstration.labels.potato')   },
  { value: 'abobrinha', label: tContent('demonstration.labels.zucchini') },
]);

const country = ref('');
const chosen = ref<string[]>(['brasil', 'argentina']);
const ingredient = ref('');

// Os chips saem do MESMO valor que a raiz guarda — a página de docs é o
// primeiro consumidor real deste componente, e monta os chips como qualquer
// outro consumiria.
const chips = computed(() =>
  chosen.value.flatMap(value => countries.value.filter(item => item.value === value)),
);

// Cada cartão de Variantes e de Composições tem o PRÓPRIO estado. A seção
// Demonstração mostra os mesmos campos, e um `ref` partilhado faria mexer num
// cartão mover outro do outro lado da página, sem que o leitor entendesse por
// quê.
const variantCountry = ref('');
const variantChosen = ref<string[]>(['brasil', 'argentina']);
const variantIngredient = ref('');
const formCountry = ref('');

const variantChips = computed(() =>
  variantChosen.value.flatMap(value => countries.value.filter(item => item.value === value)),
);

function removeLabelOf(label: string): string {
  return `${tContent('demonstration.labels.remove')} ${label}`;
}

// O que a região viva anuncia DEPOIS de remover. Sem isto ela repetia o nome do
// botão — o comando, não o fato — e em `en`/`es` falaria português.
function removedAnnouncementOf(label: string): string {
  return `${label} ${tContent('demonstration.labels.removed')}`;
}

// O payload carrega o VALOR, que é estável, e nunca o rótulo, que é traduzido:
// o mesmo evento sairia como três no GA4, um por idioma.
//
// A assinatura é a que a raiz emite — um valor que pode ser lista, número ou
// nulo. Estreitar aqui, e não no `emit`, é o que deixa o binding compilar sem
// mentir sobre o que chega.
function onCountryChange(value: unknown): void {
  track('option_select', {
    component: 'combobox',
    field_name: 'pais',
    value: typeof value === 'string' ? value : '',
    location: 'demonstracao',
  });
}

let previousChosen = chosen.value.length;

function onChosenChange(raw: unknown): void {
  const values = Array.isArray(raw) ? raw.map(String) : [];
  const added = values.length > previousChosen;
  previousChosen = values.length;
  if (added) {
    track('option_select', {
      component: 'combobox',
      field_name: 'paises',
      value: values[values.length - 1],
      location: 'demonstracao',
    });
    return;
  }
  // Sair de um chip ou limpar o campo é mudança do campo, não escolha.
  track('field_change', {
    component: 'combobox',
    field_name: 'paises',
    value: String(values.length),
    location: 'demonstracao',
  });
}

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImport = `import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxIcon,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxLabel,
  ComboboxList,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/components/ui/combobox";`;

const interfaceCode = `// A opção como o filtro a enxerga
interface ComboboxFilterItem {
  value: string;
  label: string;
  disabled?: boolean;
}

// Combobox (raiz — dona do valor, do texto e do aberto/fechado)
interface ComboboxProps {
  modelValue?: string | string[];
  defaultValue?: string | string[];
  inputValue?: string;                 // v-model:input-value
  multiple?: boolean;
  disabled?: boolean;
  name?: string;
  chipsLayout?: 'wrap' | 'single-line';   // sai como data-chips no wrapper
  filter?: (item: ComboboxFilterItem, query: string) => boolean;
  ignoreFilter?: boolean;              // desliga o filtro sem substituí-lo
  class?: string;
}

// ComboboxInput (campo de texto — o texto em si é da raiz)
interface ComboboxInputProps {
  displayValue?: (value: unknown) => string;
  class?: string;
}

// ComboboxItem (uma opção)
interface ComboboxItemProps {
  value: string;
  textValue?: string;
  disabled?: boolean;
  class?: string;
}

// ComboboxChip (um escolhido, no modo múltiplo)
interface ComboboxChipProps {
  value: string;
  class?: string;
}`;

const codeSingle = comboboxSource('', { args: {} });
const codeMultiple = comboboxMultipleSource();
const codeGrouped = comboboxGroupedSource();
const codeInForm = comboboxInFormSource();

const codeCustomization = tContent('tokens.customizationCode');

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
  tContent('anatomy.item7'),
  tContent('anatomy.item8'),
  tContent('anatomy.item9'),
  tContent('anatomy.item10'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.single'),   description: stripHtml(tContent('variants.styles.single')),   code: codeSingle,   trackId: 'single'   },
  { name: tContent('variants.items.multiple'), description: stripHtml(tContent('variants.styles.multiple')), code: codeMultiple, trackId: 'multiple' },
  { name: tContent('variants.items.grouped'),  description: stripHtml(tContent('variants.styles.grouped')),  code: codeGrouped,  trackId: 'grouped'  },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.inForm.name'),
    description: tContent('variants.compositions.inForm.description'),
    useWhen: tContent('variants.compositions.inForm.use'),
    code: codeInForm,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),   trigger: toPlainText(tContent('states.default.trigger')),   behavior: toPlainText(tContent('states.default.behavior'))   },
  { label: tContent('states.open.label'),      trigger: toPlainText(tContent('states.open.trigger')),      behavior: toPlainText(tContent('states.open.behavior'))      },
  { label: tContent('states.filtering.label'), trigger: toPlainText(tContent('states.filtering.trigger')), behavior: toPlainText(tContent('states.filtering.behavior')) },
  { label: tContent('states.selected.label'),  trigger: toPlainText(tContent('states.selected.trigger')),  behavior: toPlainText(tContent('states.selected.behavior'))  },
  { label: tContent('states.focus.label'),     trigger: toPlainText(tContent('states.focus.trigger')),     behavior: toPlainText(tContent('states.focus.behavior'))     },
  { label: tContent('states.empty.label'),     trigger: toPlainText(tContent('states.empty.trigger')),     behavior: toPlainText(tContent('states.empty.behavior'))     },
  { label: tContent('states.disabled.label'),  trigger: toPlainText(tContent('states.disabled.trigger')),  behavior: toPlainText(tContent('states.disabled.behavior'))  },
  { label: tContent('states.invalid.label'),   trigger: toPlainText(tContent('states.invalid.trigger')),   behavior: toPlainText(tContent('states.invalid.behavior'))   },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

// Os nomes de prop são os DESTA stack; as descrições vêm do conteúdo
// compartilhado, que é escrito sem citar API de lib nenhuma.
const rootPropItems = computed(() => [
  { name: 'modelValue',            type: 'string | string[]',                  defaultValue: '—',     required: tNav('common.no'), description: toPlainText(tContent('props.table.value.description'))            },
  { name: 'defaultValue',          type: 'string | string[]',                  defaultValue: '—',     required: tNav('common.no'), description: toPlainText(tContent('props.table.defaultValue.description'))     },
  { name: 'onUpdate:modelValue',   type: '(value: string | string[]) => void', defaultValue: '—',     required: tNav('common.no'), description: toPlainText(tContent('props.table.onValueChange.description'))    },
  { name: 'multiple',              type: 'boolean',                            defaultValue: 'false', required: tNav('common.no'), description: toPlainText(tContent('props.table.multiple.description'))        },
  { name: 'disabled',              type: 'boolean',                            defaultValue: 'false', required: tNav('common.no'), description: toPlainText(tContent('props.table.disabled.description'))        },
  { name: 'name',                  type: 'string',                             defaultValue: '—',     required: tNav('common.no'), description: toPlainText(tContent('props.table.name.description'))            },
  // Companheira de `multiple`: é a mesma decisão de quem liga os chips, e por
  // isso mora na raiz — o wrapper só recebe o `data-chips` que ela produz.
  { name: 'chipsLayout',           type: `'wrap' | 'single-line'`,             defaultValue: `'wrap'`, required: tNav('common.no'), description: toPlainText(tContent('props.table.chipsLayout.description'))    },
  // O texto de busca e o filtro moram na RAIZ desta stack: as duas coisas são
  // lidas por mais de uma peça, e a raiz é a única que todas alcançam.
  { name: 'inputValue',            type: 'string',                             defaultValue: '—',     required: tNav('common.no'), description: toPlainText(tContent('props.table.inputValue.description'))       },
  { name: 'onUpdate:inputValue',   type: '(text: string) => void',             defaultValue: '—',     required: tNav('common.no'), description: toPlainText(tContent('props.table.onInputValueChange.description')) },
  { name: 'filter',                type: '(item: ComboboxFilterItem, query: string) => boolean', defaultValue: '—', required: tNav('common.no'), description: toPlainText(tContent('props.table.filter.description')) },
]);

const inputPropItems = computed(() => [
  { name: 'placeholder',         type: 'string',                     defaultValue: '—', required: tNav('common.no'), description: toPlainText(tContent('props.table.placeholder.description'))          },
  { name: 'displayValue',        type: '(value: unknown) => string', defaultValue: '—', required: tNav('common.no'), description: toPlainText(tContent('props.table.items.description'))               },
]);

// A coluna do meio traz SELETOR REAL, lido de
// `docs/shared/styles/nds/combobox.css`.
const tokenRows = computed(() => [
  { token: '--input',                value: tContent('tokens.table.input.class'),               description: toPlainText(tContent('tokens.table.input.part'))               },
  { token: '--input-background',     value: tContent('tokens.table.inputBackground.class'),     description: toPlainText(tContent('tokens.table.inputBackground.part'))     },
  { token: '--foreground',           value: tContent('tokens.table.foreground.class'),          description: toPlainText(tContent('tokens.table.foreground.part'))          },
  { token: '--muted-foreground',     value: tContent('tokens.table.mutedForeground.class'),     description: toPlainText(tContent('tokens.table.mutedForeground.part'))     },
  { token: '--muted',                value: tContent('tokens.table.muted.class'),               description: toPlainText(tContent('tokens.table.muted.part'))               },
  { token: '--secondary',            value: tContent('tokens.table.secondary.class'),           description: toPlainText(tContent('tokens.table.secondary.part'))           },
  { token: '--secondary-foreground', value: tContent('tokens.table.secondaryForeground.class'), description: toPlainText(tContent('tokens.table.secondaryForeground.part')) },
  { token: '--popover',              value: tContent('tokens.table.popover.class'),             description: toPlainText(tContent('tokens.table.popover.part'))             },
  { token: '--popover-foreground',   value: tContent('tokens.table.popoverForeground.class'),   description: toPlainText(tContent('tokens.table.popoverForeground.part'))   },
  { token: '--accent',               value: tContent('tokens.table.accent.class'),              description: toPlainText(tContent('tokens.table.accent.part'))              },
  { token: '--accent-foreground',    value: tContent('tokens.table.accentForeground.class'),    description: toPlainText(tContent('tokens.table.accentForeground.part'))    },
  { token: '--primary',              value: tContent('tokens.table.primary.class'),             description: toPlainText(tContent('tokens.table.primary.part'))             },
  { token: '--border',               value: tContent('tokens.table.border.class'),              description: toPlainText(tContent('tokens.table.border.part'))              },
  { token: '--ring',                 value: tContent('tokens.table.ring.class'),                description: toPlainText(tContent('tokens.table.ring.part'))                },
  { token: '--destructive',          value: tContent('tokens.table.destructive.class'),         description: toPlainText(tContent('tokens.table.destructive.part'))         },
  { token: '--radius',               value: tContent('tokens.table.radius.class'),              description: toPlainText(tContent('tokens.table.radius.part'))              },
  { token: '--radius-full',          value: tContent('tokens.table.radiusFull.class'),          description: toPlainText(tContent('tokens.table.radiusFull.part'))          },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
  tContent('accessibility.items.item7'),
]);

// A tabela de teclado escreve textNode: sem `toPlainText` o `<code>` chegaria
// literal à tela.
const keyboardItems = computed(() => [
  { key: 'A-Z',        description: toPlainText(tContent('accessibility.keyboard.typing'))    },
  { key: 'Arrow Down', description: toPlainText(tContent('accessibility.keyboard.arrowDown')) },
  { key: 'Arrow Up',   description: toPlainText(tContent('accessibility.keyboard.arrowUp'))   },
  { key: 'Enter',      description: toPlainText(tContent('accessibility.keyboard.enter'))     },
  { key: 'Escape',     description: toPlainText(tContent('accessibility.keyboard.escape'))    },
  { key: 'Tab',        description: toPlainText(tContent('accessibility.keyboard.tab'))       },
  { key: 'Backspace',  description: toPlainText(tContent('accessibility.keyboard.backspace')) },
  { key: 'Home',       description: toPlainText(tContent('accessibility.keyboard.home'))      },
  { key: 'End',        description: toPlainText(tContent('accessibility.keyboard.end'))       },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.select.name'),  description: toPlainText(tContent('related.items.select.description')),  path: '?path=/docs/primitives-form-select--docs'  },
  { name: tContent('related.items.command.name'), description: toPlainText(tContent('related.items.command.description')), path: '?path=/docs/primitives-overlay-command--docs' },
  { name: tContent('related.items.input.name'),   description: toPlainText(tContent('related.items.input.description')),   path: '?path=/docs/primitives-form-input--docs'   },
  { name: tContent('related.items.form.name'),    description: toPlainText(tContent('related.items.form.description')),    path: '?path=/docs/primitives-form-form--docs'    },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
  { title: '', content: tContent('notes.item6') },
]);

const analyticsItems = computed(() => [
  { event: 'option_select', trigger: toPlainText(tContent('analytics.table.option_select.trigger')), payload: tContent('analytics.table.option_select.payload') },
  { event: 'field_change',  trigger: toPlainText(tContent('analytics.table.field_change.trigger')),  payload: tContent('analytics.table.field_change.payload')  },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: tContent('testes.functional.item5.result'), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: tContent('testes.functional.item6.result'), priority: localPriority(tContent('testes.functional.item6.priority')) },
  { action: tContent('testes.functional.item7.action'), result: tContent('testes.functional.item7.result'), priority: localPriority(tContent('testes.functional.item7.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'WCAG 2.2', how: 'axe-core'        },
  { criterion: tContent('testes.accessibility.item2'), level: 'WCAG 2.2', how: 'axe-core'        },
  { criterion: tContent('testes.accessibility.item3'), level: 'WCAG 2.2', how: 'play function'   },
  { criterion: tContent('testes.accessibility.item4'), level: 'WCAG 2.2', how: 'play function'   },
  { criterion: tContent('testes.accessibility.item5'), level: 'WCAG 2.2', how: 'play function'   },
  { criterion: tContent('testes.accessibility.item6'), level: 'WCAG 2.2', how: 'play function'   },
  { criterion: tContent('testes.accessibility.item7'), level: 'WCAG 2.2', how: 'play function'   },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
  { story: tContent('testes.visual.item6.story'), priority: localPriority(tContent('testes.visual.item6.priority')) },
  { story: tContent('testes.visual.item7.story'), priority: localPriority(tContent('testes.visual.item7.priority')) },
]);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="combobox"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-w-full nds-stack"
        data-spacing="xl"
      >
        <div class="nds-w-xs">
          <Combobox
            v-model="country"
            name="pais"
            @update:model-value="onCountryChange"
          >
            <ComboboxLabel>{{ tContent('demonstration.labels.countryLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxInput :placeholder="tContent('demonstration.labels.countryPlaceholder')" />
              <ComboboxClear :aria-label="tContent('demonstration.labels.clear')" />
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxItem
                    v-for="option in countries"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
        </div>

        <div class="nds-w-xs">
          <Combobox
            v-model="chosen"
            multiple
            name="paises"
            @update:model-value="onChosenChange"
          >
            <ComboboxLabel>{{ tContent('demonstration.labels.countriesLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxChips>
                <ComboboxChip
                  v-for="item in chips"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                  <ComboboxChipRemove :aria-label="removeLabelOf(item.label)" :removed-announcement="removedAnnouncementOf(item.label)" />
                </ComboboxChip>
                <!-- O texto mora DENTRO da caixa de chips: é ela que quebra ou
                     rola, e é o que faz o cursor continuar depois do último
                     chip. Limpar e gatilho ficam de fora, na primeira linha. -->
                <ComboboxInput :placeholder="tContent('demonstration.labels.countriesPlaceholder')" />
              </ComboboxChips>
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxItem
                    v-for="item in countries"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
        </div>

        <div class="nds-w-xs">
          <Combobox v-model="ingredient">
            <ComboboxLabel>{{ tContent('demonstration.labels.groupedLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxInput :placeholder="tContent('demonstration.labels.groupedPlaceholder')" />
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxGroup>
                    <ComboboxGroupLabel>{{ tContent('demonstration.labels.groupFruits') }}</ComboboxGroupLabel>
                    <ComboboxItem
                      v-for="item in fruits"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                      <ComboboxItemIndicator />
                    </ComboboxItem>
                  </ComboboxGroup>
                  <ComboboxSeparator />
                  <ComboboxGroup>
                    <ComboboxGroupLabel>{{ tContent('demonstration.labels.groupVegetables') }}</ComboboxGroupLabel>
                    <ComboboxItem
                      v-for="item in vegetables"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                      <ComboboxItemIndicator />
                    </ComboboxItem>
                  </ComboboxGroup>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
        </div>
      </div>
    </DocsDemonstration>

    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
          tContent('usage.guidelines.item5'),
          tContent('usage.guidelines.item6'),
          tContent('usage.guidelines.item7'),
        ],
      }"
      :scenarios="{
        title: tContent('usage.scenarios.title'),
        cols: {
          scenario: tContent('usage.scenarios.cols.scenario'),
          use: tContent('usage.scenarios.cols.use'),
          alternative: tContent('usage.scenarios.cols.alternative'),
        },
        items: [
          { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
          { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
          { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
          { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
          { s: tContent('usage.scenarios.item5.s'), u: tContent('usage.scenarios.item5.u'), a: tContent('usage.scenarios.item5.a') },
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
        ],
      }"
      :ux-writing="{
        title: tContent('usage.uxWriting.title'),
        cols: {
          element: tContent('usage.uxWriting.table.element'),
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.placeholder.name'),   rules: tContent('usage.uxWriting.table.placeholder.format'),   do: tContent('usage.uxWriting.table.placeholder.good'),   dont: tContent('usage.uxWriting.table.placeholder.bad')   },
          { element: tContent('usage.uxWriting.table.itemLabel.name'),     rules: tContent('usage.uxWriting.table.itemLabel.format'),     do: tContent('usage.uxWriting.table.itemLabel.good'),     dont: tContent('usage.uxWriting.table.itemLabel.bad')     },
          { element: tContent('usage.uxWriting.table.chipRemove.name'),    rules: tContent('usage.uxWriting.table.chipRemove.format'),    do: tContent('usage.uxWriting.table.chipRemove.good'),    dont: tContent('usage.uxWriting.table.chipRemove.bad')    },
          { element: tContent('usage.uxWriting.table.emptyMessage.name'),  rules: tContent('usage.uxWriting.table.emptyMessage.format'),  do: tContent('usage.uxWriting.table.emptyMessage.good'),  dont: tContent('usage.uxWriting.table.emptyMessage.bad')  },
        ],
      }"
      :do="{
        title: tContent('usage.do.title'),
        items: [
          tContent('usage.do.item1'),
          tContent('usage.do.item2'),
          tContent('usage.do.item3'),
          tContent('usage.do.item4'),
        ],
      }"
      :dont="{
        title: tContent('usage.dont.title'),
        items: [
          tContent('usage.dont.item1'),
          tContent('usage.dont.item2'),
          tContent('usage.dont.item3'),
          tContent('usage.dont.item4'),
        ],
      }"
    />

    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <span class="nds-combobox-chip">
          <span>Brasil</span>
          <button
            type="button"
            class="nds-combobox-chip-remove"
            aria-label="Remover Brasil"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </span>
      </template>
      <template #dont-preview-0>
        <span class="nds-combobox-chip">
          <span>Brasil</span>
          <button
            type="button"
            class="nds-combobox-chip-remove"
            aria-label="Remover"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </span>
      </template>

      <template #do-preview-1>
        <span
          class="nds-cluster nds-text-body nds-text-muted-foreground"
          data-spacing="xs"
        >
          <kbd class="nds-kbd">Backspace</kbd>
        </span>
      </template>
      <template #dont-preview-1>
        <span class="nds-text-body nds-text-muted-foreground">
          {{ toPlainText(tContent('doDont.pair2.dont')) }}
        </span>
      </template>
    </DocsDoDont>

    <DocsImport
      :title="tContent('import.title')"
      :code="codeImport"
    />

    <!--
      Cada cartão mostra o campo de verdade, com os mesmos rótulos e os mesmos
      dados da story correspondente — é a story que o Chromatic fotografa, e um
      exemplo que divergisse dela faria a regressão visual guardar outra coisa.
      A lista fica em fluxo e só existe aberta, então fechado o cartão mostra o
      campo inteiro: rótulo, texto e gatilho.
    -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
      component-slug="combobox"
    >
      <!-- Escolha única -->
      <template #variant-preview-0>
        <div class="nds-w-xs">
          <Combobox v-model="variantCountry">
            <ComboboxLabel>{{ tContent('demonstration.labels.countryLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxInput :placeholder="tContent('demonstration.labels.countryPlaceholder')" />
              <ComboboxClear :aria-label="tContent('demonstration.labels.clear')" />
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxItem
                    v-for="option in countries"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
        </div>
      </template>

      <!-- Múltipla com chips -->
      <template #variant-preview-1>
        <div class="nds-w-xs">
          <Combobox
            v-model="variantChosen"
            multiple
          >
            <ComboboxLabel>{{ tContent('demonstration.labels.countriesLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxChips>
                <ComboboxChip
                  v-for="item in variantChips"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.label }}
                  <ComboboxChipRemove :aria-label="removeLabelOf(item.label)" :removed-announcement="removedAnnouncementOf(item.label)" />
                </ComboboxChip>
                <ComboboxInput :placeholder="tContent('demonstration.labels.countriesPlaceholder')" />
              </ComboboxChips>
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxItem
                    v-for="item in countries"
                    :key="item.value"
                    :value="item.value"
                  >
                    {{ item.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
        </div>
      </template>

      <!-- Com grupos -->
      <template #variant-preview-2>
        <div class="nds-w-xs">
          <Combobox v-model="variantIngredient">
            <ComboboxLabel>{{ tContent('demonstration.labels.groupedLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxInput :placeholder="tContent('demonstration.labels.groupedPlaceholder')" />
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxGroup>
                    <ComboboxGroupLabel>{{ tContent('demonstration.labels.groupFruits') }}</ComboboxGroupLabel>
                    <ComboboxItem
                      v-for="item in fruits"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                      <ComboboxItemIndicator />
                    </ComboboxItem>
                  </ComboboxGroup>
                  <ComboboxSeparator />
                  <ComboboxGroup>
                    <ComboboxGroupLabel>{{ tContent('demonstration.labels.groupVegetables') }}</ComboboxGroupLabel>
                    <ComboboxItem
                      v-for="item in vegetables"
                      :key="item.value"
                      :value="item.value"
                    >
                      {{ item.label }}
                      <ComboboxItemIndicator />
                    </ComboboxItem>
                  </ComboboxGroup>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
        </div>
      </template>
    </DocsVariants>

    <!--
      O DocsCompositions repassa os slots ao DocsVariants, então o nome do slot
      continua `variant-preview-N` também aqui.
    -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="combobox"
      :items="compositionItems"
    >
      <!-- Em formulário -->
      <template #variant-preview-0>
        <form
          class="nds-stack nds-w-xs"
          data-spacing="md"
          @submit.prevent
        >
          <Combobox
            v-model="formCountry"
            name="country"
          >
            <ComboboxLabel>{{ tContent('demonstration.labels.countryLabel') }}</ComboboxLabel>
            <ComboboxInputWrapper>
              <ComboboxInput :placeholder="tContent('demonstration.labels.countryPlaceholder')" />
              <ComboboxTrigger :aria-label="tContent('demonstration.labels.openList')">
                <ComboboxIcon />
              </ComboboxTrigger>
            </ComboboxInputWrapper>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxList>
                  <ComboboxItem
                    v-for="option in countries"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                </ComboboxList>
                <ComboboxEmpty>{{ tContent('demonstration.labels.empty') }}</ComboboxEmpty>
              </ComboboxPopup>
            </ComboboxPositioner>
          </Combobox>
          <Button type="submit">
            Enviar
          </Button>
        </form>
      </template>
    </DocsCompositions>

    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: toPlainText(tContent('states.cols.trigger')), behavior: toPlainText(tContent('states.cols.behavior')) }"
      :items="stateItems"
    />

    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Combobox', cols: propCols, items: rootPropItems },
        { title: 'ComboboxInput', cols: propCols, items: inputPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomization"
      language="css"
    />

    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
      component-slug="combobox"
    />

    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
      component-slug="combobox"
    />

    <DocsAnalytics
      :title="tContent('analytics.title')"
      :description="tContent('analytics.description')"
      :cols="{ event: tContent('analytics.table.event'), trigger: toPlainText(tContent('analytics.table.trigger')), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        description: tContent('testes.functional.description'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
        items: functionalTestItems,
      }"
      :accessibility="{
        title: tContent('testes.accessibility.title'),
        description: tContent('testes.accessibility.description'),
        cols: a11yCritCols,
        items: a11yTestItems,
      }"
      :visual="{
        title: tContent('testes.visual.title'),
        description: tContent('testes.visual.description'),
        cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
