<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import Swatch from '@/components/docs/shared/Swatch.vue';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import { useTranslation, useI18nStore } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import themeColorsTranslations from '@shared/content/theme-colors/translations.json';

// ─── Definições estáticas ──────────────────────────────────────────────────────

/** Grupos da paleta semântica e seus tokens (sem o prefixo `--`). */
const PALETTE_GROUPS: Array<{ key: string; tokens: string[] }> = [
  {
    key: 'surface',
    tokens: [
      'background', 'foreground', 'card', 'card-foreground', 'popover',
      'popover-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
    ],
  },
  {
    key: 'brand',
    tokens: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'],
  },
  {
    key: 'feedback',
    tokens: [
      'destructive', 'destructive-foreground', 'success', 'success-foreground',
      'warning', 'warning-foreground', 'info', 'info-foreground',
    ],
  },
  {
    key: 'structure',
    tokens: ['border', 'input', 'input-background', 'ring'],
  },
  {
    key: 'chart',
    tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
  },
];

/** Tokens exibidos como mini-swatches nos cards de tema/modo. */
const MINI_TOKENS = ['primary', 'secondary', 'accent', 'muted', 'destructive', 'success'];

const BRAND_THEMES: Array<{ key: string; className: string }> = [
  { key: 'default', className: 'tema-default' },
  { key: 'warm', className: 'tema-warm' },
  { key: 'cold', className: 'tema-cold' },
];

const MODES: Array<{ key: string; className: string }> = [
  { key: 'light', className: '' },
  { key: 'dark', className: 'dark' },
];

const DENSITY_ITEMS: Array<{ key: string; className: string }> = [
  { key: 'condensado', className: 'densidade-condensado' },
  { key: 'default', className: 'densidade-default' },
  { key: 'confortavel', className: 'densidade-confortavel' },
];

const FONT_ITEMS: Array<{ key: string; className: string }> = [
  { key: 'default', className: 'fonte-default' },
  { key: 'lexend', className: 'fonte-lexend' },
  { key: 'pt-serif', className: 'fonte-pt-serif' },
  { key: 'lxgw-wenkai', className: 'fonte-lxgw-wenkai' },
];

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t } = useTranslation(themeColorsTranslations);
const store = useI18nStore();

// Conteúdo da tabela de demonstração de densidade — reativo ao locale.
const densityData = computed(() => {
  return (themeColorsTranslations as Record<string, any>)[store.locale].axes.density as {
    tableCols: string[]; tableRows: string[][];
  };
});

// ─── SEO ──────────────────────────────────────────────────────────────────────

useSeoEffect(
  computed(() => ({
    title: `${t('title')} — ${t('category')}`,
    description: t('description'),
    locale: store.locale,
    componentSlug: 'theme-colors',
  }))
);

// ─── Analytics — page view ────────────────────────────────────────────────────

track('docs_page_view', {
  component_name: 'theme-colors',
  locale: store.locale,
  page_title: `${t('title')} · Design System`,
});

// ─── Valores HSL resolvidos no <html> ──────────────────────────────────────────

const tokenValues = ref<Record<string, string>>({});

// ─── Estado do <html> (tema × modo aplicados pela toolbar) ──────────────────────

const temaAtivo = ref<'tema-default' | 'tema-warm' | 'tema-cold'>('tema-default');
const paginaDark = ref(false);

let htmlObserver: MutationObserver | null = null;

function syncHtmlState() {
  const list = document.documentElement.classList;
  temaAtivo.value = list.contains('tema-warm')
    ? 'tema-warm'
    : list.contains('tema-cold')
      ? 'tema-cold'
      : 'tema-default';
  paginaDark.value = list.contains('dark');

  // Relê os valores HSL a cada mudança de classe do <html>.
  const styles = getComputedStyle(document.documentElement);
  const values: Record<string, string> = {};
  PALETTE_GROUPS.forEach((group) => {
    group.tokens.forEach((token) => {
      values[token] = styles.getPropertyValue(`--${token}`).trim();
    });
  });
  tokenValues.value = values;
}

onMounted(() => {
  syncHtmlState();
  htmlObserver = new MutationObserver(syncHtmlState);
  htmlObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
});

onUnmounted(() => {
  htmlObserver?.disconnect();
  htmlObserver = null;
});

</script>

<template>
  <div class="sb-unstyled flex-1 h-full overflow-auto ds-docs">
    <div class="p-8 max-w-6xl mx-auto space-y-8">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <header class="space-y-4 pb-8">
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
      </header>

      <!-- ── Paleta semântica ───────────────────────────────────────────────── -->
      <section class="space-y-6 border-t border-border/50 pt-8">
        <div class="space-y-1">
          <h2 class="text-xl font-semibold text-foreground">{{ t('palette.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('palette.subtitle') }}</p>
        </div>

        <div v-for="group in PALETTE_GROUPS" :key="group.key" class="space-y-3">
          <h3 class="text-sm font-medium text-foreground">{{ t(`palette.groups.${group.key}`) }}</h3>
          <ul
            class="grid gap-3 list-none p-0 m-0"
            style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))"
          >
            <li v-for="token in group.tokens" :key="token" class="list-none">
              <Swatch
                :token="token"
                orientation="horizontal"
                :value="tokenValues[token]"
                :copy-label="t('copy.tooltip')"
                :copied-label="t('copy.copied')"
              />
            </li>
          </ul>
        </div>
      </section>

      <!-- ── Temas de marca ─────────────────────────────────────────────────── -->
      <section class="space-y-6 border-t border-border/50 pt-8">
        <div class="space-y-1">
          <h2 class="text-xl font-semibold text-foreground">{{ t('brand.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('brand.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div
            v-for="theme in BRAND_THEMES"
            :key="theme.key"
            class="rounded-lg border border-border/50 overflow-hidden"
          >
            <div :class="[theme.className, paginaDark ? 'dark' : '', 'p-4 space-y-3 bg-background text-foreground']">
              <span class="block text-xs font-medium text-foreground">
                {{ t(`brand.themes.${theme.key}`) }}
              </span>
              <div class="flex flex-wrap gap-3">
                <Swatch v-for="token in MINI_TOKENS" :key="token" :token="token" orientation="vertical" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Light e Dark ───────────────────────────────────────────────────── -->
      <section class="space-y-6 border-t border-border/50 pt-8">
        <div class="space-y-1">
          <h2 class="text-xl font-semibold text-foreground">{{ t('modes.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('modes.subtitle') }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div
            v-for="mode in MODES"
            :key="mode.key"
            class="rounded-lg border border-border/50 overflow-hidden"
          >
            <div :class="[temaAtivo, mode.className, 'p-4 space-y-3 bg-background text-foreground']">
              <span class="block text-xs font-medium text-foreground">
                {{ t(`modes.${mode.key}`) }}
              </span>
              <div class="flex flex-wrap gap-3">
                <Swatch v-for="token in MINI_TOKENS" :key="token" :token="token" orientation="vertical" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Densidade e Fontes ─────────────────────────────────────────────── -->
      <section class="space-y-6 border-t border-border/50 pt-8">
        <div class="space-y-1">
          <h2 class="text-xl font-semibold text-foreground">{{ t('axes.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('axes.subtitle') }}</p>
        </div>

        <!-- Densidade -->
        <div class="space-y-3">
          <div class="space-y-1">
            <h3 class="text-sm font-medium text-foreground">{{ t('axes.density.title') }}</h3>
            <p class="text-sm text-muted-foreground">{{ t('axes.density.subtitle') }}</p>
          </div>
          <div
            class="grid gap-4"
            style="grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr))"
          >
            <div
              v-for="item in DENSITY_ITEMS"
              :key="item.key"
              class="space-y-2 rounded-lg border border-border/50 p-4"
            >
              <span class="block text-xs text-muted-foreground">
                {{ t(`axes.density.items.${item.key}`) }}
              </span>
              <div :class="item.className">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead v-for="(col, i) in densityData.tableCols" :key="i">{{ col }}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="(row, r) in densityData.tableRows" :key="r">
                      <TableCell v-for="(val, c) in row" :key="c">{{ val }}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <!-- Fontes -->
        <div class="space-y-3">
          <div class="space-y-1">
            <h3 class="text-sm font-medium text-foreground">{{ t('axes.fonts.title') }}</h3>
            <p class="text-sm text-muted-foreground">{{ t('axes.fonts.subtitle') }}</p>
          </div>
          <div
            class="grid gap-4"
            style="grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr))"
          >
            <div
              v-for="item in FONT_ITEMS"
              :key="item.key"
              class="space-y-2 rounded-lg border border-border/50 p-4"
            >
              <span class="block text-xs text-muted-foreground">
                {{ t(`axes.fonts.items.${item.key}`) }}
              </span>
              <div :class="item.className">
                <!-- font-family inline: o span precisa USAR var(--font-family-active)
                     para o escopo .fonte-* deste card valer (senão herda do <body>). -->
                <span class="text-2xl text-foreground" :style="{ fontFamily: 'var(--font-family-active)' }">
                  Aa Bb Cc 123
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
