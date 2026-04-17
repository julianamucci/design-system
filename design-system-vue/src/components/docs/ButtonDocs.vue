<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { Mail, XCircle, Loader2 } from 'lucide-vue-next';
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
  description: tContent('seo.description'),
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
  { size: 'sm'      as const, label: 'sm',      desc: tContent('variants.sizes.sm'),      use: tContent('variants.sizes.smUse')      },
  { size: 'default' as const, label: 'default', desc: tContent('variants.sizes.default'), use: tContent('variants.sizes.defaultUse') },
  { size: 'lg'      as const, label: 'lg',      desc: tContent('variants.sizes.lg'),      use: tContent('variants.sizes.lgUse')      },
  { size: 'icon'    as const, label: 'icon',    desc: tContent('variants.sizes.icon'),    use: tContent('variants.sizes.iconUse')    },
]);

const tokenRows = computed(() => [
  { token: '--primary',            cls: 'bg-primary',             part: tContent('tokens.table.primary')            },
  { token: '--primary-foreground', cls: 'text-primary-foreground', part: tContent('tokens.table.primaryForeground') },
  { token: '--secondary',          cls: 'bg-secondary',           part: tContent('tokens.table.secondary')          },
  { token: '--destructive',        cls: 'bg-destructive',         part: tContent('tokens.table.destructive')        },
  { token: '--border',             cls: 'border-border',          part: tContent('tokens.table.border')             },
  { token: '--ring',               cls: 'ring-ring',              part: tContent('tokens.table.ring')               },
  { token: '--radius',             cls: 'rounded-md',             part: tContent('tokens.table.radius')             },
]);

const relatedItems = computed(() => [
  { name: 'Toggle',        desc: tContent('related.toggle'),   path: '?path=/docs/ui-toggle--docs' },
  { name: 'Dropdown Menu', desc: tContent('related.dropdown'), path: '?path=/docs/ui-dropdownmenu--docs' },
]);

const propRows = computed(() => [
  { name: 'variant',  type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', def: '"default"', req: 'Não', desc: tContent('props.table.variant')  },
  { name: 'size',     type: '"default" | "sm" | "lg" | "icon"',                                        def: '"default"', req: 'Não', desc: tContent('props.table.size')     },
  { name: 'disabled', type: 'boolean',                                                                  def: 'false',     req: 'Não', desc: tContent('props.table.disabled') },
  { name: 'asChild',  type: 'boolean',                                                                  def: 'false',     req: 'Não', desc: tContent('props.table.asChild')  },
  { name: 'onClick',  type: '(event: MouseEvent) => void',                                             def: '—',         req: 'Não', desc: tContent('props.table.onClick')  },
  { name: 'type',     type: '"button" | "submit" | "reset"',                                           def: '"button"',  req: 'Não', desc: tContent('props.table.type')     },
  { name: 'class',    type: 'string',                                                                   def: '—',         req: 'Não', desc: tContent('props.table.className') },
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
          <div class="p-8 border border-border rounded-xl bg-card/50 space-y-4">
            <ol class="space-y-3 text-sm list-none p-0 m-0">
              <li v-for="i in [1, 2, 3]" :key="i" class="flex gap-3 list-none">
                <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{{ i }}</span>
                <span v-html="sanitizeHtml(tContent(`anatomy.item${i}`))" />
              </li>
            </ol>
            <div class="rounded-lg bg-muted/50 border border-border/40 px-4 pt-3 pb-4">
              <p class="text-xs text-muted-foreground mb-2">{{ tContent('anatomy.structureLabel') }}</p>
              <pre class="text-xs font-mono leading-relaxed" v-html="sanitizeHtml(tContent('anatomy.structureCode'))" />
            </div>
          </div>
        </section>

        <!-- ── Quando usar ───────────────────────────────────────────── -->
        <section id="quando-usar">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('usage.title') }}</h2>
          <div class="border rounded-xl p-6 shadow-sm space-y-6">

            <div class="bg-muted/30 rounded-lg p-4 space-y-3">
              <h3 class="font-medium text-sm">{{ tContent('usage.guidelines.title') }}</h3>
              <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li v-for="i in [1, 2, 3, 4]" :key="i" v-html="sanitizeHtml(tContent(`usage.guidelines.item${i}`))" />
              </ul>
            </div>

            <div class="overflow-x-auto">
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

            <div class="space-y-3">
              <h3 class="font-medium text-sm">{{ tContent('uxWriting.title') }}</h3>
              <div class="overflow-x-auto">
                <table class="w-full border-collapse text-sm">
                  <thead>
                    <tr class="border-b border-border bg-muted/70 text-left">
                      <th class="p-3 border-r border-border font-semibold">{{ tContent('uxWriting.table.element') }}</th>
                      <th class="p-3 border-r border-border font-semibold">{{ tContent('uxWriting.table.rules') }}</th>
                      <th class="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">
                        <span class="flex items-center gap-1.5">
                          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                          {{ tContent('uxWriting.table.correct') }}
                        </span>
                      </th>
                      <th class="p-3 font-semibold text-red-700 dark:text-red-400">
                        <span class="flex items-center gap-1.5">
                          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                          {{ tContent('uxWriting.table.avoid') }}
                        </span>
                      </th>
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
                <h3 class="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                  {{ tContent('usage.do.title') }}
                </h3>
                <ul class="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <li v-for="i in [1, 2, 3, 4]" :key="i">{{ tContent(`usage.do.item${i}`) }}</li>
                </ul>
              </div>
              <div class="bg-card border rounded-xl p-4 shadow-sm">
                <h3 class="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                  {{ tContent('usage.dont.title') }}
                </h3>
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
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                  <span class="text-sm font-semibold uppercase tracking-wider">{{ tNav('common.do') }}</span>
                </div>
                <div class="border border-green-200 dark:border-green-900/50 rounded-xl p-6 bg-green-50/50 dark:bg-green-950/10 flex gap-2">
                  <Button variant="outline">{{ tContent('demonstration.labels.cancel') }}</Button>
                  <Button>{{ tContent('demonstration.labels.save') }}</Button>
                </div>
                <p class="text-sm text-muted-foreground italic px-1">{{ tContent('doDont.pair1.do') }}</p>
              </div>
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-red-600">
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
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
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
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
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
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
              <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">&lt;Button&gt;Salvar&lt;/Button&gt;</code></div>
            </div>
            <div class="space-y-3">
              <h3 class="text-sm font-medium">{{ tContent('examples.withIcon') }}</h3>
              <div class="p-6 border border-border rounded-xl bg-card/50 flex items-center justify-center">
                <div class="flex gap-4">
                  <Button variant="outline">
                    {{ tContent('demonstration.labels.cancel') }}
                    <XCircle class="h-4 w-4 ml-2" />
                  </Button>
                  <Button>
                    <Mail class="h-4 w-4 mr-2" />
                    {{ tContent('demonstration.labels.save') }}
                  </Button>
                </div>
              </div>
              <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">&lt;Button variant="outline"&gt;
  Cancelar
  &lt;XCircle class="h-4 w-4 ml-2" /&gt;
&lt;/Button&gt;
&lt;Button&gt;
  &lt;Mail class="h-4 w-4 mr-2" /&gt;
  Salvar
&lt;/Button&gt;</code></div>
            </div>
            <div class="space-y-3">
              <h3 class="text-sm font-medium">{{ tContent('examples.disabled') }}</h3>
              <div class="p-6 border border-border rounded-xl bg-card/50 flex items-center justify-center">
                <Button disabled>{{ tContent('examples.disabled') }}</Button>
              </div>
              <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto"><code class="whitespace-pre">&lt;Button disabled&gt;Desabilitado&lt;/Button&gt;</code></div>
            </div>
          </div>
        </section>

        <!-- ── Variantes ─────────────────────────────────────────────── -->
        <section id="variantes">
          <h2 class="text-xl font-semibold mb-6">{{ tContent('variants.title') }}</h2>
          <div class="space-y-12">

            <div>
              <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
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
                    <p class="text-[11px] uppercase font-mono text-primary font-bold tracking-wider px-1.5 py-0.5 bg-primary/5 rounded-sm inline-block mb-1">
                      {{ item.label }}
                    </p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{{ item.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-muted-foreground mb-6 px-1">
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
                  <div class="p-3 border-t border-border/40 bg-muted/10 space-y-1">
                    <p class="text-[11px] uppercase font-mono text-primary font-bold block">{{ item.label }}</p>
                    <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
                    <p class="text-xs text-muted-foreground/70 italic">{{ item.use }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Estados ───────────────────────────────────────────────── -->
        <section id="estados">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('states.title') }}</h2>
          <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
            <table class="w-full border-collapse text-sm" style="margin:0">
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
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Hover</td>
                  <td class="p-3 border-r border-border text-muted-foreground italic">{{ tContent('states.table.hover') }}</td>
                  <td class="p-3 text-muted-foreground" v-html="sanitizeHtml(tContent('states.table.hoverTrigger'))" />
                </tr>
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Focus</td>
                  <td class="p-3 border-r border-border"><Button size="sm" class="ring-[3px] ring-ring/50 border-ring">{{ tContent('demonstration.labels.save') }}</Button></td>
                  <td class="p-3 text-muted-foreground" v-html="sanitizeHtml(tContent('states.table.focusTrigger'))" />
                </tr>
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Disabled</td>
                  <td class="p-3 border-r border-border"><Button disabled size="sm">{{ tContent('demonstration.labels.save') }}</Button></td>
                  <td class="p-3 text-muted-foreground" v-html="sanitizeHtml(tContent('states.table.disabledTrigger'))" />
                </tr>
                <tr class="border-b border-border hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">Loading</td>
                  <td class="p-3 border-r border-border">
                    <Button disabled size="sm">
                      <Loader2 class="h-4 w-4 animate-spin" />
                      Aguarde…
                    </Button>
                  </td>
                  <td class="p-3 text-muted-foreground" v-html="sanitizeHtml(tContent('states.table.loadingTrigger'))" />
                </tr>
                <tr class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                  <td class="p-3 border-r border-border font-medium">aria-invalid</td>
                  <td class="p-3 border-r border-border"><Button size="sm" aria-invalid="true">{{ tContent('demonstration.labels.save') }}</Button></td>
                  <td class="p-3 text-muted-foreground" v-html="sanitizeHtml(tContent('states.table.invalidTrigger'))" />
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
              <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">interface ButtonProps extends HTMLAttributes&lt;HTMLButtonElement&gt; {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}</div>
            </div>
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm" style="margin:0">
                <thead class="bg-muted/50 border-b text-left">
                  <tr>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.prop') }}</th>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.type') }}</th>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.default') }}</th>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('props.table.required') }}</th>
                    <th class="p-3 font-semibold">{{ tContent('props.table.description') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="prop in propRows" :key="prop.name" class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono font-bold text-primary">{{ prop.name }}</td>
                    <td class="p-3 border-r border-border font-mono text-muted-foreground">{{ prop.type }}</td>
                    <td class="p-3 border-r border-border font-mono">{{ prop.def }}</td>
                    <td class="p-3 border-r border-border text-muted-foreground">{{ prop.req }}</td>
                    <td class="p-3 text-muted-foreground">{{ prop.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="space-y-3">
              <h3 class="font-medium text-sm">{{ tContent('props.extensibilityTitle') }}</h3>
              <div class="space-y-3">
                <p v-for="key in ['classNameNote', 'asChildNote']" :key="key"
                   class="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border"
                   v-html="sanitizeHtml(tContent(`props.extensibility.${key}`))" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── Tokens ────────────────────────────────────────────────── -->
        <section id="tokens">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('tokens.title') }}</h2>
          <div class="space-y-6">
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm" style="margin:0">
                <thead>
                  <tr class="border-b border-border bg-muted/50 text-left">
                    <th class="p-3 border-r border-border font-medium">{{ tContent('tokens.table.token') }}</th>
                    <th class="p-3 border-r border-border font-medium">{{ tContent('tokens.table.class') }}</th>
                    <th class="p-3 font-medium">{{ tContent('tokens.table.part') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in tokenRows" :key="row.token" class="border-b last:border-0 hover:bg-muted/5 transition-colors">
                    <td class="p-3 border-r border-border font-mono text-primary font-medium"><code>{{ row.token }}</code></td>
                    <td class="p-3 border-r border-border font-mono text-primary"><code>{{ row.cls }}</code></td>
                    <td class="p-3 text-muted-foreground">{{ row.part }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="space-y-2">
              <h3 class="font-medium text-sm">{{ tContent('tokens.customizationTitle') }}</h3>
              <div class="bg-muted p-4 rounded-lg font-mono text-xs border overflow-x-auto whitespace-pre leading-relaxed">/* Em globals.css ou theme-custom.css */
html.meu-tema {
  --primary: 262 80% 58%; /* Roxo — light mode */
  --primary-foreground: 0 0% 100%;
}
html.meu-tema.dark {
  --primary: 262 60% 75%; /* Roxo — dark mode */
  --primary-foreground: 0 0% 100%;
}</div>
            </div>
          </div>
        </section>

        <!-- ── Acessibilidade ────────────────────────────────────────── -->
        <section id="acessibilidade">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('accessibility.title') }}</h2>
          <div class="border rounded-xl p-6 shadow-sm space-y-6">
            <ul class="space-y-3 text-sm text-muted-foreground list-disc pl-5">
              <li v-for="i in [1, 2, 3, 4, 5]" :key="i" v-html="sanitizeHtml(tContent(`accessibility.item${i}`))" />
            </ul>
            <div class="space-y-4">
              <h3 class="font-medium text-sm">{{ tContent('accessibility.keyboardTitle') }}</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div v-for="key in ['tab', 'enter', 'space']" :key="key" class="bg-muted/30 border rounded-xl p-4">
                  <code class="text-[10px] bg-muted px-2 py-0.5 rounded-md uppercase font-bold text-primary border border-border/60 block mb-2">
                    {{ key }}
                  </code>
                  <p class="text-xs text-muted-foreground leading-relaxed">{{ tContent(`accessibility.keyboard.${key}`) }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Relacionados ──────────────────────────────────────────── -->
        <section id="relacionados">
          <h2 class="text-xl font-semibold mb-4">{{ tContent('related.title') }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="item in relatedItems" :key="item.name" role="link" tabindex="0"
                 @click="(window.top ?? window).location.href = item.path"
                 @keydown.enter="(window.top ?? window).location.href = item.path"
                 class="border rounded-xl p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer group">
              <h4 class="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{{ item.name }}</h4>
              <p class="text-xs text-muted-foreground">{{ item.desc }}</p>
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
          <h2 class="text-xl font-semibold mb-4">{{ tContent('analytics.title') }}</h2>
          <div class="space-y-4">
            <p class="text-sm text-muted-foreground leading-relaxed">{{ tContent('analytics.description') }}</p>
            <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
              <table class="w-full border-collapse text-sm" style="margin:0">
                <thead>
                  <tr class="bg-muted/50 border-b text-left">
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('analytics.table.event') }}</th>
                    <th class="p-3 border-r border-border font-semibold">{{ tContent('analytics.table.trigger') }}</th>
                    <th class="p-3 font-semibold">{{ tContent('analytics.table.payload') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="key in ['pageView', 'sectionViewed', 'langSwitch', 'click']" :key="key" class="border-b last:border-0 hover:bg-muted/5">
                    <td class="p-3 border-r border-border font-mono text-primary font-bold">{{ tContent(`analytics.table.${key}`) }}</td>
                    <td class="p-3 border-r border-border">{{ tContent(`analytics.table.${key}Trigger`) }}</td>
                    <td class="p-3 font-mono text-muted-foreground">{{ tContent(`analytics.table.${key}Payload`) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ── Testes ─────────────────────────────────────────────────── -->
        <section id="testes">
          <h2 class="text-xl font-semibold mb-6">{{ tContent('testes.title') }}</h2>
          <div class="space-y-8">

            <!-- Comportamento Funcional -->
            <div>
              <h3 class="font-semibold text-sm mb-1">
                {{ tContent('testes.functional.title') }}
              </h3>
              <p class="text-xs text-muted-foreground mb-4">{{ tContent('testes.functional.description') }}</p>
              <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
                <table class="w-full border-collapse text-sm">
                  <thead class="bg-muted/50 border-b text-left">
                    <tr>
                      <th class="p-4 border-r border-border font-semibold">{{ tNav('common.userAction') }}</th>
                      <th class="p-4 border-r border-border font-semibold">{{ tNav('common.expectedResult') }}</th>
                      <th class="p-4 font-semibold w-24">{{ tNav('common.priority') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="i in [1, 2, 3, 4, 5, 6]" :key="i" class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border font-medium">{{ tContent(`testes.functional.item${i}.action`) }}</td>
                      <td class="p-4 border-r border-border text-muted-foreground">{{ tContent(`testes.functional.item${i}.result`) }}</td>
                      <td class="p-4">
                        <Badge :class="tContent(`testes.functional.item${i}.priority`) === 'high'
                          ? 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 h-5 font-medium text-[11px]'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 h-5 font-medium text-[11px]'">
                          {{ tContent(`testes.functional.item${i}.priority`) === 'high' ? tNav('common.high') : tNav('common.medium') }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Acessibilidade Verificável -->
            <div>
              <h3 class="font-semibold text-sm mb-1">
                {{ tContent('testes.accessibility.title') }}
              </h3>
              <p class="text-xs text-muted-foreground mb-4">{{ tContent('testes.accessibility.description') }}</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="i in [1, 2, 3, 4, 5, 6]" :key="i" class="flex gap-3 items-start p-3 bg-muted/10 rounded-lg border border-border/40">
                  <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-[10px] text-primary font-bold italic">axe</span>
                  </div>
                  <span class="text-xs text-muted-foreground leading-relaxed">{{ tContent(`testes.accessibility.item${i}`) }}</span>
                </div>
              </div>
            </div>

            <!-- Regressão Visual -->
            <div>
              <h3 class="font-semibold text-sm mb-1">
                {{ tContent('testes.visual.title') }}
              </h3>
              <p class="text-xs text-muted-foreground mb-4">{{ tContent('testes.visual.description') }}</p>
              <div class="border rounded-xl overflow-x-auto p-4 shadow-sm">
                <table class="w-full border-collapse text-sm">
                  <thead class="bg-muted/50 border-b text-left">
                    <tr>
                      <th class="p-4 border-r border-border font-semibold">{{ tNav('common.storyState') }}</th>
                      <th class="p-4 border-r border-border font-semibold text-center w-32">{{ tNav('common.themeLight') }}</th>
                      <th class="p-4 border-r border-border font-semibold text-center w-32">{{ tNav('common.themeDark') }}</th>
                      <th class="p-4 font-semibold w-24">{{ tNav('common.priority') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="i in [1, 2, 3, 4, 5, 6, 7]" :key="i" class="border-b last:border-0 hover:bg-muted/5">
                      <td class="p-4 border-r border-border font-medium">{{ tContent(`testes.visual.item${i}.story`) }}</td>
                      <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">{{ tContent('testes.visual.required') }}</td>
                      <td class="p-4 border-r border-border text-center text-emerald-600 font-medium">{{ tContent('testes.visual.required') }}</td>
                      <td class="p-4">
                        <Badge :class="tContent(`testes.visual.item${i}.priority`) === 'high'
                          ? 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10 h-5 font-medium text-[11px]'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 h-5 font-medium text-[11px]'">
                          {{ tContent(`testes.visual.item${i}.priority`) === 'high' ? tNav('common.high') : tNav('common.medium') }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  </div>
</template>
