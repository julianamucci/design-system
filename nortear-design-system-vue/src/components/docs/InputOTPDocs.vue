<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import DOMPurify from 'dompurify';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/input-otp/translations.json';
import uiTranslations from '@/i18n/ui.json';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

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
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityKeyMap: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function localPriority(raw: string): string {
  return priorityKeyMap[raw] ?? raw;
}

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'input-otp',
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
    component_name: 'input-otp',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

// ─── Navigation groups ────────────────────────────────────────────────────────

const navGroups = computed(() => [
  {
    label: tContent('nav.overview'),
    sections: [
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tContent('nav.techRef'),
    sections: [
      { id: 'importacao',   label: tContent('nav.import')   },
      { id: 'variantes',    label: tContent('nav.variants') },
      { id: 'composicoes',  label: tContent('nav.compositions') },
      { id: 'estados',      label: tContent('nav.states')   },
      { id: 'propriedades', label: tContent('nav.props')    },
      { id: 'tokens',       label: tContent('nav.tokens')   },
    ],
  },
  {
    label: tContent('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tContent('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() => navGroups.value.flatMap((g) => g.sections.map((s) => s.id)));

const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'input-otp',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";`;

const interfaceCode = `// InputOTP (vue-input-otp)
interface OTPInputProps {
  maxLength: number;        // total slots
  value?: string;
  pattern?: string | RegExp;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;    // 'one-time-code'
  inputMode?: 'numeric' | 'text';
}

interface OTPInputEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'complete', value: string): void;
}`;

// ─── Demo state ───────────────────────────────────────────────────────────────

const demoSix = ref('');
const demoFour = ref('');
const demoSep = ref('');
const demoAlpha = ref('');

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  {
    name: tContent('variants.items.sixDigits'),
    description: stripHtml(tContent('variants.styles.sixDigits')),
    code: '<InputOTP :max-length="6" inputmode="numeric" autocomplete="one-time-code" />',
  },
  {
    name: tContent('variants.items.fourDigits'),
    description: stripHtml(tContent('variants.styles.fourDigits')),
    code: '<InputOTP :max-length="4" inputmode="numeric" />',
  },
  {
    name: tContent('variants.items.withSeparator'),
    description: stripHtml(tContent('variants.styles.withSeparator')),
    code: '<InputOTP :max-length="6">\n  <InputOTPGroup>...</InputOTPGroup>\n  <InputOTPSeparator />\n  <InputOTPGroup>...</InputOTPGroup>\n</InputOTP>',
  },
  {
    name: tContent('variants.items.alphanumeric'),
    description: stripHtml(tContent('variants.styles.alphanumeric')),
    code: 'import { REGEXP_ONLY_DIGITS_AND_CHARS } from "vue-input-otp";\n<InputOTP :max-length="6" :pattern="REGEXP_ONLY_DIGITS_AND_CHARS" inputmode="text" />',
  },
]);

const codeCompLabel = `<div class="nds-stack" data-spacing="sm">
  <Label for="otp-code">Código de verificação</Label>
  <InputOTP id="otp-code" :max-length="6" v-model="code" autocomplete="one-time-code" inputmode="numeric">
    <InputOTPGroup>
      <InputOTPSlot :index="0" />
      <InputOTPSlot :index="1" />
      <InputOTPSlot :index="2" />
      <InputOTPSlot :index="3" />
      <InputOTPSlot :index="4" />
      <InputOTPSlot :index="5" />
    </InputOTPGroup>
  </InputOTP>
</div>`;

const codeCompHelp = `<div class="nds-stack" data-spacing="sm">
  <Label for="otp-help">Código de verificação</Label>
  <InputOTP id="otp-help" :max-length="6" aria-describedby="otp-help-text"
    autocomplete="one-time-code" inputmode="numeric">
    <InputOTPGroup><!-- 6 slots --></InputOTPGroup>
  </InputOTP>
  <p id="otp-help-text" class="nds-text-caption nds-text-muted-foreground">
    Enviamos por SMS, expira em 5 min.
  </p>
</div>`;

const codeCompError = `<div class="nds-stack" data-spacing="sm">
  <Label for="otp-err">Código de verificação</Label>
  <InputOTP id="otp-err" :max-length="6" aria-invalid="true"
    aria-describedby="otp-err-text" autocomplete="one-time-code" inputmode="numeric">
    <InputOTPGroup><!-- 6 slots --></InputOTPGroup>
  </InputOTP>
  <p id="otp-err-text" class="nds-text-caption nds-text-destructive">
    Código incorreto. Verifique e tente novamente.
  </p>
</div>`;

const codeCompResend = `<div class="nds-stack" data-spacing="sm">
  <Label for="otp-resend">Código de verificação</Label>
  <InputOTP id="otp-resend" :max-length="6" autocomplete="one-time-code" inputmode="numeric">
    <InputOTPGroup><!-- 6 slots --></InputOTPGroup>
  </InputOTP>
  <div class="nds-cluster" data-spacing="sm" data-align="center" data-justify="between">
    <p class="nds-text-caption nds-text-muted-foreground">Não recebeu?</p>
    <Button variant="link" size="sm">Reenviar código</Button>
  </div>
</div>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withLabel.name'),
    description: tContent('variants.compositions.withLabel.description'),
    useWhen: tContent('variants.compositions.withLabel.use'),
    code: codeCompLabel,
  },
  {
    name: tContent('variants.compositions.withHelpText.name'),
    description: tContent('variants.compositions.withHelpText.description'),
    useWhen: tContent('variants.compositions.withHelpText.use'),
    code: codeCompHelp,
  },
  {
    name: tContent('variants.compositions.withErrorMessage.name'),
    description: tContent('variants.compositions.withErrorMessage.description'),
    useWhen: tContent('variants.compositions.withErrorMessage.use'),
    code: codeCompError,
  },
  {
    name: tContent('variants.compositions.withResendButton.name'),
    description: tContent('variants.compositions.withResendButton.description'),
    useWhen: tContent('variants.compositions.withResendButton.use'),
    code: codeCompResend,
  },
]);

const compLabelValue = ref('');
const compHelpValue = ref('');
const compErrorValue = ref('123');
const compResendValue = ref('');

const stateItems = computed(() => [
  { label: tContent('states.empty.label'),    trigger: toPlainText(tContent('states.empty.trigger')),    behavior: toPlainText(tContent('states.empty.behavior')) },
  { label: tContent('states.filling.label'),  trigger: toPlainText(tContent('states.filling.trigger')),  behavior: toPlainText(tContent('states.filling.behavior')) },
  { label: tContent('states.complete.label'), trigger: toPlainText(tContent('states.complete.trigger')), behavior: toPlainText(tContent('states.complete.behavior')) },
  { label: tContent('states.disabled.label'), trigger: toPlainText(tContent('states.disabled.trigger')), behavior: toPlainText(tContent('states.disabled.behavior')) },
  { label: tContent('states.error.label'),    trigger: toPlainText(tContent('states.error.trigger')),    behavior: toPlainText(tContent('states.error.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const inputOtpPropItems = computed(() => [
  { name: 'maxLength',  type: tContent('props.table.maxLength.type'),  defaultValue: tContent('props.table.maxLength.default'),  required: tContent('props.table.maxLength.required'),  description: toPlainText(tContent('props.table.maxLength.description'))  },
  { name: 'value',      type: tContent('props.table.value.type'),      defaultValue: tContent('props.table.value.default'),      required: tContent('props.table.value.required'),      description: toPlainText(tContent('props.table.value.description'))      },
  { name: 'onChange',   type: tContent('props.table.onChange.type'),   defaultValue: tContent('props.table.onChange.default'),   required: tContent('props.table.onChange.required'),   description: toPlainText(tContent('props.table.onChange.description'))   },
  { name: 'onComplete', type: tContent('props.table.onComplete.type'), defaultValue: tContent('props.table.onComplete.default'), required: tContent('props.table.onComplete.required'), description: toPlainText(tContent('props.table.onComplete.description')) },
  { name: 'pattern',    type: tContent('props.table.pattern.type'),    defaultValue: tContent('props.table.pattern.default'),    required: tContent('props.table.pattern.required'),    description: toPlainText(tContent('props.table.pattern.description'))    },
  { name: 'disabled',   type: tContent('props.table.disabled.type'),   defaultValue: tContent('props.table.disabled.default'),   required: tContent('props.table.disabled.required'),   description: toPlainText(tContent('props.table.disabled.description'))   },
  { name: 'autoFocus',  type: tContent('props.table.autoFocus.type'),  defaultValue: tContent('props.table.autoFocus.default'),  required: tContent('props.table.autoFocus.required'),  description: toPlainText(tContent('props.table.autoFocus.description'))  },
]);

const tokenRows = computed(() => [
  { token: '--size-lg',       value: tContent('tokens.table.slotSize.class'),  description: tContent('tokens.table.slotSize.part')  },
  { token: '--input',           value: tContent('tokens.table.border.class'),    description: tContent('tokens.table.border.part')    },
  { token: '--radius',          value: tContent('tokens.table.rounded.class'),   description: tContent('tokens.table.rounded.part')   },
  { token: '--ring',            value: tContent('tokens.table.hover.class'),     description: tContent('tokens.table.hover.part')     },
  { token: '--ring',            value: tContent('tokens.table.active.class'),    description: tContent('tokens.table.active.part')    },
  { token: '--destructive',     value: tContent('tokens.table.invalid.class'),   description: tContent('tokens.table.invalid.part')   },
  { token: '—',                 value: tContent('tokens.table.disabled.class'),  description: tContent('tokens.table.disabled.part')  },
  { token: '--foreground',      value: tContent('tokens.table.caret.class'),     description: tContent('tokens.table.caret.part')     },
  { token: '--muted-foreground', value: tContent('tokens.table.separator.class'), description: tContent('tokens.table.separator.part') },
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
  { key: 'Tab',         description: toPlainText(tContent('accessibility.keyboard.tab'))       },
  { key: 'Arrow Left / Arrow Right',       description: toPlainText(tContent('accessibility.keyboard.arrows'))    },
  { key: 'Backspace',   description: toPlainText(tContent('accessibility.keyboard.backspace')) },
  { key: 'Ctrl/Cmd+V',  description: toPlainText(tContent('accessibility.keyboard.paste'))     },
  { key: '0-9 / A-Z',   description: toPlainText(tContent('accessibility.keyboard.digit'))     },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.input.name'),  description: toPlainText(tContent('related.items.input.description')),  path: '?path=/docs/primitives-form-input--docs'  },
  { name: tContent('related.items.form.name'),   description: toPlainText(tContent('related.items.form.description')),   path: '?path=/docs/primitives-form-form--docs'   },
  { name: tContent('related.items.label.name'),  description: toPlainText(tContent('related.items.label.description')),  path: '?path=/docs/primitives-form-label--docs'  },
  { name: tContent('related.items.button.name'), description: toPlainText(tContent('related.items.button.description')), path: '?path=/docs/primitives-form-button--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: 'otp_complete / otp_paste / otp_resend', trigger: stripHtml(tContent('analytics.description')), payload: "{ component: 'input-otp', location, length }" },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  action: toPlainText(tContent(`testes.functional.item${i}.action`)),
  result: toPlainText(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'             },
  { criterion: tContent('testes.accessibility.item2'), level: '1.3.5',  how: 'DevTools attribute'   },
  { criterion: tContent('testes.accessibility.item3'), level: '3.3.2',  how: 'Manual review'        },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2',  how: 'DevTools a11y tree'   },
  { criterion: tContent('testes.accessibility.item5'), level: '4.1.2',  how: 'DevTools attribute'   },
  { criterion: tContent('testes.accessibility.item6'), level: '1.4.3',  how: 'Contrast checker'     },
]);

const visualTestItems = computed(() => [1, 2, 3, 4, 5].map((i) => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="input-otp"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-grid nds-w-full"
        data-spacing="lg"
        style="--grid-min: 18rem"
      >
        <!-- 6 dígitos -->
        <div
          class="nds-stack nds-min-h-25"
          data-spacing="sm"
          style="contain: layout"
        >
          <p
            class="nds-text-caption nds-font-medium nds-text-muted-foreground"
            v-html="DOMPurify.sanitize(tContent('demonstration.labels.sixDigits'))"
          />
          <InputOTP
            v-model="demoSix"
            :max-length="6"
            autocomplete="one-time-code"
            inputmode="numeric"
            aria-label="Código de 6 dígitos"
          >
            <template #default="{ slots }">
              <InputOTPGroup>
                <InputOTPSlot
                  v-for="(slot, index) in slots"
                  :key="index"
                  :index="index"
                />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>

        <!-- 4 dígitos -->
        <div
          class="nds-stack nds-min-h-25"
          data-spacing="sm"
          style="contain: layout"
        >
          <p
            class="nds-text-caption nds-font-medium nds-text-muted-foreground"
            v-html="DOMPurify.sanitize(tContent('demonstration.labels.fourDigits'))"
          />
          <InputOTP
            v-model="demoFour"
            :max-length="4"
            inputmode="numeric"
            aria-label="PIN de 4 dígitos"
          >
            <template #default="{ slots }">
              <InputOTPGroup>
                <InputOTPSlot
                  v-for="(slot, index) in slots"
                  :key="index"
                  :index="index"
                />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>

        <!-- Com Separator -->
        <div
          class="nds-stack nds-min-h-25"
          data-spacing="sm"
          style="contain: layout"
        >
          <p
            class="nds-text-caption nds-font-medium nds-text-muted-foreground"
            v-html="DOMPurify.sanitize(tContent('demonstration.labels.withSeparator'))"
          />
          <InputOTP
            v-model="demoSep"
            :max-length="6"
            inputmode="numeric"
            aria-label="Código com separador"
          >
            <template #default>
              <InputOTPGroup>
                <InputOTPSlot :index="0" />
                <InputOTPSlot :index="1" />
                <InputOTPSlot :index="2" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot :index="3" />
                <InputOTPSlot :index="4" />
                <InputOTPSlot :index="5" />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>

        <!-- Alfanumérico -->
        <div
          class="nds-stack nds-min-h-25"
          data-spacing="sm"
          style="contain: layout"
        >
          <p
            class="nds-text-caption nds-font-medium nds-text-muted-foreground"
            v-html="DOMPurify.sanitize(tContent('demonstration.labels.alphanumeric'))"
          />
          <InputOTP
            v-model="demoAlpha"
            :max-length="6"
            inputmode="text"
            aria-label="Código alfanumérico"
          >
            <template #default="{ slots }">
              <InputOTPGroup>
                <InputOTPSlot
                  v-for="(slot, index) in slots"
                  :key="index"
                  :index="index"
                />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="anatomyStructure"
    />

    <!-- ── Quando Usar ──────────────────────────────────────────── -->
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
          { scenario: tContent('usage.scenarios.item1.s'), use: tContent('usage.scenarios.item1.u'), alternative: tContent('usage.scenarios.item1.a') },
          { scenario: tContent('usage.scenarios.item2.s'), use: tContent('usage.scenarios.item2.u'), alternative: tContent('usage.scenarios.item2.a') },
          { scenario: tContent('usage.scenarios.item3.s'), use: tContent('usage.scenarios.item3.u'), alternative: tContent('usage.scenarios.item3.a') },
          { scenario: tContent('usage.scenarios.item4.s'), use: tContent('usage.scenarios.item4.u'), alternative: tContent('usage.scenarios.item4.a') },
          { scenario: tContent('usage.scenarios.item5.s'), use: tContent('usage.scenarios.item5.u'), alternative: tContent('usage.scenarios.item5.a') },
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

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
            autocomplete="one-time-code"
          </div>
        </div>
      </template>
      <template #dont-preview-0>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-font-mono nds-text-muted-foreground nds-italic">
            sem autocomplete
          </div>
        </div>
      </template>
      <template #do-preview-1>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption">
            Label: Código de verificação
          </div>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-italic">
            (sem label)
          </div>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
            maxLength=6
          </div>
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
            maxLength=4
          </div>
        </div>
      </template>
      <template #variant-preview-2>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
            3 + Separator + 3
          </div>
        </div>
      </template>
      <template #variant-preview-3>
        <div
          style="contain: layout; min-height: 60px;"
          class="nds-w-full"
        >
          <div class="nds-text-caption nds-font-mono nds-text-muted-foreground">
            REGEXP_ONLY_DIGITS_AND_CHARS
          </div>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="input-otp"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="comp-label-otp">Código de verificação</Label>
          <InputOTP
            id="comp-label-otp"
            v-model="compLabelValue"
            :max-length="6"
            autocomplete="one-time-code"
            inputmode="numeric"
            aria-label="Código de verificação"
          >
            <template #default>
              <InputOTPGroup>
                <InputOTPSlot :index="0" />
                <InputOTPSlot :index="1" />
                <InputOTPSlot :index="2" />
                <InputOTPSlot :index="3" />
                <InputOTPSlot :index="4" />
                <InputOTPSlot :index="5" />
              </InputOTPGroup>
            </template>
          </InputOTP>
        </div>
      </template>

      <template #variant-preview-1>
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="comp-help-otp">Código de verificação</Label>
          <InputOTP
            id="comp-help-otp"
            v-model="compHelpValue"
            :max-length="6"
            autocomplete="one-time-code"
            inputmode="numeric"
            aria-describedby="comp-help-otp-text"
            aria-label="Código de verificação"
          >
            <template #default>
              <InputOTPGroup>
                <InputOTPSlot :index="0" />
                <InputOTPSlot :index="1" />
                <InputOTPSlot :index="2" />
                <InputOTPSlot :index="3" />
                <InputOTPSlot :index="4" />
                <InputOTPSlot :index="5" />
              </InputOTPGroup>
            </template>
          </InputOTP>
          <p
            id="comp-help-otp-text"
            class="nds-text-caption nds-text-muted-foreground"
          >
            Enviamos por SMS, expira em 5 min.
          </p>
        </div>
      </template>

      <template #variant-preview-2>
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="comp-err-otp">Código de verificação</Label>
          <InputOTP
            id="comp-err-otp"
            v-model="compErrorValue"
            :max-length="6"
            autocomplete="one-time-code"
            inputmode="numeric"
            aria-invalid="true"
            aria-describedby="comp-err-otp-text"
            aria-label="Código de verificação"
          >
            <template #default>
              <InputOTPGroup>
                <InputOTPSlot :index="0" />
                <InputOTPSlot :index="1" />
                <InputOTPSlot :index="2" />
                <InputOTPSlot :index="3" />
                <InputOTPSlot :index="4" />
                <InputOTPSlot :index="5" />
              </InputOTPGroup>
            </template>
          </InputOTP>
          <p
            id="comp-err-otp-text"
            class="nds-text-caption nds-text-destructive"
          >
            Código incorreto. Verifique e tente novamente.
          </p>
        </div>
      </template>

      <template #variant-preview-3>
        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <Label for="comp-resend-otp">Código de verificação</Label>
          <InputOTP
            id="comp-resend-otp"
            v-model="compResendValue"
            :max-length="6"
            autocomplete="one-time-code"
            inputmode="numeric"
            aria-label="Código de verificação"
          >
            <template #default>
              <InputOTPGroup>
                <InputOTPSlot :index="0" />
                <InputOTPSlot :index="1" />
                <InputOTPSlot :index="2" />
                <InputOTPSlot :index="3" />
                <InputOTPSlot :index="4" />
                <InputOTPSlot :index="5" />
              </InputOTPGroup>
            </template>
          </InputOTP>
          <div
            class="nds-cluster"
            data-spacing="sm"
            data-align="center"
            data-justify="between"
          >
            <p class="nds-text-caption nds-text-muted-foreground">
              Não recebeu?
            </p>
            <Button
              variant="link"
              size="sm"
            >
              Reenviar código
            </Button>
          </div>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'InputOTP', cols: propCols, items: inputOtpPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ───────────────────────────────────────────────── -->
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

    <!-- ── Acessibilidade ───────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: 'Evento',
        trigger: 'Quando dispara',
        payload: 'Payload',
      }"
      :items="analyticsItems"
    />

    <!-- ── Testes ───────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="{
        title: tContent('testes.functional.title'),
        cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
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
