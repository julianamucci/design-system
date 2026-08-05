<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-vue-next';

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

import uiTranslations        from '@/i18n/ui.json';
import componentTranslations from '@shared/content/select/translations.json';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANTE: locale vem de useTranslation — NUNCA de useLocaleStore/Pinia
const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(componentTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (componentTranslations as unknown as Record<
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

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'select',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/form' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'select',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
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
      { id: 'anatomia',     label: tNav('nav.anatomy')      },
      { id: 'quando-usar',  label: tNav('nav.usage')        },
      { id: 'do-dont',      label: tNav('nav.doDont')       },
    ],
  },
  {
    label: tNav('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tNav('nav.import')   },
      { id: 'variantes',    label: tNav('nav.variants') },
      { id: 'composicoes',  label: tNav('nav.compositions') },
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
    component_name: 'select',
    locale: locale.value,
  });
});

// ─── Analytics — demo events ──────────────────────────────────────────────────

function handleDemoSelect(fieldName: string, value: unknown) {
  track('option_select', {
    component: 'select',
    field_name: fieldName,
    value: String(value),
    location: 'docs_demo',
  });
}
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";`;

const codeDefault = `<Select>
  <SelectTrigger aria-label="Selecionar estado">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="sp">São Paulo</SelectItem>
    <SelectItem value="rj">Rio de Janeiro</SelectItem>
    <SelectItem value="mg">Minas Gerais</SelectItem>
    <SelectItem value="es">Espírito Santo</SelectItem>
  </SelectContent>
</Select>`;

const codeWithGroups = `<Select>
  <SelectTrigger aria-label="Selecionar estado por região">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Sudeste</SelectLabel>
      <SelectItem value="sp">São Paulo</SelectItem>
      <SelectItem value="rj">Rio de Janeiro</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Sul</SelectLabel>
      <SelectItem value="rs">Rio Grande do Sul</SelectItem>
      <SelectItem value="sc">Santa Catarina</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`;

const codeWithIcon = `<Select>
  <SelectTrigger aria-label="Selecionar idioma">
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pt-BR">
      <Globe class="nds-icon" aria-hidden="true" />
      <span>Português (BR)</span>
    </SelectItem>
    <SelectItem value="en">
      <Globe class="nds-icon" aria-hidden="true" />
      <span>English</span>
    </SelectItem>
  </SelectContent>
</Select>`;

const interfaceCode = `// Select (reka-ui SelectRoot)
interface SelectProps {
  modelValue?: string;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  // Emits
  'onUpdate:modelValue'?: (value: string) => void;
}

// SelectTrigger
interface SelectTriggerProps {
  size?: 'default' | 'sm';
  disabled?: boolean;
  class?: string;
}

// SelectValue
interface SelectValueProps {
  placeholder?: string;
}

// SelectItem
interface SelectItemProps {
  value: string;       // obrigatório
  disabled?: boolean;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),    description: stripHtml(tContent('variants.styles.default')),    code: codeDefault    },
  { name: tContent('variants.items.withGroups'), description: stripHtml(tContent('variants.styles.withGroups')), code: codeWithGroups },
  { name: tContent('variants.items.withIcon'),   description: stripHtml(tContent('variants.styles.withIcon')),   code: codeWithIcon   },
]);

const codeCompInForm = `<form
  class="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg" data-spacing="md"
  @submit.prevent="(e) => {
    const data = new FormData(e.target as HTMLFormElement);
    console.log('Estado:', data.get('state'));
  }"
>
  <div class="nds-stack" data-spacing="sm">
    <Label for="form-state">Estado</Label>
    <Select name="state" required>
      <SelectTrigger id="form-state" aria-label="Estado">
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sp">São Paulo</SelectItem>
        <SelectItem value="rj">Rio de Janeiro</SelectItem>
        <SelectItem value="mg">Minas Gerais</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <button type="submit" style="align-self: flex-end">Continuar</button>
</form>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.inForm.name'),
    description: tContent('variants.compositions.inForm.description'),
    useWhen: tContent('variants.compositions.inForm.use'),
    code: codeCompInForm,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),  trigger: toPlainText(tContent('states.default.trigger')),  behavior: toPlainText(tContent('states.default.behavior')) },
  { label: tContent('states.open.label'),     trigger: toPlainText(tContent('states.open.trigger')),     behavior: toPlainText(tContent('states.open.behavior')) },
  { label: tContent('states.selected.label'), trigger: toPlainText(tContent('states.selected.trigger')), behavior: toPlainText(tContent('states.selected.behavior')) },
  { label: tContent('states.hover.label'),    trigger: toPlainText(tContent('states.hover.trigger')),    behavior: toPlainText(tContent('states.hover.behavior')) },
  { label: tContent('states.focus.label'),    trigger: toPlainText(tContent('states.focus.trigger')),    behavior: toPlainText(tContent('states.focus.behavior')) },
  { label: tContent('states.disabled.label'), trigger: toPlainText(tContent('states.disabled.trigger')), behavior: toPlainText(tContent('states.disabled.behavior')) },
  { label: tContent('states.invalid.label'),  trigger: toPlainText(tContent('states.invalid.trigger')),  behavior: toPlainText(tContent('states.invalid.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const selectPropItems = computed(() => [
  { name: 'modelValue',         type: tContent('props.table.value.type'),         defaultValue: tContent('props.table.value.default'),         required: tContent('props.table.value.required'),         description: toPlainText(tContent('props.table.value.description'))         },
  { name: 'defaultValue',       type: tContent('props.table.defaultValue.type'),  defaultValue: tContent('props.table.defaultValue.default'),  required: tContent('props.table.defaultValue.required'),  description: toPlainText(tContent('props.table.defaultValue.description'))  },
  { name: '@update:modelValue', type: tContent('props.table.onValueChange.type'), defaultValue: tContent('props.table.onValueChange.default'), required: tContent('props.table.onValueChange.required'), description: toPlainText(tContent('props.table.onValueChange.description')) },
  { name: 'disabled',           type: tContent('props.table.disabled.type'),      defaultValue: tContent('props.table.disabled.default'),      required: tContent('props.table.disabled.required'),      description: toPlainText(tContent('props.table.disabled.description'))      },
  { name: 'name',               type: tContent('props.table.name.type'),          defaultValue: tContent('props.table.name.default'),          required: tContent('props.table.name.required'),          description: toPlainText(tContent('props.table.name.description'))          },
]);

const selectTriggerPropItems = computed(() => [
  { name: 'size',     type: tContent('props.table.size.type'),    defaultValue: tContent('props.table.size.default'),    required: tContent('props.table.size.required'),    description: toPlainText(tContent('props.table.size.description'))    },
  { name: 'disabled', type: 'boolean',                            defaultValue: 'false',                                 required: 'Não',                                     description: 'Desabilita apenas o trigger.'                          },
  { name: 'class',    type: 'string',                             defaultValue: '—',                                     required: 'Não',                                     description: 'Classes utilitárias .nds-* adicionais.'                          },
]);

const selectValuePropItems = computed(() => [
  { name: 'placeholder', type: tContent('props.table.placeholder.type'), defaultValue: tContent('props.table.placeholder.default'), required: tContent('props.table.placeholder.required'), description: toPlainText(tContent('props.table.placeholder.description')) },
]);

const selectItemPropItems = computed(() => [
  { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Valor único do item — OBRIGATÓRIO.'  },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: 'Desabilita apenas este item.'        },
  { name: 'class',    type: 'string',  defaultValue: '—',     required: 'Não', description: 'Classes utilitárias .nds-* adicionais.'        },
]);

const tokenRows = computed(() => [
  { token: '--input',              value: tContent('tokens.table.input.class'),             description: tContent('tokens.table.input.part')             },
  { token: '--popover',            value: tContent('tokens.table.popover.class'),           description: tContent('tokens.table.popover.part')           },
  { token: '--popover-foreground', value: tContent('tokens.table.popoverForeground.class'), description: tContent('tokens.table.popoverForeground.part') },
  { token: '--accent',             value: tContent('tokens.table.accent.class'),            description: tContent('tokens.table.accent.part')            },
  { token: '--accent-foreground',  value: tContent('tokens.table.accentForeground.class'),  description: tContent('tokens.table.accentForeground.part')  },
  { token: '--ring',               value: tContent('tokens.table.ring.class'),              description: tContent('tokens.table.ring.part')              },
  { token: '--destructive',        value: tContent('tokens.table.destructive.class'),       description: tContent('tokens.table.destructive.part')       },
  { token: '--muted-foreground',   value: tContent('tokens.table.mutedForeground.class'),   description: tContent('tokens.table.mutedForeground.part')   },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',         description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')      },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')      },
  { key: 'Arrow Down',   description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'Arrow Up',     description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'Home',        description: tContent('accessibility.keyboard.home')       },
  { key: 'End',         description: tContent('accessibility.keyboard.end')        },
  { key: 'Escape',      description: tContent('accessibility.keyboard.escape')     },
  { key: 'a-z',         description: tContent('accessibility.keyboard.typeAhead')  },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.combobox.name'),     description: toPlainText(tContent('related.items.combobox.description')),     path: '?path=/docs/ui-combobox--docs'      },
  { name: tContent('related.items.radioGroup.name'),   description: toPlainText(tContent('related.items.radioGroup.description')),   path: '?path=/docs/ui-radiogroup--docs'    },
  { name: tContent('related.items.dropdownMenu.name'), description: toPlainText(tContent('related.items.dropdownMenu.description')), path: '?path=/docs/ui-dropdownmenu--docs'  },
  { name: tContent('related.items.form.name'),         description: toPlainText(tContent('related.items.form.description')),         path: '?path=/docs/ui-form--docs'          },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'option_select',
    trigger: toPlainText(tContent('analytics.table.option_select.trigger')),
    payload: tContent('analytics.table.option_select.payload') },
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
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item2'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item3'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item4'), level: 'AA', how: '' },
  { criterion: tContent('testes.accessibility.item5'), level: 'AA', how: '' },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
  { story: tContent('testes.visual.item5.story'), priority: localPriority(tContent('testes.visual.item5.priority')) },
]);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="select"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-w-full nds-max-w-md nds-stack"
        data-spacing="lg"
      >
        <!-- Default -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="demo-estado">{{ tContent('demonstration.labels.stateLabel') }}</Label>
          <Select @update:model-value="(v) => handleDemoSelect('demo-estado', v)">
            <SelectTrigger
              id="demo-estado"
              :aria-label="tContent('demonstration.labels.stateLabel')"
              class="nds-w-full"
            >
              <SelectValue :placeholder="tContent('demonstration.labels.placeholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">
                {{ tContent('demonstration.labels.sp') }}
              </SelectItem>
              <SelectItem value="rj">
                {{ tContent('demonstration.labels.rj') }}
              </SelectItem>
              <SelectItem value="mg">
                {{ tContent('demonstration.labels.mg') }}
              </SelectItem>
              <SelectItem value="es">
                {{ tContent('demonstration.labels.es') }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- With groups -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="demo-regiao">{{ tContent('demonstration.labels.regionLabel') }}</Label>
          <Select @update:model-value="(v) => handleDemoSelect('demo-regiao', v)">
            <SelectTrigger
              id="demo-regiao"
              :aria-label="tContent('demonstration.labels.regionLabel')"
              class="nds-w-full"
            >
              <SelectValue :placeholder="tContent('demonstration.labels.placeholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{{ tContent('demonstration.labels.groupSoutheast') }}</SelectLabel>
                <SelectItem value="sp">
                  {{ tContent('demonstration.labels.sp') }}
                </SelectItem>
                <SelectItem value="rj">
                  {{ tContent('demonstration.labels.rj') }}
                </SelectItem>
                <SelectItem value="mg">
                  {{ tContent('demonstration.labels.mg') }}
                </SelectItem>
                <SelectItem value="es">
                  {{ tContent('demonstration.labels.es') }}
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>{{ tContent('demonstration.labels.groupSouth') }}</SelectLabel>
                <SelectItem value="rs">
                  {{ tContent('demonstration.labels.rs') }}
                </SelectItem>
                <SelectItem value="sc">
                  {{ tContent('demonstration.labels.sc') }}
                </SelectItem>
                <SelectItem value="pr">
                  {{ tContent('demonstration.labels.pr') }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <!-- Sm -->
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="demo-sm">{{ tContent('demonstration.labels.stateLabel') }} (sm)</Label>
          <Select @update:model-value="(v) => handleDemoSelect('demo-sm', v)">
            <SelectTrigger
              id="demo-sm"
              size="sm"
              :aria-label="tContent('demonstration.labels.stateLabel')"
              class="nds-w-full"
            >
              <SelectValue :placeholder="tContent('demonstration.labels.placeholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sp">
                {{ tContent('demonstration.labels.sp') }}
              </SelectItem>
              <SelectItem value="rj">
                {{ tContent('demonstration.labels.rj') }}
              </SelectItem>
              <SelectItem value="mg">
                {{ tContent('demonstration.labels.mg') }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────────── -->
    <DocsWhenToUse
      :title="tContent('usage.title')"
      :guidelines="{
        title: tContent('usage.guidelines.title'),
        items: [
          tContent('usage.guidelines.item1'),
          tContent('usage.guidelines.item2'),
          tContent('usage.guidelines.item3'),
          tContent('usage.guidelines.item4'),
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
          { element: tContent('usage.uxWriting.table.placeholder.name'), rules: tContent('usage.uxWriting.table.placeholder.format'), do: tContent('usage.uxWriting.table.placeholder.good'), dont: tContent('usage.uxWriting.table.placeholder.bad') },
          { element: tContent('usage.uxWriting.table.itemLabel.name'), rules: tContent('usage.uxWriting.table.itemLabel.format'), do: tContent('usage.uxWriting.table.itemLabel.good'), dont: tContent('usage.uxWriting.table.itemLabel.bad') },
          { element: tContent('usage.uxWriting.table.groupLabel.name'), rules: tContent('usage.uxWriting.table.groupLabel.format'), do: tContent('usage.uxWriting.table.groupLabel.good'), dont: tContent('usage.uxWriting.table.groupLabel.bad') },
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

    <!-- ── Do & Don't ───────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: toPlainText(tContent('doDont.pair1.do')),
          dontCaption: toPlainText(tContent('doDont.pair1.dont')),
        },
        {
          doLabel: tNav('common.do'),
          dontLabel: tNav('common.dont'),
          doCaption: toPlainText(tContent('doDont.pair2.do')),
          dontCaption: toPlainText(tContent('doDont.pair2.dont')),
        },
      ]"
    >
      <!-- Pair 1: estilo consistente vs sigla misturada -->
      <template #do-preview-0>
        <Select>
          <SelectTrigger
            aria-label="Estado (do)"
            class="nds-w-full"
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">
              São Paulo
            </SelectItem>
            <SelectItem value="rj">
              Rio de Janeiro
            </SelectItem>
            <SelectItem value="mg">
              Minas Gerais
            </SelectItem>
          </SelectContent>
        </Select>
      </template>
      <template #dont-preview-0>
        <Select>
          <SelectTrigger
            aria-label="Estado (dont)"
            class="nds-w-full"
          >
            <SelectValue placeholder="-- Escolha --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">
              SP
            </SelectItem>
            <SelectItem value="rj">
              Rio de Janeiro
            </SelectItem>
            <SelectItem value="mg">
              MG
            </SelectItem>
          </SelectContent>
        </Select>
      </template>

      <!-- Pair 2: grupos com múltiplos itens vs grupo de 1 item -->
      <template #do-preview-1>
        <Select>
          <SelectTrigger
            aria-label="Região (do)"
            class="nds-w-full"
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="sp">
                São Paulo
              </SelectItem>
              <SelectItem value="rj">
                Rio de Janeiro
              </SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="rs">
                Rio Grande do Sul
              </SelectItem>
              <SelectItem value="sc">
                Santa Catarina
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>
      <template #dont-preview-1>
        <Select>
          <SelectTrigger
            aria-label="Região (dont)"
            class="nds-w-full"
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="sp">
                São Paulo
              </SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="rs">
                Rio Grande do Sul
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
      component-slug="select"
    >
      <!-- default -->
      <template #variant-preview-0>
        <Select>
          <SelectTrigger
            aria-label="Selecionar estado (default)"
            class="nds-w-full"
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sp">
              São Paulo
            </SelectItem>
            <SelectItem value="rj">
              Rio de Janeiro
            </SelectItem>
            <SelectItem value="mg">
              Minas Gerais
            </SelectItem>
            <SelectItem value="es">
              Espírito Santo
            </SelectItem>
          </SelectContent>
        </Select>
      </template>

      <!-- withGroups -->
      <template #variant-preview-1>
        <Select>
          <SelectTrigger
            aria-label="Selecionar estado (grupos)"
            class="nds-w-full"
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sudeste</SelectLabel>
              <SelectItem value="var-sp">
                São Paulo
              </SelectItem>
              <SelectItem value="var-rj">
                Rio de Janeiro
              </SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Sul</SelectLabel>
              <SelectItem value="var-rs">
                Rio Grande do Sul
              </SelectItem>
              <SelectItem value="var-sc">
                Santa Catarina
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>

      <!-- withIcon -->
      <template #variant-preview-2>
        <Select>
          <SelectTrigger
            aria-label="Selecionar idioma"
            class="nds-w-full"
          >
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">
              <Globe
                class="nds-icon"
                aria-hidden="true"
              />
              <span>Português (BR)</span>
            </SelectItem>
            <SelectItem value="en">
              <Globe
                class="nds-icon"
                aria-hidden="true"
              />
              <span>English</span>
            </SelectItem>
            <SelectItem value="es">
              <Globe
                class="nds-icon"
                aria-hidden="true"
              />
              <span>Español</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="select"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <form
          class="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg"
          data-spacing="md"
          style="contain: layout; min-height: 180px; position: relative"
          @submit.prevent
        >
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <Label for="comp-form-state">{{ tContent('demonstration.labels.stateLabel') }}</Label>
            <Select name="state">
              <SelectTrigger
                id="comp-form-state"
                :aria-label="tContent('demonstration.labels.stateLabel')"
              >
                <SelectValue :placeholder="tContent('demonstration.labels.placeholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sp">
                  {{ tContent('demonstration.labels.sp') }}
                </SelectItem>
                <SelectItem value="rj">
                  {{ tContent('demonstration.labels.rj') }}
                </SelectItem>
                <SelectItem value="mg">
                  {{ tContent('demonstration.labels.mg') }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            type="submit"
            class="nds-rounded-md nds-bg-primary nds-text-primary-foreground nds-text-body nds-font-medium"
            style="display: inline-flex; align-items: center; justify-content: center; align-self: flex-end; padding: 0.375rem 0.75rem"
          >
            Continuar
          </button>
        </form>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'Select', cols: propCols, items: selectPropItems },
        { title: 'SelectTrigger', cols: propCols, items: selectTriggerPropItems },
        { title: 'SelectValue', cols: propCols, items: selectValuePropItems },
        { title: 'SelectItem', cols: propCols, items: selectItemPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ────────────────────────────────────────────────────── -->
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

    <!-- ── Acessibilidade ───────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ────────────────────────────────────────────────────── -->
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
        cols: {
          story: tNav('common.storyState'),
          priority: tNav('common.priority'),
        },
        items: visualTestItems,
      }"
    />
  </DocsPageLayout>
</template>
