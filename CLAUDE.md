# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a **multi-stack design system monorepo**. The same design system is implemented in 4 stacks that share content, themes, and guidelines:

- `design-system-react/` — React 19 + `@base-ui/react` + Tailwind 4 — port **6006**
- `design-system-vue/` — Vue 3 + `reka-ui` + Tailwind 4 — port **6007**
- `design-system-svelte/` — Svelte 5 + `bits-ui` + Tailwind 4 — port **6008**
- `nortear-design-system/` — Vanilla TS factories + `basecoat-css` + Tailwind 4 — port **6009**

Shared (read by all stacks):
- `docs/shared/content/<slug>/translations.json` — pt-BR/en/es content per component
- `docs/shared/guidelines/` — cross-stack rules
- `docs/shared/themes/` — CSS custom property themes
- `docs/shared/skill-refs/` — schemas/references consumed by `.claude/commands/*.md` skills
- `scripts/audit.mjs` and `scripts/audit-translation-literals.mjs` — deterministic checks

Per-stack guidelines live in `design-system-<stack>/guidelines/` and each stack has its own `CLAUDE.md`.

## Common Commands

Each stack is an independent npm package; run commands from inside the stack directory.

```bash
# Storybook (the primary developer interface — NOT App.tsx/main.ts)
npm run storybook          # React:6006 · Vue:6007 · Svelte:6008 · Basecoat:6009

# Build + typecheck
npm run build              # tsc -b && vite build (varies per stack)

# Lint
npm run lint

# Tests (React only has unit tests; all stacks have Storybook tests)
npm run test               # React: vitest run
npm run test:watch         # React: vitest watch
npm run test-storybook     # all stacks: axe-playwright + play functions

# Visual regression
npm run chromatic
```

### Repo-root scripts

```bash
node scripts/audit.mjs <slug> --json              # quick deterministic audit per component
node scripts/audit.mjs --all --json
node scripts/audit-translation-literals.mjs       # check translations.json for stack-specific API references in descriptive text
```

## Architecture

### Storybook is the home

Each stack uses Storybook 10 as its primary interface. `App.tsx`/`main.ts` exists only as a development sandbox. New components are added by creating `*.stories.tsx` and `*Docs.tsx` (or stack equivalent) — **not** by registering in `App.tsx`.

The Storybook sidebar order is controlled by `storySort` in `.storybook/preview.ts`. Brand themes are toggled via toolbar globals.

### Component anatomy (per stack)

For a component `<slug>`, each stack has:

- `src/components/ui/<slug>*.{tsx,vue,svelte,ts}` — primitive
- `src/components/ui/<slug>*.stories.*` — Playground + variant/state/composition stories
- `src/components/docs/<Slug>Docs.*` — full docs page (consumed via `withAutoDocsTab` HOC)
- `src/components/docs/shared/sections/Docs*.*` — 15 generic section containers used by every docs page (header, anatomy, when-to-use, do-dont, import, variants, states, props, tokens, accessibility, related, notes, analytics, testes, demonstration)

Content for all of those comes from `docs/shared/content/<slug>/translations.json`. Code snippets in the JSON (keys ending in `Code`, `structureCode`, `extensibilityCode`, `customizationCode`, `interfaceCode`) are stack-specific; descriptive text must be API-neutral.

### Shared `lib` per stack

Each stack has these files in `src/lib/`:

- `i18n.ts` — `useTranslation(translations, overrides?)` with dot-path lookup and per-stack overrides via the `overrides` parameter (use for stack-specific prop names that differ from the shared JSON)
- `use-seo.ts` — `useSeoEffect` / `applySeo`. Detects iframe context and writes meta tags into the parent (Storybook manager). Title is `${title} · Design System` — **do not include the suffix in `seo.title` in translations.json**.
- `use-active-section.{ts,svelte.ts}` — IntersectionObserver wrapper. `onActive` (highlight) fires immediately; `onDwell` (analytics `docs_section_viewed`) fires only after 2s continuous visibility, suppressing false positives during programmatic scroll from nav clicks.
- `analytics.ts` — `track(event, params)`. GA4 lives in `manager-head.html` (not the iframe) with `send_page_view:false`; `track()` calls `window.top.gtag`.
- `sanitize-html.ts` — required for any `dangerouslySetInnerHTML` / `v-html` / `{@html}` / `innerHTML` rendering of translated content.

### Cross-stack translation strategy

Different UI libraries (`@base-ui` / `reka-ui` / `bits-ui` / factories) expose different prop names for the same concept. The convention is:

1. **Descriptive text in shared `translations.json` is API-neutral** ("modo múltiplo", "callback de mudança"). The auditor at `scripts/audit-translation-literals.mjs` flags literal prop references in descriptive keys.
2. **Code snippets (keys ending in `Code`) are stack-specific** and stay verbatim. Each stack reads its own subset; e.g. `structureCode` for React contains JSX, for Vue contains `<template>`, etc.
3. **Stack-specific prop tables use overrides**: when the shared `translations.json` describes props in the API of (say) `reka-ui` but the React stack uses `@base-ui` with different names, override at the call site:

```tsx
const { t } = useTranslation(translations, {
  "*":   { "props.X.name": "multiple", "props.X.type": "boolean" },
  "pt-BR": { "props.X.description": "…" },
  en:    { "props.X.description": "…" },
  es:    { "props.X.description": "…" },
});
```

When `*Docs.tsx` iterates `translations[locale].props.<group>.items` directly (bypassing `t()`), build a local `useMemo` array that swaps the relevant entries instead of relying on overrides — overrides only flow through `t()`.

### Skills and audit pipeline

`.claude/commands/` defines named skills (`pipeline`, `dev-react`, `dev-vue`, `dev-svelte`, `dev-basecoat`, `ux-writer`, `quality`, `security`, `performance`, `analytics`, `seo-geo`, `cross-stack`, `product`, `docs-sections`). The `pipeline` orchestrator chains them with parallelism between stacks and inline determinism via `scripts/audit.mjs`. Skills are user-invoked with slash commands — do not invoke them speculatively.

## Conventions To Respect

- **Never register new components in `App.tsx`/`main.ts`** — they're sandboxes; the source of truth for docs is the Storybook story tree.
- **Never include emojis or ✓/✗ glyphs in `translations.json`** — those are rendered by the docs page code (Tailwind pills + lucide icons). Including them in text causes visual duplication.
- **Never reference one stack by name from another stack's text or notes** (e.g. "In React, value is always an array. In Vue…"). Each stack's docs are consumed standalone; cross-stack comparisons leak.
- **Never call `gtag()` directly** — use `track()` from `src/lib/analytics.ts`. GA4 lives in the manager, not the iframe.
- **`useSeoEffect` is mandatory** in every `*Docs.*` for title, description, hreflang, og:*, and JSON-LD. Don't write meta tags inline.
- **`seo.title` in translations.json must NOT contain "· Design System"** — `useSeoEffect` appends it.
- **Stories of variations/states must set `parameters.controls.disable: true`** when there are no `argTypes`, otherwise the Controls panel is empty.
- **Vue docs read locale from `useTranslation()`** (not Pinia / `useLocaleStore`) — historic crash.
