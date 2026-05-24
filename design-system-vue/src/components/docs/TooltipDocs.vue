<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Save, Trash2, Share2, HelpCircle, Info } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/tooltip/translations.json';
import uiTranslations from '@/i18n/ui.json';

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

const { t: tContent, locale } = useTranslation(componentTranslations);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

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
  componentSlug: 'tooltip',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/overlay' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'tooltip',
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
      { id: 'composicoes',  label: tNav('nav.compositions') },
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
    component_name: 'tooltip',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";`;

const codeDefault = `<Tooltip>
  <TooltipTrigger as-child>
    <Button variant="ghost" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Salvar
  </TooltipContent>
</Tooltip>`;

const codeWithShortcut = `<Tooltip>
  <TooltipTrigger as-child>
    <Button variant="ghost" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Salvar <Kbd>Ctrl</Kbd>+<Kbd>S</Kbd>
  </TooltipContent>
</Tooltip>`;

const codeLongText = `<Tooltip>
  <TooltipTrigger as-child>
    <Button variant="ghost" size="icon" aria-label="Info">
      <Info aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent class="max-w-xs">
    Texto longo que ocupa até o tamanho máximo e quebra naturalmente.
  </TooltipContent>
</Tooltip>`;

const interfaceCode = `// Tooltip (reka-ui)
interface TooltipProviderProps {
  delayDuration?: number;     // default 0 (no UI lib é 700ms)
  disableHoverableContent?: boolean;
  skipDelayDuration?: number; // default 300
}

interface TooltipRootProps {
  open?: boolean;
  defaultOpen?: boolean;
}

interface TooltipContentProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  alignOffset?: number;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),       description: stripHtml(tContent('variants.styles.default')),       code: codeDefault       },
  { name: tContent('variants.items.withShortcut'),  description: stripHtml(tContent('variants.styles.withShortcut')),  code: codeWithShortcut  },
  { name: tContent('variants.items.longText'),      description: stripHtml(tContent('variants.styles.longText')),      code: codeLongText      },
]);

const codeCompIconShortcut = `<Tooltip>
  <TooltipTrigger as-child>
    <Button variant="ghost" size="icon" aria-label="Salvar">
      <Save aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    Salvar <Kbd>Ctrl</Kbd><Kbd>S</Kbd>
  </TooltipContent>
</Tooltip>`;

const codeCompFormHelp = `<div class="flex flex-col gap-2">
  <div class="flex items-center gap-2">
    <label for="api-token" class="text-sm font-medium">Token de API</label>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" aria-label="Ajuda sobre Token de API">
          <HelpCircle aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" class="max-w-xs">
        Cole o token gerado em Configurações &gt; Integrações.
      </TooltipContent>
    </Tooltip>
  </div>
  <input id="api-token" type="text" class="input w-64" placeholder="sk-..." />
</div>`;

const codeCompMetric = `<div class="flex flex-col gap-1">
  <div class="flex items-center gap-2">
    <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">LCP</p>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" aria-label="O que é LCP">
          <Info aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" class="max-w-xs">
        Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
      </TooltipContent>
    </Tooltip>
  </div>
  <p class="text-2xl font-semibold">1.8s</p>
</div>`;

const codeCompSides = `<div class="grid grid-cols-2 sm:grid-cols-4 gap-8 place-items-center">
  <Tooltip v-for="s in ['top','right','bottom','left']" :key="s">
    <TooltipTrigger as-child>
      <Button variant="outline">{{ s }}</Button>
    </TooltipTrigger>
    <TooltipContent :side="s">Tooltip {{ s }}</TooltipContent>
  </Tooltip>
</div>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.iconButtonWithShortcut.name'),
    description: tContent('variants.compositions.iconButtonWithShortcut.description'),
    useWhen: tContent('variants.compositions.iconButtonWithShortcut.use'),
    code: codeCompIconShortcut,
  },
  {
    name: tContent('variants.compositions.formFieldHelp.name'),
    description: tContent('variants.compositions.formFieldHelp.description'),
    useWhen: tContent('variants.compositions.formFieldHelp.use'),
    code: codeCompFormHelp,
  },
  {
    name: tContent('variants.compositions.metricDescription.name'),
    description: tContent('variants.compositions.metricDescription.description'),
    useWhen: tContent('variants.compositions.metricDescription.use'),
    code: codeCompMetric,
  },
  {
    name: tContent('variants.compositions.positioningSides.name'),
    description: tContent('variants.compositions.positioningSides.description'),
    useWhen: tContent('variants.compositions.positioningSides.use'),
    code: codeCompSides,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),  trigger: 'defaultOpen={false}', behavior: stripHtml(tContent('states.descriptions.closed'))  },
  { label: tContent('states.items.open'),    trigger: 'defaultOpen={true}',  behavior: stripHtml(tContent('states.descriptions.open'))    },
  { label: tContent('states.items.hover'),   trigger: 'mouseenter',          behavior: stripHtml(tContent('states.descriptions.hover'))   },
  { label: tContent('states.items.focus'),   trigger: 'Tab',                 behavior: stripHtml(tContent('states.descriptions.focus'))   },
  { label: tContent('states.items.delayed'), trigger: 'delayDuration > 0',   behavior: stripHtml(tContent('states.descriptions.delayed')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const tooltipPropItems = computed(() => [
  { name: 'delayDuration', type: tContent('props.table.delay.type'),        defaultValue: tContent('props.table.delay.default'),        required: tContent('props.table.delay.required'),        description: stripHtml(tContent('props.table.delay.description'))        },
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: stripHtml(tContent('props.table.open.description'))         },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: stripHtml(tContent('props.table.defaultOpen.description'))  },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: stripHtml(tContent('props.table.onOpenChange.description')) },
  { name: 'side',          type: tContent('props.table.side.type'),         defaultValue: tContent('props.table.side.default'),         required: tContent('props.table.side.required'),         description: stripHtml(tContent('props.table.side.description'))         },
  { name: 'align',         type: tContent('props.table.align.type'),        defaultValue: tContent('props.table.align.default'),        required: tContent('props.table.align.required'),        description: stripHtml(tContent('props.table.align.description'))        },
  { name: 'sideOffset',    type: tContent('props.table.sideOffset.type'),   defaultValue: tContent('props.table.sideOffset.default'),   required: tContent('props.table.sideOffset.required'),   description: stripHtml(tContent('props.table.sideOffset.description'))   },
  { name: 'class',         type: tContent('props.table.className.type'),    defaultValue: tContent('props.table.className.default'),    required: tContent('props.table.className.required'),    description: stripHtml(tContent('props.table.className.description'))    },
]);

const tokenRows = computed(() => [
  { token: '--foreground', value: tContent('tokens.table.foreground.class'), description: tContent('tokens.table.foreground.part') },
  { token: '--background', value: tContent('tokens.table.background.class'), description: tContent('tokens.table.background.part') },
  { token: '--foreground', value: tContent('tokens.table.fill.class'),       description: tContent('tokens.table.fill.part')       },
  { token: '--radius',     value: tContent('tokens.table.radius.class'),     description: tContent('tokens.table.radius.part')     },
  { token: 'z-index',      value: tContent('tokens.table.zIndex.class'),     description: tContent('tokens.table.zIndex.part')     },
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
  { key: 'Tab',       description: stripHtml(tContent('accessibility.keyboard.tab'))      },
  { key: 'Esc',       description: stripHtml(tContent('accessibility.keyboard.escape'))   },
  { key: 'Shift+Tab', description: stripHtml(tContent('accessibility.keyboard.shiftTab')) },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.popover.name'),   description: tContent('related.items.popover.description'),   path: '?path=/docs/ui-popover--docs'    },
  { name: tContent('related.items.hoverCard.name'), description: tContent('related.items.hoverCard.description'), path: '?path=/docs/ui-hovercard--docs'  },
  { name: tContent('related.items.button.name'),    description: tContent('related.items.button.description'),    path: '?path=/docs/ui-button--docs'     },
  { name: tContent('related.items.kbd.name'),       description: tContent('related.items.kbd.description'),       path: '?path=/docs/ui-kbd--docs'        },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'tooltip_view', trigger: stripHtml(tContent('analytics.table.tooltip_view.trigger')), payload: tContent('analytics.table.tooltip_view.payload') },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'           },
  { criterion: tContent('testes.accessibility.item2'), level: '1.4.3',  how: 'Contrast checker'   },
  { criterion: tContent('testes.accessibility.item3'), level: '4.1.2',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item4'), level: '1.3.1',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item5'), level: '4.1.2',  how: 'Manual review'      },
]);

const visualTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  story: tContent(`testes.visual.item${i}.story`),
  priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
})));

const a11yCritCols = computed(() => ({
  criterion: 'Critério',
  level: 'WCAG',
  how: 'Como verificar',
}));
</script>

<template>
  <TooltipProvider :delay-duration="50">
    <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="tooltip">
      <template #header>
        <DocsHeader
          :title="tContent('title')"
          :description="tContent('description')"
          :category="tContent('category')"
          :type="tContent('type')"
          install-note="npx shadcn-vue@latest add tooltip"
        />
      </template>

      <!-- ── Demonstração ─────────────────────────────────────────── -->
      <DocsDemonstration :title="tContent('demonstration.title')">
        <div class="flex flex-wrap items-center justify-center gap-6 w-full" style="contain: layout; min-height: 120px;">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="icon" :aria-label="tContent('demonstration.labels.saveButton')">
                <Save aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ tContent('demonstration.labels.save') }}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="icon" :aria-label="tContent('demonstration.labels.deleteButton')">
                <Trash2 aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ tContent('demonstration.labels.delete') }}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="icon" :aria-label="tContent('demonstration.labels.shareButton')">
                <Share2 aria-hidden="true" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ tContent('demonstration.labels.share') }}
            </TooltipContent>
          </Tooltip>
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
            stripHtml(tContent('usage.guidelines.item1')),
            stripHtml(tContent('usage.guidelines.item2')),
            stripHtml(tContent('usage.guidelines.item3')),
            stripHtml(tContent('usage.guidelines.item4')),
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
            { element: tContent('usage.uxWriting.table.content.name'),  rules: tContent('usage.uxWriting.table.content.format'),  do: tContent('usage.uxWriting.table.content.good'),  dont: tContent('usage.uxWriting.table.content.bad')  },
            { element: tContent('usage.uxWriting.table.shortcut.name'), rules: tContent('usage.uxWriting.table.shortcut.format'), do: tContent('usage.uxWriting.table.shortcut.good'), dont: tContent('usage.uxWriting.table.shortcut.bad') },
            { element: tContent('usage.uxWriting.table.icon.name'),     rules: tContent('usage.uxWriting.table.icon.format'),     do: tContent('usage.uxWriting.table.icon.good'),     dont: tContent('usage.uxWriting.table.icon.bad')     },
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
          { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
          { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
        ]"
      >
        <template #do-preview-0>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
            </Tooltip>
          </div>
        </template>
        <template #dont-preview-0>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="icon">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Salvar</TooltipContent>
            </Tooltip>
          </div>
        </template>
        <template #do-preview-1>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" class="gap-1">
                Salvar
                <Kbd>Ctrl</Kbd>
                <Kbd>S</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </template>
        <template #dont-preview-1>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <div class="text-xs font-mono text-muted-foreground italic max-w-[200px] text-center">
              "Clique aqui para salvar o documento e voltar à tela inicial."
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
      <DocsVariants :title="tContent('variants.title')" :items="variantItems">
        <template #variant-preview-0>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Salvar</TooltipContent>
            </Tooltip>
          </div>
        </template>
        <template #variant-preview-1>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" class="gap-1">
                Salvar
                <Kbd>Ctrl</Kbd>
                <Kbd>S</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </template>
        <template #variant-preview-2>
          <div style="contain: layout; min-height: 80px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline" size="icon" aria-label="Info">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" class="max-w-xs">
                Texto longo que ocupa até o tamanho máximo e quebra naturalmente em múltiplas linhas sem ser um parágrafo.
              </TooltipContent>
            </Tooltip>
          </div>
        </template>
      </DocsVariants>

      <!-- ── Composições ─────────────────────────────────────────── -->
      <DocsCompositions
        :title="tContent('variants.compositionsTitle')"
        :use-when-label="tNav('common.useWhen')"
        component-slug="tooltip"
        :items="compositionItems"
      >
        <template #variant-preview-0>
          <div style="contain: layout; min-height: 100px;" class="flex items-center justify-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="ghost" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" class="gap-1">
                Salvar
                <Kbd>Ctrl</Kbd>
                <Kbd>S</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </template>
        <template #variant-preview-1>
          <div style="contain: layout; min-height: 120px;" class="flex items-start justify-center w-full">
            <div class="flex flex-col gap-2 items-start">
              <div class="flex items-center gap-2">
                <label for="api-token-vue-comp" class="text-sm font-medium">Token de API</label>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" aria-label="Ajuda sobre Token de API">
                      <HelpCircle aria-hidden="true" class="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" class="max-w-xs">
                    Cole o token gerado em Configurações &gt; Integrações.
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                id="api-token-vue-comp"
                type="text"
                class="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                placeholder="sk-..."
              />
            </div>
          </div>
        </template>
        <template #variant-preview-2>
          <div style="contain: layout; min-height: 120px;" class="flex items-start justify-center w-full">
            <div class="flex flex-col gap-1 items-start">
              <div class="flex items-center gap-2">
                <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">LCP</p>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" aria-label="O que é LCP">
                      <Info aria-hidden="true" class="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" class="max-w-xs">
                    Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p class="text-2xl font-semibold">1.8s</p>
            </div>
          </div>
        </template>
        <template #variant-preview-3>
          <div style="contain: layout; min-height: 160px;" class="grid grid-cols-2 sm:grid-cols-4 gap-8 place-items-center w-full">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Top</Button>
              </TooltipTrigger>
              <TooltipContent side="top">Tooltip top</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Right</Button>
              </TooltipTrigger>
              <TooltipContent side="right">Tooltip right</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Bottom</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Tooltip bottom</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button variant="outline">Left</Button>
              </TooltipTrigger>
              <TooltipContent side="left">Tooltip left</TooltipContent>
            </Tooltip>
          </div>
        </template>
      </DocsCompositions>

      <!-- ── Estados ──────────────────────────────────────────────── -->
      <DocsStates
        :title="tContent('states.title')"
        :cols="{
          state: tContent('props.table.prop'),
          trigger: tContent('usage.scenarios.cols.scenario'),
          behavior: tContent('usage.scenarios.cols.use'),
        }"
        :items="stateItems"
      />

      <!-- ── Propriedades ─────────────────────────────────────────── -->
      <DocsProps
        :title="tContent('props.title')"
        :tables="[
          { title: 'Tooltip / TooltipProvider / TooltipContent', cols: propCols, items: tooltipPropItems },
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
        :title="tContent('accessibility.title')"
        :summary="tContent('accessibility.summary')"
        :items="accessibilityItems"
        :keyboard-title="tContent('accessibility.keyboard.title')"
        :keyboard-items="keyboardItems"
      />

      <!-- ── Relacionados ─────────────────────────────────────────── -->
      <DocsRelated :title="tContent('related.title')" :items="relatedItems" />

      <!-- ── Notas ────────────────────────────────────────────────── -->
      <DocsNotes :title="tContent('notes.title')" :items="noteItems" />

      <!-- ── Analytics ────────────────────────────────────────────── -->
      <DocsAnalytics
        :title="tContent('analytics.title')"
        :cols="{
          event: tContent('analytics.table.event'),
          trigger: tContent('analytics.table.trigger'),
          payload: tContent('analytics.table.payload'),
        }"
        :items="analyticsItems"
      />

      <!-- ── Testes ───────────────────────────────────────────────── -->
      <DocsTestes
        :title="tContent('testes.title')"
        :functional="{
          title: tContent('testes.functional.title'),
          cols: { action: 'Ação', result: 'Resultado esperado', priority: 'Prioridade' },
          items: functionalTestItems,
        }"
        :accessibility="{
          title: tContent('testes.accessibility.title'),
          cols: a11yCritCols,
          items: a11yTestItems,
        }"
        :visual="{
          title: tContent('testes.visual.title'),
          cols: { story: 'Story', priority: 'Prioridade' },
          items: visualTestItems,
        }"
      />
    </DocsPageLayout>
  </TooltipProvider>
</template>
