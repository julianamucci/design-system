---
description: Auditoria de cobertura de tracking em docs pages — mapeia elementos interativos sem data-track* e prioriza por frequência de uso
argument-hint: [component-slug|all] [--json]
allowed-tools: [Read, Glob, Grep, Bash]
---

# Audit Analytics — cobertura de `data-track*`

Skill **read-only**. Varre `*Docs.*` e section containers em todas as 4 stacks e reporta elementos interativos que **não têm** os 3 atributos obrigatórios (`data-track`, `data-track-id`, `data-track-label`).

Complementa o audit determinístico de `scripts/audit.mjs --category analytics` (que só cobre: UI primitive sem importar `@/lib/analytics` + eventos não tipados em `AnalyticsEvents`). Esta skill cobre o lado **inverso**: interativos que deveriam ter tracking e não têm.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (opcional) — slug específico (ex: `alert`) ou `all` para todos os componentes com docs page (padrão: `all`)
- **`--json`** (opcional) — emite relatório em JSON (compatível com FIXES-NEEDED.md) em vez de tabela legível

---

## O que a skill mapeia

### 1. DocsPageLayout — `componentSlug` presente?

Sem `componentSlug` no `<DocsPageLayout>`, o observer global **não monta** — nada é rastreado. É o check mais crítico.

```bash
# React
grep -n "<DocsPageLayout" design-system-react/src/components/docs/<Slug>Docs.tsx
# Deve conter: componentSlug="<slug>"
```

### 2. Elementos interativos dentro da docs page

Para cada `*Docs.*`, escaneie:

**Interativos que precisam de `data-track*`:**
- `<button>` e `<Button>`
- `<a href="...">` (não âncoras internas `href="#..."` que já são do DocsNav)
- `<input type="checkbox">` e `<Switch>` (quando usado para controlar demos)
- Elementos com `onClick` / `@click` / `onclick`

**Exceções (NÃO devem ter `data-track*`):**
- Triggers de UI primitivo sendo **demonstrados** (ex: um `<Button>` mostrando a variant — é conteúdo, não evento de docs)
- Elementos dentro de um bloco de código exibido (`<pre>`)

**Regra de decisão:** tem `data-track*` quando o clique **informa sobre navegação nas docs**, não sobre o componente em si.

### 3. Section containers — coverage interno

Cada um dos 7 section containers (`DocsNav`, `DocsDemonstration`, `DocsVariants`, `DocsRelated`, `DocsImport`, `DocsNotes`, `DocsPageLayout`) precisa ter instrumentação base:

| Container | Coverage esperado |
|-----------|-------------------|
| DocsNav | 1+ `data-track="nav"` (botão de seção) |
| DocsDemonstration | Documenta padrão via JSDoc; conteúdo vem via slot |
| DocsVariants | 1+ `data-track="code"` (botão copiar de cada variant) |
| DocsRelated | 1+ `data-track="related"` (card de componente relacionado) |
| DocsImport | 1+ `data-track="code"` (botão copiar do snippet) |
| DocsNotes | `data-track="link"` em cada `<a href="http*">` externo |
| DocsPageLayout | Monta `mountDocsTracking` no root + passa `componentSlug` ao DocsNav |

### 4. `translations.json` — seção analytics documenta eventos?

Toda docs page deve ter `analytics.table.*` com os eventos **do produto** (ex: `button_click`, `dialog_open`) — NÃO os eventos `docs_*` (que são automáticos e documentados centralmente no guideline 07).

### 5. Stories — contaminação indevida

Stories (`*.stories.*`) **não** devem importar `@/lib/analytics` nem chamar `track()`. Analytics é responsabilidade da docs page.

---

## Processo

### Passo 1 — Descobrir docs pages alvo

Se `component-slug=all`: `Glob` por `design-system-*/src/components/docs/*Docs.*`. Extraia o slug do basename.

Se slug específico: valide que existe `*Docs.*` em pelo menos 1 stack.

### Passo 2 — Para cada docs page

**2.1 DocsPageLayout check:**

```bash
grep -nE "<DocsPageLayout|createDocsPageLayout" <Slug>Docs.*
```

Deve conter `componentSlug="<slug>"` (React/Vue/Svelte) ou `componentSlug: '<slug>'` (Basecoat). Se falta: **CRÍTICO** — o observer nunca monta.

**2.2 Eventos docs_* base:**

- `track('docs_page_view', ...)` — no mount com `locale` como dep
- `track('docs_section_viewed', ...)` — conectado ao IntersectionObserver

Ausência: **ALTO**.

**2.3 Elementos interativos sem data-track:**

Extrair cada `<button>`, `<Button>`, `<a href="http*">` e verificar se tem `data-track=`, `data-track-id=` (padrão de 3 partes), `data-track-label=`.

Para cada elemento sem data-track:
- Se está num bloco de **demonstração interativa** (dentro de `DocsDemonstration`, fora de `<pre>`): **ALTO** — deveria ter
- Se está num **link externo** em notas/UX writing: **MÉDIO** — deveria ter `data-track="link"`
- Se está num bloco de código de referência (dentro de `<pre>`): **OK** — é conteúdo

### Passo 3 — Consolidar output

**Formato tabela (default):**

```
# Audit Analytics — coverage report (2026-04-22)

## alert
Stacks: react, vue, svelte, basecoat

### React (design-system-react/src/components/docs/AlertDocs.tsx)
- DocsPageLayout componentSlug: ✓
- docs_page_view: ✓ (linha 125)
- docs_section_viewed: ✓ (linha 142)
- Elementos interativos sem data-track: 2
  - [ALTO] Button linha 289 "Destructive" (dentro de DocsDemonstration)
  - [MÉDIO] <a> linha 401 "React Spectrum" (link externo em notes)

### Vue (...)
...

### Svelte (...)
...

### Basecoat (...)
...

## Resumo global
- 12 componentes escaneados
- 8 com cobertura completa (✓)
- 4 com gaps:
  - calendar: DocsPageLayout sem componentSlug (crítico)
  - breadcrumb: 1 link externo sem data-track
  - card: 2 botões de demo sem data-track
  - avatar: docs_section_viewed faltando
```

**Formato JSON (`--json`):**

```json
{
  "alert": {
    "stacks": {
      "react": {
        "file": "design-system-react/src/components/docs/AlertDocs.tsx",
        "docs_page_layout_componentSlug": true,
        "docs_page_view": true,
        "docs_section_viewed": true,
        "missing_tracking": [
          { "line": 289, "element": "Button", "text": "Destructive", "severity": "high", "suggested_id": "alert:demo:variant-destructive" },
          { "line": 401, "element": "a", "text": "React Spectrum", "severity": "medium", "suggested_id": "alert:notes:react-spectrum-link" }
        ]
      }
    }
  }
}
```

---

## Regras

- **Read-only absoluto** — nunca edite arquivos, nunca commite
- **Sugira IDs** — para cada violação, gere um `suggested_id` no padrão `{slug}:{section}:{element}` com o que extrai do texto do elemento
- **Severidade**:
  - **CRÍTICO**: `DocsPageLayout` sem `componentSlug` (nada rastreia)
  - **ALTO**: `docs_page_view`/`docs_section_viewed` ausente; elemento interativo em bloco de demo sem `data-track*`
  - **MÉDIO**: link externo sem `data-track="link"`
  - **BAIXO**: `data-track-label` ausente (observer cai para `textContent`)
- **Ignorar** stories (`*.stories.*`) e UI primitives (`components/ui/*`) — a skill só audita docs pages
- **Ignorar** conteúdo dentro de `<pre>`, `<code>` block renderizado (não confundir com `<code>` inline)

---

## Saída

Ao terminar, não commit nada. Apenas imprima o relatório (tabela ou JSON conforme `--json`). A pipeline pode consumir o JSON em `FIXES-NEEDED.md`.
