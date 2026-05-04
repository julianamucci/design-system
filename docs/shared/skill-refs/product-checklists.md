# Product (Sync Guidelines) — Checklists detalhados

Referência usada por `/product`. Inclui passos detalhados dos modos `--from-content` e `--from-code`. **Leia apenas se precisar do detalhe** — para casos típicos siga a skill principal.

---

## Modo `--from-content`

### Passo 1 — Inventário do `translations.json`

#### 1.1 Seções de primeiro nível
Listar seções presentes (`demonstration`, `anatomy`, `usage`, `variants`, `states`, `props`, `tokens`, `accessibility`, `related`, `notes`, `analytics`, `testes`). Comparar com checklist obrigatório de `08-docs-pages-foundations.md` §0.

#### 1.2 Variantes
```bash
grep -oP '"variants\.(items|styles)\.\K[^"]+' docs/shared/content/${slug}/translations.json | sort -u
grep -A 20 "cva(" design-system-react/src/components/ui/${slug}*.tsx
```
- Variante no UI mas ausente no JSON = gap do ux-writer (reportar).
- Variante no JSON mas ausente no UI = erro de conteúdo (reportar).

#### 1.3 Tamanhos
Extrair `variants.sizes.*` e `variants.sizes.*Use`. Cada tamanho deve ter par `{key}` + `{key}Use`.

#### 1.4 Props
Extrair `props.table.*`. Comparar com:
```bash
grep -A 5 "interface.*Props" design-system-react/src/components/ui/${slug}*.tsx
```

#### 1.5 Tokens
Extrair `tokens.table.*`. Verificar tokens CSS no componente:
```bash
grep -oP 'var\(--[a-z-]+\)' design-system-react/src/components/ui/${slug}*.tsx
```

#### 1.6 Testes
- `testes.functional` com `item1..N` (cada com `action`, `result`, `priority`)
- `testes.accessibility` com `item1..N`
- `testes.visual` com `item1..N` (cada com `story`, `priority`)

#### 1.7 SEO (3 idiomas)
- `seo.title` ≤60 chars
- `seo.description` ≤155 chars
- `seo.aiSummary`, `seo.aiEntities`, `seo.aiIntent`

#### 1.8 Navegação
`nav.*` cobre todas as seções presentes no JSON.

### Passo 1.9 — Validar contra guideline de categoria

Identificar categoria e ler o arquivo correspondente (04–10). Validar:

| Check | O que verificar |
|---|---|
| Variantes corretas | JSON existe no componente e bate com guideline |
| Estados corretos | `disabled`/`loading`/etc. correspondem ao previsto na guideline |
| Props corretas | Nomes/tipos batem com guideline — sem props inventadas |
| Regras de API | Nenhuma regra violada (ex: Alert não tem variant `warning` via prop — usa `className`) |
| UX Writing | Linguagem condizente com a categoria |

Discrepância JSON ↔ guideline = gap do ux-writer.

### Passo 2 — Ler guidelines existentes

Foco em `11-documentacao-componentes.md` de cada stack — é o que dev-skills consultam. Anotar gaps.

### Passo 3 — Tabela de gaps

```
| Seção | Presente? | Coberta por guideline 08? | Coberta por guideline 11 (stack)? |
| Variante | translations.json | Componente UI | Status |
| Prop | translations.json | Componente UI | Status |
| Validação i18n | Status |
```

### Passo 4 — O que atualizar (se não `--dry-run`)

Atualizar:
- **`08-docs-pages-foundations.md`** — só se o componente revela padrão estrutural NOVO não coberto. Nunca alterar padrões existentes com base em conteúdo (use `--from-code` para isso).
- **`11-documentacao-componentes.md` (por stack)** — adicionar/atualizar a seção do componente: seções que a docs page renderiza, chaves consumidas, contagem de variantes/tamanhos/props/tokens, divergências do padrão Alert.
- **`01-acessibilidade.md`** — se o JSON documenta critérios WCAG não cobertos.
- **`06-seo-geo.md`** — se o padrão de title/description diverge do documentado.

NÃO alterar no `--from-content`:
- Padrões visuais (classes, tipografia, cores) — vêm do código
- Exemplos de renderização — definidos pelo guideline 08
- Regras de segurança/performance/analytics — independem do conteúdo

---

## Modo `--from-code`

### Passo 1 — Extrair padrões do código

Para cada docs page nas 4 stacks:

#### 1.1 Tipografia
```bash
grep -n "text-\[.*px\]\|text-xs\|text-sm\|text-base\|text-lg\|text-xl" \
  design-system-react/src/components/docs/${Slug}Docs.tsx
```
Classificar por contexto: `<table>`, `<td>`, `<th>`, `<h2>`, `<h3>`, descriptions, badges, código.

#### 1.2 Hierarquia HTML
```bash
grep -n "<h[1-6]\|<section\|<table\|role=" \
  design-system-react/src/components/docs/${Slug}Docs.tsx
```
Documentar: heading levels, estrutura `section > h2 > h3`, roles em não-semânticos.

#### 1.3 Wrappers de tabela
```bash
grep -B2 "<table" design-system-react/src/components/docs/${Slug}Docs.tsx
```

#### 1.4 Estilos de badges
```bash
grep -n "Badge\|inline-flex.*rounded-md.*border" design-system-react/src/components/docs/${Slug}Docs.tsx
```

#### 1.5 Padrões de navegação
```bash
grep -n "window.top\|location.href\|role=\"link\"" design-system-react/src/components/docs/${Slug}Docs.tsx
```

#### 1.6 Estrutura do translations.json
```bash
cat docs/shared/content/${slug}/translations.json | grep -oP '^\s{4}"\K[^"]+'
```

### Passo 2 — Ler guidelines

Para cada seção que menciona padrões visuais/estruturais:
- O que a guideline diz vs o que o código faz
- Se há discrepância

### Passo 3 — Tabela de discrepâncias

```
| Guideline | Seção | Diz | Código faz | Ação |
| 08 §11 | Size cards | text-[10px] | text-[11px] | Atualizar |
```

### Passo 4 — Atualizar guidelines

Aplicar correções diretamente no `08-docs-pages-foundations.md` e nos `11-documentacao-componentes.md` por stack.

---

## Padrões de Output (relatório)

### Header
```
## Sync Guidelines — {slug} ({mode})

Componente: {slug}
Modo: --from-content | --from-code
Dry-run: yes | no
```

### Tabelas
- Inventário de seções
- Variantes vs UI
- Props vs UI
- Validação i18n
- Discrepâncias guideline ↔ código (modo `--from-code`)

### Resumo
```
### Gaps detectados: X
### Guidelines atualizadas: Y
### Score: X/10
```
