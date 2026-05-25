---
description: Pipeline de qualidade — descobre componentes em components/ui e executa as skills na sequência correta, com paralelismo e cache de contexto
argument-hint: [component-slug|all] [mode]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Pipeline de Qualidade

Você é o orquestrador do design system. Seu trabalho é descobrir componentes e executar as skills especializadas na sequência certa, **paralelizando etapas independentes** e **evitando leituras redundantes**.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (opcional) — slug específico (ex: `button`) ou `all` para todos (padrão: `all`)
- **`mode`** (opcional):
  - `new` — componente novo: dev + content + quality + audit
  - `full` — igual a `new`, mas pula dev-skills de stacks que já existem e pula ux-writer se `translations.json` já existe (padrão)
  - `audit` — apenas auditoria (scripts + agents com julgamento), sem criar arquivos
  - `content` — apenas conteúdo: ux-writer + seo-geo + analytics

---

## Princípios (ordem de impacto)

1. **Scripts antes de agents.** `scripts/audit.mjs` roda em <1s e cobre tudo que é grep+regex determinístico. Dispare um `Agent` apenas quando o check exige julgamento (contexto visual, UX writing, divergência de API).
2. **Inline checks nos dev-skills.** Cada `/dev-<stack>` roda `audit.mjs --category security,performance,analytics,quality` antes de commitar — elimina ~1 rodada inteira de auditoria em modo `new`.
3. **Cross-stack por último.** Compara as 4 implementações pós-fix; rodá-lo antes gera cascata redundante.
4. **Paralelize entre skills, serial entre componentes.** Dev-skills das 4 stacks e os auditores por componente são independentes — batch paralelo de `Agent`. Serial entre componentes evita colisão de commits.
5. **Context-cache por componente.** `.pipeline-context/<slug>.md` ≤120 linhas com variantes, props, tokens, lista de arquivos. Reuse se for do mesmo dia.
6. **Audit-mode é report-only.** Agents chamados pela pipeline em `audit` reportam; fixes vão para `FIXES-NEEDED.md`. Skills isoladas (`/quality` fora de pipeline) continuam em fix-mode.
7. **Glob e Grep nativos, não loops bash.** No Windows loops são lentos; tools do Claude já varrem em paralelo.
8. **Prompts auto-contidos.** Passe slug, modo, caminho do context-cache, lista exata de arquivos. Nunca delegue "descubra o que fazer".
9. **Nunca pule uma skill sem registrar.** Script limpo → registre `script-clean, agent skipped`. Erro em uma skill não bloqueia as próximas da mesma fase.
10. **Mostre progresso fase a fase.** `✓ Fase B concluída (4 stacks paralelas, 3 min)`.

---

## Passo 1 — Descobrir Componentes

### Se `component-slug` for `all` ou omitido:

Dispare 4 `Glob` em paralelo no mesmo turno:

- `design-system-react/src/components/ui/*.tsx`
- `design-system-vue/src/components/ui/*/index.ts`
- `design-system-svelte/src/components/ui/*/index.ts`
- `nortear-design-system/src/components/ui/*.ts`

Extraia basename, filtre `*.stories.*` e sufixos de variação (`-variantes`, `-tamanhos`, `-estados`, `-composicoes`, `-modos`, `-layouts`), intersecte com os demais.

**Slugs a ignorar**: `index`, `utils`, `cn`, `icons`

### Se `component-slug` for um slug específico: pule a descoberta.

---

## Passo 2 — Verificar Estado Atual

Dispare estes `Glob` em paralelo (um por stack × tipo):

```
design-system-react/src/components/ui/<slug>*
design-system-react/src/components/docs/*<Slug>Docs.*
design-system-react/src/components/ui/<slug>*.stories.*

design-system-vue/src/components/ui/<slug>/*
design-system-vue/src/components/docs/*<Slug>Docs.*
design-system-vue/src/components/ui/<slug>/<slug>*.stories.*

design-system-svelte/src/components/ui/<slug>/*
design-system-svelte/src/components/docs/*<Slug>Docs.*
design-system-svelte/src/components/ui/<slug>/<slug>*.stories.*

nortear-design-system/src/components/ui/<slug>*
nortear-design-system/src/components/docs/*<Slug>Docs.*
nortear-design-system/src/components/ui/<slug>*.stories.*

docs/shared/content/<slug>/translations.json
```

Derive o estado: completo / falta X stack / sem translations / sem docs page.

---

## Passo 3 — Plano de Execução

Tabela com o plano. Se o usuário já disse "pode seguir" / "execute tudo", não pergunte — siga direto.

```
## Plano de Execução — Pipeline <mode>

| Componente | Estado | Skills a executar |
```

---

## Passo 4 — Audit Determinístico (script)

Antes de qualquer agent:

```bash
node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json
# ou para todos:
node scripts/audit.mjs --all --json > .pipeline-context/scans.json
```

Categorias cobertas:
- **security**: HTML dinâmico sem sanitize, href sem validação
- **performance**: wildcard lucide imports, dimensões hardcoded em cva, top-level Date em stories
- **quality**: seções obrigatórias faltando, a11y.disable, sub-stories sem play
- **analytics**: eventos não tipados em AnalyticsEvents, `@/lib/analytics` importado em UI primitive

Exit codes: 0 = limpo, 1 = high, 2 = medium/low.

**Regra de ouro**: categoria vazia no scan → NÃO dispare o agent dessa categoria. Reporte `script-clean, agent skipped`.

---

## Passo 5 — Executar Skills

### Sequência `new`

```
Fase A (serial):
  1. /ux-writer <slug>
  2. Escrever .pipeline-context/<slug>.md (slug, categoria, variantes, props, tokens, lista de arquivos das 4 stacks)
  3. node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json

Fase B (4 agents em PARALELO — dev-skills):
  /dev-react <slug>
  /dev-vue <slug>
  /dev-svelte <slug>
  /dev-basecoat <slug>

Fase C (serial):
  node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json  (re-scan pós-dev)

Fase D (até 5 agents em PARALELO — só se scan reportou violações na categoria):
  /security <slug>     (só se scan.security.length > 0)
  /performance <slug>  (só se scan.performance.length > 0)
  /quality <slug>      (só se scan.quality.length > 0)
  /seo-geo <slug>      (sempre)
  /analytics <slug>    (só se scan.analytics.length > 0)

Fase E (1 agent — último):
  /cross-stack <slug>  (sempre — compara estado pós-fix)

Fase F (serial):
  Consolidar FIXES-NEEDED.md
```

### Sequência `full`

Igual a `new`, com duas diferenças:
- Fase A: pula `/ux-writer` se `translations.json` já existe
- Fase B: pula `/dev-<stack>` se a stack já tem docs page + stories completas

### Sequência `audit`

```
Fase A (serial):
  1. node scripts/audit.mjs --all --json > .pipeline-context/scans.json
  2. Gerar/reusar .pipeline-context/<slug>.md para cada componente

Fase B (serial entre componentes, paralelo entre skills):
  Para cada <slug>:
    /security | /performance | /quality | /analytics (só se scan reportou)
    /seo-geo  (sempre)

Fase C:
  /cross-stack <slug>  (por último)

Fase D:
  Consolidar FIXES-NEEDED.md
  > N violações em X componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?
```

### Sequência `content`

```
Fase A: /ux-writer <slug>
Fase B (paralelo): /seo-geo <slug>, /analytics <slug>
```

---

## Prompts dos Dev-Agents

Cada dev-agent recebe prompt auto-contido com:

1. Skill a invocar (`/dev-react <slug>`)
2. `Leia .pipeline-context/<slug>.md PRIMEIRO` — contém variantes, props, tokens e lista de arquivos
3. **Inline audit check antes de commit:**

```
ANTES DE COMMITAR, rode:
  node scripts/audit.mjs <slug> --category security,performance,analytics,quality --json

Para cada violação da sua stack, corrija ANTES do commit. Se não puder corrigir
(ex: exige mudar o UI primitive), inclua no commit message: "ciência: <rule> em <file> — <motivo>".
```

4. Lista exata dos arquivos a produzir
5. Commit: `skill(dev-<stack>): <slug>`

**Não use `isolation: "worktree"`** — os 4 agents precisam do mesmo repo.

---

## Prompts dos Audit-Agents (report-only)

Cada audit-agent recebe:

1. Skill a invocar (`/security <slug>`, `/cross-stack <slug>`, etc.)
2. Conteúdo de `.pipeline-context/scan-<slug>.json` — o que o script já detectou
3. Conteúdo de `.pipeline-context/<slug>.md` — contexto do componente
4. Instrução:

```
Você é chamado pelo pipeline em MODO AUDIT (report-only). O script determinístico
já rodou — seu trabalho é cobrir o que o script NÃO pega (julgamento, contexto,
consistência visual, UX writing).

NÃO re-detecte o que o script já encontrou. Foque em:
- <listar áreas específicas da skill que exigem olho humano>

NÃO edite, NÃO commite. Reporte em ≤150 palavras:
- Violações novas (não listadas no scan)
- Score /10
- Arquivo:linha das violações
```

**Cross-stack prompt adicional** (é o último agent — compara estado pós-fix):

```
O script já verificou: classes cva(), variantes disponíveis, tokens CSS.
Foque em: comportamento interativo cross-stack, atributos ARIA que diferem entre
libs (base-ui vs reka-ui vs bits-ui), divergências de docs page (seções presentes
num stack e ausentes em outro), play functions com comportamentos diferentes.

Reporte divergências aceitáveis (diferenças idiomáticas entre libs) separadas
de divergências reais que exigem alinhamento.
```

---

## Passo 6 — Relatório + FIXES-NEEDED.md

### Relatório (chat)

```
## Relatório Pipeline — <mode> — <data>

### Componentes Processados: X

| Componente | Script scan | Fase B dev | Fase D audits | Fase E cross-stack |
|------------|-------------|------------|---------------|--------------------|
| calendar   | 4 high, 3 low | ✓ 4 stacks | 2 agents disparados | 1 divergência |
```

### FIXES-NEEDED.md

Agrupa apenas violações reportadas por agents (as determinísticas já foram corrigidas inline):

```md
# Fixes Pendentes — Pipeline <mode> <data>

## Críticos
- [ ] <slug>: <descrição> (`file.tsx:42`) — skill: `/security <slug>`

## Médios
...

## Baixos
...
```

Ao fim: **"N violações em X componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?"**

**Commits**: fase A/B geram commits próprios (`skill(ux-writer): <slug>`, `skill(dev-react): <slug>`); fase F agrupa fixes em batches (`fix(<slug>): <resumo do batch>`).
