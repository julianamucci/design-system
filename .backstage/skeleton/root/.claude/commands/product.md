---
description: Sincroniza guidelines com a fonte de verdade — código existente (padrão) ou translations.json gerado pelo ux-writer (--from-content)
argument-hint: <component-slug> [--from-content] [--dry-run]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Sync Guidelines

Você é um auditor de documentação técnica. Seu trabalho é garantir que as guidelines do projeto reflitam fielmente a fonte de verdade e que as skills de desenvolvimento tenham regras atualizadas antes de criar código.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (obrigatório) — slug do componente de referência (ex: `button`) ou `all` para auditoria completa
- **`--from-content`** (opcional) — usa o `translations.json` como fonte de verdade (fluxo pré-código: ux-writer → sync → dev)
- **`--from-code`** (padrão) — usa as docs pages implementadas como fonte de verdade (fluxo pós-código)
- **`--dry-run`** (opcional) — apenas relata as discrepâncias sem corrigir

---

## Dois Modos de Operação

### Modo `--from-code` (padrão)

**Quando usar**: componente já tem docs pages implementadas. O código é a fonte de verdade.

Fluxo: `*Docs.tsx` existentes → comparar com guidelines → atualizar guidelines

### Modo `--from-content`

**Quando usar**: o ux-writer acabou de gerar/atualizar o `translations.json` e as guidelines precisam absorver as decisões de conteúdo **antes** das skills de dev criarem o código.

Fluxo: `translations.json` + guidelines estruturais (08) → atualizar guidelines por stack (11-documentacao-componentes) com as seções, chaves e estrutura do novo componente

**Este modo é parte do pipeline de criação**:
1. `/ux-writer {slug}` — gera translations.json completo
2. `/product {slug} --from-content` — atualiza guidelines com base no conteúdo gerado
3. `/dev-react {slug}`, `/dev-vue {slug}`, etc. — constroem código seguindo guidelines atualizadas
4. `/product {slug}` — (opcional) ajuste fino após o código existir

---

## Fontes de Verdade

### Modo `--from-code`

1. `design-system-react/src/components/docs/{Slug}Docs.tsx` — implementação React (fonte primária)
2. `design-system-vue/src/components/docs/{Slug}Docs.vue`
3. `design-system-svelte/src/components/docs/{Slug}Docs.svelte`
4. `nortear-design-system/src/components/docs/{Slug}Docs.ts`
5. `docs/shared/content/{slug}/translations.json` — estrutura de chaves e locales
6. **Guideline de categoria** — leia o arquivo correspondente ao componente (ver tabela na seção `--from-content` acima). Usado para verificar se as props e variantes documentadas na docs page batem com as regras canônicas do projeto.

### Modo `--from-content`

1. `docs/shared/content/{slug}/translations.json` — conteúdo gerado pelo ux-writer (fonte primária)
2. `design-system-react/src/components/ui/{slug}.tsx` (ou `{slug}/index.tsx`) — componente UI para extrair variantes, props, tamanhos
3. **Guideline de categoria** (obrigatório) — leia o arquivo correspondente ao componente:

| Categoria | Arquivo | Componentes |
|-----------|---------|-------------|
| Layout | `design-system-react/guidelines/04-layout-components.md` | Card, Sidebar, ScrollArea, AspectRatio, Resizable, Separator |
| Navegação | `design-system-react/guidelines/05-navigation-components.md` | Breadcrumb, Menubar, NavigationMenu, Pagination, Stepper, Tabs |
| Formulário | `design-system-react/guidelines/06-form-components.md` | Button, Input, Textarea, Select, DatePicker, Calendar, Checkbox, RadioGroup, Switch, Slider, Form, InputOTP |
| Feedback | `design-system-react/guidelines/07-feedback-components.md` | Alert, Badge, Progress, Skeleton, Sonner/Toast |
| Display | `design-system-react/guidelines/08-display-components.md` | Avatar, Table, Chart, Carousel, DataTable |
| Disclosure | `design-system-react/guidelines/09-disclosure-components.md` | Accordion, Collapsible, Sheet, Drawer |
| Overlay | `design-system-react/guidelines/10-overlay-components.md` | Dialog, AlertDialog, DropdownMenu, Popover, Tooltip, ContextMenu, Command, HoverCard |

4. `docs/shared/guidelines/08-docs-pages-foundations.md` — padrões estruturais (referência, não alvo de edição)
5. `design-system-react/src/components/docs/AlertDocs.tsx` — implementação de referência para padrões visuais

### Guidelines (a atualizar — ambos os modos)

**Compartilhadas** (afetam todas as stacks):
- `docs/shared/guidelines/08-docs-pages-foundations.md` — padrões estruturais de docs pages
- `docs/shared/guidelines/01-acessibilidade.md` — critérios WCAG
- `docs/shared/guidelines/05-tom-de-voz.md` — regras de escrita
- `docs/shared/guidelines/06-seo-geo.md` — metatags e SEO
- `docs/shared/guidelines/07-analytics.md` — eventos GA4
- `docs/shared/guidelines/09-seguranca-xss.md` — sanitização HTML
- `docs/shared/guidelines/10-performance.md` — performance frontend
- `docs/shared/guidelines/11-consistencia-cross-stack.md` — consistência entre stacks

**Por stack** (apenas se existirem regras específicas de docs):
- `design-system-react/guidelines/11-documentacao-componentes.md`
- `design-system-vue/guidelines/11-documentacao-componentes.md`
- `design-system-svelte/guidelines/11-documentacao-componentes.md`
- `nortear-design-system/guidelines/11-documentacao-componentes.md`

---

## Processo — Modo `--from-content`

### Passo 1 — Ler o translations.json gerado

Leia `docs/shared/content/{slug}/translations.json` e extraia:

**1.1 Inventário de seções**

Liste todas as seções de primeiro nível presentes no JSON (ex: `demonstration`, `anatomy`, `usage`, `variants`, `states`, `props`, `tokens`, `accessibility`, `related`, `notes`, `analytics`, `testes`).

Compare com o checklist obrigatório em `08-docs-pages-foundations.md` §0 — alguma seção obrigatória está faltando?

**1.2 Estrutura de variantes**

```bash
# Extrair nomes de variantes do translations.json
grep -oP '"variants\.(items|styles)\.\K[^"]+' docs/shared/content/${slug}/translations.json | sort -u
```

Compare com as variantes reais do componente UI:
```bash
grep -A 20 "cva(" design-system-react/src/components/ui/${slug}*.tsx 2>/dev/null
```

Variante no componente UI mas ausente no translations.json = gap do ux-writer (reportar).
Variante no translations.json mas ausente no componente UI = erro no conteúdo (reportar).

**1.3 Estrutura de tamanhos**

Extraia as chaves `variants.sizes.*` e `variants.sizes.*Use`. Cada tamanho deve ter par `{key}` + `{key}Use`.

**1.4 Estrutura de props**

Extraia as chaves `props.table.*`. Compare com as props reais do componente:
```bash
grep -A 5 "interface.*Props" design-system-react/src/components/ui/${slug}*.tsx 2>/dev/null
```

**1.5 Estrutura de tokens**

Extraia as chaves `tokens.table.*`. Verifique que os tokens CSS listados existem no componente:
```bash
grep -oP 'var\(--[a-z-]+\)' design-system-react/src/components/ui/${slug}*.tsx 2>/dev/null
```

**1.6 Estrutura de testes**

Verifique que existem as 3 sub-seções obrigatórias:
- `testes.functional` com `item1`…`itemN` (cada um com `action`, `result`, `priority`)
- `testes.accessibility` com `item1`…`itemN`
- `testes.visual` com `item1`…`itemN` (cada um com `story`, `priority`)

**1.7 SEO**

Verifique que existe `seo.title` (≤60 chars), `seo.description` (≤155 chars), `seo.aiSummary`, `seo.aiEntities`, `seo.aiIntent` nos 3 idiomas.

**1.8 Navegação**

Verifique que `nav.*` tem labels para todas as seções presentes no JSON.

### Passo 1.9 — Validar conteúdo contra a guideline de categoria

Identifique a categoria do componente e leia o arquivo correspondente (04–10). Valide:

| Check | O que verificar |
|-------|----------------|
| Variantes corretas | As variantes no translations.json existem no componente e batem com as descritas na guideline |
| Estados corretos | Os estados documentados (disabled, loading, etc.) correspondem ao que a guideline prevê para este componente |
| Props corretas | Nomes e tipos das props batem com a guideline — nenhuma prop inventada |
| Regras de API | Nenhuma regra da guideline de categoria foi violada no conteúdo (ex: Alert não tem variante `warning` como prop — usa `className`) |
| UX Writing | Linguagem/terminologia condizente com a categoria do componente |

Qualquer discrepância entre translations.json e a guideline de categoria é um **gap do ux-writer** e deve ser reportado em "Validação do conteúdo".

### Passo 2 — Ler guidelines existentes

Leia as guidelines compartilhadas e por stack. Para cada seção, anote se ela cobre as necessidades do novo componente ou precisa de atualização.

**Foco em `11-documentacao-componentes.md` de cada stack**: este é o guideline que as skills de dev consultam diretamente. Se ele não menciona o padrão para uma seção que o novo componente tem (ex: "cenários de uso" com tabela de 3 colunas), a skill de dev não saberá como implementá-la.

### Passo 3 — Comparar e relatar

Gere uma tabela de gaps e atualizações necessárias:

```
## Análise de Conteúdo → Guidelines — {slug}

### Seções no translations.json
| Seção | Presente? | Coberta pela guideline 08? | Coberta pela guideline 11 (stack)? |
|-------|-----------|---------------------------|-----------------------------------|
| anatomy | ✅ | ✅ §8 | ✅ |
| usage.scenarios | ✅ | ❌ não documentada | ❌ |
| testes | ✅ | ✅ §9 | ✅ |

### Variantes vs componente UI
| Variante | translations.json | Componente UI | Status |
|----------|-------------------|---------------|--------|
| default | ✅ | ✅ | OK |
| outline | ✅ | ✅ | OK |
| fancy | ✅ | ❌ | ⚠️ Não existe no componente |

### Props vs componente UI
| Prop | translations.json | Componente UI | Status |
|------|-------------------|---------------|--------|

### Chaves de tradução — completude
| Validação | Status |
|-----------|--------|
| 3 idiomas completos | ✅/❌ |
| Todas as chaves presentes em pt-BR existem em en e es | ✅/❌ |
| seo.title ≤60 chars (3 idiomas) | ✅/❌ |
| seo.description ≤155 chars (3 idiomas) | ✅/❌ |
| nav.* cobre todas as seções | ✅/❌ |
```

### Passo 4 — Atualizar guidelines (se não for `--dry-run`)

**O que atualizar no modo `--from-content`:**

1. **`08-docs-pages-foundations.md`** — apenas se o novo componente revela um padrão estrutural **não coberto** (ex: uma seção nova que não existe no Alert). Nunca altere padrões existentes com base em conteúdo — apenas com base em código (`--from-code`).

2. **`11-documentacao-componentes.md` (por stack)** — adicionar ou atualizar a seção do componente:
   - Lista de seções que a docs page deve renderizar
   - Chaves do translations.json que cada seção consome
   - Número de variantes, tamanhos, props, tokens (para loops de iteração)
   - Seções específicas que divergem do padrão Alert (ex: componente com estados loading/disabled)

3. **`01-acessibilidade.md`** — se o translations.json documenta critérios WCAG que a guideline não cobre para este tipo de componente.

4. **`06-seo-geo.md`** — se o padrão de title/description do novo componente diverge do formato documentado.

**O que NÃO alterar no modo `--from-content`:**
- Padrões visuais (classes CSS, tipografia, cores) — esses vêm do código, não do conteúdo
- Exemplos de renderização — esses são definidos pelo guideline 08 e validados pelo modo `--from-code`
- Regras de segurança, performance, analytics — não dependem do conteúdo

---

## Processo — Modo `--from-code`

### Passo 1 — Extrair padrões do código

Para o componente especificado, leia as 4 docs pages e extraia:

**1.1 Tipografia — classes de tamanho de fonte**

```bash
# Extrair todas as classes de font-size usadas em elementos de conteúdo
grep -n "text-\[.*px\]\|text-xs\|text-sm\|text-base\|text-lg\|text-xl" \
  design-system-react/src/components/docs/${Slug}Docs.tsx
```

Classifique cada ocorrência por contexto:
- `<table>` — qual font-size está no `<table>`?
- `<td>` — herda do `<table>` ou tem override?
- `<th>` — herda ou tem override?
- `<h2>`, `<h3>` — quais classes de tipografia?
- Descriptions (`<p>` sob títulos de seção)
- Badges / labels decorativos
- Código (`<code>`, `<pre>`)
- Texto de cards (variantes, tamanhos)

**1.2 Hierarquia HTML**

```bash
grep -n "<h[1-6]\|<section\|<table\|role=" \
  design-system-react/src/components/docs/${Slug}Docs.tsx
```

Documente:
- Quais heading levels são usados e onde
- Estrutura section > h2 > h3
- Roles em elementos não-semânticos

**1.3 Wrappers de tabela**

```bash
grep -B2 "<table" design-system-react/src/components/docs/${Slug}Docs.tsx
```

Documente o padrão de wrapper atual (classes, nesting).

**1.4 Estilos de badges e tags**

```bash
grep -n "Badge\|inline-flex.*rounded-md.*border" \
  design-system-react/src/components/docs/${Slug}Docs.tsx
```

Documente: classes, tamanho de fonte, cores por estado.

**1.5 Padrões de navegação**

```bash
grep -n "window.top\|location.href\|role=\"link\"" \
  design-system-react/src/components/docs/${Slug}Docs.tsx
```

**1.6 Estrutura do translations.json**

```bash
# Listar todas as chaves de primeiro nível
cat docs/shared/content/${slug}/translations.json | grep -oP '^\s{4}"\K[^"]+' | head -30
```

### Passo 2 — Ler guidelines existentes

Leia cada guideline listada nas fontes. Para cada seção que menciona padrões visuais ou estruturais, anote:

- O que a guideline diz (classes CSS, estrutura HTML, chaves de tradução)
- O que o código realmente faz
- Se há discrepância

### Passo 3 — Comparar e relatar

Gere uma tabela de discrepâncias:

```
## Discrepâncias Encontradas

| Guideline | Seção | Diz | Código faz | Ação |
|-----------|-------|-----|-----------|------|
| 08 §11 | Size cards | text-[10px] no nome | text-[11px] no nome | Atualizar |
| 08 §12 | Props table td | text-xs explícito | herda text-sm do table | Atualizar |
```

### Passo 4 — Corrigir (se não for `--dry-run`)

Para cada discrepância, edite a guideline para refletir o código atual.

**Regras de edição:**
- Nunca altere o código — apenas as guidelines
- Mantenha o tom prescritivo ("Use X", "O padrão é Y")
- Inclua o exemplo de referência atualizado quando houver bloco de código
- Se uma regra mudou de valor (ex: `text-[10px]` → `text-[11px]`), atualize tanto a descrição quanto o bloco de código de exemplo
- Se uma regra foi removida (ex: td não tem mais text-xs), explique o novo padrão (herança)
- Mantenha a numeração de seções estável — não renumere

---

## Checklist por Seção de Guideline

### `08-docs-pages-foundations.md`

| Seção | O que verificar |
|-------|----------------|
| §0 Checklist | Itens obrigatórios correspondem ao que as docs pages realmente fazem? |
| §8 Anatomia | Estrutura HTML e classes no bloco de código de referência |
| §9 Testes | Estrutura de sub-seções, classes em td/badges, padrão de iteração |
| §11 Size cards | Classes de tipografia do nome, descrição e uso |
| §12 Props table | Colunas, classes por coluna, interface, extensibilidade |
| §13 Tokens table | Colunas, classes por coluna, wrapper |

### `01-acessibilidade.md`

| O que verificar |
|----------------|
| Critérios WCAG listados correspondem ao que está na seção "Acessibilidade" da docs page? |
| Itens de teclado documentados batem com o código? |

### `06-seo-geo.md`

| O que verificar |
|----------------|
| Formato de title/description bate com o translations.json? |
| Hook `useSeoEffect` é chamado da forma documentada? |

### `07-analytics.md`

| O que verificar |
|----------------|
| Eventos listados no catálogo incluem os eventos da docs page (`docs_page_view`, `docs_section_viewed`, etc.)? |

### `09-seguranca-xss.md`

| O que verificar |
|----------------|
| Todos os padrões de `dangerouslySetInnerHTML`/`v-html`/`{@html}`/`innerHTML` usam `sanitizeHtml`? |
| A allowlist de tags/atributos cobre o que o `translations.json` realmente usa? |

### `11-consistencia-cross-stack.md`

| O que verificar |
|----------------|
| Padrões de classes documentados batem com os 4 componentes de docs? |
| Variantes/tamanhos listados correspondem ao componente UI? |

### Guidelines por stack (`11-documentacao-componentes.md`)

| O que verificar |
|----------------|
| Padrão de import bate com o código? |
| Padrão de iteração (React map, Vue v-for, Svelte #each, Basecoat .map().join('')) está correto? |
| Exemplos de código de referência estão atualizados? |

---

## Padrões que Mudam com Frequência

Estes são os pontos que mais divergem entre código e guidelines. Verifique com atenção especial:

1. **Classes de tipografia em `<td>`** — tendência a acumular classes explícitas que deveriam herdar do `<table>`
2. **Tamanho de badges** — `text-[9px]`, `text-[10px]`, `text-[11px]` mudam conforme feedback visual
3. **Heading levels** — `h3` vs `h4` em sub-seções
4. **Uppercase em tags** — pode ser adicionado/removido por feedback de design
5. **Wrapper de tabela** — classes de border, padding, shadow podem mudar
6. **Seções novas** — analytics, testes, tokens podem ganhar sub-seções que a guideline não cobre

---

## Saída Esperada

### Modo `--from-content`

```
## Sincronização Conteúdo → Guidelines — {slug}

### Inventário de seções
| Seção | translations.json | Guideline 08 | Guideline 11 (stack) | Ação |
|-------|-------------------|--------------|---------------------|------|
| anatomy | ✅ 3 items | ✅ §8 | ✅ | — |
| usage.scenarios | ✅ 5 cenários | ❌ | ❌ | Adicionar padrão |
| testes | ✅ 6+6+7 items | ✅ §9 | ✅ | — |

### Validação do conteúdo
| Check | Status |
|-------|--------|
| Variantes match componente UI | ✅/❌ |
| Props match componente UI | ✅/❌ |
| 3 idiomas completos | ✅/❌ |
| SEO dentro dos limites | ✅/❌ |

### Guidelines atualizadas: X
- design-system-react/guidelines/11-documentacao-componentes.md (seção {slug})
- docs/shared/guidelines/08-docs-pages-foundations.md (§N — novo padrão)

### Pronto para dev skills: ✅/❌
(Se ❌, listar o que precisa ser resolvido antes)
```

### Modo `--from-code` (com `--dry-run`)

```
## Relatório de Sincronização — {slug}

### Discrepâncias: X

| # | Guideline | Seção | Status | Detalhe |
|---|-----------|-------|--------|---------|
| 1 | 08 §11 | Size cards | ⚠️ Desatualizado | Diz text-[10px], código usa text-[11px] |
| 2 | 08 §12 | Props td | ⚠️ Desatualizado | Diz text-xs no td, código herda do table |

### Guidelines atualizadas: 0 (dry-run)
```

### Modo `--from-code` (execução normal)

```
## Relatório de Sincronização — {slug}

### Discrepâncias encontradas e corrigidas: X

| # | Guideline | Seção | Antes | Depois |
|---|-----------|-------|-------|--------|
| 1 | 08 §11 | Size cards nome | text-[10px] | text-[11px] |
| 2 | 08 §12 | Props td type | text-[10px] explícito | herda text-sm do table |

### Guidelines atualizadas:
- docs/shared/guidelines/08-docs-pages-foundations.md (§11, §12, §13)
- design-system-react/guidelines/11-documentacao-componentes.md

### Verificação pós-atualização:
- [ ] Nenhuma guideline referencia classes que não existem no código
- [ ] Blocos de código de referência compilam mentalmente
- [ ] Numeração de seções preservada
```

---

## Regras Absolutas

- **Modo `--from-code`: o código é a fonte de verdade.** Se houver conflito, a guideline muda — nunca o código.
- **Modo `--from-content`: o translations.json é a fonte de verdade para conteúdo e estrutura.** As guidelines absorvem as decisões do ux-writer para que as skills de dev as sigam.
- **Nunca invente padrões.** Documente apenas o que está implementado (from-code) ou decidido pelo conteúdo (from-content).
- **Preserve a estrutura.** Não renumere seções, não delete seções inteiras, não mude o escopo de uma seção.
- **Atualize exemplos de código.** Se a classe mudou, o bloco de referência no markdown também muda.
- **Uma guideline por preocupação.** Se a discrepância revela uma regra nova (ex: "td herda font do table"), adicione a regra na seção mais relevante — não crie uma seção nova desnecessária.
- **Modo `--from-content` nunca altera padrões visuais** (classes CSS, cores, tipografia) — esses só mudam via `--from-code` após implementação.
- **Rode `/quality {slug}` depois.** A skill de qualidade valida se o código atende às guidelines — após a sync, as duas devem convergir.

---

## Commit de Rastreabilidade

Ao finalizar todas as alterações, execute:

```bash
git add -A
git commit -m "skill(product): $ARGUMENTS"
```

Se nenhum arquivo foi modificado (ex: tudo já estava correto ou modo `--dry-run`), não faça commit.
