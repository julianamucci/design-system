# Analytics — Arquitetura e Catálogo

Referência usada por `/analytics`. Documenta o sistema de tracking automático via `data-track*` e o catálogo completo de eventos GA4. **Leia apenas se precisar do detalhe completo** — para casos típicos de instrumentação, basta seguir `AlertDocs.tsx` como template.

---

## Princípio central: componente UI nunca chama `track()`

Tracking nas docs pages é **automático**:

1. **Atributos HTML** nos elementos interativos:
   - `data-track="{type}"` — categoria (nav | demo | variant | code | related | link)
   - `data-track-id="{component}:{section}:{element}"` — identificador estruturado em 3 partes
   - `data-track-label="{texto visível}"` — texto do botão/link (opcional; cai para `textContent`)

2. **Observer global** em `src/lib/docs-tracking.ts` (1 por stack) — monta um único click listener no root do `DocsPageLayout` e mapeia cada `data-track` para evento GA4.

3. **Catálogo tipado** em `src/lib/analytics.ts` — todos `docs_*` têm shape definido; `track()` é type-safe.

### Configuração GA4

- **Measurement ID**: `G-K0BQWVR1RG`
- **Script**: injetado em `.storybook/manager-head.html` (manager, não iframe)
- **Flow**: iframe dispara → `window.top.gtag` do manager → GA4

---

## Eventos catalogados

### Automáticos (mount e scroll)

| Evento | Disparado em | Payload |
|---|---|---|
| `docs_page_view` | Mount de `*Docs.*` (1x por locale) | `{ component_name, locale, page_title }` |
| `docs_section_viewed` | Seção entra no viewport (IntersectionObserver) | `{ component_name, section_id, locale }` |
| `language_switched` | LanguageSwitcher troca idioma | `{ previous_language, new_language }` |

### De interação (via `data-track*`)

| Evento | `data-track` | Payload | Onde aplicar |
|---|---|---|---|
| `docs_nav_click` | `nav` | `{ component, section_id, label }` | DocsNav (já instrumentado) |
| `docs_demo_click` | `demo` | `{ component, element_id, label }` | Botões/triggers em `DocsDemonstration` |
| `docs_variant_click` | `variant` | `{ component, variant_name, label }` | Cards/botões em `DocsVariants` |
| `docs_code_copy` | `code` | `{ component, snippet_id }` | Botões "Copiar" de blocos de código |
| `docs_related_click` | `related` | `{ component, target_slug, label }` | Cards do `DocsRelated` |
| `docs_link_click` | `link` | `{ component, section_id, href }` | Links externos em notas/UX writing |

---

## Padrão de `data-track-id`

**Sempre 3 partes separadas por `:`** — `{component}:{section}:{element}`.

Exemplos corretos:
- `alert:nav:anatomia` — link do DocsNav para seção "anatomia"
- `alert:demo:variant-destructive` — botão que troca para variant destructive no playground
- `alert:code:copy-destructive` — botão copiar do snippet da variant destructive
- `alert:related:badge` — card de Badge nos relacionados

**O 3º segmento (element) deve ser único dentro da seção** — distingue múltiplos elementos do mesmo tipo.

---

## Regra de decisão: "tem `data-track*`?"

Tem `data-track*` quando o clique **informa sobre navegação nas docs**, não sobre o componente em si.

**Tem:**
- `<button>` / `<Button>` em demonstrações interativas
- `<a href="http*">` (links externos em notes/UX writing)
- `<input type="checkbox">` / `<Switch>` controlando demos
- Elementos com `onClick` / `@click` / `onclick`

**NÃO tem:**
- Triggers de UI primitivo sendo **demonstrados** (ex: Button mostrando variant é conteúdo)
- Elementos dentro de bloco de código (`<pre>`)
- Âncoras internas (`href="#..."` no DocsNav já instrumentado)
- Stories (`*.stories.*`) — analytics é responsabilidade da docs page

---

## Coverage esperado por section container

| Container | Coverage |
|---|---|
| DocsNav | 1+ `data-track="nav"` (botão de seção) |
| DocsDemonstration | Conteúdo via slot (instrumentado pela docs page) |
| DocsVariants | 1+ `data-track="code"` (botão copiar de cada variant) |
| DocsRelated | 1+ `data-track="related"` (card de componente relacionado) |
| DocsImport | 1+ `data-track="code"` (botão copiar do snippet) |
| DocsNotes | `data-track="link"` em cada `<a href="http*">` |
| DocsPageLayout | Monta `mountDocsTracking` no root + passa `componentSlug` ao DocsNav |

---

## Checklist Infra por Stack

- [ ] `src/lib/docs-tracking.ts` existe e exporta `mountDocsTracking`
- [ ] `src/lib/analytics.ts` tem os 6 eventos `docs_{nav,demo,variant,code,related,link}_click|copy` tipados
- [ ] `DocsPageLayout` importa `mountDocsTracking`, aceita `componentSlug?` e monta observer no mount
- [ ] `DocsNav` aceita `componentSlug?` e emite `data-track="nav"` com `data-track-id` estruturado
- [ ] `.storybook/manager-head.html` tem snippet GA4

---

## Checklist por docs page

- [ ] `<DocsPageLayout componentSlug="<slug>" ... />` — **obrigatório** (sem isso o observer NÃO monta = nada rastreia)
- [ ] `track('docs_page_view', ...)` no mount com `locale` como dep
- [ ] `track('docs_section_viewed', ...)` via IntersectionObserver
- [ ] **Não** chama `track()` para cliques — passam pelo observer automático
- [ ] `translations.json` tem `analytics.table.*` com eventos **do produto** (ex: `button_click` para Button) — NÃO os `docs_*` (automáticos)

---

## Audit Read-only — Severidades

| Severidade | Causa |
|---|---|
| **CRÍTICO** | `DocsPageLayout` sem `componentSlug` (nada rastreia) |
| **ALTO** | `docs_page_view`/`docs_section_viewed` ausente; elemento interativo em bloco de demo sem `data-track*` |
| **MÉDIO** | link externo sem `data-track="link"` |
| **BAIXO** | `data-track-label` ausente (observer cai para `textContent`) |

---

## Output JSON do audit (`--json`)

```json
{
  "<slug>": {
    "stacks": {
      "react": {
        "file": "design-system-react/src/components/docs/<Slug>Docs.tsx",
        "docs_page_layout_componentSlug": true,
        "docs_page_view": true,
        "docs_section_viewed": true,
        "missing_tracking": [
          {
            "line": 289,
            "element": "Button",
            "text": "Destructive",
            "severity": "high",
            "suggested_id": "<slug>:demo:variant-destructive"
          }
        ]
      }
    }
  }
}
```

---

## Regras Absolutas

- **NUNCA** adicionar tracking dentro de UI primitivo (`Button.tsx`, `Dialog.tsx`, `Card.tsx`)
- **NUNCA** chamar `track()` em handlers de docs page para cliques — use `data-track*` + observer global
- **NUNCA** usar nomes de eventos em português ou camelCase
- **SEMPRE** `data-track-id` com 3 partes (`component:section:element`)
- **SEMPRE** `track()` importado de `@/lib/analytics`, nunca `gtag()` direto
- **SEMPRE** rastreio no-op silencioso se GA4 não carregado (ad blockers, SSR)
- **Dados sensíveis** (emails, CPFs, conteúdo de input) nunca entram no payload
