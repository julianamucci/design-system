# Storybook Design System — Architecture Reference

> **Purpose:** This document is written for AI agents and developers replicating this Storybook setup in other projects. It describes every architectural decision, file pattern, and wiring mechanism in detail. Read this before touching any file.

---

## 1. Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Build tool | Vite | 8 |
| Storybook | `@storybook/react-vite` | 10 |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` | 4 |
| State (i18n) | Zustand | 5 |
| Testing | Vitest + `@storybook/addon-vitest` + Playwright | 4 / 10 / 1.59 |
| A11y | `@storybook/addon-a11y` + `axe-playwright` | 10 / 2 |
| Visual regression | Chromatic | via `@chromatic-com/storybook` |
| TypeScript | 6 | strict |

Path alias: `@/` → `./src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

---

## 2. Directory Structure

```
design-system-react/
├── .storybook/
│   ├── main.ts                  # Addons, stories glob, framework
│   ├── preview.ts               # Global parameters, decorators, toolbar globals
│   ├── preview-head.html        # Scripts injected into every preview iframe <head>
│   ├── manager-head.html        # Scripts injected into the Storybook manager shell
│   └── test-runner.ts           # axe-playwright accessibility runner config
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Primitive UI components (shadcn/ui pattern)
│   │   │   ├── button.tsx
│   │   │   ├── button.stories.tsx          # Main story file (Playground + docs.page)
│   │   │   ├── button-variantes.stories.tsx
│   │   │   ├── button-tamanhos.stories.tsx
│   │   │   ├── button-estados.stories.tsx
│   │   │   └── button-composicoes.stories.tsx
│   │   │
│   │   ├── docs/                # Rich documentation pages
│   │   │   ├── ButtonDocs.tsx              # Full-page docs React component
│   │   │   ├── content/
│   │   │   │   └── button/
│   │   │   │       └── translations.json   # All UI text in pt-BR / en / es
│   │   │   ├── shared/                     # Reusable docs building blocks
│   │   │   │   ├── DocsHeader.tsx
│   │   │   │   ├── DocsSection.tsx
│   │   │   │   ├── DoDont.tsx
│   │   │   │   ├── DocsNav.tsx
│   │   │   │   ├── Anatomy.tsx
│   │   │   │   └── UXWritingTable.tsx
│   │   │   │
│   │   │   ├── ThemingDocs.tsx             # Unattached foundations page (React)
│   │   │   ├── ThemingDocs.mdx             # Unattached foundations page (MDX entry)
│   │   │   ├── ThemingDocs.stories.tsx     # Stub: prevents title conflict
│   │   │   ├── ThemeColorsDocs.tsx
│   │   │   ├── ThemeColorsDocs.mdx
│   │   │   └── ThemeColorsDocs.stories.tsx
│   │   │
│   │   └── product/
│   │       └── LanguageSwitcher.tsx        # UI for switching i18n locale
│   │
│   ├── lib/
│   │   ├── i18n.ts              # Zustand store + useTranslation hook
│   │   ├── analytics.ts         # Typed GA4 event wrapper
│   │   ├── use-seo.ts           # SEO meta tags hook (title, og:*, hreflang)
│   │   ├── sanitize-html.ts     # HTML sanitizer for dangerouslySetInnerHTML
│   │   ├── theme-config.ts      # Subdomain → theme mapping
│   │   ├── withAutoDocsTab.tsx  # HOC: adds "API Reference" tab to docs pages
│   │   └── utils.ts             # cn() tailwind class merger
│   │
│   ├── i18n/
│   │   └── ui.json              # Shared UI chrome translations (nav labels, common)
│   │
│   └── styles/
│       ├── globals.css          # Tailwind entry + CSS variable tokens + theme imports
│       ├── storybook-docs.css   # Docs-specific layout overrides
│       └── themes/
│           ├── crystal.css      # .tema-um brand overrides
│           └── industrial.css   # .tema-dois brand overrides
│
├── chromatic.config.json
├── vite.config.ts
└── STORYBOOK-ARCHITECTURE.md   ← this file
```

---

## 3. Storybook Configuration

### 3.1 `main.ts`

```ts
const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-themes',
    '@storybook/addon-mcp',
  ],
  framework: '@storybook/react-vite',
  features: {
    componentsManifest: true,
  },
};
```

**Important:** The stories glob picks up both `.mdx` and `.stories.tsx` files anywhere under `src/`. This means every `.mdx` file placed under `src/` automatically becomes a Storybook page.

**MCP Integration:** The `@storybook/addon-mcp` addon exposes component documentation via MCP (Model Context Protocol). The `componentsManifest: true` feature generates `/manifests/components.json` at build time, which the MCP server uses to provide component props, stories, and code snippets to AI agents. Without this feature, the MCP tools return errors when trying to read component documentation.

### 3.2 `preview.ts`

Responsibilities: global parameters, two decorators (light/dark + brand), toolbar globals.

```ts
import { withThemeByClassName } from '@storybook/addon-themes';

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
    a11y: { test: 'error' },      // a11y violations = hard errors in CI
    docs: {
      codePanel: true,
      canvas: { sourceState: 'shown' },
      source: { type: 'dynamic', excludeDecorators: true },
    },
  },

  globalTypes: {
    brand: {                       // Custom toolbar dropdown
      defaultValue: 'default',
      toolbar: {
        items: [
          { value: 'default', title: 'Nortear (Padrão)' },
          { value: 'tema-um',  title: 'Crystal (Indigo)' },
          { value: 'tema-dois', title: 'Industrial (Amber)' },
        ],
      },
    },
  },

  decorators: [
    // Decorator 1: manages .dark class on <html>
    withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'light', parentSelector: 'html' }),

    // Decorator 2: manages brand class on <html>
    (Story, context) => {
      const brand = context.globals.brand || 'default';
      useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('tema-um', 'tema-dois');
        if (brand !== 'default') html.classList.add(brand);
      }, [brand]);
      return Story();
    },
  ],
};
```

**Storybook sidebar sort rules:**
- `Foundations` always appears first.
- Under `UI`, sub-pages are ordered: `Docs → Playground → Variantes → Tamanhos → Composições → Estados → *`.
- Everything else falls to `*`.

### 3.3 `preview-head.html`

Injected into every preview iframe `<head>`. Contains two scripts:

**Script 1 — GA4:**
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-K0BQWVR1RG"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-K0BQWVR1RG', { send_page_view: false });
</script>
```
`send_page_view: false` — page views are fired manually via `track('docs_page_view', ...)`.

**Script 2 — Theme sync for docs pages:**

The Storybook decorator runs inside story components. When a docs page loads fresh (or on URL navigation), the class changes made by decorators may not have fired yet. This script reads `?globals=` from the URL and applies both `.dark` and brand classes to `<html>` directly.

```js
(function() {
  const BRAND_CLASSES = ['tema-um', 'tema-dois'];

  const parseGlobals = (raw) => {
    const result = {};
    if (!raw) return result;
    raw.split(';').forEach(pair => {
      const idx = pair.indexOf(':');
      if (idx !== -1) result[pair.slice(0, idx)] = pair.slice(idx + 1);
    });
    return result;
  };

  const syncTheme = () => {
    const globals = parseGlobals(new URLSearchParams(window.location.search).get('globals'));
    const html = document.documentElement;

    // Light / Dark
    if (globals.theme === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
    }

    // Brand (multi-tenancy)
    html.classList.remove(...BRAND_CLASSES);
    if (globals.brand && globals.brand !== 'default') {
      html.classList.add(globals.brand);
    }
  };

  window.addEventListener('load', syncTheme);
  window.addEventListener('popstate', syncTheme);
  setInterval(() => { /* polls every 500ms for toolbar changes */ }, 500);
})();
```

URL globals format: `?globals=theme:dark;brand:tema-um` (semicolon-separated `key:value` pairs).

### 3.4 `test-runner.ts`

Runs axe accessibility checks against every story via Playwright. Respects per-story `parameters.a11y.disable` and `parameters.a11y.config.rules` overrides.

---

## 4. Theme System

### 4.1 CSS Architecture

Theme variables are plain HSL values defined as CSS custom properties. **No Tailwind classes are used for theming** — everything goes through CSS variables consumed by Tailwind's `@theme inline {}` block.

```
:root { ... }            ← light mode defaults (globals.css)
.dark { ... }            ← dark mode overrides (globals.css)
.tema-um { ... }         ← Crystal brand (crystal.css)
.dark.tema-um { ... }    ← Crystal dark variant
.tema-dois { ... }       ← Industrial brand (industrial.css)
.dark.tema-dois { ... }  ← Industrial dark variant
```

The cascade is additive: a `.dark.tema-um` element gets defaults from `:root`, dark overrides, then Crystal dark overrides.

Theme CSS files are imported in `globals.css`:
```css
@import "tailwindcss";
/* ... token definitions ... */
@import "./themes/crystal.css";
@import "./themes/industrial.css";
@import "./storybook-docs.css";
```

Because `globals.css` is imported in `preview.ts`, the theme CSS is available in both Canvas (story) and Docs views.

### 4.2 Applying Themes

Both dimensions (light/dark + brand) are applied as classes on `<html>`:

| Scenario | Mechanism |
|---|---|
| Canvas view, live toolbar change | `preview.ts` decorators via `useEffect` |
| Docs view, initial load / page refresh | `preview-head.html` sync script reading `?globals=` |
| Docs view, toolbar change without navigation | polling interval in sync script (500ms) |

### 4.3 Subdomain-Based Theme (Production)

`src/lib/theme-config.ts` maps subdomains to brand classes:

```ts
const subdomainThemeMap = {
  'localhost': 'default',
  'crystal':   'tema-um',
  'admin':     'tema-dois',
  'nortear':   'default',
};
```

`getThemeInfo()` returns `{ subdomain, theme, isDevMode, allowManualSelection }`. In dev mode, the manual `ThemeSelector` component is shown. In production, the theme is locked to the subdomain.

---

## 5. Component Story Pattern

Each UI component uses a **multi-file story split**:

| File | Storybook title | Purpose |
|---|---|---|
| `button.stories.tsx` | `UI/Button` | Playground + `docs.page` wiring |
| `button-variantes.stories.tsx` | `UI/Button/Variantes` | One story per variant |
| `button-tamanhos.stories.tsx` | `UI/Button/Tamanhos` | One story per size |
| `button-estados.stories.tsx` | `UI/Button/Estados` | disabled, loading, etc. |
| `button-composicoes.stories.tsx` | `UI/Button/Composições` | Icon buttons, icon+text, etc. |

### 5.1 Main Story File (`button.stories.tsx`)

```ts
import { ButtonDocs } from '@/components/docs/ButtonDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ButtonDocs) },  // custom docs + API tab
  },
  argTypes: { /* full argTypes declaration */ },
  args:     { /* default args */ },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    // Interaction tests: click, keyboard, focus, disabled state
  },
};
```

**`tags: ['autodocs']`** enables autodocs for this component — required for the API Reference tab to work.

### 5.2 Sub-story Files (`button-variantes.stories.tsx`)

```ts
const meta = {
  title: 'UI/Button/Variantes',
  component: Button,
  // NO docs.page override — inherits nothing, these are plain stories
} satisfies Meta<typeof Button>;

export const Default: Story = { args: { variant: 'default' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
// ...
```

Sub-story files have **no docs.page** override and **no tags: ['autodocs']** — they are purely navigable story groups.

---

## 6. Documentation Pages Pattern

Documentation pages are rich, full-page React components separate from the component stories. They live in `src/components/docs/`.

### 6.1 File Layout per Component

```
src/components/docs/
├── ButtonDocs.tsx                       # Full docs page React component
└── content/
    └── button/
        └── translations.json            # All UI text (pt-BR / en / es)
```

### 6.2 `translations.json` Structure

```json
{
  "pt-BR": {
    "title": "Button",
    "description": "...",
    "anatomy": {
      "item1": "<strong>Container</strong> — <code><button></code> nativo..."
    }
  },
  "en": { "title": "Button", "description": "...", "anatomy": { "item1": "..." } },
  "es": { "title": "Button", "description": "...", "anatomy": { "item1": "..." } }
}
```

HTML tags like `<strong>` and `<code>` are allowed in values — always pass them through `sanitizeHtml()` before rendering with `dangerouslySetInnerHTML`.

### 6.3 `ComponentDocs.tsx` Internal Structure

```tsx
// 1. Imports
import { useTranslation } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { useSeoEffect } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { sanitizeHtml } from '@/lib/sanitize-html';
import uiTranslations from '@/i18n/ui.json';
import componentTranslations from './content/button/translations.json';

// 2. Nav groups (drives the sidebar)
const getNavGroups = (t) => [
  { label: t('nav.overview'), sections: [
    { id: 'demonstracao', label: t('nav.demonstration') },
    { id: 'anatomia',     label: t('nav.anatomy') },
    // ...
  ]},
  { label: t('nav.techRef'), sections: [ /* ... */ ] },
  { label: t('nav.context'), sections: [ /* ... */ ] },
  { label: t('nav.quality'), sections: [ /* ... */ ] },
];

// 3. useActiveSection hook
function useActiveSection(ids: string[], onSectionChange?: (id: string) => void) {
  // IntersectionObserver per section id, rootMargin: '-20% 0px -70% 0px'
}

// 4. ComponentDocsSidebar
function ComponentDocsSidebar({ navGroups, allIds, onSectionChange }) {
  const activeId = useActiveSection(allIds, onSectionChange);
  // Sticky sidebar with nav links, highlights active section
}

// 5. Main export
export function ButtonDocs() {
  const { t, locale } = useTranslation({ ...uiTranslations, ...componentTranslations });

  // SEO (title, og:*, hreflang, html lang)
  useSeoEffect({ title: t('title'), description: t('description'), locale, componentSlug: 'button' });

  // Analytics: page view on mount, section views via callback
  useEffect(() => { track('docs_page_view', { component_name: 'button', locale, page_title: t('title') }); }, [locale]);
  const handleSectionChange = useCallback((id) => {
    track('docs_section_viewed', { section_id: id, component_name: 'button', locale });
  }, [locale]);

  const navGroups = useMemo(() => getNavGroups(t), [t]);
  const allIds = useMemo(() => navGroups.flatMap(g => g.sections.map(s => s.id)), [navGroups]);

  return (
    <div className="flex min-h-screen">
      <ComponentDocsSidebar navGroups={navGroups} allIds={allIds} onSectionChange={handleSectionChange} />
      <main className="flex-1 max-w-4xl ...">
        <LanguageSwitcher />
        <DocsHeader ... />

        <DocsSection id="demonstracao" title={t('demonstration.title')}>
          <ComponentDemo>...</ComponentDemo>
        </DocsSection>

        <DocsSection id="anatomia" title={t('anatomy.title')}>
          <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('anatomy.item1')) }} />
        </DocsSection>

        {/* ... all other sections ... */}
      </main>
    </div>
  );
}
```

### 6.4 Shared Docs Components

| Component | Location | Props | Purpose |
|---|---|---|---|
| `DocsHeader` | `shared/DocsHeader.tsx` | `category`, `complexity`, `title`, `description`, `shadcnCommand`, `figmaLink`, `updatedAt` | Standardized page header with badges |
| `DocsSection` | `shared/DocsSection.tsx` | `id`, `title`, `description`, `children`, `noSeparator` | Section wrapper with `<hr>` + `scroll-mt-24` |
| `DoDont` | `shared/DoDont.tsx` | `pairs: { do: { visual, description }, dont: { visual, description } }[]` | Side-by-side Do / Don't panels |
| `Anatomy` | `shared/Anatomy.tsx` | component-specific | Visual anatomy diagram |
| `UXWritingTable` | `shared/UXWritingTable.tsx` | component-specific | Copy guidelines table |
| `DocsNav` | `shared/DocsNav.tsx` | component-specific | Sidebar navigation group list |

**`DocsSection` always assigns `id` matching the nav group `sections[].id`** so IntersectionObserver can find it.

---

## 7. `withAutoDocsTab` HOC

Location: `src/lib/withAutoDocsTab.tsx`

Wraps any custom docs component with a two-tab layout: "Documentação" (custom) and "API Reference" (autodocs).

```tsx
export function withAutoDocsTab(CustomDocs: () => React.JSX.Element) {
  return function DocsPageWithApiTab() {
    const [activeTab, setActiveTab] = useState<'docs' | 'api'>('docs');
    return (
      <>
        <TabBar> ... </TabBar>
        {activeTab === 'docs' && <CustomDocs />}
        {activeTab === 'api'  && <ApiReferencePage />}
      </>
    );
  };
}
```

`ApiReferencePage` renders: `<Title /> <Description /> <Primary /> <Controls /> <ArgTypes /> <Stories includePrimary={false} />` — all from `@storybook/addon-docs/blocks` (NOT `@storybook/blocks`).

**Usage in stories:**
```ts
parameters: {
  docs: { page: withAutoDocsTab(ButtonDocs) },
},
```

**Prerequisite:** The story file must have `tags: ['autodocs']` in meta, otherwise the Storybook blocks context won't have component data to render.

---

## 8. i18n System

Location: `src/lib/i18n.ts`

### 8.1 Architecture

- **State:** Zustand store (`useI18nStore`) holds `locale: Locale` and `setLocale()`.
- **Persistence:** `setLocale` writes to `localStorage` key `'ds-locale'`.
- **Initial priority:** URL `?lang=pt-BR` → `localStorage` → default `'pt-BR'`.
- **Supported locales:** `'pt-BR' | 'en' | 'es'`.

### 8.2 `useTranslation(translations)`

Takes a merged translations object. Returns `{ t, locale }`.

- `t(key, defaultValue?)` — dot-notation key lookup (e.g. `t('anatomy.item1')`).
- Dictionary is **pre-flattened** once with `useMemo` → O(1) lookups on every `t()` call.
- Array values: `t('key') as any[]` (flat dict preserves arrays without flattening them).

### 8.3 Translation File Convention

Two translation files exist per component:

1. `src/i18n/ui.json` — shared chrome labels (nav group names, common words). Imported by every docs page.
2. `src/components/docs/content/{slug}/translations.json` — component-specific content.

Merge them before passing to `useTranslation`:
```ts
const { t } = useTranslation({ ...uiTranslations, ...componentTranslations });
```

When the same key exists in both, component-specific wins (right side of spread).

### 8.4 `LanguageSwitcher` Component

Location: `src/components/product/LanguageSwitcher.tsx`

Uses `ToggleGroup` (single selection) to render PT / EN / ES buttons. On change:
1. Guards against empty value or same locale (prevents spurious fires).
2. Fires `track('language_switched', { previous_language, new_language })`.
3. Calls `setLocale(value)`.

---

## 9. SEO & Meta Tags

Location: `src/lib/use-seo.ts`

### Usage

```ts
useSeoEffect({
  title: t('title'),           // without "· Design System" suffix
  description: t('description'),
  locale,
  componentSlug: 'button',    // used in canonical URL ?component=button
});
```

### What it manages

| Element | Attribute | Example value |
|---|---|---|
| `<title>` | — | `Button · Design System` |
| `<html>` | `lang` | `pt-BR` |
| `<meta name="description">` | `content` | `"Elemento interativo..."` |
| `<meta name="ai:summary">` | `content` | same as description |
| `<meta property="og:title">` | `content` | `Button · Design System` |
| `<meta property="og:description">` | `content` | description |
| `<meta property="og:locale">` | `content` | `pt_BR` |
| `<meta property="og:url">` | `content` | `https://.../...?component=button&lang=pt-BR` |
| `<link rel="alternate" hreflang="pt-BR">` | `href` | `?component=button&lang=pt-BR` |
| `<link rel="alternate" hreflang="en">` | `href` | `?component=button&lang=en` |
| `<link rel="alternate" hreflang="es">` | `href` | `?component=button&lang=es` |
| `<link rel="alternate" hreflang="x-default">` | `href` | `?component=button` |

**Storybook iframe:** the hook detects `window.self !== window.top` and writes tags into the **parent** document (the Storybook manager shell), so the browser's visible tab title updates correctly.

**Cleanup:** all elements are restored or removed on unmount — no leaking between components.

---

## 10. Analytics

Location: `src/lib/analytics.ts`

Typed wrapper around `window.gtag`. Silent no-op when `gtag` is not available (SSR, ad-blockers).

```ts
export function track<T extends keyof AnalyticsEvents>(
  event: T,
  params: AnalyticsEvents[T],
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params as Record<string, unknown>);
}
```

### Event Dictionary

| Event | Payload | When to fire |
|---|---|---|
| `docs_page_view` | `{ component_name, locale, page_title }` | On docs page mount + locale change |
| `docs_section_viewed` | `{ section_id, component_name, locale }` | When a section enters viewport (IntersectionObserver callback) |
| `language_switched` | `{ previous_language, new_language, component_name? }` | When `LanguageSwitcher` changes locale |

To add a new event type, extend the `AnalyticsEvents` interface in `analytics.ts`.

---

## 11. HTML Sanitizer

Location: `src/lib/sanitize-html.ts`

Translations JSON contains inline HTML (`<strong>`, `<code>`, `<a>`). Always sanitize before `dangerouslySetInnerHTML`:

```tsx
<p dangerouslySetInnerHTML={{ __html: sanitizeHtml(t('anatomy.item1')) }} />
```

What it removes:
- Block tags + their content: `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`
- Void tags: same list above + `<input>`, `<link>`, `<meta>`
- Inline event handlers: `onclick="..."`, `onmouseover="..."`, etc.
- `javascript:` in `href`, `src`, `action`

What it preserves: `<strong>`, `<em>`, `<b>`, `<i>`, `<code>`, `<a>`, `<br>`, `<span>`.

---

## 12. Foundations Pages (Unattached Docs)

Foundations pages (color palettes, theming guide, etc.) are **unattached** — they have no associated component and exist purely as documentation.

### Pattern

```
src/components/docs/
├── ThemingDocs.tsx           # React component with the actual content
├── ThemingDocs.mdx           # MDX entry point — no "of" prop in <Meta>
└── ThemingDocs.stories.tsx   # Stub — prevents title conflict
```

**`ThemingDocs.mdx`:**
```mdx
import { Meta } from '@storybook/addon-docs/blocks';
import { ThemingDocs } from './ThemingDocs';

<Meta
  title="Foundations/Multi-tenancy & Theming"
  parameters={{
    layout: 'fullscreen',
    options: { showPanel: false },
    docs: { codePanel: false, source: { code: null } },
  }}
/>

<ThemingDocs />
```

**`ThemingDocs.stories.tsx` (stub — required to prevent lint errors in projects that require a default export from `*.stories.*`):**
```ts
import type { Meta } from '@storybook/react';
export default {
  title: '_internal/foundations-theming-legacy',
  tags: ['!dev', '!autodocs', '!test'],  // hidden from sidebar, autodocs, and test runner
} satisfies Meta;
```

**Rules for unattached pages:**
- `<Meta title="...">` has NO `of` prop.
- Set `options: { showPanel: false }` to hide the controls/actions panel (there is no component to control).
- Put them under the `Foundations/` group to match the `storySort` order.
- The stub `.stories.tsx` title must be unique (prefix with `_internal/`) and must NOT match the `.mdx` title.

---

## 13. Testing Architecture

### 13.1 Interaction Tests (in stories)

Stories can have a `play` function that runs user interactions and assertions:

```ts
export const Playground: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('clicks the button', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};
```

Run via: `npx vitest` (uses `@storybook/addon-vitest` + Playwright Chromium headless).

### 13.2 Accessibility Tests

Two levels:
1. **In-browser panel** — `@storybook/addon-a11y` shows axe violations in the Storybook UI. `a11y: { test: 'error' }` in `preview.ts` makes violations fail the panel.
2. **CI test-runner** — `test-runner.ts` injects axe via `axe-playwright` and calls `checkA11y` on `#storybook-root` after every story visit.

Disable per story:
```ts
parameters: { a11y: { disable: true } }
```

Override rules per story:
```ts
parameters: { a11y: { config: { rules: [{ id: 'color-contrast', enabled: false }] } } }
```

### 13.3 Visual Regression (Chromatic)

`chromatic.config.json`:
```json
{
  "onlyChanged": true,
  "storybookBaseDir": "design-system-react",
  "zip": true
}
```

`onlyChanged: true` only captures stories that changed relative to the baseline, reducing snapshot costs.

---

## 14. Step-by-Step: Adding a New Component

Follow this exact sequence when an AI agent needs to add a new UI component (e.g. `Badge`):

### Step 1 — Create the component

```
src/components/ui/badge.tsx
```

Follows the shadcn/ui pattern: `cva` for variants, `cn()` for class merging, `React.forwardRef`.

### Step 2 — Create translation files

```
src/components/docs/content/badge/translations.json
```

Structure: `{ "pt-BR": { "title": "Badge", ... }, "en": { ... }, "es": { ... } }`.
Include keys: `title`, `description`, `anatomy.*`, `usage.*`, and any component-specific sections.

### Step 3 — Create the docs page

```
src/components/docs/BadgeDocs.tsx
```

Required structure (see Section 6.3):
- Import `useTranslation`, `LanguageSwitcher`, `useSeoEffect`, `track`, `sanitizeHtml`
- Import `uiTranslations` and component translations, merge with spread
- Define `getNavGroups(t)` → array of nav groups
- Define `useActiveSection` → IntersectionObserver hook
- Define `ComponentDocsSidebar` → sticky sidebar with nav
- Export `BadgeDocs` → layout with sidebar + main content sections

### Step 4 — Create story files

**`src/components/ui/badge.stories.tsx`** (main):
```ts
import { BadgeDocs } from '@/components/docs/BadgeDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { docs: { page: withAutoDocsTab(BadgeDocs) } },
  argTypes: { /* variant, etc. */ },
  args: { /* defaults */ },
} satisfies Meta<typeof Badge>;

export const Playground: Story = { play: async ({ ... }) => { /* interaction tests */ } };
```

**Sub-story files** (one per category that exists for this component):
- `badge-variantes.stories.tsx` → title `'UI/Badge/Variantes'`
- `badge-estados.stories.tsx` → title `'UI/Badge/Estados'`

### Step 5 — Verify the sidebar order

The `storySort` in `preview.ts` handles ordering automatically as long as the title follows `'UI/ComponentName'` or `'UI/ComponentName/SubCategory'`.

---

## 15. Critical Rules & Pitfalls

### Import paths
- Always import blocks from `@storybook/addon-docs/blocks` — NOT `@storybook/blocks` (listed in `package.json` but may not be installed as a top-level package).
- Always use the `@/` path alias for `src/` imports.

### Theme CSS
- Never hardcode colors. Always use CSS variables: `hsl(var(--primary))`, `hsl(var(--background))`, etc.
- The full token list is in `src/styles/globals.css` under `:root { }`.

### dangerouslySetInnerHTML
- Always call `sanitizeHtml(html)` before using `dangerouslySetInnerHTML`.

### Storybook docs import
- The correct import for `<Meta>` in MDX files is: `import { Meta } from '@storybook/addon-docs/blocks'`.

### Unattached pages
- The stub `.stories.tsx` for an unattached MDX page must have a **different title** than the MDX file and must include `tags: ['!dev', '!autodocs', '!test']`.

### Analytics
- Do NOT call `track()` inside render. Call it inside `useEffect` or event handlers only.
- `track('docs_page_view', ...)` should run on `[locale]` dependency so it re-fires when the user switches language.

### Accessibility
- `a11y: { test: 'error' }` is set globally — any axe violation will fail CI tests. Fix violations before committing.

### Zustand + React StrictMode
- Zustand v5 is compatible with React 19 strict mode. No special configuration needed.

---

## 16. Running the Project

```bash
# Development
npm run storybook        # Storybook on http://localhost:6006

# Tests
npx vitest               # Run interaction + a11y tests (headless Chromium)

# Build
npm run build-storybook  # Static build to storybook-static/

# Visual regression
npx chromatic            # Requires CHROMATIC_PROJECT_TOKEN env var
```
