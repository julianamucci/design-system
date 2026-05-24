<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Calendar,
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from '@/components/ui/calendar';
import {
  RangeCalendar,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNextButton,
  RangeCalendarPrevButton,
} from '@/components/ui/range-calendar';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import calendarTranslations from '@shared/content/calendar/translations.json';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(calendarTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

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
  componentSlug: 'calendar',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'calendar',
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
    component_name: 'calendar',
    locale: locale.value,
  });
});
// ─── Locale mapping ───────────────────────────────────────────────────────────

const rekaLocale = computed(() => {
  switch (locale.value) {
    case 'pt-BR': return 'pt-BR';
    case 'es': return 'es-ES';
    default: return 'en-US';
  }
});

// ─── Fixed demo dates (determinístico para Chromatic) ─────────────────────────
// Usamos datas fixas em vez de `today()` para evitar instabilidade em screenshots
const demoAnchor = new CalendarDate(2026, 4, 15) as any;
const demoSelectedSingle = ref<any>(new CalendarDate(2026, 4, 12));
const demoSelectedMultiple = ref<any[]>([
  new CalendarDate(2026, 4, 8),
  new CalendarDate(2026, 4, 15),
  new CalendarDate(2026, 4, 22),
]);
const demoRangeStart = new CalendarDate(2026, 4, 10);
const demoRangeEnd = new CalendarDate(2026, 4, 18);

// `isDateDisabled` matcher — bloqueia datas passadas (antes do anchor)
function disablePastDates(date: any) {
  return date.compare(demoAnchor) < 0;
}

// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Calendar,
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from "@/components/ui/calendar";`;

const codeImportWithLocale = `import { Calendar } from "@/components/ui/calendar";
import { CalendarDate } from "@internationalized/date";

// \`locale\` é uma string; "pt-BR" controla meses e dias da semana
<Calendar locale="pt-BR" v-model="selected" />`;

const codeSingle = `<Calendar v-model="date" locale="pt-BR">
  <template #calendar-prev-icon><ChevronLeft class="size-4" /></template>
  <template #calendar-next-icon><ChevronRight class="size-4" /></template>
</Calendar>`;

const codeMultiple = `<Calendar v-model="dates" multiple locale="pt-BR" />`;

const codeRange = `<!-- Para intervalos, use RangeCalendar (componente dedicado) -->
<RangeCalendar v-model="range" locale="pt-BR" :number-of-months="2" />`;

const codeLayoutDropdown = `<!-- O Calendar Vue usa \`layout\` em vez de \`captionLayout\` -->
<Calendar layout="month-and-year" locale="pt-BR" v-model="date" />`;

const codeNumberOfMonths = `<Calendar :number-of-months="2" locale="pt-BR" v-model="date" />`;

const codeDisabled = `<Calendar
  locale="pt-BR"
  v-model="date"
  :is-date-disabled="(d) => d.compare(today(getLocalTimeZone())) < 0"
/>`;

const codeCustomizationTokens = `/* Tokens usados pelo Calendar (globals.css) */
:root {
  --radius-md: 0.375rem;   /* cantos das células         */
  --primary: ...;           /* fundo da data selecionada  */
  --primary-foreground: ...;
  --muted: ...;             /* hoje + meio do intervalo   */
  --muted-foreground: ...;  /* weekdays + outside days    */
}`;

const interfaceCode = `// Calendar (raiz — props reka-ui CalendarRootProps + extras do projeto)
interface CalendarProps {
  modelValue?: DateValue | DateValue[];   // v-model: single ou multiple
  multiple?: boolean;                      // habilita modelValue: DateValue[]
  locale?: string;                         // ex: "pt-BR", "en-US", "es-ES"
  numberOfMonths?: number;                 // quantos meses lado a lado
  minValue?: DateValue;
  maxValue?: DateValue;
  isDateDisabled?: (date: DateValue) => boolean;
  isDateUnavailable?: (date: DateValue) => boolean;
  disabled?: boolean;
  readonly?: boolean;
  fixedWeeks?: boolean;
  pagedNavigation?: boolean;
  preventDeselect?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  weekdayFormat?: 'narrow' | 'short' | 'long';
  calendarLabel?: string;
  initialFocus?: boolean;
  dir?: 'ltr' | 'rtl';
  placeholder?: DateValue;
  defaultPlaceholder?: DateValue;
  disableDaysOutsideCurrentView?: boolean;
  layout?: 'month-and-year' | 'month-only' | 'year-only';  // específico do projeto
  yearRange?: DateValue[];
  class?: string;
}

// CalendarCellTrigger (subcomponente com estilos por data-attr)
interface CalendarCellTriggerProps {
  day: DateValue;
  month: DateValue;
  as?: 'button' | string;
  class?: string;
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

const codeInlineBordered = `<Calendar v-model="date" locale="pt-BR" class="rounded-md border" />`;

const codeDisabledPast = `<Calendar
  v-model="date"
  locale="pt-BR"
  :is-date-disabled="disablePastDates"
/>`;

const codeRangeTwoMonths = `<RangeCalendar
  v-model="range"
  locale="pt-BR"
  :number-of-months="2"
  class="rounded-md border"
/>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.inlineBordered.name'),
    description: tContent('variants.compositions.inlineBordered.description'),
    useWhen: tContent('variants.compositions.inlineBordered.use'),
    code: codeInlineBordered,
  },
  {
    name: tContent('variants.compositions.disabledPast.name'),
    description: tContent('variants.compositions.disabledPast.description'),
    useWhen: tContent('variants.compositions.disabledPast.use'),
    code: codeDisabledPast,
  },
  {
    name: tContent('variants.compositions.rangeTwoMonths.name'),
    description: tContent('variants.compositions.rangeTwoMonths.description'),
    useWhen: tContent('variants.compositions.rangeTwoMonths.use'),
    code: codeRangeTwoMonths,
  },
]);

const variantItems = computed(() => [
  { name: 'single',          description: stripHtml(tContent('variants.items.single')),          code: codeSingle         },
  { name: 'multiple',        description: stripHtml(tContent('variants.items.multiple')),        code: codeMultiple       },
  { name: 'range',           description: stripHtml(tContent('variants.items.range')),           code: codeRange          },
  { name: 'layout=dropdown', description: stripHtml(tContent('variants.items.captionDropdown')), code: codeLayoutDropdown },
  { name: 'numberOfMonths',  description: stripHtml(tContent('variants.items.numberOfMonths')),  code: codeNumberOfMonths },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),     trigger: stripHtml(tContent('states.default.trigger')),     behavior: stripHtml(tContent('states.default.behavior'))     },
  { label: tContent('states.selected.label'),    trigger: stripHtml(tContent('states.selected.trigger')),    behavior: stripHtml(tContent('states.selected.behavior'))    },
  { label: tContent('states.disabled.label'),    trigger: stripHtml(tContent('states.disabled.trigger')),    behavior: stripHtml(tContent('states.disabled.behavior'))    },
  { label: tContent('states.today.label'),       trigger: stripHtml(tContent('states.today.trigger')),       behavior: stripHtml(tContent('states.today.behavior'))       },
  { label: tContent('states.outside.label'),     trigger: stripHtml(tContent('states.outside.trigger')),     behavior: stripHtml(tContent('states.outside.behavior'))     },
  { label: tContent('states.rangeMiddle.label'), trigger: stripHtml(tContent('states.rangeMiddle.trigger')), behavior: stripHtml(tContent('states.rangeMiddle.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

// API real do Calendar Vue (reka-ui CalendarRootProps + extras do projeto).
// Diverge do React: sem `mode`, sem `captionLayout`, sem `showOutsideDays`, sem `buttonVariant`.
const calendarPropItems = computed(() => [
  { name: 'modelValue',      type: 'DateValue | DateValue[]',                  defaultValue: '—',            required: 'Não', description: 'Valor controlado (v-model). DateValue[] quando multiple=true.' },
  { name: 'multiple',        type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Habilita seleção de várias datas (modelValue vira DateValue[]).' },
  { name: 'locale',          type: 'string',                                   defaultValue: '"en"',         required: 'Sim', description: stripHtml(tContent('props.table.locale')) },
  { name: 'numberOfMonths',  type: 'number',                                   defaultValue: '1',            required: 'Não', description: stripHtml(tContent('props.table.numberOfMonths')) },
  { name: 'isDateDisabled',  type: '(date: DateValue) => boolean',             defaultValue: '—',            required: 'Não', description: stripHtml(tContent('props.table.disabled')) },
  { name: 'isDateUnavailable', type: '(date: DateValue) => boolean',           defaultValue: '—',            required: 'Não', description: 'Marca a data como indisponível (linha riscada) sem desabilitar o foco.' },
  { name: 'minValue',        type: 'DateValue',                                defaultValue: '—',            required: 'Não', description: 'Data mínima selecionável.' },
  { name: 'maxValue',        type: 'DateValue',                                defaultValue: '—',            required: 'Não', description: 'Data máxima selecionável.' },
  { name: 'disabled',        type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Desabilita o calendário inteiro (não aceita foco nem clique).' },
  { name: 'readonly',        type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Foco permitido, seleção bloqueada.' },
  { name: 'fixedWeeks',      type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Força sempre 6 linhas de semana para altura estável.' },
  { name: 'weekStartsOn',    type: '0 | 1 | 2 | 3 | 4 | 5 | 6',                defaultValue: '0 (domingo)',  required: 'Não', description: 'Dia de início da semana.' },
  { name: 'weekdayFormat',   type: '"narrow" | "short" | "long"',              defaultValue: '"narrow"',     required: 'Não', description: 'Formato dos rótulos do cabeçalho de dias.' },
  { name: 'calendarLabel',   type: 'string',                                   defaultValue: '—',            required: 'Não', description: 'Rótulo acessível do calendário (aria-label).' },
  { name: 'initialFocus',    type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Move o foco para a data selecionada, hoje ou o primeiro dia ao montar.' },
  { name: 'pagedNavigation', type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Navegação pelos botões avança pelo número de meses exibidos.' },
  { name: 'preventDeselect', type: 'boolean',                                  defaultValue: 'false',        required: 'Não', description: 'Impede desselecionar sem escolher outra data.' },
  { name: 'disableDaysOutsideCurrentView', type: 'boolean',                    defaultValue: 'false',        required: 'Não', description: 'Equivalente inverso ao showOutsideDays do React — desabilita dias fora do mês.' },
  { name: 'layout',          type: '"month-and-year" | "month-only" | "year-only"', defaultValue: 'undefined', required: 'Não', description: 'Controla a legenda (texto padrão vs NativeSelect). Equivalente ao captionLayout do React.' },
  { name: 'yearRange',       type: 'DateValue[]',                              defaultValue: '-100..+10',    required: 'Não', description: 'Lista de anos disponíveis no dropdown (quando layout expõe ano).' },
  { name: 'dir',             type: '"ltr" | "rtl"',                            defaultValue: '"ltr"',        required: 'Não', description: 'Direção de leitura.' },
  { name: 'class',           type: 'string',                                   defaultValue: '—',            required: 'Não', description: stripHtml(tContent('props.table.className')) },
]);

const cellTriggerPropItems = computed(() => [
  { name: 'day',   type: 'DateValue', defaultValue: '—',        required: 'Sim', description: 'Data representada pela célula. Aplica data-attributes (data-selected, data-today, data-disabled, data-outside-view, data-unavailable).' },
  { name: 'month', type: 'DateValue', defaultValue: '—',        required: 'Sim', description: 'Primeira data do mês visível — permite detectar dias fora do mês.' },
  { name: 'as',    type: 'string',    defaultValue: '"button"', required: 'Não', description: 'Elemento HTML do botão (ex: "a" para links).' },
  { name: 'class', type: 'string',    defaultValue: '—',        required: 'Não', description: 'Classes Tailwind adicionais. O componente já aplica buttonVariants(ghost).' },
]);

const tokenRows = computed(() => [
  { token: '--primary',            value: 'bg-primary / text-primary-foreground', description: tContent('tokens.table.primary')         },
  { token: '--muted',              value: 'bg-accent / bg-muted',                  description: tContent('tokens.table.muted')           },
  { token: '--muted-foreground',   value: 'text-muted-foreground',                 description: tContent('tokens.table.mutedForeground') },
  { token: '--foreground',         value: 'text-foreground',                       description: tContent('tokens.table.foreground')      },
  { token: '--ring',               value: 'focus-visible:ring-ring/50',            description: tContent('tokens.table.ring')            },
  { token: '--radius-md',          value: '[--cell-radius:var(--radius-md)]',      description: stripHtml(tContent('tokens.table.cellRadius')) },
  { token: '--cell-size',          value: '[--cell-size:--spacing(7)]',            description: stripHtml(tContent('tokens.table.cellSize'))   },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
  tContent('accessibility.item6'),
]);

const keyboardItems = computed(() => [
  { key: 'Arrow',     description: stripHtml(tContent('accessibility.keyboard.arrows'))    },
  { key: 'PgUp/PgDn', description: stripHtml(tContent('accessibility.keyboard.pageUpDown')) },
  { key: 'Home/End',  description: stripHtml(tContent('accessibility.keyboard.homeEnd'))   },
  { key: 'Enter',     description: stripHtml(tContent('accessibility.keyboard.enter'))     },
  { key: 'Tab',       description: stripHtml(tContent('accessibility.keyboard.tab'))       },
]);

const relatedItems = computed(() => [
  { name: 'DatePicker', description: tContent('related.datePicker'), path: '?path=/docs/ui-datepicker--docs' },
  { name: 'Popover',    description: tContent('related.popover'),    path: '?path=/docs/ui-popover--docs'    },
  { name: 'Form',       description: tContent('related.form'),       path: '?path=/docs/ui-form--docs'       },
  { name: 'Input',      description: tContent('related.input'),      path: '?path=/docs/ui-input--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.fieldChange'),   trigger: tContent('analytics.table.fieldChangeTrigger'),   payload: tContent('analytics.table.fieldChangePayload')   },
  { event: tContent('analytics.table.dialogOpen'),    trigger: tContent('analytics.table.dialogOpenTrigger'),    payload: tContent('analytics.table.dialogOpenPayload')    },
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: stripHtml(tContent('testes.functional.item1.result')), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: stripHtml(tContent('testes.functional.item2.result')), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: stripHtml(tContent('testes.functional.item3.result')), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: stripHtml(tContent('testes.functional.item4.result')), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: stripHtml(tContent('testes.functional.item5.result')), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: stripHtml(tContent('testes.functional.item6.result')), priority: localPriority(tContent('testes.functional.item6.priority')) },
  { action: stripHtml(tContent('testes.functional.item7.action')), result: stripHtml(tContent('testes.functional.item7.result')), priority: localPriority(tContent('testes.functional.item7.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: stripHtml(tContent('testes.accessibility.item1.criterion')), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: stripHtml(tContent('testes.accessibility.item2.criterion')), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: stripHtml(tContent('testes.accessibility.item3.criterion')), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'),            level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
  { criterion: tContent('testes.accessibility.item5.criterion'),            level: tContent('testes.accessibility.item5.level'), how: tContent('testes.accessibility.item5.how') },
  { criterion: tContent('testes.accessibility.item6.criterion'),            level: tContent('testes.accessibility.item6.level'), how: tContent('testes.accessibility.item6.how') },
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add calendar"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-start justify-center gap-6">
        <Calendar
          v-model="demoSelectedSingle"
          :locale="rekaLocale"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ───────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
    />

    <!-- ── Quando Usar ────────────────────────────────────────────── -->
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
        cols: { scenario: tContent('usage.scenarios.cols.scenario'), use: tContent('usage.scenarios.cols.use'), alternative: tContent('usage.scenarios.cols.alternative') },
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
        cols: { element: tContent('usage.uxWriting.table.element'), rules: tContent('usage.uxWriting.table.rules'), do: tContent('usage.uxWriting.table.correct'), dont: tContent('usage.uxWriting.table.avoid') },
        items: [
          { element: tContent('usage.uxWriting.table.label.name'),    rules: tContent('usage.uxWriting.table.label.format'),    do: tContent('usage.uxWriting.table.label.good'),    dont: tContent('usage.uxWriting.table.label.bad') },
          { element: tContent('usage.uxWriting.table.trigger.name'),  rules: tContent('usage.uxWriting.table.trigger.format'),  do: tContent('usage.uxWriting.table.trigger.good'),  dont: tContent('usage.uxWriting.table.trigger.bad') },
          { element: tContent('usage.uxWriting.table.disabled.name'), rules: tContent('usage.uxWriting.table.disabled.format'), do: tContent('usage.uxWriting.table.disabled.good'), dont: tContent('usage.uxWriting.table.disabled.bad') },
          { element: tContent('usage.uxWriting.table.srOnly.name'),   rules: tContent('usage.uxWriting.table.srOnly.format'),   do: tContent('usage.uxWriting.table.srOnly.good'),   dont: tContent('usage.uxWriting.table.srOnly.bad') },
        ],
      }"
      :do="{ title: tContent('usage.do.title'), items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')] }"
      :dont="{ title: tContent('usage.dont.title'), items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3'), tContent('usage.dont.item4')] }"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #dont-preview-0>
        <Calendar
          v-model="demoSelectedSingle"
          locale="en-US"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #do-preview-1>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :placeholder="demoAnchor"
          :is-date-disabled="disablePastDates"
          class="rounded-md border"
        />
      </template>
      <template #dont-preview-1>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withLocale')"
      :secondary-code="codeImportWithLocale"
    />

    <!-- ── Variantes (Modos e Layouts) ────────────────────────────── -->
    <DocsVariants :title="tContent('variants.visualTitle') || 'Modos e Layouts'" :items="variantItems">
      <template #variant-preview-0>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #variant-preview-1>
        <Calendar
          v-model="demoSelectedMultiple"
          multiple
          locale="pt-BR"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #variant-preview-2>
        <RangeCalendar
          :default-value="{ start: demoRangeStart, end: demoRangeEnd }"
          locale="pt-BR"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #variant-preview-3>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          layout="month-and-year"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #variant-preview-4>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :number-of-months="2"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
    </DocsVariants>

    <!-- ── Composições ────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="calendar"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :placeholder="demoAnchor"
          class="rounded-md border"
        />
      </template>
      <template #variant-preview-1>
        <Calendar
          v-model="demoSelectedSingle"
          locale="pt-BR"
          :placeholder="demoAnchor"
          :is-date-disabled="disablePastDates"
          class="rounded-md border"
        />
      </template>
      <template #variant-preview-2>
        <RangeCalendar
          :default-value="{ start: demoRangeStart, end: demoRangeEnd }"
          locale="pt-BR"
          :placeholder="demoAnchor"
          :number-of-months="2"
          class="rounded-md border"
        />
      </template>
    </DocsCompositions>

    <!-- ── Estados ────────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{ state: tContent('states.cols.state'), trigger: tContent('states.cols.trigger'), behavior: tContent('states.cols.behavior') }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.calendarTitle'),  cols: propCols, items: calendarPropItems    },
        { title: 'CalendarCellTrigger',            cols: propCols, items: cellTriggerPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{ token: tContent('tokens.table.token'), value: tContent('tokens.table.class'), description: tContent('tokens.table.part') }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{ event: tContent('analytics.table.event'), trigger: tContent('analytics.table.trigger'), payload: tContent('analytics.table.payload') }"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
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
