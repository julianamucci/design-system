<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/popover/translations.json';
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
  componentSlug: 'popover',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent') as 'informational' | 'navigational',
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Overlay', item: '/components/overlay' },
    { name: 'Popover' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'popover',
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
    component_name: 'popover',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";`;

const codeDefault = `<Popover>
  <PopoverTrigger as-child>
    <Button>Abrir popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Conteúdo livre.</p>
  </PopoverContent>
</Popover>`;

const codeWithTitle = `<Popover>
  <PopoverTrigger as-child>
    <Button>Configurações</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Configurações de exibição</PopoverTitle>
      <PopoverDescription>Ajuste a aparência do conteúdo.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`;

const codeForm = `<Popover>
  <PopoverTrigger as-child>
    <Button>Editar perfil</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Editar perfil</PopoverTitle>
    </PopoverHeader>
    <form class="grid gap-2">
      <Label for="name">Nome</Label>
      <Input id="name" />
      <Label for="email">Email</Label>
      <Input id="email" type="email" />
      <Button type="submit">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`;

const interfaceCode = `// Popover (reka-ui)
interface PopoverRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
}

interface PopoverContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left';
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
  tContent('anatomy.item5'),
  tContent('anatomy.item6'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.default'),   description: stripHtml(tContent('variants.styles.default')),   code: codeDefault   },
  { name: tContent('variants.items.withTitle'), description: stripHtml(tContent('variants.styles.withTitle')), code: codeWithTitle },
  { name: tContent('variants.items.form'),      description: stripHtml(tContent('variants.styles.form')),      code: codeForm      },
]);

const codeEditProfile = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Editar perfil</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Dados do perfil</PopoverTitle>
      <PopoverDescription>As mudanças são salvas ao confirmar.</PopoverDescription>
    </PopoverHeader>
    <form class="space-y-3" @submit.prevent>
      <div class="space-y-1">
        <Label for="pc-name">Nome</Label>
        <Input id="pc-name" model-value="Joana Silva" />
      </div>
      <div class="space-y-1">
        <Label for="pc-email">Email</Label>
        <Input id="pc-email" type="email" model-value="joana@example.com" />
      </div>
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>
</Popover>`;

const codeTableFilter = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Filtrar por status</PopoverTitle>
    </PopoverHeader>
    <div class="space-y-2">
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" checked /> Ativo
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" /> Pendente
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" /> Arquivado
      </label>
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>
  </PopoverContent>
</Popover>`;

const codeColorPicker = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Cor</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Selecionar cor</PopoverTitle>
    </PopoverHeader>
    <div class="grid grid-cols-6 gap-2">
      <button type="button" aria-label="Vermelho" class="h-6 w-6 rounded-full ring-1 ring-foreground/10 bg-red-500" />
      <button type="button" aria-label="Laranja"  class="h-6 w-6 rounded-full ring-1 ring-foreground/10 bg-orange-500" />
      <button type="button" aria-label="Amarelo"  class="h-6 w-6 rounded-full ring-1 ring-foreground/10 bg-yellow-500" />
      <button type="button" aria-label="Verde"    class="h-6 w-6 rounded-full ring-1 ring-foreground/10 bg-green-500" />
      <button type="button" aria-label="Azul"     class="h-6 w-6 rounded-full ring-1 ring-foreground/10 bg-blue-500" />
      <button type="button" aria-label="Roxo"     class="h-6 w-6 rounded-full ring-1 ring-foreground/10 bg-purple-500" />
    </div>
  </PopoverContent>
</Popover>`;

const codeQuickSettings = `<Popover>
  <PopoverTrigger as-child>
    <Button variant="outline">Configurações</Button>
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Preferências rápidas</PopoverTitle>
    </PopoverHeader>
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <Label for="cfg-notifs">Notificações</Label>
        <input id="cfg-notifs" type="checkbox" checked class="h-4 w-4" />
      </div>
      <div class="flex items-center justify-between gap-3">
        <Label for="cfg-dark">Modo escuro</Label>
        <input id="cfg-dark" type="checkbox" class="h-4 w-4" />
      </div>
      <div class="flex items-center justify-between gap-3">
        <Label for="cfg-compact">Modo compacto</Label>
        <input id="cfg-compact" type="checkbox" class="h-4 w-4" />
      </div>
    </div>
  </PopoverContent>
</Popover>`;

const compositionItems = computed(() => [
  { name: tContent('variants.compositions.editProfile.name'),   description: tContent('variants.compositions.editProfile.description'),   useWhen: tContent('variants.compositions.editProfile.use'),   code: codeEditProfile   },
  { name: tContent('variants.compositions.tableFilter.name'),   description: tContent('variants.compositions.tableFilter.description'),   useWhen: tContent('variants.compositions.tableFilter.use'),   code: codeTableFilter   },
  { name: tContent('variants.compositions.colorPicker.name'),   description: tContent('variants.compositions.colorPicker.description'),   useWhen: tContent('variants.compositions.colorPicker.use'),   code: codeColorPicker   },
  { name: tContent('variants.compositions.quickSettings.name'), description: tContent('variants.compositions.quickSettings.description'), useWhen: tContent('variants.compositions.quickSettings.use'), code: codeQuickSettings },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),         trigger: 'defaultOpen={false}', behavior: stripHtml(tContent('states.descriptions.closed'))         },
  { label: tContent('states.items.open'),           trigger: 'defaultOpen={true}',  behavior: stripHtml(tContent('states.descriptions.open'))           },
  { label: tContent('states.items.transitioning'),  trigger: 'data-open/closed',    behavior: stripHtml(tContent('states.descriptions.transitioning')) },
  { label: tContent('states.items.focused'),        trigger: 'Tab',                 behavior: stripHtml(tContent('states.descriptions.focused'))       },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const popoverRootPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: stripHtml(tContent('props.table.open.description'))         },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: stripHtml(tContent('props.table.defaultOpen.description'))  },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: stripHtml(tContent('props.table.onOpenChange.description')) },
  { name: 'modal',         type: tContent('props.table.modal.type'),        defaultValue: tContent('props.table.modal.default'),        required: tContent('props.table.modal.required'),        description: stripHtml(tContent('props.table.modal.description'))        },
]);

const popoverContentPropItems = computed(() => [
  { name: 'side',       type: tContent('props.table.side.type'),       defaultValue: tContent('props.table.side.default'),       required: tContent('props.table.side.required'),       description: stripHtml(tContent('props.table.side.description'))       },
  { name: 'align',      type: tContent('props.table.align.type'),      defaultValue: tContent('props.table.align.default'),      required: tContent('props.table.align.required'),      description: stripHtml(tContent('props.table.align.description'))      },
  { name: 'sideOffset', type: tContent('props.table.sideOffset.type'), defaultValue: tContent('props.table.sideOffset.default'), required: tContent('props.table.sideOffset.required'), description: stripHtml(tContent('props.table.sideOffset.description')) },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.popover.class'),           description: tContent('tokens.table.popover.part')           },
  { token: '--popover-foreground', value: tContent('tokens.table.popoverForeground.class'), description: tContent('tokens.table.popoverForeground.part') },
  { token: '--muted-foreground',   value: tContent('tokens.table.mutedForeground.class'),   description: tContent('tokens.table.mutedForeground.part')   },
  { token: '--border',             value: tContent('tokens.table.border.class'),            description: tContent('tokens.table.border.part')            },
  { token: 'shadow',               value: tContent('tokens.table.shadow.class'),            description: tContent('tokens.table.shadow.part')            },
  { token: '--ring',               value: tContent('tokens.table.ring.class'),              description: tContent('tokens.table.ring.part')              },
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
  { key: 'Shift+Tab', description: stripHtml(tContent('accessibility.keyboard.shiftTab')) },
  { key: 'Esc',       description: stripHtml(tContent('accessibility.keyboard.escape'))   },
  { key: 'Enter',     description: stripHtml(tContent('accessibility.keyboard.enter'))    },
  { key: 'Space',     description: stripHtml(tContent('accessibility.keyboard.space'))    },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.tooltip.name'),      description: tContent('related.items.tooltip.description'),      path: '?path=/docs/ui-tooltip--docs'      },
  { name: tContent('related.items.dropdownMenu.name'), description: tContent('related.items.dropdownMenu.description'), path: '?path=/docs/ui-dropdownmenu--docs' },
  { name: tContent('related.items.dialog.name'),       description: tContent('related.items.dialog.description'),       path: '?path=/docs/ui-dialog--docs'       },
  { name: tContent('related.items.hoverCard.name'),    description: tContent('related.items.hoverCard.description'),    path: '?path=/docs/ui-hovercard--docs'    },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'popover_open',  trigger: stripHtml(tContent('analytics.table.popover_open.trigger')),  payload: tContent('analytics.table.popover_open.payload')  },
  { event: 'popover_close', trigger: stripHtml(tContent('analytics.table.popover_close.trigger')), payload: tContent('analytics.table.popover_close.payload') },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',     how: 'axe-core'           },
  { criterion: tContent('testes.accessibility.item2'), level: '1.4.3',  how: 'Contrast checker'   },
  { criterion: tContent('testes.accessibility.item3'), level: '2.4.7',  how: 'Keyboard test'      },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2',  how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item5'), level: '4.1.2',  how: 'DevTools a11y tree' },
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="popover">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add popover"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <!-- Default -->
        <div class="space-y-2 flex flex-col items-start" style="contain: layout; min-height: 220px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('variants.items.default'))" />
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">{{ tContent('demonstration.labels.trigger') }}</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverTitle class="text-sm font-medium">{{ tContent('demonstration.labels.title') }}</PopoverTitle>
              <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.description') }}</p>
            </PopoverContent>
          </Popover>
        </div>

        <!-- With title and actions -->
        <div class="space-y-2 flex flex-col items-start" style="contain: layout; min-height: 220px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('variants.items.withTitle'))" />
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">{{ tContent('demonstration.labels.title') }}</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle class="text-sm font-medium">{{ tContent('demonstration.labels.title') }}</PopoverTitle>
                <PopoverDescription class="text-xs text-muted-foreground">
                  {{ tContent('demonstration.labels.description') }}
                </PopoverDescription>
              </PopoverHeader>
              <div class="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm">{{ tContent('demonstration.labels.cancel') }}</Button>
                <Button size="sm">{{ tContent('demonstration.labels.save') }}</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <!-- Form -->
        <div class="space-y-2 flex flex-col items-start" style="contain: layout; min-height: 260px; position: relative;">
          <p class="text-xs font-medium text-muted-foreground" v-html="sanitizeHtml(tContent('variants.items.form'))" />
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">{{ tContent('demonstration.labels.form.trigger') }}</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle class="text-sm font-medium">{{ tContent('demonstration.labels.form.trigger') }}</PopoverTitle>
              </PopoverHeader>
              <form class="grid gap-2" @submit.prevent>
                <Label for="popover-demo-name" class="text-xs">{{ tContent('demonstration.labels.form.name') }}</Label>
                <Input id="popover-demo-name" />
                <Label for="popover-demo-email" class="text-xs">{{ tContent('demonstration.labels.form.email') }}</Label>
                <Input id="popover-demo-email" type="email" />
                <Button type="submit" size="sm">{{ tContent('demonstration.labels.form.submit') }}</Button>
              </form>
            </PopoverContent>
          </Popover>
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
          { element: tContent('usage.uxWriting.table.title.name'),       rules: tContent('usage.uxWriting.table.title.format'),       do: tContent('usage.uxWriting.table.title.good'),       dont: tContent('usage.uxWriting.table.title.bad')       },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.trigger.name'),     rules: tContent('usage.uxWriting.table.trigger.format'),     do: tContent('usage.uxWriting.table.trigger.good'),     dont: tContent('usage.uxWriting.table.trigger.bad')     },
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
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full">
          <div class="text-sm space-y-1">
            <div class="font-medium">Configurações de exibição</div>
            <div class="text-xs text-muted-foreground">+ PopoverTitle anunciado pelo SR</div>
          </div>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full">
          <div class="text-sm">
            <div class="text-xs text-muted-foreground italic">Sem título — SR fica sem contexto</div>
          </div>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <Button variant="outline" size="sm">Editar perfil</Button>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <Button variant="outline" size="sm">Clique aqui</Button>
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
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-xs font-mono text-muted-foreground">PopoverContent (sem header)</div>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-xs font-mono text-muted-foreground">PopoverHeader + Title + Description</div>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <div class="text-xs font-mono text-muted-foreground">form (Inputs + submit)</div>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="popover"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm">{{ tContent('demonstration.labels.form.trigger') }}</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle>{{ tContent('demonstration.labels.form.trigger') }}</PopoverTitle>
              </PopoverHeader>
              <form class="space-y-2" @submit.prevent>
                <div class="space-y-1">
                  <Label for="pc-name-vue" class="text-xs">{{ tContent('demonstration.labels.form.name') }}</Label>
                  <Input id="pc-name-vue" model-value="Joana Silva" />
                </div>
                <div class="space-y-1">
                  <Label for="pc-email-vue" class="text-xs">{{ tContent('demonstration.labels.form.email') }}</Label>
                  <Input id="pc-email-vue" type="email" model-value="joana@example.com" />
                </div>
                <Button type="submit" size="sm">{{ tContent('demonstration.labels.form.submit') }}</Button>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm">Filtros</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle>Filtrar por status</PopoverTitle>
              </PopoverHeader>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked class="h-4 w-4" /> Ativo
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="h-4 w-4" /> Pendente
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="h-4 w-4" /> Arquivado
                </label>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm">Limpar</Button>
                <Button size="sm">Aplicar</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm">Cor</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle>Selecionar cor</PopoverTitle>
              </PopoverHeader>
              <div class="grid grid-cols-6 gap-2">
                <button type="button" aria-label="Vermelho" class="h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring bg-red-500" />
                <button type="button" aria-label="Laranja"  class="h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring bg-orange-500" />
                <button type="button" aria-label="Amarelo"  class="h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring bg-yellow-500" />
                <button type="button" aria-label="Verde"    class="h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring bg-green-500" />
                <button type="button" aria-label="Azul"     class="h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring bg-blue-500" />
                <button type="button" aria-label="Roxo"     class="h-6 w-6 rounded-full ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring bg-purple-500" />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout; min-height: 60px;" class="w-full">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm">Configurações</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start">
              <PopoverHeader>
                <PopoverTitle>Preferências rápidas</PopoverTitle>
              </PopoverHeader>
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <Label for="cfg-notifs-vue">Notificações</Label>
                  <input id="cfg-notifs-vue" type="checkbox" checked class="h-4 w-4" />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <Label for="cfg-dark-vue">Modo escuro</Label>
                  <input id="cfg-dark-vue" type="checkbox" class="h-4 w-4" />
                </div>
                <div class="flex items-center justify-between gap-3">
                  <Label for="cfg-compact-vue">Modo compacto</Label>
                  <input id="cfg-compact-vue" type="checkbox" class="h-4 w-4" />
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
        { title: 'Popover',        cols: propCols, items: popoverRootPropItems },
        { title: 'PopoverContent', cols: propCols, items: popoverContentPropItems },
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
</template>
