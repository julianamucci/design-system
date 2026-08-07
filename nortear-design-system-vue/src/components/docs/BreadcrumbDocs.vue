<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { SlashIcon } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import breadcrumbTranslations from '@shared/content/breadcrumb/translations.json';

import DocsHeader        from '@/components/docs/shared/sections/DocsHeader.vue';
import DocsDemonstration from '@/components/docs/shared/sections/DocsDemonstration.vue';
import DocsAnatomy       from '@/components/docs/shared/sections/DocsAnatomy.vue';
import DocsWhenToUse     from '@/components/docs/shared/sections/DocsWhenToUse.vue';
import DocsDoDont        from '@/components/docs/shared/sections/DocsDoDont.vue';
import DocsImport        from '@/components/docs/shared/sections/DocsImport.vue';
import DocsVariants      from '@/components/docs/shared/sections/DocsVariants.vue';
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
const { t: tContent, locale } = useTranslation(breadcrumbTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (breadcrumbTranslations as unknown as Record<
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
  componentSlug: 'breadcrumb',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'breadcrumb',
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
    component_name: 'breadcrumb',
    locale: locale.value,
  });
});

// ─── Analytics — demo events ──────────────────────────────────────────────────

function handleDemoLinkClick(label: string) {
  track('navigation_click', {
    component: 'breadcrumb',
    label,
    destination: '#',
    location: 'docs_demo',
  });
}
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";`;

const codeImportWithEllipsis = `import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";`;

const codeDefault = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const codeWithEllipsis = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/componentes">Componentes</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const codeCustomSeparator = `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Início</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator>
      <SlashIcon />
    </BreadcrumbSeparator>
    <BreadcrumbItem>
      <BreadcrumbPage>Documentação</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`;

const codeResponsive = `<!-- Em mobile, envolva o Ellipsis em DropdownMenu -->
<BreadcrumbItem>
  <DropdownMenu>
    <DropdownMenuTrigger class="nds-cluster" data-spacing="xs">
      <BreadcrumbEllipsis />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem>Documentação</DropdownMenuItem>
      <DropdownMenuItem>Guias</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</BreadcrumbItem>`;

const codeCustomizationTokens = `/* globals.css — personalize as cores do Breadcrumb via tokens semânticos */
:root {
  --muted-foreground: 215 16% 47%;
  --foreground: 222 47% 11%;
  --ring: 222 84% 55%;
}

.dark {
  --muted-foreground: 215 20% 65%;
  --foreground: 210 40% 98%;
  --ring: 217 91% 60%;
}`;

const interfaceCode = `// Breadcrumb (nav)
interface BreadcrumbProps {
  class?: string;
}

// BreadcrumbLink aceita prop asChild para integração com routers
interface BreadcrumbLinkProps {
  href?: string;
  asChild?: boolean;
  class?: string;
}

// BreadcrumbSeparator aceita children para separador customizado
interface BreadcrumbSeparatorProps {
  class?: string;
}

// BreadcrumbEllipsis — indicador de níveis colapsados
interface BreadcrumbEllipsisProps {
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
  tContent('anatomy.item7'),
]);

const variantItems = computed(() => [
  { name: 'default',         description: stripHtml(tContent('variants.items.default')),         code: codeDefault        },
  { name: 'withEllipsis',    description: stripHtml(tContent('variants.items.withEllipsis')),    code: codeWithEllipsis   },
  { name: 'customSeparator', description: stripHtml(tContent('variants.items.customSeparator')), code: codeCustomSeparator },
  { name: 'responsive',      description: stripHtml(tContent('variants.items.responsive')),      code: codeResponsive     },
]);

const stateItems = computed(() => [
  { label: tContent('states.simple.label'),          trigger: toPlainText(tContent('states.simple.trigger')),          behavior: toPlainText(tContent('states.simple.behavior'))          },
  { label: tContent('states.asChildLink.label'),     trigger: toPlainText(tContent('states.asChildLink.trigger')),     behavior: toPlainText(tContent('states.asChildLink.behavior'))     },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const breadcrumbPropItems = computed(() => [
  { name: 'class',    type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const listPropItems = computed(() => [
  { name: 'class',    type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const itemPropItems = computed(() => [
  { name: 'class',    type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const linkPropItems = computed(() => [
  { name: 'href',     type: 'string',  defaultValue: '—',      required: 'Sim', description: toPlainText(tContent('props.table.href'))    },
  { name: 'asChild',  type: 'boolean', defaultValue: 'false',  required: 'Não', description: toPlainText(tContent('props.table.asChild')) },
  { name: 'class',    type: 'string',  defaultValue: '—',      required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const pagePropItems = computed(() => [
  { name: 'class',    type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const separatorPropItems = computed(() => [
  { name: 'class',        type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode',  defaultValue: 'ChevronRightIcon', required: 'Não', description: tContent('props.table.children') },
]);

const ellipsisPropItems = computed(() => [
  { name: 'class', type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
]);

const tokenRows = computed(() => [
  { token: '--muted-foreground', value: 'nds-text-muted-foreground', description: tContent('tokens.table.mutedForeground') },
  { token: '--foreground',       value: 'nds-hover-text-foreground', description: tContent('tokens.table.foreground')      },
  { token: '--ring',             value: 'nds-focus-ring', description: tContent('tokens.table.ring')          },
  { token: '—',                  value: 'text-sm',               description: tContent('tokens.table.textSm')          },
  { token: '—',                  value: 'gap-1.5',               description: tContent('tokens.table.gap')             },
  { token: '—',                  value: '[&>svg]:size-3.5',      description: tContent('tokens.table.sizeSeparator')   },
  { token: '—',                  value: 'size-5',                description: tContent('tokens.table.sizeEllipsis')    },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',       description: tContent('accessibility.keyboard.tab')      },
  { key: 'Enter',     description: tContent('accessibility.keyboard.enter')    },
  { key: 'Shift+Tab', description: tContent('accessibility.keyboard.shiftTab') },
]);

const relatedItems = computed(() => [
  { name: 'NavigationMenu', description: toPlainText(tContent('related.navigationMenu')), path: '?path=/docs/ui-navigationmenu--docs' },
  { name: 'Stepper',        description: toPlainText(tContent('related.stepper')),        path: '?path=/docs/ui-stepper--docs'        },
  { name: 'Tabs',           description: toPlainText(tContent('related.tabs')),           path: '?path=/docs/ui-tabs--docs'           },
  { name: 'DropdownMenu',   description: toPlainText(tContent('related.dropdownMenu')),   path: '?path=/docs/ui-dropdownmenu--docs'   },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.navigationClick'), trigger: toPlainText(tContent('analytics.table.navigationClickTrigger')), payload: tContent('analytics.table.navigationClickPayload') },
  { event: tContent('analytics.table.ellipsisOpen'),    trigger: toPlainText(tContent('analytics.table.ellipsisOpenTrigger')),    payload: tContent('analytics.table.ellipsisOpenPayload')    },
  { event: tContent('analytics.table.pageView'),        trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),                   payload: tContent('analytics.table.pageViewPayload')        },
  { event: tContent('analytics.table.sectionViewed'),   trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')),              payload: tContent('analytics.table.sectionViewedPayload')   },
  { event: tContent('analytics.table.langSwitch'),      trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),                 payload: tContent('analytics.table.langSwitchPayload')      },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

const functionalTestItems = computed(() => [
  { action: tContent('testes.functional.item1.action'), result: toPlainText(tContent('testes.functional.item1.result')), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: toPlainText(tContent('testes.functional.item2.result')), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: toPlainText(tContent('testes.functional.item3.result')), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: toPlainText(tContent('testes.functional.item4.result')), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: toPlainText(tContent('testes.functional.item5.result')), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: toPlainText(tContent('testes.functional.item6.result')), priority: localPriority(tContent('testes.functional.item6.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: toPlainText(tContent('testes.accessibility.item1.criterion')), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: toPlainText(tContent('testes.accessibility.item2.criterion')), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: toPlainText(tContent('testes.accessibility.item3.criterion')), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'),            level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
  { criterion: tContent('testes.accessibility.item5.criterion'),            level: tContent('testes.accessibility.item5.level'), how: toPlainText(tContent('testes.accessibility.item5.how')) },
  { criterion: tContent('testes.accessibility.item6.criterion'),            level: tContent('testes.accessibility.item6.level'), how: tContent('testes.accessibility.item6.how') },
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
    component-slug="breadcrumb"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="nds-w-full">
        <Breadcrumb :aria-label="tContent('demonstration.title')">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                @click="handleDemoLinkClick(tContent('demonstration.labels.home'))"
              >
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                @click="handleDemoLinkClick(tContent('demonstration.labels.components'))"
              >
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                @click="handleDemoLinkClick(tContent('demonstration.labels.navigation'))"
              >
                {{ tContent('demonstration.labels.navigation') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
          { element: tContent('usage.uxWriting.table.link.name'), rules: toPlainText(tContent('usage.uxWriting.table.link.format')), do: tContent('usage.uxWriting.table.link.good'), dont: tContent('usage.uxWriting.table.link.bad') },
          { element: tContent('usage.uxWriting.table.page.name'), rules: toPlainText(tContent('usage.uxWriting.table.page.format')), do: toPlainText(tContent('usage.uxWriting.table.page.good')), dont: tContent('usage.uxWriting.table.page.bad') },
          { element: tContent('usage.uxWriting.table.separator.name'), rules: toPlainText(tContent('usage.uxWriting.table.separator.format')), do: toPlainText(tContent('usage.uxWriting.table.separator.good')), dont: tContent('usage.uxWriting.table.separator.bad') },
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

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <Breadcrumb :aria-label="stripHtml(tContent('doDont.pair1.do'))">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
      <template #dont-preview-0>
        <Breadcrumb :aria-label="toPlainText(tContent('doDont.pair1.dont'))">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.breadcrumb') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
      <template #do-preview-1>
        <Breadcrumb :aria-label="stripHtml(tContent('doDont.pair2.do'))">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
      <template #dont-preview-1>
        <Breadcrumb :aria-label="stripHtml(tContent('doDont.pair2.dont'))">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.docs') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.guide') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.navigation') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withEllipsis')"
      :secondary-code="codeImportWithEllipsis"
    />

    <!-- ── Variantes (Configurações Disponíveis) ───────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <Breadcrumb
          class="nds-w-full"
          aria-label="default"
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
      <template #variant-preview-1>
        <Breadcrumb
          class="nds-w-full"
          aria-label="withEllipsis"
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.components') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
      <template #variant-preview-2>
        <Breadcrumb
          class="nds-w-full"
          aria-label="customSeparator"
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.docs') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
      <template #variant-preview-3>
        <Breadcrumb
          class="nds-w-full"
          aria-label="responsive"
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                {{ tContent('demonstration.labels.home') }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ tContent('demonstration.labels.breadcrumb') }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </template>
    </DocsVariants>

    <!-- ── Configurações (States) ──────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.breadcrumbTitle'), cols: propCols, items: breadcrumbPropItems },
        { title: tContent('props.listTitle'), cols: propCols, items: listPropItems },
        { title: tContent('props.itemTitle'), cols: propCols, items: itemPropItems },
        { title: tContent('props.linkTitle'), cols: propCols, items: linkPropItems },
        { title: tContent('props.pageTitle'), cols: propCols, items: pagePropItems },
        { title: tContent('props.separatorTitle'), cols: propCols, items: separatorPropItems },
        { title: tContent('props.ellipsisTitle'), cols: propCols, items: ellipsisPropItems },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="{
        token: tContent('tokens.table.token'),
        value: tContent('tokens.table.class'),
        description: tContent('tokens.table.part'),
      }"
      :items="tokenRows"
      :customization-title="tContent('tokens.customizationTitle')"
      :customization-code="codeCustomizationTokens"
    />

    <!-- ── Acessibilidade ─────────────────────────────────────────── -->
    <DocsAccessibility
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboardTitle')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
        payload: tContent('analytics.table.payload'),
      }"
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
