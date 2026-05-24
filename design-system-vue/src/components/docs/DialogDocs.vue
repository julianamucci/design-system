<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import dialogTranslations from '@shared/content/dialog/translations.json';

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
const { t: tContent, locale } = useTranslation(dialogTranslations);

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
  componentSlug: 'dialog',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: 'Overlay', item: '/components/overlay' },
    { name: 'Dialog' },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'dialog',
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
    component_name: 'dialog',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";`;

const codeImportWithScroll = `import {
  Dialog,
  DialogScrollContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";`;

const codeDefault = `<Dialog>
  <DialogTrigger as-child>
    <Button>Editar perfil</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const codeWithForm = `<Dialog>
  <DialogTrigger as-child>
    <Button>Editar perfil</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>Atualize seu nome e email.</DialogDescription>
    </DialogHeader>
    <form class="grid gap-3">
      <Label for="name">Nome</Label>
      <Input id="name" />
      <Label for="email">Email</Label>
      <Input id="email" type="email" />
    </form>
    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button type="submit">Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const codeCustomizationTokens = `/* Em globals.css — override do Dialog via tokens */
:root {
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --border: 240 5.9% 90%;
  --radius-xl: 0.75rem;
}

.dark {
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --border: 240 3.7% 15.9%;
}`;

const interfaceCode = `// Dialog (root)
interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  'onUpdate:open'?: (open: boolean) => void;
}

// DialogContent — repassa props do Popup da Reka UI
interface DialogContentProps {
  showCloseButton?: boolean; // default true
  class?: string;
}

// DialogTitle / DialogDescription
interface DialogTitleProps       { class?: string }
interface DialogDescriptionProps { class?: string }`;

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
  tContent('anatomy.item10'),
]);

const variantItems = computed(() => [
  { name: 'default',               description: stripHtml(tContent('variants.items.default')),               code: codeDefault },
  { name: 'withForm',              description: stripHtml(tContent('variants.items.withForm')),              code: codeWithForm },
  { name: 'withScrollContent',     description: stripHtml(tContent('variants.items.withScrollContent')),     code: codeDefault },
  { name: 'noFooter',              description: stripHtml(tContent('variants.items.noFooter')),              code: codeDefault },
  { name: 'withDestructiveAction', description: stripHtml(tContent('variants.items.withDestructiveAction')), code: codeDefault },
  { name: 'customCloseInFooter',   description: stripHtml(tContent('variants.items.customCloseInFooter')),   code: codeDefault },
]);

const codeCompositionConfirmEmail = `<Dialog>
  <DialogTrigger as-child>
    <Button>Enviar link</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmar e-mail</DialogTitle>
      <DialogDescription>Verifique o endereço antes de enviar o link de acesso.</DialogDescription>
    </DialogHeader>
    <p class="text-sm text-muted-foreground">Vamos enviar um link para maria@exemplo.com.</p>
    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Enviar link</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const codeCompositionProfileEdit = `<Dialog>
  <DialogTrigger as-child>
    <Button variant="outline">Editar perfil</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
    </DialogHeader>
    <form class="grid gap-3">
      <Label for="name">Nome de exibição</Label>
      <Input id="name" model-value="Maria Souza" />
      <Label for="role">Função</Label>
      <Input id="role" model-value="Designer" />
    </form>
    <DialogFooter>
      <DialogClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Salvar alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

const codeCompositionMediaPreview = `<Dialog>
  <DialogTrigger as-child>
    <Button variant="outline">Pré-visualizar</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Capa do post</DialogTitle>
      <DialogDescription>Pré-visualização em tamanho real.</DialogDescription>
    </DialogHeader>
    <div class="aspect-video w-full bg-muted rounded-md grid place-items-center text-xs text-muted-foreground">
      Pré-visualização da mídia
    </div>
  </DialogContent>
</Dialog>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.confirmEmail.name'),
    description: tContent('variants.compositions.confirmEmail.description'),
    useWhen: tContent('variants.compositions.confirmEmail.use'),
    code: codeCompositionConfirmEmail,
  },
  {
    name: tContent('variants.compositions.profileEdit.name'),
    description: tContent('variants.compositions.profileEdit.description'),
    useWhen: tContent('variants.compositions.profileEdit.use'),
    code: codeCompositionProfileEdit,
  },
  {
    name: tContent('variants.compositions.mediaPreview.name'),
    description: tContent('variants.compositions.mediaPreview.description'),
    useWhen: tContent('variants.compositions.mediaPreview.use'),
    code: codeCompositionMediaPreview,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),                trigger: stripHtml(tContent('states.closed.trigger')),                behavior: stripHtml(tContent('states.closed.behavior'))                },
  { label: tContent('states.opening.label'),               trigger: stripHtml(tContent('states.opening.trigger')),               behavior: stripHtml(tContent('states.opening.behavior'))               },
  { label: tContent('states.open.label'),                  trigger: stripHtml(tContent('states.open.trigger')),                  behavior: stripHtml(tContent('states.open.behavior'))                  },
  { label: tContent('states.closing.label'),               trigger: stripHtml(tContent('states.closing.trigger')),               behavior: stripHtml(tContent('states.closing.behavior'))               },
  { label: tContent('states.withCloseButtonHidden.label'), trigger: stripHtml(tContent('states.withCloseButtonHidden.trigger')), behavior: stripHtml(tContent('states.withCloseButtonHidden.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const rootProps = computed(() => [
  { name: 'open',          type: 'boolean',                 defaultValue: '—',     required: 'Não', description: stripHtml(tContent('props.table.open'))         },
  { name: 'defaultOpen',   type: 'boolean',                 defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.table.defaultOpen')) },
  { name: 'onUpdate:open', type: '(open: boolean) => void', defaultValue: '—',     required: 'Não', description: stripHtml(tContent('props.table.onOpenChange'))},
]);

const contentProps = computed(() => [
  { name: 'showCloseButton', type: 'boolean', defaultValue: 'true', required: 'Não', description: stripHtml(tContent('props.table.showCloseButtonContent')) },
  { name: 'class',           type: 'string',  defaultValue: '—',    required: 'Não', description: tContent('props.table.className')                          },
  { name: 'default slot',    type: 'VNode',   defaultValue: '—',    required: 'Sim', description: stripHtml(tContent('props.table.children'))               },
]);

const footerProps = computed(() => [
  { name: 'showCloseButton', type: 'boolean', defaultValue: 'false', required: 'Não', description: stripHtml(tContent('props.table.showCloseButtonFooter')) },
  { name: 'class',           type: 'string',  defaultValue: '—',     required: 'Não', description: tContent('props.table.className')                         },
]);

const titleDescriptionProps = computed(() => [
  { name: 'class',        type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className')            },
  { name: 'default slot', type: 'VNode',  defaultValue: '—', required: 'Sim', description: stripHtml(tContent('props.table.children')) },
]);

const tokenRows = computed(() => [
  { token: '--popover',            value: 'bg-popover',            description: tContent('tokens.table.popover')            },
  { token: '--popover-foreground', value: 'text-popover-foreground', description: tContent('tokens.table.popoverForeground') },
  { token: '--foreground',         value: 'ring-foreground/10',    description: tContent('tokens.table.foreground')         },
  { token: '--muted',              value: 'bg-muted/50',           description: tContent('tokens.table.muted')              },
  { token: '--border',             value: 'border-t border-border', description: tContent('tokens.table.border')            },
  { token: '--radius-xl',          value: 'rounded-xl',            description: tContent('tokens.table.radius')             },
  { token: 'z-index',              value: 'z-50',                  description: tContent('tokens.table.zIndex')             },
  { token: 'duration',             value: 'duration-100',          description: tContent('tokens.table.duration')           },
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
  { key: 'Tab',       description: tContent('keyboard.tab')      },
  { key: 'Shift+Tab', description: tContent('keyboard.shiftTab') },
  { key: 'Enter',     description: tContent('keyboard.enter')    },
  { key: 'Escape',    description: tContent('keyboard.escape')   },
]);

const relatedItems = computed(() => [
  { name: 'AlertDialog', description: stripHtml(tContent('related.alertDialog')), path: '?path=/docs/ui-alertdialog--docs' },
  { name: 'Sheet',       description: tContent('related.sheet'),                  path: '?path=/docs/ui-sheet--docs'       },
  { name: 'Popover',     description: tContent('related.popover'),                path: '?path=/docs/ui-popover--docs'     },
  { name: 'Form',        description: tContent('related.form'),                   path: '?path=/docs/ui-form--docs'        },
  { name: 'Drawer',      description: tContent('related.drawer'),                 path: '?path=/docs/ui-drawer--docs'      },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.open'),          trigger: tContent('analytics.table.openTrigger'),          payload: tContent('analytics.table.openPayload')          },
  { event: tContent('analytics.table.close'),         trigger: tContent('analytics.table.closeTrigger'),         payload: tContent('analytics.table.closePayload')         },
  { event: tContent('analytics.table.action'),        trigger: tContent('analytics.table.actionTrigger'),        payload: tContent('analytics.table.actionPayload')        },
  { event: tContent('analytics.table.pageView'),      trigger: tContent('analytics.table.pageViewTrigger'),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: tContent('analytics.table.sectionViewedTrigger'), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: tContent('analytics.table.langSwitchTrigger'),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  action: tContent(`testes.functional.item${i}.action`),
  result: tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5, 6].map((i) => ({
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
        install-note="npx shadcn-vue@latest add dialog"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="flex flex-wrap items-center justify-center gap-4 w-full">
        <Dialog>
          <DialogTrigger as-child>
            <Button>{{ tContent('demonstration.labels.triggerLabel') }}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{{ tContent('demonstration.labels.title') }}</DialogTitle>
              <DialogDescription>{{ tContent('demonstration.labels.description') }}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">{{ tContent('demonstration.labels.cancel') }}</Button>
              </DialogClose>
              <Button>{{ tContent('demonstration.labels.action') }}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
          tContent('usage.guidelines.item6'),
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
          { element: tContent('usage.uxWriting.table.action.name'),      rules: tContent('usage.uxWriting.table.action.format'),      do: tContent('usage.uxWriting.table.action.good'),      dont: tContent('usage.uxWriting.table.action.bad')      },
          { element: tContent('usage.uxWriting.table.cancel.name'),      rules: tContent('usage.uxWriting.table.cancel.format'),      do: tContent('usage.uxWriting.table.cancel.good'),      dont: tContent('usage.uxWriting.table.cancel.bad')      },
          { element: tContent('usage.uxWriting.table.srOnly.name'),      rules: tContent('usage.uxWriting.table.srOnly.format'),      do: tContent('usage.uxWriting.table.srOnly.good'),      dont: tContent('usage.uxWriting.table.srOnly.bad')      },
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: stripHtml(tContent('doDont.pair2.do')), dontCaption: stripHtml(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #dont-preview-0>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atenção</DialogTitle>
              <DialogDescription>Deseja continuar?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Não</Button>
              </DialogClose>
              <Button>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #do-preview-1>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>Atualize seu nome e email.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #dont-preview-1>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir conta</DialogTitle>
              <DialogDescription>Esta ação é permanente.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button variant="destructive">Excluir conta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
    </DocsDoDont>

    <!-- ── Importação ───────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withScroll')"
      :secondary-code="codeImportWithScroll"
    />

    <!-- ── Variantes ────────────────────────────────────────────── -->
    <DocsVariants :title="tContent('variants.title')" :items="variantItems" :note="stripHtml(tContent('variants.note'))">
      <template #variant-preview-0>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #variant-preview-1>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>Atualize seu nome e email.</DialogDescription>
            </DialogHeader>
            <form class="grid gap-3">
              <div class="grid gap-1.5">
                <Label for="docs-form-name">Nome</Label>
                <Input id="docs-form-name" />
              </div>
              <div class="grid gap-1.5">
                <Label for="docs-form-email">Email</Label>
                <Input id="docs-form-email" type="email" />
              </div>
            </form>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #variant-preview-2>
        <Dialog default-open>
          <DialogScrollContent class="max-w-md">
            <DialogHeader>
              <DialogTitle>Termos de serviço</DialogTitle>
              <DialogDescription>Leia atentamente os termos.</DialogDescription>
            </DialogHeader>
            <div class="space-y-3 text-sm text-muted-foreground max-h-56 overflow-y-auto">
              <p v-for="i in 8" :key="i">Parágrafo {{ i }} — Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Recusar</Button>
              </DialogClose>
              <Button>Aceitar termos</Button>
            </DialogFooter>
          </DialogScrollContent>
        </Dialog>
      </template>
      <template #variant-preview-3>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do pedido #4287</DialogTitle>
              <DialogDescription>Pedido confirmado em 15 de março às 14:32.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </template>
      <template #variant-preview-4>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover anexo</DialogTitle>
              <DialogDescription>O anexo será removido desta mensagem.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button variant="destructive">Remover anexo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #variant-preview-5>
        <Dialog default-open>
          <DialogContent :showCloseButton="false">
            <DialogHeader>
              <DialogTitle>Configurações de notificação</DialogTitle>
              <DialogDescription>Escolha como deseja ser avisado.</DialogDescription>
            </DialogHeader>
            <DialogFooter class="flex-col gap-2 sm:flex-col">
              <Button>Salvar preferências</Button>
              <DialogClose as-child>
                <Button variant="ghost">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="dialog"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar e-mail</DialogTitle>
              <DialogDescription>Verifique o endereço antes de enviar o link de acesso.</DialogDescription>
            </DialogHeader>
            <p class="text-sm text-muted-foreground">Vamos enviar um link para maria@exemplo.com.</p>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button>Enviar link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #variant-preview-1>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
            </DialogHeader>
            <form class="grid gap-3">
              <div class="grid gap-1.5">
                <Label for="docs-comp-name">Nome de exibição</Label>
                <Input id="docs-comp-name" model-value="Maria Souza" />
              </div>
              <div class="grid gap-1.5">
                <Label for="docs-comp-role">Função</Label>
                <Input id="docs-comp-role" model-value="Designer" />
              </div>
            </form>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </template>
      <template #variant-preview-2>
        <Dialog default-open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Capa do post</DialogTitle>
              <DialogDescription>Pré-visualização em tamanho real.</DialogDescription>
            </DialogHeader>
            <div class="aspect-video w-full bg-muted rounded-md grid place-items-center text-xs text-muted-foreground">
              Pré-visualização da mídia
            </div>
          </DialogContent>
        </Dialog>
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
        { title: tContent('props.rootTitle'),             cols: propCols, items: rootProps             },
        { title: tContent('props.contentTitle'),          cols: propCols, items: contentProps          },
        { title: tContent('props.footerTitle'),           cols: propCols, items: footerProps           },
        { title: tContent('props.titleDescriptionTitle'), cols: propCols, items: titleDescriptionProps },
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
