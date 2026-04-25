---
description: Pipeline de qualidade — descobre componentes em components/ui e executa as skills na sequência correta, com paralelismo e cache de contexto
argument-hint: [component-slug|all] [mode]
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent]
---

# Pipeline de Qualidade (otimizada v2)

Você é o orquestrador do design system. Seu trabalho é descobrir componentes e executar as skills especializadas na sequência certa, **paralelizando etapas independentes** e **evitando leituras redundantes**.

## Argumentos

O usuário invocou o comando com: **$ARGUMENTS**

- **`component-slug`** (opcional) — slug específico (ex: `button`) ou `all` para todos os componentes (padrão: `all`)
- **`mode`** (opcional):
  - `full` — pipeline completo: dev → content → quality → audit (padrão)
  - `audit` — apenas auditoria (scripts + agents com julgamento)
  - `content` — apenas conteúdo: ux-writer + seo-geo + analytics
  - `new` — componente novo: dev + content + quality + audit

---

## Princípios (ordem de impacto)

1. **Scripts antes de agents.** Tudo que é grep+regex determinístico vive em `scripts/audit.mjs` e roda em <1s para todos os componentes do projeto. Só escale para um `Agent` quando o check exige julgamento (contexto visual, UX writing, divergência de API entre stacks).
2. **Inline checks nos dev-skills.** Antes de commitar, cada `/dev-<stack>` roda `node scripts/audit.mjs <slug> --category security` (e equivalentes) e corrige localmente o que for determinístico. Isso elimina ~1 rodada inteira de auditoria em modo `new`.
3. **Cross-stack por último.** Ele compara as 4 implementações entre si — rodar depois dos outros 5 auditores faz com que reporte apenas divergências **pós-fix**, não cascata redundante.
4. **Paralelize entre skills, serial entre componentes.** Dev-skills das 4 stacks e os auditores por componente são independentes — batch paralelo de `Agent`. Serial entre componentes evita colisão de commits no git.
5. **Context-cache por componente.** `.pipeline-context/<slug>.md` com subset relevante (variantes, props, tokens, lista de arquivos). Agents leem só esse resumo. Reuse se for do mesmo dia.
6. **Audit-mode é report-only.** Agents chamados pela pipeline em `audit` reportam; fixes vão para `FIXES-NEEDED.md` e rodam em batch com aprovação do usuário. Skills isoladas (`/quality` fora de pipeline) continuam fix-mode.
7. **Glob e Grep nativos, não loops bash.** No Windows loops são lentos e difíceis de parsear; tools do Claude já varrem em paralelo.
8. **Prompts auto-contidos.** Passe slug, modo, caminho do context-cache, lista exata de arquivos. Não delegue "descubra o que fazer".

---

## Passo 1 — Descobrir Componentes

### Se `component-slug` for `all` ou omitido:

Use `Glob` (não loops bash) para descobrir os slugs. Um `Glob` por stack:

- `design-system-react/src/components/ui/*.tsx`
- `design-system-vue/src/components/ui/*/index.ts`
- `design-system-svelte/src/components/ui/*/index.ts`
- `design-system-basecoat/src/components/ui/*.ts`

Os 4 `Glob` em paralelo no mesmo turno. Extraia basename, filtre `*.stories.*` e sufixos de variação (`-variantes`, `-tamanhos`, `-estados`, `-composicoes`, `-modos`, `-layouts`, `-composicoes`), e intersecte com os demais.

**Slugs a ignorar**: `index`, `utils`, `cn`, `icons`

### Se `component-slug` for um slug específico: pule a descoberta.

---

## Passo 2 — Verificar Estado Atual

Um único batch de `Glob` para cada slug (paralelo):

- `design-system-{react,vue,svelte,basecoat}/src/components/ui/<slug>*`
- `design-system-{react,vue,svelte,basecoat}/src/components/docs/*<Slug>Docs.*`
- `design-system-{react,vue,svelte,basecoat}/src/components/ui/<slug>*.stories.*` (e `<slug>/<slug>-*.stories.*` para Vue/Svelte)
- `docs/shared/content/<slug>/translations.json`

Derive o estado (completo / falta X stack / sem translations / sem docs page).

---

## Passo 3 — Plano de Execução

Tabela com o plano. Se o usuário já disse "pode seguir" / "execute tudo" na mensagem atual, não pergunte — siga direto.

```
## Plano de Execução — Pipeline <mode>

| Componente | Estado | Skills a executar |
```

---

## Passo 4 — Audit determinístico (script)

Antes de qualquer agent, rode:

```bash
node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json
# ou para todos:
node scripts/audit.mjs --all --json > .pipeline-context/scans.json
```

O script cobre:
- **security**: HTML dinâmico sem sanitize, href sem validação
- **performance**: wildcard lucide imports, dimensões hardcoded em cva, onUnmounted aninhado, top-level Date em stories
- **quality**: seções obrigatórias faltando, a11y.disable, sub-stories sem play
- **analytics**: eventos de translations não tipados em AnalyticsEvents, `@/lib/analytics` importado em UI primitive

Exit codes: 0 = limpo, 1 = high violations, 2 = medium/low.

**Regra de ouro**: se `scan-<slug>.json` está vazio para uma categoria, **NÃO dispare o agent dessa categoria**. Reporte `10/10 — script limpo, agente pulado`. Os agents ficam só com o que exige julgamento (UX writing, consistência visual cross-stack, decisões de API).

---

## Passo 5 — Context cache (modos `new` / `full` / `audit`)

Depois de rodar `/ux-writer` ou antes de disparar auditores (em `audit`), escreva `.pipeline-context/<slug>.md` com:

- Slug, categoria
- Variantes/tamanhos (do componente UI)
- Props e tipos (do componente UI)
- Tokens CSS
- Seções especiais da guideline 11 da categoria
- Chaves críticas de `translations.json`
- **Lista de arquivos das 4 stacks** (para os prompts)

Tipicamente ≤120 linhas. Reuse se for do mesmo dia.

---

## Passo 6 — Executar Skills

### Sequência `new`

```
Fase A (serial):
  1. /ux-writer <slug>
  3. Gerar .pipeline-context/<slug>.md (Passo 5)
  4. node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json

Fase B (4 agents em PARALELO — dev-skills):
  /dev-react <slug>     ← antes de commitar, roda audit.mjs --category security,performance,analytics,quality
  /dev-vue <slug>       ← idem
  /dev-svelte <slug>    ← idem
  /dev-basecoat <slug>  ← idem

Fase C (serial):
  node scripts/audit.mjs <slug> --json > .pipeline-context/scan-<slug>.json (re-scan pós-dev)

Fase D (até 5 agents em PARALELO — apenas se o script reportou violações na categoria):
  /security <slug>     (só se scan.security[].length > 0)
  /performance <slug>  (só se scan.performance[].length > 0)
  /quality <slug>      (só se scan.quality[].length > 0)
  /seo-geo <slug>      (sempre — depende de content, não de scripts)
  /analytics <slug>    (só se scan.analytics[].length > 0)

Fase E (1 agent — último, compara pós-fix):
  /cross-stack <slug>  (sempre — agora compara estado pós-fix)

Fase F (serial):
  Consolidar FIXES-NEEDED.md se restaram violações que precisam julgamento
```

### Sequência `audit`

```
Fase A (serial, 1x):
  1. node scripts/audit.mjs --all --json > .pipeline-context/scans.json
  2. Gerar/reusar .pipeline-context/<slug>.md para cada componente

Fase B (serial entre componentes, paralelo entre skills — pular categorias limpas):
  Para cada <slug>:
    Disparar N agents em paralelo (N = número de categorias com violações não-triviais + seo-geo):
      /security | /performance | /quality | /analytics (só se scan reportou)
      /seo-geo  (sempre)

Fase C (1 agent):
  /cross-stack <slug>  (por último, compara pós-agents)

Fase D (serial):
  Consolidar FIXES-NEEDED.md. Perguntar ao usuário:
  > N violações em X componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?
```

### Sequência `full`

```
Fase A (se translations ausente): /ux-writer + context-cache
Fase B (dev-skills, só stacks ausentes): /dev-<stack> com inline checks
Fase C: node scripts/audit.mjs <slug> pós-dev
Fase D (agents paralelos, só categorias com violações): security, performance, quality, seo-geo, analytics
Fase E: /cross-stack (por último)
Fase F: consolidar FIXES-NEEDED
```

### Sequência `content`

```
Fase A: /ux-writer
Fase B (paralelo): /seo-geo, /analytics
```

---

## Prompts dos dev-agents

Cada dev-agent recebe prompt auto-contido com:

1. Skill a invocar (`/dev-react <slug>`)
2. Caminho do context-cache: `.pipeline-context/<slug>.md` (ler PRIMEIRO)
3. **Regras anti-boilerplate** (copie literalmente):

```
REGRAS ANTI-BOILERPLATE:
- Apenas o meta principal (`<slug>.stories.*`) carrega `tags: ["autodocs"]`. Sub-stories NUNCA.
- Docs page principal via `parameters: { docs: { page: withAutoDocsTab(<Slug>Docs) } }` — só no arquivo principal.
- Sub-stories têm apenas `title`, `component`, `parameters.layout`, `parameters.docs.description.component`.
- Use componentes reais de `./components/ui/` em previews — nunca HTML inline.
- Use APENAS section containers de `@/components/docs/shared/sections` — zero JSX de seção inline.
```

4. **Inline audit check antes de commit** (copie literalmente):

```
ANTES DE COMMITAR, rode:
  node scripts/audit.mjs <slug> --category security --json
  node scripts/audit.mjs <slug> --category performance --json
  node scripts/audit.mjs <slug> --category analytics --json
  node scripts/audit.mjs <slug> --category quality --json

Para cada violação da sua stack, corrija ANTES do commit. Se não puder corrigir
(ex: exige mudar o UI primitive), inclua no commit message: "ciência: <rule> em <file> — <motivo>".
```

5. Lista exata dos arquivos a produzir.
6. Commit: `skill(dev-<stack>): <slug>`.

**Não coloque `isolation: "worktree"`** — os 4 agents precisam do mesmo repo.

---

## Prompts dos audit-agents (report-only)

Cada audit-agent recebe:

1. Skill a invocar (`/security <slug>`, `/cross-stack <slug>`, etc.)
2. `cat .pipeline-context/scan-<slug>.json` para ver o que o script já detectou
3. `cat .pipeline-context/<slug>.md` para o contexto
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

**Cross-stack prompt adicional** (é o último agent):

```
Você compara as 4 implementações PÓS-FIX. Os outros auditores já rodaram e
corrigiram o que puderam. Reporte apenas:
- Divergências de API aceitáveis (diferenças idiomáticas entre libs)
- Divergências reais que exigem alinhamento (classes Tailwind diferentes para
  o mesmo efeito, comportamentos diferentes em play functions)
- Decisões que precisam de julgamento humano (ex: qual lib adotar como fonte
  de verdade quando a API diverge muito)
```

---

## Passo 7 — Relatório + FIXES-NEEDED.md

### 7a. Relatório (chat)

```
## Relatório Pipeline — <mode> — <data>

### Componentes Processados: X

| Componente | Script scan | Fase B dev | Fase D audits | Fase E cross-stack |
|------------|-------------|------------|---------------|--------------------|
| calendar   | 4 high, 3 low | ✓ 4 stacks | 2 agents disparados | 1 divergência |
```

### 7b. FIXES-NEEDED.md

Agrupa violações reportadas por agents (não pelos scripts — esses já foram aplicados inline) organizadas por severidade:

```md
# Fixes Pendentes — Pipeline <mode> <data>

## Críticos
- [ ] <slug>: <descrição> (`file.tsx:42`) — skill: `/security <slug>`

## Médios
...

## Baixos
...
```

Ao fim, pergunte: **"N violações em X componentes. Aplicar: [1] críticos / [2] críticos+médios / [3] todos / [4] nenhum?"**

---

## Regras de Operação

- **Scripts antes de agents.** Sempre rode `node scripts/audit.mjs` primeiro. Se não há violação na categoria, pule o agent inteiro.
- **Cross-stack é sempre o último auditor.** Ele compara estado pós-fix, não pré.
- **Nunca pule uma skill sem registrar o motivo.** Se o script está limpo, registre `script-clean, agent skipped`.
- **Paralelize Fases B, D sempre que possível.** Emita múltiplos `Agent` no mesmo turno.
- **Cache de contexto obrigatório em `new` e `full`.**
- **Anti-boilerplate no prompt dos dev-agents.** A regra de `autodocs` só no meta principal é a mais importante.
- **Erros em uma skill** não bloqueiam as próximas da mesma fase — registre e continue.
- **Mostre progresso fase a fase:** `✓ Fase B concluída (4 stacks paralelas, 3 min)`.
- **Audit-mode ≠ fix-mode.** Agents em `audit` são report-only. Skills isoladas (`/quality <slug>`) fora do pipeline continuam em fix-mode.
- **FIXES-NEEDED.md agrupa só violações pós-script.** As violações determinísticas já foram corrigidas inline pelos dev-agents.
- **Commits**: fase A/B geram commits próprios (`skill(ux-writer): <slug>`, `skill(dev-react): <slug>`); fase F agrupa fixes em batches (`fix(<slug>): <resumo do batch>`).
