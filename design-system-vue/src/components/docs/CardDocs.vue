<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import cardTranslations from '@shared/content/card/translations.json';

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
const { t: tContent, locale } = useTranslation(cardTranslations);

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

// Imagem canônica para previews (alinhada ao React)
const DEMO_IMAGE_AVATAR =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces';

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'card',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'card',
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
    component_name: 'card',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";`;

const codeImportFull = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";`;

const codeDefault = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura e apoio lombar.
    </CardDescription>
  </CardHeader>
  <CardContent>R$ 1.299,00</CardContent>
</Card>`;

const codeSm = `<Card size="sm">
  <CardHeader>
    <CardTitle>Assinantes ativos</CardTitle>
    <CardDescription>+12% no mês</CardDescription>
  </CardHeader>
  <CardContent>8.742</CardContent>
</Card>`;

const codeWithFooter = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Em estoque</CardDescription>
  </CardHeader>
  <CardContent>R$ 1.299,00</CardContent>
  <CardFooter class="justify-end gap-2">
    <Button variant="outline" aria-label="Cancelar edição">Cancelar</Button>
    <Button aria-label="Salvar Cadeira Gamer Pro">Salvar</Button>
  </CardFooter>
</Card>`;

const codeWithAction = `<Card>
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>Em estoque</CardDescription>
    <CardAction>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Editar produto Cadeira Gamer Pro"
      >
        Editar
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>R$ 1.299,00</CardContent>
</Card>`;

const codeWithImage = `<Card>
  <img
    src="/product.jpg"
    alt="Cadeira Gamer Pro em fundo branco"
    class="aspect-video w-full object-cover"
  />
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura.
    </CardDescription>
  </CardHeader>
  <CardContent>R$ 1.299,00</CardContent>
</Card>`;

const codeCustomizationTokens = `/* globals.css — personalize o Card via tokens de tema */
:root {
  --radius-card: 0.75rem;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
}

.dark {
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
}`;

const interfaceCode = `// Card (root)
interface CardProps {
  size?: 'default' | 'sm';
  class?: string;
}

// Subcomponentes — estendem HTMLAttributes<HTMLDivElement>
interface CardHeaderProps      { class?: string }
interface CardTitleProps       { class?: string }
interface CardDescriptionProps { class?: string }
interface CardActionProps      { class?: string }
interface CardContentProps     { class?: string }
interface CardFooterProps      { class?: string }`;

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
  { name: 'default',    description: stripHtml(tContent('variants.items.default')),    code: codeDefault    },
  { name: 'sm',         description: stripHtml(tContent('variants.items.sm')),         code: codeSm         },
  { name: 'withFooter', description: stripHtml(tContent('variants.items.withFooter')), code: codeWithFooter },
  { name: 'withAction', description: stripHtml(tContent('variants.items.withAction')), code: codeWithAction },
  { name: 'withImage',  description: stripHtml(tContent('variants.items.withImage')),  code: codeWithImage  },
]);

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.withFooter.name'),
    description: tContent('variants.compositions.withFooter.description'),
    useWhen: tContent('variants.compositions.withFooter.use'),
    code: `<Card class="w-full max-w-sm">\n  <CardHeader>\n    <CardTitle>Cadeira Gamer Pro</CardTitle>\n    <CardDescription>Estrutura ergonômica.</CardDescription>\n  </CardHeader>\n  <CardContent>\n    <p class="text-lg font-semibold">R$ 1.299,00</p>\n  </CardContent>\n  <CardFooter class="justify-end gap-2">\n    <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>\n    <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>\n  </CardFooter>\n</Card>`,
  },
  {
    name: tContent('variants.compositions.withAction.name'),
    description: tContent('variants.compositions.withAction.description'),
    useWhen: tContent('variants.compositions.withAction.use'),
    code: `<Card class="w-full max-w-sm">\n  <CardHeader>\n    <CardTitle>Assinantes ativos</CardTitle>\n    <CardDescription>+12% no mês</CardDescription>\n    <CardAction>\n      <Button variant="outline" size="sm" aria-label="Editar métrica Assinantes ativos">Editar</Button>\n    </CardAction>\n  </CardHeader>\n  <CardContent>\n    <p class="text-2xl font-semibold">8.742</p>\n  </CardContent>\n</Card>`,
  },
  {
    name: tContent('variants.compositions.withImage.name'),
    description: tContent('variants.compositions.withImage.description'),
    useWhen: tContent('variants.compositions.withImage.use'),
    code: `<Card class="w-full max-w-sm">\n  <img src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80" alt="Cadeira Gamer Pro" class="w-full h-40 object-cover" />\n  <CardHeader>\n    <CardTitle>Cadeira Gamer Pro</CardTitle>\n    <CardDescription>Estrutura ergonômica.</CardDescription>\n  </CardHeader>\n</Card>`,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.default.label'),     trigger: stripHtml(tContent('states.default.trigger')),     behavior: stripHtml(tContent('states.default.behavior'))     },
  { label: tContent('states.small.label'),       trigger: stripHtml(tContent('states.small.trigger')),       behavior: stripHtml(tContent('states.small.behavior'))       },
  { label: tContent('states.interactive.label'), trigger: stripHtml(tContent('states.interactive.trigger')), behavior: stripHtml(tContent('states.interactive.behavior')) },
  { label: tContent('states.withImage.label'),   trigger: stripHtml(tContent('states.withImage.trigger')),   behavior: stripHtml(tContent('states.withImage.behavior'))   },
  { label: tContent('states.withFooter.label'),  trigger: stripHtml(tContent('states.withFooter.trigger')),  behavior: stripHtml(tContent('states.withFooter.behavior'))  },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const cardPropItems = computed(() => [
  { name: 'size',         type: '"default" | "sm"', defaultValue: '"default"', required: 'Não', description: stripHtml(tContent('props.table.size'))     },
  { name: 'class',        type: 'string',           defaultValue: '—',         required: 'Não', description: tContent('props.table.className')           },
  { name: 'default slot', type: 'VNode',            defaultValue: '—',         required: 'Sim', description: tContent('props.table.children')            },
]);

const slotOnlyItems = computed(() => [
  { name: 'class',        type: 'string', defaultValue: '—', required: 'Não', description: tContent('props.table.className') },
  { name: 'default slot', type: 'VNode',  defaultValue: '—', required: 'Sim', description: tContent('props.table.children')  },
]);

const tokenRows = computed(() => [
  { token: '--radius-card',     value: 'rounded-(--radius-card)', description: tContent('tokens.table.radiusCard')      },
  { token: '--card',            value: 'bg-card',                 description: tContent('tokens.table.card')            },
  { token: '--card-foreground', value: 'text-card-foreground',    description: tContent('tokens.table.cardForeground')  },
  { token: '--muted',           value: 'bg-muted/50',             description: stripHtml(tContent('tokens.table.muted'))       },
  { token: '--muted-foreground', value: 'text-muted-foreground',  description: tContent('tokens.table.mutedForeground') },
  { token: '--foreground',      value: 'ring-foreground/10',      description: stripHtml(tContent('tokens.table.foreground'))  },
  { token: '--border',          value: 'border-t',                description: tContent('tokens.table.border')          },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'),
  tContent('accessibility.item2'),
  tContent('accessibility.item3'),
  tContent('accessibility.item4'),
  tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: tContent('accessibility.keyboard.tab')        },
  { key: 'Enter', description: tContent('accessibility.keyboard.enter')      },
  { key: '—',     description: tContent('accessibility.keyboard.noKeyboard') },
]);

const relatedItems = computed(() => [
  { name: 'Separator', description: tContent('related.separator'), path: '?path=/docs/ui-separator--docs' },
  { name: 'Accordion', description: tContent('related.accordion'), path: '?path=/docs/ui-accordion--docs' },
  { name: 'Alert',     description: tContent('related.alert'),     path: '?path=/docs/ui-alert--docs'     },
  { name: 'Button',    description: stripHtml(tContent('related.button')), path: '?path=/docs/ui-button--docs'    },
  { name: 'Badge',     description: stripHtml(tContent('related.badge')),  path: '?path=/docs/ui-badge--docs'     },
  { name: 'Avatar',    description: stripHtml(tContent('related.avatar')), path: '?path=/docs/ui-avatar--docs'    },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.buttonClick'),   trigger: tContent('analytics.table.buttonClickTrigger'),   payload: tContent('analytics.table.buttonClickPayload')   },
  { event: tContent('analytics.table.cardClick'),     trigger: tContent('analytics.table.cardClickTrigger'),     payload: tContent('analytics.table.cardClickPayload')     },
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
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1.criterion'),            level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: stripHtml(tContent('testes.accessibility.item2.criterion')), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: stripHtml(tContent('testes.accessibility.item3.criterion')), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'),            level: tContent('testes.accessibility.item4.level'), how: stripHtml(tContent('testes.accessibility.item4.how')) },
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
        install-note="npx shadcn-vue@latest add card"
      />
    </template>

    <!-- ── Demonstração ───────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card>
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
            <CardAction>
              <Badge variant="secondary">{{ tContent('demonstration.labels.productStock') }}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent class="text-base font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" size="sm" :aria-label="`${tContent('demonstration.labels.actionEdit')} ${tContent('demonstration.labels.productTitle')}`">
              {{ tContent('demonstration.labels.actionEdit') }}
            </Button>
            <Button size="sm" :aria-label="`${tContent('demonstration.labels.actionDelete')} ${tContent('demonstration.labels.productTitle')}`">
              {{ tContent('demonstration.labels.actionDelete') }}
            </Button>
          </CardFooter>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.metricTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.metricTrend') }}</CardDescription>
          </CardHeader>
          <CardContent class="text-2xl font-semibold">
            {{ tContent('demonstration.labels.metricValue') }}
          </CardContent>
        </Card>
        <Card class="w-full max-w-sm">
          <CardHeader>
            <div class="flex items-center gap-3">
              <Avatar>
                <AvatarImage :src="DEMO_IMAGE_AVATAR" :alt="`Foto de perfil de ${tContent('demonstration.labels.profileTitle')}`" />
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <CardTitle>{{ tContent('demonstration.labels.profileTitle') }}</CardTitle>
                <CardDescription>{{ tContent('demonstration.labels.profileDescription') }}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
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
          { s: tContent('usage.scenarios.item6.s'), u: tContent('usage.scenarios.item6.u'), a: tContent('usage.scenarios.item6.a') },
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
          { element: tContent('usage.uxWriting.table.title.name'),     rules: tContent('usage.uxWriting.table.title.format'),     do: tContent('usage.uxWriting.table.title.good'),     dont: tContent('usage.uxWriting.table.title.bad') },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.action.name'),    rules: tContent('usage.uxWriting.table.action.format'),    do: tContent('usage.uxWriting.table.action.good'),    dont: tContent('usage.uxWriting.table.action.bad') },
          { element: tContent('usage.uxWriting.table.ariaLabel.name'), rules: tContent('usage.uxWriting.table.ariaLabel.format'), do: tContent('usage.uxWriting.table.ariaLabel.good'), dont: tContent('usage.uxWriting.table.ariaLabel.bad') },
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: stripHtml(tContent('doDont.pair2.do')), dontCaption: tContent('doDont.pair2.dont') },
      ]"
    >
      <template #do-preview-0>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="text-sm font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" size="sm">{{ tContent('demonstration.labels.actionCancel') }}</Button>
            <Button size="sm">{{ tContent('demonstration.labels.actionSave') }}</Button>
          </CardFooter>
        </Card>
      </template>
      <template #dont-preview-0>
        <Card class="w-full">
          <CardContent class="py-2 text-sm text-muted-foreground">—</CardContent>
        </Card>
      </template>
      <template #do-preview-1>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
          </CardHeader>
          <CardFooter class="justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              :aria-label="`${tContent('demonstration.labels.actionEdit')} ${tContent('demonstration.labels.productTitle')}`"
            >
              {{ tContent('demonstration.labels.actionEdit') }}
            </Button>
            <Button
              size="sm"
              :aria-label="`${tContent('demonstration.labels.actionDelete')} ${tContent('demonstration.labels.productTitle')}`"
            >
              {{ tContent('demonstration.labels.actionDelete') }}
            </Button>
          </CardFooter>
        </Card>
      </template>
      <template #dont-preview-1>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
          </CardHeader>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" size="sm">{{ tContent('demonstration.labels.actionEdit') }}</Button>
            <Button size="sm">{{ tContent('demonstration.labels.actionDelete') }}</Button>
          </CardFooter>
        </Card>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.full')"
      :secondary-code="codeImportFull"
    />

    <!-- ── Variantes (Tamanhos e Composições) ─────────────────────── -->
    <DocsVariants :title="tContent('variants.visualTitle')" :items="variantItems">
      <template #variant-preview-0>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="text-sm font-semibold">{{ tContent('demonstration.labels.productPrice') }}</CardContent>
        </Card>
      </template>
      <template #variant-preview-1>
        <Card size="sm" class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.metricTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.metricTrend') }}</CardDescription>
          </CardHeader>
          <CardContent class="text-xl font-semibold">{{ tContent('demonstration.labels.metricValue') }}</CardContent>
        </Card>
      </template>
      <template #variant-preview-2>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productStock') }}</CardDescription>
          </CardHeader>
          <CardContent class="text-sm font-semibold">{{ tContent('demonstration.labels.productPrice') }}</CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" size="sm">{{ tContent('demonstration.labels.actionCancel') }}</Button>
            <Button size="sm">{{ tContent('demonstration.labels.actionSave') }}</Button>
          </CardFooter>
        </Card>
      </template>
      <template #variant-preview-3>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productStock') }}</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                :aria-label="`${tContent('demonstration.labels.actionEdit')} ${tContent('demonstration.labels.productTitle')}`"
              >
                {{ tContent('demonstration.labels.actionEdit') }}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent class="text-sm font-semibold">{{ tContent('demonstration.labels.productPrice') }}</CardContent>
        </Card>
      </template>
      <template #variant-preview-4>
        <Card class="w-full">
          <div class="aspect-video w-full bg-muted" aria-hidden="true" />
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="text-sm font-semibold">{{ tContent('demonstration.labels.productPrice') }}</CardContent>
        </Card>
      </template>
    </DocsVariants>

    <!-- ── Composições ─────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="card"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <Card class="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Cadeira Gamer Pro</CardTitle>
            <CardDescription>Estrutura ergonômica.</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-lg font-semibold">R$ 1.299,00</p>
          </CardContent>
          <CardFooter class="justify-end gap-2">
            <Button variant="outline" aria-label="Editar produto Cadeira Gamer Pro">Editar</Button>
            <Button variant="destructive" aria-label="Excluir produto Cadeira Gamer Pro">Excluir</Button>
          </CardFooter>
        </Card>
      </template>
      <template #variant-preview-1>
        <Card class="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Assinantes ativos</CardTitle>
            <CardDescription>+12% no mês</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" aria-label="Editar métrica Assinantes ativos">Editar</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-semibold">8.742</p>
          </CardContent>
        </Card>
      </template>
      <template #variant-preview-2>
        <Card class="w-full max-w-sm">
          <img src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80" alt="Cadeira Gamer Pro" class="w-full h-40 object-cover" />
          <CardHeader>
            <CardTitle>Cadeira Gamer Pro</CardTitle>
            <CardDescription>Estrutura ergonômica.</CardDescription>
          </CardHeader>
        </Card>
      </template>
    </DocsCompositions>

    <!-- ── Configurações (States) ──────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="{
        state: tContent('states.cols.state'),
        trigger: tContent('states.cols.trigger'),
        behavior: tContent('states.cols.behavior'),
      }"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="[
        { title: tContent('props.cardTitle'),        cols: propCols, items: cardPropItems },
        { title: tContent('props.headerTitle'),      cols: propCols, items: slotOnlyItems },
        { title: tContent('props.cardTitleTitle'),   cols: propCols, items: slotOnlyItems },
        { title: tContent('props.descriptionTitle'), cols: propCols, items: slotOnlyItems },
        { title: tContent('props.actionTitle'),      cols: propCols, items: slotOnlyItems },
        { title: tContent('props.contentTitle'),     cols: propCols, items: slotOnlyItems },
        { title: tContent('props.footerTitle'),      cols: propCols, items: slotOnlyItems },
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
