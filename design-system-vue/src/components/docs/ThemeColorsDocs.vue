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
  <div class="sb-unstyled nds-flex-1 nds-w-full ds-docs" style="height: 100%; overflow: auto">
    <div class="nds-p-8 nds-stack" data-spacing="xl" style="max-width: 72rem; margin-inline: auto">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <header class="nds-stack nds-pb-8" style="padding-bottom: 2rem">
        <div class="nds-cluster" data-justify="between">
          <div class="nds-cluster" data-spacing="sm" data-align="center">
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
          </div>
          <LanguageSwitcher />
        </div>

        <h1 class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
          {{ t('title') }}
        </h1>

        <p class="nds-text-muted-foreground nds-leading-relaxed" style="max-width: 48rem">
          {{ t('description') }}
        </p>
      </header>

      <!-- ── Paleta semântica ───────────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h3 nds-font-semibold nds-text-foreground">
            {{ t('palette.title') }}
          </h2>
          <p class="nds-text-body nds-text-muted-foreground">
            {{ t('palette.subtitle') }}
          </p>
        </div>

        <div
          v-for="group in PALETTE_GROUPS"
          :key="group.key"
          class="nds-swatch-group"
        >
          <h3 class="nds-swatch-group-title">
            {{ t(`palette.groups.${group.key}`) }}
          </h3>
          <ul class="nds-swatch-grid">
            <li
              v-for="token in group.tokens"
              :key="token"
              class="nds-swatch-grid-item"
            >
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
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h3 nds-font-semibold nds-text-foreground">
            {{ t('brand.title') }}
          </h2>
          <p class="nds-text-body nds-text-muted-foreground">
            {{ t('brand.subtitle') }}
          </p>
        </div>
        <div class="nds-theme-card-grid">
          <div
            v-for="theme in BRAND_THEMES"
            :key="theme.key"
            class="nds-theme-card"
          >
            <div :class="['nds-theme-card-scope', theme.className, paginaDark ? 'dark' : '']">
              <span class="nds-theme-card-label">
                {{ t(`brand.themes.${theme.key}`) }}
              </span>
              <div class="nds-miniswatch-row">
                <Swatch
                  v-for="token in MINI_TOKENS"
                  :key="token"
                  :token="token"
                  orientation="vertical"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Light e Dark ───────────────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h3 nds-font-semibold nds-text-foreground">
            {{ t('modes.title') }}
          </h2>
          <p class="nds-text-body nds-text-muted-foreground">
            {{ t('modes.subtitle') }}
          </p>
        </div>
        <div class="nds-theme-card-grid">
          <div
            v-for="mode in MODES"
            :key="mode.key"
            class="nds-theme-card"
          >
            <div :class="['nds-theme-card-scope', temaAtivo, mode.className]">
              <span class="nds-theme-card-label">
                {{ t(`modes.${mode.key}`) }}
              </span>
              <div class="nds-miniswatch-row">
                <Swatch
                  v-for="token in MINI_TOKENS"
                  :key="token"
                  :token="token"
                  orientation="vertical"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Densidade e Fontes ─────────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h3 nds-font-semibold nds-text-foreground">
            {{ t('axes.title') }}
          </h2>
          <p class="nds-text-body nds-text-muted-foreground">
            {{ t('axes.subtitle') }}
          </p>
        </div>

        <!-- Densidade -->
        <div class="nds-stack" data-spacing="md">
          <div class="nds-stack" data-spacing="xs">
            <h3 class="nds-text-body nds-font-medium nds-text-foreground">
              {{ t('axes.density.title') }}
            </h3>
            <p class="nds-text-body nds-text-muted-foreground">
              {{ t('axes.density.subtitle') }}
            </p>
          </div>
          <div class="nds-axis-grid">
            <div
              v-for="item in DENSITY_ITEMS"
              :key="item.key"
              class="nds-axis-sample"
            >
              <span class="nds-axis-sample-label">
                {{ t(`axes.density.items.${item.key}`) }}
              </span>
              <div :class="['nds-axis-scope', item.className]">
                <Table class="nds-axis-density-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        v-for="(col, i) in densityData.tableCols"
                        :key="i"
                      >
                        {{ col }}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="(row, r) in densityData.tableRows"
                      :key="r"
                    >
                      <TableCell
                        v-for="(val, c) in row"
                        :key="c"
                      >
                        {{ val }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <!-- Fontes -->
        <div class="nds-stack" data-spacing="md">
          <div class="nds-stack" data-spacing="xs">
            <h3 class="nds-text-body nds-font-medium nds-text-foreground">
              {{ t('axes.fonts.title') }}
            </h3>
            <p class="nds-text-body nds-text-muted-foreground">
              {{ t('axes.fonts.subtitle') }}
            </p>
          </div>
          <div class="nds-axis-grid" data-cols="4">
            <div
              v-for="item in FONT_ITEMS"
              :key="item.key"
              class="nds-axis-sample"
            >
              <span class="nds-axis-sample-label">
                {{ t(`axes.fonts.items.${item.key}`) }}
              </span>
              <div :class="item.className">
                <span class="nds-font-sample">Aa Bb Cc 123</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
