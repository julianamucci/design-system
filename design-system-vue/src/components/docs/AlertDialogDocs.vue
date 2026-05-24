<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

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
const { t: tContent, locale } = useTranslation(alertDialogTranslations);

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
  componentSlug: 'alert-dialog',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'alert-dialog',
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
      { id: 'composicoes',  label: tNav('nav.compositions') },
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
    component_name: 'alert-dialog',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";`;

const codeImportWithTrigger = `import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  // ...
} from "@/components/ui/alert-dialog";`;

const codeDestructive = `<AlertDialog>
  <AlertDialogTrigger as-child>
    <Button variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Todos os dados serão removidos. Esta ação não pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Excluir conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const codeDefault = `<AlertDialog>
  <AlertDialogTrigger as-child>
    <Button>Sair da conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Você precisará entrar novamente para acessar seus dados.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Sair</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const codeCustomizationTokens = `/* Em globals.css — override do AlertDialog via tokens */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --border: 240 5.9% 90%;
  --destructive: 0 84% 60%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --destructive: 0 62.8% 30.6%;
}`;

const interfaceCode = `// AlertDialog (Root)
interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  'onUpdate:open'?: (open: boolean) => void;
}

// AlertDialogTrigger / AlertDialogAction / AlertDialogCancel
interface TriggerProps { asChild?: boolean; class?: string }
interface ActionProps  { onClick?: (e: MouseEvent) => void; class?: string }
interface CancelProps  { onClick?: (e: MouseEvent) => void; class?: string }`;

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
  tContent('anatomy.item9'),
]);

const variantItems = computed(() => [
  {
    name: 'destructive',
    description: stripHtml(tContent('variants.items.destructive')),
    code: codeDestructive,
  },
  {
    name: 'default',
    description: stripHtml(tContent('variants.items.default')),
    code: codeDefault,
  },
]);

const codeCompositionDestructive = `<AlertDialog>
  <AlertDialogTrigger as-child>
    <Button variant="destructive">Excluir conta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
      <AlertDialogDescription>
        Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Excluir conta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const codeCompositionNeutral = `<AlertDialog>
  <AlertDialogTrigger as-child>
    <Button>Publicar agora</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
      <AlertDialogDescription>
        Ao publicar, o conteúdo fica visível para todos os usuários.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Voltar</AlertDialogCancel>
      <AlertDialogAction>Publicar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.destructive.name'),
    description: tContent('variants.compositions.destructive.description'),
    useWhen: tContent('variants.compositions.destructive.use'),
    code: codeCompositionDestructive,
  },
  {
    name: tContent('variants.compositions.neutral.name'),
    description: tContent('variants.compositions.neutral.description'),
    useWhen: tContent('variants.compositions.neutral.use'),
    code: codeCompositionNeutral,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),     trigger: stripHtml(tContent('states.closed.trigger')),     behavior: tContent('states.closed.behavior')     },
  { label: tContent('states.open.label'),       trigger: stripHtml(tContent('states.open.trigger')),       behavior: tContent('states.open.behavior')       },
  { label: tContent('states.confirmed.label'),  trigger: stripHtml(tContent('states.confirmed.trigger')),  behavior: tContent('states.confirmed.behavior')  },
  { label: tContent('states.cancelled.label'),  trigger: stripHtml(tContent('states.cancelled.trigger')),  behavior: tContent('states.cancelled.behavior') },
  { label: tContent('states.controlled.label'), trigger: stripHtml(tContent('states.controlled.trigger')), behavior: tContent('states.controlled.behavior') },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const rootProps = computed(() => [
  { name: 'open',         type: 'boolean',                    defaultValue: '—',      required: 'Não', description: stripHtml(tContent('props.table.open'))         },
  { name: 'defaultOpen',  type: 'boolean',                    defaultValue: 'false',  required: 'Não', description: stripHtml(tContent('props.table.defaultOpen')) },
  { name: 'onUpdate:open',type: '(open: boolean) => void',    defaultValue: '—',      required: 'Não', description: stripHtml(tContent('props.table.onOpenChange'))},
  { name: 'default slot', type: 'VNode',                      defaultValue: '—',      required: 'Sim', description: stripHtml(tContent('props.table.children'))    },
]);

const triggerProps = computed(() => [
  { name: 'asChild',      type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.table.asChild'))  },
  { name: 'class',        type: 'string',  defaultValue: '—',     required: 'Não', description: tContent('props.table.className')            },
  { name: 'default slot', type: 'VNode',   defaultValue: '—',     required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const contentProps = computed(() => [
  { name: 'class',        type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className')            },
  { name: 'default slot', type: 'VNode',  defaultValue: '—', required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const actionProps = computed(() => [
  { name: 'onClick',      type: '(e: MouseEvent) => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.onClick'))  },
  { name: 'class',        type: 'string',                  defaultValue: '—', required: 'Não', description: tContent('props.table.className')            },
  { name: 'default slot', type: 'VNode',                   defaultValue: '—', required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const cancelProps = computed(() => [
  { name: 'onClick',      type: '(e: MouseEvent) => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.onClick'))  },
  { name: 'class',        type: 'string',                  defaultValue: '—', required: 'Não', description: tContent('props.table.className')            },
  { name: 'default slot', type: 'VNode',                   defaultValue: '—', required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const tokenRows = computed(() => [
  { token: '--background',             value: 'bg-black/80',                           description: tContent('tokens.table.overlayBg')             },
  { token: '--background',             value: 'bg-background',                         description: tContent('tokens.table.contentBg')             },
  { token: '--foreground',             value: 'text-foreground',                       description: tContent('tokens.table.contentForeground')     },
  { token: '--border',                 value: 'border',                                description: tContent('tokens.table.border')                },
  { token: '--muted-foreground',       value: 'text-muted-foreground',                 description: tContent('tokens.table.mutedForeground')       },
  { token: '--destructive',            value: 'bg-destructive',                        description: tContent('tokens.table.destructive')           },
  { token: '--destructive-foreground', value: 'text-destructive-foreground',           description: tContent('tokens.table.destructiveForeground') },
  { token: '--radius',                 value: 'sm:rounded-lg',                         description: tContent('tokens.table.radius')                },
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
  { key: 'Tab',       description: tContent('accessibility.keyboard.tab')       },
  { key: 'Shift+Tab', description: tContent('accessibility.keyboard.shiftTab')  },
  { key: 'Enter',     description: tContent('accessibility.keyboard.enter')     },
  { key: 'Space',     description: tContent('accessibility.keyboard.space')     },
  { key: 'Escape',    description: tContent('accessibility.keyboard.escape')    },
]);

const relatedItems = computed(() => [
  { name: 'Dialog', description: tContent('related.dialog'), path: '?path=/docs/ui-dialog--docs' },
  { name: 'Sonner', description: tContent('related.sonner'), path: '?path=/docs/ui-sonner--docs' },
  { name: 'Alert',  description: tContent('related.alert'),  path: '?path=/docs/ui-alert--docs'  },
  { name: 'Button', description: tContent('related.button'), path: '?path=/docs/ui-button--docs' },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.open'),          trigger: tContent('analytics.table.openTrigger'),          payload: tContent('analytics.table.openPayload')          },
  { event: tContent('analytics.table.confirm'),       trigger: tContent('analytics.table.confirmTrigger'),       payload: tContent('analytics.table.confirmPayload')       },
  { event: tContent('analytics.table.close'),         trigger: tContent('analytics.table.closeTrigger'),         payload: tContent('analytics.table.closePayload')         },
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  action: tContent(`testes.functional.item${i}.action`),
  result: tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  criterion: tContent(`testes.accessibility.item${i}.criterion`),
  level: tContent(`testes.accessibility.item${i}.level`),
  how: tContent(`testes.accessibility.item${i}.how`),
})));

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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add alert-dialog"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-center justify-center gap-4 w-full">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive">{{ tContent('demonstration.labels.triggerLabel') }}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ tContent('demonstration.labels.title') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ tContent('demonstration.labels.description') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {{ tContent('demonstration.labels.action') }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button>{{ tContent('demonstration.labels.neutralTriggerLabel') }}</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ tContent('demonstration.labels.neutralTitle') }}</AlertDialogTitle>
              <AlertDialogDescription>{{ tContent('demonstration.labels.neutralDescription') }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
              <AlertDialogAction>{{ tContent('demonstration.labels.neutralAction') }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
          { element: tContent('usage.uxWriting.table.title.name'),       rules: tContent('usage.uxWriting.table.title.format'),       do: tContent('usage.uxWriting.table.title.good'),       dont: tContent('usage.uxWriting.table.title.bad')       },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.action.name'),      rules: tContent('usage.uxWriting.table.action.format'),      do: tContent('usage.uxWriting.table.action.good'),      dont: tContent('usage.uxWriting.table.action.bad')      },
          { element: tContent('usage.uxWriting.table.cancel.name'),      rules: tContent('usage.uxWriting.table.cancel.format'),      do: tContent('usage.uxWriting.table.cancel.good'),      dont: tContent('usage.uxWriting.table.cancel.bad')      },
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
          tContent('usage.dont.item4'),
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
        <AlertDialog default-open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conta</AlertDialogTitle>
              <AlertDialogDescription>Todos os dados serão removidos. Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
      <template #dont-preview-0>
        <AlertDialog default-open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>Deseja continuar?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não</AlertDialogCancel>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
      <template #do-preview-1>
        <AlertDialog default-open>
          <AlertDialogTrigger as-child>
            <Button variant="destructive">Excluir</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
              <AlertDialogDescription>O projeto será removido permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
      <template #dont-preview-1>
        <AlertDialog default-open>
          <AlertDialogTrigger as-child>
            <Button variant="destructive">Excluir</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir projeto</AlertDialogTitle>
              <AlertDialogDescription>O projeto será removido permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withTrigger')"
      :secondary-code="codeImportWithTrigger"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" :note="stripHtml(tContent('variants.note'))">
      <template #variant-preview-0>
        <AlertDialog default-open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conta</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
      <template #variant-preview-1>
        <AlertDialog default-open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sair da conta</AlertDialogTitle>
              <AlertDialogDescription>Você precisará entrar novamente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction>Sair</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="alert-dialog"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <AlertDialog default-open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir conta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
      <template #variant-preview-1>
        <AlertDialog default-open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
              <AlertDialogDescription>
                Ao publicar, o conteúdo fica visível para todos os usuários.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction>Publicar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
    </DocsCompositions>

    <!-- ── Configurações (States) ──────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ─────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.rootTitle'),    cols: propCols, items: rootProps    },
        { title: tContent('props.triggerTitle'), cols: propCols, items: triggerProps },
        { title: tContent('props.contentTitle'), cols: propCols, items: contentProps },
        { title: tContent('props.actionTitle'),  cols: propCols, items: actionProps  },
        { title: tContent('props.cancelTitle'),  cols: propCols, items: cancelProps  },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="stripHtml(tContent('props.extensibility'))"
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
      :keyboard-title="tContent('accessibility.keyboardTitle')"
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
