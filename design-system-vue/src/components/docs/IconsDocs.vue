<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import * as LucideIcons from 'lucide-vue-next';
import { Package, Search, Check } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import { useTranslation, useI18nStore } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import iconsTranslations from '@shared/content/icons/translations.json';

// ─── Catálogo de ícones ──────────────────────────────────────────────────────

const ALL_ICON_NAMES: string[] = Object.keys(LucideIcons).filter((name) => {
  const value = (LucideIcons as Record<string, unknown>)[name];
  const type = typeof value;
  return (
    (type === 'object' || type === 'function') &&
    value !== null &&
    /^[A-Z]/.test(name) &&
    !name.endsWith('Icon')
  );
});

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t, locale } = useTranslation(iconsTranslations);
const store = useI18nStore();

// ─── SEO ──────────────────────────────────────────────────────────────────────

useSeoEffect(
  computed(() => ({
    title: `${t('title')} — ${t('category')}`,
    description: t('description'),
    locale: store.locale,
    componentSlug: 'icons',
  }))
);

// ─── Analytics — page view ────────────────────────────────────────────────────

track('docs_page_view', {
  component_name: 'icons',
  locale: store.locale,
  page_title: `${t('title')} · Design System`,
});

// ─── Estado ──────────────────────────────────────────────────────────────────

const search = ref('');
const copied = ref<string | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Filtro ──────────────────────────────────────────────────────────────────

const filteredNames = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (!q) return ALL_ICON_NAMES;
  return ALL_ICON_NAMES.filter((name) =>
    name.toLowerCase().replace(/[\s\-_]+/g, '').includes(q)
  );
});

// ─── Texto interpolado ────────────────────────────────────────────────────────

const iconsAvailableText = computed(() =>
  t('iconsAvailable').replace('{count}', String(ALL_ICON_NAMES.length))
);

const searchCountText = computed(() => {
  const count = filteredNames.value.length;
  if (search.value.trim()) {
    return t('search.results')
      .replace('{count}', String(count))
      .replace('{plural}', count !== 1 ? 's' : '')
      .replace('{query}', search.value);
  }
  return t('search.count').replace('{count}', String(count));
});

// ─── Copiar ──────────────────────────────────────────────────────────────────

function handleCopy(name: string) {
  navigator.clipboard
    .writeText(`import { ${name} } from 'lucide-vue-next';`)
    .then(() => {
      if (copiedTimer) clearTimeout(copiedTimer);
      copied.value = name;
      copiedTimer = setTimeout(() => { copied.value = null; }, 1500);
    })
    .catch(() => {});
}

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<template>
  <div class="flex-1 h-full overflow-auto ds-docs">
    <div class="p-8 max-w-6xl mx-auto space-y-8">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <header class="space-y-4 border-b border-border/50 pb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Badge
              variant="secondary"
              class="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0"
            >
              {{ t('category') }}
            </Badge>
            <Badge
              variant="outline"
              class="text-muted-foreground font-normal px-2 py-0"
            >
              {{ t('type') }}
            </Badge>
          </div>
          <LanguageSwitcher />
        </div>

        <h1 class="text-4xl font-bold tracking-tight text-foreground">
          {{ t('title') }}
        </h1>

        <p class="text-muted-foreground max-w-3xl leading-relaxed">
          {{ t('description') }}
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-1">
          <span class="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs font-mono border border-border/50 text-muted-foreground">
            <Package class="h-3 w-3" aria-hidden="true" />
            lucide-vue-next
          </span>
          <span class="text-sm text-muted-foreground/70">
            {{ iconsAvailableText }}
          </span>
        </div>
      </header>

      <!-- ── Busca ────────────────────────────────────────────────────────── -->
      <div class="space-y-3">
        <div class="relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            v-model="search"
            type="search"
            :placeholder="t('search.placeholder')"
            class="pl-9 bg-input border-input"
            :aria-label="t('search.placeholder')"
          />
        </div>
        <p class="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          {{ searchCountText }}
        </p>
      </div>

      <!-- ── Galeria ──────────────────────────────────────────────────────── -->
      <div
        v-if="filteredNames.length === 0"
        class="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
        role="status"
      >
        <Search class="h-10 w-10 opacity-25" aria-hidden="true" />
        <p class="font-medium">{{ t('search.noResults') }}</p>
        <p class="text-sm opacity-70">{{ t('search.noResultsSub') }}</p>
      </div>

      <ul
        v-else
        class="grid gap-1 list-none p-0 m-0"
        style="grid-template-columns: repeat(auto-fill, minmax(96px, 1fr))"
        :aria-label="iconsAvailableText"
      >
        <li v-for="name in filteredNames" :key="name" class="list-none">
          <button
            type="button"
            :aria-label="`${t('copy.tooltip')} ${name}`"
            class="group relative w-full flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors overflow-visible"
            @click="handleCopy(name)"
          >
            <span class="h-6 w-6 flex items-center justify-center relative">
              <Check
                :class="['absolute h-5 w-5 text-primary transition-opacity', copied === name ? 'opacity-100' : 'opacity-0']"
                aria-hidden="true"
              />
              <component
                :is="(LucideIcons as Record<string, unknown>)[name]"
                :class="['h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors transition-opacity', copied === name ? 'opacity-0' : 'opacity-100']"
                aria-hidden="true"
              />
            </span>
            <span class="text-[10px] text-muted-foreground text-center leading-tight break-all font-mono w-full line-clamp-2">
              {{ name }}
            </span>
            <span
              class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            >
              {{ copied === name ? t('copy.copied') : t('copy.tooltip') }}
            </span>
          </button>
        </li>
      </ul>

      <!-- ── Como usar ────────────────────────────────────────────────────── -->
      <section class="space-y-6 border-t border-border/50 pt-8">
        <h2 class="text-xl font-semibold text-foreground">{{ t('howToUse.title') }}</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">{{ t('howToUse.individual.title') }}</p>
            <pre class="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed"><code>import { Search, Settings, User } from 'lucide-vue-next';

&lt;Search class="h-4 w-4" aria-hidden="true" /&gt;</code></pre>
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground">{{ t('howToUse.sizes.title') }}</p>
            <pre class="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed"><code>h-3 w-3   // 12px — badges, captions
h-4 w-4   // 16px — padrão em texto e botões
h-5 w-5   // 20px — destaque em headers
h-6 w-6   // 24px — standalone / ilustrativo</code></pre>
          </div>
        </div>
      </section>

      <!-- ── Acessibilidade ─────────────────────────────────────────────────── -->
      <section class="space-y-4 border-t border-border/50 pt-8">
        <h2 class="text-xl font-semibold text-foreground">{{ t('accessibility.title') }}</h2>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 space-y-2">
            <p class="text-sm font-semibold text-green-700 dark:text-green-400">
              {{ t('accessibility.decorative.title') }}
            </p>
            <pre class="text-xs font-mono overflow-x-auto leading-relaxed text-green-800 dark:text-green-300"><code>&lt;Button&gt;
  &lt;Save class="h-4 w-4" aria-hidden="true" /&gt;
  Salvar
&lt;/Button&gt;</code></pre>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4 space-y-2">
            <p class="text-sm font-semibold text-blue-700 dark:text-blue-400">
              {{ t('accessibility.functional.title') }}
            </p>
            <pre class="text-xs font-mono overflow-x-auto leading-relaxed text-blue-800 dark:text-blue-300"><code>&lt;Button
  size="icon"
  aria-label="Excluir produto"
&gt;
  &lt;Trash2 class="h-4 w-4" aria-hidden="true" /&gt;
&lt;/Button&gt;</code></pre>
          </div>
        </div>
        <ul class="space-y-1.5 text-sm text-muted-foreground list-none p-0 m-0">
          <li
            v-for="rule in ['rule1', 'rule2', 'rule3', 'rule4']"
            :key="rule"
            class="flex gap-2 items-start list-none"
          >
            <span class="text-primary mt-0.5 shrink-0">✓</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t(`accessibility.${rule}`)" />
          </li>
        </ul>
      </section>

    </div>
  </div>
</template>
