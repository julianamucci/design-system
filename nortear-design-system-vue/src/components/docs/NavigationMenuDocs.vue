<script setup lang="ts">
import { computed, watch } from 'vue';
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
import DocsCompositions  from '@/components/docs/shared/sections/DocsCompositions.vue';
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

const { t: tContent, locale } = useTranslation(componentTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
const screenReaderItems = computed(() =>
  Object.values(
    (componentTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  ),
);
const { t: tNav } = useTranslation(uiTranslations);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const horizontalCode = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="nds-grid nds-p-4" data-spacing="sm" style="width: 400px">
          <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
          <li><NavigationMenuLink href="/produtos/b">Produto B</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const verticalCode = `<NavigationMenu orientation="vertical" aria-label="Navegação lateral">
  <NavigationMenuList style="flex-direction: column; align-items: flex-start">
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
  { trackId: 'horizontal', name: tContent('variants.items.horizontal'), description: stripHtml(tContent('variants.styles.horizontal')), code: horizontalCode },
  { trackId: 'vertical', name: tContent('variants.items.vertical'),   description: stripHtml(tContent('variants.styles.vertical')),   code: verticalCode   },
  {
    trackId: 'linkSimples',
    name: tContent('variants.items.linkSimples.name'),
    description: tContent('variants.items.linkSimples.description'),
    useWhen: tContent('variants.items.linkSimples.use'),
    code: simpleCodeLink,
  },
  {
    trackId: 'comDropdown',
    name: tContent('variants.items.comDropdown.name'),
    description: tContent('variants.items.comDropdown.description'),
    useWhen: tContent('variants.items.comDropdown.use'),
    code: codeWithDropdown,
  },
  {
    trackId: 'megaMenuGrid',
    name: tContent('variants.items.megaMenuGrid.name'),
    description: tContent('variants.items.megaMenuGrid.description'),
    useWhen: tContent('variants.items.megaMenuGrid.use'),
    code: codeMegaMenuGrid,
  },
  {
    trackId: 'comCardDestacado',
    name: tContent('variants.items.comCardDestacado.name'),
    description: tContent('variants.items.comCardDestacado.description'),
    useWhen: tContent('variants.items.comCardDestacado.use'),
    code: codeWithCardDestacado,
  },
]);

// ─── Composições ──────────────────────────────────────────────────────────────

const simpleCodeLink = `<NavigationMenu aria-label="Navegação principal">
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

const codeWithDropdown = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuLink href="/">Início</NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem value="produtos">
      <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul class="nds-grid nds-p-2" data-spacing="xs" style="width: 240px">
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
        <ul class="nds-grid nds-p-4" data-cols="2" data-spacing="sm" style="width: 560px">
          <li>
            <NavigationMenuLink href="/solucoes/marketing">
              <div class="nds-text-body nds-font-medium">Para Marketing</div>
              <p class="nds-text-caption nds-text-muted-foreground">Automação, leads e campanhas.</p>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink href="/solucoes/vendas">
              <div class="nds-text-body nds-font-medium">Para Vendas</div>
              <p class="nds-text-caption nds-text-muted-foreground">Pipeline, CRM e propostas.</p>
            </NavigationMenuLink>
          </li>
          <!-- ...mais 4 itens -->
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const codeWithCardDestacado = `<NavigationMenu aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="recursos">
      <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div class="nds-cluster nds-p-4" data-spacing="md" style="width: 560px">
          <a href="/quickstart" class="nds-stack nds-rounded-md nds-p-4" style="width: 220px; justify-content: flex-end; text-decoration: none; background: linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--accent)))">
            <div class="nds-text-base nds-font-semibold nds-leading-tight">Comece em 5 minutos</div>
            <p class="nds-mt-2 nds-text-body nds-leading-tight">
              Crie sua primeira integração com nosso quickstart.
            </p>
          </a>
          <ul class="nds-stack nds-flex-1" data-spacing="xs">
            <li><NavigationMenuLink href="/docs">Documentação</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/tutoriais">Tutoriais</NavigationMenuLink></li>
            <li><NavigationMenuLink href="/comunidade">Comunidade</NavigationMenuLink></li>
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`;

const stateItems = computed(() => [
  { label: tContent('states.closed.label'), trigger: toPlainText(tContent('states.closed.trigger')), behavior: toPlainText(tContent('states.closed.behavior')) },
  { label: tContent('states.open.label'),   trigger: toPlainText(tContent('states.open.trigger')),   behavior: toPlainText(tContent('states.open.behavior')) },
  { label: tContent('states.active.label'), trigger: toPlainText(tContent('states.active.trigger')), behavior: toPlainText(tContent('states.active.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const navMenuPropItems = computed(() => [
  { name: 'value',             type: tContent('props.table.value.type'),             defaultValue: tContent('props.table.value.default'),             required: tContent('props.table.value.required'),             description: toPlainText(tContent('props.table.value.description'))             },
  { name: '@update:value',     type: tContent('props.table.onValueChange.type'),     defaultValue: tContent('props.table.onValueChange.default'),     required: tContent('props.table.onValueChange.required'),     description: toPlainText(tContent('props.table.onValueChange.description'))     },
  { name: 'defaultValue',      type: tContent('props.table.defaultValue.type'),      defaultValue: tContent('props.table.defaultValue.default'),      required: tContent('props.table.defaultValue.required'),      description: toPlainText(tContent('props.table.defaultValue.description'))      },
  { name: 'delayDuration',     type: tContent('props.table.delayDuration.type'),     defaultValue: tContent('props.table.delayDuration.default'),     required: tContent('props.table.delayDuration.required'),     description: toPlainText(tContent('props.table.delayDuration.description'))     },
  { name: 'skipDelayDuration', type: tContent('props.table.skipDelayDuration.type'), defaultValue: tContent('props.table.skipDelayDuration.default'), required: tContent('props.table.skipDelayDuration.required'), description: toPlainText(tContent('props.table.skipDelayDuration.description')) },
  { name: 'orientation',       type: tContent('props.table.orientation.type'),       defaultValue: tContent('props.table.orientation.default'),       required: tContent('props.table.orientation.required'),       description: toPlainText(tContent('props.table.orientation.description'))       },
]);

const tokenRows = computed(() => [
  { token: '--background',   value: tContent('tokens.table.rootBg.class'),         description: tContent('tokens.table.rootBg.part')         },
  { token: '--accent',       value: tContent('tokens.table.triggerHover.class'),   description: tContent('tokens.table.triggerHover.part')   },
  { token: '--accent',       value: tContent('tokens.table.linkActive.class'),     description: tContent('tokens.table.linkActive.part')     },
  { token: '--popover',      value: '.nds-navigation-menu-viewport-panel',         description: tContent('tokens.table.viewportBg.part')     },
  { token: '--border',       value: '.nds-navigation-menu-viewport-panel',         description: tContent('tokens.table.viewportBorder.part') },
  { token: '--elevation-md', value: '.nds-navigation-menu-viewport-panel',         description: tContent('tokens.table.viewportShadow.part') },
  { token: '--radius',       value: '.nds-navigation-menu-viewport-panel',         description: tContent('tokens.table.rounded.part')        },
  { token: '--border',       value: tContent('tokens.table.indicator.class'),      description: tContent('tokens.table.indicator.part')      },
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
  { key: 'Tab',           description: toPlainText(tContent('accessibility.keyboard.tab'))     },
  { key: 'Arrow Up / Arrow Down / Arrow Left / Arrow Right',  description: toPlainText(tContent('accessibility.keyboard.arrows')) },
  { key: 'Enter / Space', description: toPlainText(tContent('accessibility.keyboard.enter'))  },
  { key: 'Escape',        description: toPlainText(tContent('accessibility.keyboard.escape')) },
  { key: 'Home / End',    description: toPlainText(tContent('accessibility.keyboard.homeEnd'))},
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.menubar.name'),    description: toPlainText(tContent('related.items.menubar.description')),    path: '?path=/docs/components-navigation-menubar--docs'    },
  { name: tContent('related.items.sidebar.name'),    description: toPlainText(tContent('related.items.sidebar.description')),    path: '?path=/docs/components-layout-sidebar--docs'    },
  { name: tContent('related.items.breadcrumb.name'), description: toPlainText(tContent('related.items.breadcrumb.description')), path: '?path=/docs/components-navigation-breadcrumb--docs' },
  { name: tContent('related.items.tabs.name'),       description: toPlainText(tContent('related.items.tabs.description')),       path: '?path=/docs/components-navigation-tabs--docs'       },
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
  action: toPlainText(tContent(`testes.functional.item${i}.action`)),
  result: toPlainText(tContent(`testes.functional.item${i}.result`)),
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
  criterion: tNav('common.criterion'),
  level: 'WCAG',
  how: tNav('common.howToVerify'),
}));
</script>

<template>
  <DocsPageLayout
    :nav-groups="navGroups"
    :active-section="activeSection"
    component-slug="navigation-menu"
  >
    <template #header>
      <DocsHeader
        :title="tContent('title')"
        :description="tContent('description')"
        :category="tContent('category')"
        :type="tContent('type')"
      />
    </template>

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-cluster nds-w-full nds-min-h-80"
        data-justify="center"
        style="contain: layout"
      >
        <NavigationMenu
          :aria-label="tContent('demonstration.title')"
          :delay-duration="80"
        >
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="#"
                :active="true"
              >
                {{ stripHtml(tContent('demonstration.labels.simpleLink')) }}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{{ stripHtml(tContent('demonstration.labels.withDropdown')) }}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul
                  class="nds-grid nds-p-4"
                  data-spacing="sm"
                  style="width: 400px"
                >
                  <li>
                    <NavigationMenuLink href="#">
                      Produto A
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      Produto B
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      Produto C
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{{ stripHtml(tContent('demonstration.labels.withGrid')) }}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul
                  class="nds-grid nds-p-4"
                  data-cols="2"
                  data-spacing="sm"
                  style="width: 600px"
                >
                  <li>
                    <NavigationMenuLink href="#">
                      Solução 1
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      Solução 2
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      Solução 3
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">
                      Solução 4
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">
                Sobre
              </NavigationMenuLink>
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
          { element: tContent('usage.uxWriting.table.trigger.name'), rules: tContent('usage.uxWriting.table.trigger.format'), do: tContent('usage.uxWriting.table.trigger.good'), dont: tContent('usage.uxWriting.table.trigger.bad') },
          { element: tContent('usage.uxWriting.table.link.name'), rules: tContent('usage.uxWriting.table.link.format'), do: tContent('usage.uxWriting.table.link.good'), dont: tContent('usage.uxWriting.table.link.bad') },
          { element: tContent('usage.uxWriting.table.ariaLabel.name'), rules: tContent('usage.uxWriting.table.ariaLabel.format'), do: tContent('usage.uxWriting.table.ariaLabel.good'), dont: tContent('usage.uxWriting.table.ariaLabel.bad') },
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
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: 'Faça', dontLabel: 'Evite', doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <div
          style="contain: layout"
          class="nds-cluster nds-w-full nds-min-h-20"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="stripHtml(tContent('doDont.pair1.do'))"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#"
                  :active="true"
                >
                  Início
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Sobre
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #dont-preview-0>
        <div
          style="contain: layout"
          class="nds-cluster nds-w-full nds-min-h-20"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="stripHtml(tContent('doDont.pair1.dont'))"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Início
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Sobre
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #do-preview-1>
        <div
          style="contain: layout; min-height: 220px;"
          class="nds-cluster nds-w-full"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="stripHtml(tContent('doDont.pair2.do'))"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="produtos">
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul
                    class="nds-grid nds-p-4"
                    data-cols="2"
                    data-spacing="sm"
                    style="width: 400px"
                  >
                    <li>
                      <NavigationMenuLink href="#">
                        Plano Pro
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        Plano Empresa
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        API
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        Integrações
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #dont-preview-1>
        <div
          style="contain: layout; min-height: 220px;"
          class="nds-cluster nds-w-full"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="stripHtml(tContent('doDont.pair2.dont'))"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="todos">
                <NavigationMenuTrigger>Todos os links</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul
                    class="nds-grid nds-p-4 nds-text-caption"
                    data-spacing="xs"
                    style="width: 400px"
                  >
                    <li
                      v-for="i in 12"
                      :key="i"
                    >
                      <NavigationMenuLink href="#">
                        Link {{ i }} (without group)
                      </NavigationMenuLink>
                    </li>
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
    <DocsCompositions
      id="variantes"
      :title="tContent('variants.title')"
      :items="variantItems"
      :use-when-label="tNav('common.useWhen')"
      component-slug="navigation-menu"
    >
      <template #variant-preview-0>
        <div
          style="contain: layout; min-height: 220px;"
          class="nds-cluster nds-w-full"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="tContent('variants.items.horizontal')"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#"
                  :active="true"
                >
                  Início
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul
                    class="nds-grid nds-p-4"
                    data-spacing="sm"
                    style="width: 300px"
                  >
                    <li>
                      <NavigationMenuLink href="#">
                        Produto A
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        Produto B
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Sobre
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-1>
        <div
          style="contain: layout; min-height: 220px;"
          class="nds-cluster nds-w-full"
          data-justify="start"
        >
          <NavigationMenu
            orientation="vertical"
            aria-label="Navegação lateral"
            :delay-duration="80"
          >
            <NavigationMenuList style="flex-direction: column; align-items: flex-start; gap: 0.25rem">
              <NavigationMenuItem>
                <NavigationMenuLink
                  href="#"
                  :active="true"
                >
                  Início
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Sobre
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Contato
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-2>
        <div
          style="contain: layout"
          class="nds-cluster nds-w-full nds-min-h-50"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="tContent('variants.items.linkSimples.name')"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Início
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Preços
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Contato
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-3>
        <div
          style="contain: layout"
          class="nds-cluster nds-w-full nds-min-h-70"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="tContent('variants.items.comDropdown.name')"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">
                  Início
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem value="produtos">
                <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul
                    class="nds-grid nds-p-2"
                    data-spacing="xs"
                    style="width: 240px"
                  >
                    <li>
                      <NavigationMenuLink href="#">
                        Plano Inicial
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        Plano Profissional
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        Plano Empresarial
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        Comparar planos
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-4>
        <div
          style="contain: layout"
          class="nds-cluster nds-w-full nds-min-h-80"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="tContent('variants.items.megaMenuGrid.name')"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="solucoes">
                <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul
                    class="nds-grid nds-p-4"
                    data-cols="2"
                    data-spacing="sm"
                    style="width: 560px"
                  >
                    <li>
                      <NavigationMenuLink href="#">
                        <div class="nds-text-body nds-font-medium">
                          Para Marketing
                        </div><p class="nds-text-caption nds-text-muted-foreground">
                          Automação, leads e campanhas.
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        <div class="nds-text-body nds-font-medium">
                          Para Vendas
                        </div><p class="nds-text-caption nds-text-muted-foreground">
                          Pipeline, CRM e propostas.
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        <div class="nds-text-body nds-font-medium">
                          Para Suporte
                        </div><p class="nds-text-caption nds-text-muted-foreground">
                          Tickets, base de conhecimento.
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        <div class="nds-text-body nds-font-medium">
                          Para Sucesso
                        </div><p class="nds-text-caption nds-text-muted-foreground">
                          Onboarding e retenção.
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        <div class="nds-text-body nds-font-medium">
                          Para Operações
                        </div><p class="nds-text-caption nds-text-muted-foreground">
                          Workflows e integrações.
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#">
                        <div class="nds-text-body nds-font-medium">
                          Para Analytics
                        </div><p class="nds-text-caption nds-text-muted-foreground">
                          Dashboards e relatórios.
                        </p>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </template>
      <template #variant-preview-5>
        <div
          style="contain: layout"
          class="nds-cluster nds-w-full nds-min-h-80"
          data-justify="center"
        >
          <NavigationMenu
            :aria-label="tContent('variants.items.comCardDestacado.name')"
            :delay-duration="80"
          >
            <NavigationMenuList>
              <NavigationMenuItem value="recursos">
                <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div
                    class="nds-cluster nds-p-4"
                    data-spacing="md"
                    style="width: 560px"
                  >
                    <a
                      href="#"
                      class="nds-stack nds-rounded-md nds-p-4"
                      style="width: 220px; justify-content: flex-end; text-decoration: none; background: linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--accent)))"
                    >
                      <div class="nds-text-base nds-font-semibold nds-leading-tight">Comece em 5 minutos</div>
                      <p class="nds-mt-2 nds-text-body nds-leading-tight">
                        Crie sua primeira integração com nosso quickstart.
                      </p>
                    </a>
                    <ul
                      class="nds-stack nds-flex-1"
                      data-spacing="xs"
                    >
                      <li>
                        <NavigationMenuLink href="#">
                          Documentação
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          Tutoriais
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#">
                          Comunidade
                        </NavigationMenuLink>
                      </li>
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
        state: tContent('states.cols.state'),
        trigger: toPlainText(tContent('states.cols.trigger')),
        behavior: toPlainText(tContent('states.cols.behavior')),
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
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="tContent('accessibility.summary')"
      :items="accessibilityItems"
      :keyboard-title="tContent('accessibility.keyboard.title')"
      :keyboard-items="keyboardItems"
    />

    <!-- ── Relacionados ─────────────────────────────────────────── -->
    <DocsRelated
      :title="tContent('related.title')"
      :items="relatedItems"
    />

    <!-- ── Notas ────────────────────────────────────────────────── -->
    <DocsNotes
      :title="tContent('notes.title')"
      :items="noteItems"
    />

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
