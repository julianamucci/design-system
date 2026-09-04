<script setup lang="ts">
import { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Package, Search } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import { useTranslation, useI18nStore } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { mountDocsTracking } from '@/lib/docs-tracking';
import DOMPurify from 'dompurify';
import iconsTranslations from '@shared/content/icons/translations.json';
import { CATALOGO_LUCIDE, ICON_NAMES } from '@shared/primitives/lucide-catalog';

// ─── Catálogo de ícones ──────────────────────────────────────────────────────
//
// A geometria vem do catálogo compartilhado, não de `import * as` do
// `lucide-vue-next`: a galeria usa TODOS os ícones, então nada ali é removível
// e o bundle carregava 2003 componentes (1 424 KB) para desenhar 2003 SVGs
// (609 KB). A medição que embasa a troca está no docblock do catálogo.
//
// O `lucide-vue-next` continua sendo a lib documentada para quem CONSOME o
// design system — é dele que saem os dois ícones da própria página.

const ALL_ICON_NAMES = ICON_NAMES;
const CATALOGO = CATALOGO_LUCIDE;

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t, locale } = useTranslation(iconsTranslations);
const store = useI18nStore();

// ─── SEO ──────────────────────────────────────────────────────────────────────

useSeoEffect(
  computed(() => ({
    title: `${t('title')} — ${t('category')}`,
    description: t('description'),
    aiSummary: t('seo.aiSummary'),
    aiEntities: t('seo.aiEntities'),
    locale: store.locale,
    componentSlug: 'icons',
    kind: 'guide' as const,
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

// A grade nasce inteira e o filtro só liga `is-hidden` — é o que o Vanilla faz,
// e o Vanilla é a referência de markup. Recriar a lista faria cada tecla
// digitada destruir e remontar dois mil nós.
const visibleNames = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (!q) return null; // null = nenhum filtro ativo, todos visíveis
  return new Set(
    ALL_ICON_NAMES.filter((name) =>
      name.toLowerCase().replace(/[\s\-_]+/g, '').includes(q)
    )
  );
});

const visibleCount = computed(() =>
  visibleNames.value ? visibleNames.value.size : ALL_ICON_NAMES.length
);
const hasResults = computed(() => visibleCount.value > 0);

// ─── Texto interpolado ────────────────────────────────────────────────────────

const iconsAvailableText = computed(() =>
  t('iconsAvailable').replace('{count}', String(ALL_ICON_NAMES.length))
);

const searchCountText = computed(() => {
  const count = visibleCount.value;
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

// Observer de cliques (data-track*) — mesmo mecanismo do DocsPageLayout.
const trackingRoot = ref<HTMLElement | null>(null);
let trackingCleanup: (() => void) | null = null;
onMounted(() => {
  if (trackingRoot.value) {
    trackingCleanup = mountDocsTracking(trackingRoot.value, { componentSlug: 'icons' });
  }
});

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
  trackingCleanup?.();
  trackingCleanup = null;
});
</script>

<template>
  <div
    ref="trackingRoot"
    class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs"
  >
    <!-- Landmark de conteúdo (mesmo padrão do DocsPageLayout): esta página monta
         layout próprio, então o <main> é este wrapper — mesmas classes e mesma
         posição na árvore, sem mudança visual. -->
    <main
      class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
      data-spacing="xl"
      tabindex="-1"
      :aria-labelledby="DOCS_PAGE_TITLE_ID"
    >
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <header class="nds-stack nds-border-b-soft nds-pb-8">
        <div
          class="nds-cluster nds-w-full"
          data-spacing="sm"
          data-align="center"
        >
          <Badge
            variant="info"
            class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
          >
            {{ t('category') }}
          </Badge>
          <Badge
            variant="info"
            class="nds-text-muted-foreground nds-font-normal"
          >
            {{ t('type') }}
          </Badge>
          <div class="nds-spacer-start">
            <LanguageSwitcher />
          </div>
        </div>

        <!-- id estável: o <main> acima aponta para cá via aria-labelledby. -->
        <h1
          :id="DOCS_PAGE_TITLE_ID"
          class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground"
        >
          {{ t('title') }}
        </h1>

        <p class="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose">
          {{ t('description') }}
        </p>

        <div
          class="nds-cluster"
          data-spacing="sm"
          data-align="center"
        >
          <span class="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default">
            <Package aria-hidden="true" />
            lucide-vue-next
          </span>
          <!-- Sem opacity extra: --muted-foreground já é o tom secundário, e o
               0.7 derrubava o contraste para 3.03:1 (axe: color-contrast). -->
          <span class="nds-text-body nds-text-muted-foreground">
            {{ iconsAvailableText }}
          </span>
        </div>
      </header>

      <!-- ── Como usar ────────────────────────────────────────────────────── -->
      <section
        class="nds-stack nds-docs-section-divider"
        data-spacing="lg"
      >
        <h2 class="nds-text-h2 nds-text-foreground">
          {{ t('howToUse.title') }}
        </h2>
        <!-- data-cols="2" no lugar de `--grid-min: 18rem` inline: o atributo
             existe na folha e produz a mesma coluna mínima, sem style inline. -->
        <div
          class="nds-grid"
          data-spacing="md"
          data-cols="2"
        >
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <p class="nds-text-body nds-font-medium">
              {{ t('howToUse.individual.title') }}
            </p>
            <pre class="nds-docs-code"><code>import { Search, Settings, User } from 'lucide-vue-next';

&lt;Search class="nds-icon" aria-hidden="true" /&gt;</code></pre>
          </div>
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <p class="nds-text-body nds-font-medium">
              {{ t('howToUse.sizes.title') }}
            </p>
            <pre class="nds-docs-code"><code>nds-icon-sm   // 14px — badges, captions
nds-icon      // 16px — padrão em texto e botões
nds-icon-lg   // 20px — destaque em headers</code></pre>
          </div>
        </div>
      </section>

      <!-- ── Acessibilidade ─────────────────────────────────────────────────── -->
      <section
        class="nds-stack nds-docs-section-divider"
        data-spacing="md"
      >
        <h2 class="nds-text-h2 nds-text-foreground">
          {{ t('accessibility.title') }}
        </h2>
        <div
          class="nds-grid"
          data-spacing="sm"
          data-cols="2"
        >
          <div
            class="nds-stack"
            data-spacing="sm"
          >
            <p class="nds-text-body nds-font-medium">
              {{ t('accessibility.decorative.title') }}
            </p>
            <pre class="nds-docs-code"><code>&lt;Button&gt;
  &lt;Save class="nds-icon" aria-hidden="true" /&gt;
  Salvar
&lt;/Button&gt;</code></pre>
          </div>
          <div
            class="nds-stack"
            data-spacing="sm"
          >
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
            <span
              class="nds-text-primary nds-shrink-0 nds-mt-0-5"
              aria-hidden="true"
            >✓</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="DOMPurify.sanitize(t(`accessibility.${rule}`))" />
          </li>
        </ul>
      </section>

      <!-- ── Busca ────────────────────────────────────────────────────────── -->
      <section
        class="nds-stack nds-docs-section-divider"
        data-spacing="sm"
      >
        <div
          class="nds-stack"
          data-spacing="xs"
        >
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
          <!-- `nds-input` + modificador, o mesmo markup das outras stacks: o
               recuo do ícone é da folha, não de style inline. -->
          <input
            v-model="search"
            type="search"
            class="nds-input nds-icon-search-input"
            :placeholder="t('search.placeholder')"
            :aria-label="t('search.placeholder')"
          >
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
        class="nds-icon-empty-state"
        :class="{ 'is-visible': !hasResults }"
        role="status"
      >
        <Search
          class="nds-icon-empty-state-svg"
          aria-hidden="true"
        />
        <p class="nds-font-medium">
          {{ t('search.noResults') }}
        </p>
        <p class="nds-text-body nds-text-muted-foreground">
          {{ t('search.noResultsSub') }}
        </p>
      </div>

      <ul
        class="nds-icon-grid"
        :class="{ 'is-hidden': !hasResults }"
        :aria-label="iconsAvailableText"
      >
        <li
          v-for="name in ALL_ICON_NAMES"
          :key="name"
          class="nds-icon-grid-item"
          :class="{ 'is-hidden': visibleNames !== null && !visibleNames.has(name) }"
          :data-icon-name="name"
        >
          <button
            type="button"
            :aria-label="`${t('copy.tooltip')} ${name}`"
            class="nds-icon-tile"
            @click="handleCopy(name)"
          >
            <span class="nds-icon-tile-svg">
              <!-- Geometria do catálogo compartilhado, elemento a elemento — sem
                   v-html e sem um componente por ícone. As tags do lucide são um
                   conjunto fechado (path, circle, line, rect, polyline…). -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="nds-icon-lg"
                aria-hidden="true"
              >
                <component
                  :is="no[0]"
                  v-for="(no, i) in CATALOGO[name]"
                  :key="i"
                  v-bind="no[1]"
                />
              </svg>
            </span>
            <span class="nds-icon-tile-name">
              {{ name }}
            </span>
            <span
              class="nds-icon-tile-tooltip"
              :class="{ 'is-visible': copied === name }"
              aria-hidden="true"
            >
              {{ copied === name ? t('copy.copied') : t('copy.tooltip') }}
            </span>
          </button>
        </li>
      </ul>
    </main>
  </div>
</template>
