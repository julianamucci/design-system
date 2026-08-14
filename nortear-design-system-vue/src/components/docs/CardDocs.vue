<script setup lang="ts">
import { computed, watch } from 'vue';
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
const { t: tContent, locale } = useTranslation(cardTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (cardTranslations as unknown as Record<
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

// ─── Analytics — demo events ──────────────────────────────────────────────────

function handleDemoActionClick(label: string, variant: string) {
  track('button_click', {
    component: 'button',
    label,
    variant,
    location: 'docs_demo',
  });
}
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
  <CardFooter class="nds-cluster" data-justify="end" data-spacing="sm">
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
    class="nds-w-full"
    style="aspect-ratio: 16 / 9; object-fit: cover"
  />
  <CardHeader>
    <CardTitle>Cadeira Gamer Pro</CardTitle>
    <CardDescription>
      Estrutura ergonômica com ajuste de altura.
    </CardDescription>
  </CardHeader>
  <CardContent>R$ 1.299,00</CardContent>
</Card>`;

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

const stateItems = computed(() => [
  { label: tContent('states.default.label'),     trigger: toPlainText(tContent('states.default.trigger')),     behavior: toPlainText(tContent('states.default.behavior'))     },
  { label: tContent('states.small.label'),       trigger: toPlainText(tContent('states.small.trigger')),       behavior: toPlainText(tContent('states.small.behavior'))       },
  { label: tContent('states.interactive.label'), trigger: toPlainText(tContent('states.interactive.trigger')), behavior: toPlainText(tContent('states.interactive.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const cardPropItems = computed(() => [
  { name: 'size',         type: '"default" | "sm"', defaultValue: '"default"', required: 'Não', description: toPlainText(tContent('props.table.size'))     },
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
  { token: '--muted',           value: 'nds-bg-muted-50',             description: toPlainText(tContent('tokens.table.muted'))       },
  { token: '--muted-foreground', value: 'nds-text-muted-foreground',  description: tContent('tokens.table.mutedForeground') },
  { token: '--foreground',      value: 'ring-foreground/10',      description: toPlainText(tContent('tokens.table.foreground'))  },
  { token: '--border',          value: 'border-t',                description: tContent('tokens.table.border')          },
  { token: '--card-bg',         value: 'hsl(var(--card))',            description: tContent('tokens.table.cardBg')      },
  { token: '--card-fg',         value: 'hsl(var(--card-foreground))', description: tContent('tokens.table.cardFg')      },
  { token: '--card-ring',       value: 'hsl(var(--foreground) / 0.1)', description: tContent('tokens.table.cardRing')   },
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
  { name: 'Separator', description: toPlainText(tContent('related.separator')), path: '?path=/docs/ui-separator--docs' },
  { name: 'Accordion', description: toPlainText(tContent('related.accordion')), path: '?path=/docs/ui-accordion--docs' },
  { name: 'Alert',     description: toPlainText(tContent('related.alert')),     path: '?path=/docs/ui-alert--docs'     },
  { name: 'Button',    description: toPlainText(tContent('related.button')), path: '?path=/docs/ui-button--docs'    },
  { name: 'Badge',     description: toPlainText(tContent('related.badge')),  path: '?path=/docs/ui-badge--docs'     },
  { name: 'Avatar',    description: toPlainText(tContent('related.avatar')), path: '?path=/docs/ui-avatar--docs'    },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
  { title: '', content: tContent('notes.tip4') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.buttonClick'),   trigger: toPlainText(tContent('analytics.table.buttonClickTrigger')),   payload: tContent('analytics.table.buttonClickPayload')   },
  { event: tContent('analytics.table.cardClick'),     trigger: toPlainText(tContent('analytics.table.cardClickTrigger')),     payload: tContent('analytics.table.cardClickPayload')     },
  { event: tContent('analytics.table.pageView'),      trigger: toPlainText(tContent('analytics.table.pageViewTrigger')),      payload: tContent('analytics.table.pageViewPayload')      },
  { event: tContent('analytics.table.sectionViewed'), trigger: toPlainText(tContent('analytics.table.sectionViewedTrigger')), payload: tContent('analytics.table.sectionViewedPayload') },
  { event: tContent('analytics.table.langSwitch'),    trigger: toPlainText(tContent('analytics.table.langSwitchTrigger')),    payload: tContent('analytics.table.langSwitchPayload')    },
]);

const a11yCritCols = computed(() => ({
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));

// toPlainText em TODA célula: estas três tabelas escrevem textNode, e o
// conteúdo compartilhado guarda <code>/&lt;a&gt; escapados para as seções que
// renderizam HTML. Interpolar o índice mantém as seis linhas iguais — foi a
// divergência linha a linha que deixou item6.action com a tag apagada.
const functionalTestItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    action: toPlainText(tContent(`testes.functional.item${i}.action`)),
    result: toPlainText(tContent(`testes.functional.item${i}.result`)),
    priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
  })),
);

const a11yTestItems = computed(() =>
  [1, 2, 3, 4, 5, 6].map((i) => ({
    criterion: toPlainText(tContent(`testes.accessibility.item${i}.criterion`)),
    level: tContent(`testes.accessibility.item${i}.level`),
    how: toPlainText(tContent(`testes.accessibility.item${i}.how`)),
  })),
);

const visualTestItems = computed(() =>
  [1, 2, 3, 4, 5].map((i) => ({
    story: toPlainText(tContent(`testes.visual.item${i}.story`)),
    priority: localPriority(tContent(`testes.visual.item${i}.priority`)),
  })),
);
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
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
      <div
        class="nds-w-full nds-grid"
        data-cols="2"
        data-spacing="md"
        style="--grid-min: 18rem"
      >
        <Card>
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {{ tContent('demonstration.labels.productStock') }}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent class="nds-text-base nds-font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
          <CardFooter
            class="nds-cluster"
            data-justify="end"
            data-spacing="sm"
          >
            <Button
              variant="outline"
              size="sm"
              :aria-label="`${tContent('demonstration.labels.actionEdit')} ${tContent('demonstration.labels.productTitle')}`"
              @click="handleDemoActionClick(tContent('demonstration.labels.actionEdit'), 'outline')"
            >
              {{ tContent('demonstration.labels.actionEdit') }}
            </Button>
            <Button
              size="sm"
              :aria-label="`${tContent('demonstration.labels.actionDelete')} ${tContent('demonstration.labels.productTitle')}`"
              @click="handleDemoActionClick(tContent('demonstration.labels.actionDelete'), 'default')"
            >
              {{ tContent('demonstration.labels.actionDelete') }}
            </Button>
          </CardFooter>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.metricTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.metricTrend') }}</CardDescription>
          </CardHeader>
          <CardContent class="nds-text-h4 nds-font-semibold">
            {{ tContent('demonstration.labels.metricValue') }}
          </CardContent>
        </Card>
        <Card class="nds-w-full nds-max-w-sm">
          <CardHeader>
            <div
              class="nds-cluster"
              data-spacing="sm"
            >
              <Avatar>
                <AvatarImage
                  :src="DEMO_IMAGE_AVATAR"
                  :alt="`Foto de perfil de ${tContent('demonstration.labels.profileTitle')}`"
                />
                <AvatarFallback>MR</AvatarFallback>
              </Avatar>
              <div class="nds-min-w-0">
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
          rules: tContent('usage.uxWriting.table.rules'),
          do: tContent('usage.uxWriting.table.correct'),
          dont: tContent('usage.uxWriting.table.avoid'),
        },
        items: [
          { element: tContent('usage.uxWriting.table.title.name'), rules: tContent('usage.uxWriting.table.title.format'), do: tContent('usage.uxWriting.table.title.good'), dont: tContent('usage.uxWriting.table.title.bad') },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.action.name'), rules: tContent('usage.uxWriting.table.action.format'), do: tContent('usage.uxWriting.table.action.good'), dont: tContent('usage.uxWriting.table.action.bad') },
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <Card class="nds-w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="nds-text-body nds-font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
          <CardFooter
            class="nds-cluster"
            data-justify="end"
            data-spacing="sm"
          >
            <Button
              variant="outline"
              size="sm"
            >
              {{ tContent('demonstration.labels.actionCancel') }}
            </Button>
            <Button size="sm">
              {{ tContent('demonstration.labels.actionSave') }}
            </Button>
          </CardFooter>
        </Card>
      </template>
      <template #dont-preview-0>
        <Card class="nds-w-full">
          <CardContent class="nds-py-2 nds-text-body nds-text-muted-foreground">
            —
          </CardContent>
        </Card>
      </template>
      <template #do-preview-1>
        <Card class="nds-w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
          </CardHeader>
          <CardFooter
            class="nds-cluster"
            data-justify="end"
            data-spacing="sm"
          >
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
        <Card class="nds-w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
          </CardHeader>
          <CardFooter
            class="nds-cluster"
            data-justify="end"
            data-spacing="sm"
          >
            <Button
              variant="outline"
              size="sm"
            >
              {{ tContent('demonstration.labels.actionEdit') }}
            </Button>
            <Button size="sm">
              {{ tContent('demonstration.labels.actionDelete') }}
            </Button>
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
    <DocsVariants
      :title="tContent('variants.visualTitle')"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <Card class="nds-w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="nds-text-body nds-font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
        </Card>
      </template>
      <template #variant-preview-1>
        <Card
          size="sm"
          class="nds-w-full"
        >
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.metricTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.metricTrend') }}</CardDescription>
          </CardHeader>
          <CardContent class="nds-text-lead nds-font-semibold">
            {{ tContent('demonstration.labels.metricValue') }}
          </CardContent>
        </Card>
      </template>
      <template #variant-preview-2>
        <Card class="nds-w-full">
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productStock') }}</CardDescription>
          </CardHeader>
          <CardContent class="nds-text-body nds-font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
          <CardFooter
            class="nds-cluster"
            data-justify="end"
            data-spacing="sm"
          >
            <Button
              variant="outline"
              size="sm"
            >
              {{ tContent('demonstration.labels.actionCancel') }}
            </Button>
            <Button size="sm">
              {{ tContent('demonstration.labels.actionSave') }}
            </Button>
          </CardFooter>
        </Card>
      </template>
      <template #variant-preview-3>
        <Card class="nds-w-full">
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
          <CardContent class="nds-text-body nds-font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
        </Card>
      </template>
      <template #variant-preview-4>
        <Card class="nds-w-full">
          <div
            class="nds-w-full nds-bg-muted"
            style="aspect-ratio: 16 / 9"
            aria-hidden="true"
          />
          <CardHeader>
            <CardTitle>{{ tContent('demonstration.labels.productTitle') }}</CardTitle>
            <CardDescription>{{ tContent('demonstration.labels.productDescription') }}</CardDescription>
          </CardHeader>
          <CardContent class="nds-text-body nds-font-semibold">
            {{ tContent('demonstration.labels.productPrice') }}
          </CardContent>
        </Card>
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
        { title: tContent('props.cardTitle'), cols: propCols, items: cardPropItems },
        { title: tContent('props.headerTitle'), cols: propCols, items: slotOnlyItems },
        { title: tContent('props.cardTitleTitle'), cols: propCols, items: slotOnlyItems },
        { title: tContent('props.descriptionTitle'), cols: propCols, items: slotOnlyItems },
        { title: tContent('props.actionTitle'), cols: propCols, items: slotOnlyItems },
        { title: tContent('props.contentTitle'), cols: propCols, items: slotOnlyItems },
        { title: tContent('props.footerTitle'), cols: propCols, items: slotOnlyItems },
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
      :customization-code="tContent('tokens.customizationCode')"
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
