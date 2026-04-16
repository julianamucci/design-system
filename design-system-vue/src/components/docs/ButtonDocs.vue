<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { Mail, XCircle } from 'lucide-vue-next';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import DocsNav from '@/components/docs/shared/DocsNav.vue';
import uiTranslations from '@/i18n/ui.json';
import buttonTranslations from '@shared/content/button/translations.json';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t: tNav } = useTranslation(uiTranslations);
const { t: tContent, locale } = useTranslation({ ...uiTranslations, ...buttonTranslations });

// ─── SEO & GEO ────────────────────────────────────────────────────────────────

useSeoEffect(computed(() => ({
  title: `${tContent('title')} — ${tContent('category')}`,
  description: tContent('description'),
  locale: locale.value as 'pt-BR' | 'en' | 'es',
  componentSlug: 'button',
})));

// ─── Analytics — page view ────────────────────────────────────────────────────

watch(locale, (newLocale) => {
  track('docs_page_view', {
    component_name: 'button',
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
    component_name: 'button',
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
  const observers = allSectionIds.value.map((id) => {
    const el = document.getElementById(id);
    if (!el) return null;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handleSectionChange(id); },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    observer.observe(el);
    return observer;
  });
  onUnmounted(() => observers.forEach(obs => obs?.disconnect()));
});

// ─── Variant data ─────────────────────────────────────────────────────────────

const variantItems = computed(() => [
  { variant: 'default'     as const, label: 'default',     desc: tContent('variants.items.default')     },
  { variant: 'secondary'   as const, label: 'secondary',   desc: tContent('variants.items.secondary')   },
  { variant: 'outline'     as const, label: 'outline',     desc: tContent('variants.items.outline')     },
  { variant: 'ghost'       as const, label: 'ghost',       desc: tContent('variants.items.ghost')       },
  { variant: 'link'        as const, label: 'link',        desc: tContent('variants.items.link')        },
  { variant: 'destructive' as const, label: 'destructive', desc: tContent('variants.items.destructive') },
]);

const sizeItems = computed(() => [
  { size: 'sm'      as const, label: 'sm',      desc: tContent('variants.sizes.sm')      },
  { size: 'default' as const, label: 'default', desc: tContent('variants.sizes.default') },
  { size: 'lg'      as const, label: 'lg',      desc: tContent('variants.sizes.lg')      },
  { size: 'icon'    as const, label: 'icon',    desc: tContent('variants.sizes.icon')    },
]);

const propRows = computed(() => [
  { name: 'variant', type: '"default" | "destructive" | ...', def: '"default"', desc: tContent('props.table.variant') },
  { name: 'size',    type: '"default" | "sm" | "lg" | "icon"', def: '"default"', desc: tContent('props.table.size')    },
  { name: 'asChild', type: 'boolean',                          def: 'false',     desc: tContent('props.table.asChild') },
  { name: 'disabled',type: 'boolean',                          def: 'false',     desc: tContent('props.table.disabled') },
]);
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
          npx shadcn@latest add button
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

      <!-- Main -->
      <div class="flex-1 min-w-0 space-y-12">

        <!-- ── Demonstração ──────────────────────────────────────────── -->
        <section id="demonstracao">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('demonstration.title') }}</h2>
          <div class="p-8 border border-border rounded-xl bg-card/50 flex items-center justify-center">
            <div class="flex flex-wrap gap-3">
              <Button>{{ tContent('demonstration.labels.save') }}</Button>
              <Button variant="outline">{{ tContent('demonstration.labels.cancel') }}</Button>
              <Button variant="destructive">{{ tContent('demonstration.labels.delete') }}</Button>
            </div>
          </div>
        </section>

        <!-- ── Anatomia ──────────────────────────────────────────────── -->
        <section id="anatomia">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('anatomy.title') }}</h2>
          <div class="p-8 border border-border rounded-xl bg-card/50">
            <ol class="space-y-3 text-sm">
              <li v-for="i in [1, 2, 3]" :key="i" class="flex gap-3">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{{ i }}</span>
                <span v-html="sanitizeHtml(tContent(`anatomy.item${i}`))" />
              </li>
            </ol>
          </div>
        </section>

        <!-- ── Quando usar ───────────────────────────────────────────── -->
        <section id="quando-usar">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('usage.title') }}</h2>
          <div class="space-y-8 w-full">

            <div class="bg-muted/30 border p-4 rounded-lg space-y-3">
              <h4 class="font-medium text-sm">{{ tContent('usage.guidelines.title') }}</h4>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li v-for="i in [1, 2, 3, 4]" :key="i" v-html="sanitizeHtml(tContent(`usage.guidelines.item${i}`))" />
              </ul>
            </div>

            <div class="p-6 border border-border rounded-xl bg-card/50">
              <div class="w-full overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-border text-left bg-muted/50 font-medium">
                      <th class="p-3 border-r border-border">{{ tContent('usage.scenarios.cols.scenario') }}</th>
                      <th class="p-3 border-r border-border">{{ tContent('usage.scenarios.cols.use') }}</th>
                      <th class="p-3">{{ tContent('usage.scenarios.cols.alternative') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="i in [1, 2, 3]" :key="i" class="border-b border-border hover:bg-muted/5">
                      <td class="p-3 border-r border-border">{{ tContent(`usage.scenarios.item${i}.s`) }}</td>
                      <td class="p-3 border-r border-border font-medium text-primary">{{ tContent(`usage.scenarios.item${i}.u`) }}</td>
                      <td class="p-3 text-muted-foreground">{{ tContent(`usage.scenarios.item${i}.a`) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-medium text-sm">{{ tContent('uxWriting.title') }}</h4>
              <div class="w-full overflow-x-auto border rounded-xl shadow-sm overflow-hidden">
                <table class="w-full border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-border bg-muted/70 text-left">
                      <th class="p-3 border-r border-border font-semibold">{{ tContent('uxWriting.table.element') }}</th>
                      <th class="p-3 border-r border-border font-semibold">{{ tContent('uxWriting.table.rules') }}</th>
                      <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">{{ tContent('uxWriting.table.correct') }}</th>
                      <th class="p-3 font-semibold text-red-700 dark:text-red-400">{{ tContent('uxWriting.table.avoid') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="key in ['label', 'destructive', 'cancel']" :key="key" class="border-b border-border last:border-0 hover:bg-muted/5">
                      <td class="p-3 border-r border-border font-medium">{{ tContent(`uxWriting.table.${key}.name`) }}</td>
                      <td class="p-3 border-r border-border">{{ tContent(`uxWriting.table.${key}.format`) }}</td>
                      <td class="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{{ tContent(`uxWriting.table.${key}.good`) }}</td>
                      <td class="p-3 font-medium text-red-600 dark:text-red-500">{{ tContent(`uxWriting.table.${key}.bad`) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-card border rounded-xl p-4 shadow-sm">
                <h4 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">✓</span>
                  {{ tContent('usage.do.title') }}
                </h4>
                <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <li v-for="i in [1, 2, 3, 4]" :key="i">{{ tContent(`usage.do.item${i}`) }}</li>
                </ul>
              </div>
              <div class="bg-card border rounded-xl p-4 shadow-sm">
                <h4 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
                  <span class="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">✗</span>
                  {{ tContent('usage.dont.title') }}
                </h4>
                <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <li v-for="i in [1, 2, 3]" :key="i" v-html="sanitizeHtml(tContent(`usage.dont.item${i}`))" />
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Do/Don't ──────────────────────────────────────────────── -->
        <section id="do-dont">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('doDont.title') }}</h2>
          <div class="p-8 border border-border rounded-xl bg-card/50 space-y-8">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-green-600">
                  <span class="font-bold text-lg">✓</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.do') }}</span>
                </div>
                <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2">
                  <Button>{{ tContent('demonstration.labels.save') }}</Button>
                  <Button variant="outline">{{ tContent('demonstration.labels.cancel') }}</Button>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.do') }}</p>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-red-600">
                  <span class="font-bold text-lg">✗</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.dont') }}</span>
                </div>
                <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10 flex gap-2">
                  <Button>OK</Button>
                  <Button>Click here</Button>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.dont') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-green-600">
                  <span class="font-bold text-lg">✓</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.do') }}</span>
                </div>
                <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10">
                  <Button size="icon" aria-label="Close dialog">
                    <XCircle class="h-4 w-4" />
                  </Button>
                </div>
                <p class="text-sm text-muted-foreground italic px-1" v-html="sanitizeHtml(tContent('doDont.pair2.do'))" />
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-red-600">
                  <span class="font-bold text-lg">✗</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.dont') }}</span>
                </div>
                <div class="border border-red-200 dark:border-red-900/50 rounded-xl p-6 bg-red-50/50 dark:bg-red-950/10">
                  <Button size="icon">
                    <XCircle class="h-4 w-4" />
                  </Button>
                </div>
                <p class="text-sm text-muted-foreground italic px-1" v-html="sanitizeHtml(tContent('doDont.pair2.dont'))" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── Importação ────────────────────────────────────────────── -->
        <section id="importacao">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('import.title') }}</h2>
          <div class="p-8 border border-border rounded-xl bg-card/50 space-y-4">
            <div>
              <p class="text-sm text-muted-foreground mb-3">{{ tContent('import.basic') }}</p>
              <div class="bg-muted p-4 rounded-lg font-mono text-sm border">
                import { Button } from "@/components/ui/button"
              </div>
            </div>
            <div>
              <p class="text-sm text-muted-foreground mb-3">{{ tContent('import.variants') }}</p>
              <div class="bg-muted p-4 rounded-lg font-mono text-sm border">
                import { buttonVariants } from "@/components/ui/button"
              </div>
            </div>
          </div>
        </section>

        <!-- ── Exemplos ──────────────────────────────────────────────── -->
        <section id="exemplos">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('examples.title') }}</h2>
          <div class="space-y-8">
            <div class="space-y-3">
              <h3 class="text-sm font-medium">{{ tContent('examples.basic') }}</h3>
              <div class="p-6 border border-border rounded-xl bg-card/50 flex items-center justify-center">
                <Button>{{ tContent('demonstration.labels.save') }}</Button>
              </div>
            </div>
            <div class="space-y-3">
              <h3 class="text-sm font-medium">{{ tContent('examples.withIcon') }}</h3>
              <div class="p-6 border border-border rounded-xl bg-card/50 flex items-center justify-center">
                <div class="flex gap-4">
                  <Button>
                    <Mail class="h-4 w-4 mr-2" />
                    {{ tContent('demonstration.labels.save') }}
                  </Button>
                  <Button variant="outline">
                    {{ tContent('demonstration.labels.cancel') }}
                    <XCircle class="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <h3 class="text-sm font-medium">{{ tContent('examples.disabled') }}</h3>
              <div class="p-6 border border-border rounded-xl bg-card/50 flex items-center justify-center">
                <Button disabled>{{ tContent('examples.disabled') }}</Button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Variantes ─────────────────────────────────────────────── -->
        <section id="variantes">
          <h2 class="text-xl font-semibold mb-6">{{ tContent('variants.title') }}</h2>
          <div class="space-y-12">

            <div>
              <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
                {{ tContent('variants.visualTitle') }}
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                <div
                  v-for="item in variantItems"
                  :key="item.variant"
                  class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div class="flex-1 flex items-center justify-center p-8 bg-muted/5 min-h-[140px]">
                    <Button :variant="item.variant">{{ tContent('title') }}</Button>
                  </div>
                  <div class="p-4 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[10px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                      {{ item.label }}
                    </p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1 border-l-2 border-primary/20 pl-3">
                {{ tContent('variants.sizeTitle') }}
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div
                  v-for="item in sizeItems"
                  :key="item.size"
                  class="border border-border/60 rounded-xl overflow-hidden bg-card/50 flex flex-col transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div class="flex-1 flex items-center justify-center p-6 bg-muted/5 min-h-[100px]">
                    <Button :size="item.size">
                      <Mail v-if="item.size === 'icon'" class="h-4 w-4" />
                      <template v-else>{{ tContent('title') }}</template>
                    </Button>
                  </div>
                  <div class="p-3 border-t border-border/40 bg-muted/10">
                    <p class="text-[10px] uppercase font-mono text-primary font-bold block mb-1">{{ item.label }}</p>
                    <p class="text-[11px] text-muted-foreground">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Estados ───────────────────────────────────────────────── -->
        <section id="estados">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('states.title') }}</h2>
          <div class="w-full overflow-x-auto border rounded-lg">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border text-left bg-muted/50">
                  <th class="p-3 border-r border-border font-medium">{{ tContent('states.table.state') }}</th>
                  <th class="p-3 border-r border-border font-medium">{{ tContent('states.table.visual') }}</th>
                  <th class="p-3 font-medium">{{ tContent('states.table.trigger') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Default</td>
                  <td class="p-3 border-r border-border"><Button size="sm">{{ tContent('demonstration.labels.save') }}</Button></td>
                  <td class="p-3 text-muted-foreground">{{ tContent('states.table.initial') }}</td>
                </tr>
                <tr class="border-b border-border bg-muted/20 hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Hover</td>
                  <td class="p-3 border-r border-border text-muted-foreground text-xs">{{ tContent('states.table.hover') }}</td>
                  <td class="p-3 text-muted-foreground">CSS automático: <code class="bg-muted px-1 rounded text-xs">hover:bg-primary/90</code></td>
                </tr>
                <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Disabled</td>
                  <td class="p-3 border-r border-border"><Button disabled size="sm">{{ tContent('demonstration.labels.save') }}</Button></td>
                  <td class="p-3 text-muted-foreground">{{ tContent('states.table.disabled') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Propriedades ──────────────────────────────────────────── -->
        <section id="propriedades">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('props.title') }}</h2>
          <div class="space-y-6">
            <div>
              <h3 class="font-medium text-sm mb-3">{{ tContent('props.interface') }}</h3>
              <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">interface ButtonProps
  extends /* HTMLAttributes */ PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  asChild?: boolean
}</div>
            </div>
            <div class="border rounded-lg overflow-hidden shadow-sm">
              <table class="w-full border-collapse text-sm">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.prop') }}</th>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.type') }}</th>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.default') }}</th>
                    <th class="p-3 font-semibold">{{ tContent('props.table.description') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prop in propRows" :key="prop.name" class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono text-xs font-bold text-primary">{{ prop.name }}</td>
                    <td class="p-3 border-r border-border font-mono text-[10px] text-muted-foreground">{{ prop.type }}</td>
                    <td class="p-3 border-r border-border font-mono text-[10px]">{{ prop.def }}</td>
                    <td class="p-3 text-xs text-muted-foreground">{{ prop.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ── Tokens ────────────────────────────────────────────────── -->
        <section id="tokens">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('tokens.title') }}</h2>
          <div class="border rounded-lg overflow-hidden shadow-sm">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/50 text-left">
                  <th class="p-3 border-r border-border font-medium">{{ tContent('tokens.table.token') }}</th>
                  <th class="p-3 border-r border-border font-medium">{{ tContent('tokens.table.class') }}</th>
                  <th class="p-3 font-medium">{{ tContent('tokens.table.part') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-mono text-xs text-primary font-medium"><code>--primary</code></td>
                  <td class="p-3 border-r border-border font-mono text-xs text-primary"><code>bg-primary</code></td>
                  <td class="p-3 text-xs text-muted-foreground">{{ tContent('tokens.table.primary') }}</td>
                </tr>
                <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-mono text-xs text-primary font-medium"><code>--radius</code></td>
                  <td class="p-3 border-r border-border font-mono text-xs text-primary"><code>rounded-md</code></td>
                  <td class="p-3 text-xs text-muted-foreground">{{ tContent('tokens.table.radius') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── Acessibilidade ────────────────────────────────────────── -->
        <section id="acessibilidade">
          <h2 class="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">♿</span>
            {{ tContent('accessibility.title') }}
          </h2>
          <div class="space-y-6">
            <div class="bg-muted/30 border p-6 rounded-xl space-y-4">
              <h4 class="font-semibold text-sm">{{ tContent('accessibility.featuresTitle') }}</h4>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
                <li v-for="i in [1, 2, 3]" :key="i" class="flex gap-3 text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border/40">
                  <span class="text-primary font-bold">✓</span>
                  <span v-html="sanitizeHtml(tContent(`accessibility.item${i}`))" />
                </li>
              </ul>
            </div>
            <div class="space-y-4">
              <h4 class="font-semibold text-sm flex items-center gap-2">
                <span class="w-5 h-5 rounded-md bg-muted flex items-center justify-center">⌨️</span>
                {{ tContent('accessibility.keyboardTitle') }}
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div v-for="key in ['tab', 'enter', 'space']" :key="key" class="bg-card border rounded-xl p-4 shadow-sm hover:border-primary/20 transition-colors">
                  <div class="flex items-center gap-2 mb-2">
                    <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60">
                      {{ key }}
                    </code>
                  </div>
                  <p class="text-xs text-muted-foreground leading-relaxed italic">{{ tContent(`accessibility.keyboard.${key}`) }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Relacionados ──────────────────────────────────────────── -->
        <section id="relacionados">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('related.title') }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">Toggle</h4>
              <p class="text-xs text-muted-foreground">{{ tContent('related.toggle') }}</p>
            </div>
            <div class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">Dropdown Menu</h4>
              <p class="text-xs text-muted-foreground">{{ tContent('related.dropdown') }}</p>
            </div>
          </div>
        </section>

        <!-- ── Notas ─────────────────────────────────────────────────── -->
        <section id="notas">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('notes.title') }}</h2>
          <div class="space-y-4">
            <div class="p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
              <p class="text-sm text-muted-foreground leading-relaxed">{{ tContent('notes.tip1') }}</p>
            </div>
            <div class="p-4 bg-orange-500/5 border-l-4 border-orange-500 rounded-r-lg">
              <p class="text-sm text-muted-foreground leading-relaxed">{{ tContent('notes.tip2') }}</p>
            </div>
          </div>
        </section>

        <!-- ── Analytics ─────────────────────────────────────────────── -->
        <section id="analytics">
          <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg">📊</span>
            {{ tContent('analytics.title') }}
          </h2>
          <div class="space-y-4">
            <p class="text-sm text-muted-foreground leading-relaxed">{{ tContent('analytics.description') }}</p>
            <div class="border rounded-xl overflow-hidden shadow-sm">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="bg-muted/50 border-b text-left">
                    <th class="p-4 border-r border-border font-semibold w-1/4">{{ tContent('analytics.table.event') }}</th>
                    <th class="p-4 border-r border-border font-semibold w-1/4">{{ tContent('analytics.table.trigger') }}</th>
                    <th class="p-4 font-semibold">{{ tContent('analytics.table.payload') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-4 border-r border-border font-mono text-xs text-primary font-bold">{{ tContent('analytics.table.click') }}</td>
                    <td class="p-4 border-r border-border text-xs">{{ tContent('analytics.table.clickTrigger') }}</td>
                    <td class="p-4 font-mono text-[11px] text-muted-foreground bg-muted/10 tracking-tight">{{ tContent('analytics.table.clickPayload') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ── Testes ─────────────────────────────────────────────────── -->
        <section id="testes">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-lg">🧪</span>
            {{ tContent('testes.title') }}
          </h2>
          <div class="space-y-8">
            <div>
              <h3 class="font-semibold text-sm mb-4 text-muted-foreground flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-primary" />
                {{ tContent('testes.functional') }}
              </h3>
              <div class="border rounded-xl overflow-hidden shadow-sm">
                <table class="w-full border-collapse text-sm">
                  <thead class="bg-muted/50 border-b text-left">
                    <tr>
                      <th class="p-4 border-r border-border font-semibold">{{ tNav('common.userAction') }}</th>
                      <th class="p-4 border-r border-border font-semibold">{{ tNav('common.expectedResult') }}</th>
                      <th class="p-4 font-semibold w-24">{{ tNav('common.priority') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border text-xs font-medium">{{ tContent('testes.action') }}</td>
                      <td class="p-4 border-r border-border text-xs text-muted-foreground">{{ tContent('testes.result') }}</td>
                      <td class="p-4">
                        <Badge class="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 h-5 font-bold text-[9px] uppercase tracking-wider">
                          {{ tContent('testes.priority') }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="space-y-4">
              <h3 class="font-semibold text-sm mb-4 text-muted-foreground flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-primary" />
                {{ tContent('testes.accessibility') }}
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="i in [1, 2, 3, 4]" :key="i" class="flex gap-3 items-start p-3 bg-muted/10 rounded-lg border border-border/40">
                  <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-[10px] text-primary font-bold italic">axe</span>
                  </div>
                  <span class="text-xs text-muted-foreground leading-relaxed">{{ tContent(`testes.a11yItem${i}`) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>
