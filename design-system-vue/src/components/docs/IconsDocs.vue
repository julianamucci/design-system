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
import DOMPurify from 'dompurify';
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
    .writeText(name)
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
  <div
    class="sb-unstyled nds-flex-1 nds-w-full ds-docs"
    style="height: 100%; overflow: auto"
  >
    <div
      class="nds-p-8 nds-stack"
      data-spacing="xl"
      style="max-width: 72rem; margin-inline: auto"
    >
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <header
        class="nds-stack nds-border-b-soft nds-pb-8"
        style="padding-bottom: 2rem"
      >
        <div
          class="nds-cluster nds-w-full"
          data-spacing="sm"
          data-align="center"
        >
          <Badge
            variant="secondary"
            class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
          >
            {{ t('category') }}
          </Badge>
          <Badge
            variant="outline"
            class="nds-text-muted-foreground nds-font-normal"
          >
            {{ t('type') }}
          </Badge>
          <div class="nds-spacer-start">
            <LanguageSwitcher />
          </div>
        </div>

        <h1 class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
          {{ t('title') }}
        </h1>

        <p
          class="nds-text-muted-foreground nds-leading-relaxed"
          style="max-width: 48rem"
        >
          {{ t('description') }}
        </p>

        <div
          class="nds-cluster"
          data-spacing="sm"
          data-align="center"
          style="padding-top: 0.25rem"
        >
          <span class="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default">
            <Package aria-hidden="true" />
            lucide-vue-next
          </span>
          <span
            class="nds-text-body nds-text-muted-foreground"
            style="opacity: 0.7"
          >
            {{ iconsAvailableText }}
          </span>
        </div>
      </header>

      <!-- ── Como usar ────────────────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
        <h2 class="nds-text-h2 nds-text-foreground">
          {{ t('howToUse.title') }}
        </h2>
        <div class="nds-grid" data-spacing="md" data-min="18rem">
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-body nds-font-medium">
              {{ t('howToUse.individual.title') }}
            </p>
            <pre class="nds-docs-code"><code>import { Search, Settings, User } from 'lucide-vue-next';

&lt;Search class="nds-icon" aria-hidden="true" /&gt;</code></pre>
          </div>
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-body nds-font-medium">
              {{ t('howToUse.sizes.title') }}
            </p>
            <pre class="nds-docs-code"><code>h-3 w-3   // 12px — badges, captions
h-4 w-4   // 16px — padrão em texto e botões
h-5 w-5   // 20px — destaque em headers
h-6 w-6   // 24px — standalone / ilustrativo</code></pre>
          </div>
        </div>
      </section>

      <!-- ── Acessibilidade ─────────────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <h2 class="nds-text-h2 nds-text-foreground">
          {{ t('accessibility.title') }}
        </h2>
        <div class="nds-grid" data-spacing="sm" data-min="18rem">
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-body nds-font-medium">
              {{ t('accessibility.decorative.title') }}
            </p>
            <pre class="nds-docs-code"><code>&lt;Button&gt;
  &lt;Save class="nds-icon" aria-hidden="true" /&gt;
  Salvar
&lt;/Button&gt;</code></pre>
          </div>
          <div class="nds-stack" data-spacing="sm">
            <p class="nds-text-body nds-font-medium">
              {{ t('accessibility.functional.title') }}
            </p>
            <pre class="nds-docs-code"><code>&lt;Button
  size="icon"
  aria-label="Excluir produto"
&gt;
  &lt;Trash2 class="nds-icon" aria-hidden="true" /&gt;
&lt;/Button&gt;</code></pre>
          </div>
        </div>
        <ul
          class="nds-stack nds-text-body nds-text-muted-foreground nds-list-none nds-p-0 nds-m-0"
          data-spacing="xs"
        >
          <li
            v-for="rule in ['rule1', 'rule2', 'rule3', 'rule4']"
            :key="rule"
            class="nds-cluster nds-list-none"
            data-spacing="sm"
            data-align="start"
          >
            <span class="nds-text-primary nds-shrink-0 nds-mt-0-5">✓</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="DOMPurify.sanitize(t(`accessibility.${rule}`))" />
          </li>
        </ul>
      </section>

      <!-- ── Busca ────────────────────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="sm">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h2 nds-text-foreground">
            {{ t('search.title') }}
          </h2>
          <p class="nds-text-body">
            {{ t('search.subtitle') }}
          </p>
        </div>
        <div class="nds-icon-search-wrap">
          <Search
            class="nds-icon-search-svg"
            aria-hidden="true"
          />
          <Input
            v-model="search"
            type="search"
            :placeholder="t('search.placeholder')"
            style="padding-inline-start: 2.25rem"
            :aria-label="t('search.placeholder')"
          />
        </div>
        <p
          class="nds-text-body"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ searchCountText }}
        </p>
      </section>

      <!-- ── Galeria ──────────────────────────────────────────────────────── -->
      <div
        v-if="filteredNames.length === 0"
        class="nds-icon-empty-state is-visible"
        role="status"
      >
        <Search
          class="nds-icon-empty-state-svg"
          aria-hidden="true"
        />
        <p class="nds-font-medium">
          {{ t('search.noResults') }}
        </p>
        <p class="nds-text-body" style="opacity: 0.7">
          {{ t('search.noResultsSub') }}
        </p>
      </div>

      <ul
        v-else
        class="nds-icon-grid"
        :aria-label="iconsAvailableText"
      >
        <li
          v-for="name in filteredNames"
          :key="name"
          class="nds-icon-grid-item"
        >
          <button
            type="button"
            :aria-label="`${t('copy.tooltip')} ${name}`"
            class="nds-icon-tile"
            @click="handleCopy(name)"
          >
            <span class="nds-icon-tile-svg" style="position: relative">
              <Check
                class="nds-icon-lg nds-text-primary"
                :style="{ position: 'absolute', opacity: copied === name ? 1 : 0, transition: 'opacity var(--duration-fast)' }"
                aria-hidden="true"
              />
              <component
                :is="(LucideIcons as Record<string, unknown>)[name]"
                class="nds-icon-lg"
                :style="{ opacity: copied === name ? 0 : 1, transition: 'opacity var(--duration-fast)' }"
                aria-hidden="true"
              />
            </span>
            <span class="nds-icon-tile-name">
              {{ name }}
            </span>
            <span
              class="nds-icon-tile-tooltip"
              :style="{ opacity: copied === name ? 1 : 0 }"
              aria-hidden="true"
            >
              {{ copied === name ? t('copy.copied') : t('copy.tooltip') }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
