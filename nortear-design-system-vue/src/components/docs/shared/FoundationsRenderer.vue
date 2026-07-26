<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card';
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

// `specimens` é renderizado pela própria página via slot #extra (visual custom).
const RESERVED = new Set(['title', 'category', 'type', 'description', 'seo', 'nav', 'specimens']);

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

// Sub-grupo aninhado em extras (ex.: tokens.affected em Densidades,
// terms.approved em Tom de Voz, usage.ranges em Espaçamento). Antes,
// objetos em extras eram descartados silenciosamente.
interface SubGroup {
  title?: string;
  body?: string;
  cols?: Section['cols'];
  rows?: Section['rows'];
  list?: Array<{ key: string; value: string }>;
  cards?: Record<string, any>;
}

function subGroup(v: any): SubGroup | null {
  if (!isObject(v)) return null;
  const g: SubGroup = {};
  if (typeof v.title === 'string') g.title = v.title;
  const bodyKey = ['subtitle', 'body'].find((k) => typeof v[k] === 'string');
  if (bodyKey) g.body = v[bodyKey];
  if (v.cols && v.rows) {
    g.cols = v.cols;
    g.rows = v.rows;
  }
  const src = v.items ?? v.rules;
  if (src && isObject(src)) {
    if (Object.values(src).every((x) => typeof x === 'string')) {
      g.list = Object.entries(src).map(([key, value]) => ({ key, value: String(value) }));
    } else {
      g.cards = src;
    }
  }
  // Mapa puro (sem title/items/tabela): strings → lista; objetos → cards
  if (!g.title && !g.cols && !src) {
    const vals = Object.values(v);
    if (vals.length && vals.every((x) => typeof x === 'string')) {
      g.list = Object.entries(v).map(([key, value]) => ({ key, value: String(value) }));
    } else if (vals.length && vals.every((x) => isObject(x))) {
      g.cards = v;
    }
  }
  return g.title || g.body || g.cols || g.list || g.cards ? g : null;
}

// Itens que são objetos viram cards (title + body) → grid fixo de 2 colunas.
function itemsAreCards(items: Section['items']): boolean {
  return !!items && Object.values(items).some((v) => v !== null && typeof v === 'object');
}

// Chaves candidatas a título e a corpo de um card (na ordem de preferência).
const TITLE_KEYS = ['title', 'name', 'label'];
const BODY_KEYS = ['body', 'description', 'usage', 'use', 'text'];

function isCardObject(v: any): boolean {
  return v !== null && typeof v === 'object';
}
function itemTitle(v: any): string {
  if (!isCardObject(v)) return '';
  const k = TITLE_KEYS.find((x) => typeof v[x] === 'string');
  return k ? v[k] : '';
}
function itemBody(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v !== 'object') return String(v);
  const k = BODY_KEYS.find((x) => typeof v[x] === 'string');
  return k ? v[k] : '';
}
function itemExtras(v: any): Array<{ key: string; value: string }> {
  if (!isCardObject(v)) return [];
  const tk = TITLE_KEYS.find((x) => typeof v[x] === 'string');
  const bk = BODY_KEYS.find((x) => typeof v[x] === 'string');
  return Object.entries(v)
    .filter(([k, val]) => typeof val === 'string' && k !== tk && k !== bk)
    .map(([k, val]) => ({ key: k, value: val as string }));
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
  <div class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
    <div
      class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
      data-spacing="xl"
    >
      <!-- Header -->
      <header class="nds-stack nds-pb-8">
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

        <h1 class="nds-text-h1 nds-text-foreground">
          {{ t('title') }}
        </h1>

        <p
          class="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose"
          v-html="t('description')"
        />
      </header>

      <!-- Specimens/visual extra da página (opcional) -->
      <slot name="extra" />

      <!-- Sections -->
      <section
        v-for="sec in sections"
        :key="sec.key"
        class="nds-stack nds-docs-section-divider"
        data-spacing="md"
      >
        <div
          v-if="sec.title || sec.subtitle"
          class="nds-stack"
          data-spacing="xs"
        >
          <h2
            v-if="sec.title"
            class="nds-text-h2 nds-text-foreground"
            v-html="sec.title"
          />
          <p
            v-if="sec.subtitle"
            class="nds-text-body"
            v-html="sec.subtitle"
          />
        </div>

        <p
          v-if="sec.body"
          class="nds-text-body nds-leading-relaxed nds-max-w-prose"
          v-html="sec.body"
        />
        <p
          v-if="sec.audience"
          class="nds-text-body nds-leading-relaxed nds-max-w-prose"
          v-html="sec.audience"
        />

        <!-- Table (cols + rows) — o componente Table já provê .nds-table-wrapper -->
        <Table v-if="sec.cols && sec.rows">
          <TableHeader>
            <TableRow>
              <TableHead
                v-for="(c, i) in colsArray(sec.cols)"
                :key="i"
              >
                {{ c }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(row, r) in rowsArray(sec.rows, sec.cols)"
              :key="r"
            >
              <TableCell
                v-for="(cell, ci) in row"
                :key="ci"
              >
                <span v-html="cell" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Items — objeto → grid fixo de 2 colunas de Card; string → lista simples -->
        <template v-if="sec.items">
          <div
            v-if="itemsAreCards(sec.items)"
            class="nds-grid"
            data-cols="2"
            data-fixed="true"
            data-spacing="md"
          >
            <Card
              v-for="item in itemEntries(sec.items)"
              :key="item.key"
            >
              <CardHeader>
                <CardTitle
                  v-if="itemTitle(item.value)"
                  as="h3"
                >
                  <span v-html="itemTitle(item.value)" />
                </CardTitle>
                <CardDescription v-if="itemBody(item.value)">
                  <span v-html="itemBody(item.value)" />
                </CardDescription>
              </CardHeader>
              <CardContent
                v-if="itemExtras(item.value).length"
                class="nds-stack"
                data-spacing="xs"
              >
                <p
                  v-for="ex in itemExtras(item.value)"
                  :key="ex.key"
                  class="nds-text-caption nds-text-muted-foreground nds-m-0"
                  v-html="ex.value"
                />
              </CardContent>
            </Card>
          </div>
          <ul
            v-else
            class="nds-stack nds-list-none"
            data-spacing="md"
          >
            <li
              v-for="item in itemEntries(sec.items)"
              :key="item.key"
              class="nds-text-body nds-leading-relaxed nds-accent-start"
              v-html="itemBody(item.value)"
            />
          </ul>
        </template>

        <!-- Rules — lista de acento, igual às demais stacks -->
        <ul
          v-if="sec.rules"
          class="nds-stack nds-list-none"
          data-spacing="md"
        >
          <li
            v-for="rule in rulesEntries(sec.rules)"
            :key="rule.key"
            class="nds-text-body nds-leading-relaxed nds-accent-start"
            v-html="rule.value"
          />
        </ul>

        <!-- Extras (strings ou objetos não tratados) -->
        <div
          v-for="ex in sec.extras"
          :key="ex.key"
          class="nds-stack"
          data-spacing="xs"
        >
          <template v-if="typeof ex.value === 'string'">
            <!-- `*Title` → h3, `*Code` → bloco de código, resto → parágrafo -->
            <h3
              v-if="ex.key.endsWith('Title')"
              class="nds-text-h3 nds-text-foreground"
              v-html="ex.value"
            />
            <div
              v-else-if="ex.key.endsWith('Code')"
              class="nds-docs-code"
            >
              <span
                class="nds-whitespace-pre"
                v-html="ex.value"
              />
            </div>
            <p
              v-else
              class="nds-text-body nds-leading-relaxed"
              v-html="ex.value"
            />
          </template>
          <template v-else-if="Array.isArray(ex.value)">
            <ul
              class="nds-stack nds-list-disc nds-text-body"
              data-spacing="xs"
            >
              <li
                v-for="(v, i) in ex.value"
                :key="i"
                v-html="String(v)"
              />
            </ul>
          </template>
          <template v-else-if="subGroup(ex.value)">
            <!-- Sub-grupo aninhado: h3 + tabela/lista/cards -->
            <div
              class="nds-stack"
              data-spacing="sm"
            >
              <h3
                v-if="subGroup(ex.value)!.title"
                class="nds-text-h3 nds-text-foreground"
                v-html="subGroup(ex.value)!.title"
              />
              <p
                v-if="subGroup(ex.value)!.body"
                class="nds-text-body nds-leading-relaxed"
                v-html="subGroup(ex.value)!.body"
              />
              <Table v-if="subGroup(ex.value)!.cols">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      v-for="(c, i) in colsArray(subGroup(ex.value)!.cols)"
                      :key="i"
                    >
                      {{ c }}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(row, r) in rowsArray(subGroup(ex.value)!.rows, subGroup(ex.value)!.cols)"
                    :key="r"
                  >
                    <TableCell
                      v-for="(cell, ci) in row"
                      :key="ci"
                    >
                      <span v-html="cell" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <ul
                v-if="subGroup(ex.value)!.list"
                class="nds-stack nds-list-none"
                data-spacing="md"
              >
                <li
                  v-for="it in subGroup(ex.value)!.list"
                  :key="it.key"
                  class="nds-text-body nds-leading-relaxed nds-accent-start"
                  v-html="it.value"
                />
              </ul>
              <div
                v-if="subGroup(ex.value)!.cards"
                class="nds-grid"
                data-cols="2"
                data-fixed="true"
                data-spacing="md"
              >
                <Card
                  v-for="item in itemEntries(subGroup(ex.value)!.cards)"
                  :key="item.key"
                >
                  <CardHeader>
                    <CardTitle
                      v-if="itemTitle(item.value)"
                      as="h4"
                    >
                      <span v-html="itemTitle(item.value)" />
                    </CardTitle>
                    <CardDescription v-if="itemBody(item.value)">
                      <span v-html="itemBody(item.value)" />
                    </CardDescription>
                  </CardHeader>
                  <CardContent
                    v-if="itemExtras(item.value).length"
                    class="nds-stack"
                    data-spacing="xs"
                  >
                    <p
                      v-for="ext in itemExtras(item.value)"
                      :key="ext.key"
                      class="nds-text-caption nds-text-muted-foreground nds-m-0"
                      v-html="ext.value"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
