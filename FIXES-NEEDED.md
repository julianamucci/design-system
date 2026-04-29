# Fixes Pendentes — Pipeline full dialog — 2026-04-29

**Status: ✓ Todos os 11 fixes aplicados.**

## Críticos (P0) — aplicados

- [x] **`use-seo.ts` injeta `ai:summary`, `ai:entities`, `ai:intent`** — `3b0404e` (4 stacks)
- [x] **DialogDocs passam `breadcrumb` para JSON-LD** — `c2d5b6a` (4 stacks)
- [x] **Sufixo duplicado removido de `seo.title`** — `b08f45e` (dialog/translations.json)

## Médios (P1) — aplicados

- [x] **Basecoat overlay: `isolate` + animações `data-[state]`** — `1900a1b`
- [x] **Basecoat DialogTitle: tipografia alinhada** — `1900a1b`
- [x] **Basecoat DialogFooter: tokens de fundo/borda** — `1900a1b`
- [x] **Svelte composições renomeadas** (`ConfirmEmail`, `ProfileEdit`, `MediaPreview`) — `0d37af2`
- [x] **Estado `Controlled` adicionado em React + Basecoat** — `6c9d0d4`

## Baixos (P2) — aplicados

- [x] **`seo.aiEntities` inclui `lucide` + `Tailwind CSS`** — `06379c1`
- [x] **Svelte variantes: cobertura idiomática validada** — sem commit (paridade ok)
- [x] **Play functions expandidas para 7 casos em todas as stacks** — `809ed6b`

---

## Pendências fora do escopo

### Sufixo duplicado em outros componentes

23 outros `translations.json` têm `seo.title` com `· Design System` duplicado:
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, input, label, separator, sidebar, skeleton, sonner, table.

**Recomendação:** próximo pipeline deve incluir um pass global de `/seo-geo --all --fix-titles`.

### Divergências entre `use-seo.ts` (4 stacks)

Identificadas mas não normalizadas no Batch 1:
- Vue não emite `og:url` (única stack sem)
- React/Vue/Svelte/Basecoat usam APIs diferentes (`useEffect`, `watchEffect`, `$effect`, `subscribe`)

**Recomendação:** trabalho de cross-stack dedicado ao hook SEO.
