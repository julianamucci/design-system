---
description: Analytics — instrumenta docs pages com tracking automático via data-track* e audita cobertura GA4 (modo audit ou fix)
argument-hint: <component-slug|all> [stack] [--audit]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Analytics — Especialista em Tracking de Docs Pages

Garanta que toda docs page rastreie elementos interativos via **tracking automático** (`data-track*` + observer global). Atua em dois modos: **audit** (read-only, mapeia gaps) e **fix** (corrige).

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug ou `all`
- **`stack`** (opcional) — `react`/`vue`/`svelte`/`basecoat`/`all` (padrão `all`)
- **`--audit`** (opcional) — modo read-only; reporta gaps sem editar/commitar
- **`--json`** (opcional, com `--audit`) — emite JSON consumível por `FIXES-NEEDED.md`

---

## Fonte de Referência

`docs/shared/skill-refs/analytics-arch.md` — arquitetura completa, catálogo de eventos, padrão de `data-track-id`, severidades, output JSON. **Consulte se precisar do detalhe**.

Templates:
- `design-system-react/src/components/docs/AlertDocs.tsx` — implementação modelo
- `design-system-react/src/lib/docs-tracking.ts` — observer global
- `design-system-react/src/lib/analytics.ts` — catálogo tipado

---

## Processo

### Passo 0 — Audit determinístico (sempre)

```bash
node scripts/audit.mjs <slug> --category analytics --json
```

`audit.mjs` cobre o lado positivo (UI primitive importando `@/lib/analytics`, eventos não tipados). Esta skill cobre o lado **inverso**: interativos que deveriam ter tracking e não têm.

### Passo 1 — Coletar arquivos em paralelo

**Glob** (4 paralelos): docs pages — `design-system-{react,vue,svelte,basecoat}/src/components/docs/<Slug>Docs.*`

**Read** (4 paralelos): cada docs page

**Read** (4 paralelos): infraestrutura por stack (apenas para auditar infra; pular se for fix em docs page específica)
- `src/lib/docs-tracking.ts`
- `src/lib/analytics.ts`
- `src/components/docs/shared/sections/DocsPageLayout.{tsx,vue,svelte,ts}`
- `src/components/docs/shared/DocsNav.{tsx,vue,svelte,ts}`

**Grep** (1): `<DocsPageLayout` em cada docs page para confirmar `componentSlug` presente

**Grep** (1): `data-track=` para coverage geral

### Passo 2 — Analisar (1 passagem por arquivo)

Para cada docs page, verificar:

1. **DocsPageLayout `componentSlug`** — sem isso o observer não monta (CRÍTICO)
2. **`docs_page_view`** no mount com `locale` como dep
3. **`docs_section_viewed`** via IntersectionObserver
4. **Elementos interativos sem `data-track*`** dentro de seções de demonstração/notas (ALTO/MÉDIO conforme `analytics-arch.md`)
5. **Stories com `track()` direto** — contaminação indevida (precisa remover)
6. **`translations.json` `analytics.table.*`** com eventos do produto (não `docs_*`)

### Passo 3 — Modo audit ou fix

**`--audit`**: reportar tabela ou JSON (formato em `analytics-arch.md`). Não editar.

**Fix-mode** (default):
- Adicionar `componentSlug` no `<DocsPageLayout>` se faltando
- Adicionar `data-track`, `data-track-id` (3 partes), `data-track-label` em interativos
- Remover `track()` direto de stories
- Adicionar eventos faltantes em `analytics.table.*` no `translations.json`

---

## Saída Esperada

### Modo audit
1. Audit determinístico (`audit.mjs --category analytics`): status
2. Por stack: infra OK?
3. Por docs page: checklist da seção "Checklist por docs page" em `analytics-arch.md`
4. Tabela de gaps com severidade

### Modo fix
1. Status antes / depois do `audit.mjs --category analytics`
2. Lista de mudanças aplicadas (arquivo:linha)
3. Commit message

---

## Commit

```bash
git add -A
git commit -m "skill(analytics): $ARGUMENTS"
```

Modo `--audit`: **não commitar** (read-only).
