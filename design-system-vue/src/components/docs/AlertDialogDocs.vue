<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import DocsNav from '@/components/docs/shared/DocsNav.vue';
import uiTranslations from '@/i18n/ui.json';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...alertDialogTranslations });

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: `${tContent('title')} — ${tContent('category')}`,
  description: tContent('seo.description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'alert-dialog',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'alert-dialog',
    locale: newLocale as 'pt-BR' | 'en' | 'es',
    page_title: `${tContent('title')} · Design System`,
  });
}, { immediate: true });

// ─── Analytics — section view ─────────────────────────────────────────────────

const activeSection = ref('demonstracao');

function handleSectionChange(id: string) {
  activeSection.value = id;
  track('docs_section_viewed', {
    section_id: id,
    component_name: 'alert-dialog',
    locale: locale.value as 'pt-BR' | 'en' | 'es',
  });
}

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
      { id: 'exemplos',     label: tNav('nav.examples') },
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

// ─── IntersectionObserver ─────────────────────────────────────────────────────

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { handleSectionChange(entry.target.id); break; }
      }
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  allSectionIds.value.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
  onUnmounted(() => observer.disconnect());
});

// ─── Data ─────────────────────────────────────────────────────────────────────

const variantItems = computed(() => [
  { key: 'destructive', label: 'Destrutiva', desc: tContent('variants.items.destructive') },
  { key: 'neutral',     label: 'Neutra',     desc: tContent('variants.items.neutral')     },
]);

const tokenRows = computed(() => [
  { token: '--background',        cls: 'bg-background',        part: tContent('tokens.rows.background')        },
  { token: '--border',            cls: 'border-border',        part: tContent('tokens.rows.border')            },
  { token: '--foreground',        cls: 'text-foreground',      part: tContent('tokens.rows.foreground')        },
  { token: '--muted-foreground',  cls: 'text-muted-foreground', part: tContent('tokens.rows.mutedForeground')  },
  { token: '--primary',           cls: 'bg-primary',           part: tContent('tokens.rows.primary')           },
  { token: '--destructive',       cls: 'bg-destructive',       part: tContent('tokens.rows.destructive')       },
  { token: '--radius',            cls: 'rounded-lg',           part: tContent('tokens.rows.radius')            },
  { token: '--ring',              cls: 'ring-ring',            part: tContent('tokens.rows.ring')              },
]);

const propRows = computed(() => [
  { name: 'open',          type: 'boolean',                       def: 'undefined', req: 'Não', desc: tContent('props.rows.open')          },
  { name: 'defaultOpen',   type: 'boolean',                       def: 'false',     req: 'Não', desc: tContent('props.rows.defaultOpen')   },
  { name: 'onOpenChange',  type: '(open: boolean) => void',       def: '—',         req: 'Não', desc: tContent('props.rows.onOpenChange')  },
  { name: 'asChild',       type: 'boolean',                       def: 'false',     req: 'Não', desc: tContent('props.rows.asChild')       },
  { name: 'class',         type: 'string',                        def: '—',         req: 'Não', desc: tContent('props.rows.className')     },
]);

const relatedItems = computed(() => [
  { name: 'Dialog',  desc: tContent('related.dialog'), path: '?path=/docs/ui-dialog--docs'   },
  { name: 'Drawer',  desc: tContent('related.drawer'), path: '?path=/docs/ui-drawer--docs'   },
  { name: 'Sonner',  desc: tContent('related.sonner'), path: '?path=/docs/ui-sonner--docs'   },
  { name: 'Button',  desc: tContent('related.button'), path: '?path=/docs/ui-button--docs'   },
]);

const keyboardKeys = computed(() => [
  { key: 'Tab',    desc: tContent('accessibility.keyboard.tab')    },
  { key: 'Enter',  desc: tContent('accessibility.keyboard.enter')  },
  { key: 'Space',  desc: tContent('accessibility.keyboard.space')  },
  { key: 'Escape', desc: tContent('accessibility.keyboard.escape') },
]);

const ariaKeys = computed(() => [
  { attr: 'role="alertdialog"', desc: tContent('accessibility.aria.role')        },
  { attr: 'aria-labelledby',    desc: tContent('accessibility.aria.labelledby')  },
  { attr: 'aria-describedby',   desc: tContent('accessibility.aria.describedby') },
  { attr: 'aria-modal="true"',  desc: tContent('accessibility.aria.modal')       },
]);

const analyticsRows = computed(() => [
  { event: tContent('analytics.table.pageView'),       trigger: tContent('analytics.table.pageViewTrigger'),       payload: tContent('analytics.table.pageViewPayload')       },
  { event: tContent('analytics.table.sectionViewed'),  trigger: tContent('analytics.table.sectionViewedTrigger'),  payload: tContent('analytics.table.sectionViewedPayload')  },
  { event: tContent('analytics.table.langSwitch'),     trigger: tContent('analytics.table.langSwitchTrigger'),     payload: tContent('analytics.table.langSwitchPayload')     },
  { event: tContent('analytics.table.open'),           trigger: tContent('analytics.table.openTrigger'),           payload: tContent('analytics.table.openPayload')           },
  { event: tContent('analytics.table.confirm'),        trigger: tContent('analytics.table.confirmTrigger'),        payload: tContent('analytics.table.confirmPayload')        },
  { event: tContent('analytics.table.cancel'),         trigger: tContent('analytics.table.cancelTrigger'),         payload: tContent('analytics.table.cancelPayload')         },
]);

const functionalTests = computed(() => [1, 2, 3, 4, 5, 6].map(i => ({
  action:   tContent(`testes.functional.item${i}.action`),
  result:   tContent(`testes.functional.item${i}.result`),
  priority: tContent(`testes.functional.item${i}.priority`),
})));

const visualTests = computed(() => [1, 2, 3, 4, 5].map(i => ({
  story:    tContent(`testes.visual.item${i}.story`),
  priority: tContent(`testes.visual.item${i}.priority`),
})));
</script>

<template>
  <div class="ds-docs p-8 mx-auto">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <header class="ds-docs mb-12 border-b pb-8 border-border/50">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Badge variant="secondary" class="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
            {{ tContent('category') }}
          </Badge>
          <Badge variant="outline" class="text-muted-foreground font-normal px-2 py-0">
            {{ tContent('type') }}
          </Badge>
        </div>
        <LanguageSwitcher />
      </div>

      <div class="space-y-4">
        <h1 class="text-4xl font-bold tracking-tight text-foreground">
          {{ tContent('title') }}
        </h1>
        <p class="text-muted-foreground text-lg max-w-3xl leading-relaxed">
          {{ tContent('description') }}
        </p>
      </div>

      <div class="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
        <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
          {{ tContent('installation') }}
        </code>
      </div>
    </header>

    <!-- ── Content layout ─────────────────────────────────────────────── -->
    <div class="flex gap-16 items-start">

      <!-- Sidebar -->
      <nav
        aria-label="Navegação das seções do componente"
        class="sticky top-8 w-52 shrink-0 self-start space-y-5"
      >
        <DocsNav :groups="navGroups" :active-section="activeSection" />
      </nav>

      <!-- Main content -->
      <div class="ds-docs flex-1 min-w-0 space-y-12">

        <!-- ── Demonstração ───────────────────────────────────────────── -->
        <section id="demonstracao">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('demonstration.title') }}</h2>
          <div class="flex flex-wrap gap-4 p-8 border rounded-xl bg-muted/20 justify-center items-center">
            <!-- Destrutiva -->
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button variant="destructive">{{ tContent('demonstration.labels.trigger') }}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ tContent('demonstration.labels.title') }}</AlertDialogTitle>
                  <AlertDialogDescription>{{ tContent('demonstration.labels.description') }}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
                  <AlertDialogAction>{{ tContent('demonstration.labels.confirm') }}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <!-- Neutra -->
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button>{{ tContent('demonstration.labels.triggerNeutral') }}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ tContent('demonstration.labels.titleNeutral') }}</AlertDialogTitle>
                  <AlertDialogDescription>{{ tContent('demonstration.labels.descriptionNeutral') }}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
                  <AlertDialogAction>{{ tContent('demonstration.labels.confirmNeutral') }}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        <!-- ── Anatomia ───────────────────────────────────────────────── -->
        <section id="anatomia">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('anatomy.title') }}</h2>
          <ol class="space-y-2 mb-6 list-none p-0 m-0">
            <li v-for="i in 9" :key="i" class="flex gap-3 items-start list-none">
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{{ i }}</span>
              <span class="text-sm text-muted-foreground leading-relaxed" v-html="sanitizeHtml(tContent(`anatomy.item${i}`))" />
            </li>
          </ol>
          <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4 overflow-x-auto">
            <p class="text-xs font-medium text-muted-foreground mb-2">{{ tContent('anatomy.structureLabel') }}</p>
            <pre class="font-mono text-sm whitespace-pre">{{ tContent('anatomy.structureCode') }}</pre>
          </div>
        </section>

        <!-- ── Quando Usar ────────────────────────────────────────────── -->
        <section id="quando-usar">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('usage.title') }}</h2>

          <!-- Guidelines -->
          <div class="rounded-lg bg-muted/30 border border-border/40 p-5 mb-6">
            <h3 class="text-sm font-semibold mb-3">{{ tContent('usage.guidelines.title') }}</h3>
            <ul class="space-y-2 list-none p-0 m-0">
              <li v-for="i in 4" :key="i" class="flex gap-2 items-start list-none">
                <span class="text-primary mt-0.5">→</span>
                <span class="text-sm text-muted-foreground" v-html="sanitizeHtml(tContent(`usage.guidelines.item${i}`))" />
              </li>
            </ul>
          </div>

          <!-- Tabela de cenários -->
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
            <h3 class="text-sm font-semibold mb-3">{{ tContent('usage.scenarios.title') }}</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('usage.scenarios.cols.scenario') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('usage.scenarios.cols.use') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('usage.scenarios.cols.alternative') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in 5" :key="i" class="border-b border-border/50 last:border-0">
                  <td class="p-3">{{ tContent(`usage.scenarios.item${i}.s`) }}</td>
                  <td class="p-3 font-medium text-primary">{{ tContent(`usage.scenarios.item${i}.u`) }}</td>
                  <td class="p-3 text-muted-foreground">{{ tContent(`usage.scenarios.item${i}.a`) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- UX Writing -->
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
            <h3 class="text-sm font-semibold mb-3">{{ tContent('uxWriting.title') }}</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('uxWriting.table.element') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('uxWriting.table.rules') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('uxWriting.table.correct') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('uxWriting.table.avoid') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in ['title', 'description', 'action']" :key="key" class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-medium">{{ tContent(`uxWriting.table.${key}.name`) }}</td>
                  <td class="p-3 text-muted-foreground">{{ tContent(`uxWriting.table.${key}.format`) }}</td>
                  <td class="p-3 text-emerald-600 dark:text-emerald-400">{{ tContent(`uxWriting.table.${key}.good`) }}</td>
                  <td class="p-3 text-destructive">{{ tContent(`uxWriting.table.${key}.bad`) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Do / Don't -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <h3 class="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">{{ tContent('usage.do.title') }}</h3>
              <ul class="space-y-2 list-none p-0 m-0">
                <li v-for="i in 3" :key="i" class="flex gap-2 items-start list-none">
                  <span class="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">✓</span>
                  <span class="text-sm text-muted-foreground">{{ tContent(`usage.do.item${i}`) }}</span>
                </li>
              </ul>
            </div>
            <div class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
              <h3 class="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">{{ tContent('usage.dont.title') }}</h3>
              <ul class="space-y-2 list-none p-0 m-0">
                <li v-for="i in 3" :key="i" class="flex gap-2 items-start list-none">
                  <span class="text-destructive mt-0.5 font-bold">✗</span>
                  <span class="text-sm text-muted-foreground">{{ tContent(`usage.dont.item${i}`) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ── Do & Don't ─────────────────────────────────────────────── -->
        <section id="do-dont">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('doDont.title') }}</h2>
          <div class="flex items-center justify-center p-10 mt-6 border rounded-xl bg-background shadow-sm">
            <div class="space-y-8 w-full">
              <!-- Pair 1: Botões -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-green-600">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                    <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.do') }}</span>
                  </div>
                  <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2 justify-end">
                    <Button variant="outline" size="sm">{{ tContent('demonstration.labels.cancel') }}</Button>
                    <Button variant="destructive" size="sm">{{ tContent('demonstration.labels.confirm') }}</Button>
                  </div>
                  <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.do') }}</p>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-red-600">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                    <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.dont') }}</span>
                  </div>
                  <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 flex gap-2 justify-end">
                    <Button size="sm">OK</Button>
                  </div>
                  <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.dont') }}</p>
                </div>
              </div>

              <!-- Pair 2: Textos -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-green-600">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                    <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.do') }}</span>
                  </div>
                  <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 space-y-1">
                    <p class="text-sm font-semibold">{{ tContent('demonstration.labels.title') }}</p>
                    <p class="text-xs text-muted-foreground">{{ tContent('demonstration.labels.description') }}</p>
                  </div>
                  <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair2.do') }}</p>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center gap-2 text-red-600">
                    <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                    <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.dont') }}</span>
                  </div>
                  <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 space-y-1">
                    <p class="text-sm font-semibold">Tem certeza?</p>
                    <p class="text-xs text-muted-foreground">Isso vai apagar TUDO!</p>
                  </div>
                  <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair2.dont') }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Importação ─────────────────────────────────────────────── -->
        <section id="importacao">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('import.title') }}</h2>
          <p class="text-sm text-muted-foreground mb-3">{{ tContent('import.basic') }}</p>
          <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mb-4">
            <code class="whitespace-pre">import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';</code>
          </div>
        </section>

        <!-- ── Exemplos ───────────────────────────────────────────────── -->
        <section id="exemplos">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('examples.title') }}</h2>

          <!-- Básico -->
          <div class="mb-8">
            <h3 class="text-lg font-medium mb-3">{{ tContent('examples.basic') }}</h3>
            <div class="flex justify-center p-6 border rounded-t-lg bg-muted/20">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button variant="destructive">{{ tContent('demonstration.labels.triggerDestructive') }}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{{ tContent('demonstration.labels.titleDestructive') }}</AlertDialogTitle>
                    <AlertDialogDescription>{{ tContent('demonstration.labels.descriptionDestructive') }}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
                    <AlertDialogAction>{{ tContent('demonstration.labels.confirm') }}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div class="bg-muted p-4 rounded-b-lg font-mono text-sm border border-t-0 overflow-x-auto">
              <code class="whitespace-pre">&lt;AlertDialog&gt;
  &lt;AlertDialogTrigger as-child&gt;
    &lt;Button variant="destructive"&gt;Excluir item&lt;/Button&gt;
  &lt;/AlertDialogTrigger&gt;
  &lt;AlertDialogContent&gt;
    &lt;AlertDialogHeader&gt;
      &lt;AlertDialogTitle&gt;Excluir item selecionado&lt;/AlertDialogTitle&gt;
      &lt;AlertDialogDescription&gt;
        O item será removido permanentemente. Esta ação não pode ser desfeita.
      &lt;/AlertDialogDescription&gt;
    &lt;/AlertDialogHeader&gt;
    &lt;AlertDialogFooter&gt;
      &lt;AlertDialogCancel&gt;Cancelar&lt;/AlertDialogCancel&gt;
      &lt;AlertDialogAction&gt;Excluir&lt;/AlertDialogAction&gt;
    &lt;/AlertDialogFooter&gt;
  &lt;/AlertDialogContent&gt;
&lt;/AlertDialog&gt;</code>
            </div>
          </div>

          <!-- Neutro -->
          <div class="mb-8">
            <h3 class="text-lg font-medium mb-3">{{ tContent('examples.neutral') }}</h3>
            <div class="flex justify-center p-6 border rounded-t-lg bg-muted/20">
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button>{{ tContent('demonstration.labels.triggerNeutral') }}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{{ tContent('demonstration.labels.titleNeutral') }}</AlertDialogTitle>
                    <AlertDialogDescription>{{ tContent('demonstration.labels.descriptionNeutral') }}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
                    <AlertDialogAction>{{ tContent('demonstration.labels.confirmNeutral') }}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div class="bg-muted p-4 rounded-b-lg font-mono text-sm border border-t-0 overflow-x-auto">
              <code class="whitespace-pre">&lt;AlertDialog&gt;
  &lt;AlertDialogTrigger as-child&gt;
    &lt;Button&gt;Confirmar envio&lt;/Button&gt;
  &lt;/AlertDialogTrigger&gt;
  &lt;AlertDialogContent&gt;
    &lt;AlertDialogHeader&gt;
      &lt;AlertDialogTitle&gt;Confirmar envio do relatório&lt;/AlertDialogTitle&gt;
      &lt;AlertDialogDescription&gt;
        O relatório será enviado para todos os destinatários.
      &lt;/AlertDialogDescription&gt;
    &lt;/AlertDialogHeader&gt;
    &lt;AlertDialogFooter&gt;
      &lt;AlertDialogCancel&gt;Cancelar&lt;/AlertDialogCancel&gt;
      &lt;AlertDialogAction&gt;Enviar&lt;/AlertDialogAction&gt;
    &lt;/AlertDialogFooter&gt;
  &lt;/AlertDialogContent&gt;
&lt;/AlertDialog&gt;</code>
            </div>
          </div>
        </section>

        <!-- ── Variantes ──────────────────────────────────────────────── -->
        <section id="variantes">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('variants.title') }}</h2>
          <p class="text-sm text-muted-foreground mb-4">{{ tContent('variants.visualTitle') }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="item in variantItems"
              :key="item.key"
              class="rounded-lg border border-border p-4 bg-muted/20 space-y-3"
            >
              <p class="text-xs font-mono font-medium text-muted-foreground">{{ item.label }}</p>
              <p class="text-sm text-muted-foreground">{{ item.desc }}</p>
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button :variant="item.key === 'destructive' ? 'destructive' : 'default'" size="sm">
                    {{ item.key === 'destructive' ? tContent('demonstration.labels.triggerDestructive') : tContent('demonstration.labels.triggerNeutral') }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {{ item.key === 'destructive' ? tContent('demonstration.labels.titleDestructive') : tContent('demonstration.labels.titleNeutral') }}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {{ item.key === 'destructive' ? tContent('demonstration.labels.descriptionDestructive') : tContent('demonstration.labels.descriptionNeutral') }}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ tContent('demonstration.labels.cancel') }}</AlertDialogCancel>
                    <AlertDialogAction>
                      {{ item.key === 'destructive' ? tContent('demonstration.labels.confirm') : tContent('demonstration.labels.confirmNeutral') }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        <!-- ── Estados ───────────────────────────────────────────────── -->
        <section id="estados">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('states.title') }}</h2>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('states.table.state') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('states.table.visual') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('states.table.trigger') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border/50">
                  <td class="p-3 border-r border-border font-medium">Fechado</td>
                  <td class="p-3 border-r border-border text-muted-foreground">{{ tContent('states.closed') }}</td>
                  <td class="p-3 text-muted-foreground">{{ tContent('states.closedTrigger') }}</td>
                </tr>
                <tr>
                  <td class="p-3 border-r border-border font-medium">Aberto</td>
                  <td class="p-3 border-r border-border text-muted-foreground">{{ tContent('states.open') }}</td>
                  <td class="p-3 text-muted-foreground">{{ tContent('states.openTrigger') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Propriedades ───────────────────────────────────────────── -->
        <section id="propriedades">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('props.title') }}</h2>

          <h3 class="text-base font-medium mb-3">{{ tContent('props.interface') }}</h3>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('props.table.prop') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('props.table.type') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('props.table.default') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('props.table.required') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('props.table.description') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in propRows" :key="row.name" class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs">{{ row.name }}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{{ row.type }}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{{ row.def }}</td>
                  <td class="p-3 text-muted-foreground">{{ row.req }}</td>
                  <td class="p-3 text-muted-foreground">{{ row.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-base font-medium mb-3">{{ tContent('props.extensibilityTitle') }}</h3>
          <div class="space-y-2">
            <p class="text-sm text-muted-foreground" v-html="sanitizeHtml(tContent('props.extensibility.classNameNote'))" />
            <p class="text-sm text-muted-foreground" v-html="sanitizeHtml(tContent('props.extensibility.asChildNote'))" />
          </div>
        </section>

        <!-- ── Tokens ─────────────────────────────────────────────────── -->
        <section id="tokens">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('tokens.title') }}</h2>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-6">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('tokens.table.token') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('tokens.table.class') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('tokens.table.part') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in tokenRows" :key="row.token" class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs">{{ row.token }}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{{ row.cls }}</td>
                  <td class="p-3 text-muted-foreground">{{ row.part }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 class="text-base font-medium mb-3">{{ tContent('tokens.customizationTitle') }}</h3>
          <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
            <code class="whitespace-pre">/* Override no seu CSS */
[data-slot="alert-dialog-content"] {
  --radius: 1rem;
  --background: hsl(var(--popover));
}</code>
          </div>
        </section>

        <!-- ── Acessibilidade ─────────────────────────────────────────── -->
        <section id="acessibilidade">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('accessibility.title') }}</h2>
          <p class="text-sm text-muted-foreground mb-6" v-html="sanitizeHtml(tContent('accessibility.summary'))" />

          <ul class="space-y-2 mb-8 list-none p-0 m-0">
            <li v-for="i in 5" :key="i" class="flex gap-2 items-start list-none">
              <span class="text-primary mt-0.5 font-bold">→</span>
              <span class="text-sm text-muted-foreground" v-html="sanitizeHtml(tContent(`accessibility.item${i}`))" />
            </li>
          </ul>

          <h3 class="text-base font-medium mb-3">{{ tContent('accessibility.keyboardTitle') }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <div
              v-for="kb in keyboardKeys"
              :key="kb.key"
              class="flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20"
            >
              <kbd class="flex-shrink-0 px-2 py-0.5 rounded border border-border bg-background font-mono text-xs font-semibold">{{ kb.key }}</kbd>
              <span class="text-sm text-muted-foreground">{{ kb.desc }}</span>
            </div>
          </div>

          <h3 class="text-base font-medium mb-3">{{ tContent('accessibility.ariaTitle') }}</h3>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">Atributo</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ariaKeys" :key="row.attr" class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs" v-html="sanitizeHtml(row.attr)" />
                  <td class="p-3 text-muted-foreground" v-html="sanitizeHtml(row.desc)" />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Relacionados ───────────────────────────────────────────── -->
        <section id="relacionados">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('related.title') }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              v-for="item in relatedItems"
              :key="item.name"
              type="button"
              class="text-left rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              @click="(window.top ?? window).location.href = item.path"
            >
              <p class="font-medium text-sm mb-1">{{ item.name }}</p>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
            </button>
          </div>
        </section>

        <!-- ── Notas ──────────────────────────────────────────────────── -->
        <section id="notas">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('notes.title') }}</h2>
          <div class="space-y-3">
            <div class="rounded-lg border border-border bg-muted/20 p-4">
              <p class="text-sm text-muted-foreground" v-html="sanitizeHtml(tContent('notes.tip1'))" />
            </div>
            <div class="rounded-lg border border-border bg-muted/20 p-4">
              <p class="text-sm text-muted-foreground" v-html="sanitizeHtml(tContent('notes.tip2'))" />
            </div>
          </div>
        </section>

        <!-- ── Analytics ─────────────────────────────────────────────── -->
        <section id="analytics">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('analytics.title') }}</h2>
          <p class="text-sm text-muted-foreground mb-4">{{ tContent('analytics.description') }}</p>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('analytics.table.event') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('analytics.table.trigger') }}</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('analytics.table.payload') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in analyticsRows" :key="row.event" class="border-b border-border/50 last:border-0">
                  <td class="p-3 font-mono text-xs">{{ row.event }}</td>
                  <td class="p-3 text-muted-foreground">{{ row.trigger }}</td>
                  <td class="p-3 font-mono text-xs text-muted-foreground">{{ row.payload }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Testes ─────────────────────────────────────────────────── -->
        <section id="testes">
          <h2 class="text-2xl font-semibold mb-6">{{ tContent('testes.title') }}</h2>

          <!-- Testes funcionais -->
          <h3 class="text-lg font-medium mb-3">{{ tContent('testes.functional.title') }}</h3>
          <p class="text-sm text-muted-foreground mb-4">{{ tContent('testes.functional.description') }}</p>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto mb-8">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">Ação</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">Resultado esperado</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">Prioridade</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(test, idx) in functionalTests" :key="idx" class="border-b border-border/50 last:border-0">
                  <td class="p-3">{{ test.action }}</td>
                  <td class="p-3 text-muted-foreground">{{ test.result }}</td>
                  <td class="p-3">
                    <span :class="test.priority === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'">
                      {{ test.priority }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Testes de acessibilidade -->
          <h3 class="text-lg font-medium mb-3">{{ tContent('testes.accessibility.title') }}</h3>
          <p class="text-sm text-muted-foreground mb-4">{{ tContent('testes.accessibility.description') }}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <div
              v-for="i in 6"
              :key="i"
              class="rounded-lg border border-border p-3 bg-muted/20 flex gap-2 items-start"
            >
              <span class="text-emerald-500 font-bold mt-0.5">✓</span>
              <span class="text-sm text-muted-foreground">{{ tContent(`testes.accessibility.item${i}`) }}</span>
            </div>
          </div>

          <!-- Testes visuais -->
          <h3 class="text-lg font-medium mb-3">{{ tContent('testes.visual.title') }}</h3>
          <p class="text-sm text-muted-foreground mb-4">{{ tContent('testes.visual.description') }}</p>
          <div class="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left p-3 text-muted-foreground font-medium">Story</th>
                  <th class="text-left p-3 text-muted-foreground font-medium">{{ tContent('testes.visual.required') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(test, idx) in visualTests" :key="idx" class="border-b border-border/50 last:border-0">
                  <td class="p-3">{{ test.story }}</td>
                  <td class="p-3">
                    <span :class="test.priority === 'high' ? 'text-destructive font-medium' : 'text-muted-foreground'">
                      {{ test.priority }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div><!-- /main content -->
    </div><!-- /flex layout -->
  </div><!-- /ds-docs -->
</template>
