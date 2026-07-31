<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-vue-next';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import uiTranslations from '@/i18n/ui.json';
import avatarTranslations from '@shared/content/avatar/translations.json';

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
const { t: tContent, locale } = useTranslation(avatarTranslations);

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

// ─── Demo assets ──────────────────────────────────────────────────────────────

const imgMaria = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format';
const imgAna   = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format';
const imgCarlos = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format';
const imgInvalid = 'https://broken.example.com/not-found.png';

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'avatar',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'avatar',
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
    component_name: 'avatar',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";`;
const codeImportWithIcon = `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-vue-next";`;

const codeImage = `<Avatar>
  <AvatarImage src="/maria.jpg" alt="Foto de perfil de Maria Rodrigues" />
  <AvatarFallback :delay-ms="600">MR</AvatarFallback>
</Avatar>`;

const codeInitials = `<Avatar>
  <AvatarFallback>JP</AvatarFallback>
</Avatar>`;

const codeIcon = `<Avatar>
  <AvatarFallback aria-label="Usuário genérico">
    <User class="nds-icon nds-text-muted-foreground" aria-hidden="true" />
  </AvatarFallback>
</Avatar>`;

const codeGroup = `<div style="display: flex">
  <Avatar style="box-shadow: 0 0 0 2px var(--background)">
    <AvatarImage src="/maria.jpg" alt="" />
    <AvatarFallback aria-hidden="true">MR</AvatarFallback>
  </Avatar>
  <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
    <AvatarImage src="/ana.jpg" alt="" />
    <AvatarFallback aria-hidden="true">AS</AvatarFallback>
  </Avatar>
  <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
    <AvatarFallback class="nds-text-caption" aria-hidden="true">+3</AvatarFallback>
  </Avatar>
</div>`;

const codeWithStatus = `<div style="position: relative; display: inline-block">
  <Avatar>
    <AvatarImage src="/maria.jpg" alt="Foto de perfil de Maria Rodrigues" />
    <AvatarFallback>MR</AvatarFallback>
  </Avatar>
  <span
    class="nds-rounded-full nds-bg-primary"
    style="position: absolute; bottom: 0; right: 0; height: 0.625rem; width: 0.625rem; box-shadow: 0 0 0 2px var(--background)"
    aria-label="online"
  />
</div>`;

const codeCustomizationTokens = `/* Em globals.css — personalizar tokens do fallback */
:root {
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
}

.dark {
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
}`;

const interfaceCode = `// Avatar
interface AvatarProps {
  class?: string;
}

// AvatarImage
interface AvatarImageProps {
  src: string;
  alt: string;
  onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
  class?: string;
}

// AvatarFallback
interface AvatarFallbackProps {
  delayMs?: number;
  class?: string;
}`;

// ─── Computed data ────────────────────────────────────────────────────────────

const anatomyItems = computed(() => [
  tContent('anatomy.item1'),
  tContent('anatomy.item2'),
  tContent('anatomy.item3'),
  tContent('anatomy.item4'),
]);

const variantItems = computed(() => [
  { name: 'image',      description: stripHtml(tContent('variants.items.image')),      code: codeImage      },
  { name: 'initials',   description: stripHtml(tContent('variants.items.initials')),   code: codeInitials   },
  { name: 'icon',       description: stripHtml(tContent('variants.items.icon')),       code: codeIcon       },
  { name: 'group',      description: stripHtml(tContent('variants.items.group')),      code: codeGroup      },
  { name: 'withStatus', description: stripHtml(tContent('variants.items.withStatus')), code: codeWithStatus },
]);

const stateItems = computed(() => [
  { label: tContent('states.loaded.label'),  trigger: stripHtml(tContent('states.loaded.trigger')),  behavior: tContent('states.loaded.behavior')  },
  { label: tContent('states.loading.label'), trigger: stripHtml(tContent('states.loading.trigger')), behavior: tContent('states.loading.behavior') },
  { label: tContent('states.failed.label'),  trigger: stripHtml(tContent('states.failed.trigger')),  behavior: tContent('states.failed.behavior')  },
  { label: tContent('states.noImage.label'), trigger: stripHtml(tContent('states.noImage.trigger')), behavior: tContent('states.noImage.behavior') },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'), type: tContent('props.table.type'),
  default: tContent('props.table.default'), required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const avatarPropItems = computed(() => [
  { name: 'class',    type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.className')) },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Sim', description: tContent('props.table.children') },
]);

const avatarImagePropItems = computed(() => [
  { name: 'src',                    type: 'string',   defaultValue: '—', required: 'Sim', description: tContent('props.table.src') },
  { name: 'alt',                    type: 'string',   defaultValue: '—', required: 'Sim', description: tContent('props.table.alt') },
  { name: 'onLoadingStatusChange',  type: '(status) => void', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.onLoadingStatusChange')) },
  { name: 'class',                  type: 'string',   defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.className')) },
]);

const avatarFallbackPropItems = computed(() => [
  { name: 'delayMs', type: 'number', defaultValue: '—', required: 'Não', description: tContent('props.table.delayMs') },
  { name: 'class',   type: 'string', defaultValue: '—', required: 'Não', description: stripHtml(tContent('props.table.className')) },
  { name: 'default slot', type: 'VNode', defaultValue: '—', required: 'Não', description: tContent('props.table.children') },
]);

const tokenRows = computed(() => [
  { token: '--muted',            value: 'bg-muted',               description: tContent('tokens.table.muted')           },
  { token: '--muted-foreground', value: 'nds-text-muted-foreground',  description: tContent('tokens.table.mutedForeground') },
  { token: '--background',       value: 'ring-background',        description: stripHtml(tContent('tokens.table.background')) },
  { token: '--border',           value: 'border',                 description: tContent('tokens.table.border')          },
  { token: '--primary',          value: 'bg-primary',             description: tContent('tokens.table.primary')         },
  { token: '--radius',           value: 'rounded-full',           description: stripHtml(tContent('tokens.table.radius')) },
  { token: '--ring',             value: 'ring',                   description: tContent('tokens.table.ring')            },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.item1'), tContent('accessibility.item2'),
  tContent('accessibility.item3'), tContent('accessibility.item4'), tContent('accessibility.item5'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',   description: 'Avatar em si não é focável. Se envolvido em link/botão, recebe foco como o pai.' },
  { key: 'Enter', description: 'Ativa o link/botão quando o Avatar for um trigger.' },
  { key: '—',     description: 'Avatar isolado não responde a teclado.' },
]);

const relatedItems = computed(() => [
  { name: 'Badge',       description: tContent('related.badge'),       path: '?path=/docs/ui-badge--docs'       },
  { name: 'AspectRatio', description: tContent('related.aspectRatio'), path: '?path=/docs/ui-aspectratio--docs' },
  { name: 'Tooltip',     description: tContent('related.tooltip'),     path: '?path=/docs/ui-tooltip--docs'     },
  { name: 'Card',        description: tContent('related.card'),        path: '?path=/docs/ui-card--docs'        },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.tip1') },
  { title: '', content: tContent('notes.tip2') },
  { title: '', content: tContent('notes.tip3') },
]);

const analyticsItems = computed(() => [
  { event: tContent('analytics.table.profileClick'),  trigger: tContent('analytics.table.profileClickTrigger'),  payload: tContent('analytics.table.profileClickPayload')  },
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
  { action: tContent('testes.functional.item1.action'), result: tContent('testes.functional.item1.result'), priority: localPriority(tContent('testes.functional.item1.priority')) },
  { action: tContent('testes.functional.item2.action'), result: tContent('testes.functional.item2.result'), priority: localPriority(tContent('testes.functional.item2.priority')) },
  { action: tContent('testes.functional.item3.action'), result: tContent('testes.functional.item3.result'), priority: localPriority(tContent('testes.functional.item3.priority')) },
  { action: tContent('testes.functional.item4.action'), result: tContent('testes.functional.item4.result'), priority: localPriority(tContent('testes.functional.item4.priority')) },
  { action: tContent('testes.functional.item5.action'), result: tContent('testes.functional.item5.result'), priority: localPriority(tContent('testes.functional.item5.priority')) },
  { action: tContent('testes.functional.item6.action'), result: tContent('testes.functional.item6.result'), priority: localPriority(tContent('testes.functional.item6.priority')) },
]);

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1.criterion'), level: tContent('testes.accessibility.item1.level'), how: tContent('testes.accessibility.item1.how') },
  { criterion: tContent('testes.accessibility.item2.criterion'), level: tContent('testes.accessibility.item2.level'), how: tContent('testes.accessibility.item2.how') },
  { criterion: tContent('testes.accessibility.item3.criterion'), level: tContent('testes.accessibility.item3.level'), how: tContent('testes.accessibility.item3.how') },
  { criterion: tContent('testes.accessibility.item4.criterion'), level: tContent('testes.accessibility.item4.level'), how: tContent('testes.accessibility.item4.how') },
]);

const visualTestItems = computed(() => [
  { story: tContent('testes.visual.item1.story'), priority: localPriority(tContent('testes.visual.item1.priority')) },
  { story: tContent('testes.visual.item2.story'), priority: localPriority(tContent('testes.visual.item2.priority')) },
  { story: tContent('testes.visual.item3.story'), priority: localPriority(tContent('testes.visual.item3.priority')) },
  { story: tContent('testes.visual.item4.story'), priority: localPriority(tContent('testes.visual.item4.priority')) },
]);

// ─── Computed props (estabilizam referências para filhos) ────────────────────

const whenToUseGuidelines = computed(() => ({
  title: tContent('usage.guidelines.title'),
  items: [tContent('usage.guidelines.item1'), tContent('usage.guidelines.item2'), tContent('usage.guidelines.item3'), tContent('usage.guidelines.item4')],
}));

const whenToUseScenarios = computed(() => ({
  title: tContent('usage.scenarios.title'),
  cols: { scenario: tContent('usage.scenarios.cols.scenario'), use: tContent('usage.scenarios.cols.use'), alternative: tContent('usage.scenarios.cols.alternative') },
  items: [
    { s: tContent('usage.scenarios.item1.s'), u: tContent('usage.scenarios.item1.u'), a: tContent('usage.scenarios.item1.a') },
    { s: tContent('usage.scenarios.item2.s'), u: tContent('usage.scenarios.item2.u'), a: tContent('usage.scenarios.item2.a') },
    { s: tContent('usage.scenarios.item3.s'), u: tContent('usage.scenarios.item3.u'), a: tContent('usage.scenarios.item3.a') },
    { s: tContent('usage.scenarios.item4.s'), u: tContent('usage.scenarios.item4.u'), a: tContent('usage.scenarios.item4.a') },
  ],
}));

const whenToUseUxWriting = computed(() => ({
  title: tContent('usage.uxWriting.title'),
  cols: { element: tContent('usage.uxWriting.table.element'), rules: tContent('usage.uxWriting.table.rules'), do: tContent('usage.uxWriting.table.correct'), dont: tContent('usage.uxWriting.table.avoid') },
  items: [
    { element: tContent('usage.uxWriting.table.alt.name'), rules: tContent('usage.uxWriting.table.alt.format'), do: tContent('usage.uxWriting.table.alt.good'), dont: tContent('usage.uxWriting.table.alt.bad') },
    { element: tContent('usage.uxWriting.table.initials.name'), rules: tContent('usage.uxWriting.table.initials.format'), do: tContent('usage.uxWriting.table.initials.good'), dont: tContent('usage.uxWriting.table.initials.bad') },
    { element: tContent('usage.uxWriting.table.status.name'), rules: tContent('usage.uxWriting.table.status.format'), do: tContent('usage.uxWriting.table.status.good'), dont: tContent('usage.uxWriting.table.status.bad') },
    { element: tContent('usage.uxWriting.table.decorative.name'), rules: tContent('usage.uxWriting.table.decorative.format'), do: tContent('usage.uxWriting.table.decorative.good'), dont: tContent('usage.uxWriting.table.decorative.bad') },
  ],
}));

const whenToUseDo = computed(() => ({
  title: tContent('usage.do.title'),
  items: [tContent('usage.do.item1'), tContent('usage.do.item2'), tContent('usage.do.item3'), tContent('usage.do.item4')],
}));

const whenToUseDont = computed(() => ({
  title: tContent('usage.dont.title'),
  items: [tContent('usage.dont.item1'), tContent('usage.dont.item2'), tContent('usage.dont.item3')],
}));

const doDontPairs = computed(() => [
  { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair1.do'), dontCaption: tContent('doDont.pair1.dont') },
  { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: tContent('doDont.pair2.do'), dontCaption: tContent('doDont.pair2.dont') },
]);

const statesCols = computed(() => ({
  state: tContent('states.cols.state'),
  trigger: tContent('states.cols.trigger'),
  behavior: tContent('states.cols.behavior'),
}));

const propsTables = computed(() => [
  { title: tContent('props.avatarTitle'),         cols: propCols.value, items: avatarPropItems.value         },
  { title: tContent('props.avatarImageTitle'),    cols: propCols.value, items: avatarImagePropItems.value    },
  { title: tContent('props.avatarFallbackTitle'), cols: propCols.value, items: avatarFallbackPropItems.value },
]);

const tokensCols = computed(() => ({
  token: tContent('tokens.table.token'),
  value: tContent('tokens.table.class'),
  description: tContent('tokens.table.part'),
}));

const analyticsCols = computed(() => ({
  event: tContent('analytics.table.event'),
  trigger: tContent('analytics.table.trigger'),
  payload: tContent('analytics.table.payload'),
}));

const testesFunctional = computed(() => ({
  title: tContent('testes.functional.title'),
  cols: { action: tNav('common.userAction'), result: tNav('common.expectedResult'), priority: tNav('common.priority') },
  items: functionalTestItems.value,
}));

const testesAccessibility = computed(() => ({
  title: tContent('testes.accessibility.title'),
  cols: a11yCritCols.value,
  items: a11yTestItems.value,
}));

const testesVisual = computed(() => ({
  title: tContent('testes.visual.title'),
  cols: { story: tNav('common.storyState'), priority: tNav('common.priority') },
  items: visualTestItems.value,
}));
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
        class="nds-cluster"
        data-justify="center"
        data-spacing="xl"
        style="align-items: flex-end; flex-wrap: wrap"
      >
        <div
          class="nds-stack"
          data-spacing="xs"
          style="align-items: center"
        >
          <Avatar>
            <AvatarImage
              :src="imgMaria"
              :alt="tContent('demonstration.labels.withImageAlt')"
            />
            <AvatarFallback :delay-ms="600">
              MR
            </AvatarFallback>
          </Avatar>
          <span class="nds-text-caption nds-text-muted-foreground">{{ tContent('demonstration.labels.withImage') }}</span>
        </div>

        <div
          class="nds-stack"
          data-spacing="xs"
          style="align-items: center"
        >
          <Avatar>
            <AvatarFallback>{{ tContent('demonstration.labels.withFallbackInitials') }}</AvatarFallback>
          </Avatar>
          <span class="nds-text-caption nds-text-muted-foreground">{{ tContent('demonstration.labels.withFallback') }}</span>
        </div>

        <div
          class="nds-stack"
          data-spacing="xs"
          style="align-items: center"
        >
          <Avatar>
            <AvatarFallback :aria-label="tContent('demonstration.labels.withIcon')">
              <User
                class="nds-icon nds-text-muted-foreground"
                aria-hidden="true"
              />
            </AvatarFallback>
          </Avatar>
          <span class="nds-text-caption nds-text-muted-foreground">{{ tContent('demonstration.labels.withIcon') }}</span>
        </div>

        <div
          class="nds-stack"
          data-spacing="xs"
          style="align-items: center"
        >
          <div style="display: flex">
            <Avatar style="box-shadow: 0 0 0 2px var(--background)">
              <AvatarImage
                :src="imgMaria"
                alt=""
              />
              <AvatarFallback aria-hidden="true">
                MR
              </AvatarFallback>
            </Avatar>
            <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
              <AvatarImage
                :src="imgAna"
                alt=""
              />
              <AvatarFallback aria-hidden="true">
                AS
              </AvatarFallback>
            </Avatar>
            <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
              <AvatarImage
                :src="imgCarlos"
                alt=""
              />
              <AvatarFallback aria-hidden="true">
                CS
              </AvatarFallback>
            </Avatar>
            <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
              <AvatarFallback
                class="nds-text-caption"
                aria-hidden="true"
              >
                +3
              </AvatarFallback>
            </Avatar>
          </div>
          <span class="nds-text-caption nds-text-muted-foreground">{{ tContent('demonstration.labels.groupTitle') }}</span>
        </div>

        <div
          class="nds-stack"
          data-spacing="xs"
          style="align-items: center"
        >
          <div style="position: relative; display: inline-block">
            <Avatar>
              <AvatarImage
                :src="imgMaria"
                :alt="tContent('demonstration.labels.withImageAlt')"
              />
              <AvatarFallback>MR</AvatarFallback>
            </Avatar>
            <span
              class="nds-rounded-full nds-bg-primary"
              style="position: absolute; bottom: 0; right: 0; height: 0.625rem; width: 0.625rem; box-shadow: 0 0 0 2px var(--background)"
              :aria-label="tContent('demonstration.labels.statusOnline')"
            />
          </div>
          <span class="nds-text-caption nds-text-muted-foreground">{{ tContent('demonstration.labels.statusTitle') }}</span>
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
      :guidelines="whenToUseGuidelines"
      :scenarios="whenToUseScenarios"
      :ux-writing="whenToUseUxWriting"
      :do="whenToUseDo"
      :dont="whenToUseDont"
    />

    <!-- ── Do & Don't ─────────────────────────────────────────────── -->
    <DocsDoDont
      :title="tContent('doDont.title')"
      :pairs="doDontPairs"
    >
      <template #do-preview-0>
        <Avatar>
          <AvatarImage
            :src="imgMaria"
            alt="Foto de perfil de Maria Rodrigues"
          />
          <AvatarFallback :delay-ms="600">
            MR
          </AvatarFallback>
        </Avatar>
      </template>
      <template #dont-preview-0>
        <Avatar>
          <AvatarImage
            :src="imgInvalid"
            alt=""
          />
        </Avatar>
      </template>
      <template #do-preview-1>
        <Avatar>
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
      </template>
      <template #dont-preview-1>
        <Avatar class="nds-text-caption">
          <AvatarFallback>maria</AvatarFallback>
        </Avatar>
      </template>
    </DocsDoDont>

    <!-- ── Importação ─────────────────────────────────────────────── -->
    <DocsImport
      :title="tContent('import.title')"
      :description="tContent('import.basic')"
      :code="codeImportBasic"
      :secondary-description="tContent('import.withIcon')"
      :secondary-code="codeImportWithIcon"
    />

    <!-- ── Variantes (composições) ─────────────────────────────────── -->
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
    >
      <template #variant-preview-0>
        <Avatar>
          <AvatarImage
            :src="imgMaria"
            :alt="tContent('demonstration.labels.withImageAlt')"
          />
          <AvatarFallback :delay-ms="600">
            MR
          </AvatarFallback>
        </Avatar>
      </template>
      <template #variant-preview-1>
        <Avatar>
          <AvatarFallback>{{ tContent('demonstration.labels.withFallbackInitials') }}</AvatarFallback>
        </Avatar>
      </template>
      <template #variant-preview-2>
        <Avatar>
          <AvatarFallback :aria-label="tContent('demonstration.labels.withIcon')">
            <User
              class="nds-icon nds-text-muted-foreground"
              aria-hidden="true"
            />
          </AvatarFallback>
        </Avatar>
      </template>
      <template #variant-preview-3>
        <div style="display: flex">
          <Avatar style="box-shadow: 0 0 0 2px var(--background)">
            <AvatarImage
              :src="imgMaria"
              alt=""
            />
            <AvatarFallback aria-hidden="true">
              MR
            </AvatarFallback>
          </Avatar>
          <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
            <AvatarImage
              :src="imgAna"
              alt=""
            />
            <AvatarFallback aria-hidden="true">
              AS
            </AvatarFallback>
          </Avatar>
          <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
            <AvatarImage
              :src="imgCarlos"
              alt=""
            />
            <AvatarFallback aria-hidden="true">
              CS
            </AvatarFallback>
          </Avatar>
          <Avatar style="box-shadow: 0 0 0 2px var(--background); margin-left: -0.5rem">
            <AvatarFallback
              class="nds-text-caption"
              aria-hidden="true"
            >
              +3
            </AvatarFallback>
          </Avatar>
        </div>
      </template>
      <template #variant-preview-4>
        <div style="position: relative; display: inline-block">
          <Avatar>
            <AvatarImage
              :src="imgMaria"
              :alt="tContent('demonstration.labels.withImageAlt')"
            />
            <AvatarFallback>MR</AvatarFallback>
          </Avatar>
          <span
            class="nds-rounded-full nds-bg-primary"
            style="position: absolute; bottom: 0; right: 0; height: 0.625rem; width: 0.625rem; box-shadow: 0 0 0 2px var(--background)"
            :aria-label="tContent('demonstration.labels.statusOnline')"
          />
        </div>
      </template>
    </DocsVariants>

    <!-- ── Configurações (States) ──────────────────────────────────── -->
    <DocsStates
      :title="tContent('states.title')"
      :cols="statesCols"
      :items="stateItems"
    />

    <!-- ── Propriedades ───────────────────────────────────────────── -->
    <DocsProps
      :title="tContent('props.title')"
      :tables="propsTables"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-notes="tContent('props.extensibility')"
    />

    <!-- ── Tokens ─────────────────────────────────────────────────── -->
    <DocsTokens
      :title="tContent('tokens.title')"
      :cols="tokensCols"
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
      :cols="analyticsCols"
      :items="analyticsItems"
    />

    <!-- ── Testes ─────────────────────────────────────────────────── -->
    <DocsTestes
      :title="tContent('testes.title')"
      :functional="testesFunctional"
      :accessibility="testesAccessibility"
      :visual="testesVisual"
    />
  </DocsPageLayout>
</template>
