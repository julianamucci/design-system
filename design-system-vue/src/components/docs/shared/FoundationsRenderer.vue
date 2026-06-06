<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';

const props = defineProps<{
  /** Slug do componente em translations (ex. "foundations/tipografia"). */
  componentSlug: string;
  /** Objeto translations.json importado. */
  translations: Record<string, any>;
}>();

// IMPORTANTE (Vue): NUNCA usar Pinia/useLocaleStore p/ locale em docs page.
// Sempre `useTranslation()` — historic crash documentado em MEMORY.md.
const { t, locale } = useTranslation(props.translations);

const data = computed<Record<string, any>>(
  () => (props.translations[locale.value] ?? props.translations['pt-BR'] ?? {}) as Record<string, any>,
);

const RESERVED = new Set(['title', 'category', 'type', 'description', 'seo', 'nav']);

interface Section {
  key: string;
  title?: string;
  subtitle?: string;
  body?: string;
  audience?: string;
  cols?: Record<string, string> | string[];
  rows?: Record<string, Record<string, string>> | string[][];
  items?: Record<string, any>;
  rules?: Record<string, string> | string[];
  extras: Array<{ key: string; value: any }>;
}

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

const sections = computed<Section[]>(() => {
  const out: Section[] = [];
  for (const key of Object.keys(data.value)) {
    if (RESERVED.has(key)) continue;
    const v = data.value[key];
    if (!isObject(v)) {
      out.push({ key, body: String(v), extras: [] });
      continue;
    }
    const sec: Section = { key, extras: [] };
    for (const sk of Object.keys(v)) {
      switch (sk) {
        case 'title': sec.title = v[sk]; break;
        case 'subtitle': sec.subtitle = v[sk]; break;
        case 'body': sec.body = v[sk]; break;
        case 'audience': sec.audience = v[sk]; break;
        case 'cols': sec.cols = v[sk]; break;
        case 'rows': sec.rows = v[sk]; break;
        case 'items': sec.items = v[sk]; break;
        case 'rules': sec.rules = v[sk]; break;
        default: sec.extras.push({ key: sk, value: v[sk] });
      }
    }
    out.push(sec);
  }
  return out;
});

function colsArray(cols: Section['cols']): string[] {
  if (!cols) return [];
  if (Array.isArray(cols)) return cols;
  return Object.values(cols);
}

function rowsArray(rows: Section['rows'], cols: Section['cols']): string[][] {
  if (!rows) return [];
  if (Array.isArray(rows)) return rows;
  const colKeys = cols && !Array.isArray(cols) ? Object.keys(cols) : null;
  return Object.values(rows).map((row) => {
    if (Array.isArray(row)) return row;
    const keys = colKeys ?? Object.keys(row);
    return keys.map((k) => String(row[k] ?? ''));
  });
}

function itemEntries(items: Section['items']): Array<{ key: string; value: any }> {
  if (!items) return [];
  return Object.keys(items).map((k) => ({ key: k, value: items[k] }));
}

function rulesEntries(rules: Section['rules']): Array<{ key: string; value: string }> {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules.map((v, i) => ({ key: String(i), value: String(v) }));
  return Object.keys(rules).map((k) => ({ key: k, value: String(rules[k]) }));
}

// SEO
useSeoEffect(
  computed(() => ({
    title: t('title'),
    description: t('description'),
    locale: locale.value,
    componentSlug: props.componentSlug,
    aiSummary: t('seo.aiSummary', ''),
    aiEntities: t('seo.aiEntities', ''),
    aiIntent: t('seo.aiIntent', 'informational'),
  })),
);

// Analytics
track('docs_page_view', {
  component_name: props.componentSlug,
  locale: locale.value,
  page_title: `${t('title')} · Design System`,
});
</script>

<template>
  <div class="sb-unstyled flex-1 h-full overflow-auto ds-docs">
    <div class="p-8 max-w-6xl mx-auto space-y-8">
      <!-- Header -->
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

      <!-- Sections -->
      <section
        v-for="sec in sections"
        :key="sec.key"
        class="space-y-4 border-t border-border/50 pt-8"
      >
        <div v-if="sec.title || sec.subtitle" class="space-y-1">
          <h2 v-if="sec.title" class="text-xl font-semibold text-foreground">
            {{ sec.title }}
          </h2>
          <p v-if="sec.subtitle" class="text-sm text-muted-foreground">
            {{ sec.subtitle }}
          </p>
        </div>

        <p
          v-if="sec.body"
          class="text-sm text-foreground leading-relaxed max-w-3xl"
          v-html="sec.body"
        />
        <p
          v-if="sec.audience"
          class="text-sm text-muted-foreground leading-relaxed max-w-3xl"
        >
          {{ sec.audience }}
        </p>

        <!-- Table (cols + rows) -->
        <div v-if="sec.cols && sec.rows" class="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead v-for="(c, i) in colsArray(sec.cols)" :key="i">{{ c }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(row, r) in rowsArray(sec.rows, sec.cols)" :key="r">
                <TableCell v-for="(cell, ci) in row" :key="ci">
                  <span v-html="cell" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Items (object map) -->
        <div
          v-if="sec.items"
          class="grid gap-3"
          style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))"
        >
          <div
            v-for="item in itemEntries(sec.items)"
            :key="item.key"
            class="rounded-lg border border-border/50 p-4 space-y-1"
          >
            <template v-if="typeof item.value === 'string'">
              <span class="text-xs uppercase tracking-wide text-muted-foreground">
                {{ item.key }}
              </span>
              <p class="text-sm text-foreground" v-html="item.value" />
            </template>
            <template v-else>
              <h3 class="text-sm font-semibold text-foreground">
                {{ item.value.title ?? item.key }}
              </h3>
              <p
                v-if="item.value.subtitle || item.value.description || item.value.body"
                class="text-sm text-muted-foreground"
                v-html="item.value.subtitle ?? item.value.description ?? item.value.body"
              />
              <dl
                v-if="Object.keys(item.value).some(k => !['title','subtitle','description','body'].includes(k))"
                class="space-y-1 pt-1"
              >
                <template
                  v-for="(val, k) in item.value"
                  :key="k"
                >
                  <div
                    v-if="!['title','subtitle','description','body'].includes(String(k)) && typeof val === 'string'"
                    class="flex gap-2 text-xs"
                  >
                    <dt class="text-muted-foreground capitalize">{{ k }}:</dt>
                    <dd class="text-foreground" v-html="val" />
                  </div>
                </template>
              </dl>
            </template>
          </div>
        </div>

        <!-- Rules -->
        <ul
          v-if="sec.rules"
          class="space-y-2 list-disc pl-5 text-sm text-foreground"
        >
          <li v-for="rule in rulesEntries(sec.rules)" :key="rule.key" v-html="rule.value" />
        </ul>

        <!-- Extras (strings ou objetos não tratados) -->
        <div v-for="ex in sec.extras" :key="ex.key" class="space-y-2">
          <template v-if="typeof ex.value === 'string'">
            <p class="text-sm text-foreground" v-html="ex.value" />
          </template>
          <template v-else-if="Array.isArray(ex.value)">
            <ul class="space-y-1 list-disc pl-5 text-sm text-foreground">
              <li v-for="(v, i) in ex.value" :key="i" v-html="String(v)" />
            </ul>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
