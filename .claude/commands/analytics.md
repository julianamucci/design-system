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
- **`stack`** (opcional) — `react`/`vue`/`svelte`/`vanilla`/`angular`/`all` (padrão `all`)
- **`--audit`** (opcional) — modo read-only; reporta gaps sem editar/commitar
- **`--json`** (opcional, com `--audit`) — emite JSON consumível por `FIXES-NEEDED.md`

---

## Fonte de Referência

`docs/shared/skill-refs/analytics-arch.md` — arquitetura completa, catálogo de eventos, padrão de `data-track-id`, severidades, output JSON. **Consulte se precisar do detalhe**.

Templates:
- `nortear-design-system-vanilla/src/components/docs/AlertDocs.ts` — implementação modelo (referência de contrato; para sintaxe, veja o `AlertDocs` da própria stack)
- `nortear-design-system-react/src/lib/docs-tracking.ts` — observer global
- `nortear-design-system-react/src/lib/analytics.ts` — catálogo tipado

---

## Processo

### Passo 0 — Audit determinístico (só em invocação direta)

**Se o prompt já trouxe o conteúdo de `.pipeline-context/scan-<slug>.json`** — é o pipeline chamando, o script já rodou no Passo 4 dele. Filtre as entradas com `category: "analytics"` e **não rode de novo** (o scan do pipeline é de todas as categorias).

**Se não trouxe** — foi invocação direta (`/analytics <slug>`). Rode:

```bash
node scripts/audit.mjs <slug> --category analytics --json
```

O output tem duas partes:
- **`<slug>`** — tracking errado presente: UI primitive importando `@/lib/analytics`, eventos não tipados.
- **`_infra`** (slug-independente) — mecanismo de tracking ausente: `DocsPageLayout` sem `mountDocsTracking` ou com mount condicionado ao `componentSlug` (deve montar sempre — o slug é derivado do `?id=` do iframe), `DocsDemonstration` sem `data-track-container`, páginas page-level (chamam `useSeoEffect`/`applySeo`) que não montam o observer, e **texto traduzido em payload** (`i18n_text_in_payload`).

Qualquer violação em `_infra` tem prioridade sobre gaps por página: corrija a infra primeiro (um fix cobre todas as páginas).

### Passo 1 — Coletar arquivos em paralelo

**Glob** (5 paralelos): docs pages — `nortear-design-system-{react,vue,svelte,vanilla,angular}/src/components/docs/<Slug>Docs.*`

**Read** (4 paralelos): cada docs page

**Read** (4 paralelos): infraestrutura por stack (apenas para auditar infra; pular se for fix em docs page específica)
- `src/lib/docs-tracking.ts`
- `src/lib/analytics.ts`
- `src/components/docs/shared/sections/DocsPageLayout.{tsx,vue,svelte,ts}`
- `src/components/docs/shared/DocsNav.{tsx,vue,svelte,ts}`

**Grep** (1): `data-track=` para coverage geral

### Passo 2 — Analisar (1 passagem por arquivo)

**Regra de payload — valores estáveis, nunca texto traduzido.** O payload identifica *o que* foi acionado, não *como o texto aparece na tela*. Mandar string localizada fragmenta o mesmo evento em um valor por locale no GA4 e inutiliza a agregação.

| Em vez de | Use |
|---|---|
| `label: t('demonstration.labels.dashboard')` | `label: 'dashboard'` (chave/slug do item) |
| `label: t('demonstration.labels.rightLabel')` | `label: side` (`'right'`, `'left'`…) |
| `action: t('demonstration.labels.apply')` | `action: 'apply'` |
| `trigger_label: tContent('...')` | a chave estável correspondente |

Vale para todos os campos livres (`label`, `action`, `action_label`, `destination`, `task`, `trigger_label`, `field_name`). `destination` acompanha a chave (`'#dashboard'`). Campos que já são estáveis por natureza (`component`, `variant`, `side`, `reason`, `trigger`) não têm risco. **Única exceção**: `page_title` no `docs_page_view` — campo padrão do GA4, human-readable por definição, e o payload já carrega `locale`.

Contexto do mecanismo (pós-fix sistêmico):
- O observer monta **sempre** que a página usa `DocsPageLayout` — `componentSlug` é opcional e derivado do `?id=` do iframe (`ui-button--docs` → `button`). Passe o prop apenas quando o slug derivado estiver errado (ex.: id de story fora do padrão `ui-<slug>--docs`).
- `DocsDemonstration` é **auto-instrumentada** (`data-track-container`): cliques em elementos interativos dentro da demo são resolvidos e rastreados sem instrumentação por página. `data-track*` manual em elementos internos tem precedência — use para labels/ids mais ricos, não por obrigação.
- Páginas **fora** do `DocsPageLayout` (foundation pages, standalone) precisam chamar `mountDocsTracking` diretamente no mount, com cleanup no unmount.

Para cada docs page, verificar:

1. **Página monta o observer?** — via `DocsPageLayout` ou `mountDocsTracking` direto (CRÍTICO; o `_infra` do Passo 0 já aponta as ausências)
2. **`docs_page_view`** no mount com `locale` como dep
3. **`docs_section_viewed`** via IntersectionObserver
4. **Interativos fora de `DocsDemonstration`** (notas, tabelas, cards custom) sem `data-track*` (ALTO/MÉDIO conforme `analytics-arch.md`)
4b. **Payloads com texto traduzido** — ver "Regra de payload" acima (o `_infra` do Passo 0 já aponta via `i18n_text_in_payload`)
5. **Stories com `track()` direto** — contaminação indevida (precisa remover)
6. **`translations.json` `analytics.table.*`** com eventos do produto (não `docs_*`)

### Passo 3 — Modo audit ou fix

**`--audit`**: reportar tabela ou JSON (formato em `analytics-arch.md`). Não editar.

**Fix-mode** (default):
- Corrigir violações `_infra` primeiro (mount incondicional no layout, `data-track-container` na demonstração, `mountDocsTracking` em páginas fora do layout)
- Adicionar `data-track`, `data-track-id` (3 partes), `data-track-label` em interativos fora de `DocsDemonstration`
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
