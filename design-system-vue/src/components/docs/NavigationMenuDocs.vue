<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import DocsPageLayout from '@/components/docs/shared/sections/DocsPageLayout.vue';
import componentTranslations from '@shared/content/navigation-menu/translations.json';
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
  componentSlug: 'navigation-menu',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
  aiIntent: tContent('seo.aiIntent'),
  breadcrumb: [
    { name: 'Components', item: '/components' },
    { name: tContent('category'), item: '/components/navigation' },
    { name: tContent('title') },
  ],
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'navigation-menu',
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
      { id: 'variantes',    label: tContent('nav.variants')     },
      { id: 'composicoes',  label: tContent('nav.compositions') },
      { id: 'estados',      label: tContent('nav.states')       },
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
    component_name: 'navigation-menu',
    locale: locale.value,
  });
});
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";`;

const codeHorizontal = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[400px] gap-3 p-4">
          <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/b">Produto B</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const codeVertical = `<NavigationMenu orientation="vertical" aria-label="Navegação lateral">
  <NavigationMenuList class="flex-col items-start">
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/sobre">Sobre</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const interfaceCode = `// NavigationMenu (root)
interface NavigationMenuRootProps {
  value?: string;
  defaultValue?: string;
  delayDuration?: number;       // default 200
  skipDelayDuration?: number;   // default 300
  orientation?: 'horizontal' | 'vertical';
}

// NavigationMenuLink
interface NavigationMenuLinkProps {
  active?: boolean;             // aria-current="page"
  href?: string;
}

// NavigationMenuTrigger
interface NavigationMenuTriggerProps {
  disabled?: boolean;
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
  tContent('anatomy.item7'),
  tContent('anatomy.item8'),
]);

const variantItems = computed(() => [
  { name: tContent('variants.items.horizontal'), description: stripHtml(tContent('variants.styles.horizontal')), code: codeHorizontal },
  { name: tContent('variants.items.vertical'),   description: stripHtml(tContent('variants.styles.vertical')),   code: codeVertical   },
]);

// ─── Composições ──────────────────────────────────────────────────────────────

const codeLinkSimples = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/precos">Preços</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/contato">Contato</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const codeComDropdown = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[240px] gap-1 p-2">
          <li><NavigationMenuLink href="/produtos/inicial">Plano Inicial</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/profissional">Plano Profissional</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/empresarial">Plano Empresarial</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/comparar">Comparar planos</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const codeMegaMenuGrid = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="solucoes">
      <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="grid w-[560px] grid-cols-2 gap-2 p-3">
          <li>
            <NavigationMenuLink href="/solucoes/marketing">
              <div class="text-sm font-medium">Para Marketing</div>
              <p class="text-xs text-muted-foreground">Automação, leads e campanhas.</p>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="/solucoes/vendas">
              <div class="text-sm font-medium">Para Vendas</div>
              <p class="text-xs text-muted-foreground">Pipeline, CRM e propostas.</p>
            </NavigationMenuLink>
          </li>
          <!-- ...mais 4 itens -->
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const codeComCardDestacado = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="recursos">
      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div class="flex gap-3 w-[560px] p-3">
          <a href="/quickstart" class="flex flex-col justify-end w-[220px] rounded-md bg-gradient-to-b from-muted to-accent p-4 no-underline">
            <div class="text-base font-semibold leading-tight">Comece em 5 minutos</div>
            <p class="mt-2 text-sm leading-snug text-muted-foreground">
              Crie sua primeira integração com nosso quickstart.
            </p>
          </a>
          <ul class="flex flex-col flex-1 gap-1">
            <li><NavigationMenuLink href="/docs">Documentação</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/tutoriais">Tutoriais</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/comunidade">Comunidade</NavigationMenuLink></li>
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const compositionItems = computed(() => [
  {
    name: tContent('variants.compositions.linkSimples.name'),
    description: tContent('variants.compositions.linkSimples.description'),
    useWhen: tContent('variants.compositions.linkSimples.use'),
    code: codeLinkSimples,
  },
  {
    name: tContent('variants.compositions.comDropdown.name'),
    description: tContent('variants.compositions.comDropdown.description'),
    useWhen: tContent('variants.compositions.comDropdown.use'),
    code: codeComDropdown,
  },
  {
    name: tContent('variants.compositions.megaMenuGrid.name'),
    description: tContent('variants.compositions.megaMenuGrid.description'),
    useWhen: tContent('variants.compositions.megaMenuGrid.use'),
    code: codeMegaMenuGrid,
  },
  {
    name: tContent('variants.compositions.comCardDestacado.name'),
    description: tContent('variants.compositions.comCardDestacado.description'),
    useWhen: tContent('variants.compositions.comCardDestacado.use'),
    code: codeComCardDestacado,
  },
]);

const stateItems = computed(() => [
  { label: tContent('states.items.closed'), trigger: '—',            behavior: stripHtml(tContent('states.descriptions.closed')) },
  { label: tContent('states.items.open'),   trigger: 'defaultValue', behavior: stripHtml(tContent('states.descriptions.open'))   },
  { label: tContent('states.items.active'), trigger: 'aria-current', behavior: stripHtml(tContent('states.descriptions.active')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const navMenuPropItems = computed(() => [
  { name: 'value',             type: tContent('props.table.value.type'),             defaultValue: tContent('props.table.value.default'),             required: tContent('props.table.value.required'),             description: stripHtml(tContent('props.table.value.description'))             },
  { name: '@update:value',     type: tContent('props.table.onValueChange.type'),     defaultValue: tContent('props.table.onValueChange.default'),     required: tContent('props.table.onValueChange.required'),     description: stripHtml(tContent('props.table.onValueChange.description'))     },
  { name: 'defaultValue',      type: tContent('props.table.defaultValue.type'),      defaultValue: tContent('props.table.defaultValue.default'),      required: tContent('props.table.defaultValue.required'),      description: stripHtml(tContent('props.table.defaultValue.description'))      },
  { name: 'delayDuration',     type: tContent('props.table.delayDuration.type'),     defaultValue: tContent('props.table.delayDuration.default'),     required: tContent('props.table.delayDuration.required'),     description: stripHtml(tContent('props.table.delayDuration.description'))     },
  { name: 'skipDelayDuration', type: tContent('props.table.skipDelayDuration.type'), defaultValue: tContent('props.table.skipDelayDuration.default'), required: tContent('props.table.skipDelayDuration.required'), description: stripHtml(tContent('props.table.skipDelayDuration.description')) },
  { name: 'orientation',       type: tContent('props.table.orientation.type'),       defaultValue: tContent('props.table.orientation.default'),       required: tContent('props.table.orientation.required'),       description: stripHtml(tContent('props.table.orientation.description'))       },
]);

const tokenRows = computed(() => [
  { token: '--background',      value: tContent('tokens.table.rootBg.class'),         description: tContent('tokens.table.rootBg.part')         },
  { token: '--accent (trigger)',value: tContent('tokens.table.triggerHover.class'),   description: tContent('tokens.table.triggerHover.part')   },
  { token: '--accent (link)',   value: tContent('tokens.table.linkActive.class'),     description: tContent('tokens.table.linkActive.part')     },
  { token: '--popover',         value: tContent('tokens.table.viewportBg.class'),     description: tContent('tokens.table.viewportBg.part')     },
  { token: '--foreground/10',   value: tContent('tokens.table.viewportBorder.class'), description: tContent('tokens.table.viewportBorder.part') },
  { token: '--shadow',          value: tContent('tokens.table.viewportShadow.class'), description: tContent('tokens.table.viewportShadow.part') },
  { token: '--radius-lg',       value: tContent('tokens.table.rounded.class'),        description: tContent('tokens.table.rounded.part')        },
  { token: '--popover (ind)',   value: tContent('tokens.table.indicator.class'),      description: tContent('tokens.table.indicator.part')      },
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
  { key: 'Tab',           description: stripHtml(tContent('accessibility.keyboard.tab'))     },
  { key: '← / →  ↑ / ↓',  description: stripHtml(tContent('accessibility.keyboard.arrows')) },
  { key: 'Enter / Space', description: stripHtml(tContent('accessibility.keyboard.enter'))  },
  { key: 'Escape',        description: stripHtml(tContent('accessibility.keyboard.escape')) },
  { key: 'Home / End',    description: stripHtml(tContent('accessibility.keyboard.homeEnd'))},
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.menubar.name'),    description: tContent('related.items.menubar.description'),    path: '?path=/docs/ui-menubar--docs'    },
  { name: tContent('related.items.sidebar.name'),    description: tContent('related.items.sidebar.description'),    path: '?path=/docs/ui-sidebar--docs'    },
  { name: tContent('related.items.breadcrumb.name'), description: tContent('related.items.breadcrumb.description'), path: '?path=/docs/ui-breadcrumb--docs' },
  { name: tContent('related.items.tabs.name'),       description: tContent('related.items.tabs.description'),       path: '?path=/docs/ui-tabs--docs'       },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
  { title: '', content: tContent('notes.item5') },
  { title: '', content: tContent('notes.item6') },
]);

const analyticsItems = computed(() => [
  { event: 'nav_menu_open',  trigger: '@update:value(item)', payload: "{ component: 'navigation-menu', label }" },
  { event: 'nav_link_click', trigger: 'click em Link',       payload: "{ component: 'navigation-menu', label, destination }" },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4, 5, 6, 7].map((i) => ({
  action: stripHtml(tContent(`testes.functional.item${i}.action`)),
  result: stripHtml(tContent(`testes.functional.item${i}.result`)),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [
  { criterion: tContent('testes.accessibility.item1'), level: 'AA',    how: 'axe-core'           },
  { criterion: tContent('testes.accessibility.item2'), level: '1.3.1', how: 'DevTools attribute' },
  { criterion: tContent('testes.accessibility.item3'), level: '4.1.2', how: 'DevTools attribute' },
  { criterion: tContent('testes.accessibility.item4'), level: '4.1.2', how: 'DevTools a11y tree' },
  { criterion: tContent('testes.accessibility.item5'), level: '2.4.3', how: 'Manual review'      },
  { criterion: tContent('testes.accessibility.item6'), level: '1.4.3', how: 'Contrast checker'   },
]);

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
  <DocsPageLayout :nav-groups="navGroups" :active-section="activeSection" component-slug="navigation-menu">
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
        install-note="npx shadcn-vue@latest add navigation-menu"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div class="w-full flex justify-center" style="contain: layout; min-height: 320px;">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#" :active="true">{{ stripHtml(tContent('demonstration.labels.simpleLink')) }}</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{{ stripHtml(tContent('demonstration.labels.withDropdown')) }}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[400px] gap-3 p-4">
                  <li><NavigationMenuLink href="#">Produto A</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Produto B</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Produto C</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{{ stripHtml(tContent('demonstration.labels.withGrid')) }}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[600px] grid-cols-2 gap-3 p-4">
                  <li><NavigationMenuLink href="#">Solução 1</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Solução 2</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Solução 3</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Solução 4</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
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
          { element: tContent('usage.uxWriting.table.trigger.name'),     rules: tContent('usage.uxWriting.table.trigger.format'),     do: tContent('usage.uxWriting.table.trigger.good'),     dont: tContent('usage.uxWriting.table.trigger.bad')     },
          { element: tContent('usage.uxWriting.table.link.name'),        rules: tContent('usage.uxWriting.table.link.format'),        do: tContent('usage.uxWriting.table.link.good'),        dont: tContent('usage.uxWriting.table.link.bad')        },
          { element: tContent('usage.uxWriting.table.ariaLabel.name'),   rules: tContent('usage.uxWriting.table.ariaLabel.format'),   do: tContent('usage.uxWriting.table.ariaLabel.good'),   dont: tContent('usage.uxWriting.table.ariaLabel.bad')   },
          { element: tContent('usage.uxWriting.table.currentPage.name'), rules: tContent('usage.uxWriting.table.currentPage.format'), do: tContent('usage.uxWriting.table.currentPage.good'), dont: tContent('usage.uxWriting.table.currentPage.bad') },
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
        <div style="contain: layout; min-height: 80px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
            <NavigationMenuList>
              <NavigationMenuItem><NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Sobre</NavigationMenuLink></NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #dont-preview-0>
        <div style="contain: layout; min-height: 80px;" class="w-full flex justify-center">
          <NavigationMenu :delay-duration="80">
            <NavigationMenuList>
              <NavigationMenuItem><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Sobre</NavigationMenuLink></NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #do-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="produtos">
            <NavigationMenuList>
              <NavigationMenuItem value="produtos">
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul class="grid w-[400px] grid-cols-2 gap-3 p-4">
                    <li><NavigationMenuLink href="#">Plano Pro</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">Plano Empresa</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">API</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">Integrações</NavigationMenuLink></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #dont-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="todos">
            <NavigationMenuList>
              <NavigationMenuItem value="todos">
                <NavigationMenuTrigger>Todos os links</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul class="grid w-[400px] gap-1 p-4 text-xs">
                    <li v-for="i in 12" :key="i"><NavigationMenuLink href="#">Link {{ i }} (sem grupo)</NavigationMenuLink></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
        <div style="contain: layout; min-height: 220px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
            <NavigationMenuList>
              <NavigationMenuItem><NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul class="grid w-[300px] gap-2 p-3">
                    <li><NavigationMenuLink href="#">Produto A</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">Produto B</NavigationMenuLink></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Sobre</NavigationMenuLink></NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 220px;" class="w-full flex justify-start">
          <NavigationMenu orientation="vertical" aria-label="Navegação lateral" :delay-duration="80">
            <NavigationMenuList class="flex-col items-start gap-1">
              <NavigationMenuItem><NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Sobre</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Contato</NavigationMenuLink></NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
    </DocsVariants>

    <!-- ── Composições ──────────────────────────────────────────────── -->
    <DocsCompositions
      :title="tContent('variants.compositionsTitle')"
      :use-when-label="tNav('common.useWhen')"
      component-slug="navigation-menu"
      :items="compositionItems"
    >
      <template #variant-preview-0>
        <div style="contain: layout; min-height: 200px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
            <NavigationMenuList>
              <NavigationMenuItem><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Preços</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem><NavigationMenuLink href="#">Contato</NavigationMenuLink></NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout; min-height: 280px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="produtos">
            <NavigationMenuList>
              <NavigationMenuItem><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
              <NavigationMenuItem value="produtos">
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul class="grid w-[240px] gap-1 p-2">
                    <li><NavigationMenuLink href="#">Plano Inicial</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">Plano Profissional</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">Plano Empresarial</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#">Comparar planos</NavigationMenuLink></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout; min-height: 320px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="solucoes">
            <NavigationMenuList>
              <NavigationMenuItem value="solucoes">
                <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul class="grid w-[560px] grid-cols-2 gap-2 p-3">
                    <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Marketing</div><p class="text-xs text-muted-foreground">Automação, leads e campanhas.</p></NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Vendas</div><p class="text-xs text-muted-foreground">Pipeline, CRM e propostas.</p></NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Suporte</div><p class="text-xs text-muted-foreground">Tickets, base de conhecimento.</p></NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Sucesso</div><p class="text-xs text-muted-foreground">Onboarding e retenção.</p></NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Operações</div><p class="text-xs text-muted-foreground">Workflows e integrações.</p></NavigationMenuLink></li>
                    <li><NavigationMenuLink href="#"><div class="text-sm font-medium">Para Analytics</div><p class="text-xs text-muted-foreground">Dashboards e relatórios.</p></NavigationMenuLink></li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout; min-height: 320px;" class="w-full flex justify-center">
          <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="recursos">
            <NavigationMenuList>
              <NavigationMenuItem value="recursos">
                <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div class="flex gap-3 w-[560px] p-3">
                    <a href="#" class="flex flex-col justify-end w-[220px] rounded-md bg-gradient-to-b from-muted to-accent p-4 no-underline">
                      <div class="text-base font-semibold leading-tight">Comece em 5 minutos</div>
                      <p class="mt-2 text-sm leading-snug text-muted-foreground">
                        Crie sua primeira integração com nosso quickstart.
                      </p>
                    </a>
                    <ul class="flex flex-col flex-1 gap-1">
                      <li><NavigationMenuLink href="#">Documentação</NavigationMenuLink></li>
                      <li><NavigationMenuLink href="#">Tutoriais</NavigationMenuLink></li>
                      <li><NavigationMenuLink href="#">Comunidade</NavigationMenuLink></li>
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
        { title: 'NavigationMenu', cols: propCols, items: navMenuPropItems },
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
