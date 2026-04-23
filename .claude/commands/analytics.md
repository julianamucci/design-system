---
description: Especialista em Analytics — instrumenta docs pages com tracking automático via data-track* e valida cobertura GA4
argument-hint: <component-slug> [stack]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Especialista em Analytics

Seu trabalho: garantir que **toda docs page** rastreie corretamente todos os elementos interativos, usando o sistema de **tracking automático via `data-track*`** (não invasivo, single source, tipado).

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente (ex: `button`, `alert-dialog`)
- **`stack`** (opcional) — `react`, `vue`, `svelte`, `basecoat` ou `all` (padrão: `all`)

---

## Arquitetura de Tracking — o único padrão válido

### Princípio central: **componente UI nunca chama `track()`**

Todo o tracking nas docs pages é **automático** via:

1. **Atributos HTML** nos elementos interativos:
   - `data-track="{type}"` — categoria do evento (nav | demo | variant | code | related | link)
   - `data-track-id="{component}:{section}:{element}"` — identificador estruturado em 3 partes
   - `data-track-label="{texto visível}"` — texto do botão/link (opcional; cai para `textContent`)

2. **Observer global** em `src/lib/docs-tracking.ts` (1 por stack) — monta um único click listener no root do `DocsPageLayout` e mapeia cada `data-track` para o evento GA4 correto.

3. **Catálogo tipado** em `src/lib/analytics.ts` — todos os eventos `docs_*` têm shape definido; `track()` é type-safe.

### Configuração GA4

- **Measurement ID**: `G-K0BQWVR1RG`
- **Script**: injetado em `.storybook/preview-head.html` (manager, não iframe)
- **Flow**: iframe dispara → `window.top.gtag` do manager → GA4

---

## Eventos catalogados

### Automáticos (mount e scroll)

| Evento | Disparado em | Payload |
|--------|--------------|---------|
| `docs_page_view` | Mount de `*Docs.*` (1x por locale) | `{ component_name, locale, page_title }` |
| `docs_section_viewed` | Seção entra no viewport (IntersectionObserver) | `{ component_name, section_id, locale }` |
| `language_switched` | LanguageSwitcher troca idioma | `{ previous_language, new_language }` |

### De interação (via `data-track*`)

| Evento | `data-track` | Payload | Onde aplicar |
|--------|--------------|---------|--------------|
| `docs_nav_click` | `nav` | `{ component, section_id, label }` | DocsNav (já instrumentado) |
| `docs_demo_click` | `demo` | `{ component, element_id, label }` | Botões/triggers dentro de `DocsDemonstration` |
| `docs_variant_click` | `variant` | `{ component, variant_name, label }` | Cards/botões dentro de `DocsVariants` |
| `docs_code_copy` | `code` | `{ component, snippet_id }` | Botões "Copiar" de blocos de código |
| `docs_related_click` | `related` | `{ component, target_slug, label }` | Cards do `DocsRelated` |
| `docs_link_click` | `link` | `{ component, section_id, href }` | Links externos em notas/UX writing |

### Padrão de `data-track-id`

**Sempre 3 partes separadas por `:`** — `{component}:{section}:{element}`.

Exemplos corretos:
- `alert:nav:anatomia` — link do DocsNav para a seção "anatomia"
- `alert:demo:variant-destructive` — botão que troca para a variant destructive no playground
- `alert:code:copy-destructive` — botão copiar do snippet da variant destructive
- `alert:related:badge` — card de Badge nos relacionados

**O 3º segmento (`element`) deve ser único dentro da seção** — permite distinguir "qual botão" foi clicado em páginas com múltiplos do mesmo tipo.

---

## Fontes de Referência — leia ANTES de qualquer ação

1. `docs/shared/guidelines/07-analytics.md` — catálogo completo + convenções
2. `design-system-react/src/lib/analytics.ts` — fonte dos tipos `AnalyticsEvents`
3. `design-system-react/src/lib/docs-tracking.ts` — helper `mountDocsTracking`
4. `design-system-react/src/components/docs/shared/DocsNav.tsx` — referência de `data-track`
5. `design-system-react/src/components/docs/shared/sections/DocsPageLayout.tsx` — onde o observer é montado
6. `design-system-react/src/components/docs/AlertDocs.tsx` — implementação modelo

---

## Processo (fix-mode — uso isolado fora da pipeline)

### Passo 0 — Rode o audit determinístico

```bash
node scripts/audit.mjs <slug> --category analytics --json
```

Se retornar `[]` para o slug na categoria `analytics`, a infraestrutura base está OK — continue para o Passo 1. Se há violações, corrija-as primeiro (são determinísticas: `@/lib/analytics` em UI primitive, eventos não tipados, etc.).

### Passo 1 — Verificar infra por stack

Para cada stack alvo, confirme:

- [ ] `src/lib/docs-tracking.ts` existe e exporta `mountDocsTracking`
- [ ] `src/lib/analytics.ts` tem os 6 eventos `docs_{nav,demo,variant,code,related,link}_click|copy` tipados
- [ ] `DocsPageLayout` importa `mountDocsTracking`, aceita `componentSlug?` e monta o observer no mount
- [ ] `DocsNav` aceita `componentSlug?` e emite `data-track="nav"` com `data-track-id` estruturado
- [ ] `.storybook/preview-head.html` (na verdade `manager-head.html`) tem o snippet GA4

### Passo 2 — Auditar a docs page do componente

Para `<component>Docs.*`:

- [ ] Chama `<DocsPageLayout componentSlug="<slug>" ... />` — **obrigatório** para habilitar tracking
- [ ] Chama `track('docs_page_view', ...)` no mount com `locale` como dep
- [ ] Chama `track('docs_section_viewed', ...)` via IntersectionObserver do DocsNav
- [ ] **Não** chama `track()` para cliques — eles passam pelo observer automático
- [ ] `translations.json` tem seção `analytics` com tabela dos eventos **do produto** (ex: `button_click` para o componente Button)

### Passo 3 — Verificar `data-track*` nos elementos da docs page

No `<Slug>Docs.*` você pode ter elementos interativos FORA dos section containers padrão (ex: botões de demo no `DocsDemonstration`, triggers no Playground). Cada um precisa dos 3 atributos:

```tsx
<DocsDemonstration title="..." componentSlug="alert">
  <Button
    data-track="demo"
    data-track-id="alert:demo:show-destructive"
    data-track-label="Ver variant destructive"
    onClick={...}
  >
    Destructive
  </Button>
</DocsDemonstration>
```

**Checklist de elementos que precisam de `data-track*`** (docs page típica):

| Onde | `data-track` | Padrão do id |
|------|--------------|--------------|
| Botão de demo interativo | `demo` | `{slug}:demo:{purpose}` |
| Trigger que abre overlay/popover | `demo` | `{slug}:demo:open-{name}` |
| Botão que alterna variant/size no playground | `demo` | `{slug}:demo:toggle-{prop}-{value}` |
| Link externo em `notes` ou `uxWriting` | `link` | `{slug}:{section}:{purpose}` |

### Passo 4 — Stories

- [ ] Nenhuma story importa `@/lib/analytics` ou chama `track()` diretamente
- [ ] Stories de UI primitive (`button.stories.tsx`, etc.) não têm `data-track*` — analytics é responsabilidade da docs page, não do componente nem da story

---

## Regras Absolutas

- **NUNCA** adicionar tracking dentro de componentes de UI (`Button.tsx`, `Dialog.tsx`, `Card.tsx`)
- **NUNCA** chamar `track()` em handlers de docs page para cliques — use `data-track*` e deixe o observer global cuidar
- **NUNCA** usar nomes de eventos em português ou camelCase
- **SEMPRE** `data-track-id` com 3 partes (`component:section:element`)
- **SEMPRE** `track()` importado de `@/lib/analytics`, nunca `gtag()` direto
- **SEMPRE** rastreio no-op silencioso se GA4 não estiver carregado (ad blockers, SSR)
- **Dados sensíveis** (emails, CPFs, conteúdo de input) nunca entram no payload

---

## Saída Esperada

Ao finalizar, reporte:

1. **Audit determinístico** (`audit.mjs --category analytics`): status antes / depois
2. **Infra por stack**: docs-tracking.ts ✓, catálogo tipado ✓, DocsPageLayout monta observer ✓
3. **Docs page**:
   - `DocsPageLayout componentSlug` presente?
   - `docs_page_view` / `docs_section_viewed` / `language_switched` disparados?
   - Elementos interativos adicionais com `data-track*`?
4. **Problemas encontrados e correções aplicadas**

---

## Commit de Rastreabilidade

```bash
git add -A
git commit -m "skill(analytics): $ARGUMENTS"
```

Se nenhum arquivo foi modificado, não faça commit.
