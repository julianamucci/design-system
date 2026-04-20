# Storybook Design System — Vue 3 Architecture Reference

> **Purpose:** AI agent reference for replicating the design system Storybook architecture in Vue 3. Read `STORYBOOK-ARCHITECTURE.md` (React version) first to understand the concepts; this document only describes what changes and what stays the same.

---

## 1. Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Vue | 3 |
| Build tool | Vite | 8 |
| Storybook | `@storybook/vue3-vite` | 10 |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` | 4 |
| State (i18n) | Pinia | 3 |
| Testing | Vitest + `@storybook/addon-vitest` + Playwright | 4 / 10 / 1.59 |
| A11y | `@storybook/addon-a11y` + `axe-playwright` | 10 / 2 |
| Visual regression | Chromatic | via `@chromatic-com/storybook` |
| TypeScript | 6 | strict |

**What does NOT change from React:** CSS theme architecture (Sections 4, 15), `preview-head.html` script, `test-runner.ts`, translations JSON format, `analytics.ts`, `sanitize-html.ts`, `theme-config.ts`, `chromatic.config.json`, Foundations MDX pattern.

---

## 2. Directory Structure

```
design-system-vue/
├── .storybook/
│   ├── main.ts
│   ├── preview.ts
│   ├── preview-head.html          # Identical to React version
│   ├── manager-head.html
│   └── test-runner.ts             # Identical to React version
│
├── src/
│   ├── components/
│   │   ├── ui/                    # Primitive Vue SFCs
│   │   │   ├── Button.vue
│   │   │   ├── button.stories.ts          # .ts (not .tsx)
│   │   │   ├── button-variantes.stories.ts
│   │   │   ├── button-tamanhos.stories.ts
│   │   │   ├── button-estados.stories.ts
│   │   │   └── button-composicoes.stories.ts
│   │   │
│   │   ├── docs/
│   │   │   ├── ButtonDocs.vue             # Full docs page as Vue SFC
│   │   │   ├── content/button/translations.json
│   │   │   ├── shared/
│   │   │   │   ├── DocsHeader.vue
│   │   │   │   ├── DocsSection.vue
│   │   │   │   ├── DoDont.vue
│   │   │   │   ├── DocsNav.vue
│   │   │   │   └── UXWritingTable.vue
│   │   │   ├── ThemingDocs.vue
│   │   │   ├── ThemingDocs.mdx
│   │   │   └── ThemingDocs.stories.ts    # Stub
│   │   │
│   │   └── product/
│   │       └── LanguageSwitcher.vue
│   │
│   ├── lib/
│   │   ├── i18n.ts                # Pinia store + useTranslation composable
│   │   ├── analytics.ts           # Identical to React version
│   │   ├── use-seo.ts             # Vue composable (watchEffect instead of useEffect)
│   │   ├── sanitize-html.ts       # Identical to React version
│   │   ├── theme-config.ts        # Identical to React version
│   │   ├── withAutoDocsTab.ts     # Returns a Vue component (not a React component)
│   │   └── utils.ts               # cn() — identical
│   │
│   ├── i18n/ui.json               # Identical to React version
│   └── styles/                    # Identical to React version
│       ├── globals.css
│       ├── storybook-docs.css
│       └── themes/
```

---

## 3. Storybook Configuration

### 3.1 `main.ts`

```ts
import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|ts)',   // no jsx/tsx needed
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-themes',
  ],
  framework: '@storybook/vue3-vite',  // ← only change from React
};

export default config;
```

### 3.2 `preview.ts`

The `storySort`, `a11y`, `docs`, and `globalTypes` blocks are **identical** to the React version.

The decorators differ because Vue decorators return component option objects, not JSX:

```ts
import type { Preview } from '@storybook/vue3';
import { withThemeByClassName } from '@storybook/addon-themes';
import { watch, defineComponent, h } from 'vue';
import '../src/styles/globals.css';
import '../src/styles/storybook-docs.css';

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Foundations',
          'UI', ['*', ['Docs', 'Playground', 'Variantes', 'Tamanhos', 'Composições', 'Estados', '*']],
          '*',
        ],
      },
    },
    a11y: { test: 'error' },
    docs: {
      codePanel: true,
      canvas: { sourceState: 'shown' },
      source: { type: 'dynamic', excludeDecorators: true },
    },
  },

  globalTypes: {
    brand: {
      description: 'Tema de Marca (Multi-tenancy)',
      defaultValue: 'default',
      toolbar: {
        title: 'Marca',
        icon: 'paintbrush',
        items: [
          { value: 'default',   title: 'Nortear (Padrão)'    },
          { value: 'tema-um',   title: 'Crystal (Indigo)'    },
          { value: 'tema-dois', title: 'Industrial (Amber)'  },
        ],
        showName: true,
      },
    },
  },

  decorators: [
    // Decorator 1: manages .dark class — identical API in Vue
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),

    // Decorator 2: manages brand class on <html>
    (Story, context) => ({
      components: { Story },
      setup() {
        const applyBrand = () => {
          const brand = context.globals.brand || 'default';
          const html = document.documentElement;
          html.classList.remove('tema-um', 'tema-dois');
          if (brand !== 'default') html.classList.add(brand);
        };

        applyBrand();

        // Watch for toolbar changes
        watch(() => context.globals.brand, applyBrand);

        return {};
      },
      template: '<Story />',
    }),
  ],
};

export default preview;
```

**Key difference:** Vue decorators return `{ components, setup, template }` option objects. The `watch()` call replaces the React `useEffect` with `[brand]` dependency.

---

## 4. Theme System

**Identical to the React version.** See Section 4 of `STORYBOOK-ARCHITECTURE.md`.

The `preview-head.html` script is exactly the same — it reads `?globals=` and applies classes to `<html>`, which is framework-agnostic.

---

## 5. Component Story Pattern

### 5.1 Main Story File (`button.stories.ts`)

```ts
import type { Meta, StoryObj } from '@storybook/vue3';
import { fn } from 'storybook/test';
import { userEvent, within, expect } from 'storybook/test';
import Button from './Button.vue';
import ButtonDocs from '@/components/docs/ButtonDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ButtonDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  args: {
    default: 'Button',   // Vue: named slot via args.default for the default slot
    variant: 'default',
    size: 'default',
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    // play API is identical to React version
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await step('clicks the button', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};
```

**Vue-specific:** Named slot content (`default: 'Button'`) is passed through `args` using the slot name as the key. For components with no slots, omit this.

### 5.2 Sub-story Files

```ts
// button-variantes.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import Button from './Button.vue';

const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { variant: 'default', default: 'Botão' } };
export const Secondary: Story = { args: { variant: 'secondary', default: 'Botão' } };
```

---

## 6. Component Documentation Pages

### 6.1 `ButtonDocs.vue` Structure

```vue
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useTranslation } from '@/lib/i18n';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import DocsHeader from '@/components/docs/shared/DocsHeader.vue';
import DocsSection from '@/components/docs/shared/DocsSection.vue';
import uiTranslations from '@/i18n/ui.json';
import buttonTranslations from './content/button/translations.json';

const { t, locale } = useTranslation({ ...uiTranslations, ...buttonTranslations });

// SEO — reactive to locale changes
useSeoEffect(computed(() => ({
  title: t('title'),
  description: t('description'),
  locale: locale.value,
  componentSlug: 'button',
})));

// Analytics: page view on mount and on locale change
watch(locale, (newLocale) => {
  track('docs_page_view', { component_name: 'button', locale: newLocale, page_title: t('title') });
}, { immediate: true });

// Active section tracking
const activeSection = ref('');
const handleSectionChange = (id: string) => {
  activeSection.value = id;
  track('docs_section_viewed', { section_id: id, component_name: 'button', locale: locale.value });
};

const navGroups = computed(() => [
  { label: t('nav.overview'), sections: [
    { id: 'demonstracao', label: t('nav.demonstration') },
    { id: 'anatomia',     label: t('nav.anatomy')       },
    { id: 'quando-usar',  label: t('nav.usage')          },
  ]},
  { label: t('nav.techRef'), sections: [
    { id: 'importacao',   label: t('nav.import')   },
    { id: 'variantes',    label: t('nav.variants') },
    { id: 'estados',      label: t('nav.states')   },
    { id: 'propriedades', label: t('nav.props')    },
  ]},
  { label: t('nav.context'), sections: [
    { id: 'acessibilidade', label: t('nav.accessibility') },
  ]},
  { label: t('nav.quality'), sections: [
    { id: 'analytics', label: t('nav.analytics') },
    { id: 'testes',    label: t('nav.testes')    },
  ]},
]);

// IntersectionObserver for active section
onMounted(() => {
  const allIds = navGroups.value.flatMap(g => g.sections.map(s => s.id));
  const observers = allIds.map(id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handleSectionChange(id); },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    observer.observe(el);
    return observer;
  });
  onUnmounted(() => observers.forEach(obs => obs?.disconnect()));
});
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside class="w-64 sticky top-0 h-screen overflow-y-auto p-4 border-r border-border">
      <nav>
        <div v-for="group in navGroups" :key="group.label" class="mb-6">
          <p class="text-xs font-semibold text-muted-foreground uppercase mb-2">{{ group.label }}</p>
          <ul class="space-y-1">
            <li v-for="section in group.sections" :key="section.id">
              <a
                :href="`#${section.id}`"
                :class="['block px-2 py-1 text-sm rounded', activeSection === section.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground']"
              >{{ section.label }}</a>
            </li>
          </ul>
        </div>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="flex-1 max-w-4xl px-8 py-12 space-y-16">
      <div class="flex items-start justify-between">
        <DocsHeader
          category="Form"
          complexity="Simples"
          :title="t('title')"
          :description="t('description')"
          shadcn-command="npx shadcn@latest add button"
        />
        <LanguageSwitcher />
      </div>

      <DocsSection id="demonstracao" :title="t('demonstration.title')">
        <!-- demo slot content -->
      </DocsSection>

      <DocsSection id="anatomia" :title="t('anatomy.title')">
        <!-- v-html replaces dangerouslySetInnerHTML — still requires sanitizeHtml() -->
        <p v-html="sanitizeHtml(t('anatomy.item1'))" />
        <p v-html="sanitizeHtml(t('anatomy.item2'))" />
      </DocsSection>

      <!-- ... all other sections ... -->
    </main>
  </div>
</template>
```

**Key Vue differences:**
- `dangerouslySetInnerHTML={{ __html: x }}` → `v-html="sanitizeHtml(x)"` — **still requires `sanitizeHtml()`**.
- `useEffect` → `onMounted` / `onUnmounted` / `watch`.
- `useMemo` → `computed()`.
- `useCallback` → plain function in `setup()` scope (stable identity by default).

### 6.2 Shared Docs Components (`shared/*.vue`)

Same purpose as the React versions. Key implementation differences:

| React prop | Vue equivalent |
|---|---|
| `children` | `<slot />` |
| `className` | `:class` binding |
| `dangerouslySetInnerHTML` | `v-html` |
| `onClick` prop | `@click` |

Example `DocsSection.vue`:

```vue
<script setup lang="ts">
defineProps<{
  id?: string;
  title: string;
  description?: string;
  noSeparator?: boolean;
}>();
</script>

<template>
  <section :id="id" class="space-y-4 scroll-mt-24">
    <hr v-if="!noSeparator" class="border-border my-12" />
    <div class="space-y-1">
      <h2 class="text-2xl font-semibold tracking-tight">{{ title }}</h2>
      <p v-if="description" class="text-muted-foreground">{{ description }}</p>
    </div>
    <div><slot /></div>
  </section>
</template>
```

---

## 7. `withAutoDocsTab` — Vue Implementation

Location: `src/lib/withAutoDocsTab.ts`

In Vue, `docs.page` accepts a Vue component (not a render function returning JSX). The HOC returns a Vue component definition that wraps the custom docs with a tab bar.

```ts
import { defineComponent, ref, h, type Component } from 'vue';
import {
  Title, Description, Primary, Controls, ArgTypes, Stories
} from '@storybook/addon-docs/blocks';

function ApiReferencePage() {
  return h('div', { style: 'padding: 2rem; max-width: 75rem; margin: 0 auto;' }, [
    h(Title as Component),
    h(Description as Component),
    h(Primary as Component),
    h(Controls as Component),
    h(ArgTypes as Component),
    h(Stories as Component, { includePrimary: false }),
  ]);
}

export function withAutoDocsTab(CustomDocs: Component) {
  return defineComponent({
    name: 'DocsPageWithApiTab',
    setup() {
      const activeTab = ref<'docs' | 'api'>('docs');
      return { activeTab };
    },
    render() {
      const tabBarStyle = {
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'flex-end',
        borderBottom: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        paddingLeft: '0.75rem',
      };

      const tabStyle = (active: boolean) => ({
        padding: '0.625rem 1.25rem',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 400,
        color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
        background: 'none',
        border: 'none',
        borderBottom: `2px solid ${active ? 'hsl(var(--primary))' : 'transparent'}`,
        cursor: 'pointer',
      });

      return h('div', [
        h('div', { style: tabBarStyle }, [
          h('button', {
            style: tabStyle(this.activeTab === 'docs'),
            onClick: () => { this.activeTab = 'docs'; },
          }, 'Documentação'),
          h('button', {
            style: tabStyle(this.activeTab === 'api'),
            onClick: () => { this.activeTab = 'api'; },
          }, 'API Reference'),
        ]),
        this.activeTab === 'docs' ? h(CustomDocs) : ApiReferencePage(),
      ]);
    },
  });
}
```

**Usage in stories:**
```ts
parameters: {
  docs: { page: withAutoDocsTab(ButtonDocs) },
},
```

**Prerequisite:** `tags: ['autodocs']` must be in meta — identical requirement to React.

---

## 8. i18n System — Pinia + Vue Composable

Location: `src/lib/i18n.ts`

```ts
import { defineStore } from 'pinia';
import { computed, type ComputedRef } from 'vue';

export type Locale = 'pt-BR' | 'en' | 'es';
const VALID_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const STORAGE_KEY = 'ds-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-BR';
  const urlLang = new URLSearchParams(window.location.search).get('lang') as Locale;
  if (urlLang && VALID_LOCALES.includes(urlLang)) return urlLang;
  const stored = localStorage.getItem(STORAGE_KEY) as Locale;
  if (stored && VALID_LOCALES.includes(stored)) return stored;
  return 'pt-BR';
}

export const useI18nStore = defineStore('i18n', {
  state: () => ({ locale: getInitialLocale() as Locale }),
  actions: {
    setLocale(locale: Locale) {
      localStorage.setItem(STORAGE_KEY, locale);
      this.locale = locale;
    },
  },
});

// ─── Composable ───────────────────────────────────────────────────────────────

function flattenDict(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenDict(value as Record<string, unknown>, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

export function useTranslation(translations: Record<string, unknown>) {
  const store = useI18nStore();

  const flatDict: ComputedRef<Record<string, unknown>> = computed(() => {
    const rawDict = (translations[store.locale] ?? translations['pt-BR'] ?? {}) as Record<string, unknown>;
    return flattenDict(rawDict);
  });

  const t = (key: string, defaultValue?: string): string => {
    const value = flatDict.value[key];
    if (value !== undefined && value !== null) return value as string;
    return defaultValue ?? key;
  };

  return {
    t,
    locale: computed(() => store.locale),   // ComputedRef<Locale>
    flatDict,
  };
}
```

**In templates:** use `t('key')` directly — `t` closes over `flatDict.value` which is reactive via `computed`. Re-calling `t()` in template expressions is fine because the template re-evaluates when `flatDict` changes.

### 8.1 `LanguageSwitcher.vue`

```vue
<script setup lang="ts">
import { useI18nStore } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const store = useI18nStore();
const locales = [
  { value: 'pt-BR', label: 'PT' },
  { value: 'en',    label: 'EN' },
  { value: 'es',    label: 'ES' },
];

function handleChange(value: string) {
  if (!value || value === store.locale) return;
  track('language_switched', {
    previous_language: store.locale,
    new_language: value as 'pt-BR' | 'en' | 'es',
  });
  store.setLocale(value as 'pt-BR' | 'en' | 'es');
}
</script>

<template>
  <div class="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/40">
    <button
      v-for="lang in locales"
      :key="lang.value"
      @click="handleChange(lang.value)"
      :class="['h-6 px-2 text-[10px] rounded',
        store.locale === lang.value
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:text-foreground']"
      :aria-pressed="store.locale === lang.value"
    >
      {{ lang.label }}
    </button>
  </div>
</template>
```

### 8.2 Pinia setup in `main.ts`

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

For Storybook, add Pinia in `preview.ts`:

```ts
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';

setup((app) => {
  app.use(createPinia());
});
```

---

## 9. SEO — `use-seo.ts` Vue Composable

Location: `src/lib/use-seo.ts`

```ts
import { watchEffect, type Ref, type ComputedRef } from 'vue';

type Locale = 'pt-BR' | 'en' | 'es';

interface SeoProps {
  title: string;
  description: string;
  locale: Locale;
  componentSlug: string;
}

const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const HREFLANG_ATTR = 'data-ds-hreflang';

function buildLangUrl(base: string, lang: string): string {
  try {
    const url = new URL(base);
    url.searchParams.set('lang', lang);
    return url.toString();
  } catch {
    return `${base}?lang=${lang}`;
  }
}

/**
 * Accepts either a plain SeoProps object or a ComputedRef/Ref wrapping SeoProps.
 * watchEffect re-runs automatically whenever any reactive dependency changes.
 */
export function useSeoEffect(propsOrRef: SeoProps | ComputedRef<SeoProps> | Ref<SeoProps>): void {
  watchEffect((onCleanup) => {
    // Unwrap reactive ref if needed
    const props = 'value' in propsOrRef ? propsOrRef.value : propsOrRef;
    const { title, description, locale, componentSlug } = props;

    const isIframe = window.self !== window.top;
    const targetDoc = isIframe ? window.parent.document : document;
    const targetWin = isIframe ? window.parent : window;

    const fullTitle = `${title} · Design System`;

    const prevTitle = targetDoc.title;
    const prevLang = targetDoc.documentElement.lang;

    targetDoc.title = fullTitle;
    targetDoc.documentElement.lang = locale;

    // Meta tags (same upsertMeta logic as React version)
    const metas = [
      { name: 'description', content: description },
      { name: 'ai:summary',  content: description },
      { property: 'og:title',       content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:locale',      content: locale.replace('-', '_') },
    ];

    const managed: Array<{ el: HTMLMetaElement; prev: string | null; isNew: boolean }> = [];
    for (const m of metas) {
      const sel = m.name ? `meta[name="${m.name}"]` : `meta[property="${m.property}"]`;
      let el = targetDoc.querySelector<HTMLMetaElement>(sel);
      let isNew = false;
      if (!el) { el = targetDoc.createElement('meta'); targetDoc.head.appendChild(el); isNew = true; }
      if (m.name) el.setAttribute('name', m.name);
      else el.setAttribute('property', m.property!);
      const prev = el.getAttribute('content');
      el.setAttribute('content', m.content);
      managed.push({ el, prev, isNew });
    }

    targetDoc.querySelectorAll(`link[${HREFLANG_ATTR}]`).forEach(el => el.remove());
    const base = `${targetWin.location.origin}${targetWin.location.pathname}?component=${componentSlug}`;
    const hreflangLinks: HTMLLinkElement[] = [];
    [...SUPPORTED_LOCALES, 'x-default'].forEach(lang => {
      const link = targetDoc.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', lang);
      link.setAttribute('href', lang === 'x-default' ? base : buildLangUrl(base, lang));
      link.setAttribute(HREFLANG_ATTR, 'true');
      targetDoc.head.appendChild(link);
      hreflangLinks.push(link);
    });

    onCleanup(() => {
      targetDoc.title = prevTitle;
      targetDoc.documentElement.lang = prevLang;
      managed.forEach(({ el, prev, isNew }) => {
        if (isNew) el.remove(); else if (prev !== null) el.setAttribute('content', prev);
      });
      hreflangLinks.forEach(el => el.remove());
    });
  });
}
```

**Usage in a Vue SFC:**
```ts
const { t, locale } = useTranslation({ ...uiTranslations, ...buttonTranslations });

useSeoEffect(computed(() => ({
  title: t('title'),
  description: t('description'),
  locale: locale.value,
  componentSlug: 'button',
})));
```

---

## 10. Analytics & Sanitizer

**Identical to React version.** `analytics.ts` and `sanitize-html.ts` are framework-agnostic TypeScript modules. Copy them without modification.

---

## 11. Foundations Pages (Unattached MDX)

The MDX pattern is identical. The only change is the import:

```mdx
import { Meta } from '@storybook/addon-docs/blocks';
import ThemingDocs from './ThemingDocs.vue';

<Meta
  title="Foundations/Multi-tenancy & Theming"
  parameters={{ layout: 'fullscreen', options: { showPanel: false } }}
/>

<ThemingDocs />
```

**Stub `.stories.ts`** (note: `.ts` not `.tsx`):
```ts
import type { Meta } from '@storybook/vue3';
export default {
  title: '_internal/foundations-theming-legacy',
  tags: ['!dev', '!autodocs', '!test'],
} satisfies Meta;
```

---

## 12. Testing Architecture

**Identical to React version** — `play` functions, axe-playwright, and Chromatic work exactly the same way. The only difference is the import:

```ts
import type { Meta, StoryObj } from '@storybook/vue3';
```

---

## 13. Step-by-Step: Adding a New Component

### Step 1 — Create the component

```
src/components/ui/Badge.vue
```

Use `<script setup lang="ts">`, `defineProps`, and Tailwind classes via `cn()`.

### Step 2 — Create translation files

```
src/components/docs/content/badge/translations.json
```

Identical format to React version.

### Step 3 — Create the docs page

```
src/components/docs/BadgeDocs.vue
```

Structure: `<script setup>` with `useTranslation`, `useSeoEffect`, `track`, `sanitizeHtml` → `<template>` with sidebar + sections.

### Step 4 — Create story files

```
src/components/ui/badge.stories.ts        # main: autodocs + docs.page
src/components/ui/badge-variantes.stories.ts
```

### Step 5 — Verify sidebar order

`storySort` in `preview.ts` handles it — no changes needed.

---

## 14. Critical Rules & Pitfalls

### `v-html` always requires sanitization
```vue
<!-- WRONG -->
<p v-html="t('anatomy.item1')" />

<!-- CORRECT -->
<p v-html="sanitizeHtml(t('anatomy.item1'))" />
```

### Blocks import
Import from `@storybook/addon-docs/blocks` in `withAutoDocsTab.ts`. Do NOT import from `@storybook/blocks`.

### Pinia must be registered before stories render
The `setup((app) => { app.use(createPinia()) })` call in `preview.ts` is mandatory.

### `watch` vs `watchEffect`
- Use `watchEffect` in `useSeoEffect` — automatically tracks all reactive refs read inside.
- Use `watch(locale, ...)` in docs pages for analytics — explicit dependency, clearer intent.

### Component names in stories
Vue Storybook requires the `component` key in meta to be the Vue SFC default export (the component itself, not a string name).

### Slot content in story args
Default slot: `args: { default: 'Button text' }`. Named slot: `args: { prefix: 'Icon' }`. Storybook Vue 3 maps arg keys to slot names automatically.

---

## 15. Running the Project

```bash
# Install
npm install @storybook/vue3-vite pinia

# Development
npm run storybook

# Tests
npx vitest

# Build
npm run build-storybook

# Visual regression
npx chromatic
```
