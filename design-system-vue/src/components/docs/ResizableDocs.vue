<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import resizableTranslations from '@shared/content/resizable/translations.json';

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(resizableTranslations);

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
  componentSlug: 'resizable',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/layout' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'resizable',
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
    component_name: 'resizable',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";`;

const codeHorizontal = `<ResizablePanelGroup direction="horizontal">
  <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
  <ResizablePanel :default-size="70" :min-size="50">
    <Conteudo />
  </ResizablePanel>
</ResizablePanelGroup>`;

const codeVertical = `<ResizablePanelGroup direction="vertical">
  <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
    <Topo />
  </ResizablePanel>
  <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
  <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
    <Rodape />
  </ResizablePanel>
</ResizablePanelGroup>`;

const codeNested = `<ResizablePanelGroup direction="horizontal">
  <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
    <Sidebar />
  </ResizablePanel>
  <ResizableHandle with-handle aria-label="Redimensionar sidebar — use setas" />
  <ResizablePanel :default-size="70" :min-size="50">
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel :default-size="60" :min-size="20">
        <Workspace />
      </ResizablePanel>
      <ResizableHandle with-handle aria-label="Redimensionar console — use setas" />
      <ResizablePanel :default-size="40" :min-size="20">
        <Console />
      </ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
</ResizablePanelGroup>`;

const codeCustomizationTokens = `/* Handle mais espesso para mobile */
[data-slot="resizable-handle"] {
  --handle-width: 3px;
}
[data-slot="resizable-handle"][aria-orientation="vertical"] {
  width: var(--handle-width);
}
[data-slot="resizable-handle"][aria-orientation="horizontal"] {
  height: var(--handle-width);
}`;

const interfaceCode = `// ResizablePanelGroup — props principais (reexpostas de reka-ui)
interface ResizablePanelGroupProps {
  direction: 'horizontal' | 'vertical';
  id?: string;
  class?: string;
}

// ResizablePanel
interface ResizablePanelProps {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  id?: string;
  order?: number;
  collapsible?: boolean;
}

// ResizableHandle
interface ResizableHandleProps {
  withHandle?: boolean;
  disabled?: boolean;
  id?: string;
  class?: string;
  'aria-label': string; // obrigatório
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.horizontal'), description: stripHtml(tContent('variants.styles.horizontal')), code: codeHorizontal },
  { name: tContent('variants.items.vertical'),   description: stripHtml(tContent('variants.styles.vertical')),   code: codeVertical   },
  { name: tContent('variants.items.nested'),     description: stripHtml(tContent('variants.styles.nested')),     code: codeNested     },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.idle'),     trigger: '—',                                                       behavior: stripHtml(tContent('states.descriptions.idle'))     },
  { label: tContent('states.items.hover'),    trigger: 'mouseover',                                               behavior: stripHtml(tContent('states.descriptions.hover'))    },
  { label: tContent('states.items.dragging'), trigger: 'mousedown + mousemove',                                   behavior: stripHtml(tContent('states.descriptions.dragging')) },
  { label: tContent('states.items.focus'),    trigger: 'Tab',                                                     behavior: stripHtml(tContent('states.descriptions.focus'))    },
  { label: tContent('states.items.disabled'), trigger: 'disabled',                                                behavior: stripHtml(tContent('states.descriptions.disabled')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const panelGroupPropItems = computed(() => [
  { name: 'direction',     type: tContent('props.table.direction.type'),     defaultValue: tContent('props.table.direction.default'),     required: tContent('props.table.direction.required'),     description: stripHtml(tContent('props.table.direction.description'))     },
  { name: 'id',            type: tContent('props.table.id.type'),            defaultValue: tContent('props.table.id.default'),            required: tContent('props.table.id.required'),            description: stripHtml(tContent('props.table.id.description'))            },
]);

const panelPropItems = computed(() => [
  { name: 'defaultSize',   type: tContent('props.table.defaultSize.type'),   defaultValue: tContent('props.table.defaultSize.default'),   required: tContent('props.table.defaultSize.required'),   description: stripHtml(tContent('props.table.defaultSize.description'))   },
  { name: 'minSize',       type: tContent('props.table.minSize.type'),       defaultValue: tContent('props.table.minSize.default'),       required: tContent('props.table.minSize.required'),       description: stripHtml(tContent('props.table.minSize.description'))       },
  { name: 'maxSize',       type: tContent('props.table.maxSize.type'),       defaultValue: tContent('props.table.maxSize.default'),       required: tContent('props.table.maxSize.required'),       description: stripHtml(tContent('props.table.maxSize.description'))       },
  { name: 'id',            type: tContent('props.table.id.type'),            defaultValue: tContent('props.table.id.default'),            required: tContent('props.table.id.required'),            description: stripHtml(tContent('props.table.id.description'))            },
]);

const handlePropItems = computed(() => [
  { name: 'withHandle',    type: tContent('props.table.withHandle.type'),    defaultValue: tContent('props.table.withHandle.default'),    required: tContent('props.table.withHandle.required'),    description: stripHtml(tContent('props.table.withHandle.description'))    },
  { name: 'aria-label',    type: 'string',                                   defaultValue: '—',                                            required: 'Sim',                                              description: stripHtml(tContent('usage.guidelines.item2'))                  },
]);

const tokenRows = computed(() => [
  { token: '--border',                value: tContent('tokens.table.border.class'),       description: tContent('tokens.table.border.part')       },
  { token: '--ring',                  value: tContent('tokens.table.ring.class'),         description: tContent('tokens.table.ring.part')         },
  { token: '--background',            value: tContent('tokens.table.background.class'),   description: tContent('tokens.table.background.part')   },
  { token: '--foreground',            value: tContent('tokens.table.foreground.class'),   description: tContent('tokens.table.foreground.part')   },
  { token: '--muted',                 value: tContent('tokens.table.muted.class'),        description: tContent('tokens.table.muted.part')        },
  { token: '--ring-offset-background', value: tContent('tokens.table.ringOffset.class'),  description: tContent('tokens.table.ringOffset.part')   },
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
  { key: 'ArrowLeft',   description: tContent('accessibility.keyboard.arrowLeft')  },
  { key: 'ArrowRight',  description: tContent('accessibility.keyboard.arrowRight') },
  { key: 'ArrowUp',     description: tContent('accessibility.keyboard.arrowUp')    },
  { key: 'ArrowDown',   description: tContent('accessibility.keyboard.arrowDown')  },
  { key: 'Home',        description: tContent('accessibility.keyboard.home')       },
  { key: 'End',         description: tContent('accessibility.keyboard.end')        },
  { key: 'Enter',       description: tContent('accessibility.keyboard.enter')      },
]);

const relatedItems = computed(() => [
  { name: 'ScrollArea',  description: tContent('related.items.scrollArea.description'),  path: '?path=/docs/ui-scrollarea--docs'  },
  { name: 'Sheet',       description: tContent('related.items.sheet.description'),       path: '?path=/docs/ui-sheet--docs'       },
  { name: 'Separator',   description: tContent('related.items.separator.description'),   path: '?path=/docs/ui-separator--docs'   },
  { name: 'AspectRatio', description: tContent('related.items.aspectRatio.description'), path: '?path=/docs/ui-aspectratio--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'panel_resize', trigger: tContent('analytics.table.panel_resize.trigger'), payload: tContent('analytics.table.panel_resize.payload') },
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
  { criterion: tContent('testes.accessibility.item1'), level: '4.1.2', how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item2'), level: '1.4.11', how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item3'), level: '2.4.7', how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2', how: tContent('testes.accessibility.description') },
  { criterion: tContent('testes.accessibility.item5'), level: '1.3.1', how: tContent('testes.accessibility.description') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
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
        install-note="npx shadcn-vue@latest add resizable"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="w-full h-[220px] min-h-[200px] rounded-md border overflow-hidden">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
                <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">
                  {{ tContent('demonstration.labels.sidebar') }}
                </div>
              </ResizablePanel>
              <ResizableHandle with-handle :aria-label="`${tContent('demonstration.labels.horizontal')} — use setas`" />
              <ResizablePanel :default-size="70" :min-size="50">
                <div class="flex h-full items-center justify-center p-4 text-sm">
                  {{ tContent('demonstration.labels.content') }}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <div class="w-full h-[220px] min-h-[200px] rounded-md border overflow-hidden">
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
                <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">
                  {{ tContent('demonstration.labels.top') }}
                </div>
              </ResizablePanel>
              <ResizableHandle with-handle :aria-label="`${tContent('demonstration.labels.vertical')} — use setas`" />
              <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
                <div class="flex h-full items-center justify-center p-4 text-sm">
                  {{ tContent('demonstration.labels.bottom') }}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
        <div class="w-full h-[280px] min-h-[240px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel :default-size="25" :min-size="15" :max-size="40">
              <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">
                {{ tContent('demonstration.labels.sidebar') }}
              </div>
            </ResizablePanel>
            <ResizableHandle with-handle :aria-label="`${tContent('demonstration.labels.nested')} — sidebar/conteúdo — use setas`" />
            <ResizablePanel :default-size="75" :min-size="50">
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel :default-size="65" :min-size="30">
                  <div class="flex h-full items-center justify-center p-4 text-sm">
                    {{ tContent('demonstration.labels.content') }}
                  </div>
                </ResizablePanel>
                <ResizableHandle with-handle :aria-label="`${tContent('demonstration.labels.nested')} — conteúdo/rodapé — use setas`" />
                <ResizablePanel :default-size="35" :min-size="20">
                  <div class="flex h-full items-center justify-center p-4 text-sm bg-muted">
                    {{ tContent('demonstration.labels.bottom') }}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
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
          rules:   tContent('usage.uxWriting.table.rules'),
          do:      tContent('usage.uxWriting.table.correct'),
          dont:    tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.ariaLabel.name'),  rules: tContent('usage.uxWriting.table.ariaLabel.format'),  do: tContent('usage.uxWriting.table.ariaLabel.good'),  dont: tContent('usage.uxWriting.table.ariaLabel.bad')  },
          { element: tContent('usage.uxWriting.table.panelLabel.name'), rules: tContent('usage.uxWriting.table.panelLabel.format'), do: tContent('usage.uxWriting.table.panelLabel.good'), dont: tContent('usage.uxWriting.table.panelLabel.bad') },
          { element: tContent('usage.uxWriting.table.size.name'),       rules: tContent('usage.uxWriting.table.size.format'),       do: stripHtml(tContent('usage.uxWriting.table.size.good')), dont: tContent('usage.uxWriting.table.size.bad') },
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <div class="w-full h-[200px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">Sidebar</div>
            </ResizablePanel>
            <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas" />
            <ResizablePanel :default-size="70" :min-size="50">
              <div class="flex h-full items-center justify-center p-3 text-xs">Conteúdo</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
      <template #dont-preview-0>
        <div class="w-full h-[200px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">Sidebar</div>
            </ResizablePanel>
            <ResizableHandle aria-label="Redimensionar painéis — use setas" />
            <ResizablePanel>
              <div class="flex h-full items-center justify-center p-3 text-xs">Conteúdo</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
      <template #do-preview-1>
        <div class="w-full h-[200px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel :default-size="40" :min-size="20" :max-size="60">
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">A</div>
            </ResizablePanel>
            <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
            <ResizablePanel :default-size="60" :min-size="40">
              <div class="flex h-full items-center justify-center p-3 text-xs">B</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
      <template #dont-preview-1>
        <div class="w-full h-[200px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel :default-size="40" :min-size="20" :max-size="60">
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">A</div>
            </ResizablePanel>
            <ResizableHandle with-handle aria-label="Handle" />
            <ResizablePanel :default-size="60" :min-size="40">
              <div class="flex h-full items-center justify-center p-3 text-xs">B</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :code="codeImportBasic"
    />

    <!-- ── Variantes ──────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems">
      <template #variant-preview-0>
        <div class="w-full h-[200px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">{{ tContent('demonstration.labels.left') }}</div>
            </ResizablePanel>
            <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas" />
            <ResizablePanel :default-size="70" :min-size="50">
              <div class="flex h-full items-center justify-center p-3 text-xs">{{ tContent('demonstration.labels.right') }}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
      <template #variant-preview-1>
        <div class="w-full h-[260px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">{{ tContent('demonstration.labels.top') }}</div>
            </ResizablePanel>
            <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas" />
            <ResizablePanel :default-size="50" :min-size="20" :max-size="80">
              <div class="flex h-full items-center justify-center p-3 text-xs">{{ tContent('demonstration.labels.bottom') }}</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
      <template #variant-preview-2>
        <div class="w-full h-[260px] min-h-[200px] rounded-md border overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel :default-size="30" :min-size="20" :max-size="50">
              <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">{{ tContent('demonstration.labels.sidebar') }}</div>
            </ResizablePanel>
            <ResizableHandle with-handle aria-label="Redimensionar sidebar — use setas" />
            <ResizablePanel :default-size="70" :min-size="50">
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel :default-size="60" :min-size="20">
                  <div class="flex h-full items-center justify-center p-3 text-xs">{{ tContent('demonstration.labels.content') }}</div>
                </ResizablePanel>
                <ResizableHandle with-handle aria-label="Redimensionar console — use setas" />
                <ResizablePanel :default-size="40" :min-size="20">
                  <div class="flex h-full items-center justify-center p-3 text-xs bg-muted">Console</div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Estados ──────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.title'),
        trigger: 'Trigger',
        behavior: tContent('props.table.description'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: 'ResizablePanelGroup', cols: propCols, items: panelGroupPropItems },
        { title: 'ResizablePanel',      cols: propCols, items: panelPropItems      },
        { title: 'ResizableHandle',     cols: propCols, items: handlePropItems     },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
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
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ───────────────────────────────────────────── -->
    <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

    <!-- ── Notas ──────────────────────────────────────────────────── -->
    <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

    <!-- ── Analytics ─────────────────────────────────────────────── -->
    <DocsAnalytics
      :title="tContent('analytics.title')"
      :cols="{
        event: tContent('analytics.table.event'),
        trigger: tContent('analytics.table.trigger'),
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
