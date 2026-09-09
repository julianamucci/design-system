<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { useActiveSection } from '@/lib/use-active-section';
import {
  Sheet,
  SheetClose,
  SheetBody,
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
import { stripHtml, toPlainText } from '@/lib/strip-html';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation(sheetTranslations);

// As chaves de `accessibility.screenReader` variam por componente, então só os
// valores chegam ao container — o `t()` exige nome de chave e não serviria.
// O `title` fica de fora: ele é o cabeçalho da lista, não um item dela.
const screenReaderItems = computed(() =>
  Object.entries(
    (sheetTranslations as unknown as Record<
      string,
      { accessibility?: { screenReader?: Record<string, string> } }
    >)[locale.value]?.accessibility?.screenReader ?? {},
  )
    .filter(([key]) => key !== 'title')
    .map(([, value]) => value),
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

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: tContent('seo.title'),
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'sheet',
  aiSummary: tContent('seo.aiSummary'),
  aiEntities: tContent('seo.aiEntities'),
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

// ─── Analytics — demo events ──────────────────────────────────────────────────

// label usa o SIDE (valor estável, não localizado) — texto traduzido
// fragmentaria o mesmo evento em 3 valores no GA4.
//
// `location` vem de QUEM CHAMA, nunca de constante no topo do arquivo: ele
// existe para dizer de ONDE veio o clique, e cravá-lo em 'docs_demo' fazia a
// página inteira responder a mesma coisa. Vocabulário em
// `docs/shared/guidelines/07-analytics.md`.
//
// E o alcance não é só a demonstração: Do & Dont, Variantes e Composições
// renderizam Sheets VIVOS — abrir um painel ali é tão real quanto na demo.
// O `update:open` da lib avisa QUE o painel fechou, nunca POR QUÊ — e o payload
// de `dialog_close` promete `reason`. Os dois caminhos que a lib anuncia por
// evento próprio ficam anotados aqui; o que sobra é o botão, tanto o X do canto
// quanto a saída do rodapé, que fecham pelo mesmo `SheetClose`.
//
// Uma variável para a página inteira basta: o painel é modal, e nunca há dois
// abertos ao mesmo tempo.
type SheetCloseReason = 'escape' | 'overlay' | 'close-button';
let pendingCloseReason: SheetCloseReason | null = null;

// Ouvintes prontos para `v-bind` no conteúdo: `escapeKeyDown` e
// `pointerDownOutside` são emits do primitivo, e chegam lá pelo repasse do
// SheetContent.
const closeWatch = {
  onEscapeKeyDown: () => { pendingCloseReason = 'escape'; },
  onPointerDownOutside: () => { pendingCloseReason = 'overlay'; },
};

function rastrearSheet(location: string, side: string, open: boolean) {
  if (open) {
    pendingCloseReason = null;
    track('dialog_open', { component: 'sheet', label: side, location });
    return;
  }
  track('dialog_close', {
    component: 'sheet',
    label: side,
    reason: pendingCloseReason ?? 'close-button',
    location,
  });
  pendingCloseReason = null;
}

function rastrearConfirmacao(location: string, side: string, action = 'apply') {
  track('dialog_confirm', {
    component: 'sheet',
    action,
    label: side,
    location,
  });
}
// ─── Code strings ─────────────────────────────────────────────────────────────

const codeImportBasic = `import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";`;

/**
 * Snippet de uma direção, montado a partir das MESMAS chaves que o preview
 * ao lado renderiza.
 *
 * Antes as três outras direções nasciam de `codeRight.replace('"right"',
 * '"left"')`: a substituição trocava o lado e deixava o título de filtros no
 * lugar, então o painel da imagem se chamava "Painel esquerdo" e o código
 * dizia "Filtros avançados". Derivar snippet por substituição de string é a
 * raiz do desencontro, e por isso ele agora nasce da chave.
 */
function codeSide(side: string, title: string): string {
  return `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">${tContent('demonstration.labels.trigger')}</Button>
  </SheetTrigger>
  <SheetContent side="${side}">
    <SheetHeader>
      <SheetTitle>${title}</SheetTitle>
      <SheetDescription>${tContent('demonstration.labels.description')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <p class="nds-text-body nds-text-muted-foreground">${tContent('demonstration.labels.body')}</p>
    </SheetBody>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">${tContent('demonstration.labels.cancel')}</Button>
      </SheetClose>
      <Button>${tContent('demonstration.labels.apply')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
}

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
  tContent('anatomy.item9'),
]);

const variantItems = computed(() => [
  { trackId: 'right',  name: tContent('variants.items.right'),  description: stripHtml(tContent('variants.styles.right')),  code: codeSide('right',  tContent('demonstration.labels.rightLabel'))  },
  { trackId: 'left',   name: tContent('variants.items.left'),   description: stripHtml(tContent('variants.styles.left')),   code: codeSide('left',   tContent('demonstration.labels.leftLabel'))   },
  { trackId: 'top',    name: tContent('variants.items.top'),    description: stripHtml(tContent('variants.styles.top')),    code: codeSide('top',    tContent('demonstration.labels.topLabel'))    },
  { trackId: 'bottom', name: tContent('variants.items.bottom'), description: stripHtml(tContent('variants.styles.bottom')), code: codeSide('bottom', tContent('demonstration.labels.bottomLabel')) },
]);

/**
 * Lista que mora inteira no conteúdo compartilhado.
 *
 * `flattenDict` não desmonta array: o caminho da chave devolve a lista, e é
 * dela que saem as seções do menu e a fileira de ações.
 */
function contentList(key: string): string[] {
  const value = tContent(key) as unknown;
  return Array.isArray(value) ? (value as string[]) : [];
}

function codeAdvancedFilters(): string {
  return `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">${tContent('demonstration.labels.trigger')}</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>${tContent('demonstration.labels.title')}</SheetTitle>
      <SheetDescription>${tContent('demonstration.labels.description')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <form id="filters" class="nds-stack" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <Label for="category">${tContent('variants.compositions.advancedFilters.fieldCategory')}</Label>
          <Input id="category" default-value="${tContent('variants.compositions.advancedFilters.categoryValue')}" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="min-price">${tContent('variants.compositions.advancedFilters.fieldMinPrice')}</Label>
          <Input id="min-price" type="number" default-value="100" />
        </div>
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose as-child>
        <Button type="button" variant="outline">${tContent('demonstration.labels.cancel')}</Button>
      </SheetClose>
      <Button type="submit" form="filters">${tContent('demonstration.labels.apply')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
}

function codeSecondaryNav(): string {
  const links = contentList('variants.compositions.secondaryNavigation.items')
    .map(
      (item) =>
        `        <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">${item}</a>`,
    )
    .join('\n');
  return `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">${tContent('variants.compositions.secondaryNavigation.trigger')}</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>${tContent('variants.compositions.secondaryNavigation.panelTitle')}</SheetTitle>
      <SheetDescription>${tContent('variants.compositions.secondaryNavigation.panelDescription')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <nav aria-label="${tContent('variants.compositions.secondaryNavigation.navLabel')}" class="nds-stack" data-spacing="xs">
${links}
      </nav>
    </SheetBody>
  </SheetContent>
</Sheet>`;
}

function codeProfileEdit(): string {
  return `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">${tContent('variants.compositions.profileEdit.trigger')}</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>${tContent('variants.compositions.profileEdit.panelTitle')}</SheetTitle>
      <SheetDescription>${tContent('variants.compositions.profileEdit.panelDescription')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <form id="profile" class="nds-stack" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <Label for="profile-name">${tContent('variants.compositions.profileEdit.fieldName')}</Label>
          <Input id="profile-name" default-value="${tContent('variants.compositions.profileEdit.fieldNameValue')}" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="profile-handle">${tContent('variants.compositions.profileEdit.fieldHandle')}</Label>
          <Input id="profile-handle" default-value="${tContent('variants.compositions.profileEdit.fieldHandleValue')}" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="profile-bio">${tContent('variants.compositions.profileEdit.fieldBio')}</Label>
          <Input id="profile-bio" default-value="${tContent('variants.compositions.profileEdit.fieldBioValue')}" />
        </div>
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose as-child>
        <Button type="button" variant="outline">${tContent('demonstration.labels.cancel')}</Button>
      </SheetClose>
      <Button type="submit" form="profile">${tContent('variants.compositions.profileEdit.submit')}</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
}

function codeBottomPanel(): string {
  const actions = contentList('variants.compositions.bottomPanel.actions')
    .map(
      (action, index, list) =>
        `        <Button variant="${index === list.length - 1 ? 'destructive' : 'outline'}">${action}</Button>`,
    )
    .join('\n');
  return `<Sheet>
  <SheetTrigger as-child>
    <Button variant="outline">${tContent('variants.compositions.bottomPanel.trigger')}</Button>
  </SheetTrigger>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>${tContent('variants.compositions.bottomPanel.panelTitle')}</SheetTitle>
      <SheetDescription>${tContent('variants.compositions.bottomPanel.panelDescription')}</SheetDescription>
    </SheetHeader>
    <SheetBody>
      <div class="nds-cluster" data-spacing="md">
${actions}
      </div>
    </SheetBody>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">${tContent('variants.compositions.bottomPanel.close')}</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`;
}

const compositionItems = computed(() => [
  {
    trackId: 'advancedFilters',
    name: tContent('variants.compositions.advancedFilters.name'),
    description: tContent('variants.compositions.advancedFilters.description'),
    useWhen: tContent('variants.compositions.advancedFilters.use'),
    code: codeAdvancedFilters(),
  },
  {
    trackId: 'secondaryNavigation',
    name: tContent('variants.compositions.secondaryNavigation.name'),
    description: tContent('variants.compositions.secondaryNavigation.description'),
    useWhen: tContent('variants.compositions.secondaryNavigation.use'),
    code: codeSecondaryNav(),
  },
  {
    trackId: 'profileEdit',
    name: tContent('variants.compositions.profileEdit.name'),
    description: tContent('variants.compositions.profileEdit.description'),
    useWhen: tContent('variants.compositions.profileEdit.use'),
    code: codeProfileEdit(),
  },
  {
    trackId: 'bottomPanel',
    name: tContent('variants.compositions.bottomPanel.name'),
    description: tContent('variants.compositions.bottomPanel.description'),
    useWhen: tContent('variants.compositions.bottomPanel.use'),
    code: codeBottomPanel(),
  },
]);

/** As seções do menu, na ordem em que o conteúdo compartilhado as declara. */
const secondaryNavItems = computed(() =>
  contentList('variants.compositions.secondaryNavigation.items'),
);

/**
 * A fileira de ações do painel inferior.
 *
 * A última é a destrutiva — é o conteúdo que decide quantas ações existem, e a
 * posição é o que decide a variante, para que acrescentar uma quarta ação não
 * exija mexer aqui.
 */
const bottomPanelActions = computed(() => {
  const actions = contentList('variants.compositions.bottomPanel.actions');
  return actions.map((label, index) => ({
    label,
    variant: index === actions.length - 1 ? ('destructive' as const) : ('outline' as const),
  }));
});

const stateItems = computed(() => [
  { label: tContent('states.closed.label'),         trigger: toPlainText(tContent('states.closed.trigger')),         behavior: toPlainText(tContent('states.closed.behavior')) },
  { label: tContent('states.open.label'),           trigger: toPlainText(tContent('states.open.trigger')),           behavior: toPlainText(tContent('states.open.behavior')) },
  { label: tContent('states.transitioning.label'),  trigger: toPlainText(tContent('states.transitioning.trigger')),  behavior: toPlainText(tContent('states.transitioning.behavior')) },
  { label: tContent('states.focused.label'),        trigger: toPlainText(tContent('states.focused.trigger')),        behavior: toPlainText(tContent('states.focused.behavior')) },
  { label: tContent('states.longScrollBody.label'), trigger: toPlainText(tContent('states.longScrollBody.trigger')), behavior: toPlainText(tContent('states.longScrollBody.behavior')) },
]);

const propCols = computed(() => ({
  prop: tContent('props.table.prop'),
  type: tContent('props.table.type'),
  default: tContent('props.table.default'),
  required: tContent('props.table.required'),
  description: tContent('props.table.description'),
}));

const propRows = computed(() => [
  { name: 'open',            type: tContent('props.table.open.type'),            defaultValue: tContent('props.table.open.default'),            required: tContent('props.table.open.required'),            description: toPlainText(tContent('props.table.open.description'))            },
  { name: 'defaultOpen',     type: tContent('props.table.defaultOpen.type'),     defaultValue: tContent('props.table.defaultOpen.default'),     required: tContent('props.table.defaultOpen.required'),     description: toPlainText(tContent('props.table.defaultOpen.description'))     },
  { name: 'onUpdate:open',   type: tContent('props.table.onOpenChange.type'),    defaultValue: tContent('props.table.onOpenChange.default'),    required: tContent('props.table.onOpenChange.required'),    description: toPlainText(tContent('props.table.onOpenChange.description'))    },
  { name: 'side',            type: tContent('props.table.side.type'),            defaultValue: tContent('props.table.side.default'),            required: tContent('props.table.side.required'),            description: toPlainText(tContent('props.table.side.description'))            },
  { name: 'showCloseButton', type: tContent('props.table.showCloseButton.type'), defaultValue: tContent('props.table.showCloseButton.default'), required: tContent('props.table.showCloseButton.required'), description: toPlainText(tContent('props.table.showCloseButton.description')) },
  { name: 'class',           type: tContent('props.table.className.type'),       defaultValue: tContent('props.table.className.default'),       required: tContent('props.table.className.required'),       description: toPlainText(tContent('props.table.className.description'))       },
]);

const tokenRows = computed(() => [
  { token: '--background', value: tContent('tokens.table.background.class'), description: tContent('tokens.table.background.part') },
  { token: '--foreground', value: tContent('tokens.table.foreground.class'), description: tContent('tokens.table.foreground.part') },
  { token: '--muted-foreground', value: tContent('tokens.table.mutedForeground.class'), description: tContent('tokens.table.mutedForeground.part') },
  { token: '--border', value: tContent('tokens.table.border.class'), description: tContent('tokens.table.border.part') },
  { token: '--overlay', value: tContent('tokens.table.overlay.class'), description: tContent('tokens.table.overlay.part') },
  { token: '--ring', value: tContent('tokens.table.ring.class'), description: tContent('tokens.table.ring.part') },
  { token: '--sheet-width', value: tContent('tokens.table.width.class'), description: tContent('tokens.table.width.part') },
  { token: '--sheet-max-width', value: tContent('tokens.table.maxWidth.class'), description: tContent('tokens.table.maxWidth.part') },
]);

const accessibilityItems = computed(() => [
  tContent('accessibility.items.item1'),
  tContent('accessibility.items.item2'),
  tContent('accessibility.items.item3'),
  tContent('accessibility.items.item4'),
  tContent('accessibility.items.item5'),
  tContent('accessibility.items.item6'),
  tContent('accessibility.items.item7'),
  tContent('accessibility.items.item8'),
]);

const keyboardItems = computed(() => [
  { key: 'Tab',       description: tContent('accessibility.keyboard.tab')      },
  { key: 'Shift+Tab', description: tContent('accessibility.keyboard.shiftTab') },
  { key: 'Enter',     description: tContent('accessibility.keyboard.enter')    },
  { key: 'Escape',    description: tContent('accessibility.keyboard.escape')   },
]);

const relatedItems = computed(() => [
  { name: tContent('related.items.drawer.name'),      description: toPlainText(tContent('related.items.drawer.description')),      path: '?path=/docs/components-overlay-drawer--docs'      },
  { name: tContent('related.items.dialog.name'),      description: toPlainText(tContent('related.items.dialog.description')),      path: '?path=/docs/components-overlay-dialog--docs'      },
  { name: tContent('related.items.alertDialog.name'), description: toPlainText(tContent('related.items.alertDialog.description')), path: '?path=/docs/components-overlay-alertdialog--docs' },
  { name: tContent('related.items.popover.name'),     description: toPlainText(tContent('related.items.popover.description')),     path: '?path=/docs/components-overlay-popover--docs'     },
]);

const noteItems = computed(() => [
  { title: '', content: tContent('notes.item1') },
  { title: '', content: tContent('notes.item2') },
  { title: '', content: tContent('notes.item3') },
  { title: '', content: tContent('notes.item4') },
]);

const analyticsItems = computed(() => [
  { event: 'dialog_open',    trigger: toPlainText(tContent('analytics.table.dialog_open.trigger')),    payload: tContent('analytics.table.dialog_open.payload')    },
  { event: 'dialog_close',   trigger: toPlainText(tContent('analytics.table.dialog_close.trigger')),   payload: tContent('analytics.table.dialog_close.payload')   },
  { event: 'dialog_confirm', trigger: toPlainText(tContent('analytics.table.dialog_confirm.trigger')), payload: tContent('analytics.table.dialog_confirm.payload') },
]);

const functionalTestItems = computed(() => [1, 2, 3, 4].map((i) => ({
  action: tContent(`testes.functional.item${i}.action`),
  result: tContent(`testes.functional.item${i}.result`),
  priority: localPriority(tContent(`testes.functional.item${i}.priority`)),
})));

const a11yTestItems = computed(() => [1, 2, 3, 4, 5].map((i) => ({
  criterion: tContent(`testes.accessibility.item${i}`),
  level: 'WCAG 2.2 AA',
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

    <!-- ── Demonstração ─────────────────────────────────────────── -->
    <DocsDemonstration :title="tContent('demonstration.title')">
      <div
        class="nds-cluster"
        data-justify="center"
        data-spacing="sm"
      >
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_demo', 'right', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.title') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_demo', 'right')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
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
          { element: tContent('usage.uxWriting.table.title.name'), rules: tContent('usage.uxWriting.table.title.format'), do: tContent('usage.uxWriting.table.title.good'), dont: tContent('usage.uxWriting.table.title.bad') },
          { element: tContent('usage.uxWriting.table.description.name'), rules: tContent('usage.uxWriting.table.description.format'), do: tContent('usage.uxWriting.table.description.good'), dont: tContent('usage.uxWriting.table.description.bad') },
          { element: tContent('usage.uxWriting.table.trigger.name'), rules: tContent('usage.uxWriting.table.trigger.format'), do: tContent('usage.uxWriting.table.trigger.good'), dont: tContent('usage.uxWriting.table.trigger.bad') },
          { element: tContent('usage.uxWriting.table.primary.name'), rules: tContent('usage.uxWriting.table.primary.format'), do: tContent('usage.uxWriting.table.primary.good'), dont: tContent('usage.uxWriting.table.primary.bad') },
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
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair1.do')), dontCaption: toPlainText(tContent('doDont.pair1.dont')) },
        { doLabel: tNav('common.do'), dontLabel: tNav('common.dont'), doCaption: toPlainText(tContent('doDont.pair2.do')), dontCaption: toPlainText(tContent('doDont.pair2.dont')) },
      ]"
    >
      <template #do-preview-0>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_do_dont', 'right', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.title') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_do_dont', 'right')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <!--
        O anti-exemplo mantém o `nds-sr-only`: a lição é o painel SEM cabeçalho
        visível, e o nome acessível continua no DOM. O que mudou é a origem do
        texto — literal em pt-BR mostrava português em `en` e `es`.
      -->
      <template #dont-preview-0>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_do_dont', 'right', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('doDont.pair1.dontTrigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle class="nds-sr-only">
                {{ tContent('doDont.pair1.dontTitle') }}
              </SheetTitle>
              <SheetDescription class="nds-sr-only">
                {{ tContent('doDont.pair1.dontDescription') }}
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('doDont.pair1.dontBody') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_do_dont', 'right')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #do-preview-1>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_do_dont', 'right', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.title') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_do_dont', 'right')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #dont-preview-1>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_do_dont', 'top', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="top"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.title') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_do_dont', 'top')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
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
    <DocsVariants
      :title="tContent('variants.title')"
      :items="variantItems"
    >
      <!--
        As quatro direções renderizam o MESMO painel: cabeçalho, corpo rolável e
        rodapé. Três delas iam do cabeçalho direto ao fim, sem corpo e sem
        rodapé, enquanto o snippet ao lado mostrava os três — a direção é o que
        muda entre elas, e era a única coisa que não estava mudando sozinha.
      -->
      <template #variant-preview-0>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_variantes', 'right', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.rightLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_variantes', 'right')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #variant-preview-1>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_variantes', 'left', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.leftLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_variantes', 'left')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #variant-preview-2>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_variantes', 'top', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="top"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.topLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_variantes', 'top')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </template>
      <template #variant-preview-3>
        <Sheet @update:open="(o: boolean) => rastrearSheet('docs_variantes', 'bottom', o)">
          <SheetTrigger as-child>
            <Button variant="outline">
              {{ tContent('demonstration.labels.trigger') }}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            v-bind="closeWatch"
          >
            <SheetHeader>
              <SheetTitle>{{ tContent('demonstration.labels.bottomLabel') }}</SheetTitle>
              <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p class="nds-text-body nds-text-muted-foreground">
                {{ tContent('demonstration.labels.body') }}
              </p>
            </SheetBody>
            <SheetFooter>
              <SheetClose as-child>
                <Button variant="outline">
                  {{ tContent('demonstration.labels.cancel') }}
                </Button>
              </SheetClose>
              <Button @click="rastrearConfirmacao('docs_variantes', 'bottom')">
                {{ tContent('demonstration.labels.apply') }}
              </Button>
            </SheetFooter>
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
      <!--
        Os quatro previews montam o corpo dentro do SheetBody, e não solto no
        conteúdo com um recuo à mão: é ele que traz a área que rola, o
        `tabindex` que a região rolável exige e o `role="group"` que dá nome a
        ela. Sem ele o rodapé rola junto e as ações somem de alcance.

        O texto vem TODO de chave: literal em português mostrava português nas
        páginas em inglês e espanhol, no meio de uma seção traduzida.
      -->
      <template #variant-preview-0>
        <div style="contain: layout">
          <Sheet @update:open="(o: boolean) => rastrearSheet('docs_composicoes', 'right', o)">
            <SheetTrigger as-child>
              <Button variant="outline">
                {{ tContent('demonstration.labels.trigger') }}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              v-bind="closeWatch"
            >
              <SheetHeader>
                <SheetTitle>{{ tContent('demonstration.labels.title') }}</SheetTitle>
                <SheetDescription>{{ tContent('demonstration.labels.description') }}</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <!-- O guard de envio existe para o preview ao vivo: o botão do
                     rodapé é `type="submit"` religado por `form`, então o clique
                     — e o Enter dentro de um campo — DISPARA envio de verdade, e
                     sem `prevent` a docs page tentaria navegar. O rastreio mora
                     aqui, e não no clique, para valer também pelo Enter. -->
                <form
                  id="docs-sheet-filters"
                  class="nds-stack"
                  data-spacing="sm"
                  @submit.prevent="rastrearConfirmacao('docs_composicoes', 'right')"
                >
                  <div
                    class="nds-stack"
                    data-spacing="xs"
                  >
                    <Label for="comp-category">{{ tContent('variants.compositions.advancedFilters.fieldCategory') }}</Label>
                    <Input
                      id="comp-category"
                      :default-value="tContent('variants.compositions.advancedFilters.categoryValue')"
                    />
                  </div>
                  <div
                    class="nds-stack"
                    data-spacing="xs"
                  >
                    <Label for="comp-min-price">{{ tContent('variants.compositions.advancedFilters.fieldMinPrice') }}</Label>
                    <Input
                      id="comp-min-price"
                      type="number"
                      default-value="100"
                    />
                  </div>
                </form>
              </SheetBody>
              <SheetFooter>
                <SheetClose as-child>
                  <Button type="button" variant="outline">
                    {{ tContent('demonstration.labels.cancel') }}
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  form="docs-sheet-filters"
                >
                  {{ tContent('demonstration.labels.apply') }}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </template>
      <template #variant-preview-1>
        <div style="contain: layout">
          <Sheet @update:open="(o: boolean) => rastrearSheet('docs_composicoes', 'left', o)">
            <SheetTrigger as-child>
              <Button variant="outline">
                {{ tContent('variants.compositions.secondaryNavigation.trigger') }}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              v-bind="closeWatch"
            >
              <SheetHeader>
                <SheetTitle>{{ tContent('variants.compositions.secondaryNavigation.panelTitle') }}</SheetTitle>
                <SheetDescription>{{ tContent('variants.compositions.secondaryNavigation.panelDescription') }}</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <nav
                  :aria-label="tContent('variants.compositions.secondaryNavigation.navLabel')"
                  class="nds-stack"
                  data-spacing="xs"
                >
                  <a
                    v-for="item in secondaryNavItems"
                    :key="item"
                    href="#"
                    class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent"
                  >{{ item }}</a>
                </nav>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </template>
      <template #variant-preview-2>
        <div style="contain: layout">
          <Sheet @update:open="(o: boolean) => rastrearSheet('docs_composicoes', 'right', o)">
            <SheetTrigger as-child>
              <Button variant="outline">
                {{ tContent('variants.compositions.profileEdit.trigger') }}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              v-bind="closeWatch"
            >
              <SheetHeader>
                <SheetTitle>{{ tContent('variants.compositions.profileEdit.panelTitle') }}</SheetTitle>
                <SheetDescription>{{ tContent('variants.compositions.profileEdit.panelDescription') }}</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <!-- Mesmo guard do preview de filtros: o `submit` religado por
                     `form` envia de verdade, e o rastreio no envio cobre tanto o
                     clique quanto o Enter dentro de um campo. -->
                <form
                  id="docs-sheet-profile"
                  class="nds-stack"
                  data-spacing="sm"
                  @submit.prevent="rastrearConfirmacao('docs_composicoes', 'right', 'save')"
                >
                  <div
                    class="nds-stack"
                    data-spacing="xs"
                  >
                    <Label for="comp-profile-name">{{ tContent('variants.compositions.profileEdit.fieldName') }}</Label>
                    <Input
                      id="comp-profile-name"
                      :default-value="tContent('variants.compositions.profileEdit.fieldNameValue')"
                    />
                  </div>
                  <div
                    class="nds-stack"
                    data-spacing="xs"
                  >
                    <Label for="comp-profile-handle">{{ tContent('variants.compositions.profileEdit.fieldHandle') }}</Label>
                    <Input
                      id="comp-profile-handle"
                      :default-value="tContent('variants.compositions.profileEdit.fieldHandleValue')"
                    />
                  </div>
                  <div
                    class="nds-stack"
                    data-spacing="xs"
                  >
                    <Label for="comp-profile-bio">{{ tContent('variants.compositions.profileEdit.fieldBio') }}</Label>
                    <Input
                      id="comp-profile-bio"
                      :default-value="tContent('variants.compositions.profileEdit.fieldBioValue')"
                    />
                  </div>
                </form>
              </SheetBody>
              <SheetFooter>
                <SheetClose as-child>
                  <Button type="button" variant="outline">
                    {{ tContent('demonstration.labels.cancel') }}
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  form="docs-sheet-profile"
                >
                  {{ tContent('variants.compositions.profileEdit.submit') }}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </template>
      <template #variant-preview-3>
        <div style="contain: layout">
          <Sheet @update:open="(o: boolean) => rastrearSheet('docs_composicoes', 'bottom', o)">
            <SheetTrigger as-child>
              <Button variant="outline">
                {{ tContent('variants.compositions.bottomPanel.trigger') }}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              v-bind="closeWatch"
            >
              <SheetHeader>
                <SheetTitle>{{ tContent('variants.compositions.bottomPanel.panelTitle') }}</SheetTitle>
                <SheetDescription>{{ tContent('variants.compositions.bottomPanel.panelDescription') }}</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <div
                  class="nds-cluster"
                  data-spacing="md"
                >
                  <Button
                    v-for="action in bottomPanelActions"
                    :key="action.label"
                    :variant="action.variant"
                  >
                    {{ action.label }}
                  </Button>
                </div>
              </SheetBody>
              <SheetFooter>
                <SheetClose as-child>
                  <Button variant="outline">
                    {{ tContent('variants.compositions.bottomPanel.close') }}
                  </Button>
                </SheetClose>
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
        { title: tContent('props.title'), cols: propCols, items: propRows },
      ]"
      :interface-code="interfaceCode"
      :extensibility-title="tContent('props.extensibilityTitle')"
      :extensibility-code="tContent('props.extensibilityCode')"
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
      :screen-reader-title="tNav('common.screenReader')"
      :screen-reader-items="screenReaderItems"
      :title="tContent('accessibility.title')"
      :summary="stripHtml(tContent('accessibility.summary'))"
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
        event: tContent('analytics.table.event'),
        trigger: toPlainText(tContent('analytics.table.trigger')),
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
