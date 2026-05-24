<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import sheetTranslations from '@shared/content/sheet/translations.json';

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
const { t: tContent, locale } = useTranslation(sheetTranslations);

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
  componentSlug: 'sheet',
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
    component_name: 'sheet',
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
      { id: 'demonstracao', label: tContent('nav.demonstration') },
      { id: 'anatomia',     label: tContent('nav.anatomy')       },
      { id: 'quando-usar',  label: tContent('nav.usage')         },
      { id: 'do-dont',      label: tContent('nav.doDont')        },
    ],
  },
  {
    label: tNav('nav.techRef'),
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
    label: tNav('nav.context'),
    sections: [
      { id: 'acessibilidade', label: tContent('nav.accessibility') },
      { id: 'relacionados',   label: tContent('nav.related')       },
      { id: 'notas',          label: tContent('nav.notes')         },
    ],
  },
  {
    label: tNav('nav.quality'),
    sections: [
      { id: 'analytics', label: tContent('nav.analytics') },
      { id: 'testes',    label: tContent('nav.testes')    },
    ],
  },
]);

const allSectionIds = computed(() =>
  navGroups.value.flatMap((g) => g.sections.map((s) => s.id))
);



const { activeId: activeSection } = useActiveSection(allSectionIds, (id) => {
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'sheet',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";`;

const codeRight = `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Abrir filtros</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">Cancelar</Button>
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

const codeCustomizationTokens = `/* Em globals.css — override do Sheet via tokens */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --border: 240 5.9% 90%;
}

.dark {
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
}`;

const interfaceCode = `// Sheet (root) — repassa props do DialogRoot
interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  'onUpdate:open'?: (open: boolean) => void;
}

// SheetContent
interface SheetContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left'; // default 'right'
  showCloseButton?: boolean;                  // default true
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
  tContent('anatomy.item8'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.right'),  description: stripHtml(tContent('variants.styles.right')),  code: codeRight },
  { name: tContent('variants.items.left'),   description: stripHtml(tContent('variants.styles.left')),   code: codeRight.replace('"right"', '"left"') },
  { name: tContent('variants.items.top'),    description: stripHtml(tContent('variants.styles.top')),    code: codeRight.replace('"right"', '"top"') },
  { name: tContent('variants.items.bottom'), description: stripHtml(tContent('variants.styles.bottom')), code: codeRight.replace('"right"', '"bottom"') },
]);

const codeCompAdvancedFilters = `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Abrir filtros</Button>
  </SheetTrigger>
  <SheetContent side="right" class="w-[400px] sm:w-[420px]">
    <SheetHeader>
      <SheetTitle>Filtros avançados</SheetTitle>
      <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
    </SheetHeader>
    <form class="grid gap-4 px-4">
      <Label for="cat">Categoria</Label>
      <Input id="cat" default-value="Eletrônicos" />
      <Label for="min">Preço mínimo</Label>
      <Input id="min" type="number" default-value="100" />
    </form>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">Cancelar</Button>
      </SheetClose>
      <Button>Aplicar filtros</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

const codeCompSecondaryNav = `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Abrir menu</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
      <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
    </SheetHeader>
    <nav aria-label="Navegação secundária" class="flex flex-col gap-1 px-4">
      <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Dashboard</a>
      <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Projetos</a>
      <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Equipe</a>
    </nav>
  </SheetContent>
</Sheet>`;

const codeCompMobileActions = `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Mais opções</Button>
  </SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Ações rápidas</SheetTitle>
      <SheetDescription>Escolha o que fazer com este item.</SheetDescription>
    </SheetHeader>
    <div class="grid grid-cols-3 gap-3 px-4 text-sm">
      <button type="button" class="p-3 rounded-md border hover:bg-accent">Compartilhar</button>
      <button type="button" class="p-3 rounded-md border hover:bg-accent">Editar</button>
      <button type="button" class="p-3 rounded-md border hover:bg-accent">Excluir</button>
    </div>
  </SheetContent>
</Sheet>`;

const codeCompLongScroll = `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">Ler termos</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Termos de uso</SheetTitle>
      <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
    </SheetHeader>
    <div class="space-y-3 px-4 text-sm text-muted-foreground">
      <!-- parágrafos longos — body rola, footer fixo -->
    </div>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">Cancelar</Button>
      </SheetClose>
      <Button>Aceitar termos</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.advancedFilters.name'),
    description: tContent('variants.compositions.advancedFilters.description'),
    useWhen: tContent('variants.compositions.advancedFilters.use'),
    code: codeCompAdvancedFilters,
  },
  {
    name: tContent('variants.compositions.secondaryNavigation.name'),
    description: tContent('variants.compositions.secondaryNavigation.description'),
    useWhen: tContent('variants.compositions.secondaryNavigation.use'),
    code: codeCompSecondaryNav,
  },
  {
    name: tContent('variants.compositions.mobileActions.name'),
    description: tContent('variants.compositions.mobileActions.description'),
    useWhen: tContent('variants.compositions.mobileActions.use'),
    code: codeCompMobileActions,
  },
  {
    name: tContent('variants.compositions.longScrollBody.name'),
    description: tContent('variants.compositions.longScrollBody.description'),
    useWhen: tContent('variants.compositions.longScrollBody.use'),
    code: codeCompLongScroll,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),         trigger: '—', behavior: stripHtml(tContent('states.descriptions.closed'))         },
  { label: tContent('states.items.open'),           trigger: '—', behavior: stripHtml(tContent('states.descriptions.open'))           },
  { label: tContent('states.items.transitioning'),  trigger: '—', behavior: stripHtml(tContent('states.descriptions.transitioning')) },
  { label: tContent('states.items.focused'),        trigger: '—', behavior: stripHtml(tContent('states.descriptions.focused'))       },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const propRows = computed(() => [
  { name: 'open',            type: tContent('props.table.open.type'),            defaultValue: tContent('props.table.open.default'),            required: tContent('props.table.open.required'),            description: stripHtml(tContent('props.table.open.description'))            },
  { name: 'defaultOpen',     type: tContent('props.table.defaultOpen.type'),     defaultValue: tContent('props.table.defaultOpen.default'),     required: tContent('props.table.defaultOpen.required'),     description: stripHtml(tContent('props.table.defaultOpen.description'))     },
  { name: 'onUpdate:open',   type: tContent('props.table.onOpenChange.type'),    defaultValue: tContent('props.table.onOpenChange.default'),    required: tContent('props.table.onOpenChange.required'),    description: stripHtml(tContent('props.table.onOpenChange.description'))    },
  { name: 'side',            type: tContent('props.table.side.type'),            defaultValue: tContent('props.table.side.default'),            required: tContent('props.table.side.required'),            description: stripHtml(tContent('props.table.side.description'))            },
  { name: 'showCloseButton', type: tContent('props.table.showCloseButton.type'), defaultValue: tContent('props.table.showCloseButton.default'), required: tContent('props.table.showCloseButton.required'), description: stripHtml(tContent('props.table.showCloseButton.description')) },
  { name: 'class',           type: tContent('props.table.className.type'),       defaultValue: tContent('props.table.className.default'),       required: tContent('props.table.className.required'),       description: stripHtml(tContent('props.table.className.description'))       },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.popover.class'),           description: tContent('tokens.table.popover.part')           },
  { token: '--popover-foreground', value: tContent('tokens.table.popoverForeground.class'), description: tContent('tokens.table.popoverForeground.part') },
  { token: '--foreground',         value: tContent('tokens.table.foreground.class'),        description: tContent('tokens.table.foreground.part')        },
  { token: '--muted-foreground',   value: tContent('tokens.table.mutedForeground.class'),   description: tContent('tokens.table.mutedForeground.part')   },
  { token: '--border',             value: tContent('tokens.table.border.class'),            description: tContent('tokens.table.border.part')            },
  { token: '--ring',               value: tContent('tokens.table.ring.class'),              description: tContent('tokens.table.ring.part')              },
  { token: 'overlay',              value: tContent('tokens.table.overlay.class'),           description: tContent('tokens.table.overlay.part')           },
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

const keyboardItems = computed(() => [
  { key: 'Tab',       description: tContent('accessibility.keyboard.tab')      },
  { key: 'Shift+Tab', description: tContent('accessibility.keyboard.shiftTab') },
  { key: 'Enter',     description: tContent('accessibility.keyboard.enter')    },
  { key: 'Escape',    description: tContent('accessibility.keyboard.escape')   },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.drawer.name'),      description: tContent('related.items.drawer.description'),      path: '?path=/docs/ui-drawer--docs'      },
  { name: tContent('related.items.dialog.name'),      description: tContent('related.items.dialog.description'),      path: '?path=/docs/ui-dialog--docs'      },
  { name: tContent('related.items.alertDialog.name'), description: tContent('related.items.alertDialog.description'), path: '?path=/docs/ui-alertdialog--docs' },
  { name: tContent('related.items.popover.name'),     description: tContent('related.items.popover.description'),     path: '?path=/docs/ui-popover--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'dialog_open',    trigger: tContent('analytics.table.dialog_open.trigger'),    payload: tContent('analytics.table.dialog_open.payload')    },
  { event: 'dialog_close',   trigger: tContent('analytics.table.dialog_close.trigger'),   payload: tContent('analytics.table.dialog_close.payload')   },
  { event: 'dialog_confirm', trigger: tContent('analytics.table.dialog_confirm.trigger'), payload: tContent('analytics.table.dialog_confirm.payload') },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  action: tContent(`testes.functional.item${i}.action`),
  result: tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5].map((i) => ({
  criterion: tContent(`testes.accessibility.item${i}`),
  level: 'WCAG 2.1 AA',
  how: tNav('common.howToVerify'),
})));

const visualTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add sheet"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-center justify-center gap-4 w-full">
        <Sheet>
          <SheetTrigger as-child>
            <Button variant="outline">{{ tContent('demonstration.labels.trigger') }}</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.title') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <div class="grid gap-3 px-4">
              <Label for="demo-category">{{ tContent('demonstration.labels.section') }}</Label>
              <Input id="demo-category" />
            </div>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">{{ tContent('demonstration.labels.cancel') }}</Button>
              </SheetClose>
              <Button>{{ tContent('demonstration.labels.apply') }}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </DocsDemonstration>

    <!-- ── Anatomia ─────────────────────────────────────────────── -->
    <DocsAnatomy
      :title="tContent('anatomy.title')"
      :items="anatomyItems"
      :structure-label="tContent('anatomy.structureLabel')"
      :structure-code="tContent('anatomy.structureCode')"
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
          { element: tContent('usage.uxWriting.table.title.name'),       rules: tContent('usage.uxWriting.table.title.format'),       do: tContent('usage.uxWriting.table.title.good'),       dont: tContent('usage.uxWriting.table.title.bad')       },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.trigger.name'),     rules: tContent('usage.uxWriting.table.trigger.format'),     do: tContent('usage.uxWriting.table.trigger.good'),     dont: tContent('usage.uxWriting.table.trigger.bad')     },
          { element: tContent('usage.uxWriting.table.primary.name'),     rules: tContent('usage.uxWriting.table.primary.format'),     do: tContent('usage.uxWriting.table.primary.good'),     dont: tContent('usage.uxWriting.table.primary.bad')     },
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
          stripHtml(tContent('usage.dont.item1')),
          stripHtml(tContent('usage.dont.item2')),
          stripHtml(tContent('usage.dont.item3')),
          stripHtml(tContent('usage.dont.item4')),
        ],
      }"
    />

    <!-- ── Do & Don't ───────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="[
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <Sheet default-open :modal="false">
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Filtros avançados</SheetTitle>
              <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">Cancelar</Button>
              </SheetClose>
              <Button>Aplicar filtros</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #dont-preview-0>
        <Sheet default-open :modal="false">
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle class="sr-only">Sem título visível</SheetTitle>
              <SheetDescription class="sr-only">Sem descrição visível</SheetDescription>
            </SheetHeader>
            <div class="p-4 text-sm text-muted-foreground">Painel sem Title/Description visíveis — leitores de tela ficam sem contexto.</div>
            <SheetFooter>
              <Button>Aplicar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #do-preview-1>
        <Sheet default-open :modal="false">
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Filtros avançados</SheetTitle>
              <SheetDescription>Refine os resultados pelos filtros laterais.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </template>
      <template #dont-preview-1>
        <Sheet default-open :modal="false">
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>Filtros avançados</SheetTitle>
              <SheetDescription>Top fixo para filtros desktop costuma desorientar.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
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
        <Sheet default-open :modal="false">
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.rightLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">{{ tContent('demonstration.labels.cancel') }}</Button>
              </SheetClose>
              <Button>{{ tContent('demonstration.labels.apply') }}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #variant-preview-1>
        <Sheet default-open :modal="false">
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.leftLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </template>
      <template #variant-preview-2>
        <Sheet default-open :modal="false">
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.topLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </template>
      <template #variant-preview-3>
        <Sheet default-open :modal="false">
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.bottomLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="sheet"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout">
          <Sheet default-open :modal="false">
            <SheetContent side="right" class="w-[400px] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>Filtros avançados</SheetTitle>
                <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
              </SheetHeader>
              <form class="grid gap-3 px-4">
                <Label for="comp-cat">Categoria</Label>
                <Input id="comp-cat" default-value="Eletrônicos" />
                <Label for="comp-min">Preço mínimo</Label>
                <Input id="comp-min" type="number" default-value="100" />
              </form>
              <SheetFooter>
                <SheetClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </SheetClose>
                <Button>Aplicar filtros</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout">
          <Sheet default-open :modal="false">
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navegue entre as áreas do sistema.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Navegação secundária" class="flex flex-col gap-1 px-4">
                <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Dashboard</a>
                <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Projetos</a>
                <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Equipe</a>
                <a href="#" class="px-3 py-2 rounded-md text-sm hover:bg-accent">Configurações</a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout">
          <Sheet default-open :modal="false">
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Ações rápidas</SheetTitle>
                <SheetDescription>Escolha o que fazer com este item.</SheetDescription>
              </SheetHeader>
              <div class="grid grid-cols-3 gap-3 px-4 text-sm">
                <button type="button" class="p-3 rounded-md border hover:bg-accent">Compartilhar</button>
                <button type="button" class="p-3 rounded-md border hover:bg-accent">Editar</button>
                <button type="button" class="p-3 rounded-md border hover:bg-accent">Excluir</button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout">
          <Sheet default-open :modal="false">
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Termos de uso</SheetTitle>
                <SheetDescription>Leia atentamente antes de aceitar.</SheetDescription>
              </SheetHeader>
              <div class="space-y-3 px-4 text-sm text-muted-foreground max-h-64 overflow-auto">
                <p v-for="i in 12" :key="i">Parágrafo {{ i }}: termos de uso longos para garantir que o body precise rolar internamente sem expandir o painel.</p>
              </div>
              <SheetFooter>
                <SheetClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </SheetClose>
                <Button>Aceitar termos</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </template>
    </DocsCompositions>

    <!-- ── Estados ─────────────────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tNav('common.state'),
        trigger: tNav('common.userAction'),
        behavior: tNav('common.expectedResult'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.title'), cols: propCols, items: propRows },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibilityCode')"
    />

    <!-- ── Tokens ────────────────────────────────────────────────── -->
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

    <!-- ── Acessibilidade ───────────────────────────────────────── -->
    <DocsAccessibility
      :title="tContent('accessibility.title')"
      :summary="stripHtml(tContent('accessibility.summary'))"
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
