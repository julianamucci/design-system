<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/drawer/translations.json';
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
  componentSlug: 'drawer',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Disclosure', item: '/components/disclosure' },
    { name: 'Drawer' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'drawer',
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
    component_name: 'drawer',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";`;

const codeBottom = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Abrir</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Salvar</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const codeRight = `<Drawer direction="right">
  <DrawerTrigger as-child>
    <Button variant="outline">Filtros</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filtros</DrawerTitle>
      <DrawerDescription>Refine sua busca.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Aplicar</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const interfaceCode = `// Drawer (root) — props vindas de vaul-vue
interface DrawerRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  direction?: 'bottom' | 'top' | 'left' | 'right';
  modal?: boolean;
  dismissible?: boolean;
  shouldScaleBackground?: boolean;
}

// DrawerContent — class + slot
interface DrawerContentProps { class?: string }

// DrawerTitle / DrawerDescription
interface DrawerTitleProps       { class?: string }
interface DrawerDescriptionProps { class?: string }`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyStructure = computed(() => tContent('anatomy.structureCode'));

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
  { name: tContent('variants.items.bottom'), description: stripHtml(tContent('variants.styles.bottom')), code: codeBottom },
  { name: tContent('variants.items.top'),    description: stripHtml(tContent('variants.styles.top')),    code: codeBottom.replace('<Drawer>', '<Drawer direction="top">') },
  { name: tContent('variants.items.left'),   description: stripHtml(tContent('variants.styles.left')),   code: codeBottom.replace('<Drawer>', '<Drawer direction="left">') },
  { name: tContent('variants.items.right'),  description: stripHtml(tContent('variants.styles.right')),  code: codeRight },
]);

const codeCompWithForm = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Editar perfil</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Editar perfil</DrawerTitle>
      <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
    </DrawerHeader>
    <form class="grid gap-3 px-4">
      <Label class="grid gap-1 text-sm">
        Nome
        <Input default-value="Maria Souza" />
      </Label>
      <Label class="grid gap-1 text-sm">
        E-mail
        <Input type="email" default-value="maria@exemplo.com" />
      </Label>
    </form>
    <DrawerFooter>
      <Button>Salvar alterações</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const codeCompWithConfirmation = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Remover item</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Remover item da lista?</DrawerTitle>
      <DrawerDescription>
        Você poderá adicioná-lo novamente a qualquer momento.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button variant="destructive">Remover</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const codeCompWithScroll = `<Drawer>
  <DrawerTrigger as-child>
    <Button variant="outline">Ler termos</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Termos de uso</DrawerTitle>
      <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
    </DrawerHeader>
    <div class="text-sm text-muted-foreground max-h-64 overflow-y-auto px-4 space-y-3">
      <p v-for="i in 12" :key="i">Parágrafo {{ i }}: termos longos para garantir scroll interno.</p>
    </div>
    <DrawerFooter>
      <Button>Aceitar termos</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const codeCompRightPanel = `<Drawer direction="right">
  <DrawerTrigger as-child>
    <Button variant="outline">Abrir filtros</Button>
  </DrawerTrigger>
  <DrawerContent class="max-w-md">
    <DrawerHeader>
      <DrawerTitle>Filtros</DrawerTitle>
      <DrawerDescription>Refine os resultados.</DrawerDescription>
    </DrawerHeader>
    <div class="px-4 text-sm text-muted-foreground">Conteúdo dos filtros…</div>
    <DrawerFooter>
      <Button>Aplicar</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withForm.name'),
    description: tContent('variants.compositions.withForm.description'),
    useWhen: tContent('variants.compositions.withForm.use'),
    code: codeCompWithForm,
  },
  {
    name: tContent('variants.compositions.withConfirmation.name'),
    description: tContent('variants.compositions.withConfirmation.description'),
    useWhen: tContent('variants.compositions.withConfirmation.use'),
    code: codeCompWithConfirmation,
  },
  {
    name: tContent('variants.compositions.withScroll.name'),
    description: tContent('variants.compositions.withScroll.description'),
    useWhen: tContent('variants.compositions.withScroll.use'),
    code: codeCompWithScroll,
  },
  {
    name: tContent('variants.compositions.rightPanel.name'),
    description: tContent('variants.compositions.rightPanel.description'),
    useWhen: tContent('variants.compositions.rightPanel.use'),
    code: codeCompRightPanel,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'),     trigger: '—',          behavior: stripHtml(tContent('states.descriptions.closed'))     },
  { label: tContent('states.items.open'),       trigger: 'defaultOpen', behavior: stripHtml(tContent('states.descriptions.open'))       },
  { label: tContent('states.items.controlled'), trigger: 'open + onUpdate:open', behavior: stripHtml(tContent('states.descriptions.controlled')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const drawerPropItems = computed(() => [
  { name: 'open',          type: tContent('props.table.open.type'),         defaultValue: tContent('props.table.open.default'),         required: tContent('props.table.open.required'),         description: stripHtml(tContent('props.table.open.description'))         },
  { name: 'onUpdate:open', type: tContent('props.table.onOpenChange.type'), defaultValue: tContent('props.table.onOpenChange.default'), required: tContent('props.table.onOpenChange.required'), description: stripHtml(tContent('props.table.onOpenChange.description')) },
  { name: 'defaultOpen',   type: tContent('props.table.defaultOpen.type'),  defaultValue: tContent('props.table.defaultOpen.default'),  required: tContent('props.table.defaultOpen.required'),  description: stripHtml(tContent('props.table.defaultOpen.description'))  },
  { name: 'direction',     type: tContent('props.table.direction.type'),   defaultValue: tContent('props.table.direction.default'),    required: tContent('props.table.direction.required'),    description: stripHtml(tContent('props.table.direction.description'))    },
  { name: 'modal',         type: tContent('props.table.modal.type'),       defaultValue: tContent('props.table.modal.default'),        required: tContent('props.table.modal.required'),        description: stripHtml(tContent('props.table.modal.description'))        },
  { name: 'dismissible',   type: tContent('props.table.dismissible.type'), defaultValue: tContent('props.table.dismissible.default'),  required: tContent('props.table.dismissible.required'),  description: stripHtml(tContent('props.table.dismissible.description'))  },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: tContent('tokens.table.background.class'), description: tContent('tokens.table.background.part') },
  { token: '--popover-foreground', value: tContent('tokens.table.foreground.class'), description: tContent('tokens.table.foreground.part') },
  { token: '--border',             value: tContent('tokens.table.border.class'),     description: tContent('tokens.table.border.part')     },
  { token: '—',                    value: tContent('tokens.table.overlay.class'),    description: tContent('tokens.table.overlay.part')    },
  { token: '--muted',              value: tContent('tokens.table.handle.class'),     description: tContent('tokens.table.handle.part')     },
  { token: '--radius-xl',          value: tContent('tokens.table.rounded.class'),    description: tContent('tokens.table.rounded.part')    },
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
  { key: 'Tab / Shift+Tab', description: stripHtml(tContent('accessibility.keyboard.tab'))    },
  { key: 'Escape',          description: stripHtml(tContent('accessibility.keyboard.escape')) },
  { key: 'Enter / Space',   description: stripHtml(tContent('accessibility.keyboard.enter'))  },
  { key: 'Swipe',           description: stripHtml(tContent('accessibility.keyboard.swipe'))  },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.sheet.name'),       description: tContent('related.items.sheet.description'),       path: '?path=/docs/ui-sheet--docs'       },
  { name: tContent('related.items.dialog.name'),      description: tContent('related.items.dialog.description'),      path: '?path=/docs/ui-dialog--docs'      },
  { name: tContent('related.items.alertDialog.name'), description: tContent('related.items.alertDialog.description'), path: '?path=/docs/ui-alertdialog--docs' },
  { name: tContent('related.items.sidebar.name'),     description: tContent('related.items.sidebar.description'),     path: '?path=/docs/ui-sidebar--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
]);

const analyticsItems = computed(() => [
  { event: 'drawer_open',  trigger: 'onOpenChange(true)',  payload: "{ component: 'drawer', location, label }" },
  { event: 'drawer_close', trigger: 'onOpenChange(false)', payload: "{ component: 'drawer', location, label }" },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
  criterion: tContent(`testes.accessibility.item${i}`),
  level: 'AA',
  how: tContent(`testes.accessibility.item${i}`),
})));

const visualTestItems = computed(() => [1, 2, 3, 4, 5].map((i) => ({
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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="drawer">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add drawer"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-center justify-center gap-4 w-full" style="contain: layout">
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="outline">{{ tContent('demonstration.labels.bottom') }}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{{ tContent('demonstration.labels.bottom') }}</DrawerTitle>
              <DrawerDescription>{{ tContent('description') }}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>OK</Button>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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
          stripHtml(tContent('usage.guidelines.item5')),
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
          { element: tContent('usage.uxWriting.table.close.name'),       rules: tContent('usage.uxWriting.table.close.format'),       do: tContent('usage.uxWriting.table.close.good'),       dont: tContent('usage.uxWriting.table.close.bad')       },
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
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar perfil</DrawerTitle>
                <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button>Salvar</Button>
                <DrawerClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle class="sr-only">Sem título visível</DrawerTitle>
                <DrawerDescription>Conteúdo sem título — leitor de tela não anuncia.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true" direction="bottom">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filtros</DrawerTitle>
                <DrawerDescription>Direção bottom com swipe natural em mobile.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button>Aplicar</Button>
                <DrawerClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Drawer aninhado (errado)</DrawerTitle>
                <DrawerDescription>Aninhar Drawers quebra focus trap e gestos.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
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
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true" direction="bottom">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{{ tContent('variants.items.bottom') }}</DrawerTitle>
                <DrawerDescription>direction=bottom</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true" direction="top">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{{ tContent('variants.items.top') }}</DrawerTitle>
                <DrawerDescription>direction=top</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true" direction="left">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{{ tContent('variants.items.left') }}</DrawerTitle>
                <DrawerDescription>direction=left</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout" class="w-full">
          <Drawer :default-open="true" direction="right">
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{{ tContent('variants.items.right') }}</DrawerTitle>
                <DrawerDescription>direction=right</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as-child>
                  <Button variant="outline">Fechar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="drawer"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout" class="w-full">
          <Drawer>
            <DrawerTrigger as-child>
              <Button variant="outline">Editar perfil</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar perfil</DrawerTitle>
                <DrawerDescription>Atualize seus dados pessoais.</DrawerDescription>
              </DrawerHeader>
              <form class="grid gap-3 px-4">
                <Label class="grid gap-1 text-sm">
                  Nome
                  <Input default-value="Maria Souza" />
                </Label>
                <Label class="grid gap-1 text-sm">
                  E-mail
                  <Input type="email" default-value="maria@exemplo.com" />
                </Label>
              </form>
              <DrawerFooter>
                <Button>Salvar alterações</Button>
                <DrawerClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout" class="w-full">
          <Drawer>
            <DrawerTrigger as-child>
              <Button variant="outline">Remover item</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Remover item da lista?</DrawerTitle>
                <DrawerDescription>Você poderá adicioná-lo novamente a qualquer momento.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button variant="destructive">Remover</Button>
                <DrawerClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout" class="w-full">
          <Drawer>
            <DrawerTrigger as-child>
              <Button variant="outline">Ler termos</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Termos de uso</DrawerTitle>
                <DrawerDescription>Leia atentamente antes de aceitar.</DrawerDescription>
              </DrawerHeader>
              <div class="text-sm text-muted-foreground max-h-64 overflow-y-auto px-4 space-y-3">
                <p v-for="i in 12" :key="i">Parágrafo {{ i }}: termos longos para garantir scroll interno.</p>
              </div>
              <DrawerFooter>
                <Button>Aceitar termos</Button>
                <DrawerClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout" class="w-full">
          <Drawer direction="right">
            <DrawerTrigger as-child>
              <Button variant="outline">Abrir filtros</Button>
            </DrawerTrigger>
            <DrawerContent class="max-w-md">
              <DrawerHeader>
                <DrawerTitle>Filtros</DrawerTitle>
                <DrawerDescription>Refine os resultados.</DrawerDescription>
              </DrawerHeader>
              <div class="px-4 text-sm text-muted-foreground">Conteúdo dos filtros…</div>
              <DrawerFooter>
                <Button>Aplicar</Button>
                <DrawerClose as-child>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
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
        { title: 'Drawer', cols: propCols, items: drawerPropItems },
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
