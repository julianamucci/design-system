<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

import uiTranslations         from '@/i18n/ui.json';
import componentTranslations  from '@shared/content/radio-group/translations.json';
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────
// IMPORTANT: locale comes from useTranslation — NEVER from useLocaleStore/Pinia
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
  componentSlug: 'radio-group',
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
    component_name: 'radio-group',
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
      { id: 'importacao',   label: tNav('nav.import')    },
      { id: 'variantes',    label: tNav('nav.variants')  },
      { id: 'composicoes',  label: tNav('nav.compositions') },
      { id: 'estados',      label: tNav('nav.states')    },
      { id: 'propriedades', label: tNav('nav.props')     },
      { id: 'tokens',       label: tNav('nav.tokens')    },
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
    component_name: 'radio-group',
    locale: locale.value,
  });
});

// ─── Analytics — demo events ──────────────────────────────────────────────────

const demoPreviousValues: Record<string, string | undefined> = {};

function handleDemoRadioChange(name: string, value: string) {
  track('radio_change', {
    component: 'radio_group',
    name,
    value,
    previous_value: demoPreviousValues[name],
    location: 'docs_demo',
  });
  demoPreviousValues[name] = value;
}
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";`;

const verticalCode = `<RadioGroup aria-label="Forma de pagamento">
  <div class="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="cartao" id="v-cartao" />
    <Label :for="'v-cartao'">Cartão de crédito</Label>
  </div>
  <div class="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="pix" id="v-pix" />
    <Label :for="'v-pix'">Pix</Label>
  </div>
  <div class="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="boleto" id="v-boleto" />
    <Label :for="'v-boleto'">Boleto bancário</Label>
  </div>
</RadioGroup>`;

const horizontalCode = `<RadioGroup orientation="horizontal" class="nds-cluster" data-spacing="lg" aria-label="Forma de entrega">
  <div class="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="standard" id="h-standard" />
    <Label :for="'h-standard'">Padrão (5 dias)</Label>
  </div>
  <div class="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="express" id="h-express" />
    <Label :for="'h-express'">Expressa (1 dia)</Label>
  </div>
  <div class="nds-cluster" data-spacing="xs">
    <RadioGroupItem value="pickup" id="h-pickup" />
    <Label :for="'h-pickup'">Retirar na loja</Label>
  </div>
</RadioGroup>`;

const codeWithDescription = `<RadioGroup aria-label="Forma de pagamento">
  <div class="nds-cluster" data-spacing="xs" data-align="start">
    <RadioGroupItem value="cartao" id="d-cartao" class="nds-mt-0-5" aria-describedby="d-cartao-desc" />
    <div class="nds-stack" data-spacing="xs">
      <Label :for="'d-cartao'">Cartão de crédito</Label>
      <p id="d-cartao-desc" class="nds-text-body">
        Aprovação imediata em até 12x.
      </p>
    </div>
  </div>
  <div class="nds-cluster" data-spacing="xs" data-align="start">
    <RadioGroupItem value="pix" id="d-pix" class="nds-mt-0-5" aria-describedby="d-pix-desc" />
    <div class="nds-stack" data-spacing="xs">
      <Label :for="'d-pix'">Pix</Label>
      <p id="d-pix-desc" class="nds-text-body">
        Pagamento instantâneo com 5% de desconto.
      </p>
    </div>
  </div>
</RadioGroup>`;

const interfaceCode = `// RadioGroup (reka-ui RadioGroupRoot)
interface RadioGroupProps {
  modelValue?: string;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  required?: boolean;
  class?: string;
  // Emits
  'onUpdate:modelValue'?: (value: string) => void;
}

// RadioGroupItem (reka-ui)
interface RadioGroupItemProps {
  value: string;           // obrigatório
  id?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'vertical',        description: stripHtml(tContent('variants.styles.vertical')),        code: verticalCode        },
  { name: 'horizontal',      description: stripHtml(tContent('variants.styles.horizontal')),      code: horizontalCode      },
  { name: 'withDescription', description: stripHtml(tContent('variants.styles.withDescription')), code: codeWithDescription },
]);

// ─── Compositions ─────────────────────────────────────────────────────────────

const inFormOutput = ref<string>('—');

function handleInFormSubmit(e: Event) {
  const form = e.target as HTMLFormElement;
  const data = new FormData(form);
  const value = data.get('payment');
  inFormOutput.value = value ? String(value) : '—';
}

const codeCompInForm = `<form
  class="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg"
  data-spacing="md"
  @submit.prevent="handleSubmit"
>
  <fieldset class="nds-stack nds-border-none nds-p-0 nds-m-0" data-spacing="sm">
    <legend class="nds-text-body nds-font-semibold nds-mb-2">Forma de pagamento</legend>
    <RadioGroup name="payment">
      <div class="nds-cluster" data-spacing="xs">
        <RadioGroupItem value="card" id="form-card" />
        <Label :for="'form-card'">Cartão de crédito</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <RadioGroupItem value="pix" id="form-pix" />
        <Label :for="'form-pix'">Pix</Label>
      </div>
      <div class="nds-cluster" data-spacing="xs">
        <RadioGroupItem value="boleto" id="form-boleto" />
        <Label :for="'form-boleto'">Boleto bancário</Label>
      </div>
    </RadioGroup>
  </fieldset>
  <Button type="submit" style="align-self: flex-end">Continuar</Button>
  <p class="nds-text-body">Selecionado: {{ output }}</p>
</form>`;

const compositionItems = computed(() => [
  {
    trackId: 'inForm',
    name: tContent('variants.compositions.inForm.name'),
    description: tContent('variants.compositions.inForm.description'),
    useWhen: tContent('variants.compositions.inForm.use'),
    code: codeCompInForm,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),  trigger: toPlainText(tContent('states.default.trigger')),  behavior: toPlainText(tContent('states.default.behavior')) },
  { label: tContent('states.checked.label'),  trigger: toPlainText(tContent('states.checked.trigger')),  behavior: toPlainText(tContent('states.checked.behavior')) },
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

const radioGroupPropItems = computed(() => [
  { name: 'modelValue',          type: tContent('props.table.value.type'),         defaultValue: tContent('props.table.value.default'),         required: tContent('props.table.value.required'),         description: toPlainText(tContent('props.table.value.description'))         },
  { name: 'defaultValue',        type: tContent('props.table.defaultValue.type'),  defaultValue: tContent('props.table.defaultValue.default'),  required: tContent('props.table.defaultValue.required'),  description: toPlainText(tContent('props.table.defaultValue.description'))  },
  { name: '@update:modelValue',  type: tContent('props.table.onValueChange.type'), defaultValue: tContent('props.table.onValueChange.default'), required: tContent('props.table.onValueChange.required'), description: toPlainText(tContent('props.table.onValueChange.description')) },
  { name: 'disabled',            type: tContent('props.table.disabled.type'),      defaultValue: tContent('props.table.disabled.default'),      required: tContent('props.table.disabled.required'),      description: toPlainText(tContent('props.table.disabled.description'))      },
  { name: 'name',                type: tContent('props.table.name.type'),          defaultValue: tContent('props.table.name.default'),          required: tContent('props.table.name.required'),          description: toPlainText(tContent('props.table.name.description'))          },
  { name: 'orientation',         type: tContent('props.table.orientation.type'),   defaultValue: tContent('props.table.orientation.default'),   required: tContent('props.table.orientation.required'),   description: toPlainText(tContent('props.table.orientation.description'))   },
  { name: 'class',               type: tContent('props.table.className.type'),     defaultValue: tContent('props.table.className.default'),     required: tContent('props.table.className.required'),     description: toPlainText(tContent('props.table.className.description'))     },
]);

const radioGroupItemPropItems = computed(() => [
  { name: 'value',    type: 'string',  defaultValue: '—',     required: 'Sim', description: 'Valor único do item — OBRIGATÓRIO.' },
  { name: 'id',       type: 'string',  defaultValue: '—',     required: 'Não', description: 'Identificador para vincular ao Label via :for.' },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', required: 'Não', description: 'Desabilita apenas este item.' },
  { name: 'class',    type: 'string',  defaultValue: '—',     required: 'Não', description: 'Classes utilitárias .nds-* adicionais.' },
]);

const tokenRows = computed(() => [
  { token: '--background',  value: tContent('tokens.table.background.class'),  description: tContent('tokens.table.background.part')  },
  { token: '--primary',     value: tContent('tokens.table.primary.class'),     description: tContent('tokens.table.primary.part')     },
  { token: '--ring',        value: tContent('tokens.table.ring.class'),        description: tContent('tokens.table.ring.part')        },
  { token: '--destructive', value: tContent('tokens.table.destructive.class'), description: tContent('tokens.table.destructive.part') },
  { token: '--foreground',  value: tContent('tokens.table.foreground.class'),  description: tContent('tokens.table.foreground.part')  },
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
  { key: 'Arrow Down',   description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'Arrow Up',     description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'Arrow Right',  description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'Arrow Left',   description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'Space',       description: tContent('accessibility.keyboard.space')      },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.checkbox.name'), description: toPlainText(tContent('related.items.checkbox.description')), path: '?path=/docs/components-form-checkbox--docs' },
  { name: tContent('related.items.switch.name'),   description: toPlainText(tContent('related.items.switch.description')),   path: '?path=/docs/components-form-switch--docs'   },
  { name: tContent('related.items.select.name'),   description: toPlainText(tContent('related.items.select.description')),   path: '?path=/docs/components-form-select--docs'   },
  { name: tContent('related.items.form.name'),     description: toPlainText(tContent('related.items.form.description')),     path: '?path=/docs/components-form-form--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'radio_change',
    trigger: toPlainText(tContent('analytics.table.radio_change.trigger')),
    payload: tContent('analytics.table.radio_change.payload') },
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
]);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="radio-group"
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
        data-spacing="xl"
      >
        <!-- Vertical -->
        <fieldset
          class="nds-stack"
          data-spacing="sm"
        >
          <legend class="nds-text-body nds-font-semibold nds-mb-2">
            {{ tContent('demonstration.labels.groupLabel') }}
          </legend>
          <RadioGroup
            :aria-label="tContent('demonstration.labels.groupLabel')"
            @update:model-value="(v) => handleDemoRadioChange('payment-method', String(v))"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <RadioGroupItem
                id="demo-cartao"
                value="cartao"
              />
              <Label :for="'demo-cartao'">{{ tContent('demonstration.labels.card') }}</Label>
            </div>
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <RadioGroupItem
                id="demo-pix"
                value="pix"
              />
              <Label :for="'demo-pix'">{{ tContent('demonstration.labels.pix') }}</Label>
            </div>
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <RadioGroupItem
                id="demo-boleto"
                value="boleto"
              />
              <Label :for="'demo-boleto'">{{ tContent('demonstration.labels.boleto') }}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <!-- Horizontal -->
        <fieldset
          class="nds-stack"
          data-spacing="sm"
        >
          <legend class="nds-text-body nds-font-semibold nds-mb-2">
            {{ tContent('demonstration.labels.deliveryLabel') }}
          </legend>
          <RadioGroup
            orientation="horizontal"
            :aria-label="tContent('demonstration.labels.deliveryLabel')"
            @update:model-value="(v) => handleDemoRadioChange('delivery-method', String(v))"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <RadioGroupItem
                id="demo-standard"
                value="standard"
              />
              <Label :for="'demo-standard'">{{ tContent('demonstration.labels.standard') }}</Label>
            </div>
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <RadioGroupItem
                id="demo-express"
                value="express"
              />
              <Label :for="'demo-express'">{{ tContent('demonstration.labels.express') }}</Label>
            </div>
            <div
              class="nds-cluster"
              data-spacing="xs"
            >
              <RadioGroupItem
                id="demo-pickup"
                value="pickup"
              />
              <Label :for="'demo-pickup'">{{ tContent('demonstration.labels.pickup') }}</Label>
            </div>
          </RadioGroup>
        </fieldset>

        <!-- With description -->
        <fieldset
          class="nds-stack"
          data-spacing="sm"
        >
          <legend class="nds-text-body nds-font-semibold nds-mb-2">
            {{ tContent('demonstration.labels.groupLabel') }}
          </legend>
          <RadioGroup
            :aria-label="tContent('demonstration.labels.groupLabel')"
            @update:model-value="(v) => handleDemoRadioChange('payment-method-detailed', String(v))"
          >
            <div
              class="nds-cluster"
              data-spacing="xs"
              data-align="start"
            >
              <RadioGroupItem
                id="demo-d-cartao"
                value="cartao"
                class="nds-mt-0-5"
                aria-describedby="demo-d-cartao-desc"
              />
              <div
                class="nds-stack"
                data-spacing="xs"
              >
                <Label :for="'demo-d-cartao'">{{ tContent('demonstration.labels.card') }}</Label>
                <p
                  id="demo-d-cartao-desc"
                  class="nds-text-body"
                >
                  Visa, Mastercard, Amex · até 12x
                </p>
              </div>
            </div>
            <div
              class="nds-cluster"
              data-spacing="xs"
              data-align="start"
            >
              <RadioGroupItem
                id="demo-d-pix"
                value="pix"
                class="nds-mt-0-5"
                aria-describedby="demo-d-pix-desc"
              />
              <div
                class="nds-stack"
                data-spacing="xs"
              >
                <Label :for="'demo-d-pix'">{{ tContent('demonstration.labels.pix') }}</Label>
                <p
                  id="demo-d-pix-desc"
                  class="nds-text-body"
                >
                  Aprovação instantânea · 5% de desconto
                </p>
              </div>
            </div>
          </RadioGroup>
        </fieldset>
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
          { element: tContent('usage.uxWriting.table.groupLabel.name'), rules: tContent('usage.uxWriting.table.groupLabel.format'), do: tContent('usage.uxWriting.table.groupLabel.good'), dont: tContent('usage.uxWriting.table.groupLabel.bad') },
          { element: tContent('usage.uxWriting.table.itemLabel.name'), rules: tContent('usage.uxWriting.table.itemLabel.format'), do: tContent('usage.uxWriting.table.itemLabel.good'), dont: tContent('usage.uxWriting.table.itemLabel.bad') },
          { element: tContent('usage.uxWriting.table.order.name'), rules: tContent('usage.uxWriting.table.order.format'), do: tContent('usage.uxWriting.table.order.good'), dont: tContent('usage.uxWriting.table.order.bad') },
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
      <!-- Pair 1: Label associado vs texto solto -->
      <template #do-preview-0>
        <RadioGroup
          aria-label="Forma de pagamento (do)"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-do-1a"
              value="a"
            />
            <Label :for="'dodont-do-1a'">Cartão de crédito</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-do-1b"
              value="b"
            />
            <Label :for="'dodont-do-1b'">Pix</Label>
          </div>
        </RadioGroup>
      </template>
      <template #dont-preview-0>
        <!-- O "don't" aqui é o texto solto em <span>, sem associação clicável
             com o radio. O `aria-label` em cada item existe para o axe
             (`button-name`) e NÃO desfaz a lição: o pixel do exemplo continua
             o mesmo, e o que se perde — clicar no texto para marcar — segue
             perdido. Sem ele o smoke da docs page reprovava, porque esta é a
             única das cinco stacks que renderiza o par ao VIVO. É a mesma
             solução, com o mesmo motivo, que o React já usava. -->
        <RadioGroup
          aria-label="Forma de pagamento (dont)"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-dont-1a"
              aria-label="Cartão de crédito"
              value="a"
            />
            <span class="nds-text-body">Cartão de crédito</span>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-dont-1b"
              aria-label="Pix"
              value="b"
            />
            <span class="nds-text-body">Pix</span>
          </div>
        </RadioGroup>
      </template>

      <!-- Pair 2: Sem pré-seleção vs com pré-seleção arbitrária -->
      <template #do-preview-1>
        <RadioGroup
          aria-label="Forma de entrega (do)"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-do-2a"
              value="standard"
            />
            <Label :for="'dodont-do-2a'">Padrão (5 dias)</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-do-2b"
              value="express"
            />
            <Label :for="'dodont-do-2b'">Expressa (1 dia)</Label>
          </div>
        </RadioGroup>
      </template>
      <template #dont-preview-1>
        <RadioGroup
          default-value="express"
          aria-label="Forma de entrega (dont)"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-dont-2a"
              value="standard"
            />
            <Label :for="'dodont-dont-2a'">Padrão (5 dias)</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="dodont-dont-2b"
              value="express"
            />
            <Label :for="'dodont-dont-2b'">Expressa (1 dia)</Label>
          </div>
        </RadioGroup>
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
      component-slug="radio-group"
    >
      <!-- vertical -->
      <template #variant-preview-0>
        <RadioGroup
          aria-label="Forma de pagamento"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="var-v-cartao"
              value="cartao"
            />
            <Label :for="'var-v-cartao'">Cartão de crédito</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="var-v-pix"
              value="pix"
            />
            <Label :for="'var-v-pix'">Pix</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="var-v-boleto"
              value="boleto"
            />
            <Label :for="'var-v-boleto'">Boleto bancário</Label>
          </div>
        </RadioGroup>
      </template>

      <!-- horizontal -->
      <template #variant-preview-1>
        <RadioGroup
          orientation="horizontal"
          aria-label="Forma de entrega"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="var-h-standard"
              value="standard"
            />
            <Label :for="'var-h-standard'">Padrão</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="var-h-express"
              value="express"
            />
            <Label :for="'var-h-express'">Expressa</Label>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
          >
            <RadioGroupItem
              id="var-h-pickup"
              value="pickup"
            />
            <Label :for="'var-h-pickup'">Retirar na loja</Label>
          </div>
        </RadioGroup>
      </template>

      <!-- withDescription -->
      <template #variant-preview-2>
        <RadioGroup
          aria-label="Forma de pagamento"
        >
          <div
            class="nds-cluster"
            data-spacing="xs"
            data-align="start"
          >
            <RadioGroupItem
              id="var-d-cartao"
              value="cartao"
              class="nds-mt-0-5"
              aria-describedby="var-d-cartao-desc"
            />
            <div
              class="nds-stack"
              data-spacing="xs"
            >
              <Label :for="'var-d-cartao'">Cartão de crédito</Label>
              <p
                id="var-d-cartao-desc"
                class="nds-text-body"
              >
                Aprovação imediata em até 12x.
              </p>
            </div>
          </div>
          <div
            class="nds-cluster"
            data-spacing="xs"
            data-align="start"
          >
            <RadioGroupItem
              id="var-d-pix"
              value="pix"
              class="nds-mt-0-5"
              aria-describedby="var-d-pix-desc"
            />
            <div
              class="nds-stack"
              data-spacing="xs"
            >
              <Label :for="'var-d-pix'">Pix</Label>
              <p
                id="var-d-pix-desc"
                class="nds-text-body"
              >
                Pagamento instantâneo com 5% de desconto.
              </p>
            </div>
          </div>
        </RadioGroup>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="radio-group"
      :items="compositionItems"
    >
      <!-- inForm -->
      <template #variant-preview-0>
        <form
          class="nds-stack nds-w-sm nds-p-4 nds-border-default nds-rounded-lg"
          data-spacing="md"
          @submit.prevent="handleInFormSubmit"
        >
          <fieldset
            class="nds-stack nds-border-none nds-p-0 nds-m-0"
            data-spacing="sm"
          >
            <legend class="nds-text-body nds-font-semibold nds-mb-2">
              Forma de pagamento
            </legend>
            <RadioGroup name="payment">
              <div
                class="nds-cluster"
                data-spacing="xs"
              >
                <RadioGroupItem
                  id="form-card"
                  value="card"
                />
                <Label :for="'form-card'">Cartão de crédito</Label>
              </div>
              <div
                class="nds-cluster"
                data-spacing="xs"
              >
                <RadioGroupItem
                  id="form-pix"
                  value="pix"
                />
                <Label :for="'form-pix'">Pix</Label>
              </div>
              <div
                class="nds-cluster"
                data-spacing="xs"
              >
                <RadioGroupItem
                  id="form-boleto"
                  value="boleto"
                />
                <Label :for="'form-boleto'">Boleto bancário</Label>
              </div>
            </RadioGroup>
          </fieldset>
          <Button
            type="submit"
            style="align-self: flex-end"
          >
            Continuar
          </Button>
          <p class="nds-text-body">
            Selecionado: {{ inFormOutput }}
          </p>
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
        { title: 'RadioGroup', cols: propCols, items: radioGroupPropItems },
        { title: 'RadioGroupItem', cols: propCols, items: radioGroupItemPropItems },
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
